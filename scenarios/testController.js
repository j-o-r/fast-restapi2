'use strict';

import path from 'path';

class TestController {
	// We use the static methods
	//
	// Example of an interface method
	// This should be the default action on an object
	static index(client) {
		client.serve(200, { 'joe': ['bar'] });
	}

	static params(client, params) {
		// http://..../testcontroller/params/param1/param2
		client.serve(200, { params: params });
	}
	static query(client) {
		// if(!client.query.hasOwnProperty('pipo')) {
		//  console.log('Error hasOwnProperty')
		// }
		// http://..../testcontroller?pipo=circus
		// if(client.query.hasOwnProperty('pipo')) {
		//  console.log('allright')
		// }
		client.serve(200, { query: client.query });
	}

	// This should never get called === hidden (_)
	// The client is timed out on such a request
	// But it's better to close the connection
	static _hidden(client) {
		client.serve(200, 'I am not here');
	}
	// Just return the content
	static echo(client) {
		client.getPost().then((data, files) => {
			client.serve(200, { data });
		}).catch((error) => {
			client.serve(500, error);
		});
	}
	// Return an Error,
	// an Error should be converted to a string
	static error(client) {
		client.serve(500, new Error('an error'));
	}

	static stream(client) {
		// Create a stream
		// which is quite a different approach
		// 1000 objects to stream
		let i = 0;
		let len = 3;
		let content = [];
		for (; i < len; i++) {
			content.push({
				id: i,
				date: new Date(),
				collection: ['one', 'two'],
				escape: ' escape " me'
			});
		}
		// content.push('STRING')
		content.push([1, 2, 3, 4, 5]);
		content.push(new Date());
		content.push({});
		i = 0;
		client.openStream('test');
		for (; i < content.length; i++) {
			client.stream(content[i]);
		}
		let d = new Date('2001-12-01');
		// Add a Trailing header
		client.closeStream({ 'what': d.toString() });
	}

	static stream404(client) {
		// Create a stream
		// but since we have no content to stream
		// it will serve a 404
		let i = 0;
		let content = [];

		i = 0;
		client.openStream('test');
		for (; i < content.length; i++) {
			client.stream(content[i]);
		}
		let d = new Date('2001-12-01');
		// Add a Trailing header
		client.closeStream({ 'what': d.toString() });
	}

	static stream500(client) {
		// Create a stream
		// but the first object will create a 500
		let i = 0;
		let content = [];
		content.push(new Error('This is an error'));
		i = 0;
		client.openStream('test');
		for (; i < content.length; i++) {
			client.stream(content[i]);
		}
		let d = new Date('2001-12-01');
		// Add a Trailing header
		client.closeStream({ 'what': d.toString() });
	}

	static stream200(client) {
		// Create a stream
		// The error will not show in the stream
		// but is outputted to standard out
		let i = 0;
		let len = 3;
		let content = [];
		for (; i < len; i++) {
			content.push({
				id: i,
				date: new Date(),
				collection: ['one', 'two'],
				escape: ' escape " me'
			});
		}
		content.push(new Error('Ignore me'));
		// content.push('Ignore me');
		i = 0;
		client.openStream('test');
		for (; i < content.length; i++) {
			client.stream(content[i]);
		}
		let d = new Date('2001-12-01');
		// Add a Trailing header
		client.closeStream({ 'what': d.toString() });
	}

	static form(client) {
		// Formidable
		client.getPost().then((result) => {
			client.serve(200, result);
		}).catch((error) => {
			client.serve(500, error);
		});
	}

	static contenttype(client) {
		client.addHeader('Content-Type', 'plain/text', true);
		client.serve(200, 'i,am,plain,text');
	}
	static serveValidFile(client, params) {
		let mime;
		const file = params[0];
		if (file === 'test.text') {
			mime = 'plain/text';
		}
		const fp = new URL('file://' + path.resolve(process.cwd(), 'scenarios', 'www', file));
		client.serveFile(fp, mime).then(() => {
			// after serving, the client is disposed
		}).catch((error) => {
			console.error(error);
		});
	}

	static serveFolder(client) {
		// this will error
		// unable to serve a folder
		const file = new URL('file://' + path.resolve(process.cwd(), 'scenarios', 'www'));
		client.serveFolder(file).then(() => {
			// nothing
			// after serving, the client is disposed
			// a `not found file` is not an error in this context
		}).catch((error) => {
			console.error(error);
		});
	}
	static serveFolderData(client) {
		// this will error
		// unable to serve a folder
		const file = new URL('file://' + path.resolve(process.cwd(), 'scenarios', 'www'));
		client.serveFolderData(file).then(() => {
			// nothing
			// after serving, the client is disposed
			// a `not found file` is not an error in this context
		}).catch((error) => {
			console.error(error);
		});
	}

	static serveInvalidFile(client) {
		const file = new URL('file://i/do/not.exsist');
		client.serveFile(file).then(() => {
			// nothing
			// after serving, the client is disposed
		}).catch((error) => {
			console.error(error);
		});
	}
}
export default TestController;
