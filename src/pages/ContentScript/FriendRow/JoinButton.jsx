import React, { Component } from "react";

export class JoinButton extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.handleJoinGame = this.handleJoinGame.bind(this);
  }

  handleJoinGame() {
    if (this.props.purchaseRequired) {
      window.location = `https://www.roblox.com/games/${placeId}`;
    }
    const content = {
      action: "joinGame",
      placeId: this.props.placeId,
      gameId: this.props.gameId,
      userId: this.props.userId,
    };
    const event = new CustomEvent("RecieveContent", { detail: content });
    window.dispatchEvent(event);
  }

  render() {
    const { purchaseRequired, currentStatus, placePrice } = this.props;
    let placePriceDisplay = placePrice || 0;
    return (
      <div id="joinButton" className="joinButtonContainer">
        <button type="button" className={`joinButton ${currentStatus}`} onClick={this.handleJoinGame}>
          <span>
            {purchaseRequired ? <span className="icon icon-robux-white-16x16" /> : null}
            {purchaseRequired ? placePriceDisplay : "Join"}
          </span>
        </button>
      </div>
    );
  }
}
