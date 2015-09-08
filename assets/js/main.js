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
	propTypes: {
		onRemove:     React.PropTypes.func.isRequired,
		onUpdateMemo: React.PropTypes.func.isRequired,
		onSubmit:     React.PropTypes.func.isRequired,
		busyNewItem:  React.PropTypes.bool.isRequired
	},
	getInitialState:function() {
		return {enableNewItem: false};
	},
	onNewItem:function() {
		this.setState({enableNewItem: !this.state.enableNewItem});
	},
	onDelete:function(key) {
		this.props.onRemove(key);
	},
	onMemo:function(key, memo) {
		this.props.onUpdateMemo(key, memo);
	},
	onSubmit:function(key) {
		this.props.onSubmit(key);
	},
	render:function() {
		var smartPhone = $(window).width() <= 360 ? true : false;
		var items = this.props.data.map(function(item)  {
			return(React.createElement(DataColumn, {
				item: item, 
				key: item.key, 
				onDelete: this.onDelete, 
				onMemo: this.onMemo, 
				smartPhone: smartPhone}
			));
		}.bind(this));
		var headerClass = "mdl-data-table__cell--non-numeric";
		var header;
		var dummy = this.state.enableNewItem ?
			React.createElement("tbody", null, React.createElement("tr", {style: {height: 0}}))
			:
			React.createElement("tbody", null, React.createElement("tr", null, React.createElement("th", {colSpan: smartPhone ? 3 : 4})))

		if(smartPhone){
			header = React.createElement("thead", null, 
				React.createElement("tr", null, 
					React.createElement("th", {className: headerClass}, "伝票番号"), 
					React.createElement("th", {className: headerClass}, "変更日時"), 
					React.createElement("th", {className: headerClass}, "運送会社")
				)
			);
		}else{
			header = React.createElement("thead", null, 
				React.createElement("tr", null, 
					React.createElement("th", {className: headerClass}, "伝票番号"), 
					React.createElement("th", {className: headerClass}, "変更日時"), 
					React.createElement("th", {className: headerClass}, "運送会社"), 
					React.createElement("th", {className: headerClass}, "ステータス")
				)
			);
		}
		return(
			React.createElement("div", {className: "data-table"}, 
				React.createElement("table", {className: "mdl-data-table mdl-js-data-table mdl-shadow--2dp"}, 
					header, 
					items, 
					dummy
				), 
				React.createElement(EntryItem, {onSubmit: this.onSubmit, enable: this.state.enableNewItem, busy: this.props.busyNewItem}), 
				React.createElement("button", {className: "new-item mdl-button mdl-js-button mdl-button--fab mdl-button--colored", onClick: this.onNewItem}, 
					React.createElement("i", {className: "material-icons"}, this.state.enableNewItem ? 'expand_less' : 'add')
				)
			)
		);
	}
});

var DataColumn = React.createClass({displayName: "DataColumn",
	propTypes: {
		onDelete: React.PropTypes.func.isRequired,
		onMemo:   React.PropTypes.func.isRequired
	},
	replaceServiceName:function(service) {
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
	onDelete:function() {
		this.props.onDelete(this.props.item.key);
	},
	onMemo:function(memo) {
		this.props.onMemo(this.props.item.key, memo);
	},
	render:function() {
		var item = this.props.item;
		var smartPhone = this.props.smartPhone;
		var date = this.formatDate(new Date(item.time), 'MM/DD hh:mm');
		var className = "mdl-data-table__cell--non-numeric";
		if(item.service) {
			return(smartPhone ?
				React.createElement("tbody", null, 
					React.createElement("tr", null, 
						React.createElement("td", {className: className + ' multi-row', rowSpan: "3"}, item.key), 
						React.createElement("td", {className: className}, date), 
						React.createElement("td", {className: className}, this.replaceServiceName(item.service))
					), 
					React.createElement("tr", null, 
						React.createElement("td", {className: className + ' multi-col', colSpan: "2"}, item.state)
					), 
					React.createElement(Memo, {colSpan: "2", memo: item.memo, onMemo: this.onMemo})
				)
				:
				React.createElement("tbody", null, 
					React.createElement("tr", null, 
						React.createElement("td", {className: className + ' multi-row', rowSpan: "2"}, item.key), 
						React.createElement("td", {className: className}, date), 
						React.createElement("td", {className: className}, this.replaceServiceName(item.service)), 
						React.createElement("td", {className: className}, item.state)
					), 
					React.createElement(Memo, {colSpan: "3", memo: item.memo, onMemo: this.onMemo})
				)
			);
		} else {
			return(smartPhone ?
				React.createElement("tbody", null, 
					React.createElement("tr", null, 
						React.createElement("td", {className: className + ' multi-row', rowSpan: "2"}, 
							item.key, 
							React.createElement(DataDeleteButton, {onDelete: this.onDelete})
						), 
						React.createElement("td", {style: {"textAlign": "center"}}, "-"), 
						React.createElement("td", {className: className}, "(不明)")
					), 
					React.createElement(Memo, {colSpan: "2", memo: item.memo, onMemo: this.onMemo})
				)
				:
				React.createElement("tbody", null, 
					React.createElement("tr", null, 
						React.createElement("td", {className: className + ' multi-row', rowSpan: "2"}, 
							item.key, 
							React.createElement(DataDeleteButton, {onDelete: this.onDelete})
						), 
						React.createElement("td", {style: {"textAlign": "center"}}, "-"), 
						React.createElement("td", {className: className, colSpan: "2"}, "(不明)")
					), 
					React.createElement(Memo, {colSpan: "3", memo: item.memo, onMemo: this.onMemo})
				)
			);
		}
	}
});

var DataDeleteButton = React.createClass({displayName: "DataDeleteButton",
	propTypes: {
		onDelete: React.PropTypes.func.isRequired
	},
	onClick:function() {
		this.props.onDelete();
	},
	render:function() {
		return(
			React.createElement("button", {className: "mdl-button mdl-js-button mdl-button--icon mdl-button--colored remove-item", onClick: this.onClick}, 
				React.createElement("i", {className: "material-icons"}, "clear")
			)
		);
	}
});

var Memo = React.createClass({displayName: "Memo",
	propTypes: {
		onMemo: React.PropTypes.func.isRequired
	},
	getInitialState:function() {
		return {
			memo: this.props.memo,
			edit: false
		};
	},
	componentDidUpdate:function(prevProps, prevState) {
		if(!prevState.edit && this.state.edit){
			var input = this.refs.memoInput.getDOMNode();
			input.focus();
			input.selectionStart = input.selectionEnd = input.value.length;
		}
	},
	onClick:function() {
		this.setState({memo: this.props.memo, edit: true});
	},
	onChange:function(e) {
		this.setState({memo: e.target.value});
	},
	onFinish:function(){
		if (this.props.memo != this.state.memo) {
			this.props.onMemo(this.state.memo);
		}
		this.setState({edit: false});
	},
	onKeyDown:function(e) {
		if (e.keyCode == 13) { // enter
			e.preventDefault();
			this.onFinish();
		}
	},
	render:function() {
		var className = "mdl-data-table__cell--non-numeric multi-col";
		var show = React.createElement("div", null, 
				this.props.memo, 
				React.createElement("button", {className: "mdl-button mdl-js-button mdl-button--icon mdl-button--colored", onClick: this.onClick}, 
					React.createElement("i", {className: "material-icons"}, "mode_edit")
				)
			);
		var edit = React.createElement("form", null, 
				React.createElement("input", {className: "fake-mdl_textfield_input", id: "memo-input", ref: "memoInput", value: this.state.memo, onChange: this.onChange, onKeyDown: this.onKeyDown, onBlur: this.onFinish})
			);

		return(
			React.createElement("tr", null, React.createElement("td", {className: className, colSpan: this.props.colSpan}, 
				this.state.edit ? edit : show
			))
		);
	}
});

var EntryItem = React.createClass({displayName: "EntryItem",
	propTypes: {
		onSubmit: React.PropTypes.func.isRequired,
		enable:   React.PropTypes.bool.isRequired,
		busy:     React.PropTypes.bool.isRequired
	},
	getInitialState:function() {
		return {key: ""};
	},
	componentDidUpdate:function(prevProps, prevState) {
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
		var display = this.props.enable ? 'block' : 'none';
		return(React.createElement("form", {className: "entry-item", style: {display: display}}, 
				React.createElement("div", {className: "mdl-textfield mdl-js-textfield"}, 
					React.createElement("input", {className: "mdl-textfield__input", id: "entry-item_input", ref: "inputKey", value: this.state.key, onChange: this.onChange}), 
					React.createElement("label", {className: "mdl-textfield__label", htmlFor: "entry-item_input"}, "伝票番号...")
				), 
				React.createElement("button", {className: "mdl-button mdl-js-button mdl-button--primary", onClick: this.onClick, disabled: this.props.busy}, 
					"Add"
				)
			)
		);
	}
});

var Setting = React.createClass({displayName: "Setting",
	propTypes: {
		onSubmit: React.PropTypes.func.isRequired,
	},
	render:function() {
		return(React.createElement("div", null, 
			React.createElement("h2", null, "通知設定"), 
			React.createElement("h3", null, "Pushbullet"), 
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
		this.props.onSubmit(this.state.token);
		this.setState({token: ""});
	},
	render:function() {
		return(React.createElement("form", {className: "notify pushbullet"}, 
			React.createElement("p", null, "Pushbulletを使って状況を通知します。以下にPushbulletのAccess Tokenを入力して下さい。Access Tokenは", React.createElement("a", {href: "https://www.pushbullet.com/#settings"}, "こちら"), "から入手できます。"), 
			React.createElement("div", {className: "mdl-textfield mdl-js-textfield"}, 
				React.createElement("input", {className: "mdl-textfield__input", value: this.state.token, defaultValue: this.props.token, placeholder: "Access Token...", onChange: this.onChange})
			), 
			React.createElement("button", {className: "mdl-button mdl-js-button mdl-button--primary", onClick: this.onClick}, 
				"Save"
			)
		));
	}
});

var Main = React.createClass({displayName: "Main",
	getInitialState:function() {
		return {
			user: jQuery('#main').attr('data-user'),
			data: [],
			setting: {},
			busy: false
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
			alert(XMLHttpRequest.responseText + '(' + XMLHttpRequest.status + ')');
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
				alert(XMLHttpRequest.responseText + '(' + XMLHttpRequest.status + ')');
			}
		});
	},
	onEntryItem:function(key) {
		this.setState({busy: true});
		jQuery.ajax({
			url: '/' + this.state.user,
			type: 'POST',
			data: {key: key}
		}).done(function(json)  {
			this.setState({busy: false});
			this.updateData();
		}.bind(this)).fail(function(XMLHttpRequest, textStatus, errorThrown)  {
			this.setState({busy: false});
			if (XMLHttpRequest.status == 409) {
				alert('重複する伝票番号は登録できません。この伝票は誰か他の人が追跡中です。');
			} else {
				alert(XMLHttpRequest.responseText + '(' + XMLHttpRequest.status + ')');
			}
		}.bind(this));
	},
	onClearItem:function(key) {
		jQuery.ajax({
			url: '/' + this.state.user + '/' + key,
			type: 'DELETE',
			cache: false
		}).done(function(json)  {
			this.updateData();
		}.bind(this)).fail(function(XMLHttpRequest, textStatus, errorThrown)  {
			if (XMLHttpRequest.status == 404) {
				this.updateData();
			} else {
				alert(XMLHttpRequest.responseText + '(' + XMLHttpRequest.status + ')');
			}
		}.bind(this));
	},
	onUpdateMemo:function(key, memo) {
		jQuery.ajax({
			url: '/' + this.state.user + '/' + key,
			type: 'PUT',
			data: {memo: memo}
		}).done(function(json)  {
			this.updateData();
		}.bind(this)).fail(function(XMLHttpRequest, textStatus, errorThrown)  {
			alert(XMLHttpRequest.responseText + '(' + XMLHttpRequest.status + ')');
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
			alert(XMLHttpRequest.responseText + '(' + XMLHttpRequest.status + ')');
		});
	},
	componentDidMount:function() {
		this.updateData();
		this.updateSetting();
	},
	render:function() {
		return(
			React.createElement("div", null, 
				React.createElement(DataTable, {data: this.state.data, onSubmit: this.onEntryItem, onRemove: this.onClearItem, onUpdateMemo: this.onUpdateMemo, busyNewItem: this.state.busy}), 
				React.createElement(Setting, {setting: this.state.setting, onSubmit: this.onSetting})
			)
		);
	}
});

var main = document.getElementById('main');
if (main) {
	React.render(React.createElement(Main, null), main);
}
