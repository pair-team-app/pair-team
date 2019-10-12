#!/usr/bin/env node
'use strict';

import stringify from 'json-stringify-safe';


export async function captureElementImage(element, encoding='binary') {
	const boundingBox = await element.boundingBox();
	const padding = 10;

	return (await element.screenshot({ encoding,
		clip : {
			x      : boundingBox.x - padding,
			y      : boundingBox.y - padding,
			width  : boundingBox.width + padding * 2,
			height : boundingBox.height + padding * 2,
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
		'links'   : await Promise.all((await page.$$('a', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))),
		'buttons' : await Promise.all((await page.$$('button, input[type="button"], input[type="submit"]', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node)))),
		'images'  : await Promise.all((await page.$$('img', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node))))
	};

	return (elements);
}


const processNode = async(page, node)=> {
	let bounds = await node.boundingBox();
	if (bounds) {
		Object.keys(bounds).forEach((key)=> {
			bounds[key] = (bounds[key] << 0);
		});
	}

	const children = await Promise.all((await node.$$('*', (nodes)=> (nodes))).map(async(node)=> (await processNode(page, node))));
	const attribs = await page.evaluate((el)=> {
		const styles = elementStyles(el);

		return ({
			title   : (el.hasAttribute('alt') && el.alt.length > 0) ? el.alt : (el.hasAttribute('value') && el.value.length > 0) ? el.value : el.textContent,
			html    : el.outerHTML.replace(/"/g, '\\"'),
			styles  : styles,
			classes : (el.className.length > 0) ? el.className : '',
			meta    : {
				border : styles['border'],
				color  : elementColor(styles),
				font   : elementFont(styles),
				text   : (el.text || ''),
				href   : (el.hasAttribute('href')) ? el.getAttribute('href') : null,
				data   : (el.hasAttribute('src')) ? imageData(el, elementBounds(el, styles).size) : null,
				url    : (el.hasAttribute('src')) ? el.getAttribute('src') : null,
			}
		});
	}, node);

	return ({...attribs, children, bounds,
		title : ((attribs.title.length === 0) ? (attribs.meta.text.length === 0 && children.length > 0) ? (await node.$$eval('*', (els)=> els.map(({ innerHTML })=> (innerHTML)))).filter((innerHTML)=> (innerHTML.length > 0 && !/^<.+>$/.test(innerHTML))).pop() : attribs.meta.text : attribs.title),
		meta  : { ...attribs.meta,
			text : ((attribs.meta.text.length === 0 && children.length > 0) ? (await node.$$eval('*', (els)=> els.map(({ innerHTML })=> (innerHTML)))).filter((innerHTML)=> (innerHTML.length > 0 && !/^<.+>$/.test(innerHTML))).pop() : attribs.title)
		},
		box  : await node.boxModel()
	});
};