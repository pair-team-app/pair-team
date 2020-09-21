#!/usr/bin/env node
'use strict';


import promise from 'bluebird';
import inquirer from 'inquirer';

import { registerUser, teamLookup } from '../api';
import { initCache, writeTeam, writeUser, reset, flushAll, getTeam } from '../cache';
import { ChalkStyles } from '../consts';

promise.promisifyAll(require('fs'));


(async()=> {
	await initCache();
	await flushAll();
  await reset();

  const registerForm = async()=> {
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
    return(await registerUser(prompt));
  };

  const teamForm = (userID)=> {
    const questions = [{
      type     : 'input',
      name     : 'title',
      message  : 'Enter a new team name'
    }];

    const prompt = await inquirer.prompt(questions);
    return(await createTeam(userID, prompt));
  };

  let user = null;
  while (!user) {
    user = await registerForm();
    if (!user) {
      console.log('%s Email address already in use!', ChalkStyles.ERROR);
    }
  }

  await writeUser(user);

  let team = null;
  while (!team) {
    team = teamForm(user.id);
  }

  await writeTeam(team);
})();
