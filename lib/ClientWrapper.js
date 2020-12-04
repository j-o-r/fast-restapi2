'use strict';
import formidable from 'formidable';
/**
 * Determine a javascript type
 *
 * @private
 * @param {any} fn - Any let type
 * @returns {string} The object / let type name
 */
const jsType = (fn) => {
  if (typeof fn === 'undefined') {
    return 'undefined';
  }
  return ({}).toString.call(fn).match(/\s([a-z|A-Z]+)/)[1];
};
/**
 * @private
 * @param {string} s - is valid as a fileName
 * @return {boolean}
 */
const isFileName = (s) => {
  // A FILE MUST CONTAINS AT LEAST 1 '.'
  if (jsType(s) !== 'String') {
    return false;
  }
  // need ONE . at least for being a valid fileName
  if (!/[.]{1,}/.test(s)) {
    return false;
  }
  const validFileName = /^[a-zA-Z0-9_.-]{4,}$/;
  return validFileName.test(s);
};
/**
 * Get form data and optional file uploads
 *
 * @private
 * @param {Object} req - Class: http.IncomingMessage
 * @param  {Function} resolve - Promise resolve function
 * @param  {Function} reject - Promise reject function
 * @returns {void}
 */
const getPostForm = (req, resolve, reject) => {
  let form = new formidable.IncomingForm();
  form.encoding = 'utf-8';
  form.hash = 'md5';
  form.multiples = true;
  form.uploadDir = process.env.TMP || process.env.TMPDIR || process.env.TEMP || '/tmp' || process.cwd();
  if (typeof req === 'undefined') {
    reject(new Error('Request not defined'));
    return;
  }
  form.parse(req, (err, fields, postFiles) => {
    let files = [];
    if (err) {
      reject(err);
      return;
    };
    if (!fields) {
      fields = {};
    }
    for (let file in postFiles) {
      let fname = postFiles[file].name;
      if (!isFileName(fname)) {
        reject(new Error('Not an acceptable file name:' + fname));
        return;
      }
      let f = {
        src: postFiles[file].path,
        name: fname,
        type: postFiles[file].type,
        size: postFiles[file].size
      };
      files.push(f);
    }
    if (files.length > 0) {
      fields['UPLOADED_FORM_FILES'] = files;
    }
    resolve(fields);
  });
};

/**
 * @memberof module:fast-restapi2
 */
class ClientWrapper {
  /**
   * @param {Object} req - Class: http.IncomingMessage
   * @param {Object} res - Class: http.ServerResponse
   * @param  {Object} [query] - key value object
   */
  constructor (req, res, query) {
    this.req = req;
    this.res = res;
    if (!query || jsType(query) !== 'Object') {
      query = {};
    }
    this.query = query;
    // headerFields - headers to output */
    this.headerFields = {};
    // stream_node namespace to start streaming e.g. {namespace:[ */
    this.stream_node = '';
    // output mime format json
    this.stream_output = 'json';
    this.stream_write_count = 0;
    this.stream_prefix = '';
  }
  /**
   * Get posted data
   *
   * @returns {Promise<any>} this
   */
  getPost () {
    let self = this;

    let size;
    if (this.req.headers['content-length']) {
      size = parseInt(this.req.headers['content-length']);
    } if (!size) {
      size = 1024;
    }
    return new Promise((resolve, reject) => {
      let method = self.req.method === 'POST' || self.req.method === 'PUT' || self.req.method === 'PATCH' || false;
      if (!method) {
        reject(new Error('Missing Request Body'));
        return;
      }
      let content = this.req.headers['content-type'];
      if (content && /form/.test(content)) {
        getPostForm(self.req, resolve, reject);
        return;
      }
      // We only accept JSON
      if (content && !/application\/json/.test(content)) {
        reject(new Error('Only accepting application/json'));
        return;
      }
      let data = '';
      let post = {};
      let errormsg = 'undefined';
      let success = true;
      self.req.setEncoding('utf8');
      self.req.on('data', (chunk) => {
        // chunk is string || buffer/Object
        /// @ts-ignore
        if (chunk && success && data.length < size) {
          // Remove unwanted chars and WINDOWS CE compatible POSTS
          data += chunk.toString().replace(/[\x00-\x1F]/g, ''); // eslint-disable-line
        }
        /// @ts-ignore
        if (data.length > size) {
          errormsg = 'Post Body too large, missing content-length';
          success = false;
        }
      }).on('close', () => {
        // Premature end of connection
        success = false;
      }).on('error', () => {
        success = false;
      }).on('end', () => {
        if (success) {
          // Parse JSON
          try {
            post = JSON.parse(data);
          } catch (e) {
            reject(e);
          }
          resolve(post);
        } else {
          reject(new Error(errormsg));
        }
      });
    });
  }
  /**
   * Add a header to the server repsonse
   *
   * @param  {string} k - key
   * @param  {string|number} v - value
   * @param  {boolean} [override] - overwrite key
   * @returns {void} this
   */
  addHeader (k, v, override) {
    if (typeof override === 'undefined') {
      override = false;
    } else {
      override = true;
    }
    if (typeof (v) === 'number') {
      v = v.toString();
    }
    if (typeof (k) !== 'string' || typeof (v) !== 'string') {
      console.error('Key or value for Header not a string, ignoring input');
      return;
    }
    if (this.headerFields.hasOwnProperty(k) && !override) {
      console.error('Header already set:' + k);
      return;
    }
    this.headerFields[k] = v.toString();
  }
  /**
   * Get a header field
   *
   * @param  {string} k - Key to obtain
   * @returns {string|undefined} Key value
   */
  getHeader (k) {
    if (!this.headerFields.hasOwnProperty(k)) {
      return undefined;
    }
    /// @ts-ignore
    return this.headerFields[k];
  }
  /**
   * Write headers files, including a http status code
   *
   * @param  {number} status - http status to write
   * @returns {void}
   */
  writeHeaders (status) {
    if (typeof (status) !== 'number') {
      throw new Error('http status should be a number');
    }
    if (this.res) {
      this.res.writeHead(status, this.headerFields);
    }
  }
  /**
   * response.write
   *
   * @param {string|Buffer} message - string to write
   * @param {string} [encoding] - format to write out
   * https://nodejs.org/api/http.html#http_response_write_chunk_encoding_callback
   * @returns {void}
   */
  write (message, encoding) {
    if (this.res) {
      if (encoding) {
        this.res.write(message, encoding);
      } else {
        this.res.write(message);
      }
    }
  }
  /**
   * Serve something with a http status code
   *
   * @param  {number} status - http status code
   * @param  {any} [message] - any message
   * @returns {void}
   */
  serve (status, message) {
    if (typeof (status) !== 'number') {
      throw new Error('http status should be a number');
    }
    if (jsType(message) === 'Error') {
      message = message.toString();
    }
    if (typeof message === 'undefined') {
      message = '' + status;
    }
    this.writeHeaders(status);
    message = JSON.stringify(message);
    this.write(message);
    this.end();
  }
  /**
   * Open a stream
   * In json we start an array output '[' in xml an opentag <ns>
   * This is closed in closeStream
   *
   * @param  {string} [ns] - Start of an array namespace
   * @returns {void}
   */
  openStream (ns) {
    if (typeof (ns) !== 'string' || /^[_a-zA-Z0-9]{1,}$/.test(ns) === false) {
      // just do not break
      ns = 'undefined';
    }
    this.stream_node = ns;
    this.stream_prefix = '{"' + this.stream_node + '":[';
  }
  /**
   * Stream a javascript object
   *
   * @param  {Object} ob - Any object to take an array position in stream
   * @returns {void}
   */
  stream (ob) {
    if (this.stream_write_count === 0) {
      // if the object has an error prop write a 500
      if (jsType(ob) === 'Error') {
        this.writeHeaders(500);
      } else {
        this.writeHeaders(200);
      }
      this.write(this.stream_prefix);
    }
    if (jsType(ob) === 'Error' && this.stream_write_count > 0) {
      // silently close
      // when the headers are sent
      // TODO: log the error
      /* eslint-disable  no-console */
      console.log('stream error');
      console.error(ob);
      /* eslint-enable  no-console */
      return;
    }
    let message = JSON.stringify(ob);
    if (this.stream_write_count > 0) {
      message = ',' + message;
    }
    this.write(message);
    this.stream_write_count++;
  }
  /**
   * Close a stream with optional trailing headers
   * in JSON the array is closed, in XML the close tag is added.
   *
   * @param  {Object} [trailing] - Trailing headers
   * @returns {void}
   */
  closeStream (trailing) {
    if (this.stream_write_count === 0) {
      // 404, there was no WRITE
      this.writeHeaders(404);
      this.write(this.stream_prefix);
    }
    this.write(']}'); // close array and object
    if (trailing && typeof (trailing) === 'object') {
      this.res.addTrailers(trailing);
    }
    this.end();
  }
  /**
   * Close and destroy this object
   *
   * @returns {void}
   */
  end () {
    if (this.res) {
      try {
        this.res.end();
      } catch (e) {
        // Nothing
      }
    }
    delete this.req;
    delete this.res;
    this.query = {};
    this.headerFields = {};
    this.stream_node = '';
    // output mime format json
    this.stream_output = 'json';
    this.stream_write_count = 0;
    this.stream_prefix = '';
  }
};
export default ClientWrapper;
// vim: set ts=2 sw=2 et :
