#!/usr/bin/env node
/**
 * Spawn the server on 8080,
 * Just for browser testing
 */
import TestController from './testController.js';
import server from '../lib/api-server.js';

/** @param {import('parker-promise').ParkerPromise} p */
server.create('testcontroller', { port: 8080, host: '127.0.0.1' }, TestController).then((res) => {
	console.log(res)
}).catch((error) => {
	console.log(error);
});
process.stdin.resume();
