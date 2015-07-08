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

var DataTable = React.createClass({displayName: "DataTable",
	render:function() {
		var items = this.props.data.map(function(item)  {
			return(React.createElement(DataColumn, {item: item, key: item.key}));
		});
		return(
			React.createElement("table", null, 
				React.createElement("th", null, "伝票番号"), React.createElement("th", null, "運送会社"), React.createElement("th", null, "変更日時"), React.createElement("th", null, "ステータス"), 
				items
			)
		);
	}
});

var DataColumn = React.createClass({displayName: "DataColumn",
	replaceServiceName:function(service) {
		switch(service) {
			case 'JapanPost':
				return '日本郵便';
			case 'KuronekoYamato':
				return 'ヤマト運輸';
			case 'Sagawa':
				return '佐川急便';
		}
	},
	formatDate:function(date, format) {
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
	render:function() {
		var item = this.props.item;
		var date = new Date(item.time);
		return(React.createElement("tr", null, 
			React.createElement("th", null, item.key), 
			React.createElement("td", null, this.replaceServiceName(item.service)), 
			React.createElement("td", null, this.formatDate(date, 'MM/DD hh:mm')), 
			React.createElement("td", null, item.state)
		));
	}
});

var EntryItem = React.createClass({displayName: "EntryItem",
	propTypes: {
		onSubmit:   React.PropTypes.func.isRequired,
		submitable: React.PropTypes.bool,
	},
	getInitialState:function() {
		return {key: ""};
	},
	getDefaultProps:function() {
		return {
			submitable: true
		};
	},
	componentDidMount:function() {
		this.refs.inputKey.getDOMNode().focus();
	},
	onChange:function(e) {
		this.setState({key: e.target.value});
	},
	onClick:function(e) {
		e.preventDefault();
		if(this.state.key.length > 0) {
			this.props.onSubmit(this.state.key);
			this.setState({key: ""});
		};
	},
	render:function() {
		return(React.createElement("form", null, 
			"新しい伝票番号", 
			React.createElement("input", {ref: "inputKey", value: this.state.key, onChange: this.onChange}), 
			React.createElement("input", {type: "submit", value: "追加", disabled: !this.props.submitable, onClick: this.onClick})
		));
	}
});

var Setting = React.createClass({displayName: "Setting",
	propTypes: {
		onSubmit:   React.PropTypes.func.isRequired,
	},
	render:function() {
		return(React.createElement("div", null, 
			React.createElement("h2", null, "通知設定"), 
			React.createElement(PushbulletSetting, {token: this.props.setting.pushbullet, onSubmit: this.props.onSubmit})
		));
	}
});

var PushbulletSetting = React.createClass({displayName: "PushbulletSetting",
	propTypes: {
		onSubmit: React.PropTypes.func.isRequired
	},
	getInitialState:function() {
		return {token: ''};
	},
	componentWillReceiveProps:function(nextProps) {
		this.setState({token: nextProps.token});
	},
	onChange:function(e) {
		this.setState({token: e.target.value});
	},
	onClick:function(e) {
		e.preventDefault();
		if(this.state.token.length > 0) {
			this.props.onSubmit(this.state.token);
			this.setState({token: ""});
		};
	},
	render:function() {
		return(React.createElement("form", {className: "pushbullet"}, 
			React.createElement("h3", null, "PushBullet"), 
			React.createElement("div", null, 
				"Access Token:",  
				React.createElement("input", {type: "text", ref: "inputKey", value: this.state.token, defaultValue: this.props.token, onChange: this.onChange}), 
				React.createElement("input", {type: "submit", value: "保存", onClick: this.onClick}), 
				React.createElement("p", null, React.createElement("a", {href: "https://www.pushbullet.com/#settings"}, "Get your token here."))
			)
		));
	}
});

var Main = React.createClass({displayName: "Main",
	getInitialState:function() {
		return {
			user: jQuery('#main').attr('data-user'),
			data: [],
			setting: {}
		};
	},
	updateData:function() {
		jQuery.ajax({
			url: '/' + this.state.user + '.json',
			type: 'GET',
			dataType: 'json',
			cache: false
		}).done(function(json)  {
			this.setState({data: json});
		}.bind(this)).fail(function(XMLHttpRequest, textStatus, errorThrown)  {
			alert(textStatus+': '+errorThrown);
		});
	},
	updateSetting:function() {
		jQuery.ajax({
			url: '/' + this.state.user + '/setting.json',
			type: 'GET',
			dataType: 'json',
			cache: false
		}).done(function(json)  {
			this.setState({setting: json});
		}.bind(this)).fail(function(XMLHttpRequest, textStatus, errorThrown)  {
			if(XMLHttpRequest.status != 404) {
				alert(textStatus+': '+errorThrown);
			}
		});
	},
	onEntryItem:function(key) {
		jQuery.ajax({
			url: '/' + this.state.user,
			type: 'POST',
			data: {key: key}
		}).done(function(json)  {
			this.updateData();
		}.bind(this)).fail(function(XMLHttpRequest, textStatus, errorThrown)  {
			alert(textStatus+': '+errorThrown);
		});
	},
	onSetting:function(pushbulletKey) {
		jQuery.ajax({
			url: '/' + this.state.user + '/setting',
			type: 'POST',
			dataType: 'json',
			data: {pushbullet: pushbulletKey, mail: ''}
		}).done(function(json)  {
			this.setState({setting: json});
		}.bind(this)).fail(function(XMLHttpRequest, textStatus, errorThrown)  {
			alert(textStatus+': '+errorThrown);
		});
	},
	componentDidMount:function() {
		this.updateData();
		this.updateSetting();
	},
	render:function() {
		return(
			React.createElement("div", null, 
				React.createElement(DataTable, {data: this.state.data}), 
				React.createElement(EntryItem, {onSubmit: this.onEntryItem, submitable: this.state.submitable}), 
				React.createElement(Setting, {setting: this.state.setting, onSubmit: this.onSetting})
			)
		);
	}
});

var main = document.getElementById('main');
if (main) {
	React.render(React.createElement(Main, null), main);
}
