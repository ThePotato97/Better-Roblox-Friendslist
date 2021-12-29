import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';

const injectScript = function (file_path, tag) {
  const node = document.getElementsByTagName(tag)[0];
  const script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', file_path);
  node.appendChild(script);
};

const pmsgUrl = chrome.extension.getURL('WindowCommunication.bundle.js');
injectScript(pmsgUrl, 'head');

setTimeout(() => {
  window.postMessage({ foo: 'bar', text: "Hello from content script!" }, "*");
}, 50);
// Get the element to prepend our app to. This could be any element on a specific website or even just `document.body`.
const viewport = document.querySelector("html");

// Create a div to render the <App /> component to.
const app = document.createElement('div');

app.id = 'root';

if (viewport) viewport.prepend(app);

// Render the <App /> component.
ReactDOM.render(<App />, document.getElementById('root'));

console.log(app);
