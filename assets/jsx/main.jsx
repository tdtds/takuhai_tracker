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
	propTypes: {
		onSubmit: React.PropTypes.func.isRequired
	},
	getInitialState() {
		return {enableNewItem: false};
	},
	onNewItem() {
		this.setState({enableNewItem: !this.state.enableNewItem});
	},
	onRemove(key) {
		this.props.onRemove(key);
	},
	onSubmit(key) {
		this.props.onSubmit(key);
	},
	render() {
		var items = this.props.data.map((item) => {
			return(<DataColumn item={item} key={item.key} onRemove={this.onRemove} />);
		});
		var dummy = this.state.enableNewItem ? '' : <tr><th colSpan="4" /></tr>
		return(
			<div className="data-table">
				<table className="mdl-data-table mdl-js-data-table mdl-shadow--2dp">
					<thead>
						<tr>
							<th className="mdl-data-table__cell--non-numeric">伝票番号</th>
							<th className="mdl-data-table__cell--non-numeric">運送会社</th>
							<th className="mdl-data-table__cell--non-numeric">変更日時</th>
							<th className="mdl-data-table__cell--non-numeric">ステータス</th>
							<th className="mdl-data-table__cell--non-numeric"></th>
						</tr>
					</thead>
					<tbody>
						{items}
						{dummy}
					</tbody>
				</table>
				<EntryItem onSubmit={this.onSubmit} enable={this.state.enableNewItem} />
				<button className="new-item mdl-button mdl-js-button mdl-button--fab mdl-button--colored" onClick={this.onNewItem}>
					<i className="material-icons">{this.state.enableNewItem ? 'expand_less' : 'add'}</i>
				</button>
			</div>
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
			default:
				return service;
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
	onClick(e) {
		this.props.onRemove(this.props.item.key);
	},
	render() {
		var item = this.props.item;
		var date = new Date(item.time);
		return(<tr>
			<th className="mdl-data-table__cell--non-numeric">{item.key}</th>
			<td className="mdl-data-table__cell--non-numeric">{this.replaceServiceName(item.service)}</td>
			<td className="mdl-data-table__cell--non-numeric">{this.formatDate(date, 'MM/DD hh:mm')}</td>
			<td className="mdl-data-table__cell--non-numeric">{item.state}</td>
			<td className="mdl-data-table__cell--non-numeric">
				<button className="mdl-button mdl-js-button mdl-button--icon mdl-button--colored remove-item"
						onClick={this.onClick}>
					<i className="material-icons">clear</i>
				</button>
			</td>
		</tr>);
	}
});

var EntryItem = React.createClass({
	propTypes: {
		onSubmit: React.PropTypes.func.isRequired,
		enable:   React.PropTypes.bool.isRequired
	},
	getInitialState() {
		return {key: ""};
	},
	componentDidUpdate(prevProps, prevState) {
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
		var display = this.props.enable ? 'block' : 'none';
		return(<form style={{display: display}}>
				<div className="mdl-textfield mdl-js-textfield">
					<input className="mdl-textfield__input" ref="inputKey" value={this.state.key} placeholder="伝票番号..." onChange={this.onChange} />
				</div>
				<button className="mdl-button mdl-js-button mdl-button--primary" onClick={this.onClick}>
					Add
				</button>
			</form>
		);
	}
});

var Setting = React.createClass({
	propTypes: {
		onSubmit:   React.PropTypes.func.isRequired,
	},
	render() {
		return(<div>
			<h2>通知設定</h2>
			<h3>Pushbullet</h3>
			<PushbulletSetting token={this.props.setting.pushbullet} onSubmit={this.props.onSubmit} />
		</div>);
	}
});

var PushbulletSetting = React.createClass({
	propTypes: {
		onSubmit: React.PropTypes.func.isRequired
	},
	getInitialState() {
		return {token: ''};
	},
	componentWillReceiveProps(nextProps) {
		this.setState({token: nextProps.token});
	},
	onChange(e) {
		this.setState({token: e.target.value});
	},
	onClick(e) {
		e.preventDefault();
		if(this.state.token.length > 0) {
			this.props.onSubmit(this.state.token);
			this.setState({token: ""});
		};
	},
	render() {
		return(<form className='pushbullet'>
			<div className="mdl-textfield mdl-js-textfield">
				<input className="mdl-textfield__input" value={this.state.token} defaultValue={this.props.token} placeholder="Access Token..." onChange={this.onChange} />
			</div>
			<button className="mdl-button mdl-js-button mdl-button--primary" onClick={this.onClick}>
				Save
			</button>
			<p><a href="https://www.pushbullet.com/#settings">Get your token here.</a></p>
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
	onClearItem(key) {
		jQuery.ajax({
			url: '/' + this.state.user + '/' + key,
			type: 'DELETE',
			cache: false
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
				<DataTable data={this.state.data} onSubmit={this.onEntryItem} onRemove={this.onClearItem} />
				<Setting setting={this.state.setting} onSubmit={this.onSetting} />
			</div>
		);
	}
});

var main = document.getElementById('main');
if (main) {
	React.render(<Main />, main);
}
