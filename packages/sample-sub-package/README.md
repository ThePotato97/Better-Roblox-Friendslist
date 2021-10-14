<img src="public/icon.png" width="128px" />

# Webpack Boilerplate NPM

A good starting point for using webpack to build npm packages.

## Features

- Webpack 5
- React 17
- TypeScript support
- Less support
- Lint codes with [ESLint](https://www.npmjs.com/package/eslint) + [stylelint](https://www.npmjs.com/package/stylelint) + [Prettier](https://www.npmjs.com/package/prettier)
- Lint commit messages with [commitlint](https://www.npmjs.com/package/@commitlint/cli)
- Automated pre-commit code check with [husky](https://www.npmjs.com/package/husky) + [lint-staged](https://www.npmjs.com/package/lint-staged)

## How to Use

### Update webpack Configurations

- Open `webpack.config.js`;
- Update configuration field `entry` to determine what to be built;

### CLI Commands

```shell
# Install dependencies
yarn install

# Start webpack with watch mode
yarn run start

# Start building
yarn run build

# Publish package
yarn publish

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

## Credits

- [How to Build and Publish NPM packages with Webpack](https://itnext.io/how-to-build-and-publish-npm-packages-with-webpack-dea19bb14627)
