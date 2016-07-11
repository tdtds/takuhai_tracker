/*
 * app.js
 *
 * Copyright (C) 2016 by TADA Tadash <t@tdtds.jp>
 * You can modify and/or distribute this under GPL.
 */
import * as React from 'react';
import {Flux} from 'flumpt';
import {MuiThemeProvider, AppBar} from 'material-ui';
import DataTable from '../component/data_table';
import {ENTRY_ITEM} from '../component/entry_item';
import {DELETE_ITEM, UPDATE_MEMO} from '../component/data_column';
import Setting, {UPDATE_SETTING} from '../component/setting';
import {SUBMIT_PUSHBULLET} from '../component/pushbullet_setting';

export default class App extends Flux {
	constructor(...args) {
		super(...args)
		this.getData().then(data => {
			this.update(state => {
				state.data = data;
				return state;
			});
		});
	}

	subscribe() {
		this.on(ENTRY_ITEM, (key) => {
			this.update(state => {
				state.busy = true;
				return state;
			})
			this.update(state => {
				state.busy = false;
				return new Promise((resolve, reject) => {
					let form = new FormData(); form.append('key', key);
					fetch('/' + state.user, {method: 'POST', body: form}).
					then((res) => {
						switch (res.status) {
							case 200: return res.json();
							case 409:
								alert('重複する伝票番号は登録できません。この伝票は誰か他の人が追跡中です。');
								return Promise.resolve(state);
							default: return reject(res);
						}
					}).
					then(json => {
						state.data = json;
						return resolve(state);
					}).
					catch(err => console.error(ENTRY_ITEM, err));
				});
			});
		});

		this.on(DELETE_ITEM, key => {
			this.update(state => {
				return new Promise((resolve, reject) => {
					fetch('/' + this.state.user + '/' + key, {method: 'DELETE'}).
					then(res => {
						switch (res.status) {
							case 200: return res.json();
							case 404: return Promise.resolve(state);
							default:  return reject(res);
						}
					}).
					then(json => {
						state.data = json;
						return resolve(state);
					}).
					catch(err => console.error(DELETE_ITEM, err));
				});
			});
		});

		this.on(UPDATE_MEMO, ({key, memo}) => {
			this.update(state => {
				return new Promise((resolve, reject) => {
					let form = new FormData(); form.append('memo', memo);
					fetch('/' + this.state.user + '/' + key, {method: 'PUT', body: form}).
					then(res => {
						switch (res.status) {
							case 200: return res.json();
							case 404: return Promise.resolve(state);
							default:  return reject(res);
						}
					}).
					then(json => {
						state.data = json;
						return resolve(state);
					}).
					catch(err => console.error(UPDATE_MEMO, err));
				});
			});
		});

		this.on(UPDATE_SETTING, (setting) => {
			this.update(state => {
				state.setting = setting;
				return state;
			});
		});

		this.on(SUBMIT_PUSHBULLET, (token) => {
			this.update((state) => {
				return new Promise((resolve, reject) => {
					let form = new FormData();
					form.append('pushbullet', token);
					form.append('mail', '');
					fetch('/' + state.user + '/setting', {method: 'POST', body: form}).
					then((res) => res.json()).
					then((json) => {
						state.setting = json;
						return resolve(state);
					}).
					catch(err => alert(err));
				});
			});
		});
	}

	getData() {
		return new Promise((resolve, reject) => {
			fetch('/' + this.state.user + '.json').
			then(res => res.json()).
			then(json => resolve(json)).
			catch(err => reject(err));
		});
	}

	render(state) {
		const style = {backgroundColor: '#005'};
		return(
			<div>
				<MuiThemeProvider>
					<AppBar title="宅配トラッカー" iconStyleLeft={{display: 'none'}} style={style}/>
				</MuiThemeProvider>
				<p>
					このページはあなた専用です。ブックマークしておくことで再利用できます。
					このURLを他人に教えないよう注意して下さい。
				</p>
				<DataTable {...state}/>
				<Setting {...state}/>
			</div>
		);
	}
}
