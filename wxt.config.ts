import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  dev: {
    server: {
      port: 3000,
    },
  },
  react: {
    vite: {
      babel: {
        presets: [["jotai/babel/preset"]],
        plugins: [["babel-plugin-react-compiler"]],
      },
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        math: "parens-division",
      },
      scss: {
        api: "modern-compiler", // or "modern", "legacy"
        importers: [
          // ...
        ],
      },
    },
  },
  manifest: () => ({
    name: "Better Roblox Friendslist",
    host_permissions: ["https://*.roblox.com/*"],
    permissions: ["storage"],
    // content_security_policy: {
    //   extension_pages:
    //     "script-src 'self' 'wasm-unsafe-eval' http://localhost:3000 http://localhost:8097; object-src 'self';",
    //   sandbox:
    //     "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000 http://localhost:8097; sandbox allow-scripts allow-forms allow-popups allow-modals; child-src 'self';",
    // },
    web_accessible_resources: [
      {
        resources: import.meta.env.DEV
          ? ["inject-world.js"]
          : ["inject-world.js"],
        matches: ["https://www.roblox.com/*"],
      },
    ],
  }),
});
