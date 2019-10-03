#!/usr/bin/env node
'use strict';


import chalk from 'chalk';
import projectName from 'project-name';
import puppeteer from 'puppeteer';

import { queryPlayground, sendComponents } from './api';
import { consts, funcs, listeners } from './config';
import { extractElements } from './utils';


export async function puppetWorker(url, playgroundID) {
	const browser = await puppeteer.launch({
// 		dumpio : true,
		devtools : true,
		headless : true
	});
	const page = await browser.newPage();

	await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13 Mobile/15E148 Safari/604.1');
	await page.setViewport({
		width    : 1125,
		height   : 2436,
		isMobile : true,
		hasTouch : true,
		deviceScaleFactor : 3
	});

// 	await page.waitForSelector('[class="app"]');

	await page.goto(url);
	await page.content();

	await consts(page);
	await listeners(page);
	await funcs(page);

	const extract = {
		html       : {
			doc    : await page.content(),
			styles : await page.evaluate(()=> (getComputedStyle(document.documentElement)))
		},
		elements   : await extractElements(page),
		playground : null
	};

//		console.log('::::', extract.elements);
// 		console.log('IMAGES -->', extract.elements.images[0]);
// 		console.log('BUTTONS -->', extract.elements.buttons[0].styles);
		console.log('BUTTONS -->', JSON.stringify(extract.elements.buttons[0], null, 2));
// 		console.log('IMAGES -->', Object.keys(extract.elements.images[0].styles).length);
// 	console.log('IMAGE[0].border -->', extract.elements.images[0].styles);

	const totals = {
		'links'   : extract.elements.links.length,
		'buttons' : extract.elements.buttons.length,
		'images'  : extract.elements.images.length
	};


	let response = null;
	try {
		response = await queryPlayground(playgroundID, projectName());

	} catch (e) {
		console.log('%s Error querying server! %s', chalk.red.bold('ERROR'), e);
		process.exit(1);
	}

	const playground = { ...response.playground,
		id  : response.playground.id << 0,
		new : response.playground.is_new
	};

	console.log('%s Sending %s component(s)…', chalk.cyan.bold('INFO'), chalk.magenta.bold(Object.keys(totals).map((key)=> (totals[key])).reduce((acc, val)=> (acc + val))));
	if (playground.new) {
		response = await sendComponents(extract);
	}

	await browser.close();
	return ({ extract, totals, playground });
}
