/*
 * ifttt_setting.js
 *
 * Copyright (C) 2017 by TADA Tadash <t@tdtds.jp>
 * You can modify and/or distribute this under GPL.
 */
import * as React from 'react';
import {Component} from 'flumpt';
import {MuiThemeProvider, TextField, FlatButton} from 'material-ui';
import {ContentSave} from 'material-ui/svg-icons';

export const SUBMIT_IFTTT = 'submit-ifttt';

export default class IftttSetting extends Component {
	constructor(...args){
		super(...args);
		this.state = {token: ''};
	}

	componentDidMount() {
		this.setState({token: this.props.setting.ifttt});
	}

	componentWillReceiveProps(nextProps) {
		this.setState({token: nextProps.setting.ifttt});
	}

	onSubmit(e) {
		e.preventDefault();
		this.dispatch(SUBMIT_IFTTT, this.state.token);
		this.setState({token: ""});
	}

	render() {
		let message = this.props.setting.ifttt_validation ? '' : 'Keyが指定されていないか、正しくない可能性があります。';

		return(<form className='notify ifttt' onSubmit={(e) => this.onSubmit(e)}>
			<h3>IFTTT Webhook</h3>
			<div className='form-inner'>
				<p>IFTTTのWebhookによる通知が欲しい場合はWebhookのKeyを入力して下さい。Keyは<a href="https://ifttt.com/services/maker_webhooks/settings">こちら</a>から入手できます(「URL」の「use/」以降の部分です)。</p>
				<MuiThemeProvider>
					<TextField style={{width: '32ex'}}
						hintText="Key"
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

