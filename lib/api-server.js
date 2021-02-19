/**
 * @module fast-restapi2
 */
'use strict';
import ClientWrapper from './ClientWrapper.js';
import os from 'os';
import HTTP from 'http';

let server;
let ns = '';
let api;
const hostname = os.hostname();
/**
 * @private
 * @param {any} fn - any var
 * @returns {string} - Type of var
 */
const jsType = (fn) => {
  if (typeof fn === 'undefined') {
    return 'undefined';
  }
  return ({}).toString.call(fn).match(/\s([a-z|A-Z]+)/)[1];
};

/**
 * Try to find an action
 *
 * @private
 * @param {string} url - Distract action form URL
 * @returns {Object} action description
 */
const getAction = (url) => {
  if (!api) {
    return {};
  }
  let request = url.split('/');
  request.shift();
  if (request.length > 0 && request[0] !== ns) {
    // Request not equal to API namespace
    return {};
  } else {
    request.shift();
    if (request.length === 0) {
      request.push('index');
    }
  }
  let len = request.length;
  let i = 0;
  let action = '';
  let params = [];
  let tmpApi = api;
  for (; i < len; i++) {
    if (tmpApi.hasOwnProperty(request[i]) && action === '') {
      tmpApi = tmpApi[request[i]];
      let type = jsType(tmpApi);
      if (type === 'Object') {
        api = tmpApi;
      } else if (type === 'Function') {
        action = request[i];
      }
    } else {
      params.push((request[i]));
    }
  }
  if (action !== '') {
    // We have a valid namespace
    return {
      action: action,
      params: params
    };
  } else {
    return {};
  }
};
/**
 * Handle incoming request
 *
 * @param {HTTP.IncomingMessage} req - Class: http.IncomingMessage
 * @param {HTTP.ServerResponse} res - Class: http.ServerResponse
 * @returns {void}
 */
const requestHandler = (req, res) => {
  if (!req.url) {
    req.url = '';
  }
  let request = new URL(req.url, 'https://example.org/').pathname;
  let action = {};
  if (request) {
    action = getAction(request);
  }
  // reg ex to split query parameters
  const regex = /[?&]([^=#]+)=([^&#]*)/g;
  let query = {};
  let match;
  while ((match = regex.exec(req.url))) {
    query[match[1]] = match[2];
  }
  let client = new ClientWrapper(req, res, query);
  let date = new Date();
  let connection = 'keep-alive';
  if (typeof (req.headers.connection) !== 'undefined') {
    if (req.headers.connection === 'close') {
      connection = 'close';
    }
  }
  if (req.headers['accept'] && req.headers['accept'] === 'application/vnd.api+json') {
    client.addHeader('Content-Type', 'application/vnd.api+json');
  } else {
    client.addHeader('Content-Type', 'application/json; charset=utf-8');
  }
  client.addHeader('Connection', connection);
  client.addHeader('Server', hostname);
  client.addHeader('Date', date.toUTCString());
  client.addHeader('Access-Control-Allow-Origin', '*');
  client.addHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (Object.keys(action).length > 0) {
    // Call API
    api[action.action](client, action.params);
  } else {
    let message = { error: 'File not found.' };
    client.serve(404, message);
  }
};
/**
 * public api
 */
class Api {
  /**
   * Create, start a server
   *
   * @param  {string} preFix - namespace part of the URL to distinguish tha API ot a static file
   * @param  {Object} options - http(s) startup options
   * @param  {Object} app - class definition with status functions
   * @returns {Promise<Object>}
   */
  static create (preFix, options, app) {
    return new Promise((resolve, reject) => {
      // let httpsOpt;
      if (typeof (preFix) !== 'string') {
        reject(new Error('Invalid namespace'));
        return;
      }
      ns = preFix;
      if (typeof options.port !== 'number') {
        reject(new Error('port should be number'));
      }
      if (typeof options.host !== 'string') {
        reject(new Error('Host should be a string'));
      }
      if (app) {
        api = app;
      }
      server = HTTP.createServer(requestHandler);
      // server.options = options;
      server.on('clientError', (err, socket) => {
        if (err) {
          // nothing
        }
        // Just do not handle bad requests
        // close the socket, don't waste time
        try {
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        } catch (e) {
          // nothing
        }
      });
      server.listen(options.port, options.host, undefined, () => {
        resolve(options);
      });
    });
  }
  /**
   * Stop, delete a server
   *
   * @returns {Promise<string>}
   */
  static delete () {
    return new Promise((resolve, reject) => {
      if (!server) {
        reject(new Error('Server objecvt not found'));
        return;
      }
      server.unref();
      server.close(() => {
        server = null;
        resolve('ok');
      });
    });
  }

};
export default Api;
//  vim: set ts=2 sw=2 et :
