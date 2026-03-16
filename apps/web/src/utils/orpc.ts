import { createOrpcClient } from "@invoice-app/app-ui/orpc";

const baseUrl = import.meta.env.VITE_SERVER_URL ?? window.location.origin;

export const { queryClient, client, orpc } = createOrpcClient(baseUrl);
