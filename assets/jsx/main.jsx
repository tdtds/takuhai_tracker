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
		onSubmit:    React.PropTypes.func.isRequired,
		busyNewItem: React.PropTypes.bool.isRequired
	},
	getInitialState() {
		return {enableNewItem: false};
	},
	onNewItem() {
		this.setState({enableNewItem: !this.state.enableNewItem});
	},
	onDelete(key) {
		this.props.onRemove(key);
	},
	onSubmit(key) {
		this.props.onSubmit(key);
	},
	render() {
		var smartPhone = screen.availWidth <= 360 ? true : false;
		var items = this.props.data.map((item) => {
			return(<DataColumn
				item={item}
				key={item.key}
				onDelete={this.onDelete}
				smartPhone={smartPhone}
			/>);
		});
		var headerClass = "mdl-data-table__cell--non-numeric";
		var header;
		var dummy = this.state.enableNewItem ?
			<tbody><tr style={{height: 0}} /></tbody>
			:
			<tbody><tr><th colSpan={smartPhone ? 3 : 4} /></tr></tbody>

		if(smartPhone){
			header = <thead>
				<tr>
					<th className={headerClass} rowSpan="2">伝票番号</th>
					<th className={headerClass}>変更日時</th>
					<th className={headerClass}>運送会社</th>
				</tr>
				<tr>
					<th className={headerClass} colSpan="2">ステータス</th>
				</tr>
			</thead>;
		}else{
			header = <thead>
				<tr>
					<th className={headerClass}>伝票番号</th>
					<th className={headerClass}>変更日時</th>
					<th className={headerClass}>運送会社</th>
					<th className={headerClass}>ステータス</th>
				</tr>
			</thead>;
		}
		return(
			<div className="data-table">
				<table className="mdl-data-table mdl-js-data-table mdl-shadow--2dp">
					{header}
					{items}
					{dummy}
				</table>
				<EntryItem onSubmit={this.onSubmit} enable={this.state.enableNewItem} busy={this.props.busyNewItem} />
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
			case 'TMGCargo':
				return 'TMG';
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
	onDelete() {
		this.props.onDelete(this.props.item.key);
	},
	render() {
		var item = this.props.item;
		var smartPhone = this.props.smartPhone;
		var date = this.formatDate(new Date(item.time), 'MM/DD hh:mm');
		var className = "mdl-data-table__cell--non-numeric";
		if(item.service) {
			return(smartPhone ?
				<tbody>
					<tr>
						<td className={className} rowSpan="2">{item.key}</td>
						<td className={className}>{date}</td>
						<td className={className}>{this.replaceServiceName(item.service)}</td>
					</tr>
					<tr>
						<td className={className} colSpan="2">{item.state}</td>
					</tr>
				</tbody>
				:
				<tbody>
					<tr>
						<td className={className} rowSpan="1">{item.key}</td>
						<td className={className}>{date}</td>
						<td className={className}>{this.replaceServiceName(item.service)}</td>
						<td className={className}>{item.state}</td>
					</tr>
				</tbody>
			);
		} else {
			return(smartPhone ?
				<tbody>
					<tr>
						<td className={className}>
							{item.key}
							<DataDeleteButton onDelete={this.onDelete}/>
						</td>
						<td style={{"textAlign": "center"}}>-</td>
						<td className={className}>(不明)</td>
					</tr>
				</tbody>
				:
				<tbody>
					<tr>
						<td className={className}>
							{item.key}
							<DataDeleteButton onDelete={this.onDelete}/>
						</td>
						<td style={{"textAlign": "center"}}>-</td>
						<td className={className} colSpan="2">(不明)</td>
					</tr>
				</tbody>
			);
		}
	}
});

var DataDeleteButton = React.createClass({
	onClick() {
		this.props.onDelete();
	},
	render() {
		return(
			<button className="mdl-button mdl-js-button mdl-button--icon mdl-button--colored remove-item" onClick={this.onClick}>
				<i className="material-icons">clear</i>
			</button>
		);
	}
});

var EntryItem = React.createClass({
	propTypes: {
		onSubmit: React.PropTypes.func.isRequired,
		enable:   React.PropTypes.bool.isRequired,
		busy:     React.PropTypes.bool.isRequired
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
		console.info(this.props.busy);
		var display = this.props.enable ? 'block' : 'none';
		return(<form style={{display: display}}>
				<div className="mdl-textfield mdl-js-textfield">
					<input className="mdl-textfield__input" ref="inputKey" value={this.state.key} placeholder="伝票番号..." onChange={this.onChange} />
				</div>
				<button className="mdl-button mdl-js-button mdl-button--primary" onClick={this.onClick} disabled={this.props.busy}>
					Add
				</button>
			</form>
		);
	}
});

var Setting = React.createClass({
	propTypes: {
		onSubmit: React.PropTypes.func.isRequired,
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
		this.props.onSubmit(this.state.token);
		this.setState({token: ""});
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
			setting: {},
			busy: false
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
		this.setState({busy: true});
		jQuery.ajax({
			url: '/' + this.state.user,
			type: 'POST',
			data: {key: key}
		}).done((json) => {
			this.setState({busy: false});
			this.updateData();
		}).fail((XMLHttpRequest, textStatus, errorThrown) => {
			this.setState({busy: false});
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
				<DataTable data={this.state.data} onSubmit={this.onEntryItem} onRemove={this.onClearItem} busyNewItem={this.state.busy} />
				<Setting setting={this.state.setting} onSubmit={this.onSetting} />
			</div>
		);
	}
});

var main = document.getElementById('main');
if (main) {
	React.render(<Main />, main);
}
