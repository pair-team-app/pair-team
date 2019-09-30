#!/usr/bin/env node
'use strict';


import chalk from 'chalk';
import fetch from 'node-fetch';
import projectName from 'project-name';

const API_ENDPT_URL = 'https://api.designengine.ai/playground.php';


export async function queryPlayground(playgroundID) {
	console.log('%s Queueing playground…', chalk.cyan.bold('INFO'));

	let response = await fetch(API_ENDPT_URL, {
		method  : 'POST',
		headers : {
			'Content-Type' : 'application/json'
		},
		body    : JSON.stringify({
			action        : 'PLAYGROUND',
			playground_id : playgroundID,
			title         : projectName()
		})
	});

	try {
		response = await response.json();

	} catch (e) {
		console.log('%s Couldn\'t parse response! %s', chalk.red.bold('ERROR'), e);
	}

//  console.log('PLAYGROUND -->>', response);
	return (response);
}

export async function sendComponents(extract) {
	let response = await fetch(API_ENDPT_URL, {
		method  : 'POST',
		headers : { 'Content-Type' : 'application/json' },
		body    : JSON.stringify({
			action        : 'ADD_COMPONENTS',
			playground_id : playgroundID,
			elements      : extract.elements
		})
	});

	try {
		response = await response.json();
//			console.log('::::', response);

	} catch (e) {
		console.log('%s Couldn\'t parse response! %s', chalk.red.bold('ERROR'), e);
	}

	return (response);
}