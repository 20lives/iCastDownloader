import fetch from 'node-fetch';
import xml2js from 'xml2js';

const baseUrl = 'http://mobile.icast.co.il/';

function createParamsString(obj) {
  const params = new URLSearchParams();
  for(const key in obj) {
    params.append(key, obj[key]);
  }
  return params;
}

function parseXmlObject(obj) {
  const arr = obj.plist.array[0].dict;

  return arr.map(item => {
    const {key, string} = item;
    const res = {};
    for (let i = 0; i < key.length ; i++) {
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

const params = {
  DeviceType: 1,
  Email: '',
  ApplicationVersion: '1.6.1.34.1',
  Pass: '',
};

(async function Run() {
  const a = await sendRequest('BookUserLogin.aspx', params);
  console.log(a);
})();
