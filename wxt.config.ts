import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
	extensionApi: "chrome",
	modules: ["@wxt-dev/module-react"],
	react: {
		vite: {
			babel: {
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
	manifest: {
		host_permissions: ["https://www.roblox.com/*"],
		permissions: ["storage"],
		web_accessible_resources: [
			{
				resources: ["iframe.html", "inject-world.js"],
				matches: ["https://www.roblox.com/*"],
			},
		],
	},
});
