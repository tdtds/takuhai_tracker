/*
 * data_column.js
 *
 * Copyright (C) 2016 by TADA Tadash <t@tdtds.jp>
 * You can modify and/or distribute this under GPL.
 */
import * as React from 'react';
import {Component} from 'flumpt';
import {MuiThemeProvider, ListItem, Avatar, IconButton, TextField} from 'material-ui';
import {CommunicationComment, ContentClear} from 'material-ui/svg-icons';
import Memo from './memo';

export const DELETE_ITEM = 'delete-item';
export const UPDATE_MEMO = 'update-memo';

export default class DataColumn extends Component {
	constructor(...args) {
		super(...args);
		this.state = {memo: ''};
	}

	componentDidMount() {
		this.setState({memo: this.props.item.memo || ''});
	}

	replaceServiceName(service) {
		switch(service) {
			case 'JapanPost':
				return '日本郵便';
			case 'KuronekoYamato':
				return 'ヤマト運輸';
			case 'Sagawa':
				return '佐川急便';
			case 'TMGCargo':
				return 'TMG';
			default:
				return '(運送業者不明)';
		}
	}

	formatDate(date, format) {
		if (!format) {
			format = 'YYYY-MM-DD';
		}
		format = format.replace(/YYYY/g, date.getFullYear());
		format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
		format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
		format = format.replace(/dd/g, ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]);
		format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
		format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
		format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
		return format;
	}

	onKeyUp(e) {
		if (e.keyCode == 13) { // enter
			e.preventDefault();
			this.updateMemo();
		}
	}

	updateMemo() {
		if (this.state.memo != this.props.item.memo) {
			this.dispatch(UPDATE_MEMO, {key: this.props.item.key, memo: this.state.memo});
		}
	}

	render() {
		const item = this.props.item;
		const date = this.formatDate(new Date(item.time), 'MM/DD hh:mm');
		const serviceName = this.replaceServiceName(item.service);
		const icon = '/img/icons/' + (item.service || 'unknown') + '.png';
		const state = item.state || '';
		const memo = item.memo || '';
		const button = this.props.item.service ? <span/> :
			<IconButton onClick={(e)=>this.dispatch(DELETE_ITEM, item.key)} key='delete'>
				<ContentClear/>
			</IconButton>;
		const first = serviceName + ' ' + date + ' ' + state;
		const second = <span>
			<TextField id={'memo-' + item.key} ref='memo' style={{width: '100%'}}
				hintText={'メモ(' + item.key + ')'}
				value={this.state.memo}
				onChange={(e) => this.setState({memo: e.target.value})}
				onBlur={(e) => this.updateMemo()}
				onKeyUp={(e) => this.onKeyUp(e)}
			/>
		</span>;

		return(
			<ListItem
				leftAvatar={<Avatar src={icon}/>}
				primaryText={first}
				secondaryText={second}
				rightIconButton={button}
				disableKeyboardFocus={true}
				style={{textAlign: 'left'}}
			/>
		);
	}
};

