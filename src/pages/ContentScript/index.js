import React from "react";
import { createRoot } from "react-dom";
import { App } from "./App";

const injectScript = function (file_path, tag) {
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
const app = document.createElement("div");

app.id = "root";

if (viewport) viewport.prepend(app);

const root = createRoot(app);
root.render(<App />);

