import fetch from 'node-fetch';
import xml2js from 'xml2js';
import inquirer from 'inquirer';

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
  console.log(UserID, Token);
})();
