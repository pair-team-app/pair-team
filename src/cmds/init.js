#!/usr/bin/env node
'use strict';


import promise from 'bluebird';
import fs from 'fs';
import inquirer from 'inquirer';

import { createTeam, loginUser, registerUser, userTeams } from '../api';
import { initCache, getUser, writeTeam, writeUser, reset, flushAll, getTeam } from '../cache';
import { ChalkStyles } from '../consts';

promise.promisifyAll(require('fs'));


(async()=> {
	await initCache();
	await flushAll();

	console.log('USER >>', { user : await getUser() });

	const createTeamForm = async(userID)=> {
    const prompt = await inquirer.prompt([{
      type     : 'input',
      name     : 'title',
      message  : 'Enter a new team name',
      validate : (val)=> (val.length > 0)
    }]);

    return (await createTeam(userID, prompt.title));
  };

	const loginForm = async()=> {
    const prompt = await inquirer.prompt([{
      type     : 'input',
      name     : 'email',
      message  : 'Enter Email Address',
      validate : (val)=> ((/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i.test(String(val))) ? true : 'Invalid email format')
    }, {
      type     : 'password',
      name     : 'password',
      mask     : '*',
      message  : 'Enter Password',
      validate : (val)=> (val.length > 0)
    }]);

    return (await loginUser(prompt));
  };

	const registerForm = async()=> {
    const questions = [{
      type     : 'input',
      name     : 'email',
      message  : 'Enter Email Address',
      validate : (val)=> ((/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i.test(String(val))) ? true : 'Invalid email format')
    }, {
      type     : 'password',
      name     : 'password',
      mask     : '*',
      message  : 'Enter Password',
      validate : (val)=> (val.length > 0)
    }];

    const prompt = await inquirer.prompt(questions);
    return (await registerUser(prompt));
  };

	const teamsForm = async(userID, teams)=> {
    const prompt = await inquirer.prompt([{
			type     : 'rawlist',
			pageSize : 10,
			name     : 'teamID',
      loop     : false,
			message  : 'Choose an existing team, or create a new one',
			choices  : [
        'Create New',
        new inquirer.Separator(),
				...teams.reverse().map(({ id, title })=> ({ name : title, value : id }))
			],
			filter   : (input)=> (input << 0)
		}]);

    const { teamID } = prompt;
    return ((teamID === 0) ? await createTeamForm(userID) : teams.find(({ id })=> (id === teamID)));
  };


	const prompt = await inquirer.prompt([{
		type     : 'rawlist',
		name     : 'init',
		message  : 'Signup or login to continue',
		choices  : [
			'Signup',
			'Login',
			new inquirer.Separator(),
			'Quit'
		],
		filter   : (val)=> (val.toLowerCase())
	}]);

	const { init } = prompt;
	if (init === 'quit') {
		return;
	}

	let user = null;
	if (init === 'signup') {
		while (!user) {
			user = await registerForm();
			if (!user) {
				console.log('%s Email address already in use!', ChalkStyles.ERROR);
			}
		}

	} else {
		while (!user) {
			user = await loginForm();
			if (!user) {
				console.log('%s Invalid email or password!', ChalkStyles.ERROR);
			}
		}
	}

  await writeUser(user);

	const teams = await userTeams(user.id);
  const team = (teams.length === 0) ? await createTeamForm(user.id) : await teamsForm(user.id, teams);

  console.log('¡!¡!¡!¡!', { user, team });
})();
