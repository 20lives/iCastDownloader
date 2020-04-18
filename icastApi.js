import fetch from 'node-fetch';
import xml2js from 'xml2js';

const baseUrl = 'http://mobile.icast.co.il/';

export default {
  login,
  search,
  listChapters,
  getChapterAudioFilePath,
}

function parseXmlObject(obj) {
  const arr = obj.plist.array[0].dict;
  return arr.map(({ key: keys, string: values }) => {
    return keys.reduce((obj, key, i) => ((obj[key] = values[i]), obj), {});
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
