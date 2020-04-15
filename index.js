import fetch from 'node-fetch';
import xml2js from 'xml2js';

const baseUrl = 'http://mobile.icast.co.il/';

function createParamsString(obj) {
  const params = new URLSearchParams();
  for (const key in obj) {
    params.append(key, obj[key]);
  }
  return params;
}

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
    body: createParamsString(params),
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

(async function Run() {
  const email = '';
  const password = '';
  const res = login(email, password);
  console.log(res);
})();
