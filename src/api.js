#!/usr/bin/env node
'use strict';


import chalk from 'chalk';
import fetch from 'node-fetch';

import { API_ENDPT_URL, FETCH_CFG } from './consts'
import { encryptObj, encryptTxt } from './utils';


export async function createPlayground(userID, device, doc) {
// 	console.log('createPlayground()', { userID });

	const cfg = { ...FETCH_CFG,
		body : JSON.stringify({ ...FETCH_CFG.body,
			action  : 'ADD_PLAYGROUND',
			payload : { ...doc, device,
				user_id       : userID,
				html          : await encryptTxt(doc.html),
				styles        : await encryptObj(doc.styles),
				accessibility : await encryptObj(doc.accessibility)
			}
		})
	};

	let response = await fetch(API_ENDPT_URL, cfg);
	try {
		response = await response.json();

	} catch (e) {
		console.log('%s Couldn\'t parse response! %s', chalk.red.bold('ERROR'), e);
		console.log('RESP -->>', await response.text());
	}

//   console.log('ADD_PLAYGROUND -->>', { id : response.playground.id, buildID : response.playground.build_id });
	return (response.playground);
}


export async function sendPlaygroundComponents(userID, playgroundID, components) {
// 	console.log('sendPlaygroundComponents()', { userID, playgroundID });

	const cfg = { ...FETCH_CFG,
		body : JSON.stringify({ ...FETCH_CFG.body,
			action  : 'ADD_COMPONENTS',
			payload : { components,
				user_id       : userID,
				playground_id : playgroundID
			}
		})
	};

	let response = await fetch(API_ENDPT_URL, cfg);
	try {
		response = await response.json();

	} catch (e) {
		console.log('%s Couldn\'t parse response! %s', chalk.red.bold('ERROR'), e);
		console.log('::::', (await response.text()).slice(0, 512));
	}

// 	console.log('ADD_COMPONENTS -->>', response.components);
	return (response.components);
}
