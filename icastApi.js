import fetch from 'node-fetch';
import xml2js from 'xml2js';

const baseUrl = 'http://mobile.icast.co.il/';

export default {
  login,
  search,
  listChapters,
  getChapterAudioFilePath,
}

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

async function listChapters(BookID) {
  const requestPath = 'BookGetChapters.aspx';
  let chapters = [];

  const params = {
    DeviceType: 4,
    UID: userID,
    BookID,
    PageNum: 0,
    UserID: userID,
    DEVICEUUID: 'unknown',
    Token: token,
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

async function getChapterAudioFilePath(ChapterID) {
  const requestPath = 'BookGetChapterInfo.aspx';

  const params = {
    DeviceType: 4,
    UID: userID,
    UserID: userID,
    ChapterID,
    DEVICEUUID: 'unknown',
    Token: token
    ,
  };

  const extra = `&uid=${userID}&deviceuuid=unknown&token=${token}`;
  const res = await sendRequest(requestPath, params);
  return res[0].FileName + extra;
}
