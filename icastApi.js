import fetch from 'node-fetch';
import xml2js from 'xml2js';

import constants from './constants.js';

export default {
  login,
  search,
  listChapters,
  getChapterAudioFilePath,
};

let token;
let userID;

function parseXmlObject(obj) {
  const arr = obj.plist.array[0].dict;
  return arr.map(({ key: keys, string: values }) => {
    return keys.reduce((obj, key, i) => ((obj[key] = values[i]), obj), {});
  });
}

function getUrl(key) {
  const { baseUrl, urls } = constants;
  return `${baseUrl}Book${urls[key]}.aspx`;
}

function getOptions(params) {
  return {
    method: 'POST',
    body: new URLSearchParams(params),
  };
}

function sendRequest(urlKey, params) {
  return fetch(getUrl(urlKey), getOptions(params))
    .then((res) => res.text())
    .then(xml2js.parseStringPromise)
    .then(parseXmlObject);
}

async function login(email, password) {
  const params = {
    Email: email,
    Pass: password,
    UUID: constants.uuid,
  };

  const res = await sendRequest('login', params).then((x) => x[0]);

  if (res.Success != '1') {
    return { sucess: false, details: res.Description };
  }

  if (res.isSubscription != '1') {
    return { sucess: false, details: 'User has no active subscription.' };
  }

  userID = res.UserID;
  token = res.Token;

  return { success: true };
}

async function search(query, page = 0) {
  const params = {
    DeviceType: 4,
    SortDir: 0,
    PageNum: page,
    UserID: 1,
    SortCode: 1,
    SearchText: query,
  };

  const results = await sendRequest('search', params);

  const stripped = results.slice(1, -1);
  return results[0].isNextPage == '1'
    ? [...stripped, ...(await search(query, page + 1))]
    : stripped;
}

async function listChapters(bookID, page = 0) {
  const params = {
    DeviceType: 4,
    UID: userID,
    BookID: bookID,
    PageNum: page,
    UserID: userID,
    DEVICEUUID: constants.uuid,
    Token: token,
  };

  const chapters = await sendRequest('chapters', params);

  const stripped = chapters.slice(1, -1);
  return chapters[0].isNextPage == '1'
    ? [...stripped, ...(await listChapters(bookID, page + 1))]
    : stripped;
}

function getChapterAudioFilePath(chapterID) {
  const params = {
    DeviceType: 4,
    UID: userID,
    UserID: userID,
    ChapterID: chapterID,
    DEVICEUUID: constants.uuid,
    Token: token,
  };

  const extra = `&uid=${userID}&deviceuuid=${constants.uuid}&token=${token}`;
  return sendRequest('chapterInfo', params).then((x) => x[0].FileName + extra);
}
