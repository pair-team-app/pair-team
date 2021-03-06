#!/usr/bin/env node
'use strict';

import Jimp from 'jimp';

import {
	IMAGE_MAX_HEIGHT, IMAGE_THUMB_WIDTH, IMAGE_THUMB_HEIGHT,
	IMAGE_DEVICE_SCALER, IMAGE_THUMB_SCALER,
	DeviceExtract, LinkExtract
} from './consts';


const captureScreenImage = async(page, scale=1.0)=> {
		// console.log('::|::', 'captureScreenImage() -=[¡]=-  // init', { page : page.url(), scale }, '::|::');
		// console.log('::|::', 'captureScreenImage() -=[¡]=-  // init', { page : page.url().split('/').slice(-1).join(), scale }, '::|::');
	// console.log('::|::', 'captureScreenImage() -=[¡]=-  // init', { page : page.url(), scale, boundingBox : await (await page.$('body', async(node)=> (node))).boundingBox() }, '::|::');

	// const boundingBox = await (await page.$('body', async(node)=> (node))).boundingBox();

	let ts = Date.now();
	const pngData = await page.screenshot({
		fullPage       : false,
		omitBackground : true,
		path           : `${page.url().split('/').slice(-1).join()}.png`
	});

	// return ({ full : pngData, cropped : pngData, thumb : pngData });
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
		// return ((img.bitmap.data.length > MAX_BYTES) ? img.crop(0, 0, img.bitmap.width, (MAX_BYTES / img.bitmap.width)) : img);
	};
	const croppedImage = async({ image, size })=> (await image.clone().crop(0, 0, size.width, Math.min(size.height, IMAGE_MAX_HEIGHT)));
	const thumbedImage = ({ image, size} )=> (image.clone().scaleToFit(Math.min(IMAGE_THUMB_WIDTH, cropsize.bitmap.width), Math.min(IMAGE_THUMB_HEIGHT, cropsize.bitmap.height), IMAGE_THUMB_SCALER));

	const srcImage = (pngData) ? await Jimp.read(pngData).then(async(image)=> (image)).catch((error)=> (null)) : null;
	const fullsize = fullImage({ image : srcImage, scaleFactor : (scaled) ? scale : 1.0 });
	const cropsize = await croppedImage({ image : fullsize, size : fullsize.bitmap });
	const thumbsize = thumbedImage({ image : fullsize, size : fullsize.bitmap });

	const imageData = {
		src     : await imageObj({
			image : srcImage,
			type  : 'src'
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

	console.log('::|::', 'genImageSizes() -=[¡i¡]=-', { page : page.url(), data : {
		src     : imageData.src.data.length,
		full    : imageData.full.data.length,
		cropped : imageData.cropped.data.length,
		thumb   : imageData.thumb.data.length
	}}, '::|::');


	return (imageData);
};


const processNode = async(device, page, node)=> {
	// console.log('::|::', 'processNode()', { device, page: page.url(), node: (await (await node.getProperty('tagName')).jsonValue()).toLowerCase() });
	// 	console.log(`node stuff:`, axe.commons.matches(node, 'a'));

	const attribs = await page.evaluate((el)=> {
		return ({
			flatDOM       : window.flatDOM,
			title         : (el.textContent && el.textContent.length > 0) ? el.textContent : (el.hasAttribute('value') && el.value.length > 0) ? el.value : (el.hasAttribute('placeholder') && el.placeholder.length > 0) ? el.placeholder : (el.nodeName.toLowerCase() === 'img' && el.hasAttribute('alt') && el.alt.length > 0) ? el.alt : el.nodeName.toLowerCase(),
			tag           : el.tagName.toLowerCase(),
			accessibility : {
				tree   : null,
				report : window.elementAccessibility(el)
			}
		});
	}, node);

	//	console.log('::|::', JSON.stringify(attribs, null, 2));
	//	console.log('::|::', attribs.selector);

	const { flatDOM, tag } = attribs;
	delete (attribs['flatDOM']);
	// 	delete (attribs['']);

	const backendNodeID = await elementBackendNodeID(page, node._remoteObject.objectId);

	// console.log('::::', attribs);
	// console.log('::|::', { device : (await device).name, tag: (await (await node.getProperty('tagName')).jsonValue()).toLowerCase(), title, bounds: await node.boundingBox(), backendNodeID, properties : await (await node.getProperties()).values(), remoteObject: node._remoteObject });

	const { full, cropped, thumb } = await captureScreenImage(page, 1 / device.viewport.deviceScaleFactor);
	const bounds = { ...(await node.boundingBox()), ...cropped.size };

	const { nodeID } = domNodeIDs(flatDOM, backendNodeID);

	const element = { ...attribs,
		node_id         : nodeID,
		backend_node_id : backendNodeID,
		remote_obj      : node._remoteObject,
		images          : { thumb, cropped, full },
		meta            : { bounds,
			box  : await node.boxModel(),
			data : null
		}
	};

	// console.log('::|::', 'processNode() -=[¡]=-  // complete', { tag, title : attribs.title, bounds, cropped : (cropped !== null) }, '::|::');
	return (element);
};

export async function extractMeta(device, page) {
	// console.log('::|::', 'extractMeta() -=[¡]=-  // init', { page : page.url() }, '::|::');
	// const docHandle = await page.evaluateHandle(()=> (window.document));

	const pathname = await page.evaluate(()=> window.location.pathname);
	return ({ pathname,
		title       : (pathname === '' || pathname === '/') ? 'Index' : `${pathname.split('/').slice(1).join('/')}`,
		description : await page.title(),
		links       : [],
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


export async function processView(device, page, doc, html) {
	// console.log('::|::', 'processView() -=[¡]=-  // init', { page : page.url(), doc }, '::|::');
	// console.log('processView()', { html : { org : html.length, zip : (await zipContent(html)).length } }, '::|::');
	// console.log('::|::', 'processView()', { device : device.viewport.deviceScaleFactor, page : typeof page, doc, html });

	const element = await processNode(device, page, await page.$('body', async(node)=> (node)));
	const { meta, images } = element;
	const { bounds } = meta;

	const { url, pathname, axeReport, axTree: tree, title: text } = doc;
	const { full, cropped, thumb } = images;

	// console.log(':::: PAGE ::::', { device : device.name, tag, bounds, images, nodeID: node_id, backendNodeID : backend_node_id, remoteObject: remote_obj });
	// if (pathname.includes('legal')) {
		// console.log('::::', { bounds, size : full.length });
	// }
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
