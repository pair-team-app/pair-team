#!/usr/bin/env node
'use strict';


import fetch from 'node-fetch';
import { API_ENDPT_URL, FETCH_CFG, ChalkStyles } from './consts'


export async function createPlayground({ doc, device, userID, teamID, buildID }) {
	console.log('createPlayground()', { doc, device, userID, teamID, buildID });

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
  console.log('ADD_PLAYGROUND -->>', { id : playground.id, buildID : playground.build_id });

	return ({ ...playground,
		id       : playground.id << 0,
		buildID : playground.build_id << 0
	});
}


export async function createTeam(userID, title) {
	console.log('createTeam()', { userID, title });

	const cfg = { ...FETCH_CFG,
		body : JSON.stringify({ ...FETCH_CFG.body,
			action  : 'CREATE_TEAM',
			payload : { title,
				user_id     : userID,
				description : null,
				image       : null,
				rules       : null,
				invites     : null
			}
		})
	};

	let response = await fetch(API_ENDPT_URL, cfg);
	// console.log('RESP -->>', await response.text());

	try {
		response = await response.json();

	} catch (e) {
		console.log('%s Couldn\'t parse response! %s', ChalkStyles.ERROR, e);
	}

	console.log('CREATE_TEAM -->>', { response });

	return (response.team);
}



export async function disableAccount(user) {
	console.log('disableAccount()', JSON.stringify({ user }, null, 2));

	const cfg = { ...FETCH_CFG,
		body : JSON.stringify({ ...FETCH_CFG.body,
			action  : 'DISABLE_ACCOUNT',
			payload : { user_id : user.id }
		})
	};

	let response = await fetch(API_ENDPT_URL, cfg);
	try {
		response = await response.json();

	} catch (e) {
		console.log('%s Couldn\'t parse response! %s', ChalkStyles.ERROR, e);
	}

//	console.log('DISABLE_ACCOUNT -->>', response);
	return (response.user);
}


export async function loginUser(user) {
	// console.log('loginUser()', JSON.stringify({ user }, null, 2));

	const cfg = { ...FETCH_CFG,
		body : JSON.stringify({ ...FETCH_CFG.body,
			action  : 'LOGIN',
			payload : { ...user,
				username : user.email
			}
		})
	};

	let response = await fetch(API_ENDPT_URL, cfg);
	try {
		response = await response.json();

	} catch (e) {
		console.log('%s Couldn\'t parse response! %s', ChalkStyles.ERROR, e);
		console.log('RESP -->>', await response.text());
	}

	// console.log('LOGIN -->>', response);

	const status = parseInt(response.status, 16);
	if (status !== 0x11) {
		return (response.user);
	}

	return (response.user);
}


export async function registerUser(user) {
	console.log('registerUser()', JSON.stringify({ user }, null, 2));

	const cfg = { ...FETCH_CFG,
		body : JSON.stringify({ ...FETCH_CFG.body,
			action  : 'REGISTER',
			payload : { ...user,
				username : user.email,
				types    : ['user', 'signup', 'npm'],
				avatar   : null,
				invite   : null
			}
		})
	};

	let response = await fetch(API_ENDPT_URL, cfg);
	try {
		response = await response.json();

	} catch (e) {
		console.log('%s Couldn\'t parse response! %s', ChalkStyles.ERROR, e);
	}

	console.log('REGISTER -->>', response);
	return (response.user);
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

	// console.log('ADD_COMPONENTS -->>', response);
	console.log('ADD_COMPONENTS -->>', { components : response.components });
	return (response.components);
}


export async function teamLookup(userID) {
	console.log('teamLookup()', JSON.stringify({ userID }, null, 2));

	const cfg = { ...FETCH_CFG,
		body : JSON.stringify({ ...FETCH_CFG.body,
			action  : 'TEAM_LOOKUP',
			payload : { user_id : userID }
		})
	};

	let response = await fetch(API_ENDPT_URL, cfg);
	try {
		response = await response.json();

	} catch (e) {
		console.log('%s Couldn\'t parse response! %s', ChalkStyles.ERROR, e);
	}

	const { team } = response;
	console.log('TEAM_LOOKUP -->>', { team });

	return (team);
}



export async function userTeams(userID) {
	// console.log('userTeams()', JSON.stringify({ userID }, null, 2));

	const cfg = { ...FETCH_CFG,
		body : JSON.stringify({ ...FETCH_CFG.body,
			action  : 'USER_TEAMS',
			payload : { user_id : userID }
		})
	};

	let response = await fetch(API_ENDPT_URL, cfg);
	// console.log('RESP -->>', await response.text());

	try {
		response = await response.json();

	} catch (e) {
		console.log('%s Couldn\'t parse response! %s', ChalkStyles.ERROR, e);
	}

	const { teams } = response;
	// console.log('USER_TEAMS -->>', { teams });

	return (teams);
}
