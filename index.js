#!/usr/bin/env node

import fetch from 'node-fetch';
import xml2js from 'xml2js';
import inquirer from 'inquirer';
import fs from 'fs';

const baseUrl = 'http://mobile.icast.co.il/';

function parseXmlObject(obj) {
  const arr = obj.plist.array[0].dict;

  return arr.map((item) => {
    const { key, string } = item;
    const res = {};
    for (let i = 0; i < key.length; i++) {
      res[key[i]] = string[i];
    }
    return res;
  });
}

async function sendRequest(page, params) {
  const options = {
    method: 'POST',
    body: new URLSearchParams(params),
  };

  const url = `${baseUrl}${page}`;
  const res = await fetch(url, options);
  const xmlStr = await res.text();
  const json = await xml2js.parseStringPromise(xmlStr);
  const obj = parseXmlObject(json);
  return obj;
}

async function login(email, password) {
  const requestPath = 'BookUserLogin.aspx';

  const params = {
    Email: email,
    Pass: password,
    UUID: 'unknown',
  };

  const res = await sendRequest(requestPath, params);

  return res[0];
}

async function search(query) {
  const requestPath = 'BookSearch.aspx';

  const params = {
    DeviceType: 4,
    SortDir: 0,
    PageNum: 0,
    UserID: 1,
    SortCode: 1,
    SearchText: query,
  };

  return await sendRequest(requestPath, params);
}

async function listChapters(BookID, UserID, Token) {
  const requestPath = 'BookGetChapters.aspx';
  let chapters = [];

  const params = {
    DeviceType: 4,
    UID: UserID,
    BookID,
    PageNum: 0,
    UserID,
    DEVICEUUID: 'unknown',
    Token,
  };

  let next = 1;

  while (next == 1) {
    const pageChapters = await sendRequest(requestPath, params);
    next = pageChapters.shift().isNextPage;
    pageChapters.pop();
    params.PageNum++;
    chapters = [...chapters, ...pageChapters];
  }
  return chapters;
}

async function getChapterAudioFilePath(ChapterID, UserID, Token) {
  const requestPath = 'BookGetChapterInfo.aspx';

  const params = {
    DeviceType: 4,
    UID: UserID,
    UserID: UserID,
    ChapterID,
    DEVICEUUID: 'unknown',
    Token,
  };

  const extra = `&uid=${UserID}&deviceuuid=unknown&token=${Token}`;
  const res = await sendRequest(requestPath, params);
  return res[0].FileName + extra;
}

async function saveChapter(filePath, bookData, chapterID, chapterName) {
  const { Name, WriterName } = bookData;

  const dir = `./${Name} - ${WriterName}`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const destPath = `${dir}/ ${chapterID + 1}. ${chapterName}.mp3`;

  const data = await fetch(filePath);
  await data.body.pipe(fs.createWriteStream(destPath));
}

const loginPrompt = [
  {
    type: 'input',
    name: 'email',
    message: 'Email address:',
  },
  {
    type: 'password',
    name: 'password',
    mask: '*',
    message: 'Password:',
  },
];

const searchBookPrompt = [
  {
    type: 'input',
    name: 'query',
    message: 'Search for an audiobook by a keyword:',
  },
];

const selectBookPrompt = (list) => [
  {
    type: 'list',
    name: 'BookID',
    message: 'Select a book form search results:',
    choices: list,
  },
];

(async function Run() {
  const loginPromptRes = await inquirer.prompt(loginPrompt);
  const { email, password } = loginPromptRes;
  const loginRes = await login(email, password);
  const { UserID, isSubscription, Token, Success } = loginRes;

  if (Success != '1') {
    console.log(`Login failed: ${loginRes.Description}`);
    return;
  }
  if (isSubscription != '1') {
    console.log('User has no active subscription.');
    return;
  }

  let searchBookRes = [];
  while (searchBookRes.length < 1) {
    const searchBookPromptRes = await inquirer.prompt(searchBookPrompt);
    const { query } = searchBookPromptRes;
    searchBookRes = await search(query);

    searchBookRes.shift();
    searchBookRes.pop();

    if (searchBookRes.length < 1) {
      console.log('No results found, try again.');
    }
  }

  const list = searchBookRes.map((book) => {
    const { Name, WriterName, WholeBookDuration, PublishYear } = book;
    return {
      name: `Title: ${Name}; Author: ${WriterName}; Year: ${PublishYear}; Duration: ${WholeBookDuration}`,
      value: book,
    };
  });

  const selectBookPromptRes = await inquirer.prompt(selectBookPrompt(list));

  const { BookID } = selectBookPromptRes;

  const chaptersRes = await listChapters(BookID.ProductID, UserID, Token);

  const chaptersCount = chaptersRes.length;

  for (const [i, { ChapterID, ChapterName }] of chaptersRes.entries()) {
    const filePath = await getChapterAudioFilePath(ChapterID, UserID, Token);
    console.log(`Downloading (${i + 1}/${chaptersCount}): ${ChapterName}`);
    saveChapter(filePath, BookID, i, ChapterName);
  }
})();
