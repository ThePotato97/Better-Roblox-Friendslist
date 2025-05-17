import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactCompiler from "eslint-plugin-react-compiler";
import prettier from "eslint-plugin-prettier";
import globals from "globals";

export default tseslint.config(
	// 1. Base TypeScript rules
	tseslint.configs.recommended,

	// 2. React & JSX
	{
		plugins: {
			react,
			"react-hooks": reactHooks,
			"react-compiler": reactCompiler,
		},
		languageOptions: {
			parserOptions: {
				ecmaFeatures: { jsx: true },
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		settings: {
			react: {
				version: "detect",
			},
		},
		rules: {
			// React
			"react/react-in-jsx-scope": "off", // React 17+
			"react/jsx-uses-react": "off",     // React 17+
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",
		},
	},

	// 3. Prettier integration (optional)
	{
		plugins: { prettier },
		rules: {
			"prettier/prettier": "warn",
		},
	},

	// 4. Custom tweaks
	{
		rules: {
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/no-unused-vars": ["warn", {
				varsIgnorePattern: '^_',
				argsIgnorePattern: '^_',
				ignoreRestSiblings: true
			}],
			"@typescript-eslint/no-explicit-any": "warn",
		},
	}
);
