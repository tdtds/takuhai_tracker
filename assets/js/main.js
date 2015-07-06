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

var DataColmn = React.createClass({displayName: "DataColmn",
	render:function() {
		var item = this.props.item;
		return(React.createElement("tr", null, 
			React.createElement("th", null, item.service), 
			React.createElement("td", null, item.key), 
			React.createElement("td", null, item.time), 
			React.createElement("td", null, item.status)
		));
	}
});

var DataTable = React.createClass({displayName: "DataTable",
	render:function() {
		var items = this.props.data.map(function(item)  {
			return(React.createElement(DataColmn, {item: item, key: item.key}));
		});
		return(
			React.createElement("table", null, 
			items
			)
		);
	}
});

var Main = React.createClass({displayName: "Main",
	getInitialState:function() {
		return {
			user: jQuery('#main').attr('data-user'),
			data: []
		};
	},
	componentDidMount:function() {
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
	render:function() {
		return(React.createElement(DataTable, {data: this.state.data}));
	}
});

var main = document.getElementById('main');
if (main) {
	React.render(React.createElement(Main, null), main);
}
