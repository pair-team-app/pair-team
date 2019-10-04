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
		window.rgbaObject = (color)=> {
			return ({
				r : (color.match(/^rgba?\((?<red>\d+), (?<green>\d+), (?<blue>\d+)(, (?<alpha>\d(\.\d+)?))?\)$/).groups.red) << 0,
				g : (color.match(/^rgba?\((?<red>\d+), (?<green>\d+), (?<blue>\d+)(, (?<alpha>\d(\.\d+)?))?\)$/).groups.green) << 0,
				b : (color.match(/^rgba?\((?<red>\d+), (?<green>\d+), (?<blue>\d+)(, (?<alpha>\d(\.\d+)?))?\)$/).groups.blue) << 0,
				a : (color.includes('rgba')) ? parseFloat(color.match(/^rgba?\((?<red>\d+), (?<green>\d+), (?<blue>\d+), (?<alpha>\d(\.\d+)?)\)$/).groups.alpha) * 255 : 255
			});
		};

		window.purgeObjProps = (obj, patt)=> {
			let pruneObj = { ...obj };

			Object.keys(pruneObj).filter((key)=> (pruneObj.hasOwnProperty(key) && patt.test(key))).forEach((key)=> {
				delete (pruneObj[key]);
			});

			return (pruneObj);
		};

		window.purgeStyles = (styles, patt)=> {
			const regex =  new RegExp(`^${patt}-`, 'i');
			const purgeKeys = Object.keys(styles).filter((key)=> (regex.test(key)));

			purgeKeys.forEach((key)=> {
// 				if (styles.hasOwnProperty(key)) {
					delete (styles[key]);
// 				}
			});

			return (styles);
		};

		window.borderProcess = (styles)=> {
			const keys = Object.keys(styles).filter((key) => /^border-/i.test(key));
			let pos = {
				bottom : null,
				top    : null,
				left   : null,
				right  : null
			};

			keys.forEach((key)=> {
				const suffix = key.replace(/^border-/, '');
				if (pos.hasOwnProperty(suffix)) {
					pos[suffix] = styles[key];
				}
			});

			return ((Object.keys(styles).filter((key) => /^border-/i.test(key))) ? purgeObjProps(styles, /^border-.+/) : styles);
		};

		window.elementStyles = (element)=> {
			let styles = {};
			const compStyles = getComputedStyle(element);

			Object.keys(compStyles).filter((key)=> (isNaN(parseInt(key, 10)))).forEach((key, i)=> {
				styles[key.replace(/([A-Z]|^moz|^webkit)/g, (c)=> (`-${c.toLowerCase()}`))] = compStyles[key].replace(/"/g, '\\"');
			});

			CSS_CONDENSE_STYLES.forEach((key)=> {
				styles = purgeStyles(styles, key);
			});

			CSS_AUTO_STYLES.forEach((key)=> {
				if (styles.hasOwnProperty(key) && styles[key].startsWith('auto')) {
					delete (styles[key]);
				}
			});

			CSS_NONE_STYLES.forEach((key)=> {
				if (styles.hasOwnProperty(key) && styles[key].startsWith('none')) {
					delete (styles[key]);
				}
			});

			CSS_NORMAL_STYLES.forEach((key)=> {
				if (styles.hasOwnProperty(key) && styles[key].startsWith('normal')) {
					delete (styles[key]);
				}
			});

			CSS_ZERO_STYLES.forEach((key)=> {
				if (styles.hasOwnProperty(key) && parseFloat(styles[key].replace(/[^\d]/g, '')) === 0) {
					delete (styles[key]);
				}
			});

			return (styles);
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
	page.on('console', (msg) => {
		console.log(`${msg.text()}`);
// 		msg.args().forEach((arg, i) => {
// 			console.log(`${i}: ${msg.args()[i]}`);
// 		});
	});

	page.on('dialog', async (dialog) => {
		console.log('DIALOG -->', { ...dialog });
		await dialog.dismiss();
	});

	page.on('request', (request)=> {
// 		console.log('headers', request.headers());
		request.continue(request.headers());
	});
	await page.setRequestInterception(true);

	page.on('response', async (response)=> {
		console.log('response', (await response.url()).replace('http://localhost:1066', ''));
	});
}
