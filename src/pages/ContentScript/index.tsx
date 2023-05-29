import React from "react";
import { createRoot } from 'react-dom/client';
import { App } from "./App";
import FriendsListItemMenucss from "bundle-text:./Components/FriendsListItemMenu.scss";
import friendslistcss from "bundle-text:./Components/friendslist.scss";
import friendsmaincss from "./friendsmain.scss";
import friendscss from "bundle-text:/styles/friends.scss";
// if (module.hot) {
//   module.hot.accept()
// }

const injectScript = function (file_path: string, tag: string) {
  const node = document.getElementsByTagName(tag)[0];
  const script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", file_path);
  node.appendChild(script);
};

if (window.location.pathname === "/home") {
  const style = document.createElement("style");
  style.innerHTML = `
  .people-list-container {
    display: none;
  }
  `;
  document.head.appendChild(style);
}

const pmsgUrl = chrome.runtime.getURL("pages/WindowCommunication/inject.js");

injectScript(pmsgUrl, "head");

const viewport = document.querySelector("html");


// Create a div to render the <App /> component to.
const container = document.createElement("div");

const shadowRootContainer = container.attachShadow({ mode: "open" });
const emotionRoot = document.createElement("style");
const shadowRootElement = document.createElement("div");
shadowRootElement.id = "friend-list-container";

shadowRootContainer.appendChild(emotionRoot);
shadowRootContainer.appendChild(shadowRootElement);

const stylesContainer = document.createElement("style");


const styles = ["friends.css", "friendslist.css", "FriendsListItemMenu.css", "friendsmain.css", "GamePopper.css", "menu.css"]

styles.forEach((style) => {
  const link = document.createElement("link");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("href", chrome.runtime.getURL(`styles/${style}`));
  stylesContainer.appendChild(link);
})

shadowRootContainer.appendChild(stylesContainer);

container.id = "friend-list-container-shadow";

if (viewport) viewport.prepend(container);

const root = createRoot(shadowRootElement);
root.render(<App />);

