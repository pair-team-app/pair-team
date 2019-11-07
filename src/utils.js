#!/usr/bin/env node
'use strict';


import crypto from 'crypto';
import stringify from 'json-stringify-safe';

import { CRYPTO_TYPE } from './consts';
import cryproCreds from '../crypto-creds';


const makeCipher = async(enc=true, { type, key }={})=> {
	type = (!type) ? Object.keys(cryproCreds).find((k)=> (k === CRYPTO_TYPE)) : type;
	key = (!key) ? cryproCreds[(!type) ? CRYPTO_TYPE : type] : key;
	const iv = cryproCreds[(Object.keys(cryproCreds).find((k)=> (k === 'iv')))];//crypto.randomFillSync(Buffer.alloc(8)).toString('hex');

	return ((enc) ? await crypto.createCipheriv(type, key, iv) : await crypto.createDecipheriv(type, key, iv));
};


export async function captureElementImage(element, encoding='base64') {
	const boundingBox = await element.boundingBox();
	const padding = 0;

	return (await element.screenshot({ encoding,
		clip : {
			x      : boundingBox.x - padding,
			y      : boundingBox.y - padding,
			width  : boundingBox.width + (padding * 2),
			height : boundingBox.height + (padding * 2),
		}
	}));
}

export async function captureScreenImage(page, encoding='base64') {
	return (await page.screenshot({ encoding,
		fullPage : true
	}));
}

export async function extractElements(page) {
	const elements = {
		'buttons'    : await Promise.all((await page.$$('button, input[type="button"], input[type="submit"]', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))),
		'headings'   : await Promise.all((await page.$$('h1, h2, h3, h4, h5, h6', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))),
		'icons'      : (await Promise.all((await page.$$('img, svg', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node))))).filter((icon)=> (icon.bounds.x <= 32 && icon.bounds.y <= 32)),
		'images'     : await Promise.all((await page.$$('img', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))),
		'links'      : await Promise.all((await page.$$('a', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))),
		'textfields' : await Promise.all((await page.$$('input:not([type="checkbox"]), input:not([type="radio"])', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))),
		'videos'     : await Promise.all((await page.$$('video', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))),
	};

	return (elements)
}

export async function extractMeta(page, elements) {
	return ({
		colors : {
			bg : [ ...new Set(Object.keys(elements).map((key)=> (elements[key].map((element)=> (element.styles['background'].replace(/ none.*$/, ''))))).flat(Infinity))],
			fg : [ ...new Set(Object.keys(elements).map((key)=> (elements[key].map((element)=> (element.styles['color'])))).flat(Infinity))]
		},
		fonts  : [ ...new Set(Object.keys(elements).map((key)=> (elements[key].map((element)=> (element.styles['font-family'])))).flat(Infinity))]
	});
}


const processNode = async(page, node)=> {
	let bounds = await node.boundingBox();
	if (bounds) {
		Object.keys(bounds).forEach((key)=> {
			bounds[key] = (bounds[key] << 0);
		});
	}

// 	const children = ((await (await node.getProperty('tagName')).jsonValue()).toLowerCase() !== 'svg') ? await Promise.all((await node.$$('*', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))) : [];
	const children = await Promise.all((await node.$$('*', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node))));
	const attribs = await page.evaluate((el)=> {
		const styles = elementStyles(el);

		return ({
// 			title   : (el.hasAttribute('alt') && el.alt.length > 0) ? el.alt : (el.hasAttribute('value') && el.value.length > 0) ? el.value : (el.textContent && el.textContent.length > 0) ? el.textContent : '',
// 			title   : (el.hasAttribute('alt') && el.alt.length > 0) ? el.alt : (el.hasAttribute('value') && el.value.length > 0) ? el.value : (el.innerText && el.innerText.length > 0) ? el.innerText : '',
			title         : (el.textContent) ? el.textContent : (el.hasAttribute('value')) ? el.value : (el.hasAttribute('placeholder')) ? el.getAttribute('placeholder') : (el.nodeName.toLowerCase() === 'img' && el.hasAttribute('alt')) ? el.alt : '',
			tag           : el.tagName.toLowerCase(),
			html          : ((el.childElementCount > 0) ? el.outerHTML.replace(el.innerHTML, '') : el.outerHTML).replace(/>/, '>[:]'),
			styles        : styles,
			accessibility : {},
			classes       : (el.className.length > 0) ? el.className : '',
// 			dom    : el.compareDocumentPosition(el.parentNode),
// 			dom    : Array.from(el.getProperties()),

// 			dom    : el.hasChildNodes(), //good
// 			dom    : el.childElementCount, //good
// 			dom    : el.children.length, // >0
// 			dom    : el.childElementCount, // >0
// 			dom    : el.childNodes.length, // always =1

// 			dom    : Array.from(el.childNodes),
// 			dom    : Array.from(el.children.values()),
// 				dom    : typeof el.children,
			path          : elementPath(el),
			meta          : {
				border      : styles['border'],
				color       : elementColor(styles),
				font        : elementFont(styles),
				text        : (el.innerText || ''),
				placeholder : (el.hasAttribute('placeholder')) ? el.placeholder : null,
				href        : (el.hasAttribute('href')) ? el.href : null,
				data        : (el.tagName.toLowerCase() === 'img' && el.hasAttribute('src')) ? imageData(el, elementBounds(el, styles).size) : null,
				url         : (el.hasAttribute('src')) ? el.src : (el.childElementCount > 0 && el.firstElementChild.hasAttribute('src')) ? el.firstElementChild.src : null,
			}
		});
	}, node);

	return ({...attribs, children,
// 		dom : Array.from(await node.getProperties().map), //
// 		dom : await (node.getProperty('innerHTML')), // works
// 		dom : await (await node.getProperty('childElementCount')).jsonValue(),
// 		dom : (await (await node.getProperty('tagName')).jsonValue()).toLowerCase(), //works!
// 		dom    : node.children, // undefined
// 		dom    : node.childNodes, // undefined
// 		dom    : typeof await (node.asElement()).childNodes.length,
// 		dom    : node.asElement(),
// 		dom    : Array.from(node.asElement().children),
		title : (attribs.title.length === 0) ? attribs.meta.text : attribs.title,
// 		image : (bounds) ? await captureElementImage(node) : '',
		meta  : { ...attribs.meta, bounds,
			box : await node.boxModel(),
// 			text : ((attribs.meta.text.length === 0 && children.length > 0) ? (await node.$$eval('*', (els)=> els.map(({ innerHTML })=> (innerHTML)))).filter((innerHTML)=> (innerHTML.length > 0 && !/^<.+>$/.test(innerHTML))).pop() : attribs.title)
		},
		enc   : {
			html          : await encryptTxt(attribs.html),
			styles        : await encryptObj(attribs.styles),
			accessibility : await encryptObj(attribs.accessibility)
		}
	});
};


export async function encryptObj(obj, { type, key }={}) {
	return (await encryptTxt(JSON.stringify(obj), { type, key }));
}


export async function encryptTxt(txt, { type, key }={}) {
	const cipher = await makeCipher({ type, key });
	const encTxt = await cipher.update(txt, 'utf8', 'hex');

	return (`${encTxt}${cipher.final('hex')}`);
}
