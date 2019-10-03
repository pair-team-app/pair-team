#!/usr/bin/env node
'use strict';


import { file } from 'tmp-promise';


export async function captureScreen(page) {
	const { fd, path, cleanup } = await file();
	const imagePath = `${path}.png`;

	await page.screenshot({ path : imagePath });
	return (imagePath);
}

export async function extractElements(page) {
// 	const buttons = [await page.evaluateHandle(el => typeof el, buttonHandles[0])];
// 	const buttons = [await (await buttonHandles[0].getProperty('innerText')).jsonValue()]; // works
// 	const properties = await buttonHandles[0].getProperties();
// 	const children = [];
// 	for (const property of properties.values()) {
// 		const element = property.asElement();
// 		if (element)
// 			children.push(element);
// 	}

// 	const buttons = [await page.$eval('*', (el)=> {
// 		return el.value;
// 	}, buttonHandles[0])];

	//const buttons = [await buttonHandles[0].asElement()];

// 	const buttons = await buttonHandles.map(async(handle)=> {
// 		return (await handle.getProperty('value'));
// 		return (await page.evaluate((el) => {
// 			const styles = elementStyles(el);
//
// 			return ({
// 				html   : el.outerHTML.replace(/"/g, '\\"'),
// 				styles : styles,
// 				border : styles['border'],
// 				color  : elementColor(styles),
// 				font   : elementFont(styles),
// 				bounds : elementBounds(el, styles),
// 				text   : el.value,
// 				box    : handle.boundingBox()
// 			});
// 		}, handle));
// 	});


	const elements = {
		'links'   : await Promise.all((await page.$$('a')).map(async(node) => {
			const attribs = await page.evaluate((el)=> {
				const styles = elementStyles(el);

				return ({
					html   : el.outerHTML.replace(/"/g, '\\"'),
					styles : styles,
					border : styles['border'],
					color  : elementColor(styles),
					font   : elementFont(styles),
					bounds : elementBounds(el, styles),
					text   : el.innerText
				});
			}, node);

			return ({...attribs,
				bounds : await node.boundingBox(),
				box    : await node.boxModel()
			});
		})),

		'buttons' : await Promise.all((await page.$$('button, input[type="button"], input[type="submit"]')).map(async(node) => {
			const attribs = await page.evaluate((el)=> {
				const styles = elementStyles(el);

				return ({
					html   : el.outerHTML.replace(/"/g, '\\"'),
					styles : styles,
					border : styles['border'],
					color  : elementColor(styles),
					font   : elementFont(styles),
					bounds : elementBounds(el, styles),
					text   : (el.value.length === 0) ? el.innerHTML : el.value
				});
			}, node);

			return ({...attribs,
				bounds : await node.boundingBox(),
				box    : await node.boxModel()
			});

// 		return (await (await node.getProperty('innerText')).jsonValue())
		})),

		'images'  : await Promise.all((await page.$$('img')).map(async(node) => {
			const attribs = await page.evaluate((el)=> {
				const styles = elementStyles(el);
				const bounds = elementBounds(el, styles);

				return ({
					html   : el.outerHTML.replace(/"/g, '\\"'),
					styles : styles,
					border : styles['border'],
					color  : elementColor(styles),
					font   : elementFont(styles),
					bounds : bounds,
					text   : el.alt,
					data   : imageData(el, bounds.size),
					url    : el.src
				});
			}, node);

			return ({...attribs,
				bounds : await node.boundingBox(),
				box    : await node.boxModel()
			});
		}))
	};

	return (elements);
}
