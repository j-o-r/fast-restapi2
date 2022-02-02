#!/usr/bin/env node

import server from '../lib/api-server.js';
import TestController from './testController.js';


server.create('testcontroller', {port: 9022, host: '192.168.250.178'}, TestController).then((res) => {
	// console.log(res)
	console.log(res)
}).catch((error) => {
	console.log(error);
});

// vim: set ts=2 sw=2 et :
