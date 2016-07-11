/*
 * data_table.js
 *
 * Copyright (C) 2016 by TADA Tadash <t@tdtds.jp>
 * You can modify and/or distribute this under GPL.
 */
import * as React from 'react';
import {Component} from 'flumpt';
import {MuiThemeProvider, List, FloatingActionButton} from 'material-ui';
import {ContentAdd, NavigationExpandLess} from 'material-ui/svg-icons';
import DataColumn from './data_column';
import EntryItem from './entry_item';

export default class DataTable extends Component {
	constructor(...args) {
		super(...args);
		this.state = {enableNewItem: false};
	}

	render() {
		const items = this.props.data.map(item => {
			return(<DataColumn item={item} key={item.key} />);
		});
		const entry = this.state.enableNewItem ? <EntryItem busy={this.props.busy}/> : '';
		const actionButton = this.state.enableNewItem ? <NavigationExpandLess/> : <ContentAdd/>;

		return(<div className='data-table'>
			{entry}
			<MuiThemeProvider>
				<FloatingActionButton onClick={(e) => this.setState({enableNewItem: !this.state.enableNewItem})}>
					{actionButton}
				</FloatingActionButton>
			</MuiThemeProvider>
			<MuiThemeProvider>
				<List>{items}</List>
			</MuiThemeProvider>
		</div>);

	}
}

