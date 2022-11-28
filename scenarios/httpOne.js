#!/usr/bin/env node

import assert from 'assert';
import path from 'path';
import FormData from 'form-data';
import fs from 'fs';
import Parker from 'parker-promise';
import TestController from './testController.js';
import request from './request.js';
import helper from './helper.js';
import server from '../lib/api-server.js';
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
test.do('Succesfull start a server',
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    server.create('testcontroller', {port: 9022, host: '127.0.0.1'}, TestController).then(() => {
      // console.log(res)
      p.done();
    }).catch((error) => {
      console.log(error);
      p.fail();
    });
  }
);
test.thenDo(
  /** @param {import('parker-promise').ParkerPromise} p */
  function testEchoVnD (p) {
    const group = {
      name: 'test group vnd',
      members: [100276, '1000676']
    };
    const hdr = {
      'Accept': 'application/vnd.api+json'
    }
    request('http://127.0.0.1:9022/testcontroller/echo', 'POST', hdr, group).then((res) => {
      console.log(res);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.data.name, 'test group vnd');
      p.done();
    }).catch((error) => {
      console.log(error);
      p.fail();
    });
  }
);
// -- test.thenDo('Should be able to post multi-part form data', 5000,
// --   /** @param {import('parker-promise').ParkerPromise} p */
// --   (p) => {
// --     var resOb;
// --     var form = new FormData();
// --     let f1 = path.resolve('./scenarios', 'www', 'large.png');
// --     form.append('my_field', 'my value');
// --     form.append('my_field2', 'second');
// --     form.append('my_file2', fs.createReadStream(f1));
// --     form.submit('http://127.0.0.1:9022/testcontroller/form', function (err, res) {
// --       assert.strictEqual(err, null);
// --       var resData = '';
// --       // return true
// --       res.on('data', function (chunk) {
// --         resData = resData + chunk;
// --       });
// --       res.on('end', function () {
// --         // This is the way
// --         resData.trim();
// --         resOb = JSON.parse(resData);
// --         assert.strictEqual(resOb.my_field, 'my value');
// --         assert.strictEqual(fs.existsSync(resOb.UPLOADED_FORM_FILES[0].src), true);
// --         fs.unlinkSync(resOb.UPLOADED_FORM_FILES[0].src);
// --         p.done();
// --       });
// --       res.on('error', function (e) {
// --         p.fail();
// --         console.log('Got error: ' + e.message);
// --       });
// --     });
// --   }
// -- );
// -- test.thenDo('test invalid file service',
// --   /** @param {import('parker-promise').ParkerPromise} p */
// --   (p) => {
// --     let hdr = {};
// --     request('http://127.0.0.1:9022/testcontroller/serveInvalidFile', 'GET', hdr).then((res) => {
// --       assert.strictEqual(res.status, 404);
// --       assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
// --       assert.strictEqual(res.response, 'Error: File not found');
// --       p.done();
// --     }).catch((error) => {
// --       console.log(error);
// --       p.fail();
// --     });
// --   },
// --   /** @param {import('parker-promise').ParkerPromise} p */
// --   (p) => {
// --     let hdr = {};
// --     request('http://127.0.0.1:9022/testcontroller/serveFolder', 'GET', hdr).then((res) => {
// --       assert.strictEqual(res.status, 200);
// --       assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
// --       assert.strictEqual(res.response.index.length, 3);
// --       p.done();
// --     }).catch((error) => {
// --       console.log(error);
// --       p.fail();
// --     });
// --   }
// -- )
// -- test.thenDo('Test file service',
// --   /** @param {import('parker-promise').ParkerPromise} p */
// --   (p) => {
// --     let modified;
// --     request('http://127.0.0.1:9022/testcontroller/serveValidFile/test.json', 'GET').then((res) => {
// --       assert.strictEqual(res.status, 200);
// --       assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
// --       assert.strictEqual(res.response.hello, 'world');
// --       modified = res.headers['last-modified'];
// --       let hdr = {'if-modified-since': modified};
// --       return request('http://127.0.0.1:9022/testcontroller/serveValidFile/test.json', 'GET', hdr);
// --     }).then((res) => {
// --       //test modified
// --       assert.strictEqual(res.status, 304);  // not modified
// --       assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
// --       assert.strictEqual(res.headers['content-length'], '0');
// --       assert.strictEqual(res.headers['last-modified'], modified);
// --       return request('http://127.0.0.1:9022/testcontroller/serveValidFile/test.json', 'HEAD')
// --     }).then((res) => {
// --       //test HEAD
// --       assert.strictEqual(res.status, 200);  // HEAD request
// --       assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
// --       assert.strictEqual(res.headers['content-length'], '23');
// --       assert.strictEqual(res.headers['last-modified'], modified);
// --       assert.strictEqual(res.response, '');
// --       return request('http://127.0.0.1:9022/testcontroller/serveValidFile/test.text', 'GET')
// --     }).then((res) => {
// --       // test content type
// --       assert.strictEqual(res.status, 200);
// --       assert.strictEqual(res.headers['content-type'], 'plain/text');
// --       assert.strictEqual(res.response.trim(), 'Hello World');
// --       p.done();
// --     }).catch((error) => {
// --       console.log(error);
// --       p.fail();
// --     });
// --   },
// --
// -- )
test.thenDo('Stop a server',
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    server.delete().then(() => {
      // console.log(res)
      p.done();
    }).catch((error) => {
      console.log(error);
      p.fail();
    });
  }
);
test.whenDone(
  () => {
    let endTime = new Date().getTime();
    console.log(color.GREEN + 'Succesfull finished in: ' + (endTime - startTime) + ' ms' + color.RESET);
    process.exit();
  })
// .whenException(function (e) {
//   process.stdout.write(color.RED)
//   console.error(e)
//   process.stdout.write(color.RESET)
// })
  .whenFail( (e) => {
    process.stdout.write(color.RED);
    console.error(e);
    process.stdout.write(color.RESET);
    process.exit(1);
  });
process.stdin.resume();
/* eslint-enable no-console */
// vim: et:ts=2:sw=2:sts=2
