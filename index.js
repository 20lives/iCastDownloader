#!/usr/bin/env node

import fetch from 'node-fetch';
import inquirer from 'inquirer';
import fs from 'fs';

import prompts from './prompts.js';
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

(async function Run() {
  const loginPromptRes = await inquirer.prompt(prompts.login);
  const { email, password } = loginPromptRes;
  const loginRes = await icast.login(email, password);
  const { success } = loginRes;

  if (!success) {
    console.log(`Login failed: ${loginRes.details}`);
    return;
  }

  let searchBookRes = [];
  while (searchBookRes.length < 1) {
    const searchBookPromptRes = await inquirer.prompt(prompts.searchBook);
    const { query } = searchBookPromptRes;
    searchBookRes = await icast.search(query);

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

  const selectBookPromptRes = await inquirer.prompt(prompts.selectBook(list));

  const { BookID } = selectBookPromptRes;

  const chaptersRes = await icast.listChapters(BookID.ProductID);

  const chaptersCount = chaptersRes.length;

  for (const [i, { ChapterID, ChapterName }] of chaptersRes.entries()) {
    const filePath = await icast.getChapterAudioFilePath(ChapterID);
    console.log(`Downloading (${i + 1}/${chaptersCount}): ${ChapterName}`);
    saveChapter(filePath, BookID, i, ChapterName);
  }
})();
