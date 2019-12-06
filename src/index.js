#!/usr/bin/env node
'use strict';


import { AxePuppeteer } from 'axe-puppeteer';
import { Strings } from 'lang-js-utils';
import projectName from 'project-name';
import puppeteer from 'puppeteer';

import { createPlayground, sendPlaygroundComponents } from './api';
import { consts, funcs, globals, listeners } from './config';
import { ChalkStyles, BROWSER_OPTS, CHROME_DEVICE } from './consts';
import {
	embedPageStyles,
	extractElements,
	extractMeta,
	fillChildNodes,
	formatAXNode,
	formatHTML,
	inlineCSS,
	pageElement,
	pageStyleTag,
	stripPageTags,
} from './utils';


const parsePage = async(browser, device, url, { ind, tot }=null)=> {
	const page = await browser.newPage();
	await page.emulate(device);
	await page.goto(url, { waitUntil : 'networkidle0' });
	await page.content();

	const client = await page.target().createCDPSession();

// 	const el = await page.$('h1');
// 	console.log('el', el);
// 	console.log('el', JSON.stringify(el, 2, null));

	await client.send('DOM.enable');
// 	await client.send('DOMSnapshot.enable');
	await client.send('Accessibility.enable');


// 	console.log('flatDOM', (await client.send('DOM.getFlattenedDocument', { depth : -1 })));
	const flatDOM = (await client.send('DOM.getFlattenedDocument', { depth : -1 })).nodes.map(({ nodeId, backendNodeId, parentId })=> ({ nodeId, backendNodeId, parentId }));
// 	console.log('DOM.getFlattenedDocument', flatDOM);

	const dom = await client.send('DOM.getDocument', { depth : -1 });
// 	console.log('DOM.getDocument', JSON.stringify(dom, null, 2));


	const axNodes = (await client.send('Accessibility.getFullAXTree')).nodes.filter(({ backendDOMNodeId, childIds, name, role })=> ((typeof backendDOMNodeId !== 'undefined') && name && role && !(role.value === 'GenericContainer' && childIds.length === 0))).map((axNode)=> {
		return (formatAXNode(flatDOM, axNode));
	});

	const rootNode = axNodes.find(({ role })=> (role === 'WebArea'));
	const { childIDs } = rootNode;
	delete (rootNode['childIDs']);

	const axTree = { ...rootNode,
		childNodes : fillChildNodes(axNodes, childIDs)
	};

// 	console.log(':::: acc', JSON.stringify(axTree, null, 2));

	const axe = await new AxePuppeteer(page).analyze();
	const axeReport = {
		failed  : axe.violations,
		passed  : axe.passes,
		aborted : axe.incomplete
	};

// 	console.log('AxePuppeteer SAYS:', JSON.stringify(axeReport, null, 2));

	await stripPageTags(page, ['iframe']);
	const embedHTML = await embedPageStyles(await page.content());
	const styleTag = await pageStyleTag(embedHTML);

	await consts(page);
	await listeners(page);
	await funcs(page);
	await globals(page, { flatDOM, axeReport, styleTag });

	const html = formatHTML(await inlineCSS(embedHTML));
	const elements = await extractElements(page);
	const docMeta = await extractMeta(page, elements);
	const doc = { ...docMeta, dom, axTree, axeReport, html,
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
// 		puppeteer.devices['iPhone X'],
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


// 		console.log('::::', JSON.stringify(doc.axTree, null, 2));
// 		console.log('::::', doc.colors);
// 		console.log('VIEWS -->', elements.views.length);
// 		console.log('VIEWS -->', JSON.stringify(elements.views[0].accessibility, null, 2));
// 		console.log('IMAGES -->', elements.images[0]);
// 		console.log('BUTTONS -->', elements.buttons[0].node_id);
// 		console.log('BUTTONS -->', elements.buttons[0].accessibility.report);
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