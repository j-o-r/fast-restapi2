#!/usr/bin/env node

import path from 'path';
import FormData from 'form-data';
import fs from 'fs';

var resOb;
var form = new FormData();
let f1 = path.resolve('./scenarios', 'www', 'large.png');
form.append('my_field', 'my value');
form.append('my_field2', 'second');
form.append('my_file2', fs.createReadStream(f1));
form.submit('http://192.168.250.178:9022/testcontroller/form', function (err, res) {
  let resData = '';
  // return true
  res.on('data', function (chunk) {
    resData = resData + chunk;
  });
  res.on('end', function () {
    // This is the way
    resData.trim();
    resOb = JSON.parse(resData);
    console.log(resOb);
    // fs.unlinkSync(resOb.UPLOADED_FORM_FILES[0].src);
  });
  res.on('error', function (e) {
    console.log('Got error: ' + e.message);
  });
});

process.stdin.resume();
/* eslint-enable no-console */
// vim: et:ts=2:sw=2:sts=2
