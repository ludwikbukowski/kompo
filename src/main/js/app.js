'use strict';

const React = require('react');
const ReactDOM = require('react-dom')
const when = require('when');
const client = require('./client');

const follow = require('./follow'); // function to hop multiple links by "rel"

const root = '/api';

class App extends React.Component {

constructor(props) {
		super(props);
		this.state = {shopLists: [], attributes: []};
		this.onCreate = this.onCreate.bind(this);
	}

	componentDidMount() {
    	this.loadFromServer(this.state.pageSize);
    }

	render() {
		return (
			<ShopListList shopLists={this.state.shopLists}/>
		)
	}

loadFromServer(pageSize) {
	follow(client, root, [
		{rel: 'shopLists', params: {size: pageSize}}]
	).then(shopListCollection => {
		return client({
			method: 'GET',
			path: shopListCollection.entity._links.profile.href,
			headers: {'Accept': 'application/schema+json'}
		}).then(schema => {
			this.schema = schema.entity;
			return shopListCollection;
		});
	}).done(shopListCollection => {
		this.setState({
			shopLists: shopListCollection.entity._embedded.shopLists,
			attributes: Object.keys(this.schema.properties),
			pageSize: pageSize,
			links: shopListCollection.entity._links});
	});
}
onCreate(newShopList) {
	follow(client, root, ['shopLists']).then(shopListCollection => {
		return client({
			method: 'POST',
			path: shopListCollection.entity._links.self.href,
			entity: newShopList,
			headers: {'Content-Type': 'application/json'}
		})
	}).then(response => {
		return follow(client, root, [
			{rel: 'shopLists', params: {'size': this.state.pageSize}}]);
	}).done(response => {
		if (typeof response.entity._links.last != "undefined") {
			this.onNavigate(response.entity._links.last.href);
		} else {
			this.onNavigate(response.entity._links.self.href);
		}
	});

}
    onDelete(shopList) {
        client({method: 'DELETE', path: shopList._links.self.href}).done(response => {
            this.loadFromServer(this.state.pageSize);
        });
    }

	onNavigate(navUri) {
    		client({method: 'GET', path: navUri}).done(shopListCollection => {
    			this.setState({
    				shopLists: shopListCollection.entity._embedded.shopLists,
    				attributes: this.state.attributes,
    				pageSize: this.state.pageSize,
    				links: shopListCollection.entity._links
    			});
    		});
    }
        render() {
        		return (
        			<div>
        				<CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
        				<ShopLists shopLists={this.state.shopLists}
        							  links={this.state.links}
        							  pageSize={this.state.pageSize}
        							  onNavigate={this.onNavigate}/>
        			</div>
        		)
        }

}
class CreateDialog extends React.Component {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		e.preventDefault();
		var newShopList = {};
//		this.props.attributes.forEach(attribute => {
//			newShopList[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
//		});
		newShopList["name"] = ReactDOM.findDOMNode(this.refs["name"]).value.trim();
		newShopList["description"] = ReactDOM.findDOMNode(this.refs["description"]).value.trim();

		this.props.onCreate(newShopList);

		// clear out the dialog's inputs
//		this.props.attributes.forEach(attribute => {
//			ReactDOM.findDOMNode(this.refs[attribute]).value = '';
//		});
       ReactDOM.findDOMNode(this.refs["name"]).value = '';
       ReactDOM.findDOMNode(this.refs["description"]).value = '';


		// Navigate away from the dialog to hide it.
		window.location = "#";
	}

	render() {


		return (
			<div>
				<a href="#createShopList">Create</a>

				<div id="createShopList" className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X</a>

						<h2>Create new ShopList</h2>

						<form>
		                <p key="name">
			            <input type="text" placeholder="name" ref="name" className="field" />
		                </p>
		                <p key="description">
        			    <input type="text" placeholder="description" ref="description" className="field" />
                        </p>
							<button onClick={this.handleSubmit}>Create record</button>
						</form>
					</div>
				</div>
			</div>
		)
	}

}
class ShopLists extends React.Component{
	render() {
		var shopLists = this.props.shopLists.map(shopList =>
			<ShopList key={shopList._links.self.href} shopList={shopList}/>
		);
		return (
			<table>
				<tbody>
					<tr>
						<th>Name</th>
						<th>Description</th>
						<th>Managers</th>
						<th></th>
					</tr>
					{shopLists}
				</tbody>
			</table>
		)
	}
}
class ShopList extends React.Component{
    constructor(props) {
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete() {
        this.props.onDelete(this.props.shopLists);
    }

	render() {
        var mans =  this.props.shopList.managers.map(function(manager){
            return <li>{manager.name}</li>;
        });

		return (
			<tr>
				<td>{this.props.shopList.name}</td>
				<td>{this.props.shopList.description}</td>
				<td><button onClick={this.handleDelete}>Delete</button></td>
				<td><ul>{mans}</ul></td>
          <ul>

          </ul>

			</tr>
		)
	};
}

// end::employee[]

class ManagerList extends React.Component{
    render() {
        var managers = this.props.managers.map(employee =>
            <Manager key={manager._links.self.href} manager={manager}/>
    );
        return (
            <table>
            <tbody>
            <tr>
            <th>First Name</th>
        <th>Last Name</th>
        <th>Description</th>
        </tr>
        {managers}
        </tbody>
        </table>
    )
    }
}

class Employee extends React.Component {

    constructor(props) {
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete() {
        this.props.onDelete(this.props.manager);
    }

    render() {
        return (
			<tr>
				<td>{this.props.manager.name}</td>
				<td>{this.props.manager.description}</td>
				<td>{this.props.manager.description}</td>
				<td>
					<button onClick={this.handleDelete}>Delete</button>
				</td>
			</tr>
        )
    }
}


ReactDOM.render(
	<App />,
    document.getElementById('react')
)

