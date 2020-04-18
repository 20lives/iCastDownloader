#!/usr/bin/env node

import fetch from 'node-fetch';
import inquirer from 'inquirer';
import fs from 'fs';

import icast from './icastApi.js';

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
  const loginRes = await icast.login(email, password);
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
    searchBookRes = await icast.search(query);

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

  const chaptersRes = await icast.listChapters(BookID.ProductID, UserID, Token);

  const chaptersCount = chaptersRes.length;

  for (const [i, { ChapterID, ChapterName }] of chaptersRes.entries()) {
    const filePath = await getChapterAudioFilePath(ChapterID, UserID, Token);
    console.log(`Downloading (${i + 1}/${chaptersCount}): ${ChapterName}`);
    saveChapter(filePath, BookID, i, ChapterName);
  }
})();
