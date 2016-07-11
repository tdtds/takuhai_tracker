/*
 * Takuhai Tracker - main.js
 *
 * Copyright (C) 2016 by TADA Tadash <t@tdtds.jp>
 * You can modify and/or distribute this under GPL.
 */
import 'babel-polyfill';
import 'whatwg-fetch';
import * as React from 'react';
import {render} from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
import App from './container/app';

require('../css/main.css');
injectTapEventPlugin();

const main = document.querySelector('#main');
const state = {
	user: main.getAttribute('data-user'),
	data: [],
	setting: {
		pushbullet: '',
		pushbullet_validation: false,
		mail: ''
	},
	busy: false
};
const app = new App({
	renderer: el => {
		render(el, main);
	},
	initialState: state
});
app.update(_initialState => (state));
