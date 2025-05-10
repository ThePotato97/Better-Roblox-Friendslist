import eslintPluginUnicorn from "eslint-plugin-unicorn";
import { includeIgnoreFile } from "@eslint/compat";
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");


export default tseslint.config(
	includeIgnoreFile(gitignorePath),
	eslintPluginPrettier,
	tseslint.configs.recommended,
	// tseslint.configs.recommendedTypeChecked,
	// tseslint.configs.stylisticTypeChecked,
	//react.configs.recommended,
	{
		plugins: {
			"unicorn": eslintPluginUnicorn,

		},
		languageOptions: {
			globals: globals.builtin,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			"unicorn/better-regex": "error",

		},
	},
);
