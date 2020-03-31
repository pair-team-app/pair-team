#!/usr/bin/env node
'use strict';


import fetch from 'node-fetch';
import { API_ENDPT_URL, FETCH_CFG, ChalkStyles } from './consts'


export async function createPlayground({ doc, device, userID, teamID, buildID }) {
	// console.log('createPlayground()', { doc, device, userID, teamID, buildID });

	const cfg = { ...FETCH_CFG,
		body : JSON.stringify({ ...FETCH_CFG.body,
			action  : 'ADD_PLAYGROUND',
			payload : { ...doc, device,
			  user_id  : userID,
				team_id  : teamID,
				build_id : buildID
			}
		})
	};

	let response = await fetch(API_ENDPT_URL, cfg);
	// console.log('RESP -->>', await response.text());

 	try {
 		response = await response.json();

 	} catch (e) {
 		// console.log('%s Couldn\'t parse response! %s', ChalkStyles.ERROR, e);
// 		console.log('RESP -->>', await response.text());
 	}

	const { playground } = response;
  // console.log('ADD_PLAYGROUND -->>', { id : playground.id, buildID : playground.build_id });

	return ({ ...playground,
		id       : playground.id << 0,
		buildID : playground.build_id << 0
	});
}


export async function sendPlaygroundComponents({ userID, teamID, buildID, playgroundID, components }) {
	// console.log('sendPlaygroundComponents()', JSON.stringify({ userID, playgroundID, components    : { views : [[ ...components.views ].shift()] }}, null, 2));

	const cfg = { ...FETCH_CFG,
		body : JSON.stringify({ ...FETCH_CFG.body,
			action  : 'ADD_COMPONENTS',
			payload : { components,
				user_id       : userID,
				team_id       : teamID,
				build_id      : buildID,
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

	// console.log('ADD_COMPONENTS -->>', response.components);
	return (response.components);
}
