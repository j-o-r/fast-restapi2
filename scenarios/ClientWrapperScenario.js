#!/usr/bin/env node

'use strict';

// https://nodejs.org/api/assert.html
import assert from 'assert';
import { ClientWrapper } from '../lib/ClientWrapper.js';
const startTime = new Date().getTime();

const color = {
	GREEN: '\u001b[32m',
	RESET: '\u001b[0m'
};

let req = {};
let res = {};

// @ts-ignore
let wrapper = new ClientWrapper(req, res);
wrapper.addHeader('Foo', 'Bar');
assert.strictEqual(wrapper.getHeader('Foo'), 'Bar');

// this is not added, but will not throw either
assert.doesNotThrow(function() {
	let req = {};
	let res = {};
	// @ts-ignore
	let wrapper = new ClientWrapper(req, res);
	console.log('IGNORE THIS ERROR:')
	// @ts-ignore
	wrapper.addHeader({}, 'pipo');
}, 'error');

req = {};
res = {};
// @ts-ignore
wrapper = new ClientWrapper(req, res);
assert.strictEqual(wrapper.getHeader('pipo'), undefined);
// @ts-ignore
wrapper = new ClientWrapper(req, res);
wrapper.addHeader('Foo', 'Bar');
assert.strictEqual(wrapper.hasOwnProperty('res'), true);
wrapper.end();
assert.strictEqual(wrapper.hasOwnProperty('res'), false);
req = {};
res = {};
// @ts-ignore
let client = new ClientWrapper(req, res);
client.addHeader('Content-Type', 'application/json; charset=utf-8');
console.log('IGNORE THIS ERROR:')
client.addHeader('content-type', 'plain/txt');
client.addHeader('Connection', 'close');
client.addHeader('Server', 'pipo');
client.addHeader('Date', new Date().toUTCString());
client.addHeader('Access-Control-Allow-Origin', '*');
client.addHeader('Access-Control-Allow-Headers', 'Content-Type');
// Case insensitive
let hdr1 = client.getHeader('content-type');
let hdr2 = client.getHeader('Content-Type');
assert.strictEqual(hdr1, hdr2)
assert.strictEqual(hdr1, 'application/json; charset=utf-8');
let endTime = new Date().getTime();
console.log(color.GREEN + 'Succesfull finished in: ' + (endTime - startTime) + ' ms' + color.RESET);
