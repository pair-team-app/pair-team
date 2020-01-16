#!/usr/bin/env node
'use strict';

import crypto from 'crypto';
import inlineCss from 'inline-css';
import Jimp from 'jimp';
import JSZip from 'jszip';
import { Images } from 'lang-js-utils';
import stripHtml from 'string-strip-html';
import inline from 'web-resource-inliner';

import { CSS_PURGE_STYLES, HTML_STRIP_TAGS, IMAGE_MAX_HEIGHT, JPEG_COMPRESSION, ZIP_OPTS } from './consts';
import cryproCreds from '../crypto-creds';


const domNodeIDs = (flatDOM, backendNodeID)=> {
	const node = flatDOM.find(({ backendNodeId })=> (backendNodeId === backendNodeID));

	return ((node) ? {
		nodeID       : node.nodeId << 0,
		parentNodeID : node.parentId << 0
	} : 0);
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
		}).catch((error)=> {
			reject(error);
		});
	}));
};

const makeCipher = async({ method, key }={})=> {
	method = (method || cryproCreds.method);
	key = (key || cryproCreds.key);

	const iv = await crypto.randomBytes(cryproCreds.iv);
	const cipher = await crypto.createCipheriv(method, Buffer.from(key), iv);
	return ({ cipher, iv });
};


export async function captureScreenImage(page, scale=1.0) {
//	console.log('::|::', 'captureScreenImage()', { page : page.pathname, scale });

	const pngData = await page.screenshot({
		fullPage       : true,
		omitBackground : true
	});

	const pngImage = await Jimp.read(pngData).then(async(image)=> {
		return (await image.scale(scale));
	}).catch((e)=> {
		console.log('//|\\\\', 'captureScreenImage()', e);
	});

	const image = await pngImage.clone().crop(0, 0, pngImage.bitmap.width, Math.min(pngImage.bitmap.height, IMAGE_MAX_HEIGHT)).quality(100 - JPEG_COMPRESSION).getBase64Async(Jimp.MIME_JPEG);
//	console.log('::|::', 'captureScreenImage()', { page : page.url(), scale, srcPNG : { image : (await Jimp.read(pngData)).bitmap, dataURI : await (await Jimp.read(pngData)).getBase64Async(Jimp.MIME_PNG) }, pngImage : { image : pngImage.bitmap, dataURI : await pngImage.getBase64Async(Jimp.MIME_PNG) }, finalImage : { image : pngImage.clone().crop(0, 0, pngImage.bitmap.width, IMAGE_MAX_HEIGHT).quality(100 - JPEG_COMPRESSION).bitmap, dataURI : image } });
	return ({ full : await pngImage.getBase64Async(Jimp.MIME_JPEG), cropped : image });
}


export async function captureElementImage(element, scale=1.0) {
//	console.log('::|::', 'captureElementImage()', { element : (await (await element.getProperty('tagName')).jsonValue()).toLowerCase(), scale});

	const boundingBox = await element.boundingBox();
	const pngData = (boundingBox.width * boundingBox.height > 0) ? await element.screenshot({
		omitBackground : true
	}) : null;

	const pngImage = (pngData) ? await Jimp.read(pngData).then(async(image)=> {
		return (await image.scale(scale));
	}).catch((e)=> {
		return (null);
	}) : null;

	const image = await pngImage.clone().crop(0, 0, pngImage.bitmap.width, Math.min(pngImage.bitmap.height, IMAGE_MAX_HEIGHT)).quality(100 - JPEG_COMPRESSION).getBase64Async(Jimp.MIME_JPEG);
//	console.log('::|::', 'captureElementImage()', { element : (await (await element.getProperty('tagName')).jsonValue()).toLowerCase(), scale, srcPNG : { image : (await Jimp.read(pngData)).bitmap, dataURI : await (await Jimp.read(pngData)).getBase64Async(Jimp.MIME_PNG) }, pngImage : { image : pngImage.bitmap, dataURI : await pngImage.getBase64Async(Jimp.MIME_PNG) }, finalImage : { image : pngImage.clone().crop(0, 0, pngImage.bitmap.width, IMAGE_MAX_HEIGHT).quality(100 - JPEG_COMPRESSION).bitmap, dataURI : image } });
	return (image);
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
	const { cipher, iv } = await makeCipher({ type, key });
	const encTxt = Buffer.concat([cipher.update(txt), cipher.final()]);

	return (`${iv.toString('hex')}:${encTxt.toString('hex')}`);
}


export async function zipContent(content, filename=`${(Date.now() * 0.001).toString().replace('.', '_')}.dat`) {
	const zip = new JSZip();
	return (await (new Promise((resolve, reject)=> {
		zip.file(filename, content).generateAsync(ZIP_OPTS).then((data)=> {
			resolve(data);

		}).catch((e)=> {
			reject(e);
		});
	})));
}


export async function extractElements(device, page) {
//	console.log('::|::', 'extractElements()', { device : device.viewport.deviceScaleFactor, page : page.url() });

	const elements = {
		'views'      : [],
		'buttons'    : (await Promise.all((await page.$$('button, input[type="button"], input[type="submit"]', (nodes)=> (nodes))).map(async(node)=> (await processNode(device, page, node))))).filter((element)=> (element.visible)),
//		'headings'   : (await Promise.all((await page.$$('h1, h2, h3, h4, h5, h6', (nodes)=> (nodes))).map(async(node)=> (await processNode(device, page, node))))).filter((element)=> (element.visible)),
		'icons'      : (await Promise.all((await page.$$('img, svg', (nodes)=> (nodes))).map(async(node)=> (await processNode(device, page, node))))).filter((icon)=> (icon.meta.bounds.x <= 32 && icon.meta.bounds.y <= 32)).filter((element)=> (element.visible)),
		'images'     : (await Promise.all((await page.$$('img', (nodes)=> (nodes))).map(async(node)=> (await processNode(device, page, node))))).filter((element)=> (element.visible)),
//		'links'      : (await Promise.all((await page.$$('a', (nodes)=> (nodes))).map(async(node)=> (await processNode(device, page, node))))).filter((element)=> (element.visible)),
		'textfields' : (await Promise.all((await page.$$('input:not([type="checkbox"]), input:not([type="radio"])', (nodes)=> (nodes))).map(async(node)=> (await processNode(device, page, node))))).filter((element)=> (element.visible)),
// 		'videos'     : (await Promise.all((await page.$$('video', (nodes)=> (nodes))).map(async(node)=> (await processNode(device, page, node))))).filter((element)=> (element.visible)),
	};

	return (elements)
}


export async function extractMeta(device, page, elements) {
//	console.log('::|::', 'extractMeta()', { device : device.viewport.deviceScaleFactor, page : page.url(), elements : elements.length });

// 	const docHandle = await page.evaluateHandle(() => (window.document));

// 	const doc = await page.$('body');
// 	console.log('extractMeta()', await doc.boundingBox());
	return ({
		colors        : {
			bg : [ ...new Set(Object.keys(elements).map((key)=> (elements[key].map((element)=> ((element.styles.hasOwnProperty('background')) ? element.styles['background'].replace(/ none.*$/, '') : element.styles['background'] = window.rgbaObject('rgba(0, 0, 0, 0.0)'))))).flat(Infinity))],
			fg : [ ...new Set(Object.keys(elements).map((key)=> (elements[key].map((element)=> ((element.styles.hasOwnProperty('color')) ? element.styles['color'] : element.styles['color'] = window.rgbaObject('rgba(0, 0, 0, 0.0)'))))).flat(Infinity))]
		},
		description   : await page.title(),
		fonts         : [ ...new Set(Object.keys(elements).map((key)=> (elements[key].map((element)=> (element.styles['font-family'])))).flat(Infinity))],
		image         : (await captureScreenImage(page, (1 / device.viewport.deviceScaleFactor))).cropped,
		//links         : elements.links.map((link)=> (link.meta.href)).join(' '),
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
		nodeID        : domNodeIDs(flatDOM, backendDOMNodeId).nodeID,
		parentNodeID  : domNodeIDs(flatDOM, backendDOMNodeId).parentNodeID,
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


export async function pageElement(device, page, doc, html) {
//	console.log('::|::', 'pageElement()', { device : device.viewport.deviceScaleFactor, page : typeof page, doc, html });

	const element = await processNode(device, page, await page.$('body', async(node)=> (node)));
	const { meta, enc } = element;

	const { url, pathname, axeReport,
		axTree : tree,
		title  : text,
	} = doc;

	const image = (await captureScreenImage(page, (1 / device.viewport.deviceScaleFactor))).cropped;
//	console.log('pageElement()', { image });

	const { width, height } = await Images.dimensions(image);
	const { failed, passed, aborted } = axeReport;
	const accessibility = await zipContent(await encryptObj({ tree,
		report : {
			failed  : failed.filter(({ nodes })=> (nodes.find(({ html })=> (/^<(html|meta|link|body)/.test(html))))),
			passed  : passed.filter(({ nodes })=> (nodes.find(({ html })=> (/^<(html|meta|link|body)/.test(html))))),
			aborted : aborted.filter(({ nodes })=> (nodes.find(({ html })=> (/^<(html|meta|link|body)/.test(html)))))
		}
	}));

	return ({ ...element, html, accessibility,
		title   : (pathname === '' || pathname === '/') ? '/index' : `/${pathname.slice(1)}`,
		image   : await zipContent(image),
		classes : '',
		meta    : { ...meta, url, text,
			pathname : (pathname !== '') ? pathname : '/',
			bounds   : { ...meta.bounds, width, height }
		},
		enc     : { ...enc, accessibility,
			html : await zipContent(await encryptTxt(html)),
		}
	});
}


export async function pageStyleTag(html) {
	return (`<style>${Array.from(html.matchAll(/<style.*?>(.+?)<\/style>/g), (match)=> (match.pop())).join(' ')}</style>`);
}


export async function processNode(device, page, node) {
//	console.log('::|::', 'processNode()', { device : device.viewport.deviceScaleFactor, page : page.url(), node : (await (await element.getProperty('tagName')).jsonValue()).toLowerCase() });

// 	console.log(`node stuff:`, axe.commons.matches(node, 'a'));


// 	console.log('::::', getSelector(await page.$('body', (el)=> (el))));
// 	console.log('::::', await (await node.asElement()).getProperty('accessibility'));

// 	const children = ((await (await node.getProperty('tagName')).jsonValue()).toLowerCase() !== 'svg') ? await Promise.all((await node.$$('*', (nodes)=> (nodes))).map(async(node)=> (await processNode(device, page, node)))) : [];
// 	const children = ((await (await node.getProperty('tagName')).jsonValue()).toLowerCase() !== 'body') ? await Promise.all((await node.$$('*', (nodes)=> (nodes))).map(async(node)=> (await processNode(device, page, node)))) : [];
// 	const children = [];
	const attribs = await page.evaluate((el)=> {
		const styles = window.elementStyles(el);
// 		console.log(`el stuff: [${el.outerHTML}] [${el.nodeName}] [${el.nodeType}]`);

		return ({
// 			matches       : axe.commons.matches(el, 'a'),
			selector      : el.matches('a'),
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
			rootStyles    : null,
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


//	console.log('::|::', JSON.stringify(attribs, null, 2));
//	console.log('::|::', attribs.selector);

	const { flatDOM, pageCSS, tag, styles, accessibility, visible, meta } = attribs;
	const html = (await inlineElementStyles(attribs.html, pageCSS));
	const rootStyles = await elementRootStyles(attribs.html, pageCSS);

	delete (attribs['flatDOM']);
	delete (attribs['pageCSS']);
	delete (attribs['html']);
// 	delete (attribs['styles']); // needed for extracting fonts / colors / etc
 	delete (attribs['accessibility']);
 	delete (attribs['visible']);
 	delete (attribs['rootStyles']);
// 	delete (attribs['']);
// 	delete (attribs['']);

// 	console.log('::::', attribs);
//	console.log('::|::', getSelector(node.asElement()));

	const bounds = await node.boundingBox();
	const element = { ...attribs,
		node_id : domNodeIDs(flatDOM, await elementBackendNodeID(page, node._remoteObject.objectId)).nodeID,
		visible : (visible && bounds && (bounds.width * bounds.height) > 0),
		image   : (tag !== 'body' && visible && bounds && (bounds.width * bounds.height) > 0 && Object.keys(accessibility.report).map((key)=> (accessibility.report[key].length)).reduce((acc, val)=> (acc + val), 0) > 0) ? await zipContent((await captureElementImage(node, (1 / device.viewport.deviceScaleFactor))).cropped) : null,
		meta    : {
			...meta, bounds,
			box  : await node.boxModel(),
			data : (tag === 'img' && node.asElement().hasAttribute('src') && visible) ? imageData(node.asElement(), { width : bounds.width, height : bounds.height }) : meta.data
		},
		enc     : {
			html          : await zipContent(await encryptTxt(html)),
			styles        : await zipContent(await encryptObj(styles)),
			root_styles   : await zipContent(await encryptObj(rootStyles)),
			accessibility : await zipContent(await encryptObj(accessibility))
		}
	};


	return (element);
}


export async function stripPageTags(page, tags=[]) {
	await page.$$eval([HTML_STRIP_TAGS, ...tags].join(', '), (nodes)=> {
		nodes.forEach((node)=> {
			if (node.parentNode) {
				node.parentNode.removeChild(node);
			}
		});
	});
}
