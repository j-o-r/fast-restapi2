#!/usr/bin/env node

'use strict';

// https://nodejs.org/api/assert.html
import assert from 'assert';
import Parker from 'parker-promise';
import ClientWrapper from '../lib/ClientWrapper.js';
const startTime = new Date().getTime();
// const fs = require('fs')

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
let req = {};
let res = {};

test.do('Test the NON server wrapper methods',
  /** @param {import('parker-promise').ParkerPromise} p */
  function isObject (p) {
    let req = {};
    let res = {};
    let wrapper = new ClientWrapper(req, res);
    assert.strictEqual(typeof wrapper, 'object');
    p.done();
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  function addHeader (p) {
    let req = {};
    let res = {};
    let wrapper = new ClientWrapper(req, res);
    wrapper.addHeader('Foo', 'Bar');
    assert.strictEqual(wrapper.getHeader('Foo'), 'Bar');
    p.done();
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  function mallFormedHeaders (p) {
    // this is not added, but will not throw either
    assert.doesNotThrow(function () {
      let req = {};
      let res = {};
      let wrapper = new ClientWrapper(req, res);
      wrapper.addHeader({}, 'pipo');
      p.done();
    }, 'error');
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  function resturnUndefined (p) {
    let req = {};
    let res = {};
    let wrapper = new ClientWrapper(req, res);
    assert.strictEqual(wrapper.getHeader('pipo'), undefined);
    p.done();
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  function destroyAble (p) {
    let req = {};
    let res = {
      end: function () {

      }
    };
    let wrapper = new ClientWrapper(req, res);
    wrapper.addHeader('Foo', 'Bar');
    assert.strictEqual(wrapper.hasOwnProperty('res'), true);
    wrapper.end();
    assert.strictEqual(wrapper.hasOwnProperty('res'), false);
    p.done();
  }
);
test.thenDo('Headers test',
  /** @param {import('parker-promise').ParkerPromise} p */
  function getHeaders(p) {
    let client = new ClientWrapper(req, res);
    client.addHeader('Content-Type', 'application/json; charset=utf-8');
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
    console.log(hdr1);
    p.done();
  }
)
test.whenDone(function () {
  let endTime = new Date().getTime();
  console.log(color.GREEN + 'Succesfull finished in: ' + (endTime - startTime) + ' ms' + color.RESET);
  process.exit();
}).whenFail(function (e) {
  process.stdout.write(color.RED);
  console.error(e);
  process.stdout.write(color.RESET);
  process.exit(1);
});
// vim: set ts=2 sw=2 et :
