/*
 * setting.js
 *
 * Copyright (C) 2016 by TADA Tadash <t@tdtds.jp>
 * You can modify and/or distribute this under GPL.
 */
import * as React from 'react';
import {Component} from 'flumpt';
import {MuiThemeProvider, Card, CardHeader, CardText} from 'material-ui';
import PushbulletSetting from './pushbullet_setting';
import IftttSetting from './ifttt_setting';

export const UPDATE_SETTING = 'update-setting';

export default class Setting extends Component {
	componentDidMount() {
		fetch('/' + this.props.user + '/setting.json').
		then(res => {
			switch (res.status) {
				case 200:
					return res.json();
				case 404: // setting not found
					return null;
				default:
					return Promise.reject(res);
			}
		}).
		then(json => {
			if (json) {
				this.dispatch(UPDATE_SETTING, json)
			}
		}).
		catch(err => {
			console.error('Setting#componentDidMount', err);
		});
	}

	render() {
		const cardStyle = {margin: '1em auto', maxWidth: '50em'};
		let notice = '';

		if (!this.props.setting.pushbullet_validation && !this.props.setting.ifttt_validation) {
			notice = '少なくとも一ヶ所の通知先を設定する必要があります';
		}
		return(<MuiThemeProvider>
			<Card style={cardStyle}>
				<CardHeader
					title='通知設定'
					subtitle={notice}
					actAsExpander={true}
					showExpandableButton={true}/>
				<CardText expandable={true}>
					<PushbulletSetting {...this.props}/>
				</CardText>
				<CardText expandable={true}>
					<IftttSetting {...this.props}/>
				</CardText>
			</Card>
		</MuiThemeProvider>);
	}
};

