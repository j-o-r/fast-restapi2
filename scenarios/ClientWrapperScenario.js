#!/usr/bin/env node

'use strict';

import { assert, Test } from '@j-o-r/sh';
import { ClientWrapper } from '../lib/ClientWrapper.js';

const test = new Test();

test.add('Add/ get header', () => {

	let req = {};
	let res = {};

	const wrapper = new ClientWrapper(req, res);
	wrapper.addHeader('Foo', 'Bar');
	assert.strictEqual(wrapper.getHeader('Foo'), 'Bar');

	// this is not added, but will not throw either
	assert.throws(function() {
		let wrapper = new ClientWrapper(req, res);
		wrapper.addHeader({}, 'pipo');
	}, 'error');
});


test.add('Some more Add/ Get header', () => {
	const req = {};
	const res = {};
	// @ts-ignore
	const wrapper = new ClientWrapper(req, res);
	assert.strictEqual(wrapper.getHeader('pipo'), undefined);
	// @ts-ignore
	// wrapper = new ClientWrapper(req, res);
	wrapper.addHeader('Foo', 'Bar');
	assert.strictEqual(wrapper.hasOwnProperty('res'), true);
	wrapper.end();
	assert.strictEqual(wrapper.hasOwnProperty('res'), false);
});

test.add('Headers III', () => {
	const req = {};
	const res = {};
	// @ts-ignore
	let client = new ClientWrapper(req, res);
	client.addHeader('Content-Type', 'application/json; charset=utf-8');
	assert.throws(() => {
	  client.addHeader('content-type', 'plain/txt');
	})
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
});

const report = await test.run();
if (report.errors > 0) {
	process.exit(1);
}
