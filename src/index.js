#!/usr/bin/env node
'use strict';


import chalk from 'chalk';
import puppeteer from 'puppeteer';

import { queryPlayground, sendComponents } from './api';
import { consts, funcs, listeners } from './config';
import { extractElements } from './utils';


export async function puppetWorker(url, playgroundID) {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	await consts(page);
	await listeners(page);
	await funcs(page);

	await page.goto(url);
	await page.waitForSelector('[class="app"]');
	page.evaluate(() => console.log('hello', 5, {foo: 'bar'}));


	const extract = {
		html       : {
			doc    : await page.content(),
			styles : await page.evaluate(()=> (getComputedStyle(document.documentElement)))
		},
		elements   : await extractElements(page),
		playground : null
	};

//		console.log('::::', extract.elements);
//		console.log('IMAGES -->', Object.keys(extract.elements.images[0].styles).length);
	console.log('IMAGE[0].border -->', extract.elements.images[0].styles);

	const totals = {
		'links'   : extract.elements.links.length,
		'buttons' : extract.elements.buttons.length,
		'images'  : extract.elements.images.length
	};


	let response = null;
	try {
		response = await queryPlayground(playgroundID);

	} catch (e) {
		console.log('%s Error querying server! %s', chalk.red.bold('ERROR'), e);
		process.exit(1);
	}

	const playground = { ...response.playground,
		id  : response.playground.id << 0,
		new : response.playground.is_new
	};

	console.log('%s Sending %s component(s)…', chalk.cyan.bold('INFO'), chalk.yellow.bold(Object.keys(totals).map((key)=> (totals[key])).reduce((acc, val)=> (acc + val))));
	if (playground.new) {
		response = await sendComponents(extract);
	}

	await browser.close();
	return ({ extract, totals, playground });
}
