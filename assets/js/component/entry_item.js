/*日本語
 *
 * entry_item.js
 *
 * Copyright (C) 2016 by TADA Tadash <t@tdtds.jp>
 * You can modify and/or distribute this under GPL.
 */
import * as React from 'react';
import {Component} from 'flumpt';
import {MuiThemeProvider, TextField, FlatButton} from 'material-ui';

export const ENTRY_ITEM = 'entry-item';

export default class EntryItem extends Component {
	constructor(...args) {
		super(...args);
		this.state = {key: ''};
	}

	componentDidMount() {
		this.refs.inputKey.focus();
	}

	onSubmit(e) {
		e.preventDefault();
		if(this.state.key.length > 0) {
			this.dispatch(ENTRY_ITEM, this.state.key);
			this.setState({key: ''});
		};
	}

	render() {
		return(
			<form className="entry-item" onSubmit={(e) => this.onSubmit(e)}>
				<MuiThemeProvider>
					<TextField id="entry-item_input" ref="inputKey"
						hintText='伝票番号'
						value={this.state.key}
						onChange={(e) => this.setState({key: e.target.value})}/>
				</MuiThemeProvider>
				<MuiThemeProvider>
					<FlatButton label='Add' type='submit' primary={true} disabled={this.props.busy}/>
				</MuiThemeProvider>
			</form>
		);
	}
};

