#!/usr/bin/env node

import assert from 'assert';
import Parker from 'parker-promise';
import mime from '../lib/mime.js';
const startTime = new Date().getTime();

const color = {
  BLACK: '\u001b[30m',
  RED: '\u001b[31m',
  GREEN: '\u001b[32m',
  YELLOW: '\u001b[33m',
  BLUE: '\u001b[34m',
  MAGENTA: '\u001b[35m',
  CYAN: '\u001b[36m',
  WHITE: '\u001b[37m',
  RESET: '\u001b[0m'
};

const test = new Parker();
test.do('test' ,
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    let m = mime('file.XML');
    assert.strictEqual(m, 'text/xml');
    m = mime('file'); // no extension, default json
    assert.strictEqual(m, 'application/json; charset=utf-8');
    m = mime(); // no parameter
    assert.strictEqual(m, 'application/octet-stream');
    m = mime('a.JSON'); // capital json
    assert.strictEqual(m, 'application/json; charset=utf-8');
    m = mime('a.js'); // capital json
    assert.strictEqual(m, 'text/javascript; charset=utf-8');
    m = mime('/data/flow-service/files/72a/bb12443b46f20553c945bda842580.xml');
    assert.strictEqual(m, 'text/xml');
    p.done();
  }
);
test.whenDone(
  () => {
    let endTime = new Date().getTime();
    console.log(color.GREEN + 'Succesfull finished in: ' + (endTime - startTime) + ' ms' + color.RESET);
    process.exit();
  })
  .whenFail( (e) => {
    process.stdout.write(color.RED);
    console.error(e);
    process.stdout.write(color.RESET);
    process.exit(1);
  });
process.stdin.resume();
/* eslint-enable no-console */
// vim: et:ts=2:sw=2:sts=2
