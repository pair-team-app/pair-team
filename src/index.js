#!/usr/bin/env node
'use strict';


import chalk from 'chalk';
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import projectName from 'project-name';

import { consts, funcs, listeners } from 'config';

const API_ENDPT_URL = 'https://api.designengine.ai/playground.php';


async function queryPlayground(playgroundID) {
	let response = await fetch(API_ENDPT_URL, {
		method  : 'POST',
		headers : {
			'Content-Type' : 'application/json'
		},
		body    : JSON.stringify({
			action        : 'PLAYGROUND',
			playground_id : playgroundID,
			title         : projectName()
		})
	});

	try {
		response = await response.json();

	} catch (e) {
		console.log('%s Couldn\'t parse response! %s', chalk.red.bold('ERROR'), e);
	}

//  console.log('PLAYGROUND -->>', response);
	return (response);
}

export async function puppet(url, playgroundID) {

	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	await consts(page);
	await listeners(page);
	await funcs(page);

	await page.goto(url);
	await page.waitForSelector('[class="app"]');
	page.evaluate(() => console.log('hello', 5, {foo: 'bar'}));


	const extract = await parsePage(page);
//		console.log('::::', extract.elements);
//		console.log('IMAGES -->', Object.keys(extract.elements.images[0].styles).length);
	console.log('IMAGE[0].border -->', extract.elements.images[0].styles);

	const totals = {
		'links'   : extract.elements.links.length,
		'buttons' : extract.elements.buttons.length,
		'images'  : extract.elements.images.length
	};

	console.log('%s Found: %s link(s), %s button(s), %s image(s).', chalk.cyan.bold('INFO'), chalk.yellow.bold(totals.links), chalk.yellow.bold(totals.buttons), chalk.yellow.bold(totals.images));
	console.log('%s Queueing playground…', chalk.cyan.bold('INFO'));
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
		response = await fetch(API_ENDPT_URL, {
			method  : 'POST',
			headers : { 'Content-Type' : 'application/json' },
			body    : JSON.stringify({
				action        : 'ADD_COMPONENTS',
				playground_id : playgroundID,
				elements      : extract.elements
			})
		});

		try {
			response = await response.json();
//			console.log('::::', response);

		} catch (e) {
			console.log('%s Couldn\'t parse response! %s', chalk.red.bold('ERROR'), e);
		}
	}

//		await page.screenshot({path:'example.png'});

	await browser.close();

	//console.log('%s Playground created! %s', chalk.green.bold('DONE'), chalk.blue.bold(`http://playground.designengine.ai/spectrum-adobe-${playground.id}`));
}


async function extractElements(page) {
	const elements = {
		'links'   : await page.$$eval('a', (els)=> (els.map((el)=> {
			const styles = elementStyles(el);

			return ({
				html   : el.outerHTML.replace(/"/g, '\\"'),
				styles : styles,
				border : styles['border'],
				color  : null,//window.elementColor(),
				font   : null,//window.elementFont(),
				bounds : null,//window.elementBounds(el, styles),
				text   : el.innerText
			});
		}))),

		'buttons' : await page.$$eval('button, input[type="button"], input[type="submit"]', (els)=> (els.map((el)=> {
			const styles = window.elementStyles(el);

			return ({
				html   : el.outerHTML.replace(/"/g, '\\"'),
				styles : styles,
				border : styles['border'],
				color  : null,//window.elementColor(styles),
				font   : null,//window.elementFont(styles),
				bounds : null,//window.elementBounds(el, styles),
				text   : el.value
			});
		}))),

		'images'  : await page.$$eval('img', (els)=> (els.map((el)=> {
			const styles = window.elementStyles(el);

			return ({
				html   : el.outerHTML.replace(/"/g, '\\"'),
				styles : styles,
				border : styles['border'],
				color  : null,//window.elementColor(styles),
				font   : null,//window.elementFont(styles),
				bounds : null,//window.elementBounds(el, styles),
				text   : el.alt,
				data   : null,//window.imageData(el, elementSize(styles)),
				url    : el.src
			});
		})))
	};

	return (elements);
}

async function parsePage(page) {
	return ({
		html       : {
			doc    : await page.content(),
			styles : await page.evaluate(()=> (getComputedStyle(document.documentElement)))
		},
		elements   : await extractElements(page),
		playground : null
	});
}
