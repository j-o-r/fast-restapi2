'use strict';
import formidable, { errors as formidableErrors } from 'formidable';
import fs from 'node:fs';
import getMime from './mime.js';
/**
* @typedef {typeof import('http')} HTTP
*/
/**
* @typedef {Object} fileUpload
* @property {string} src - The source path of the file.
* @property {string} name - The name of the file.
* @property {string} type - The MIME type of the file.
* @property {number} size - The size of the file in bytes.
*/
/**
* @typedef {Object} PostFormData
* @property {Object} values
* @property {fileUpload[]} files 
*/
/**
* @callback FormResolve
* @param {PostFormData} argument
*/
/**
* @callback Reject
* @param {Error} argument
*/
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
* 'Code Safe' has own prop
*
* @param {any} o - object to examine
* @param {string} p - property to look for
* @returns {boolean}
*/
const hasProp = (o, p) => {
	if (typeof o === 'undefined') {
		return false;
	}
	return Object.prototype.hasOwnProperty.call(o, p);
};

/**
* @private
* @param {string} s - is valid as a fileName
* @returns {boolean}
*/
const isFileName = (s) => {
	// and may contain spaces
	if (typeof s !== 'string' || s.trim().length === 0) {
		return false;
	}
	return true;
};

/**
 * Serve a folder with optional file content.
 *
 * @param {ClientWrapper} client - Client request, response wrapper.
 * @param {URL} folder - Path to the folder.
 * @param {boolean} serveData - If true, includes file content in the response.
 * @returns {Promise<>}
 */
function serveFolder(client, folder, serveData = false) {

	return new Promise((resolve, reject) => {
		if (!folder) {
			reject(new Error('Parameter folder not found'));
			return;
		}
		// Create async scope
		(async () => {
			try {
				const stat = await fs.promises.stat(folder);
				if (!stat.isDirectory()) {
					reject(new Error('File not found'));
					return;
				}

				const entries = await fs.promises.readdir(folder, { withFileTypes: true });

				client.openStream('index');

				for (const entry of entries) {
					if (!entry.name.startsWith('.')) {
						const entryPath = new URL(`file://${folder.pathname}/${entry.name}`);

						if (entry.isDirectory()) {
							client.stream({ name: entry.name, type: 'folder' });
						} else if (serveData) {
							const fileStat = await fs.promises.stat(entryPath);
							const modified = fileStat.mtime.toUTCString();
							let content;
							let data;

							try {
								// Try to read as JSON
								data = JSON.parse(await fs.promises.readFile(entryPath, 'utf8'));
								content = 'js';
							} catch (e) {
								// If not JSON, encode as base64url
								data = (await fs.promises.readFile(entryPath)).toString('base64url');
								content = 'base64url';
							}

							client.stream({ name: entry.name, modified, type: 'file', content, data });
						} else {
							// Only send metadata when serveData is false
							const fileStat = await fs.promises.stat(entryPath);
							const modified = fileStat.mtime.toUTCString();
							client.stream({ name: entry.name, modified, type: 'file' });
						}
					}
				}
				client.closeStream();
				client.end();
				resolve();
			} catch (error) {
				reject(error);
			}
		})();
	});
}
/**
* Stream a file to the client
* A resolve is succefull, stuil need to handle the errors
*
* @private
* @param {ClientWrapper} client - Client response request wrapper
* @param {URL} file - full path to file
* @param {string} [mime] - mimtype (overrule standard `application/json`)
* @returns {Promise<>}
*/
const serveFile = (client, file, mime) => {
	return new Promise((resolve, reject) => {
		if (!file) {
			const error = new Error('File parameter empty');
			reject(error);
			return;
		}
		// async block
		(async () => {
			let stat;
			try {
				stat = await fs.promises.stat(file);
			} catch (_e) {
				// console.error(_e);
				const error = new Error('File not found.');
				reject(error);
				return;
			}
			if (!stat.isFile()) {
				const error = new Error('File not found.');
				reject(error);
				return;
			}
			client.addHeader('Last-Modified', stat.mtime.toUTCString());
			client.addHeader('Content-Type', mime ?? getMime(file.pathname), true);
			client.addHeader('Content-Length', stat.size);
			if (client.req.method === 'HEAD') {
				client.writeHeaders(200);
				client.end();
				resolve();
				return;
			}

			const ifModifiedSince = client.req.headers['if-modified-since'];
			// compare on UTCString
			if (ifModifiedSince && new Date(ifModifiedSince) >= new Date(stat.mtime.toUTCString())) {
				client.addHeader('Content-Length', 0, true);
				client.writeHeaders(304);
				client.end();
				resolve();
				return;
			}

			client.writeHeaders(200);
			// Directly pipe the stream to avoid manual event handling
			const stream = fs.createReadStream(file);
			stream.pipe(client.res);
			stream.on('end', () => {
				// Destroy the client
				client.end();
				resolve();
			})
		})()
	});
};
/**
* Get form data and optional file uploads
*
* @private
* @param {object} req - Class: http.IncomingMessage
* @returns {Promise<PostFormData>}
*/
const getPostForm = async (req) => {
	const form = formidable({ multiple: true });
	let values = {};
	let files = [];
	let postFiles, postValues;
	[postValues, postFiles] = await form.parse(req);
	for (const v in postValues) {
		values[v] = postValues[v][0];
	}
	for (const file in postFiles) {
		// @ts-ignore
		const up = postFiles[file][0];
		const fname = up.originalFilename;
		if (!isFileName(fname)) {
			throw new Error('Not an acceptable file name:' + fname);
		}
		const f = {
			// @ts-ignore
			src: up.filepath,
			name: fname,
			// @ts-ignore
			type: up.mimetype,
			// @ts-ignore
			size: up.size
		};
		files.push(f);
	}
	return { values, files }
};

/**
* @memberof module:fast-restapi2
*/
class ClientWrapper {
	/**
	* @param {import('http').IncomingMessage} req - Class: http.IncomingMessage
	* @param {import('http').ServerResponse} res - Class: http.ServerResponse
	* @param  {object} [query] - key value object
	*/
	constructor(req, res, query) {
		this.req = req;
		this.res = res;
		if (!query || jsType(query) !== 'Object') {
			query = {};
		}
		this.query = query;
		/**
		 * @type {import('http').OutgoingHttpHeaders}
		 */
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
	 * @returns {Promise<PostFormData|any>} The parsed JSON data from the request body
	 */
	async getPost() {
		const { method, headers } = this.req;
		const contentLength = parseInt(headers['content-length'] || '1024', 10);
		const contentType = headers['content-type'];

		if (!['POST', 'PUT', 'PATCH'].includes(method)) {
			throw new Error('Missing Request Body');
		}

		if (contentType && !/json/.test(contentType)) {
			if (/form/.test(contentType)) {
				return await getPostForm(this.req);
			}
			throw new Error('Only json is allowed');
		}

		return new Promise((resolve, reject) => {
			let body = '';
			this.req.setEncoding('utf8');

			this.req.on('data', chunk => {
				if (body.length + chunk.length > contentLength) {
					reject(new Error('Post Body too large, missing content-length'));
					return;
				}
				body += chunk;
			});

			this.req.on('error', reject);

			this.req.on('end', () => {
				try {
					resolve(JSON.parse(body));
				} catch (e) {
					reject(e);
				}
			});
		});
	}
	/**
	* Add a header to the server repsponse
	* @todo : Do we realy need to be so strict?
	* https://www.rfc-editor.org/rfc/rfc7230#section-3.2
	* Fields are case-insensitive, so we use lowercase by default
	* to prevent double headers
	*
	* @param  {string} k - key
	* @param  {string|number} v - value
	* @param  {boolean} [override] - overwrite key
	* @throws {Error}
	*/
	addHeader(k, v, override) {
		if (typeof override === 'undefined') {
			override = false;
		} else {
			override = true;
		}
		if (typeof (v) === 'number') {
			v = v.toString();
		}
		if (typeof (k) !== 'string' || typeof (v) !== 'string') {
			throw new Error('Key or value for Header not a string, ignoring input');
		}
		k = k.toLowerCase();
		if (hasProp(this.headerFields, k) && !override) {
			throw new Error('Header already set: ' + k);
		}
		this.headerFields[k] = v.toString();
	}
	/**
	* Get a header field
	*
	* @param  {string} k - Key to obtain
	* @returns {string|undefined} Key value
	*/
	getHeader(k) {
		if (typeof k !== 'string') {
			return;
		}
		k = k.toLowerCase();
		if (!hasProp(this.headerFields, k)) {
			return undefined;
		}
		/// @ts-ignore: is a string
		return this.headerFields[k];
	}
	/**
	* Write headers files, including a http status code
	*
	* @param  {number} status - http status to write
	* @returns {void}
	*/
	writeHeaders(status) {
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
	* @param {BufferEncoding} [encoding] - format to write out
	* https://nodejs.org/api/http.html#http_response_write_chunk_encoding_callback
	* @returns {void}
	*/
	write(message, encoding) {
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
	serve(status, message) {
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
		const ct = this.getHeader('Content-Type');
		if (ct) {
			// only stringify if contenttype is javascript or json
			if (ct.search('json') > -1 || ct.search('javascript') > -1) {
				message = JSON.stringify(message);
			}
		}
		this.write(message);
		this.end();
	}
	/**
	* Stream a file to the client
	* (inluding check on HEAD and if-modified-since)
	* the client is disposed after this call
	* except if there is an arror during serving
	*
	* @param {URL} file - full path to file
	* @param {string} [mime] - mimtype (overrule standard `application/json`)
	* @returns {Promise<>}
	*/
	async serveFile(file, mime) {
		return serveFile(this, file, mime);
	}
	/**
	* Stream a a folder to the client
	* the client is disposed after this call
	*
	* @param {URL} folder - full path to folder
	* @returns {Promise<>}
	*/
	serveFolder(folder) {
		return serveFolder(this, folder);
	}
	/**
	* Stream a a folder to the client, file data is added
	* the client is disposed after this call
	*
	* @param {URL} folder - full path to folder
	* @returns {Promise<>}
	*/
	serveFolderData(folder) {
		return serveFolder(this, folder, true);
	}

	/**
	* Open a stream
	* Starts an array output '['
	* This is closed in closeStream
	*
	* @param  {string} [ns] - Start of an array namespace
	* @returns {void}
	*/
	openStream(ns) {
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
	* @param  {object} ob - Any object to take an array position in stream
	* @returns {void}
	*/
	stream(ob) {
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
	* @param  {object} [trailing] - Trailing headers
	* @returns {void}
	*/
	closeStream(trailing) {
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
	end() {
		if (this.res) {
			try {
				this.res.end();
			} catch (_e) {
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
}
export {
	ClientWrapper,
	jsType,
	hasProp
};
