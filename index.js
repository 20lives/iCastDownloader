import fetch from 'node-fetch';
import xml2js from 'xml2js';

const body = {
  DeviceType: 1,
  Email: '',
  ApplicationVersion: '1.6.1.34.1',
  Pass: '',
};

const params = new URLSearchParams();
for(const key in body) {
  params.append(key, body[key]);
}

const options = {
  method: 'POST',
  body: params,
};

function parseXmlObject(obj) {
  const {key, string} = obj.plist.array[0].dict[0];
  const res = {};
  for (let i = 0; i < key.length ; i++) {
    res[key[i]] = string[i];
  }
  return res;
}

fetch('http://mobile.icast.co.il/BookUserLogin.aspx', options)
.then(res => res.text())
  .then(res => xml2js.parseStringPromise(res))
  .then(res => {
    const obj = parseXmlObject(res);
    console.table(JSON.stringify(obj));
  });
