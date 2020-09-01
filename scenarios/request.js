/*
 * nodejs http/https moudles request
 */
'use-strict';

/**
 * @typedef responseObject
 * @property {any} response - depending on JSON or else a string
 * @property {number} status - http status code
 * @property {Object} headers - key, value object
 */

import urlMod from 'url';
import http from 'http';
import https from 'https';

const expressionUrl = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;

/**
 * nodeRequest
 *
 * @param {string} url - http...
 * @param {string} [method] - http method POST GET PUT etc
 * @param {Object} [headers] - https headers
 * @param {any} [postObject] - Any data type to post as long as it is jsonable
 * @returns {Promise<responseObject>}
 */

const nodeRequest = (url, method, headers, postObject) => { // eslint-disable-line
  if (!method) {
    method = 'GET';
  }
  if (!headers) {
    headers = {};
  }
  let promise = new Promise((resolve, reject) => {
    if (!url.match(expressionUrl)) {
      reject(new Error('url is not a valid format : ' + url));
      return;
    }
    if (postObject && !(method === 'PUT' || method === 'POST' || method === 'PATCH')) {
      reject(new Error('postObject needs a POST or PUT method'));
      return;
    }
    /**
     * toJson
     *
     * @param {any} ob - any json-able var type
     * @returns {Object}
     */
    let toJson = (ob) => {
      var data = JSON.stringify(ob);
      var len = Buffer.byteLength(data); // eslint-disable-line
      return {
        data: data,
        len: len,
        ct: 'application/json'
      };
    };
    /**
     * getOptions
     *
     * @param {string} endpoint - url
     * @param {string} method - request method
     * @param {string} contenttype - content-type / mime-type
     * @param {number} length - byteslength
     * @returns {Object}
     */
    let getOptions = (endpoint, method, contenttype, length) => {
      var pathInfo = urlMod.parse(endpoint);
      if (!pathInfo.port && pathInfo.protocol === 'http:') {
        pathInfo.port = '80';
      } else if (!pathInfo.port && pathInfo.protocol === 'https:') {
        pathInfo.port = '443';
      }
      var header;
      if (contenttype && length) {
        header = {
          'Content-Type': contenttype,
          'Content-Length': length,
          'User-Agent': 'DGE request module'
        };
      } else {
        header = {
          'User-Agent': 'DGE request module'
        };
      }
      return {
        protocol: pathInfo.protocol,
        hostname: pathInfo.hostname,
        method: method,
        port: pathInfo.port,
        path: pathInfo.path,
        headers: header
      };
    };
    let post, postContentType, postLength;
    if (postObject) {
      post = toJson(postObject);
      postContentType = post.ct;
      postLength = post.len;
    }
    let options = getOptions(url, method, postContentType, postLength);
    if (headers) {
      let p;
      for (p in headers) {
        options.headers[p] = headers[p];
      }
    }
    let _http;
    if (options.protocol === 'https:') {
      _http = https;
      // Added both
      // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      // However this documented one does not work
      // options.rejectUnhauthorized = false;
    } else {
      _http = http;
    }

    let req = _http.request(options, (res) => {
      let status = res.statusCode;
      let response = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        response += chunk;
      });
      res.on('error', (e) => {
        reject(e);
      });
      res.on('abort', (e) => {
        reject(e);
      });
      res.on('checkExpectation', (e) => {
        reject(e);
      });
      res.on('uncaughtException', (e) => {
        reject(e);
      });
      res.on('end', () => {
        let result = '';
        // try to parse it right away
        // @TODO only parse when te content-type indicates so
        try {
          result = JSON.parse(response);
        } catch (e) {
          result = response;
        }
        let headers = res.headers;
        resolve({response: result, status, headers});
      });
    });

    req.on('error', (e) => {
      reject(e);
    });
    if (post && post.data) {
      req.write(post.data);
    }
    req.end();
  });
  return promise;
};
export default nodeRequest;
