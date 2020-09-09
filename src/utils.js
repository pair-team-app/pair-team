#!/usr/bin/env node
'use strict';

import inlineCss from 'inline-css';
import Jimp from 'jimp';
import JSZip from 'jszip';
import stripHtml from 'string-strip-html';
import inline from 'web-resource-inliner';
import {
	HTML_STRIP_TAGS, ZIP_OPTS,
	IMAGE_MAX_HEIGHT, IMAGE_THUMB_WIDTH, IMAGE_THUMB_HEIGHT,
	IMAGE_DEVICE_SCALER, IMAGE_THUMB_SCALER,
	DeviceExtract, LinkExtract
} from './consts';


const captureElementImage = async (page, element, scale=1.0, padding=[0, 0, 0, 0])=> {
	const boundingBox = await element.boundingBox();
	// const title = (await (await element.getProperty('tagName')).jsonValue()).toLowerCase();

	//	console.log('::|::', 'captureElementImage() -=[¡]=-  // init', { page : page.url(), element : title, boundingBox }, '::|::');
	let ts = Date.now();
	const pngData = (boundingBox && boundingBox.width * boundingBox.height > 0) ? await page.screenshot({
		type : 'png',
		clip : {
			x      : boundingBox.x - padding[3],
			y      : boundingBox.y - padding[0],
			width  : boundingBox.width + (padding[1] + padding[3]),
			height : boundingBox.height + (padding[0] + padding[2])
		}
	}) : null;

	return (genImageSizes({ pngData, scale }, false));
};


const captureScreenImage = async(page, scale=1.0)=> {
	//	console.log('::|::', 'captureScreenImage() -=[¡]=-  // init', { page : page.url(), scale }, '::|::');
	// console.log('::|::', 'captureScreenImage() -=[¡]=-  // init', { page : page.url(), scale, boundingBox : await (await page.$('body', async(node)=> (node))).boundingBox() }, '::|::');

	// const boundingBox = await (await page.$('body', async(node)=> (node))).boundingBox();

	let ts = Date.now();
	const pngData = await page.screenshot({
		type           : 'png',
		fullPage       : true,
		omitBackground : true,
		// clip           : { ...await (await page.$('body', async(node)=> (node))).boundingBox() }
		// clip           : {
		// 	x      : 0,
		// 	y      : 0,
		// 	width  : boundingBox.width,
		// 	height : Math.min(IMAGE_MAX_HEIGHT, boundingBox.height)
		//  }
	});

	return (genImageSizes({ pngData, scale }, false, { page }));
};


const domNodeIDs = (flatDOM, backendNodeID)=> {
	const node = flatDOM.find(({ backendNodeId })=> (backendNodeId === backendNodeID));

	return ((node) ? {
		nodeID       : node.nodeId << 0,
		parentNodeID : node.parentId << 0
	} : 0);
};


const elementBackendNodeID = async(page, objectID)=> {
	const node = (await page._client.send('DOM.describeNode', {
		objectId : objectID
	})).node;

	// 	console.log('DOM.describeNode', objectID, JSON.stringify(node, null, 2), node.backendNodeId);
	return (node.backendNodeId << 0);
};


const genImageSizes = async({ pngData, scale }, deviceScaled=true, meta=null)=> {
	// console.log('genImageSizes()', { pngData, scale, deviceScaled });

	const MAX_BYTES = 1048576 * 2;
	const { page } = meta || {};
	const scaled = (scale !== 1.0 || deviceScaled);
	const scaleImage = ({ image, factor} )=> (image.scale(factor, IMAGE_DEVICE_SCALER));
	const imageObj = async({ image, type })=> ((!image) ? null : { type,
		// data : await zipContent(await image.getBase64Async(Jimp.MIME_PNG)),
		data : await image.getBase64Async(Jimp.MIME_PNG),
		size : {
			width  : image.bitmap.width,
			height : image.bitmap.height
		}
	});

	const fullImage = ({ image, scaleFactor=1.0 })=> {
		const img = (scaleFactor !== 1.0) ? scaleImage({ image, factor : scaleFactor }) : image;
		return ((img.bitmap.data.length > MAX_BYTES) ? img.crop(0, 0, img.bitmap.width, (MAX_BYTES / img.bitmap.width)) : img);
	};
	const croppedImage = async({ image, size })=> (await image.clone().crop(0, 0, size.width, Math.min(size.height, IMAGE_MAX_HEIGHT)));
	const thumbedImage = ({ image, size} )=> (image.clone().scaleToFit(Math.min(IMAGE_THUMB_WIDTH, cropsize.bitmap.width), Math.min(IMAGE_THUMB_HEIGHT, cropsize.bitmap.height), IMAGE_THUMB_SCALER));

	const srcImage = (pngData) ? await Jimp.read(pngData).then(async(image)=> (image)).catch((error)=> (null)) : null;
	const fullsize = fullImage({ image : srcImage, scaleFactor : (scaled) ? scale : 1.0 });
	const cropsize = await croppedImage({ image : fullsize, size : fullsize.bitmap });
	const thumbsize = thumbedImage({ image : fullsize, size : fullsize.bitmap });

	const imageData = {
		org     : await imageObj({
			image : srcImage,
			type  : 'org'
		}),
		full    : await imageObj({
			image : fullsize,
			type  : 'full'
		}),
		cropped : await imageObj({
			image : cropsize,
			type  : 'cropped'
		}),
		thumb   : await imageObj({
			image : thumbsize,
			type  : 'thumb'
		})
	};

	if (imageData.cropped.data.length === imageData.full.data.length) {
		delete (imageData.cropped.data);
	}

	if (imageData.thumb.data.length === imageData.full.data.length) {
		delete (imageData.thumb.data);
	}


	delete (imageData['org']);

	console.log('::|::', 'genImageSizes() -=[¡i¡]=-', { page : page.url(), data : {
		// org     : imageData.org.data.length,
		full    : imageData.full.data.length,
		cropped : (imageData.cropped.data) ? imageData.cropped.data.length : 0,
		thumb   : (imageData.thumb.data) ? imageData.thumb.data.length : 0
	}}, '::|::');


	return (imageData);
};


const processNode = async(device, page, node)=> {
	// console.log('::|::', 'processNode()', { device, page: page.url(), node: (await (await node.getProperty('tagName')).jsonValue()).toLowerCase() });
	// 	console.log(`node stuff:`, axe.commons.matches(node, 'a'));
	// 	const children = ((await (await node.getProperty('tagName')).jsonValue()).toLowerCase() !== 'body') ? await Promise.all((await node.$$('*', (nodes)=> (nodes))).map(async(node)=> (await processNode(device, page, node)))) : [];

	//	const bounds = await node.boundingBox();
	//	if (!bounds || (bounds.width === 0 || bounds.height === 0)) {
	//		return (null);
	//	}

	const attribs = await page.evaluate((el)=> {
		const styles = window.elementStyles(el);
		const html = el.outerHTML;

		// Object.keys(elements).forEach((key)=> {
		// 	const items = [ ...elements[key], ...els[key]];
		// 	elements[key] = (key === 'views') ? items : items.map((el, i)=> ((items.find(({ html }, ii)=> (html === el.html && ii > i))) ? null : el)).filter((el)=> (el !== null));
		// });

		// 		console.log(`el stuff: [${el.outerHTML}] [${el.nodeName}] [${el.nodeType}]`);

		return ({ styles,
			flatDOM       : window.flatDOM,
			pageCSS       : window.styleTag,
			title         : (el.textContent && el.textContent.length > 0) ? el.textContent : (el.hasAttribute('value') && el.value.length > 0) ? el.value : (el.hasAttribute('placeholder') && el.placeholder.length > 0) ? el.placeholder : (el.nodeName.toLowerCase() === 'img' && el.hasAttribute('alt') && el.alt.length > 0) ? el.alt : el.nodeName.toLowerCase(),
			tag           : el.tagName.toLowerCase(),
			html          : el.outerHTML,
			accessibility : {
				tree   : null,
				report : window.elementAccessibility(el)
			},
			classes       : el.className.length > 0 ? el.className : '',
			visible       : window.elementVisible(el, styles),
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

	const { flatDOM, tag, visible, meta } = attribs;
	// const html = await inlineElementStyles(attribs.html, pageCSS);
	// const rootStyles = await elementRootStyles(attribs.html, pageCSS);

	delete (attribs['flatDOM']);
	delete (attribs['pageCSS']);
	delete (attribs['visible']);
	// 	delete (attribs['']);

	const backendNodeID = await elementBackendNodeID(page, node._remoteObject.objectId);

	// console.log('::::', attribs);
	// console.log('::|::', { device : (await device).name, tag: (await (await node.getProperty('tagName')).jsonValue()).toLowerCase(), title, bounds: await node.boundingBox(), backendNodeID, properties : await (await node.getProperties()).values(), remoteObject: node._remoteObject });

	const { full, cropped, thumb } = (tag === 'body') ? await captureScreenImage(page, 1 / device.viewport.deviceScaleFactor) : await captureElementImage(page, node, 1 / device.viewport.deviceScaleFactor);
	const bounds = { ...(await node.boundingBox()), ...cropped.size };

	const { nodeID } = domNodeIDs(flatDOM, backendNodeID);

	// if (tag !== 'body') {
	// 	console.log('\n::::(' + page.url() + ') ELEMENT ::::', { inlineHTML: await inlineElementStyles(html, pageCSS), device : device.name, nodeID, backendNodeID, tag, title, bounds, images: { full: full.size, cropped: cropped.size, thumb: thumb.size }});
	// 	console.log('::::', { tag, thumb : thumb.size, cropped : cropped.size, full : full.size });
	// }

	const element = { ...attribs, visible,
		node_id         : nodeID,
		backend_node_id : backendNodeID,
		remote_obj      : node._remoteObject,
		images          : { thumb, cropped, full },
		meta            : { ...meta, bounds,
			box  : await node.boxModel(),
			data : null
		}
	};

	// console.log('::|::', 'processNode() -=[¡]=-  // complete', { tag, title : attribs.title, bounds, cropped : (cropped !== null) }, '::|::');
	return (element);
};


const zipContent = async(content, filename=`${(Date.now() * 0.001).toString().replace('.', '_')}.dat`)=> {
	const zip = new JSZip();
	return (await (new Promise((resolve, reject)=> {
		zip.file(filename, content).generateAsync(ZIP_OPTS).then((data)=> {
			resolve(data);

		}).catch((e)=> {
			reject(e);
		});
	})));
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


export async function extractElements(device, page) {
	// console.log('::|::', 'extractElements()', { device : device.viewport.deviceScaleFactor, page : page.url() }, '::|::');

	const elementFilter = async(query)=> {
		return ((await Promise.allSettled(await page.$$(query, (nodes)=> (nodes))))
			.map(({ status, value })=> (status === ('fulfilled') ? value : reject(status)))
			.map(async(node, i)=> {
				return (new Promise(async(resolve, reject)=> {
					if (node === null || !(await node.boundingBox())) {
						reject(new Error(`NO BOUNDS for node [${node._remoteObject.objectID}]`));

					} else {
						resolve(node);
					}
				})).then(async(node)=> (await processNode(device, page, node))).catch((error)=> null);
			})
		);
	};

	const elements = {
		views      : [],
		buttons    : (await Promise.all(await elementFilter('button, input[type="button"], input[type="submit"]'))).filter((node)=> (node !== null)),
		headings   : (await Promise.all(await elementFilter('h1, h2, h3, h4, h5, h6'))).filter((node)=> (node !== null)),
		images     : (await Promise.all(await elementFilter('img, svg'))).filter((node)=> (node !== null)),
		links      : (await Promise.all(await elementFilter('a'))).filter((node)=> (node !== null)),
		textfields : (await Promise.all(await elementFilter('input:not([type="checkbox"]), input:not([type="radio"]), input:not([type="button"]), input:not([type="hidden"]), input:not([type="file"]), textarea'))).filter((node)=> (node !== null))
	};

	// console.log('::::: ELEMENTS ::::', elements);

	return (elements);
}


export async function extractMeta(device, page, elements) {
	// console.log('::|::', 'extractMeta() -=[¡]=-  // init', { page : page.url() }, '::|::');
	// const docHandle = await page.evaluateHandle(()=> (window.document));

	const pathname = await page.evaluate(()=> window.location.pathname);
	return ({ pathname,
		title       : (pathname === '' || pathname === '/') ? 'Index' : `${pathname.split('/').slice(1).join('/')}`,
		colors      : {
			bg : [ ...new Set(Object.keys(elements).map((key)=> elements[key].map((element)=> (element.styles.hasOwnProperty('background')) ? element.styles['background'].replace(/ none.*$/, '') : (element.styles['background'] = window.rgbaObject('rgba(0, 0, 0, 0.0)')))).flat(Infinity))],
			fg : [ ...new Set(Object.keys(elements).map((key)=> elements[key].map((element)=> (element.styles.hasOwnProperty('color')) ? element.styles['color'] : (element.styles['color'] = window.rgbaObject('rgba(0, 0, 0, 0.0)')))).flat(Infinity))]
		},
		description : await page.title(),
		fonts       : [ ...new Set(Object.keys(elements).map((key)=> elements[key].map((element)=> element.styles['font-family'])).flat(Infinity))],
		links       : [],
		styles      : await page.evaluate(()=> (elementStyles(document.documentElement))),
		url         : await page.url()
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
			childNodes : childIDs.length > 0 ? fillChildNodes(nodes, childIDs) : []
		});
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
		}).catch((error)=> {
			reject(error);
		});
	}));
}


export async function pageStyleTag(html) {
	return (`<style>${Array.from(html.matchAll(/<style.*?>(.+?)<\/style>/g), (match)=> match.pop()).join(' ')}</style>`);
}


export async function processView(device, page, doc, html) {
	// console.log('::|::', 'processView() -=[¡]=-  // init', { page : page.url(), doc }, '::|::');
	// console.log('processView()', { html : { org : html.length, zip : (await zipContent(html)).length } }, '::|::');
	// console.log('::|::', 'processView()', { device : device.viewport.deviceScaleFactor, page : typeof page, doc, html });

	const element = await processNode(device, page, await page.$('body', async(node)=> (node)));
	const { meta, images } = element;
	const { bounds } = meta;

	const { url, pathname, axeReport, axTree: tree, title: text } = doc;
	const { full, cropped, thumb } = images;

	// console.log(':::: PAGE ::::', { device : device.name, tag, visible, bounds, images, nodeID: node_id, backendNodeID : backend_node_id, remoteObject: remote_obj });
	// console.log('::::', { thumb, cropped, full });
	// console.log('::|::', 'processView() -=[¡i¡]=-  // AX init', { cropped, page : page.url() }, '::|::');

	const { failed, passed, aborted } = axeReport;
	const accessibility = { tree,
		report : {
			failed  : failed.filter(({ nodes })=> (nodes.find(({ html })=> (/^<(html|meta|link|body)/.test(html))))),
			passed  : passed.filter(({ nodes })=> (nodes.find(({ html })=> (/^<(html|meta|link|body)/.test(html))))),
			aborted : aborted.filter(({ nodes })=> (nodes.find(({ html })=> (/^<(html|meta|link|body)/.test(html)))))
		}
	};

	// console.log('::|::', 'processView() -=[¡V]=-  // AX done', { page : page.url() }, '::|::');
	// console.log('::|::', 'processView() -=[¡V]=-', { element : { ...element, html, accessibility, title : (pathname === '' || pathname === '/') ? 'Index' : `${pathname.split('/').slice(1).join('/')}`, image : await zipContent(data), classes : '', meta    : { ...meta, url, text, pathname : (pathname !== '') ? pathname : '/', bounds : { ...meta.bounds, ...size }}, zip : { ...zip, accessibility, html : await zipContent(html) }}}, '::|::');

	return ({ ...element, html, accessibility,
	html : '',
		title  : (pathname === '' || pathname === '/') ? 'Index' : `${pathname.split('/').slice(1).join('/')}`,
		images : { thumb, cropped, full },
		meta   : { ...meta, url, text,
			pathname : (pathname !== '') ? pathname : '/'
		}
	});
}


export async function stripPageTags(page, tags=[]) {
	await page.$$eval([ HTML_STRIP_TAGS, ...tags ].join(', '), (nodes)=> {
		nodes.forEach((node)=> {
			if (node.parentNode) {
				node.parentNode.removeChild(node);
			}
		});
	});
}
