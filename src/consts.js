#!/usr/bin/env node
'use strict';


import chalk from 'chalk';


export const ChalkStyles = {
	INFO   : chalk.cyanBright('INFO'),
	ERROR  : chalk.red.bold('ERROR'),
	DONE   : chalk.greenBright('DONE'),
	DEVICE : chalk.grey,
	NUMBER : chalk.magentaBright,
	PATH   : chalk.blueBright,
	URL    : chalk.blue.bold.underline
};


export const API_ENDPT_URL = 'https://api.designengine.ai/playgrounds.php';

export const FETCH_CFG = {
	method  : 'POST',
	headers : { 'Content-Type' : 'application/json' },
	body    : {
		action  : null,
		payload : null
	}
};

export const BROWSER_OPTS = {
	devTools          : true,
	headless          : true,
	ignoreHTTPSErrors : true,
	args              : ['--no-sandbox', '--disable-gpu']
};

export const CHROME_DEVICE = {
	name      : 'Chrome',
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
