<img src="public/icon.png" style="zoom:25%;" />

# Webpack Boilerplate

A good starting point for using webpack to build stuffs.

## Features

- Webpack 5
- React 17
- TypeScript support
- Less support
- Lint codes with [ESLint](https://www.npmjs.com/package/eslint) + [stylelint](https://www.npmjs.com/package/stylelint) + [Prettier](https://www.npmjs.com/package/prettier)
- Lint commit messages with [commitlint](https://www.npmjs.com/package/@commitlint/cli)
- Automated pre-commit code check with [husky](https://www.npmjs.com/package/husky) + [lint-staged](https://www.npmjs.com/package/lint-staged)
- Chrome extension support (comes with a manifest v3 template)

## Notes

### HMR in Chrome Extension Development

In Chrome extension development, some entries **does not** support [HMR (Hot Module Replacement)](https://webpack.js.org/concepts/hot-module-replacement/). Two typical examples are the Content Scripts (which lack the permission to establish a connection with the Dev Server to receive new changes) and the Background script (which is now a service worker under manifest v3 and has no global `document` node that the HMR requires to work).

One possible solution to achieve a similar effect is to inject clients in the Background script and the Content Scripts and set-up a customized middleware in the Dev Server. The client in the Background script establishes a long connection with the Dev Server. When the Dev Server announces a code change in the Background scripts, the client in the Background scripts **reload** the entire extension with `chrome.runtime.reload()`; when the Dev Server announces a code change in the Content Scripts, the client in the Background script communicate with the client in the Content Scripts with `chrome.runtime.sendMessage()`, and the client in the Content Scripts **refresh** the page. This *auto-reload-and-refresh* approach makes the new changes in code to be applied immediately and eliminates some tiny troubles. However, unlike HMR, which can preserve **state** of the code, this approach will inevitably lose all **state** of the code, which can be unwanted in some cases.

Therefore,  currently the boilerplate simply provides a configuration field `boilerplateConfig.notHotReload` to exclude some entries from HMR (located in `webpack.config.js`), in order to enable more flexible manual *reload/refresh* management.

## Credits

- [lxieyang/chrome-extension-boilerplate-react](https://github.com/lxieyang/chrome-extension-boilerplate-react)

