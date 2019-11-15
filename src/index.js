#!/usr/bin/env node
'use strict';


import { Strings } from 'lang-js-utils';
import projectName from 'project-name';
import puppeteer from 'puppeteer';

import { createPlayground, sendPlaygroundComponents } from './api';
import { consts, funcs, globals, listeners } from './config';
import { BROWSER_OPTS, CHROME_DEVICE, ChalkStyles } from './consts';
import {
	embedPageStyles,
	extractElements,
	extractMeta,
	inlineCSS,
	formatHTML,
	pageElement,
	pageStyleTag,
	stripPageTags,
} from './utils';


const parsePage = async(browser, device, url, { ind, tot }=null)=> {
	const page = await browser.newPage();
	await page.emulate(device);
	await page.goto(url, { waitUntil : 'networkidle0' });

	await stripPageTags(page, ['iframe']);
	const embedHTML = await embedPageStyles(await page.content());
	const styleTag = await pageStyleTag(embedHTML);

	await consts(page);
	await listeners(page);
	await funcs(page);
	await globals(page, { styleTag });

	const html = formatHTML(await inlineCSS(embedHTML));
	const elements = await extractElements(page);
	const doc = { ...await extractMeta(page, elements), html,
		title : projectName()
	};

	await elements.views.push(await pageElement(page, doc, html));

	await listeners(page, false);
	await page.close();

	console.log('%s%s Finished parsing [%s] view %s', ((ind === 0 && !url.endsWith('/')) ? '\n' : ''), ChalkStyles.INFO, ChalkStyles.DEVICE(device.name), ChalkStyles.PATH(`/${url.split('/').slice(3).join('/')}`));
	return({ doc, elements });
};

const parseLinks = async(browser, device, url)=> {
	const page = await browser.newPage();
	await page.emulate(device);
	await page.goto(url, { waitUntil : 'networkidle0' });

	const links = (await Promise.all((await page.$$('a', async(nodes)=> (nodes))).map(async(node)=> (await (await node.getProperty('href')).jsonValue())))).filter((link)=> (link !== url && !/^https?:\/\/.+https?:\/\//.test(link)));
	await page.close();

	return ([ ...new Set(links.slice(-1))]);
};


export async function renderWorker(url) {
	const devices = [
		puppeteer.devices['iPhone X'],
// 		puppeteer.devices['iPad Pro'],
		CHROME_DEVICE
	].reverse();

	const browser = await puppeteer.launch(BROWSER_OPTS);
	const renders = await Promise.all(devices.map(async(device, i)=> {
		console.log('%s Parsing [%s] root view…%s', ChalkStyles.INFO, ChalkStyles.DEVICE(device.name), ((i === devices.length - 1) ? '\n' : ''));

		const { doc, elements } = await parsePage(browser, device, url, { ind : 0, tot : 0 });

		const links = await parseLinks(browser, device, url);
		console.log('%s%s Parsing (%s) add\'l [%s] %s: [ %s ]…' , ((i === 0) ? '\n' : ''), ChalkStyles.INFO, ChalkStyles.NUMBER(`${links.length}`), ChalkStyles.DEVICE(device.name), Strings.pluralize('view', links.length), links.map((link)=> (ChalkStyles.PATH(`/${link.split('/').slice(3).join('/')}`))).join(', '));
		await Promise.all(links.map(async(link, i)=> {
			const els = (await parsePage(browser, device, link, { ind : (i + 1), tot : links.length })).elements;

			Object.keys(elements).forEach((key)=> {
				elements[key] = [ ...elements[key], ...els[key]];
			});
		}));


// 		console.log('::::', doc);
// 		console.log('::::', doc.colors);
// 		console.log('VIEWS -->', elements.views.length);
// 		console.log('IMAGES -->', elements.images[0]);
// 		console.log('BUTTONS -->', elements.buttons[0]);
// 		console.log('LINKS -->', elements.links.map((el, i)=> (`[${el.title}] ${el.styles.background}`)));
// 		console.log('LINKS -->', elements.links.map((el, i)=> (`[${el.title}] ${JSON.stringify(el.styles, null, 2)}`)));
// 		console.log('LINKS -->', elements.links.map((el, i)=> (`[${el.title}] [${el.html}] ${el.path}`)));
// 		console.log('LINKS -->', elements.links.map((el, i)=> (`[${el.title}] [${el.html}] ${JSON.stringify(el.meta).replace(/\\+/g, '\\')}`)));
// 		console.log('LINKS -->', elements.links.map((el, i)=> (`[${el.title}] (${el.children.map((child)=> (`[${child.title}] ${child.dom}`))})`)));
// 		console.log('BUTTONS -->', elements.buttons.map((el, i)=> (`[${el.title}] ${el.html}\n${JSON.stringify(el.path, null, 2)}`)));
// 		console.log('BUTTONS -->', elements.buttons.map((el, i)=> (`[${el.title}] ${JSON.stringify(el.meta, null, 2)}`)));
// 		console.log('BUTTONS -->', JSON.stringify(elements.buttons[0], (key, val)=> { console.log(key, ':', val, '\n- - - -')}, 2));
// 		console.log('BUTTONS -->', JSON.stringify([{ ...elements.buttons[0], handle : null }, {... elements.buttons[1], handle : null }], null, 2));
// 		console.log('BUTTONS -->', JSON.stringify(elements.buttons[0], null, 2));
// 		console.log('BUTTONS -->', elements.buttons[0].styles, Object.keys(elements.buttons[0].styles).length);
// 		console.log('LINKS -->',  [elements.links[0].styles, elements.links[1].meta]);
// 		console.log('LINKS -->',  [elements.links[0].styles.length]);
// 		console.log('IMAGES -->', Object.keys(elements.images[0].styles).length);
// 	  console.log('IMAGE[0].border -->', elements.images[0].styles);

		return ({ doc, elements,
			device : device.name
		});
	}));

	await browser.close();
	return (renders);
}


export { createPlayground, sendPlaygroundComponents };


/*
// event trigger
await page.evaluate(()=> {
	document.dispatchEvent(new WheelEvent('mousewheel', { deltaY : 100 }));
});

await page.emit('mousewheel', await page.evaluate(()=> (new WheelEvent('mousewheel', { deltaY : 100 }))));
*/


/*
// XPATH eval
const [elementHandle] = await page.$x('.//a/@href');
const propertyHandle = await elementHandle.getProperty('value');
const propertyValue = await propertyHandle.jsonValue();

console.log('[:]', propertyValue, '[:]');
*/