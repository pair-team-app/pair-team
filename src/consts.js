#!/usr/bin/env node
'use strict';


import chalk from 'chalk';
import Jimp from 'jimp';


export const ChalkStyles = {
	BANNER : (msg)=> (`|:| ${msg} |:|`),
	INFO   : chalk.cyanBright.bold('INFO'),
	ERROR  : chalk.red.bold('ERROR'),
	DONE   : chalk.greenBright.bold('DONE'),
	DEVICE : (dev)=> (`[${chalk.grey.bold(dev)}]`),
	FOOTER : (len=50)=> (`\\_<>${(new Array(len * 0.5).fill(`${chalk.grey('=')}${chalk.whiteBright('<>')}`)).join('')}${chalk.grey('=')}${chalk.white('<>')}/\n`),
	H_DIV  : (len=50)=> (`${'\n'}|${(new Array(len * 0.5).fill(`${chalk.grey('=')}${chalk.whiteBright('<>')}`)).join('')}|${'\n'}`),
	HEADER : (len=50)=> (`${'\n'}/${chalk.whiteBright('<>')}${(new Array(len * 0.5).fill(`${chalk.grey('=')}${chalk.whiteBright('<>')}`)).join('')}${chalk.grey('=')}${chalk.white('<>')}\\_`),
	NUMBER : (val, bare=false)=> ((bare) ? chalk.yellow.bold(val) : `(${chalk.yellow.bold(val)})`),
	PATH   : chalk.magenta.bold,
	URL    : chalk.blueBright.bold.underline
};


export const IMAGE_MAX_HEIGHT = 1800;
export const IMAGE_THUMB_WIDTH = 224;
export const IMAGE_THUMB_HEIGHT = 140;


export const IMAGE_DEVICE_SCALER = Jimp.RESIZE_BILINEAR;
export const IMAGE_THUMB_SCALER = Jimp.RESIZE_BICUBIC;


export const API_ENDPT_URL = 'http://api.pairurl.com/v4/pairurl.php';
// export const API_ENDPT_URL = 'http://157.230.173.158/api-test/v4/pairurl.php';

export const FETCH_CFG = {
	method  : 'POST',
	headers : { 'Content-Type' : 'application/json' },
	body    : {
		action  : null,
		payload : null
	}
};

export const ZIP_OPTS = {
	type               : 'binarystring',
	mimeType           : 'application/zip',
	streamFiles        : true,
	// streamFiles        : false,
	compression        : 'DEFLATE',
	compressionOptions : { level : 9 }
};


export const BROWSER_OPTS = {
	devTools          : true,
	headless          : true,
	ignoreHTTPSErrors : true,
	// args              : ['--no-sandbox', '--disable-gpu']
	args              : ['--no-sandbox']
};

export const CHROME_MACOS = {
	name      : 'MacOS Desktop',
	userAgent : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36',
	viewport  : {
		width             : 1920,
		height            : 1080,
		deviceScaleFactor : 1,
		isMobile          : false,
		hasTouch          : false,
		isLandscape       : false
	}
};

export const CHROME_WINDOWS = {
	name      : 'Windows Desktop',
	userAgent : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
	viewport  : {
		width             : 1366,
		height            : 768,
		deviceScaleFactor : 1,
		isMobile          : false,
		hasTouch          : false,
		isLandscape       : false
	}
};

export const GALAXY_S8 = {
	name      : 'Galaxy S8',
	userAgent : 'Mozilla/5.0 (Linux; Android 7.0; SAMSUNG SM-G950F Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/5.2 Chrome/51.0.2704.106 Mobile Safari/537.36',
	viewport  : {
		width             : 720,
		height            : 1480,
		deviceScaleFactor : 2,
		isMobile          : true,
		hasTouch          : true,
		isLandscape       : false
	}
};

export const HTML_STRIP_TAGS = [
	'noscript',
	'script'
];

export const CSS_AUTO_STYLES = [
	'align-self',
	'alignment-baseline',
	'bottom',
	'break',
	'buffered-rendering',
	'clip',
	'color-rendering',
	'column',
	'cursor',
	'dominant-baseline',
	'font-kerning',
	'image-rendering',
	'isolation',
	'offset',
	'page-break',
	'shape-rendering',
	'text-underline-position',
	'touch-action',
	'user-select',
	'-webkit-line-break',
	'-webkit-min-logical',
	'-webkit-user-drag',
	'-webkit-user-select',
	'will-change'
];

export const CSS_CONDENSE_STYLES = [
	'animation',
	'background-position',
	'background-repeat',
	'background',
	'border-radius',
	'border',
	'column-rule',
	'fill',
	'font-variant',
	'grid-auto',
	'grid-column',
	'grid-row',
	'grid-template',
	'list-style',
	'margin',
	'marker',
	'offset',
	'outline',
	'overflow',
	'overscroll-behavior',
	'padding',
	'scroll-margin-block',
	'scroll-margin-inline',
	'scroll-margin',
	'scroll-padding-block',
	'scroll-padding-inline',
	'scroll-padding',
	'scroll-snap',
	'stroke',
	'text-decoration',
	'transition',
	'-webkit-animation',
	'-webkit-border-after',
	'-webkit-border-before',
	'-webkit-border-end',
	'-webkit-border-start',
	'-webkit-border',
	'-webkit-column-rule',
	'-webkit-margin-after',
	'-webkit-margin-after',
	'-webkit-margin-before',
	'-webkit-mask-box-image',
	'-webkit-mask-position',
	'-webkit-mask-repeat',
	'-webkit-perspective-origin',
	'-webkit-text-emphasis',
	'-webkit-text-stroke',
	'-webkit-transform',
	'-webkit-transition'
];

export const CSS_NONE_STYLES = [
	'animation',
	'backdrop-filter',
	'background',
	'border',
	'box-shadow',
	'clear',
	'clip-path',
	'column-rule',
	'column-span',
	'contain',
	'counter-increment',
	'counter-reset',
	'filter',
	'float',
	'grid',
	'grid-template',
	'mask',
	'max-height',
	'max-width',
	'offset',
	'outline',
	'perspective',
	'pointer-events',
	'stroke',
	'text-combine-upright',
	'text-decoration',
	'text-shadow',
	'text-transform',
	'transform',
	'-webkit-animation',
	'-webkit-border',
	'webkit-box',
	'-webkit-column-rule',
	'-webkit-column-span',
	'-webkit-filter',
	'-webkit-highlight',
	'-webkit-line-clamp',
	'-webkit-max-logical',
	'-webkit-perspective',
	'-webkit-text-combine',
	'-webkit-text-decorations-in-effect',
	'-webkit-text-security',
	'-webkit-transform',
	'-webkit-perspective'
];

export const CSS_NORMAL_STYLES = [
	'column-gap',
	'content',
	'font-style',
	'font-variant',
	'font-variation-setting',
	'letter-spacing',
	'mix-blend-mode',
	'speak',
	'unicode-bidi',
	'-webkit-animation',
	'-webkit-font-feature-settings',
	'white-space',
	'word-break',
	'word-wrap'
];

export const CSS_PURGE_STYLES = [
	'block-size',
	'font',
	'height',
	'max-block-size',
	'max-height',
	'-webkit-logical-height'
];

export const CSS_ZERO_STYLES = [
	'baseline-shift',
	'padding',
	'margin',
	'min-height',
	'text-indent',
	'-webkit-padding',
	'-webkit-shape',
	'word-spacing'
];
