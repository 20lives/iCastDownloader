const login = [
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

const searchBook = [
  {
    type: 'input',
    name: 'query',
    message: 'Search for an audiobook by a keyword:',
  },
];

const selectBook = (list) => [
  {
    type: 'list',
    name: 'BookID',
    message: 'Select a book form search results:',
    choices: list,
  },
];

export default {
  login,
  searchBook,
  selectBook,
};
