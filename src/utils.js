#!/usr/bin/env node
'use strict';


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
		'links'   : await Promise.all((await page.$$('a')).map(async(node) => {

			if (await node.boundingBox()) {
				await node.hover();
			}

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
						text   : el.innerText,
						href   : el.getAttribute('href')
					}
				});
			}, node);

			return ({...attribs,
// 				handle : node,
				bounds : await node.boundingBox(),
				box    : await node.boxModel()
			});
		})),

		'buttons' : await Promise.all((await page.$$('button, input[type="button"], input[type="submit"]')).map(async(node) => {
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
						text   : (el.value.length === 0) ? el.innerHTML : el.value
					}
				});
			}, node);

			return ({...attribs,
// 				handle : node,
				bounds : await node.boundingBox(),
				box    : await node.boxModel()
			});
		})),

		'images'  : await Promise.all((await page.$$('img')).map(async(node) => {
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

			return ({...attribs,
// 				handle : node,
				bounds : await node.boundingBox(),
				box    : await node.boxModel()
			});
		}))
	};

	return (elements);
}
