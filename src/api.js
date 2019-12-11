#!/usr/bin/env node
'use strict';


import fetch from 'node-fetch';
import { API_ENDPT_URL, FETCH_CFG, ChalkStyles } from './consts'


export async function createPlayground(buildID, userID, teamID, device, doc) {
// 	console.log('createPlayground()', { buildID, userID, teamID, device, doc });

	const cfg = { ...FETCH_CFG,
		body : JSON.stringify({ ...FETCH_CFG.body,
			action  : 'ADD_PLAYGROUND',
			payload : { ...doc, device,
				build_id : buildID,
				user_id  : userID,
				team_id  : teamID
			}
		})
	};

	let response = await fetch(API_ENDPT_URL, cfg);
//	console.log('RESP -->>', await response.text());

 	try {
 		response = await response.json();

 	} catch (e) {
 		console.log('%s Couldn\'t parse response! %s', ChalkStyles.ERROR, e);
// 		console.log('RESP -->>', await response.text());
 	}

 //   console.log('ADD_PLAYGROUND -->>', { id : response.playground.id, buildID : response.playground.build_id });
 	return ({ ...response.playground,
 		buildID : response.playground.build_id << 0
 	});
}


export async function sendPlaygroundComponents(userID, playgroundID, components) {
// 	console.log('sendPlaygroundComponents()', JSON.stringify({ userID, playgroundID, components }, null, 2));

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
//	console.log('RESP -->>', response.headers.raw(), await response.text());
//	console.log('RESP -->>', await response.text());

	try {
		response = await response.json();

	} catch (e) {
		console.log('%s Couldn\'t parse response! %s', ChalkStyles.ERROR, e);
	}

// 	console.log('ADD_COMPONENTS -->>', response.components);
	return (response.components);
}
