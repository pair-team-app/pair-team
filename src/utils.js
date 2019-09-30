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
				color  : null,//window.elementColor(),
				font   : null,//window.elementFont(),
				bounds : null,//window.elementBounds(el, styles),
				text   : el.innerText
			});
		}))),

		'buttons' : await page.$$eval('button, input[type="button"], input[type="submit"]', (els)=> (els.map((el)=> {
			const styles = window.elementStyles(el);

			return ({
				html   : el.outerHTML.replace(/"/g, '\\"'),
				styles : styles,
				border : styles['border'],
				color  : null,//window.elementColor(styles),
				font   : null,//window.elementFont(styles),
				bounds : null,//window.elementBounds(el, styles),
				text   : el.value
			});
		}))),

		'images'  : await page.$$eval('img', (els)=> (els.map((el)=> {
			const styles = window.elementStyles(el);

			return ({
				html   : el.outerHTML.replace(/"/g, '\\"'),
				styles : styles,
				border : styles['border'],
				color  : null,//window.elementColor(styles),
				font   : null,//window.elementFont(styles),
				bounds : null,//window.elementBounds(el, styles),
				text   : el.alt,
				data   : null,//window.imageData(el, elementSize(styles)),
				url    : el.src
			});
		})))
	};

	return (elements);
}
