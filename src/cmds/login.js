#!/usr/bin/env node
'use strict';


import promise from 'bluebird';
import inquirer from 'inquirer';

import { loginUser, createTeam, userTeams } from '../api';
import { initCache, writeTeam, writeUser, reset, flushAll } from '../cache';
import { ChalkStyles } from '../consts';

promise.promisifyAll(require('fs'));


export async function userLogin() {
// (async()=> {
	await initCache();
	await flushAll();
  await reset();


  const loginForm = async()=> {
    const prompt = await inquirer.prompt([{
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
    }]);
    return(await loginUser(prompt));
  };


  let user = null;
  while (!user) {
    user = await loginForm();
    if (!user) {
      console.log('%s Invalid email or password!', ChalkStyles.ERROR);
    }
  }

  await writeUser(user);
  return (user);
  // await writeTeam(team);
// })();
}
