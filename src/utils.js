#!/usr/bin/env node
'use strict';


import { file } from 'tmp-promise';


export async function captureScreen(page) {
	const { fd, path, cleanup } = await file();
	const imagePath = `${path}.png`;

	await page.screenshot({ path : imagePath });
	return (imagePath);
}
