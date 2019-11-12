#!/usr/bin/env node
'use strict';


import projectName from 'project-name';
import puppeteer from 'puppeteer';

import { createPlayground, sendPlaygroundComponents } from './api';
import { consts, funcs, listeners } from './config';
import { captureScreenImage, extractElements, extractMeta, inlineCSS, formatPageHTML, stripPageTags } from './utils';


export async function renderWorker(url) {
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

	const objs = await Promise.all(devices.map(async(device)=> {
		const browser = await puppeteer.launch({ headless : true });

		const page = await browser.newPage();
		await page.emulate(device);
		await page.goto(url, { waitUntil : 'networkidle2' });

		await stripPageTags(page, ['iframe']);
		const html = formatPageHTML(await inlineCSS(await page.content()));

		await consts(page);
		await listeners(page);
		await funcs(page);

// 		await page.evaluate(()=> {
// 			document.dispatchEvent(new WheelEvent('mousewheel', { deltaY : 100 }));
// 		});

// 		await page.emit('mousewheel', await page.evaluate(()=> (new WheelEvent('mousewheel', { deltaY : 100 }))));

		const elements = await extractElements(page);
		const docMeta = await extractMeta(page, elements);
// 		console.log('::::', device.name, Object.keys(elements));
// 		console.log(device.name, elements.colors.map((el)=> ({ ...el,
// 			styles : {}
// 		})));


		const doc = { html,
// 			html        : (await page.content()).replace(/"/g, '\\"'),
// 			html        : await page.content(),
			title         : projectName(),
			description   : await page.title(),
			url           : await page.url(),
			image         : await captureScreenImage(page),
			styles        : await page.evaluate(()=> (elementStyles(document.documentElement))),
			accessibility : await page.accessibility.snapshot(),
			links         : elements.links.map((link)=> (link.meta.href)).join(' '),
			colors        : docMeta.colors,
			fonts         : docMeta.fonts
		};

// 		console.log('::::', doc);
// 		console.log('::::', doc.colors);
// 		console.log('IMAGES -->', elements.images[0]);
// 		console.log('BUTTONS -->', elements.buttons[0].dom);
// 		console.log('LINKS -->', elements.links.map((link, i)=> (`[${link.title}] ${JSON.stringify(link.dom, null, 2)}`)));
// 		console.log('LINKS -->', elements.links.map((link, i)=> (`[${link.title}] ${link.path}`)));
// 		console.log('LINKS -->', elements.links.map((el, i)=> (`[${el.title}] (${el.children.map((child)=> (`[${child.title}] ${child.dom}`))})`)));
// 		console.log('BUTTONS -->', JSON.stringify(elements.buttons[0], (key, val)=> { console.log(key, ':', val, '\n- - - -')}, 2));
// 		console.log('BUTTONS -->', JSON.stringify([{ ...elements.buttons[0], handle : null }, {... elements.buttons[1], handle : null }], null, 2));
// 		console.log('BUTTONS -->', JSON.stringify(elements.buttons[0], null, 2));
// 		console.log('BUTTONS -->', elements.buttons[0].styles, Object.keys(elements.buttons[0].styles).length);
// 		console.log('LINKS -->',  [elements.links[0].styles, elements.links[1].styles]);
// 		console.log('LINKS -->',  [elements.links[0].styles.length]);
// 		console.log('IMAGES -->', Object.keys(elements.images[0].styles).length);
// 	console.log('IMAGE[0].border -->', elements.images[0].styles);

		await browser.close();

		return ({ doc, elements,
			device : device.name
		});
	}));

	return (objs);
}


export { createPlayground, sendPlaygroundComponents };
