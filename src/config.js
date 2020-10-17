#!/usr/bin/env node
'use strict';


export async function consts(page) {
	await globals(page, {});
}


export async function funcs(page) {
	await page.evaluate(()=> {
		window.elementAccessibility = (element)=> {
			const { failed, passed, aborted } = axeReport;
			return ({
				failed  : failed.filter(({ nodes })=> (nodes.find(({ html })=> (element.outerHTML.split('>').shift().startsWith(html.split('>').shift()))))),
				passed  : [],//passed.filter(({ nodes })=> (nodes.find(({ html })=> (element.outerHTML.split('>').shift().startsWith(html.split('>').shift()))))),
				aborted : []//aborted.filter(({ nodes })=> (nodes.find(({ html })=> (element.outerHTML.split('>').shift().startsWith(html.split('>').shift())))))
			})
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
