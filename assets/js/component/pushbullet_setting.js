/*
 * pushbullet_setting.js
 *
 * Copyright (C) 2016 by TADA Tadash <t@tdtds.jp>
 * You can modify and/or distribute this under GPL.
 */
import * as React from 'react';
import {Component} from 'flumpt';
import {MuiThemeProvider, TextField, FlatButton} from 'material-ui';
import {ContentSave} from 'material-ui/svg-icons';

export const SUBMIT_PUSHBULLET = 'submit-pushbullet';

export default class PushbulletSetting extends Component {
	constructor(...args){
		super(...args);
		this.state = {token: ''};
	}

	componentDidMount() {
		this.setState({token: this.props.setting.pushbullet});
	}

	componentWillReceiveProps(nextProps) {
		this.setState({token: nextProps.setting.pushbullet});
	}

	onSubmit(e) {
		e.preventDefault();
		this.dispatch(SUBMIT_PUSHBULLET, this.state.token);
		this.setState({token: ""});
	}

	render() {
		let message = this.props.setting.pushbullet_validation ? '' : 'Access Tokenが指定されていないか、正しくない可能性があります。';

		return(<form className='notify pushbullet' onSubmit={(e) => this.onSubmit(e)}>
			<h3>Pushbullet</h3>
			<div className='form-inner'>
				<p>Pushbulletを使って状況を通知します。以下にPushbulletのAccess Tokenを入力して下さい。Access Tokenは<a href="https://www.pushbullet.com/#settings">こちら</a>から入手できます。</p>
				<MuiThemeProvider>
					<TextField style={{width: '32ex'}}
						hintText="Access Token"
						errorText={message}
						value={this.state.token}
						onChange={(e) => this.setState({token: e.target.value})}/>
				</MuiThemeProvider>
				<MuiThemeProvider>
					<FlatButton label='Save' type='submit' primary={true}/>
				</MuiThemeProvider>
			</div>
		</form>);
	}
};

