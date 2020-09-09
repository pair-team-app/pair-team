#!/usr/bin/env node
'use strict';


import { AxePuppeteer } from 'axe-puppeteer';
import { Strings } from 'lang-js-utils';
import projectName from 'project-name';
import puppeteer from 'puppeteer';

import { createPlayground, sendPlaygroundComponents } from '../api';
import { initCache, getAll, dropPlayground, getPlayground, writePlayground, getTeam, getUser, hasUser, hasTeam } from '../cache';
import { consts, funcs, globals, listeners } from '../config';
import { MAKE_PLAYGROUND, SEND_ELEMENTS, PORT, ChalkStyles, BROWSER_OPTS, CHROME_MACOS, CHROME_WINDOWS, GALAXY_S8, DeviceExtract, LinkExtract } from '../consts';
import { makeServer } from '../server';
import {
	extractMeta,
	fillChildNodes,
	formatAXNode,
	processView,
} from '../utils';

const deviceRender = DeviceExtract.DESKTOP_MOBILE;
const LINK_EXTRACT = LinkExtract.FIRST;


(async()=> {
	const parseLinks = async(browser, device, url)=> {
		// console.log('::|::', 'parseLinks()', { url }, '::|::');

		const page = await browser.newPage();
		await page.emulate(device);
		await page.goto(url, { waitUntil : 'networkidle0' });

		// const links = (await Promise.all((await page.$$('a', async(nodes)=> (nodes))).map(async(node)=> (await (await node.getProperty('href')).jsonValue())))).filter((link)=> (link !== url && !/^https?:\/\/.+https?:\/\//.test(link)));
		const links = (await Promise.all((await page.$$('a', async(nodes)=> (nodes))).map(async(node)=> (await (await node.getProperty('href')).jsonValue())))).filter((link)=> (link !== url && link.startsWith(url) && !/^https?:\/\/.+https?:\/\//.test(link)));
		await page.close();

		if (LINK_EXTRACT === LinkExtract.NONE) {
			return ([]);

		} else if (LINK_EXTRACT === LinkExtract.FIRST) {
			return ([ ...new Set(links.slice(0, 1))]);

		} else if (LINK_EXTRACT === LinkExtract.LAST) {
			return ([ ...new Set(links.slice(-1))]);

		} else if (LINK_EXTRACT === LinkExtract.AMOUNT) {
			return ([ ...new Set(links.slice(0, Math.min(links.length, LinkExtract.AMOUNT)))]);

		} else {
			return ([ ...new Set(links)]);
		}
	};

	const parsePage = async(browser, device, url, { ind, tot }=null)=> {
		// console.log('::|::', 'parsePage()', { url }, '::|::');

		if (ind > 0 || tot > 0) {
			console.log(`${ChalkStyles.INFO} ${ChalkStyles.DEVICE(device.name)} Extracting ${ChalkStyles.PATH('/' + url.split('/').slice(3))} view elements…`);
		}

		const page = await browser.newPage();
		await page.emulate(device);
		await page.goto(url, { waitUntil : 'networkidle0' });
		await page.content();

		const client = await page.target().createCDPSession();

		await client.send('DOM.enable');
		await client.send('Accessibility.enable');


	// 	console.log('flatDOM', (await client.send('DOM.getFlattenedDocument', { depth : -1 })));
		const flatDOM = (await client.send('DOM.getFlattenedDocument', { depth : -1 })).nodes.map(({ nodeId, backendNodeId, parentId })=> ({ nodeId, backendNodeId, parentId }));
	// 	console.log('DOM.getFlattenedDocument', flatDOM);

		const axNodes = (await client.send('Accessibility.getFullAXTree')).nodes.filter(({ backendDOMNodeId, childIds, name, role })=> ((typeof backendDOMNodeId !== 'undefined') && name && role && !(role.value === 'GenericContainer' && childIds.length === 0))).map((axNode)=> {
			return (formatAXNode(flatDOM, axNode));
		});

		const rootNode = axNodes.find(({ role })=> (role === 'WebArea'));
		const { childIDs } = rootNode;
		delete (rootNode['childIDs']);

		const axTree = { ...rootNode,
			childNodes : fillChildNodes(axNodes, childIDs)
		};

		// console.log(':::: doc el', await page.$('document'));
		// console.log(':::: acc', JSON.stringify(axTree, null, 2));


		const axeResults = await new AxePuppeteer(page).analyze();
		// console.log('AxePuppeteer SAYS:', JSON.stringify(axeResults, null, 2));

		const {
			violations : failed,
			passes     : passed,
			incomplete : aborted
		} = axeResults;
		const axeReport = { failed, passed, aborted };
		// console.log('AxePuppeteer SAYS:', JSON.stringify(axeReport, null, 2));

		await consts(page);
		await listeners(page);
		await funcs(page);
		await globals(page, { flatDOM, axeReport });

		await page.exposeFunction('getSelector', (el)=> {
			return (getSelector(el));
		});

		const elements = { views : [] };
		const doc = { ...(await extractMeta(device, page)), axTree, axeReport,
			title : projectName()
		};

		const view = await processView(device, page, doc);
		elements['views'].push(view);

		delete (doc['axTree']);
		delete (doc['axeReport']);
		delete (doc['image']);
		delete (doc['pathname']);

		console.log(`${ChalkStyles.INFO} ${ChalkStyles.DEVICE(device.name)} Finished parsing view ${ChalkStyles.PATH(((ind > 0 || tot > 0) ? '/' : '') + view.title)}`);

		await listeners(page, false);
		await page.close();
		return({ doc, elements });
	};


	const renderWorker = async(url)=> {
		// console.log('::|::', 'renderWorker()', { url }, '::|::');

		const devices = (deviceRender === DeviceExtract.DESKTOP) ? [
			CHROME_MACOS
		] : (deviceRender === DeviceExtract.MOBILE) ? [
			puppeteer.devices['iPhone 8']
		] : (deviceRender === DeviceExtract.DESKTOP_MOBILE) ? [
			CHROME_MACOS,
			puppeteer.devices['iPhone 8']
		] : (deviceRender === DeviceExtract.MOBILE_SINGLE) ? [
			puppeteer.devices['iPhone X']
		] : [
			CHROME_MACOS,
			CHROME_WINDOWS,
			GALAXY_S8,
			puppeteer.devices['iPhone X'],
			puppeteer.devices['iPhone 8'],
			{ ...puppeteer.devices['iPad Pro landscape'], name : 'iPad Pro' },
			puppeteer.devices['Galaxy Note 3']
		];

		const browser = await puppeteer.launch(BROWSER_OPTS);

		console.log(ChalkStyles.HEADER());
		const renders = await Promise.all(devices.map(async(device, i)=> {
			const { doc, elements } = await parsePage(browser, device, url, { ind : 0, tot : 0 });

			const links = await parseLinks(browser, device, url);
			doc.links = links.map((link)=> (`/${link.split('/').slice(3).join('/')}`));
			console.log(`${ChalkStyles.INFO} ${ChalkStyles.DEVICE(device.name)} Parsing ${ChalkStyles.NUMBER(links.length)} add\'l ${Strings.pluralize('view', links.length)}: [ ${doc.links.map((link)=> (ChalkStyles.PATH(link))).join(', ')} ]…`);

			await Promise.all(links.map(async(link, i)=> {
				const els = (await parsePage(browser, device, link, { ind : (i + 1), tot : links.length })).elements;

				Object.keys(elements).forEach((key)=> {
					const items = [ ...elements[key], ...els[key]];
					elements[key] = (key === 'views') ? items : items.map((el, i)=> ((items.find(({ html }, ii)=> (html === el.html && ii > i))) ? null : el)).filter((el)=> (el !== null));
				});
			}));

			// console.log('DEV OUTPUT -->\n', '|:|', { doc : JSON.stringify(doc, null, 2).length, elements : JSON.stringify(elements, null, 2).length }, '|:|');
	// 		console.log('::::', JSON.stringify(doc.axTree, null, 2));
			// console.log('::::', 'doc.links', { links : doc.links });
	// 		console.log('::::', 'links', JSON.stringify(doc.links, null, 0).length);
	// 		console.log('VIEWS -->', elements.views.length);
			// console.log('VIEWS -->', JSON.stringify(elements.views[0].images, null, 2));
			// console.log('AX -->', JSON.stringify(elements.views[0].accessibility, null, 2));
			// console.log('ZIP -->', elements.views.map((el, i)=> (`[${el.title}] ${JSON.stringify(el.zip.accessibility, null, 2)}\n=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\n`)));
			// console.log('VIEWS -->', elements.views[0].images);
			// console.log('VIEWS -->', elements.views);
			// console.log('HEADINGS -->', elements.headings.map(({ html })=> (html)));
			// console.log('IMAGES -->', elements.images[0]);
			// console.log('BUTTONS -->', elements.buttons[0].images);
			// console.log('BUTTONS -->', JSON.stringify(elements.buttons[0].accessibility, null, 2));
			// console.log('IMAGES -->', elements.views.map(({ id, title, images }, i)=> ({ id, title, images : { f : images.full.data.length, c : images.cropped.data.length }})));
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

			return ({ doc, links, elements,
				device : device.name
			});
		}));

		await browser.close();

		console.log(ChalkStyles.FOOTER(), '\n');
		return (renders);
	};


	await initCache();

	const allCache = await getAll();
	// console.log('//////--> allCache', { user : allCache.user.id, team : allCache.team.id });
	console.log('////// CACHE //////-->', { allCache });
	console.log('////// user //////-->', { hasTeam : await hasTeam(), hasUser : await hasUser(), getUser : await getUser(), getTeam : await getTeam() });


	if (!(await hasTeam()) || !(await hasUser())) {
		require('./init');
	}

	const user = await getUser();
	const team = await getTeam();

	const startDate = Date.now();
	const server = await makeServer(async()=> {

		const renders = await renderWorker(`http://localhost:${PORT}/`);
		server.close();

		renders.forEach((render, i)=> {
			const { device, doc, elements } = render;
			console.log('%s %s Completed parsing: %s', ChalkStyles.INFO, ChalkStyles.DEVICE(device), [ ...Object.keys(elements).map((key)=> (`${ChalkStyles.NUMBER(elements[key].length)} ${Strings.pluralize(key.slice(0, -1), elements[key].length)}`)), `${ChalkStyles.NUMBER(Object.keys(doc.colors).map((key)=> (doc.colors[key].length)).reduce((acc, val)=> (acc + val)))} ${Strings.pluralize('color', Object.keys(doc.colors).map((key)=> (doc.colors[key].length)).reduce((acc, val)=> (acc + val)))}`, `${ChalkStyles.NUMBER(doc.fonts.length)} ${Strings.pluralize('font', doc.fonts.length)}`].join(', '));
		});


		if (MAKE_PLAYGROUND) {
			for (let i=0; i<renders.length; i++) {
				const render = renders[i];

				const { device, doc, elements } = render;
				console.log('\n%s %s Generating playground (%s/%s)…', ChalkStyles.INFO, ChalkStyles.DEVICE(device), ChalkStyles.NUMBER(i + 1, true), ChalkStyles.NUMBER(renders.length, true));

				const { buildID } = await getPlayground();
				const playground = await createPlayground({ doc, device,
					userID  : user.id,
					teamID  : team.id,
					buildID : (buildID || -1)
				});

				if (!buildID) {
					await writePlayground(playground);
				}

				if (SEND_ELEMENTS) {
					const total = Object.keys(elements).map((key)=> (elements[key].length)).reduce((acc, val)=> (acc + val));
					console.log('%s %s Sending %s component(s)…', ChalkStyles.INFO, ChalkStyles.DEVICE(device), ChalkStyles.NUMBER(total));
					await sendPlaygroundComponents({
						userID       : user.id,
						teamID       : team.id,
						buildID      : playground.build_id,
						playgroundID : playground.id,
						components   : elements
					});
				}

				console.log('%s %s Created playground: %s', ChalkStyles.INFO, ChalkStyles.DEVICE(device), ChalkStyles.URL(`http://dev.pairurl.com/app/${Strings.slugifyURI(team.title)}/${Strings.slugifyURI(render.doc.title)}/${playground.build_id}/${Strings.slugifyURI(device)}`));
			}
		}

		const elapsed = `${(((Date.now() - startDate) * 0.001) << 0)}`;
		console.log('\n%s Finished in %s seconds.', ChalkStyles.DONE, ChalkStyles.NUMBER(elapsed));

		await dropPlayground();

		/*
		if (!opened) {
			await writeCache('playground_open', true);
			open(`http://playground.designengine.ai/spectrum-adobe-${playground.id}`);
		}
		*/
	});
})();


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
