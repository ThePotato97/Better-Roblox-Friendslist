import ReactDOM from "react-dom/client";
import React from "react";
import createCache from "@emotion/cache";
import { CacheProvider, ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material";
import { FriendList } from "@/src/ContentScript/App";
import App from "../stuff/App";

import "@/styles/friendslist.scss";
import "@/styles/GamePopper.scss";
import "@/styles/friends.scss";
// import "../entrypoints/stuff/style.css";
// import "../entrypoints/stuff/styles/GamePopper.scss";
// import "../entrypoints/stuff/styles/friends.scss";

// 1. Import the style
// import './style.css';

// injects the iframe into the page
export default defineContentScript({
  matches: ["https://www.roblox.com/*"],
  cssInjectionMode: "ui",
  async main(ctx) {
    await injectScript("/inject-world.js");
    const ui = await createShadowRootUi(ctx, {
      name: "friends-list-shadow-root",
      position: "overlay",
      alignment: "bottom-right",
      anchor: "body",
      onMount: (container) => {
        const shadowApp = document.createElement("div");
        const portalRoot = document.createElement("div");
        const emotionRoot = document.createElement("style");
        portalRoot.id = "portal-root";
        portalRoot.style.position = "fixed";
        portalRoot.style.top = "0";
        portalRoot.style.left = "0";
        portalRoot.style.width = "100vw";
        portalRoot.style.height = "100vh";
        portalRoot.style.zIndex = "9999";
        portalRoot.style.pointerEvents = "none";
        const interactiveLayer = document.createElement("div");
        interactiveLayer.id = "interactive-layer";
        interactiveLayer.style.pointerEvents = "auto";
        portalRoot.appendChild(interactiveLayer);
        window.interactiveLayer = interactiveLayer;
        window.portalRoot = portalRoot;
        container.appendChild(portalRoot);
        container.appendChild(emotionRoot);
        container.appendChild(shadowApp);
        const theme = createTheme({
          palette: { mode: "dark" },
          components: {
            MuiPopover: { defaultProps: { container: interactiveLayer } },
            MuiPopper: { defaultProps: { container: interactiveLayer } },
            MuiModal: { defaultProps: { container: interactiveLayer } },
          },
        });
        const cache = createCache({
          key: "mykey",
          prepend: true,
          container: emotionRoot,
        });
        const root = ReactDOM.createRoot(shadowApp);
        root.render(
          <CacheProvider value={cache}>
            <ThemeProvider theme={theme}>
              <App />
            </ThemeProvider>
          </CacheProvider>,
        );
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });
    ui.mount();
  },

  // main(ctx) {
  //   // Define the UI
  //   const ui = createIframeUi(ctx, {
  //     page: "/iframe.html",
  //     position: "overlay",
  //     alignment: "bottom-right",
  //     anchor: "body",
  //     onMount: (wrapper, iframe) => {
  //       // Add styles to the iframe like width
  //       iframe.width = "400px";
  //       iframe.height = "800px";

  //       // make the iframe blend in with the page
  //       iframe.style.backgroundColor = "transparent";
  //       iframe.style.border = "none";
  //       // make the wrapper div fill the viewport
  //       wrapper.style.width = "100%";
  //       wrapper.style.height = "100%";
  //       wrapper.style.position = "fixed";
  //       wrapper.style.top = "0";
  //       wrapper.style.left = "0";
  //       wrapper.style.right = "0";
  //       wrapper.style.bottom = "0";
  //       wrapper.style.zIndex = "99999";

  //       iframe.style.pointerEvents = "auto";
  //       wrapper.style.pointerEvents = "none";
  //     },
  //   });

  //   // Show UI to user
  //   ui.mount();
  // },
});
