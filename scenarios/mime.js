#!/usr/bin/env node
import assert from 'assert';
import mime from '../lib/mime.js';
const startTime = new Date().getTime();

const color = {
	GREEN: '\u001b[32m',
	RESET: '\u001b[0m'
};

let m = mime('file.XML');
assert.strictEqual(m, 'text/xml');
m = mime('file'); // no extension, default json
assert.strictEqual(m, 'application/json; charset=utf-8');
// @ts-ignore
m = mime(); // no parameter
assert.strictEqual(m, 'application/octet-stream');
m = mime('a.JSON'); // capital json
assert.strictEqual(m, 'application/json; charset=utf-8');
m = mime('a.js'); 
assert.strictEqual(m, 'text/javascript; charset=utf-8');
m = mime('/data/flow-service/files/72a/bb12443b46f20553c945bda842580.xml');
assert.strictEqual(m, 'text/xml');

let endTime = new Date().getTime();
console.log(color.GREEN + 'Succesfull finished in: ' + (endTime - startTime) + ' ms' + color.RESET);
process.exit();
