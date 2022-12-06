/**
 * @module fast-restapi2
 */
'use strict';
import {ClientWrapper, jsType, hasProp} from './ClientWrapper.js';
import os from 'os';
import HTTP from 'http';

/**
  * Represents a Options object
  * @typedef {Object} OptionsObject
  *
  * @property {number} [port] -
  * @property {string} [host] -
  */

let server;
let ns = '';
let api;
const hostname = os.hostname();

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
  const request = url.split('/');
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
  const len = request.length;
  let i = 0;
  let action = '';
  const params = [];
  let tmpApi = api;
  for (; i < len; i++) {
    // remove .json for backwards compatibility
    const r = request[i].replace(/.json$/, '');
    if (hasProp(tmpApi, r) && action === '') {
      tmpApi = tmpApi[r];
      const type = jsType(tmpApi);
      if (type === 'Object') {
        api = tmpApi;
      } else if (type === 'Function') {
        action = r;
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
  let request;
  try {
    request = new URL(req.url, 'https://example.org/').pathname;
  } catch (error) {
    console.error(error);
  }
  let action = {};
  if (request) {
    action = getAction(request);
  } else {
    // no valid request? shutdown and do not waste any effort to handle it
    try {
      res.end();
      req = null;
      res = null;
    } catch (_e) {
      // Just do nothing
    }
    return;
  }
  // reg ex to split query parameters
  const regex = /[?&]([^=#]+)=([^&#]*)/g;
  const query = {};
  let match;
  while ((match = regex.exec(req.url))) {
    try {
      query[match[1]] = decodeURIComponent(match[2]);
    } catch (_e) {
      // no merci, just close the connection
      req.destroy(new Error('URI malformed '));
      return;
    }
  }
  const client = new ClientWrapper(req, res, query);
  const date = new Date();
  let connection = 'keep-alive';
  if (typeof (req.headers.connection) !== 'undefined') {
    if (req.headers.connection === 'close') {
      connection = 'close';
    }
  }
  client.addHeader('Content-Type', 'application/json; charset=utf-8');
  client.addHeader('Connection', connection);
  client.addHeader('Server', hostname);
  client.addHeader('Date', date.toUTCString());
  client.addHeader('Access-Control-Allow-Origin', '*');
  client.addHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (Object.keys(action).length > 0) {
    // Call API
    api[action.action](client, action.params);
  } else {
    const message = new Error('File not found');
    client.serve(404, message.toString());
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
   * @param  {OptionsObject} options - http(s) startup options
   * @param  {Object} app - class definition with static methods
   * @returns {Promise<Object>}
   */
  static create(preFix, options, app) {
    return new Promise((resolve, reject) => {
      // let httpsOpt;
      if (typeof (preFix) !== 'string') {
        reject(new Error('Invalid namespace'));
        return;
      }
      ns = preFix;
      if (typeof options.port !== 'number') {
        reject(new Error('port should be number'));
        return;
      }
      if (typeof options.host !== 'string') {
        reject(new Error('Host should be a string'));
        return;
      }
      if (typeof app !== 'function') {
        reject(new Error('No api found'));
        return;
      }
      api = app;
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
        } catch (_e) {
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
  static delete() {
    return new Promise((resolve, reject) => {
      if (!server) {
        reject(new Error('Server object not found'));
        return;
      }
      server.unref();
      server.close(() => {
        server = null;
        resolve('ok');
      });
    });
  }

}
export default Api;
//  vim: set ts=2 sw=2 et :
