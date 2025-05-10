import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { createTheme } from "@mui/material";
import createCache from "@emotion/cache";

import "./style.css";
import "./styles/friends.scss";
// import "./styles/friendslist.scss";
// import "./styles/GamePopper.scss";
// import "./styles/menu.scss";
import { CacheProvider, ThemeProvider } from "@emotion/react";

const emotionCache = createCache({
	key: "wxt",
	prepend: true,
	container: document.head,
});

const theme = createTheme({
	palette: {
		mode: "dark", // or "light"
	},
	components: {
		MuiPopover: {
			defaultProps: {
				container: document.body,
			},
		},
		MuiPopper: {
			defaultProps: {
				container: document.body,
			},
		},
		MuiModal: {
			defaultProps: {
				container: document.body,
			},
		},
	},
});

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<CacheProvider value={emotionCache}>
			<ThemeProvider theme={theme}>
				<App />
			</ThemeProvider>
		</CacheProvider>
	</React.StrictMode>,
);
