/*
 * memo.js
 *
 * Copyright (C) 2016 by TADA Tadash <t@tdtds.jp>
 * You can modify and/or distribute this under GPL.
 */
import * as React from 'react';
import {Component} from 'flumpt';
import {MuiThemeProvider} from 'material-ui';

export default class Memo extends Component {
	constructor(...args) {
		super(...args);
		this.state = {memo: '', edit: false};
	}

	componentWillReceiveProps(nextProps) {
		this.setState({memo: nextProps.memo || ''});
	}

	componentDidUpdate(prevProps, prevState) {
		if(!prevState.edit && this.state.edit){
			var input = ReactDOM.findDOMNode(this.refs.memoInput);
			input.focus();
			input.selectionStart = input.selectionEnd = input.value.length;
		}
	}

	onClick() {
		this.setState({memo: this.state.memo, edit: true});
	}

	onChange(e) {
		this.setState({memo: e.target.value});
	}

	onFinish(){
		if (this.props.memo != this.state.memo) {
			this.props.onMemo(this.state.memo);
		}
		this.setState({edit: false});
	}

	onKeyDown(e) {
		if (e.keyCode == 13) { // enter
			e.preventDefault();
			this.onFinish();
		}
	}

	render() {
		var className = "mdl-data-table__cell--non-numeric multi-col";
		var show = <div>
				{this.props.memo}
				<button className="mdl-button mdl-js-button mdl-button--icon mdl-button--colored" onClick={this.onClick}>
					<i className="material-icons">mode_edit</i>
				</button>
			</div>;
		var edit = <form>
				<input className="fake-mdl_textfield_input" id="memo-input" ref="memoInput" value={this.state.memo} onChange={this.onChange} onKeyDown={this.onKeyDown} onBlur={this.onFinish} />
			</form>;

		return(this.state.edit ? edit : show);
	}
};

