#!/usr/bin/env node
import { assert, Test } from '@j-o-r/sh';
import mime from '../lib/mime.js';

const isNpm = process.env.npm_lifecycle_event ? true : false;
const test = new Test(isNpm);

test.add('test', () => {
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

});

const report = await test.run();
if (report.errors > 0) {
	process.exit(1);
}
