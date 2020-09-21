#!/usr/bin/env node
'use strict';


import promise from 'bluebird';
import fs from 'fs';
import inquirer from 'inquirer';

import { userTeams } from '../api';
import { initCache, getUser, writeTeam, writeUser, reset, flushAll, getTeam } from '../cache';
import { CMD_PARSE, ChalkStyles } from '../consts';
import { userLogin } from './login';
import { userRegister } from './signup';

promise.promisifyAll(require('fs'));


(async()=> {
	await initCache();
//	await flushAll();

	// console.log('USER >>', user);
	// if (!user) {
	// 	await reset();
	// }

	const createTeamForm = async(userID)=> {
    const prompt = await inquirer.prompt([{
      type     : 'input',
      name     : 'title',
      message  : 'Enter a new team name',
      validate : (val)=> (val.length > 0)
    }]);

    return(await createTeam(userID, prompt.title));
  };

	const teamsForm = async(userID, teams)=> {
    const prompt = await inquirer.prompt([{
			type    : 'rawlist',
			name    : 'teamID',
      loop    : false,
			message : 'Choose an existing team, or create a new one',
			choices : [
        'Create New',
        new inquirer.Separator(),
				...teams.reverse().map(({ id, title })=> ({ name : title, value : id }))
			],
			filter  : (input)=> (input << 0)
		}]);

    const { teamID } = prompt;
    return((teamID === 0) ? await createTeamForm(userID) : teams.find(({ id })=> (id === teamID)));
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

	const user = (init === 'signup') ? await userRegister() : await userLogin();
	const teams = await userTeams(user.id);
  const team = (teams.length === 0) ? await createTeamForm(user.id) : await teamsForm(user.id, teams);

  console.log('¡!¡!¡!¡!', { user, team });

	// await writeTeam({
	// 	id : 87,
	// 	title : 'Pair URL 1'
	// });

	// const pkgPath = await checkDir();
	// const prompt = await inquirer.prompt({
	// 	type    : 'confirm',
	// 	name    : 'append',
	// 	message : 'Allow PairURL to add a postbuild script to your project\'s package.json?'
	// });

	// if (prompt.append) {
	// 	fs.readFileAsync(pkgPath).then(JSON.parse).then(appendPostbuild).then(prettyPrint).then((data)=> savePackage(data, pkgPath)).catch(console.log);
	// 	console.log('%s Successfully modified postbuild script.', ChalkStyles.INFO);
	// }
})();
