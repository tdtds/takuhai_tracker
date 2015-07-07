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
	render() {
		return(
			<div>enter item</div>
		);
	}
});

var Setting = React.createClass({
	render() {
		return(<div>
			<PushbulletSetting />
		</div>);
	}
});

var PushbulletSetting = React.createClass({
	render() {
		return(<div>
				pushbullet setting
		</div>);
	}
});

var Main = React.createClass({
	getInitialState() {
		return {
			user: jQuery('#main').attr('data-user'),
			data: []
		};
	},
	componentDidMount() {
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
	render() {
		return(
			<div>
				<DataTable data={this.state.data} />
				<EntryItem />
				<Setting />
			</div>
		);
	}
});

var main = document.getElementById('main');
if (main) {
	React.render(<Main />, main);
}
