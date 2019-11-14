#!/usr/bin/env node
'use strict';


import crypto from 'crypto';

import { CRYPTO_TYPE } from './consts';
import cryproCreds from '../crypto-creds';
import inlineCss from 'inline-css';
import stripHtml from 'string-strip-html';
import inline from 'web-resource-inliner';


const elementRootStyles = async(html, pageStyles)=> {
	const inline = await inlineElementStyles(html, pageStyles, 'span');
	const { styles } = inline.match(/^.+? style="(?<styles>.+?)"/).groups;

	let obj = {};
	styles.slice(0, -1).split(';').forEach((style)=> {
		const kv = style.split(':');
		obj[kv[0].trim()] = kv[1].trim();
	});

	return (obj);
};

const inlineElementStyles = (html, styles, wrapper=null)=> {
	return (new Promise((resolve, reject) => {
		inlineCss(`<html>${styles}${html}</html>`, { url : ' ' }).then((result)=> {
			resolve((!wrapper) ? result.replace(/<html.+?>(.+)<\/html>/g, '$1') : result.replace(/^<html(.+)<\/html>$/, `<${wrapper}$1</${wrapper}>`));
		});
	}));
};

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


export async function embedPageStyles(html, relativeTo='build') {
	const opts = { relativeTo,
		fileContent : html.replace(/="\//g, '="./'),
		images      : false,
		scripts     : false
	};

	return (new Promise((resolve, reject)=> {
		inline.html(opts, (err, result)=> {
			if (err) {
				reject(err);
			}

			resolve(result.replace(/\n/g, ''));
		});
	}));
}


export async function encryptObj(obj, { type, key }={}) {
	return (await encryptTxt(JSON.stringify(obj), { type, key }));
}


export async function encryptTxt(txt, { type, key }={}) {
	const cipher = await makeCipher({ type, key });
	const encTxt = await cipher.update(txt, 'utf8', 'hex');

	return (`${encTxt}${cipher.final('hex')}`);
}


export async function extractElements(page) {
	const elements = {
		'views'      : [],
		'buttons'    : await Promise.all((await page.$$('button, input[type="button"], input[type="submit"]', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))),
		'headings'   : await Promise.all((await page.$$('h1, h2, h3, h4, h5, h6', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))),
		'icons'      : (await Promise.all((await page.$$('img, svg', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node))))).filter((icon)=> (icon.meta.bounds.x <= 32 && icon.meta.bounds.y <= 32)),
		'images'     : await Promise.all((await page.$$('img', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))),
		'links'      : await Promise.all((await page.$$('a', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))),
		'textfields' : await Promise.all((await page.$$('input:not([type="checkbox"]), input:not([type="radio"])', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))),
// 		'videos'     : await Promise.all((await page.$$('video', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))),
	};

	return (elements)
}


export async function extractMeta(page, elements) {
	return ({
		accessibility : await page.accessibility.snapshot(),
		colors        : {
			bg : [ ...new Set(Object.keys(elements).map((key)=> (elements[key].map((element)=> (element.styles['background'].replace(/ none.*$/, ''))))).flat(Infinity))],
			fg : [ ...new Set(Object.keys(elements).map((key)=> (elements[key].map((element)=> (element.styles['color'])))).flat(Infinity))]
		},
		description   : await page.title(),
		fonts         : [ ...new Set(Object.keys(elements).map((key)=> (elements[key].map((element)=> (element.styles['font-family'])))).flat(Infinity))],
		image         : await captureScreenImage(page),
		links         : elements.links.map((link)=> (link.meta.href)).join(' '),
		pathname      : await page.evaluate(()=> (window.location.pathname)),
		styles        : await page.evaluate(()=> (elementStyles(document.documentElement))),
		url           : await page.url()
	});
}


export function formatHTML(html, opts={}) {
	return (stripHtml(html, {
		stripTogetherWithTheirContents : ['head', 'style'],
		onlyStripTags                  : ['DOCTYPE', 'html', 'head', 'body', 'style'],
		trimOnlySpaces                 : true,
		...opts
	}));

// 	const { styles } = html.match(/style="(?<styles>.+?)"/).groups;
// 	return (`<div style="${styles}">${stripHtml(html, {
// 		stripTogetherWithTheirContents : ['head', 'style'],
// 		onlyStripTags                  : ['DOCTYPE', 'html', 'head', 'body', 'style'],
// 		trimOnlySpaces                 : true,
// 		...opts
// 	})}</div>`);
}


export async function inlineCSS(html, style='') {
	return (new Promise((resolve, reject)=> {
		inlineCss(`${style}${html}`, { url : ' ' }).then((result)=> {
			resolve(result);
		});
	}));
}


export async function pageElement(page, doc, html) {
	const element = await processNode(page, await page.$('body', async(node)=> (node)));

	return ({ ...element, html,
		title         : (doc.pathname === '' || doc.pathname === '/') ? '/index' : `/${doc.pathname.slice(1)}`,
		image         : doc.image,
		accessibility : doc.accessibility,
		classes       : '',
		meta          : { ...element.meta,
			text     : doc.title,
			url      : doc.url,
			pathname : (doc.pathname !== '') ? doc.pathname : '/'
		},
		enc           : { ...element.enc,
			html          : await encryptTxt(html),
			accessibility : await encryptObj(doc.accessibility)
		}
	});
}

export async function pageStyleTag(html) {
	return (`<style>${Array.from(html.matchAll(/<style.*?>(.+?)<\/style>/g), (match)=> (match.pop())).join(' ')}</style>`);
}


export async function processNode(page, node) {
	let bounds = await node.boundingBox();
	if (bounds) {
		Object.keys(bounds).forEach((key)=> {
			bounds[key] = Math.ceil(bounds[key]);
		});
	}

// 	const children = ((await (await node.getProperty('tagName')).jsonValue()).toLowerCase() !== 'svg') ? await Promise.all((await node.$$('*', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))) : [];
	const children = [];//await Promise.all((await node.$$('*', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node))));
	const attribs = await page.evaluate((el)=> {
		const styles = elementStyles(el);

// 		console.log('DERP', inlineElementStyles(el.outerHTML));

		return ({
// 			title   : (el.hasAttribute('alt') && el.alt.length > 0) ? el.alt : (el.hasAttribute('value') && el.value.length > 0) ? el.value : (el.textContent && el.textContent.length > 0) ? el.textContent : '',
// 			title   : (el.hasAttribute('alt') && el.alt.length > 0) ? el.alt : (el.hasAttribute('value') && el.value.length > 0) ? el.value : (el.innerText && el.innerText.length > 0) ? el.innerText : '',
			title         : (el.textContent && el.textContent.length > 0) ? el.textContent : (el.hasAttribute('value') && el.value.length > 0) ? el.value : (el.hasAttribute('placeholder') && el.getAttribute('placeholder').length > 0) ? el.getAttribute('placeholder') : (el.nodeName.toLowerCase() === 'img' && el.hasAttribute('alt') && el.alt.length > 0) ? el.alt : el.nodeName.toLowerCase(),
			tag           : el.tagName.toLowerCase(),
			html          : el.outerHTML,
			styles        : styles,
			accessibility : elementAccessibility(el),
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
// 			dom    : typeof el.children,
// 			path          : elementPath(el),
			path          : {},
			pageCSS       : styleTag,
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

	const html = (await inlineElementStyles(attribs.html, attribs.pageCSS));

	return ({...attribs, html, children,
// 		dom : Array.from(await node.getProperties().map), //
// 		dom : await (node.getProperty('innerHTML')), // works
// 		dom : await (await node.getProperty('childElementCount')).jsonValue(),
// 		dom : (await (await node.getProperty('tagName')).jsonValue()).toLowerCase(), //works!
// 		dom    : node.children, // undefined
// 		dom    : node.childNodes, // undefined
// 		dom    : typeof await (node.asElement()).childNodes.length,
// 		dom    : node.asElement(),
// 		dom    : Array.from(node.asElement().children),
// 		image : (bounds) ? await captureElementImage(node) : '',
		image : '',
		path  : await elementRootStyles(attribs.html, attribs.pageCSS),
		meta  : { ...attribs.meta, bounds,
			box : await node.boxModel()
		},
		enc   : {
			html          : await encryptTxt(html),
			styles        : await encryptObj(attribs.styles),
			accessibility : await encryptObj(attribs.accessibility)
		}
	});
}


export async function stripPageTags(page, tags=[]) {
	await page.$$eval(['noscript', 'script', ...tags].join(', '), (nodes)=> {
		nodes.forEach((node)=> {
			if (node.parentNode) {
				node.parentNode.removeChild(node);
			}
		});
	});
}
