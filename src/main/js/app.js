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
        this.onDelete = this.onDelete.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
    }

    componentDidMount() {
        this.loadFromServer(this.state.pageSize);
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
                links: shopListCollection.entity._links
            });
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

    onUpdate(el, updatedEl) {
        client({
            method: 'PUT',
            path: el._links.self.href,
            entity: updatedEl,
            headers: {
                'Content-Type': 'application/json'
                // ,'If-Match': el.headers.Etag
            }
        }).done(response => {
            this.loadFromServer(this.state.pageSize);
        }, response => {
            if (response.status.code === 412) {
                alert('DENIED: Unable to update ' +
                    el._links.self.href + '. Your copy is stale.');
            }
        });
    }

    onDelete(el) {
        client({method: 'DELETE', path: el._links.self.href}).done(response => {
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
                           onDelete={this.onDelete}
                           onUpdate={this.onUpdate}
                           onNavigate={this.onNavigate}
                           attributes={this.state.attributes}/>
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
                                <input type="text" placeholder="name" ref="name" className="field"/>
                            </p>
                            <p key="description">
                                <input type="text" placeholder="description" ref="description" className="field"/>
                            </p>
                            <button onClick={this.handleSubmit}>Create record</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

}

class UpdateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        var updatedEl = {};
        // this.props.attributes.forEach(attribute => {
        //     updatedEl[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        // });
        updatedEl["name"] = ReactDOM.findDOMNode(this.refs["name"]).value.trim();
        updatedEl["description"] = ReactDOM.findDOMNode(this.refs["description"]).value.trim();
        this.props.onUpdate(this.props.shopList, updatedEl);
        window.location = "#";
    }

    render() {
        var inputs = this.props.attributes.map(attribute =>
            <p key={this.props.shopList[attribute]}>
                <input type="text" placeholder={attribute}
                       defaultValue={this.props.shopList[attribute]}
                       ref={attribute} className="field"/>
            </p>
        );

        var dialogId = "updateShopList-" + this.props.shopList._links.self.href;

        return (
            <div>
                <a href={"#" + dialogId}>Update</a>

                <div id={dialogId} className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Update a ShopList</h2>

                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Update record</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

}
;

class ShopLists extends React.Component {
    render() {
        var shopLists = this.props.shopLists.map(shopList =>
            <ShopList key={shopList._links.self.href}
                      shopList={shopList}
                      onDelete={this.props.onDelete}
                      onUpdate={this.props.onUpdate}
                      attributes={this.props.attributes}/>
        );
        return (
            <table>
                <tbody>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Manager</th>
                    <th>xx</th>
                    <th>yy</th>
                </tr>
                {shopLists}
                </tbody>
            </table>
        )
    }
}
class ShopList extends React.Component {
    constructor(props) {
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete(e) {
        this.props.onDelete(this.props.shopList);
    }

    render() {
        return (
            <tr>
                <td>{this.props.shopList.name}</td>
                <td>{this.props.shopList.description}</td>
                <td>Sztywny Greg</td>
                {/*<td>{this.props.shopList.manager[0].name}</td>*/}
                <td>
                    <UpdateDialog shopList={this.props.shopList}
                                  onUpdate={this.props.onUpdate}
                                  attributes={this.props.attributes}/>
                </td>
                <td>
                    <button onClick={this.handleDelete}>Delete</button>
                </td>
            </tr>
        )
    };
}

// end::employee[]

class Managers extends React.Component {
    render() {
        var managers = this.props.managers.map(employee =>
            <Manager key={manager._links.self.href} manager={manager}/>
        );
        return (
            <table>
                <tbody>
                <tr>
                    <th>First Name</th>
                    <th>Action</th>
                </tr>
                {managers}
                </tbody>
            </table>
        )
    }
}
class Manager extends React.Component {
    constructor(props) {
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete() {
        this.props.onDelete(this.props.manager);
    }

    render() {
        var mans = this.props.shopList.managers.map(function (manager) {
            return <li>{manager.name}</li>;
        });

        return (
            <tr>
                <td>{this.props.manager.name}</td>
                <td>
                    <button onClick={this.handleDelete()}>Delete</button>
                </td>
                <td>
                    <ul>{mans}</ul>
                </td>

            </tr>
        )
    };
}


ReactDOM.render(
    <App />,
    document.getElementById('react')
)

