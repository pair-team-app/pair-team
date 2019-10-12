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
		'links'   : await Promise.all((await page.$$('a')).map(async(node)=> {

// 			if (await node.boundingBox()) {
// 				await node.hover();
// 			}

			let bounds = await node.boundingBox();
			if (bounds) {
				Object.keys(bounds).forEach((key)=> {
					bounds[key] = (bounds[key] << 0);
				});
			}

			const children = await node.$$eval('*', (els)=> els.map(({ outerHTML })=> (outerHTML.replace(/"/g, '\\"'))));
			const attribs = await page.evaluate((el)=> {
				const styles = elementStyles(el);

				return ({
					title  : el.id,
					html   : el.outerHTML.replace(/"/g, '\\"'),
					styles : styles,
					elements : [],
					meta : {
						border : styles['border'],
						color  : elementColor(styles),
						font   : elementFont(styles),
						text   : (/^<.+>$/.test(el.innerHTML)) ? '' : el.innerHTML,
						href   : el.getAttribute('href')
					}
				});
			}, node);

			return ({...attribs, children, bounds,
				meta : { ...attribs.meta,
					text : (attribs.meta.text.length === 0 && children.length > 0) ? (await node.$$eval('*', (els)=> els.map(({ innerHTML })=> (innerHTML)))).filter((innerHTML)=> (innerHTML.length > 0 && !/^<.+>$/.test(innerHTML))).pop() : attribs.meta.text
				},
				box  : await node.boxModel()
			});
		})),

		'buttons' : await Promise.all((await page.$$('button, input[type="button"], input[type="submit"]')).map(async(node)=> {

			let bounds = await node.boundingBox();
			if (bounds) {
				Object.keys(bounds).forEach((key)=> {
					bounds[key] = (bounds[key] << 0);
				});
			}

			const children = await node.$$eval('*', (els)=> els.map(({ outerHTML })=> (outerHTML.replace(/"/g, '\\"'))));
			const attribs = await page.evaluate((el)=> {
				const styles = elementStyles(el);

				return ({
					title  : el.id,
					html   : el.outerHTML.replace(/"/g, '\\"'),
					styles : styles,
					elements : [],
					meta : {
						border : styles['border'],
						color  : elementColor(styles),
						font   : elementFont(styles),
						text   : (el.value.length === 0) ? (/^<.+>$/.test(el.innerHTML)) ? '' : el.innerHTML : el.value
					}
				});
			}, node);

			return ({...attribs, children, bounds,
				meta : { ...attribs.meta,
					text : (attribs.meta.text.length === 0 && children.length > 0) ? (await node.$$eval('*', (els)=> els.map(({ innerHTML })=> (innerHTML)))).filter((innerHTML)=> (innerHTML.length > 0 && !/^<.+>$/.test(innerHTML))).pop() : attribs.meta.text
				},
				box  : await node.boxModel()
			});
		})),

		'images'  : await Promise.all((await page.$$('img')).map(async(node)=> {

			let bounds = await node.boundingBox();
			if (bounds) {
				Object.keys(bounds).forEach((key)=> {
					bounds[key] = (bounds[key] << 0);
				});
			}

			const children = await node.$$eval('*', (els)=> els.map(({ outerHTML })=> (outerHTML.replace(/"/g, '\\"'))));
			const attribs = await page.evaluate((el)=> {
				const styles = elementStyles(el);

				return ({
					title  : el.id,
					html   : el.outerHTML.replace(/"/g, '\\"'),
					styles : styles,
					elements : [],
					meta : {
						border : styles['border'],
						color  : elementColor(styles),
						font   : elementFont(styles),
						text   : el.alt,
						data   : imageData(el, elementBounds(el, styles).size),
						url    : el.src
					}
				});
			}, node);

			return ({...attribs, children, bounds,
				box : await node.boxModel()
			});
		}))
	};

	return (elements);
}
