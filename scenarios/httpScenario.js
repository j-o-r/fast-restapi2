#!/usr/bin/env node

// https://nodejs.org/api/assert.html
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

var color = {
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

var test = new Parker();
test.do(
  '1: all this server starts fail',
  function (p) {
    assert.throws(
      function () {
        // No options
        server.create({ip: '127.0.0.1'});
      },
      'error'
    );
    p.done();
  },
  function (p) {
    assert.throws(
      function () {
        // No valid webpath
        server.create({ip: '127.0.0.1', port: 8080, webpath: 'pipo'});
      },
      'error'
    );
    p.done();
  },
  function (p) {
    assert.throws(
      function () {
        // No valid webpath either
        server.create({ip: '127.0.0.1', port: 8080, webpath: '/scenarios'});
      },
      'error'
    );
    p.done();
  },
  function (p) {
    assert.throws(
      function () {
        // No callback
        server.create.createServer('httpserver', 'api.http', {port: 9022, host: '127.0.0.1', webpath: '/scenarios/www'});
      },
      'error'
    );
    p.done();
  }
);

test.thenDo('Succesfull start a server',
  function (p) {
    assert.doesNotThrow(
      function () {
        server.create('testcontroller', {port: 9022, host: '127.0.0.1', webpath: '/scenarios/www'}, TestController, function () {
          // console.log(res)
          p.done();
        });
      },
      'error'
    );
  }
);
test.thenDo('Test the api',
  function (p) {
    request('http://127.0.0.1:9022/x03/x00/x00/*/xE0/x00/x00/x00/x00/x00Cookie:%20mstshash=Administr', 'GET').then((res) => {
      assert.strictEqual(res.status, 404);
      p.done();
    }).catch((error) => {
      console.log(error);
      p.fail();
    });
  },
  function (p) {
    request('http://127.0.0.1:9022/index.html', 'GET').then((res) => {
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      p.done();
    }).catch((error) => {
      console.log(error);
      p.fail();
    });
  },
  function (p) {
    let hdr = {};
    hdr['Accept'] = 'application/xml';
    request('http://127.0.0.1:9022/testcontroller/index', 'GET', hdr).then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.joe[0], 'bar');
      p.done();
    }).catch((error) => {
      console.log(error);
      p.fail();
    });
  },
  function (p) {
    let hdr = {};
    hdr['Accept'] = 'application/xml';
    request('http://127.0.0.1:9022/testcontroller/error', 'GET', hdr).then((res) => {
      assert.strictEqual(res.status, 500);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response, 'Error: an error');
      p.done();
    }).catch((error) => {
      console.log(error);
      p.fail();
    });
  },
  function (p) {
    let hdr = {};
    hdr['Accept'] = 'application/xml';
    request('http://127.0.0.1:9022/testcontroller/stream', 'GET', hdr).then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.test.length, 6);
      p.done();
    }).catch((error) => {
      console.log(error);
      p.fail();
    });
  },
  function (p) {
    let hdr = {};
    hdr['Accept'] = 'application/xml';
    request('http://127.0.0.1:9022/testcontroller/stream.json', 'GET', hdr).then((res) => {
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      p.done();
    }).catch((error) => {
      console.log(error);
      p.fail();
    });
  },

  function (p) {
    request('http://127.0.0.1:9022/testcontroller/stream404', 'GET').then((res) => {
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.test.length, 0);
      p.done();
    }).catch((error) => {
      console.log(error);
      p.fail();
    });
  },
  function (p) {
    request('http://127.0.0.1:9022/testcontroller/stream500', 'GET').then((res) => {
      assert.strictEqual(res.status, 500);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.test.length, 1);
      p.done();
    }).catch((error) => {
      console.log(error);
      p.fail();
    });
  },
  function (p) {
    request('http://127.0.0.1:9022/testcontroller/stream200', 'GET').then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.test.length, 3);
      p.done();
    }).catch((error) => {
      console.log(error);
      p.fail();
    });
  },
  function (p) {
    // The extension doesn't change a thing
    request('http://127.0.0.1:9022/testcontroller/stream', 'GET').then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.test.length, 6);
      p.done();
    }).catch((error) => {
      console.log(error);
      p.fail();
    });
  },
  function (p) {
    // This doens't exsis
    request('http://127.0.0.1:9022/testcontroller/whatisthis', 'GET').then((res) => {
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.error, 'File not found.');
      p.done();
    });
  },
  function testParams (p) {
    request('http://127.0.0.1:9022/testcontroller/params/one/two/three.123', 'GET').then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.params.length, 3);
      p.done();
    }).catch((error) => {
      console.log(error);
      p.fail();
    });
  },
  function testQuery (p) {
    request('http://127.0.0.1:9022/testcontroller/query?space=%20&pipo=circus&this=10', 'GET').then((res) => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8');
      assert.strictEqual(res.response.query.pipo, 'circus');
      assert.strictEqual(res.response.query.space, '%20');
      p.done();
    }).catch((error) => {
      console.log(error);
      p.fail();
    });
  },

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
      console.log(error);
      p.fail();
    });
  },
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
      console.log(error);
      p.fail();
    });
  },
  function testMisformed (p) {
    // This doens't exsis
    var group = {
      name: 'test group 444',
      members: [100276, '1000676']
    };
    var pst = helper.toJson(group);
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
      assert.strictEqual(res.statusCode, 400);
      p.done();
    });
  }).thenDo('Should be able to post multi-part form data', 5000,
    function (p) {
      var resOb;
      var form = new FormData();
      let f1 = path.resolve('./scenarios', 'www', 'large.png');
      form.append('my_field', 'my value');
      form.append('my_field2', 'second');
      form.append('my_file2', fs.createReadStream(f1));
      form.submit('http://127.0.0.1:9022/testcontroller/form', function (err, res) {
        assert.strictEqual(err, null);
        var resData = '';
        // return true
        res.on('data', function (chunk) {
          resData = resData + chunk;
        });
        res.on('end', function () {
          // This is the way
          resData.trim();
          resOb = JSON.parse(resData);
          assert.strictEqual(resOb.fields.my_field, 'my value');
          assert.strictEqual(fs.existsSync(resOb.files[0].src), true);
          fs.unlinkSync(resOb.files[0].src);
          p.done();
        });
        res.on('error', function (e) {
          p.fail();
          console.log('Got error: ' + e.message);
        });
      });
    });
test.thenDo('Stop a server',
  function (p) {
    assert.doesNotThrow(
      function () {
        server.delete(function () {
          // console.log(res)
          p.done();
        });
      },
      'hanguperror'
    );
  });
test.whenDone(
  function () {
    let endTime = new Date().getTime();
    console.log(color.GREEN + 'Succesfull finished in: ' + (endTime - startTime) + ' ms' + color.RESET);
  })
// .whenException(function (e) {
//   process.stdout.write(color.RED)
//   console.error(e)
//   process.stdout.write(color.RESET)
// })
  .whenFail(function (e) {
    process.stdout.write(color.RED);
    console.error(e);
    process.stdout.write(color.RESET);
  });
/* eslint-enable no-console */
// vim: et:ts=2:sw=2:sts=2
