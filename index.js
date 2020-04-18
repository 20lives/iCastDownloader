#!/usr/bin/env node

import inquirer from 'inquirer';
import fetch from 'node-fetch';
import fs from 'fs';
import progress from 'progress';

import prompts from './prompts.js';
import icast from './icastApi.js';

function saveChapter( filePath, bookData, i, total, chapterName) {
  const { Name, WriterName } = bookData;

  const dir = `./${Name} - ${WriterName}`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const destPath = `${dir}/ ${i + 1}. ${chapterName}.mp3`;

  return fetch(filePath).then((data) => {
    const bar = new progress( `[:bar] (${i + 1}/${total}): ${chapterName}`, {
      complete: '=',
      incomplete: ' ',
      width: 30,
      total: Number(data.headers.get('content-length')),
    });

    data.body.pipe(fs.createWriteStream(destPath));
    data.body.on('data', (chunk) => bar.tick(chunk.length));
    return new Promise((resolve) => data.body.on('end', resolve));
  });
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
    await saveChapter(filePath, BookID, i, chaptersCount, ChapterName);
  }
})();
