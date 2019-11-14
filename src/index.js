#!/usr/bin/env node
'use strict';


import projectName from 'project-name';
import puppeteer from 'puppeteer';

import { createPlayground, sendPlaygroundComponents } from './api';
import {consts, funcs, globals, listeners} from './config';
import {
	captureScreenImage,
	embedPageStyles,
	extractElements,
	extractMeta,
	inlineCSS,
	formatHTML,
	pageElement,
	pageStyleTag,
	stripPageTags,
} from './utils';


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
		let embedHTML = await embedPageStyles(await page.content());
		let styleTag = await pageStyleTag(embedHTML);

		await consts(page);
		await listeners(page);
		await funcs(page);
		await globals(page, { styleTag });

		let html = formatHTML(await inlineCSS(embedHTML));
// 		console.log('::::', html);
// 		console.log('::::', await embedPageStyles(await page.content()));


// 		await page.evaluate(()=> {
// 			document.dispatchEvent(new WheelEvent('mousewheel', { deltaY : 100 }));
// 		});

// 		await page.emit('mousewheel', await page.evaluate(()=> (new WheelEvent('mousewheel', { deltaY : 100 }))));

		const elements = await extractElements(page);
// 		console.log('::::', device.name, Object.keys(elements));
// 		console.log('::::', html);
// 		console.log(device.name, elements.colors.map((el)=> ({ ...el,
// 			styles : {}
// 		})));

		let docMeta = await extractMeta(page, elements);
		const doc = { ...docMeta, html,
// 			html  : (await page.content()).replace(/"/g, '\\"'),
// 			html  : await page.content(),
			title : projectName()
		};

		elements.views.push(await pageElement(page, doc, html));
// 		const links = doc.links.split(' ').filter((link)=> (link !== url)).filter((link)=> (!/^https?:\/\/.+https?:\/\//.test(link)));
// 		const derp = await Promise.all(links.map(async(link)=> {
// // 			console.log('::::', link);
//
// 			await page.goto(link, { waitUntil : 'networkidle2' });
//
// // 			await stripPageTags(page, ['iframe']);
// // 			embedHTML = await embedPageStyles(await page.content());
// // 			styleTag = await pageStyleTag(embedHTML);
// //
// // 			await globals(page, { styleTag });
// //
// // 			html = formatHTML(await inlineCSS(embedHTML));
// // 			const els = await extractElements(page);
// //
// // 			Object.keys(elements).forEach((key)=> {
// // 				elements[key] = [ ...elements[key], ...els[key]];
// // 			});
// //
// // 			docMeta = await extractMeta(page, els);
// // 			elements.views.push(await pageElement(page, { ...docMeta, html,
// // 				title : projectName()
// // 			}, html));
//
// 			return (await page.content());
// 		}));
//
// 		console.log('>>>>>', derp);


// 		console.log('::::', doc);
// 		console.log('::::', doc.colors);
// 		console.log('VIEWS -->', elements.views.length);
// 		console.log('IMAGES -->', elements.images[0]);
// 		console.log('BUTTONS -->', elements.buttons[0].dom);
// 		console.log('LINKS -->', elements.links.map((el, i)=> (`[${el.title}] ${el.styles.background}`)));
// 		console.log('LINKS -->', elements.links.map((el, i)=> (`[${el.title}] ${JSON.stringify(el.styles, null, 2)}`)));
// 		console.log('LINKS -->', elements.links.map((el, i)=> (`[${el.title}] [${el.html}] ${el.path}`)));
// 		console.log('LINKS -->', elements.links.map((el, i)=> (`[${el.title}] [${el.html}] ${JSON.stringify(el.meta).replace(/\\+/g, '\\')}`)));
// 		console.log('LINKS -->', elements.links.map((el, i)=> (`[${el.title}] (${el.children.map((child)=> (`[${child.title}] ${child.dom}`))})`)));
// 		console.log('BUTTONS -->', elements.buttons.map((el, i)=> (`[${el.title}] ${el.html}\n${JSON.stringify(el.path, null, 2)}`)));
// 		console.log('BUTTONS -->', JSON.stringify(elements.buttons[0], (key, val)=> { console.log(key, ':', val, '\n- - - -')}, 2));
// 		console.log('BUTTONS -->', JSON.stringify([{ ...elements.buttons[0], handle : null }, {... elements.buttons[1], handle : null }], null, 2));
// 		console.log('BUTTONS -->', JSON.stringify(elements.buttons[0], null, 2));
// 		console.log('BUTTONS -->', elements.buttons[0].styles, Object.keys(elements.buttons[0].styles).length);
// 		console.log('LINKS -->',  [elements.links[0].styles, elements.links[1].meta]);
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
