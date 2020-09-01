import HTTP from 'http';
import HTTPS from 'https';
import url from 'url';

export default {

    jsType: function (fn) {
      if (typeof fn === 'undefined') {
        return 'undefined';
      }
      return ({}).toString.call(fn).match(/\s([a-z|A-Z]+)/)[1];
    },

    toJson: function (ob) {
      var data = JSON.stringify(ob);
      var len = data.length;
      return {
        data: data,
        len: len,
        ct: 'application/json'
      };
    },
    getOptions: function (endpoint, method, contenttype, length) {
      var pathInfo = url.parse(endpoint);
      if (!pathInfo.port && pathInfo.protocol === 'http:') {
        pathInfo.port = '80';
      } else if (!pathInfo.port && pathInfo.protocol === 'https:') {
        pathInfo.port = '443';
      }
      var header;
      if (contenttype && length) {
        header = {
          'Content-Type': contenttype,
          'Content-Length': length
        };
      } else {
        header = {};
      }
      return {
        protocol: pathInfo.protocol,
        hostname: pathInfo.hostname,
        method: method,
        port: pathInfo.port,
        path: pathInfo.path,
        headers: header
      };
    },
    createRequest: function (options, data, cb) {
      // Need to branch for HTTPS sometime
      var response = {};
      response.body = '';
      var _http;
      if (options.protocol === 'https:') {
        _http = HTTPS;
        // Added both
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        // However this documented one does not work
        options.rejectUnhauthorized = false;
      } else {
        _http = HTTP;
      }
      var req = _http.request(options, function createHttpRequest (res) {
        response.statusCode = res.statusCode;
        response.headers = res.headers;
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          response.body += chunk;
        });
        res.on('error', function (e) {
          cb(e, null);
        });
        res.on('abort', function (e) {
          cb(e, null);
        });
        res.on('checkExpectation', function (e) {
          cb(e, null);
        });
        res.on('end', function () {
          // WE SHOULD HAVE JSON OR XML
          // PARSE IT RIGHT AWAY
          response.trailers = res.trailers;

          var accept = response.headers['content-type'] || '';
          var ct = /application\/json/.test(accept) ? 'json' : '';
          if (ct === 'json') {
            try {
              response.body = JSON.parse(response.body);
            } catch (e) {
              response.body = !1;
            }
            cb(null, response);
          } else {
            cb(null, response);
          }
        });
      });
      req.on('error', function catchError (e) {
        cb(e, null);
      });
      if (data) {
        req.write(data);
      }
      req.end();
    }
  };
// vim: et:ts=2:sw=2:sts=2
