import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider, createTheme } from "@mui/material";
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

// if (window.location.pathname === "/home") {
//   const style = document.createElement("style");
//   style.innerHTML = `
//   .people-list-container {
//     display: none;
//   }
//   `;
//   document.head.appendChild(style);
// }

const pmsgUrl = chrome.runtime.getURL("pages/WindowCommunication/inject.js");

injectScript(pmsgUrl, "head");

const viewport = document.querySelector("html");

// Create a div to render the <App /> component to.
const container = document.createElement("div");

const shadowRootContainer = container.attachShadow({ mode: "open" });
const emotionRoot = document.createElement("style");

const portalRoot = document.createElement("div");
portalRoot.id = "portal-root";

const shadowRootElement = document.createElement("div");
shadowRootElement.id = "friend-list-container";

shadowRootContainer.appendChild(portalRoot);
shadowRootContainer.appendChild(emotionRoot);
shadowRootContainer.appendChild(shadowRootElement);

const stylesContainer = document.createElement("style");
stylesContainer.id = "friendslist-styles-container";
const styles = [
  "friends.css",
  "friendslist.css",
  "FriendsListItemMenu.css",
  "friendsmain.css",
  "GamePopper.css",
  "menu.css",
];

const loadStyles = (style: string) => {
  return new Promise<void>((resolve, reject) => {
    const link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("href", chrome.runtime.getURL(`styles/${style}`));

    console.log("Loading style", style);

    link.onload = () => {
      console.log("Loaded style", style);
      resolve();
    };
    link.onerror = (error) => {
      reject(error);
    };
    stylesContainer.appendChild(link);
  });
};
if (viewport) viewport.prepend(container);

(async () => {
  console.log("Loading styles");
  shadowRootContainer.appendChild(stylesContainer);
  await Promise.all(styles.map(loadStyles));
  console.log("Styles loaded");

  container.id = "friend-list-container-shadow";

  const body = document.querySelector('body');
  const isDark = true || body?.classList.contains('dark-theme');

  console.log("isDark", isDark);

  const theme = createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
    },
    components: {
      MuiPopover: {
        defaultProps: {
          container: portalRoot,
        },
      },
      MuiPopper: {
        defaultProps: {
          container: portalRoot,
        },
      },
      MuiModal: {
        defaultProps: {
          container: portalRoot,
        },
      },
    },
  });

  const cache = createCache({
    key: "btrfr",
    prepend: true,
    container: emotionRoot,
  });



  const root = createRoot(shadowRootElement);
  root.render(
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </CacheProvider>
  );
  // });
})();
