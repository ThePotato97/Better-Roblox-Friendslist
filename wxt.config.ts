import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
    manifest: {
    web_accessible_resources: [
      {
        resources: ['iframe.html'],
        matches: ['https://*/*'],
      },
    ],
  },
});
