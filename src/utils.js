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
	const elements = {
		'links'   : await Promise.all((await page.$$('a')).map(async(node) => {

			await node.hover();
			const attribs = await page.evaluate((el)=> {
				const styles = elementStyles(el);

				return ({
					html   : el.outerHTML.replace(/"/g, '\\"'),
					styles : styles,
					border : styles['border'],
					color  : elementColor(styles),
					font   : elementFont(styles),
					text   : el.innerText,
					href   : el.getAttribute('href')
				});
			}, node);

			return ({...attribs,
				handle : node,
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
					text   : (el.value.length === 0) ? el.innerHTML : el.value
				});
			}, node);

			return ({...attribs,
				handle : node,
				bounds : await node.boundingBox(),
				box    : await node.boxModel()
			});
		})),

		'images'  : await Promise.all((await page.$$('img')).map(async(node) => {
			const attribs = await page.evaluate((el)=> {
				const styles = elementStyles(el);

				return ({
					html   : el.outerHTML.replace(/"/g, '\\"'),
					styles : styles,
					border : styles['border'],
					color  : elementColor(styles),
					font   : elementFont(styles),
					text   : el.alt,
					data   : imageData(el, elementBounds(el, styles).size),
					url    : el.src
				});
			}, node);

			return ({...attribs,
				handle : node,
				bounds : await node.boundingBox(),
				box    : await node.boxModel()
			});
		}))
	};

	return (elements);
}
