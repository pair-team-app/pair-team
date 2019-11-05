#!/usr/bin/env node
'use strict';


import {
	CSS_AUTO_STYLES,
	CSS_CONDENSE_STYLES,
	CSS_NONE_STYLES,
	CSS_NORMAL_STYLES,
	CSS_ZERO_STYLES } from './consts';


export async function consts(page) {
	await page.evaluate((Consts)=> {
		window.CSS_AUTO_STYLES = Consts.CSS_AUTO_STYLES;
		window.CSS_CONDENSE_STYLES = Consts.CSS_CONDENSE_STYLES;
		window.CSS_NONE_STYLES = Consts.CSS_NONE_STYLES;
		window.CSS_NORMAL_STYLES = Consts.CSS_NORMAL_STYLES;
		window.CSS_ZERO_STYLES = Consts.CSS_ZERO_STYLES;
	}, { CSS_AUTO_STYLES, CSS_CONDENSE_STYLES, CSS_NONE_STYLES, CSS_NORMAL_STYLES, CSS_ZERO_STYLES });
}

export async function funcs(page) {
	await page.evaluate(()=> {
		window.scrollToBottom = (lastScrollTop)=> {
			document.scrollingElement.scrollTop += 100;

			if (document.scrollingElement.scrollTop !== lastScrollTop) {
				lastScrollTop = document.scrollingElement.scrollTop;
				requestAnimationFrame(scroll);
			}

			return (lastScrollTop);
		};


		window.rgbaObject = (color)=> {
			return ({
				r : (color.match(/^rgba?\((?<red>\d+), (?<green>\d+), (?<blue>\d+)(, (?<alpha>\d(\.\d+)?))?\)$/).groups.red) << 0,
				g : (color.match(/^rgba?\((?<red>\d+), (?<green>\d+), (?<blue>\d+)(, (?<alpha>\d(\.\d+)?))?\)$/).groups.green) << 0,
				b : (color.match(/^rgba?\((?<red>\d+), (?<green>\d+), (?<blue>\d+)(, (?<alpha>\d(\.\d+)?))?\)$/).groups.blue) << 0,
				a : (color.includes('rgba')) ? parseFloat(color.match(/^rgba?\((?<red>\d+), (?<green>\d+), (?<blue>\d+), (?<alpha>\d(\.\d+)?)\)$/).groups.alpha) * 255 : 255
			});
		};

		window.purgeKeys = (obj, keys)=> {
			let pruneObj = { ...obj };
			keys.forEach((key)=> {
				if (pruneObj.hasOwnProperty(key)) {
					delete (pruneObj[key]);
				}
			});

			return (pruneObj);
		};

		window.elementText = async(element)=> {
			const innerHTML = await element.$$eval('*', (els)=> els.map(({ innerHTML })=> (innerHTML)));
			if (/^<.+>$/.test(innerHTML)) {

			}
		};

		window.elementAccessibility = (element)=> {

		};

		window.elementStyles = (element)=> {
			let styles = {};
			const compStyles = getComputedStyle(element);

			Object.keys(compStyles).filter((key)=> (isNaN(parseInt(key, 10)))).forEach((key, i)=> {
				styles[key.replace(/([A-Z]|^moz|^webkit)/g, (c)=> (`-${c.toLowerCase()}`))] = compStyles[key].replace(/"/g, '\\"');
			});

			styles['font'] = styles['font'].replace(/\\"/g, '"');
			styles['font-family'] = styles['font-family'].replace(/\\"/g, '"');

			let keys = [];
			CSS_CONDENSE_STYLES.forEach((key)=> {
				const regex =  new RegExp(`^${key}-`, 'i');
				keys.push(...Object.keys(styles).filter((key)=> (regex.test(key))));
			});

			CSS_AUTO_STYLES.forEach((key)=> {
				const regex =  new RegExp(`^${key}-?`, 'i');
				keys.push(...Object.keys(styles).filter((key)=> (regex.test(key) && styles[key].startsWith('auto'))));
			});

			CSS_NONE_STYLES.forEach((key)=> {
				const regex =  new RegExp(`^${key}-?`, 'i');
				keys.push(...Object.keys(styles).filter((key)=> (regex.test(key) && styles[key].startsWith('none'))));
			});

			CSS_NORMAL_STYLES.forEach((key)=> {
				const regex =  new RegExp(`^${key}-?`, 'i');
				keys.push(...Object.keys(styles).filter((key)=> (regex.test(key) && styles[key].startsWith('normal'))));
			});

			CSS_ZERO_STYLES.forEach((key)=> {
				const regex =  new RegExp(`^${key}-?`, 'i');
				keys.push(...Object.keys(styles).filter((key)=> (regex.test(key) && parseFloat(styles[key].replace(/[^\d]/g, '')) === 0)));
			});

			Object.keys(styles).forEach((key)=> {
				if (styles[key].length === 0) {
					keys.push(key);
				}
			});

			Object.keys(styles).forEach((key)=> {
				if (!isNaN(styles[key])) {
					styles[key] = (styles[key] << 0);
				}
			});

			return (purgeKeys(styles, keys));
		};

		window.elementBounds = (el, styles)=> {
			const origin = {
				x : (el.offset) ? el.offset.left : 0,
				y : (el.offset) ? el.offset.top : 0
			};

// 			const margin = {
// 				top : (el.getBoundingClientRect().top - el.offsetTop)
// 			};

			const size = {
				width  : styles.width.replace('px', '') << 0,
				height : styles.height.replace('px', '') << 0
			};

			const center = {
				x : origin.x + ((size.width * 0.5) << 0),
				y : origin.y + ((size.height * 0.5) << 0)
			};

			return ({ origin, size, center });
		};

		window.elementColor = (styles)=> {
			return ({
				background : (Object.keys(styles).includes('background-color')) ? styles['background-color'] : rgbaObject('rgba(0, 0, 0, 1)'),
				foreground : (Object.keys(styles).includes('color')) ? styles['color'] : rgbaObject('rgba(0, 0, 0, 1)')
			});
		};

		window.elementFont = (styles)=> {
			const line = (Object.keys(styles).includes('line-height') && !isNaN(styles['line-height'].replace(/[^\d]/g, ''))) ? styles['line-height'].replace('px', '') << 0 : (styles['font-size'].replace('px', '') << 0) * 1.2;
			return ({
				family  : (Object.keys(styles).includes('font-family')) ? styles['font-family'].replace(/\\"/g, '') : '',
				size    : (Object.keys(styles).includes('font-size')) ? styles['font-size'].replace('px', '') << 0 : 0,
				kerning : (Object.keys(styles).includes('letter-spacing')) ? parseFloat(styles['letter-spacing']) : 0,
				line    : line
			})
		};

		window.elementPath = (el)=> {
			let stack = [];
			while (el.parentNode !== null) {
				let sibCount = 0;
				let sibIndex = 0;
				for (let i=0; i<el.parentNode.childNodes.length; i++) {
					let sib = el.parentNode.childNodes[i];
					if (sib.nodeName === el.nodeName) {
						if (sib === el) {
							sibIndex = sibCount;
						}

						sibCount++;
					}
				}

// 				stack.unshift((sibCount > 1) ? `${el.nodeName.toLowerCase()}:${sibIndex}` : el.nodeName.toLowerCase());
				stack.unshift(`${el.nodeName.toLowerCase()}:${sibIndex}`);
				el = el.parentNode;
			}

			return (stack.slice(2).join(' '));
		};

		window.elementVisible = (el, styles)=> (el.is(':visible') && styles['visibility'] !== 'hidden' && parentsVisible(el));

		window.hexRGBA = (color)=> {
			const { red, green, blue, alpha } = color.match(/^#?(?<red>[A-Fa-f\d]{2})(?<green>[A-Fa-f\d]{2})(?<blue>[A-Fa-f\d]{2})((?<alpha>[A-Fa-f\d]{2})?)$/).groups;
			return ({
				r : parseInt(red, 16),
				g : parseInt(green, 16),
				b : parseInt(blue, 16),
				a : (alpha) ? parseInt(alpha, 16) : 255
			});
		};

		window.imageData = (el, size)=> {
			const canvas = document.createElement('canvas');
			canvas.width = size.width;
			canvas.height = size.height;

			const ctx = canvas.getContext('2d');
			ctx.drawImage(el, 0, 0, size.width, size.height);

			return (canvas.toDataURL('image/png'));
		};

		window.parentsVisible = (el)=> {
			while (el.parentNode != null && el.parentNode instanceof Element) {
				const parentStyles = elementStyles(el.parentNode);

				if (parentStyles['display'] === 'none' || parentStyles['visibility'] === 'hidden') {
					return (false);
				}

				el = el.parentNode;
			}

			return (true);
		};
	});
}

export async function listeners(page) {
	await page.evaluate(()=> {
		document.addEventListener('mousewheel', (event) => {
			console.log(`DOC mousewheel ${event}`);
		});
	});

	page.on('console', (msg) => {
		console[msg._type](msg._text);
// 		msg.args().forEach((arg, i) => {
// 			console.log(`${i}: ${msg.args()[i]}`);
// 		});
	});

	page.on('dialog', async (dialog) => {
// 		console.log('DIALOG -->', { ...dialog });
		console.log('DIALOG -->', dialog._type, dialog._message);
		await dialog.dismiss();
	});

	await page.setRequestInterception(true);
	page.on('request', (request)=> {
// 		console.log('headers', request.headers());
		request.continue(request.headers());
	});

	page.on('response', async (response)=> {
// 		console.log('response', (await response.url()).replace('http://localhost:1066', ''));
	});

	page.on('mousewheel', (event)=> {
		console.log('PAGE ON mousewheel:', event);
	});
}
