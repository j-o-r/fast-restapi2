#!/usr/bin/env node

import assert from 'assert';
import path from 'path';
import fs, { openAsBlob } from 'fs';
import TestController from './testController.js';
import request from './request.js';
import helper from './helper.js';
import server from '../lib/api-server.js';
const startTime = new Date().getTime();

const color = {
	GREEN: '\u001b[32m',
	RESET: '\u001b[0m'
};

assert.rejects(async () => {
	// @ts-ignore
	await server.create('v1', { host: '127.0.0.1' });
});
assert.rejects(async () => {
	// @ts-ignore
	await server.create('v1', { port: 8080 });
});

assert.rejects(async () => {
	// @ts-ignore
	await server.create('v1', { host: '127.0.0.1', port: 9080 });
});

// Start a server
assert.doesNotReject(async () => {
	// @ts-ignore
	await server.create('testcontroller', { port: 9022, host: '127.0.0.1' }, TestController);
});

// ------------------ Test the API --------------------
let res, hdr;
// Just some garbage
res = await request('http://127.0.0.1:9022/x03/x00/x00/*/xE0/x00/x00/x00/x00/x00Cookie:%20mstshash=Administr', 'GET');
assert.strictEqual(res.status, 404);
// test index
hdr = {};
hdr['Accept'] = 'application/xml';
res = await request('http://127.0.0.1:9022/testcontroller/index', 'GET', hdr);
assert.strictEqual(res.status, 200);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.response.joe[0], 'bar');
// get an error
hdr = {};
hdr['Accept'] = 'application/xml';
res = await request('http://127.0.0.1:9022/testcontroller/error', 'GET', hdr);
assert.strictEqual(res.status, 500);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.response, 'Error: an error');
// test  stream
hdr = {};
hdr['Accept'] = 'application/xml';
res = await request('http://127.0.0.1:9022/testcontroller/stream', 'GET', hdr);
assert.strictEqual(res.status, 200);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.response.test.length, 6);
// Stream with extension json
hdr = {};
hdr['Accept'] = 'application/xml';
res = await request('http://127.0.0.1:9022/testcontroller/stream.json', 'GET', hdr);
assert.strictEqual(res.status, 200);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.response.test.length, 6);

// stream with a 404
res = await request('http://127.0.0.1:9022/testcontroller/stream404', 'GET');
assert.strictEqual(res.status, 404);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.response.test.length, 0);

res = await request('http://127.0.0.1:9022/testcontroller/stream500', 'GET');
assert.strictEqual(res.status, 500);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.response.test.length, 1);

res = await request('http://127.0.0.1:9022/testcontroller/stream200', 'GET');
assert.strictEqual(res.status, 200);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.response.test.length, 3);

// 		// The extension doesn't change a thing
res = await request('http://127.0.0.1:9022/testcontroller/stream', 'GET');
assert.strictEqual(res.status, 200);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.response.test.length, 6);

res = await request('http://127.0.0.1:9022/testcontroller/whatisthis', 'GET');
assert.strictEqual(res.status, 404);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.response, 'Error: File not found');

// Test params
res = await request('http://127.0.0.1:9022/testcontroller/params/one/two/three.123', 'GET');
assert.strictEqual(res.status, 200);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.response.params.length, 3);

// Test query
res = await request('http://127.0.0.1:9022/testcontroller/query?space=%20&pipo=circus&this=10', 'GET');
assert.strictEqual(res.status, 200);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.response.query.pipo, 'circus');
assert.strictEqual(res.response.query.space, ' ');

// Test uncommon chars
var x = encodeURIComponent(escape('pipo/*13934589\/\' .what?#<>')) // eslint-disable-line
var y = encodeURIComponent(escape('??&&##.xml.json.whatever'));
res = await request('http://127.0.0.1:9022/testcontroller/params/one/' + x + '/' + y, 'GET');
assert.strictEqual(res.status, 200);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(x, res.response.params[1]);
assert.strictEqual(y, res.response.params[2]);
assert.strictEqual(res.response.params.length, 3);
console.log('@TODO: char encoding is not logical :Line 127')

// content types
res = await request('http://127.0.0.1:9022/testcontroller/contenttype', 'GET', hdr);
assert.strictEqual(res.status, 200);
assert.strictEqual(res.headers['content-type'], 'plain/text');
assert.strictEqual(res.response, 'i,am,plain,text');
var group = {
	name: 'test group 2',
	members: [100276, '1000676']
};
res = await request('http://127.0.0.1:9022/testcontroller/echo', 'POST', {}, group);
assert.strictEqual(res.status, 200);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.response.data.name, 'test group 2');

hdr = {};
group = {
	name: 'test group vnd',
	members: [100276, '1000676']
};
hdr['Accept'] = 'application/vnd.api+json';
res = await request('http://127.0.0.1:9022/testcontroller/echo', 'POST', hdr, group);
assert.strictEqual(res.status, 200);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.response.data.name, 'test group vnd');

// test misfomed JSON
group = {
	name: 'test group 444',
	members: [100276, '1000676']
};
const pst = helper.toJson(group);
pst.data = 'Break me' + pst.data + '}}';
// 		// The posted data is longer then the content length
// 		// The posted data is not valid JSON
let options = helper.getOptions('http://127.0.0.1:9022/testcontroller/echo', 'POST', pst.ct, pst.len);
options.headers['Accept'] = 'application/xml';
helper.createRequest(options, pst.data, function(_err, res) {
	// The socket SHOULD NOT EXIT, just a no mercy exit on the client
	// (no mercy exit)
	// console.log(err.toString());
	// assert.strictEqual(err.toString(), 'Error: socket hang up');
	assert.strictEqual(res.statusCode, 400);
});
// --- File FORM upload 1 --
let form = new FormData();
let f1 = path.resolve('./scenarios', 'www', 'large.png');
let file1 = await openAsBlob(f1);
form.append('my_field', 'my value');
form.append('my_field2', 'second');
form.set('my_file2', file1, 'large.png');
// @ts-ignore
options = {
	method: 'POST',
	body: form
}
res = await fetch('http://127.0.0.1:9022/testcontroller/form', options)
let resOb = await res.json();
assert.strictEqual(resOb.values.my_field, 'my value');
assert.strictEqual(fs.existsSync(resOb.files[0].src), true);
fs.unlinkSync(resOb.files[0].src);

form = new FormData();
f1 = path.resolve('./scenarios', 'www', 'DR3-ErrorReport.zip');
file1 = await openAsBlob(f1);
form.set('link', file1, 'DR3-ErrorReport.zip');
// @ts-ignore
options = {
	method: 'POST',
	body: form
}
const result = await fetch('http://127.0.0.1:9022/testcontroller/form', options);
resOb = await result.json()
assert.strictEqual(fs.existsSync(resOb.files[0].src), true);
fs.unlinkSync(resOb.files[0].src);

// Serve does not exsists
hdr = {};
res = await request('http://127.0.0.1:9022/testcontroller/serveInvalidFile', 'GET', hdr);
assert.strictEqual(res.status, 404);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.response, 'Error: File not found.');
// Serve a folder
hdr = {};
res = await request('http://127.0.0.1:9022/testcontroller/serveFolder', 'GET', hdr);
assert.strictEqual(res.status, 200);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.response.index.length, 6);
assert.strictEqual(res.response.index[0].type, 'file');
// Serve a folder with file data
hdr = {};
res = await request('http://127.0.0.1:9022/testcontroller/serveFolderData', 'GET', hdr);
assert.strictEqual(res.status, 200);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.response.index.length, 6);
const idx = res.response.index;
const len = idx.length;
let i = 0;
for (; i < len; i++) {
	if (idx[i].name === 'test.json') {
		assert.strictEqual(idx[i].data.hello, 'world');
		assert.strictEqual(idx[i].content, 'js');
	}
}
// File HEAD, GET, MODIFIED
let modified;
res = await request('http://127.0.0.1:9022/testcontroller/serveValidFile/test.json', 'GET');
assert.strictEqual(res.status, 200);
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.response.hello, 'world');

modified = res.headers['last-modified'];
hdr = { 'if-modified-since': modified };
// Not modified
res = await request('http://127.0.0.1:9022/testcontroller/serveValidFile/test.json', 'GET', hdr);
assert.strictEqual(res.status, 304); // not modified
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.headers['content-length'], '0');
assert.strictEqual(res.headers['last-modified'], modified);

// Get the HEAD of a file
res = await request('http://127.0.0.1:9022/testcontroller/serveValidFile/test.json', 'HEAD');
assert.strictEqual(res.status, 200); // HEAD request
assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
assert.strictEqual(res.headers['content-length'], '23');
assert.strictEqual(res.headers['last-modified'], modified);
assert.strictEqual(res.response, '');
// Get a file
res = await request('http://127.0.0.1:9022/testcontroller/serveValidFile/test.text', 'GET');
assert.strictEqual(res.status, 200);
assert.strictEqual(res.headers['content-type'], 'plain/text');
assert.strictEqual(res.response.trim(), 'Hello World');

// Stop the server
assert.doesNotReject(async () => {
	// @ts-ignore
	console.log('Stopping service');
	await server.delete();
	const endTime = new Date().getTime();
	console.log(color.GREEN + 'Succesfull finished in: ' + (endTime - startTime) + ' ms' + color.RESET);
});
