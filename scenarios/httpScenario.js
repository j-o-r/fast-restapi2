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
test.do(
  '1: all this server starts fail',
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    // No port
    server.create('v1', {host: '127.0.0.1'}).then(() => {
      p.fail();
    }).catch(() => {
      p.done();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    // No host
    server.create('v1', {port: 8080}).then(() => {
      p.fail();
    }).catch(() => {
      p.done();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    // No api
    server.create('v1', {host: '127.0.0.1', port: 9080}).then(() => {
      console.log('NOT HERE');
      p.fail();
    }).catch(() => {
      p.done();
    });
  }

);
test.thenDo('Succesfull start a server',
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    server.create('testcontroller', {port: 9022, host: '127.0.0.1'}, TestController).then(() => {
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  }
);
test.thenDo('Test the api',
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    request('http://127.0.0.1:9022/x03/x00/x00/*/xE0/x00/x00/x00/x00/x00Cookie:%20mstshash=Administr', 'GET').then((res) => {
      assert.strictEqual(res.status, 404);
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    request('http://127.0.0.1:9022/index.html', 'GET').then((res) => {
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    let hdr = {};
    hdr['Accept'] = 'application/xml';
    request('http://127.0.0.1:9022/testcontroller/index', 'GET', hdr).then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.joe[0], 'bar');
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    let hdr = {};
    hdr['Accept'] = 'application/xml';
    request('http://127.0.0.1:9022/testcontroller/index.json', 'GET', hdr).then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.joe[0], 'bar');
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },

  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    let hdr = {};
    hdr['Accept'] = 'application/xml';
    request('http://127.0.0.1:9022/testcontroller/error', 'GET', hdr).then((res) => {
      assert.strictEqual(res.status, 500);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response, 'Error: an error');
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    let hdr = {};
    hdr['Accept'] = 'application/xml';
    request('http://127.0.0.1:9022/testcontroller/stream', 'GET', hdr).then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.test.length, 6);
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    let hdr = {};
    hdr['Accept'] = 'application/vnd.api+json';
    request('http://127.0.0.1:9022/testcontroller/stream', 'GET', hdr).then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.test.length, 6);

      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    let hdr = {};
    hdr['Accept'] = 'application/xml';
    request('http://127.0.0.1:9022/testcontroller/stream.json', 'GET', hdr).then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    request('http://127.0.0.1:9022/testcontroller/stream404', 'GET').then((res) => {
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.test.length, 0);
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    request('http://127.0.0.1:9022/testcontroller/stream500', 'GET').then((res) => {
      assert.strictEqual(res.status, 500);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.test.length, 1);
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    request('http://127.0.0.1:9022/testcontroller/stream200', 'GET').then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.test.length, 3);
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    // The extension doesn't change a thing
    request('http://127.0.0.1:9022/testcontroller/stream', 'GET').then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.test.length, 6);
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    // This doens't exsis
    request('http://127.0.0.1:9022/testcontroller/whatisthis', 'GET').then((res) => {
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response, 'Error: File not found');
      p.done();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    request('http://127.0.0.1:9022/testcontroller/params/one/two/three.123', 'GET').then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.params.length, 3);
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  function testQuery (p) {
    request('http://127.0.0.1:9022/testcontroller/query?space=%20&pipo=circus&this=10', 'GET').then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.query.pipo, 'circus');
      assert.strictEqual(res.response.query.space, ' ');
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },

  /** @param {import('parker-promise').ParkerPromise} p */
  function strangeCharsParams (p) {
    var x = encodeURIComponent(escape('pipo/*13934589\/\' .what?#<>')) // eslint-disable-line
    var y = encodeURIComponent(escape('??&&##.xml.json.whatever'));
    request('http://127.0.0.1:9022/testcontroller/params/one/' + x + '/' + y, 'GET').then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(x, res.response.params[1]);
      assert.strictEqual(y, res.response.params[2]);
      assert.strictEqual(res.response.params.length, 3);
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    let hdr = {};
    request('http://127.0.0.1:9022/testcontroller/contenttype', 'GET', hdr).then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'plain/text');
      assert.strictEqual(res.response, 'i,am,plain,text');
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },

  /** @param {import('parker-promise').ParkerPromise} p */
  function testEcho (p) {
    var group = {
      name: 'test group 2',
      members: [100276, '1000676']
    };
    request('http://127.0.0.1:9022/testcontroller/echo', 'POST', {}, group).then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.data.name, 'test group 2');
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  function testEchoVnD (p) {
    const group = {
      name: 'test group vnd',
      members: [100276, '1000676']
    };
    const hdr = {
      'Accept': 'application/vnd.api+json'
    };
    request('http://127.0.0.1:9022/testcontroller/echo', 'POST', hdr, group).then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.data.name, 'test group vnd');
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },

  /** @param {import('parker-promise').ParkerPromise} p */
  function testMisformed (p) {
    // This doens't exsis
    const group = {
      name: 'test group 444',
      members: [100276, '1000676']
    };
    const pst = helper.toJson(group);
    pst.data = 'Break me' + pst.data + 'Add something strange';
    // The posted data is longer then the content length
    // The posted data is not valid JSON
    let options = helper.getOptions('http://127.0.0.1:9022/testcontroller/echo', 'POST', pst.ct, pst.len);
    options.headers['Accept'] = 'application/xml';
    // assert.throws( function () {
    helper.createRequest(options, pst.data, function (err, res) {
      if (err) {
        p.fail();
        return;
      }
      assert.strictEqual(res.statusCode, 500);
      p.done();
    });
  });
test.thenDo('Should be able to post multi-part form data', 5000,
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    let resOb;
    const form = new FormData();
    const f1 = path.resolve('./scenarios', 'www', 'large.png');
    form.append('my_field', 'my value');
    form.append('my_field2', 'second');
    form.append('my_file2', fs.createReadStream(f1));
    form.submit('http://127.0.0.1:9022/testcontroller/form', function (err, res) {
      assert.strictEqual(err, null);
      let resData = '';
      // return true
      res.on('data', function (chunk) {
        resData = resData + chunk;
      });
      res.on('end', function () {
        // This is the way
        resData.trim();
        resOb = JSON.parse(resData);
        assert.strictEqual(resOb.my_field, 'my value');
        assert.strictEqual(fs.existsSync(resOb.UPLOADED_FORM_FILES[0].src), true);
        fs.unlinkSync(resOb.UPLOADED_FORM_FILES[0].src);
        p.done();
      });
      res.on('error', function (e) {
        p.fail();
        console.log('Got error: ' + e.message);
      });
    });
  }
);
test.thenDo('Should be able to post multi-part form data EmptyZip', 5000,
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    let resOb;
    const form = new FormData();
    const f1 = path.resolve('./scenarios', 'www', 'DR3-ErrorReport.zip');
    form.append('link', fs.createReadStream(f1));
    form.submit('http://127.0.0.1:9022/testcontroller/form', function (err, res) {
      assert.strictEqual(err, null);
      let resData = '';
      // return true
      res.on('data', function (chunk) {
        resData = resData + chunk;
      });
      res.on('end', function () {
        // This is the way
        resData.trim();
        resOb = JSON.parse(resData);
        assert.strictEqual(fs.existsSync(resOb.UPLOADED_FORM_FILES[0].src), true);
        fs.unlinkSync(resOb.UPLOADED_FORM_FILES[0].src);
        p.done();
      });
      res.on('error', function (e) {
        p.fail();
        console.log('Got error: ' + e.message);
      });
    });
  }
);

test.thenDo('test invalid file service',
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    const hdr = {};
    request('http://127.0.0.1:9022/testcontroller/serveInvalidFile', 'GET', hdr).then((res) => {
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response, 'Error: File not found');
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    const hdr = {};
    request('http://127.0.0.1:9022/testcontroller/serveFolder', 'GET', hdr).then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.index.length, 6);
      assert.strictEqual(res.response.index[0].type, 'file');
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  },
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    const hdr = {};
    request('http://127.0.0.1:9022/testcontroller/serveFolderData', 'GET', hdr).then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.index.length, 6);
      const idx = res.response.index;
      const len = idx.length;
      let i = 0;
      for (;i < len; i++) {
        if (idx[i].name === 'test.json') {
          assert.strictEqual(idx[i].data.hello, 'world');
          assert.strictEqual(idx[i].content, 'js');
        }
      }
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  }

);
test.thenDo('Test file service',
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    let modified;
    request('http://127.0.0.1:9022/testcontroller/serveValidFile/test.json', 'GET').then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.hello, 'world');
      modified = res.headers['last-modified'];
      const hdr = {'if-modified-since': modified};
      return request('http://127.0.0.1:9022/testcontroller/serveValidFile/test.json', 'GET', hdr);
    }).then((res) => {
      // test modified
      assert.strictEqual(res.status, 304); // not modified
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.headers['content-length'], '0');
      assert.strictEqual(res.headers['last-modified'], modified);
      return request('http://127.0.0.1:9022/testcontroller/serveValidFile/test.json', 'HEAD');
    }).then((res) => {
      // test HEAD
      assert.strictEqual(res.status, 200); // HEAD request
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.headers['content-length'], '23');
      assert.strictEqual(res.headers['last-modified'], modified);
      assert.strictEqual(res.response, '');
      return request('http://127.0.0.1:9022/testcontroller/serveValidFile/test.text', 'GET');
    }).then((res) => {
      // test content type
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'plain/text');
      assert.strictEqual(res.response.trim(), 'Hello World');
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  }
);
test.thenDo('Stop a server',
  /** @param {import('parker-promise').ParkerPromise} p */
  (p) => {
    server.delete().then(() => {
      // console.log(res)
      p.done();
    }).catch((error) => {
      console.error(error);
      p.fail();
    });
  }
);
test.whenDone(
  () => {
    const endTime = new Date().getTime();
    console.log(color.GREEN + 'Succesfull finished in: ' + (endTime - startTime) + ' ms' + color.RESET);
    process.exit();
  })
  .whenFail((e) => {
    process.stdout.write(color.RED);
    console.error(e);
    process.stdout.write(color.RESET);
    process.exit(1);
  });
process.stdin.resume();
/* eslint-enable no-console */
// vim: et:ts=2:sw=2:sts=2
