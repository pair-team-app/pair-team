#!/usr/bin/env node
'use strict';


import chalk from 'chalk';
import fetch from 'node-fetch';

import { API_ENDPT_URL } from './consts';


export async function createPlayground(userID, device, doc) {
	let response = await fetch(API_ENDPT_URL, {
		method  : 'POST',
		headers : { 'Content-Type' : 'application/json' },
		body    : JSON.stringify({
			action  : 'ADD_PLAYGROUND',
			payload : { ...doc, device,
				user_id : userID,
			}
		})
	});

	try {
// 		console.log('RESP -->>', await response.text());
		response = await response.json();

	} catch (e) {
		console.log('%s Couldn\'t parse response! %s', chalk.red.bold('ERROR'), e);
	}

//   console.log('PLAYGROUND -->>', response);
	return (response.playground);
}


export async function sendPlaygroundComponents(playgroundID, components) {
	let response = await fetch(API_ENDPT_URL, {
		method  : 'POST',
		headers : { 'Content-Type' : 'application/json' },
		body    : JSON.stringify({
			action  : 'ADD_COMPONENTS',
			payload : { components,
				playground_id : playgroundID
			}
		})
	});

	try {
		response = await response.json();
// 			console.log('::::', await response.text());

	} catch (e) {
		console.log('%s Couldn\'t parse response! %s', chalk.red.bold('ERROR'), e);
	}

	return (response.components);
}
