#!/usr/bin/env node
'use strict';


import crypto from 'crypto';
import inlineCss from 'inline-css';
import stripHtml from 'string-strip-html';
import inline from 'web-resource-inliner';

import { CSS_PURGE_STYLES, CRYPTO_TYPE } from './consts';
import cryproCreds from '../crypto-creds';


const domNodeID = (flatDOM, backendNodeID)=> {
// 	console.log('domNodeID', flatDOM.map(({ nodeId, backendNodeId })=> ({ nodeId, backendNodeId })), backendNodeID);
	const node = flatDOM.find(({ backendNodeId })=> (backendNodeId === backendNodeID));
// 	const node = flatDOM.find(({ backendNodeId })=> {
// 		console.log('DOM NODE ID:', backendNodeId, backendNodeID, (backendNodeId === backendNodeID));
// 		return (backendNodeId === backendNodeID);
// 	});

	return ((node) ? node.nodeId << 0 : 0);
};

const elementRootStyles = async(html, pageStyles)=> {
	const inline = await inlineElementStyles(html, pageStyles, 'span');
	const { styles } = inline.match(/^.+? style="(?<styles>.+?)"/).groups;

	let obj = {};
	styles.slice(0, -1).split(';').forEach((style)=> {
		const kv = style.split(':');
		obj[kv[0].trim()] = kv[1].trim();
	});

	CSS_PURGE_STYLES.forEach((key)=> {
		if (obj.hasOwnProperty(key)) {
			delete (obj[key]);
		}
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

// 	console.log('captureElementImage', await (await element.getProperty('tagName')).jsonValue(), { ...boundingBox });

	return ((boundingBox.width * boundingBox.height > 0) ? `data:image/png;${encoding},${await element.screenshot({ encoding,
		clip : {
			x      : boundingBox.x - padding,
			y      : boundingBox.y - padding,
			width  : boundingBox.width + (padding * 2),
			height : boundingBox.height + (padding * 2),
		}
	})}` : null);
}


export async function captureScreenImage(page, encoding='base64') {
	return (`data:image/png;${encoding},${await page.screenshot({ encoding,
		fullPage : true
	})}`);
}


export async function elementBackendNodeID(page, objectID) {
	const node = (await page._client.send('DOM.describeNode', {
		objectId : objectID
	})).node;

// 	console.log('DOM.describeNode', objectID, JSON.stringify(node, null, 2), node.backendNodeId);
	return (node.backendNodeId << 0);
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
		'buttons'    : (await Promise.all((await page.$$('button, input[type="button"], input[type="submit"]', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node))))).filter((element)=> (element.visible)),
		'headings'   : (await Promise.all((await page.$$('h1, h2, h3, h4, h5, h6', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node))))).filter((element)=> (element.visible)),
		'icons'      : (await Promise.all((await page.$$('img, svg', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node))))).filter((icon)=> (icon.meta.bounds.x <= 32 && icon.meta.bounds.y <= 32)).filter((element)=> (element.visible)),
		'images'     : (await Promise.all((await page.$$('img', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node))))).filter((element)=> (element.visible)),
		'links'      : (await Promise.all((await page.$$('a', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node))))).filter((element)=> (element.visible)),
		'textfields' : (await Promise.all((await page.$$('input:not([type="checkbox"]), input:not([type="radio"])', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node))))).filter((element)=> (element.visible)),
// 		'videos'     : (await Promise.all((await page.$$('video', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node))))).filter((element)=> (element.visible)),
	};

	return (elements)
}


export async function extractMeta(page, elements) {
// 	const docHandle = await page.evaluateHandle(() => (window.document));

	const doc = await page.$('body');
// 	console.log('extractMeta()', await doc.boundingBox());
	return ({
		colors        : {
			bg : [ ...new Set(Object.keys(elements).map((key)=> (elements[key].map((element)=> ((element.styles.hasOwnProperty('background')) ? element.styles['background'].replace(/ none.*$/, '') : element.styles['background'] = window.rgbaObject('rgba(0, 0, 0, 0.0)'))))).flat(Infinity))],
			fg : [ ...new Set(Object.keys(elements).map((key)=> (elements[key].map((element)=> ((element.styles.hasOwnProperty('color')) ? element.styles['color'] : element.styles['color'] = window.rgbaObject('rgba(0, 0, 0, 0.0)'))))).flat(Infinity))]
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




export function formatAXNode(flatDOM, node) {
	const { backendDOMNodeId, childIds, name, nodeId, role } = node;

	delete (node['backendDOMNodeId']);
	delete (node['childIds']);
	delete (node['ignored']);
	delete (node['name']);
	delete (node['nodeId']);
	delete (node['properties']);
	delete (node['role']);

	return ({ ...node,
		axNodeID      : nodeId << 0,
		nodeID        : domNodeID(flatDOM, backendDOMNodeId),
		backendNodeID : backendDOMNodeId,
		name          : name.value,
		role          : role.value,
		childIDs      : childIds.map((id)=> (id << 0)),
		childNodes    : []
	});
}


export function fillChildNodes(nodes, ids) {
	const childNodes = nodes.filter(({ axNodeID })=> (ids.indexOf(axNodeID) !== -1)).map((axNode)=> {

		const { childIDs } = axNode;
		delete (axNode['childIDs']);

		return ({ ...axNode,
			childNodes : (childIDs.length > 0) ? fillChildNodes(nodes, childIDs) : []
		})
	});

	return (childNodes);
}


export function formatHTML(html, opts={}) {
	return (stripHtml(html, {
		stripTogetherWithTheirContents : ['head', 'style'],
		onlyStripTags                  : ['DOCTYPE', 'html', 'head', 'body', 'style'],
		trimOnlySpaces                 : true,
		...opts
	}));
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

	const accessibility = {
		tree   : doc.axTree,
		report : {
			failed  : doc.axeReport.failed.filter(({ nodes })=> (nodes.find(({ html })=> (/^<(html|meta|body)/.test(html))))),
			passed  : doc.axeReport.passed.filter(({ nodes })=> (nodes.find(({ html })=> (/^<(html|meta|body)/.test(html))))),
			aborted : doc.axeReport.aborted.filter(({ nodes })=> (nodes.find(({ html })=> (/^<(html|meta|body)/.test(html)))))
		}
	};

	return ({ ...element, html, accessibility,
		dom           : doc.dom,
		title         : (doc.pathname === '' || doc.pathname === '/') ? '/index' : `/${doc.pathname.slice(1)}`,
		image         : doc.image,
		classes       : '',
		meta          : { ...element.meta,
			text     : doc.title,
			url      : doc.url,
			pathname : (doc.pathname !== '') ? doc.pathname : '/'
		},
		enc           : { ...element.enc,
			html          : await encryptTxt(html),
			accessibility : await encryptObj(accessibility)
		}
	});
}

export async function pageStyleTag(html) {
	return (`<style>${Array.from(html.matchAll(/<style.*?>(.+?)<\/style>/g), (match)=> (match.pop())).join(' ')}</style>`);
}


export async function processNode(page, node) {
	const children = [];
	try {
		const properties = await node.getProperties();
		for (const property of properties.values()) {
// 			console.log(':-:', await property.jsonValue());
			const element = property.asElement();
			if (element) {
				children.push(element);
			}
		}
	} catch (e) {/* …\(^_^)/… */}


// 	console.log('::::', (await page.evaluate((el)=> (el), node)));
// 	console.log('::::', await (await node.asElement()).getProperty('accessibility'));

// 	const children = ((await (await node.getProperty('tagName')).jsonValue()).toLowerCase() !== 'svg') ? await Promise.all((await node.$$('*', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))) : [];
// 	const children = ((await (await node.getProperty('tagName')).jsonValue()).toLowerCase() !== 'body') ? await Promise.all((await node.$$('*', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))) : [];
// 	const children = [];
	const attribs = await page.evaluate((el)=> {
		const styles = elementStyles(el);
// 		console.log(`el stuff: [${el.outerHTML}] [${el.nodeName}] [${el.nodeType}]`);

		return ({
			flatDOM       : window.flatDOM,
			pageCSS       : window.styleTag,

			title         : (el.textContent && el.textContent.length > 0) ? el.textContent : (el.hasAttribute('value') && el.value.length > 0) ? el.value : (el.hasAttribute('placeholder') && el.placeholder.length > 0) ? el.placeholder : (el.nodeName.toLowerCase() === 'img' && el.hasAttribute('alt') && el.alt.length > 0) ? el.alt : el.nodeName.toLowerCase(),
			tag           : el.tagName.toLowerCase(),
			html          : el.outerHTML,
			styles        : styles,
			accessibility : {
				tree   : null,
				report : window.elementAccessibility(el)
			},
			classes       : (el.className.length > 0) ? el.className : '',
			rootStyles    : {},
			visible       : (window.elementVisible(el, styles)),
			meta          : {
				border      : styles['border'],
				color       : window.elementColor(styles),
				font        : window.elementFont(styles),
				text        : (el.innerText || ''),
				placeholder : (el.hasAttribute('placeholder')) ? el.placeholder : null,
				href        : (el.hasAttribute('href')) ? el.href : null,
				data        : null,
				url         : (el.hasAttribute('src')) ? el.src : (el.childElementCount > 0 && el.firstElementChild.hasAttribute('src')) ? el.firstElementChild.src : null
			}
		});
	}, node);


	const { flatDOM, pageCSS, tag, styles, accessibility, visible, meta } = attribs;
	const html = (await inlineElementStyles(attribs.html, pageCSS));
	const rootStyles = await elementRootStyles(attribs.html, pageCSS);
// 	const accessibility = await elementAccessibility(page, node);

	delete (attribs['flatDOM']);
	delete (attribs['html']);
	// 	delete (attribs['styles']);
	delete (attribs['pageCSS']);

	const bounds = await node.boundingBox();
	if (bounds) {
		Object.keys(bounds).forEach((key) => {
			bounds[key] = Math.ceil(bounds[key]);
		});
	}

	return ({
		...attribs, html, rootStyles, children,
		node_id : domNodeID(flatDOM, await elementBackendNodeID(page, node._remoteObject.objectId)),
		visible : (visible && bounds && (bounds.width * bounds.height) > 0),
		image   : null,//(visible && bounds && (bounds.width * bounds.height) > 0) ? await captureElementImage(node) : null,
		meta    : {
			...meta, bounds,
			box  : await node.boxModel(),
			data : (tag === 'img' && node.asElement().hasAttribute('src') && visible) ? imageData(node.asElement(), { width : bounds.width, height : bounds.height }) : meta.data
		},
		enc     : {
			html          : await encryptTxt(html),
			styles        : await encryptObj(styles),
			root_styles   : await encryptObj(rootStyles),
			accessibility : await encryptObj(accessibility)
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
