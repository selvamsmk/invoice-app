import "./index.css";
import { App } from "@invoice-app/app-ui/App";
import { createAppRouter } from "@invoice-app/app-ui/router";
import ReactDOM from "react-dom/client";
import { orpc, queryClient } from "./utils/orpc";

const router = createAppRouter({
	orpc,
	queryClient,
});

const rootElement = document.getElementById("app");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
	<App router={router} queryClient={queryClient} />,
);

if (import.meta.hot) {
	import.meta.hot.accept();
}
