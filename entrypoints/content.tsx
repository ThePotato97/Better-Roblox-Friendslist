// 1. Import the style
// import './style.css';

// injects the iframe into the page
export default defineContentScript({
  matches: ["https://www.roblox.com/*"],

  main(ctx) {
    // // Define the UI
    // const ui = createIframeUi(ctx, {
    //   page: "/iframe.html",
    //   position: "overlay",
    //   alignment: "bottom-right",
    //   anchor: "body",
    //   onMount: (wrapper, iframe) => {
    //     // Add styles to the iframe like width
    //     iframe.width = "400px";
    //     iframe.height = "400px";
    //     // make the iframe blend in with the page
    //     iframe.style.backgroundColor = "transparent";
    //     iframe.style.border = "none";
    //     // make the wrapper div fill the viewport
    //     wrapper.style.width = "100%";
    //     wrapper.style.height = "100%";
    //     wrapper.style.position = "fixed";
    //     wrapper.style.top = "0";
    //     wrapper.style.left = "0";
    //     wrapper.style.right = "0";
    //     wrapper.style.bottom = "0";
    //     wrapper.style.zIndex = "99999";
    //     iframe.style.pointerEvents = "auto";
    //     wrapper.style.pointerEvents = "none";
    //   },
    // });
    // // Show UI to user
    // ui.mount();
  },
});
