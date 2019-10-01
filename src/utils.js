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
		'links'   : await page.$$eval('a', (els)=> (els.map((el)=> {
			const styles = elementStyles(el);

			return ({
				html   : el.outerHTML.replace(/"/g, '\\"'),
				styles : styles,
				border : styles['border'],
				color  : elementColor(),
				font   : elementFont(),
				bounds : elementBounds(el, styles),
				text   : el.innerText
			});
		}))),

		'buttons' : await page.$$eval('button, input[type="button"], input[type="submit"]', (els)=> (els.map((el)=> {
			const styles = elementStyles(el);

			return ({
				html   : el.outerHTML.replace(/"/g, '\\"'),
				styles : styles,
				border : styles['border'],
				color  : elementColor(styles),
				font   : elementFont(styles),
				bounds : elementBounds(el, styles),
				text   : el.value
			});
		}))),

		'images'  : await page.$$eval('img', (els)=> (els.map((el)=> {
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
		})))
	};

	return (elements);
}
