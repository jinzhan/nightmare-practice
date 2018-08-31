require('babel-register');
require('babel-polyfill');
const util = require('./main');
const method = process.argv[2];

if (!method || !util[method]) {
    console.log('js run fail, method is not exist.');
    process.exit();
}
util[method]();
console.log('js run successfully.');