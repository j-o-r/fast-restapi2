#!/usr/bin/env node
import { openAsBlob } from 'node:fs' // Node.JS ^19.8
import path from 'path';
import fs from 'fs';

let resOb;
const form = new FormData();
const f1 = path.resolve('./scenarios', 'www', 'large.png');
const f2 = path.resolve('./scenarios', 'www', 'test.json');
const file = await openAsBlob(f1);
const file2 = await openAsBlob(f2);
form.append('my_field', 'my value');
form.append('my_field2', 'second');
form.set('my_file2', file, 'large.png');
form.set('json_file', file2, 'test.json');
// form.append('my_file2', fs.createReadStream(f1));
const requestOptions = {
	method: 'POST',
	body: form
};
const result = await fetch('http://127.0.0.1:8080/testcontroller/form', requestOptions);
console.log(result.status);
console.log(await result.text())

process.stdin.resume();
