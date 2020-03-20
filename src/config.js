#!/usr/bin/env node
'use strict';


import {
	CSS_AUTO_STYLES,
	CSS_CONDENSE_STYLES,
	CSS_NONE_STYLES,
	CSS_NORMAL_STYLES,
	CSS_PURGE_STYLES,
	CSS_ZERO_STYLES } from './consts';


export async function consts(page) {
	await globals(page, {
		CSS_AUTO_STYLES,
		CSS_CONDENSE_STYLES,
		CSS_NONE_STYLES,
		CSS_NORMAL_STYLES,
		CSS_PURGE_STYLES,
		CSS_ZERO_STYLES
	});
}


export async function funcs(page) {
	await page.evaluate(()=> {
		window.elementAccessibility = (element)=> {
			const { failed, passed, aborted } = axeReport;
			return ({
				failed  : failed.filter(({ nodes })=> (nodes.find(({ html })=> (element.outerHTML.split('>').shift().startsWith(html.split('>').shift()))))),
				passed  : passed.filter(({ nodes })=> (nodes.find(({ html })=> (element.outerHTML.split('>').shift().startsWith(html.split('>').shift()))))),
				aborted : aborted.filter(({ nodes })=> (nodes.find(({ html })=> (element.outerHTML.split('>').shift().startsWith(html.split('>').shift())))))
			})
		};


		window.elementColor = (styles)=> {
			return ({
				background : (Object.keys(styles).includes('background-color')) ? styles['background-color'] : rgbaObject('rgba(0, 0, 0, 1)'),
				foreground : (Object.keys(styles).includes('color')) ? styles['color'] : rgbaObject('rgba(0, 0, 0, 1)')
			});
		};

		window.elementFont = (styles)=> {
			const line = (Object.keys(styles).includes('line-height') && !isNaN(styles['line-height'].replace(/[^\d]/g, ''))) ? styles['line-height'].replace('px', '') : styles['font-size'].replace('px', '') * 1.2;
			return ({ line,
				family  : (Object.keys(styles).includes('font-family')) ? styles['font-family'].replace(/"/g, '') : '',
				size    : (Object.keys(styles).includes('font-size')) ? styles['font-size'].replace('px', '') : 0,
				kerning : (Object.keys(styles).includes('letter-spacing')) ? parseFloat(styles['letter-spacing']) : 0
			})
		};

		window.elementStyles = (element)=> {
			let styles = {};
			const compStyles = getComputedStyle(element);

			Object.keys(compStyles).filter((key)=> (isNaN(parseInt(key, 10)))).forEach((key, i)=> {
				styles[key.replace(/([A-Z]|^moz|^webkit)/g, (c)=> (`-${c.toLowerCase()}`))] = compStyles[key];
			});

			let keys = [ ...CSS_PURGE_STYLES];
			CSS_CONDENSE_STYLES.forEach((key)=> {
				const regex =  new RegExp(`^${key}-`, 'i');
				keys.push( ...Object.keys(styles).filter((key)=> (regex.test(key))));
			});

			CSS_AUTO_STYLES.forEach((key)=> {
				const regex =  new RegExp(`^${key}-?`, 'i');
				keys.push( ...Object.keys(styles).filter((key)=> (regex.test(key) && styles[key].startsWith('auto'))));
			});

			CSS_NONE_STYLES.forEach((key)=> {
				const regex =  new RegExp(`^${key}-?`, 'i');
				keys.push( ...Object.keys(styles).filter((key)=> (regex.test(key) && styles[key].startsWith('none'))));
			});

			CSS_NORMAL_STYLES.forEach((key)=> {
				const regex =  new RegExp(`^${key}-?`, 'i');
				keys.push( ...Object.keys(styles).filter((key)=> (regex.test(key) && styles[key].startsWith('normal'))));
			});

			CSS_ZERO_STYLES.forEach((key)=> {
				const regex =  new RegExp(`^${key}-?`, 'i');
				keys.push( ...Object.keys(styles).filter((key)=> (regex.test(key) && parseFloat(styles[key].replace(/[^\d]/g, '')) === 0)));
			});

			Object.keys(styles).forEach((key)=> {
				if (styles[key].length === 0) {
					keys.push(key);
				}
			});

			return (purgeKeys(styles, keys));
		};

		window.elementVisible = (el, styles)=> (styles['display'] !== 'none' && styles['visibility'] !== 'hidden' && parentsVisible(el));

		window.hexRGBA = (color)=> {
			const { red, green, blue, alpha } = color.match(/^#?(?<red>[A-Fa-f\d]{2})(?<green>[A-Fa-f\d]{2})(?<blue>[A-Fa-f\d]{2})((?<alpha>[A-Fa-f\d]{2})?)$/).groups;
			return ({
				r : parseInt(red, 16),
				g : parseInt(green, 16),
				b : parseInt(blue, 16),
				a : (alpha) ? parseInt(alpha, 16) : 255
			});
		};

		window.imageData = (el, { width, height })=> {
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;

			const ctx = canvas.getContext('2d');
			ctx.drawImage(el, 0, 0, width, height);

			const imgData = canvas.toDataURL('image/png');
			canvas.remove();

			return (imgData);
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

		window.purgeKeys = (obj, keys)=> {
			let pruneObj = { ...obj };
			keys.forEach((key)=> {
				if (pruneObj.hasOwnProperty(key)) {
					delete (pruneObj[key]);
				}
			});

			return (pruneObj);
		};

		window.rgbaObject = (color)=> {
			return ({
				r : (color.match(/^rgba?\((?<red>\d+), (?<green>\d+), (?<blue>\d+)(, (?<alpha>\d(\.\d+)?))?\)$/).groups.red) << 0,
				g : (color.match(/^rgba?\((?<red>\d+), (?<green>\d+), (?<blue>\d+)(, (?<alpha>\d(\.\d+)?))?\)$/).groups.green) << 0,
				b : (color.match(/^rgba?\((?<red>\d+), (?<green>\d+), (?<blue>\d+)(, (?<alpha>\d(\.\d+)?))?\)$/).groups.blue) << 0,
				a : (color.includes('rgba')) ? parseFloat(color.match(/^rgba?\((?<red>\d+), (?<green>\d+), (?<blue>\d+), (?<alpha>\d(\.\d+)?)\)$/).groups.alpha) * 255 : 255
			});
		};

		window.scrollToBottom = (lastScrollTop)=> {
			document.scrollingElement.scrollTop += 100;

			if (document.scrollingElement.scrollTop !== lastScrollTop) {
				lastScrollTop = document.scrollingElement.scrollTop;
				requestAnimationFrame(scroll);
			}

			return (lastScrollTop);
		};
	});
}


export async function globals(page, vars) {
	await page.evaluate((vars)=> {
		Object.keys(vars).forEach((key)=> {
			window[key] = vars[key];
		});
	}, vars);
}


export async function listeners(page, attach=true) {
	const onMouseWheel = (event)=> {
//		console.log('onMouseWheel -->', event);
	};

	const onPageError = (err)=> {
//		console.log('onPageError -->', { err });
	};

	const onPageDOMContentLoaded = ()=> {
// 		console.log('onPageDOMContentLoaded -->', { url : page.url() });
	};

	const onPageLoad = ()=> {
// 		console.log('onPageLoad -->', { url : page.url() });
	};

	const onPageClose = ()=> {
// 		console.log('onPageClose -->', { url : page.url() });
	};

	const onPageConsole = (msg)=> {
// 		console[msg._type]('onPageConsole -->>', msg._text);
//		console[msg._type](msg._text);

//		for (let i=0; i<msg.args().length; ++i) {
//			console[msg._type](`${i}: ${msg.args()[i]}`);
//		}

 		msg.args().forEach((arg, i) => {
 			console.log(`${i}: ${msg.args()[i]}`);
 		});
	};

	const onPageDialog = async(dialog)=> {
//		console.log('onPageDialog -->', { type : dialog._type, message : dialog._message });
		await dialog.dismiss();
	};

	const onPageRequest = (request)=> {
// 		console.log('onPageRequest -->', { url : request.url(), headers : request.headers() });
		// request.continue(request.headers());
		request.continue();
	};

	const onPageResponse = async(response)=> {
// 		console.log('onPageResponse -->', { url : await response.url(), 'content-length' : await response.headers()['content-length'] });
	};

	const onPageMouseWheel = (event)=> {
//		console.log('onPageMouseWheel -->', event);
	};


// 	await page.evaluate(()=> {
	await page.evaluateOnNewDocument(({ attach, onMouseWheel })=> {
		if (attach) {
			document.addEventListener('mousewheel', onMouseWheel);

		} else {
			document.removeEventListener('mousewheel', onMouseWheel);
		}
	}, { attach, onPageMouseWheel });


	await page.setRequestInterception(attach);
	if (attach) {
		page.on('load', onPageLoad);
		page.on('domcontentloaded', onPageDOMContentLoaded);
		page.on('error', onPageError);
		page.on('pageerror', onPageError);
		page.on('request', onPageRequest);
		page.on('response', await onPageResponse);
		page.on('console', onPageConsole);
		page.on('dialog', await onPageDialog);
		page.on('close', onPageClose);
		page.on('mousewheel', onPageMouseWheel);

	} else {
		page.removeListener('load', onPageLoad);
		page.removeListener('domcontentloaded', onPageDOMContentLoaded);
		page.removeListener('error', onPageError);
		page.removeListener('pageerror', onPageError);
		page.removeListener('request', onPageRequest);
		page.removeListener('response', await onPageResponse);
		page.removeListener('console', onPageConsole);
		page.removeListener('dialog', await onPageDialog);
		page.removeListener('close', onPageClose);
		page.removeListener('mousewheel', onPageMouseWheel);
	}
}
