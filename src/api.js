#!/usr/bin/env node
'use strict';


import chalk from 'chalk';
import fetch from 'node-fetch';

import { API_ENDPT_URL, FETCH_CFG } from './consts'
import { encryptObj, encryptTxt } from './utils';


export async function createPlayground(userID, device, doc) {
	const cfg = { ...FETCH_CFG,
		body : JSON.stringify({ ...FETCH_CFG.body,
			action  : 'ADD_PLAYGROUND',
			payload : { ...doc, device,
				user_id : userID,
				html    : await encryptTxt(doc.html),
				styles  : await encryptObj(doc.styles)
			}
		})
	};

	let response = await fetch(API_ENDPT_URL, cfg);
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
	let response = await fetch(API_ENDPT_URL, { ...FETCH_CFG,
		body : JSON.stringify({ ...FETCH_CFG.body,
			action  : 'ADD_COMPONENTS',
			payload : { components,
				playground_id : playgroundID
			}
		})
	});

	try {
// 			console.log('::::', (await response.text()).slice(0, 512));
		response = await response.json();

	} catch (e) {
		console.log('%s Couldn\'t parse response! %s', chalk.red.bold('ERROR'), e);
	}

	return (response.components);
}
