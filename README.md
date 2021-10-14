<img src="public/icon.png" width="128px" />

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

## How to Use

### Update webpack Configurations

- Open `webpack.config.js`;
- Update configuration field `entry` to determine what to be built;
- Update configuration field `boilerplateConfig.notHotReload` to determine which entries to be excluded from [HMR (Hot Module Replacement)](https://webpack.js.org/concepts/hot-module-replacement/);

### CLI Commands

```shell
# Install dependencies
yarn install

# Start Dev Server
yarn run start

# Start building
yarn run build

# Start building with bundle analyzer
yarn run build:analyzer

# Run type check
yarn run type-check

# Lint all files
yarn run lint

# Lint all files and try to fix issues
yarn run lint:fix

# Lint script files
yarn run eslint

# Lint script and try to fix issues
yarn run eslint:fix

# Lint style files
yarn run stylelint

# Lint style files and try to fix issues
yarn run stylelint:fix

# Run prettier
yarn run prettier

# Run prettier and try to fix issues
yarn run prettier:fix
```

## Notes

### How to Enable HMR

To enable [HMR (Hot Module Replacement)](https://webpack.js.org/concepts/hot-module-replacement/) in your code, append the following code at the end:

```typescript
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* @ts-ignore */
if (module.hot) module.hot.accept();
```

Without this code, it is likely that there will only be *live reload* rather than *HMR*.

### HMR in Chrome Extension Development

In Chrome extension development, some entries **does not** support [HMR (Hot Module Replacement)](https://webpack.js.org/concepts/hot-module-replacement/). Two typical examples are the Content Scripts (which lack the permission to establish a connection with the Dev Server to receive new changes) and the Background script (which is now a service worker under manifest v3 and has no global `document` node that the HMR requires to work).

One possible solution to achieve a similar effect is to inject clients in the Background script and the Content Scripts and set-up a customized middleware in the Dev Server. The client in the Background script establishes a long connection with the Dev Server. When the Dev Server announces a code change in the Background scripts, the client in the Background scripts **reload** the entire extension with `chrome.runtime.reload()`; when the Dev Server announces a code change in the Content Scripts, the client in the Background script communicate with the client in the Content Scripts with `chrome.runtime.sendMessage()`, and the client in the Content Scripts **refresh** the page. This *auto-reload-and-refresh* approach makes the new changes in the code to be applied immediately and eliminates some tiny troubles. However, unlike HMR, which can preserve **state** of the code, this approach will inevitably lose all **state** of the code, which can be unwanted in some cases.

Therefore, currently the boilerplate simply provides a configuration field `boilerplateConfig.notHotReload` to exclude some entries from HMR (located in `webpack.config.js`), in order to enable more flexible manual *reload/refresh* management.

## Credits

- [lxieyang/chrome-extension-boilerplate-react](https://github.com/lxieyang/chrome-extension-boilerplate-react)
