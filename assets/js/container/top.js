/*
 * top.js
 *
 * Copyright (C) 2016 by TADA Tadash <t@tdtds.jp>
 * You can modify and/or distribute this under GPL.
 */
import * as React from 'react';
import {Flux} from 'flumpt';
import {MuiThemeProvider, AppBar, FloatingActionButton} from 'material-ui';
import {ContentAdd, NavigationExpandLess} from 'material-ui/svg-icons';

export default class Top extends Flux {
	render(state) {
		const style = {backgroundColor: '#005'};
		return(
			<div>
				<MuiThemeProvider>
					<AppBar title="宅配トラッカー" iconStyleLeft={{display: 'none'}} style={style}/>
				</MuiThemeProvider>
				<form className='index' method='POST' action='/'><MuiThemeProvider>
					<FloatingActionButton type='submit'><ContentAdd/></FloatingActionButton>
				</MuiThemeProvider></form>
				<p>
					宅配便の配送状況を定期的にチェックして、変化があったときに
					<a href="https://www.pushbullet.com/">Pushbullet</a>で通知してくれる
					サービスです。現在、ヤマト運輸、佐川急便、日本郵便、TMG、UPS
					およびFedExの6サービスに対応しています(ただしTMGはAmazonの荷物のみ、
					FedExは試験運用中)。
					あらかじめPushbulletのAPIトークンを設定し、あとは各サービスの
					伝票番号を入力していくだけで使えます。
				</p>
			</div>
		);
	}
}
