import { createOrpcClient } from "@invoice-app/app-ui/orpc";

const baseUrl = "http://127.0.0.1:3000";

export const { queryClient, client, orpc } =
  createOrpcClient(baseUrl);
