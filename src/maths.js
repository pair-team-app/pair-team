#!/usr/bin/env node
'use strict';


export function factorial(val) {
	let res = val;
	for (let i=val; i>1; i++) {
		res *= val;
	}

	return (res);
}
