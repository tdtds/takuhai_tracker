/*
 * main.js
 *
 * Copyright (C) 2015 by TADA Tadash <t@tdtds.jp>
 * You can modify and/or distribute this under GPL.
 */

jQuery.ajaxSetup({
	beforeSend: function(xhr) {
		var token = jQuery('meta[name="_csrf"]').attr('content');
		xhr.setRequestHeader('X_CSRF_TOKEN', token);
	}
});

var DataTable = React.createClass({
	render() {
		var items = this.props.data.map((item) => {
			return(<DataColumn item={item} key={item.key} />);
		});
		return(
			<table>
				<th>伝票番号</th><th>運送会社</th><th>変更日時</th><th>ステータス</th>
				{items}
			</table>
		);
	}
});

var DataColumn = React.createClass({
	replaceServiceName(service) {
		switch(service) {
			case 'JapanPost':
				return '日本郵便';
			case 'KuronekoYamato':
				return 'ヤマト運輸';
			case 'Sagawa':
				return '佐川急便';
		}
	},
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
	},
	render() {
		var item = this.props.item;
		var date = new Date(item.time);
		return(<tr>
			<th>{item.key}</th>
			<td>{this.replaceServiceName(item.service)}</td>
			<td>{this.formatDate(date, 'MM/DD hh:mm')}</td>
			<td>{item.status}</td>
		</tr>);
	}
});

var EntryItem = React.createClass({
	propTypes: {
		onSubmit:   React.PropTypes.func.isRequired,
		submitable: React.PropTypes.bool,
	},
	getInitialState() {
		return {key: ""};
	},
	getDefaultProps() {
		return {
			submitable: true
		};
	},
	componentDidMount() {
		this.refs.inputKey.getDOMNode().focus();
	},
	onChange(e) {
		this.setState({key: e.target.value});
	},
	onClick(e) {
		e.preventDefault();
		if(this.state.key.length > 0) {
			this.props.onSubmit(this.state.key);
			this.setState({key: ""});
		};
	},
	render() {
		return(<form>
			新しい伝票番号
			<input ref="inputKey" value={this.state.key} onChange={this.onChange} />
			<input type="submit" value="追加" disabled={!this.props.submitable} onClick={this.onClick} />
		</form>);
	}
});

var Setting = React.createClass({
	propTypes: {
		onSubmit:   React.PropTypes.func.isRequired,
	},
	render() {
		return(<div>
			<h2>通知設定</h2>
			<PushbulletSetting apiKey={this.props.setting.pushbullet} onSubmit={this.props.onSubmit} />
		</div>);
	}
});

var PushbulletSetting = React.createClass({
	propTypes: {
		onSubmit: React.PropTypes.func.isRequired
	},
	getInitialState() {
		return {key: ''};
	},
	componentWillReceiveProps(nextProps) {
		this.setState({key: nextProps.apiKey});
	},
	onChange(e) {
		this.setState({key: e.target.value});
	},
	onClick(e) {
		e.preventDefault();
		if(this.state.key.length > 0) {
			this.props.onSubmit(this.state.key);
			this.setState({key: ""});
		};
	},
	render() {
		return(<form className='pushbullet'>
			PushBullet API key: 
			<input type="text" ref="inputKey" value={this.state.key} defaultValue={this.props.apiKey} onChange={this.onChange} />
			<input type="submit" value="保存" onClick={this.onClick} />
		</form>);
	}
});

var Main = React.createClass({
	getInitialState() {
		return {
			user: jQuery('#main').attr('data-user'),
			data: [],
			setting: {}
		};
	},
	updateData() {
		jQuery.ajax({
			url: '/' + this.state.user + '.json',
			type: 'GET',
			dataType: 'json',
			cache: false
		}).done((json) => {
			this.setState({data: json});
		}).fail((XMLHttpRequest, textStatus, errorThrown) => {
			alert(textStatus+': '+errorThrown);
		});
	},
	updateSetting() {
		jQuery.ajax({
			url: '/' + this.state.user + '/setting.json',
			type: 'GET',
			dataType: 'json',
			cache: false
		}).done((json) => {
			this.setState({setting: json});
		}).fail((XMLHttpRequest, textStatus, errorThrown) => {
			if(XMLHttpRequest.status != 404) {
				alert(textStatus+': '+errorThrown);
			}
		});
	},
	onEntryItem(key) {
		jQuery.ajax({
			url: '/' + this.state.user,
			type: 'POST',
			data: {key: key}
		}).done((json) => {
			this.updateData();
		}).fail((XMLHttpRequest, textStatus, errorThrown) => {
			alert(textStatus+': '+errorThrown);
		});
	},
	onSetting(pushbulletKey) {
		jQuery.ajax({
			url: '/' + this.state.user + '/setting',
			type: 'POST',
			dataType: 'json',
			data: {pushbullet: pushbulletKey, mail: ''}
		}).done((json) => {
			this.setState({setting: json});
		}).fail((XMLHttpRequest, textStatus, errorThrown) => {
			alert(textStatus+': '+errorThrown);
		});
	},
	componentDidMount() {
		this.updateData();
		this.updateSetting();
	},
	render() {
		return(
			<div>
				<DataTable data={this.state.data} />
				<EntryItem onSubmit={this.onEntryItem} submitable={this.state.submitable} />
				<Setting setting={this.state.setting} onSubmit={this.onSetting} />
			</div>
		);
	}
});

var main = document.getElementById('main');
if (main) {
	React.render(<Main />, main);
}
