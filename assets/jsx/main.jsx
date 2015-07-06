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

var DataColmn = React.createClass({
	render() {
		var item = this.props.item;
		return(<tr>
			<th>{item.service}</th>
			<td>{item.key}</td>
			<td>{item.time}</td>
			<td>{item.status}</td>
		</tr>);
	}
});

var DataTable = React.createClass({
	render() {
		var items = this.props.data.map((item) => {
			return(<DataColmn item={item} key={item.key} />);
		});
		return(
			<table>
			{items}
			</table>
		);
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
		return(<DataTable data={this.state.data} />);
	}
});

var main = document.getElementById('main');
if (main) {
	React.render(<Main />, main);
}
