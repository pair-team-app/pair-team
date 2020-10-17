#!/usr/bin/env node
'use strict';


import chalk from 'chalk';
import Jimp from 'jimp';


export const MAKE_PLAYGROUND = true;
// export const MAKE_PLAYGROUND = false;
//
export const SEND_ELEMENTS = true;
// export const SEND_ELEMENTS = false;



export const CMD_PARSE = 'npx pair-url --parse';

export const HOSTNAME = '127.0.0.1';
export const PORT = 1066;

// export const API_ENDPT_URL = (process.env.NODE_ENV === 'development') ? 'http://api.pairurl.devlocal/current/gateway.php' : 'https://api.pair.team/current/gateway.php';
export const API_ENDPT_URL = 'http://192.168.1.64/api.pair.team/current/gateway.php';

export const IMAGE_MAX_HEIGHT = 1800;
export const IMAGE_THUMB_WIDTH = 224;
export const IMAGE_THUMB_HEIGHT = 140;

export const IMAGE_DEVICE_SCALER = Jimp.RESIZE_NEAREST_NEIGHBOR;
// export const IMAGE_DEVICE_SCALER = Jimp.RESIZE_BILINEAR;
// export const IMAGE_THUMB_SCALER = Jimp.RESIZE_HERMITE;
export const IMAGE_THUMB_SCALER = Jimp.RESIZE_BEZIER;


export const BROWSER_OPTS = {
	devTools          : true,
	headless          : true,
	ignoreHTTPSErrors : true,
	// args              : ['--no-sandbox', '--disable-gpu']
	args              : ['--no-sandbox']
};


export const MIME_TYPES = {
	html : 'text/html',
	txt  : 'text/plain',
	css  : 'text/css',
	gif  : 'image/gif',
	jpg  : 'image/jpeg',
	png  : 'image/png',
	svg  : 'image/svg+xml',
	js   : 'application/javascript'
};


// export const API_ENDPT_URL = 'https://api.designengine.ai/v2/pairurl-2.php';

export const FETCH_CFG = {
	method  : 'POST',
	headers : { 'Content-Type' : 'application/json' },
	body    : {
		action  : null,
		payload : null
	}
};

export const DeviceExtract = {
	FULL           : 'FULL',
	DESKTOP_FULL   : 'DESKTOP_FULL',
	MOBILE_FULL    : 'MOBILE_FULL',
	DESKTOP_SINGLE : 'DESKTOP_SINGLE',
	MOBILE_SINGLE  : 'MOBILE_SINGLE',
	DESKTOP_MOBILE : 'DESKTOP_MOBILE'
};

export const LinkExtract = {
	FULL   : 'FULL',
	NONE   : 'NONE',
	FIRST  : 'FIRST',
	LAST   : 'LAST',
	AMOUNT : (amt=-1)=> (amt)
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

export const ChalkStyles = {
	BANNER : (msg)=> (`|:| ${msg} |:|`),
	CMD    : (val)=> (chalk.redBright(`\`${val}\``)),
	ERROR  : chalk.red.bold('ERROR'),
	DONE   : chalk.greenBright.bold('DONE'),
	DEVICE : (val)=> (`[${chalk.grey.bold(val)}]`),
	FOOTER : (len=50)=> (`${chalk.white('\\')}${(new Array(len * 0.5).fill(`${chalk.grey('=')}${chalk.whiteBright('<>')}`)).join('')}${chalk.grey('=')}${chalk.white('/')}\n`),
	H_DIV  : (newline=false, len=50)=> (`${(newline) ? '\n' : ''}${chalk.white('|')}${(new Array(len * 0.5).fill(`${chalk.grey('=')}${chalk.whiteBright('<>')}`)).join('')}${chalk.grey('=')}${chalk.white('|')}${(newline) ? '\n' : ''}`),
	HEADER : (len=50)=> (`\n${chalk.white('/')}${(new Array(len * 0.5).fill(`${chalk.grey('=')}${chalk.whiteBright('<>')}`)).join('')}${chalk.grey('=')}${chalk.white('\\')}`),
	INFO   : chalk.cyanBright.bold('INFO'),
	NUMBER : (val, bare=false)=> ((bare) ? chalk.yellow.bold(val) : `(${chalk.yellow.bold(val)})`),
	PATH   : chalk.magenta.bold,
	TITLE  : (val)=> (chalk.yellowBright(val.toUpperCase())),
	URL    : chalk.blueBright.bold.underline
};
