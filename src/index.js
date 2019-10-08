#!/usr/bin/env node
'use strict';


import chalk from 'chalk';
import projectName from 'project-name';
import puppeteer from 'puppeteer';

import { queryPlayground, sendComponents } from './api';
import { consts, funcs, listeners } from './config';
import { extractElements } from './utils';


export async function puppetWorker(url, playgroundID) {
	const devices = [
// 		puppeteer.devices['iPhone X'],
// 		puppeteer.devices['iPad Pro'],
		{
			name      : 'Chrome',
			userAgent : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36',
			viewport  : {
				width             : 1920,
				height            : 1080,
				deviceScaleFactor : 1,
				isMobile          : false,
				hasTouch          : false,
				isLandscape       : false
			}
		}
	];

	const objs = Promise.all(await devices.map(async(device)=> {
		const browser = await puppeteer.launch({
			headless : true
		});

		const page = await browser.newPage();
		await page.emulate(device);
// 	await page.waitForSelector('[class="app"]');

		const html = await page.goto(url, { waitUntil : 'networkidle2' });
		await page.content();

		await consts(page);
		await listeners(page);
		await funcs(page);

		const extract = {
			html       : {
// 				doc    : await page.content(),
				doc    : html,
				styles : await page.evaluate(()=> (getComputedStyle(document.documentElement)))
			},
			elements   : await extractElements(page),
			playground : playgroundID
		};

// 		console.log('::::', extract.elements);
// 		console.log('IMAGES -->', extract.elements.images[0]);
// 		console.log('BUTTONS -->', JSON.stringify([{...extract.elements.buttons[0], handle : null }, {...extract.elements.buttons[1], handle : null }], null, 2));
// 		console.log('BUTTONS -->', JSON.stringify(extract.elements.buttons[0], null, 2));
// 		console.log('BUTTONS -->', extract.elements.buttons[0].styles, Object.keys(extract.elements.buttons[0].styles).length);
// 		console.log('LINKS -->',  [extract.elements.links[0].styles, extract.elements.links[1].styles]);
// 		console.log('LINKS -->',  [extract.elements.links[0].styles.length]);
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

		console.log('%s Found: %s image, %s buttons, %s table for device [%s].', chalk.cyan.bold('INFO'), magenta.yellow.bold('1'), chalk.magenta.bold('8'), chalk.magenta.bold('1'), chalk.grey('iPhone / Safari'));
// 		console.log('\n%s [%s] Found: %s link(s), %s button(s), %s image(s).', chalk.cyan.bold('INFO'), chalk.grey(device.name), chalk.magenta.bold(totals.links), chalk.magenta.bold(totals.buttons), chalk.magenta.bold(totals.images));

		const linkURLS = extract.elements.links.map((link)=> (link.href));
// 		console.log('::::', linkURLS);


// 		console.log('%s Sending %s component(s)…', chalk.cyan.bold('INFO'), chalk.magenta.bold(Object.keys(totals).map((key)=> (totals[key])).reduce((acc, val)=> (acc + val))));
		console.log('%s Sending %s component(s)…', chalk.cyan.bold('INFO'), chalk.magenta.bold('10'));
		if (playground.new) {
			response = await sendComponents(extract);
		}

		await browser.close();

		return ({ extract, totals, playground });
	}));

	return (objs);


// 	const browser = await puppeteer.launch({
// 		headless : true
// 	});
// 	const page = await browser.newPage();
//
// 	await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13 Mobile/15E148 Safari/604.1');
// 	await page.setViewport({
// 		width    : 1125,
// 		height   : 2436,
// 		isMobile : true,
// 		hasTouch : true,
// 		deviceScaleFactor : 3
// 	});
//
// // 	await page.waitForSelector('[class="app"]');
//
// 	await page.goto(url);
// 	await page.content();
//
// 	await consts(page);
// 	await listeners(page);
// 	await funcs(page);
//
// 	const extract = {
// 		html       : {
// 			doc    : await page.content(),
// 			styles : await page.evaluate(()=> (getComputedStyle(document.documentElement)))
// 		},
// 		elements   : await extractElements(page),
// 		playground : null
// 	};
//
// //		console.log('::::', extract.elements);
// // 		console.log('IMAGES -->', extract.elements.images[0]);
// // 		console.log('BUTTONS -->', extract.elements.buttons[0].styles);
// // 		console.log('BUTTONS -->', JSON.stringify(extract.elements.buttons[0], null, 2));
// 		console.log('BUTTONS -->', extract.elements.buttons[0]);
// // 		console.log('IMAGES -->', Object.keys(extract.elements.images[0].styles).length);
// // 	console.log('IMAGE[0].border -->', extract.elements.images[0].styles);
//
// 	const totals = {
// 		'links'   : extract.elements.links.length,
// 		'buttons' : extract.elements.buttons.length,
// 		'images'  : extract.elements.images.length
// 	};
//
//
// 	let response = null;
// 	try {
// 		response = await queryPlayground(playgroundID, projectName());
//
// 	} catch (e) {
// 		console.log('%s Error querying server! %s', chalk.red.bold('ERROR'), e);
// 		process.exit(1);
// 	}
//
// 	const playground = { ...response.playground,
// 		id  : response.playground.id << 0,
// 		new : response.playground.is_new
// 	};
//
// 	console.log('%s Sending %s component(s)…', chalk.cyan.bold('INFO'), chalk.magenta.bold(Object.keys(totals).map((key)=> (totals[key])).reduce((acc, val)=> (acc + val))));
// 	if (playground.new) {
// 		response = await sendComponents(extract);
// 	}
//
// 	await browser.close();
// 	return ({ extract, totals, playground });
// 	return (objs);
}
