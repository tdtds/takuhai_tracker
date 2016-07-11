/*
 * Takuhai Tracker - index.js
 *
 * Copyright (C) 2016 by TADA Tadash <t@tdtds.jp>
 * You can modify and/or distribute this under GPL.
 */
import 'babel-polyfill';
import 'whatwg-fetch';
import * as React from 'react';
import {render} from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
import Top from './container/top';

require('../css/main.css');
injectTapEventPlugin();

const main = document.querySelector('#main');
const state = {};
const app = new Top({
	renderer: el => {
		render(el, main);
	},
	initialState: state
});
app.update(_initialState => (state));

