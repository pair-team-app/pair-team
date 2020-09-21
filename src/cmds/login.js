#!/usr/bin/env node
'use strict';


import promise from 'bluebird';
import inquirer from 'inquirer';

import { loginUser, createTeam, teamLookup } from '../api';
import { initCache, writeTeam, writeUser, reset, flushAll, getTeam } from '../cache';
import { ChalkStyles } from '../consts';

promise.promisifyAll(require('fs'));


(async()=> {
	await initCache();
	await flushAll();
  await reset();

  const loginForm = async()=> {
    const questions = [{
      type     : 'input',
      name     : 'email',
      message  : 'Enter Email Address',
      validate : (val)=> ((/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i.test(String(val))))
    }, {
      type     : 'password',
      name     : 'password',
      mask     : '*',
      message  : 'Enter Password',
      validate : (val)=> (val.length > 0)
    }];

    const prompt = await inquirer.prompt(questions);
    return(await loginUser(prompt));
  };

  const teamForm = async(teams)=> {
    const prompt = await inquirer.prompt([{
			type     : 'list',
			name     : 'team',
			message  : 'Choose an existing team, or create a new one',
			choices  : [
        'Create New',
        new inquirer.Separator(),
				...teams.map(({ title })=> (title))
			],
			filter   : (val)=> (val.toLowerCase())
		}]);

    const { team } = prompt;
    if (team === 'create new') {
      const questions = [{
        type     : 'input',
        name     : 'title',
        message  : 'Enter a new team name'
      }];

      const prompt = await inquirer.prompt(questions);
      return(await createTeam(userID, prompt));

    } else {

    }
  };

  let user = null;
  while (!user) {
    user = await loginForm();
    if (!user) {
      console.log('%s Email address already in use!', ChalkStyles.ERROR);
    }
  }

  await writeUser(user);

  // let team = null;
  // //const team = await teamLookup(user);
  // while (!team) {
  //   team = teamForm(user.id);
  // }

  // await writeTeam(team);
})();
