'use strict';
import formidable from 'formidable';
import fs from 'fs';
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
* Serve a folder, and the content of the files but skip files starting with .
*
* @param  {ClientWrapper} client - Client request, response wrapper.
* @param {URL} folder - path to folder
* @returns {Promise}
*/
const serveFolderData = (client, folder) => {
	return new Promise((resolve, _reject) => {
		if (!folder) {
			const error = new Error('File not found');
			client.serve(404, error);
			resolve('ok');
			return;
		}
		let stat;
		try {
			stat = fs.statSync(folder);
		} catch (_e) {
			const error = new Error('File not found');
			client.serve(404, error);
			resolve('ok');
			return;
		}
		if (!stat.isDirectory()) {
			const error = new Error('File not found');
			client.serve(404, error);
			resolve('ok');
			return;
		}

		fs.readdir(folder, { withFileTypes: true }, (error, files) => {
			if (error) {
				client.serve(500, new Error('Error serving index'));
				resolve('ok');
				return;
			}
			client.openStream('index');
			files.forEach((entry) => {
				// Skip hidden folders (starting with a dot)
				if (!/^\./.test(entry.name)) {
					if (entry.isDirectory()) {
						client.stream({ name: entry.name, type: 'folder' });
					} else {
						const fu = new URL('file://' + folder.pathname + '/' + entry.name);
						const stat = fs.statSync(fu);
						const modified = stat.mtime.toUTCString();
						const buf = fs.readFileSync(fu);
						let data;
						let content = 'js';
						try {
							data = JSON.parse(buf.toString());
						} catch (e) {
							content = 'base64url';
							data = buf.toString('base64url');
						}
						client.stream({ name: entry.name, modified, type: 'file', content, data });
					}
				}
			});
			client.closeStream();
			client.end();
			resolve('ok');
		});
	});
};

/**
* Serve a folder, but skip files starting with a .
*
* @param  {ClientWrapper} client - Client request, response wrapper.
* @param {URL} folder - path to folder
* @returns {Promise}
*/
const serveFolder = (client, folder) => {
	return new Promise((resolve, _reject) => {
		if (!folder) {
			const error = new Error('File not found');
			client.serve(404, error);
			resolve('ok');
			return;
		}
		let stat;
		try {
			stat = fs.statSync(folder);
		} catch (_e) {
			const error = new Error('File not found');
			client.serve(404, error);
			resolve('ok');
			return;
		}
		if (!stat.isDirectory()) {
			const error = new Error('File not found');
			client.serve(404, error);
			resolve('ok');
			return;
		}

		fs.readdir(folder, { withFileTypes: true }, (error, files) => {
			if (error) {
				client.serve(500, new Error('Error serving index'));
				resolve('ok');
				return;
			}
			client.openStream('index');
			files.forEach((entry) => {
				// Skip hidden folders (starting with a dot)
				if (!/^\./.test(entry.name)) {
					if (entry.isDirectory()) {
						client.stream({ name: entry.name, type: 'folder' });
					} else {
						const fu = new URL('file://' + folder.pathname + '/' + entry.name);
						const stat = fs.statSync(fu);
						const modified = stat.mtime.toUTCString();
						client.stream({ name: entry.name, modified, type: 'file' });
					}
				}
			});
			client.closeStream();
			client.end();
			resolve('ok');
		});
	});
};
/**
* Stream a file to the client
*
* @private
* @param {ClientWrapper} client - Client response request wrapper
* @param {URL} file - full path to file
* @param {string} [mime] - mimtype (overrule standard `application/json`)
*/
const serveFile = (client, file, mime) => {
	return new Promise((resolve, reject) => {
		if (!file) {
			const error = new Error('File not found');
			client.serve(404, error);
			resolve('ok');
			return;
		}
		let stat;
		try {
			stat = fs.statSync(file);
		} catch (_e) {
			const error = new Error('File not found');
			client.serve(404, error);
			resolve('ok');
			return;
		}
		if (!stat.isFile()) {
			const error = new Error('File not found');
			client.serve(404, error);
			resolve('ok');
			return;
		}
		if (mime) {
			// force headers mime-type
			client.addHeader('Content-Type', mime, true);
		} else {
			mime = getMime(file.pathname);
		}
		client.addHeader('Last-Modified', stat.mtime.toUTCString());
		if (client.req.headers['if-modified-since'] === stat.mtime.toUTCString() || client.req.method === 'HEAD') {
			if (client.req.method === 'HEAD') {
				client.addHeader('Content-Length', stat.size);
				client.writeHeaders(200);
			} else {
				client.addHeader('Content-Length', '0');
				client.writeHeaders(304);
			}
			client.end();
			resolve(true);
			return;
		}
		client.writeHeaders(200);
		fs.createReadStream(file, {
			'flags': 'r',
			'encoding': 'binary'
		}).addListener('data', (chunk) => {
			try {
				client.write(chunk, 'binary');
			} catch (_e) {
				// Nothing
			}
		}).addListener('end', () => {
			client.end();
			resolve(true);
		}).addListener('error', (error) => {
			// This is a true error
			console.error(error);
			reject(new Error('Unable to serve file'));
		});
	});
};
/**
* Get form data and optional file uploads
*
* @private
* @param {object} req - Class: http.IncomingMessage
* @param  {FormResolve} resolve - Promise resolve function
* @param  {Reject} reject - Promise reject function
* @returns {void}
*/
const getPostForm = (req, resolve, reject) => {
	const form = formidable(
		{
			multiples: true
		});
	if (typeof req === 'undefined') {
		reject(new Error('Request not defined'));
		return;
	}
	form.parse(req,
		(err, fields, postFiles) => {
			const files = [];
			if (err) {
				console.error(err);
				reject(err);
				return;
			}
			if (!fields) {
				fields = {};
			}
			for (const file in postFiles) {
				// @ts-ignore
				const fname = postFiles[file].originalFilename;
				if (!isFileName(fname)) {
					reject(new Error('Not an acceptable file name:' + fname));
					return;
				}
				const f = {
					// @ts-ignore
					src: postFiles[file].filepath,
					name: fname,
					// @ts-ignore
					type: postFiles[file].mimetype,
					// @ts-ignore
					size: postFiles[file].size
				};
				files.push(f);
			}
			resolve({ values: fields, files });
		});
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
	* @returns {Promise<any>} this
	*/
	getPost() {
		// const self = this;

		let size;
		// limit size on unkown length
		if (this.req.headers['content-length']) {
			size = parseInt(this.req.headers['content-length']);
		} if (!size) {
			size = 1024;
		}
		return new Promise((resolve, reject) => {
			const method = this.req.method === 'POST' || this.req.method === 'PUT' || this.req.method === 'PATCH' || false;
			if (!method) {
				reject(new Error('Missing Request Body'));
				return;
			}
			const content = this.req.headers['content-type'];
			if (content && /form/.test(content)) {
				getPostForm(this.req, resolve, reject);
				return;
			}
			// We only accept JSON in content body
			if (content && !/json/.test(content)) {
				reject(new Error('Only json is allowed'));
				return;
			}
			let data = '';
			let post = {};
			let errormsg = 'undefined';
			let success = true;
			this.req.setEncoding('utf8');
			this.req.on('data', (chunk) => {
				// chunk is string || buffer/Object
				if (chunk && success && data.length < size) {
					data += chunk.toString();
					// --VV-- OLD windows mobile JSON hack --VV--
					// data += chunk.toString()// .replace(/[x00-x1F]/g, '');
				}
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
	* Add a header to the server repsponse
	* @todo : Do we realy need to be so strict?
	* https://www.rfc-editor.org/rfc/rfc7230#section-3.2
	* Fields are case-insensitive, so we use lowercase by default
	* to prevent double headers
	*
	* @param  {string} k - key
	* @param  {string|number} v - value
	* @param  {boolean} [override] - overwrite key
	* @returns {void} this
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
			console.error(new Error('Key or value for Header not a string, ignoring input'));
			return;
		}
		k = k.toLowerCase();
		if (hasProp(this.headerFields, k) && !override) {
			console.error(new Error('Header already set: ' + k));
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
	* @returns {Promise<string>}
	*/
	serveFile(file, mime) {
		return serveFile(this, file, mime);
	}
	/**
	* Stream a a folder to the client
	* the client is disposed after this call
	*
	* @param {URL} folder - full path to folder
	* @returns {Promise<string>}
	*/
	serveFolder(folder) {
		return serveFolder(this, folder);
	}
	/**
	* Stream a a folder to the client
	* the client is disposed after this call
	*
	* @param {URL} folder - full path to folder
	* @returns {Promise<string>}
	*/
	serveFolderData(folder) {
		return serveFolderData(this, folder);
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
