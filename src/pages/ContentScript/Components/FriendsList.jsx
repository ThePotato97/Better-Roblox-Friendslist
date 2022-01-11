import React, { Component } from "react";
import "./friendslist.scss";
export class FriendsList extends Component {
  constructor(props) {
    super(props);
    this.props = props;
  }
  render() {
    return (
      <div className="friendsMain">
        <div className="friendlistListContainer">
          <div className="listContentContainer">
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}
