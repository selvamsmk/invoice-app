import { Elysia } from "elysia";
import { logger } from "../lib/logger";

export const requestLogger = new Elysia({ name: "request-logger" })

  // define store types
  .state({
    start: 0
  })

  .onRequest(({ request, store }) => {
    store.start = performance.now();

    const url = new URL(request.url);

    logger.info(
      {
        method: request.method,
        path: url.pathname
      },
      "Incoming request"
    );
  })

  .onAfterHandle(({ request, set, store }) => {
    const url = new URL(request.url);
    const duration = performance.now() - store.start;

    logger.info(
      {
        method: request.method,
        path: url.pathname,
        status: set.status ?? 200,
        duration: `${duration.toFixed(2)}ms`
      },
      "Request completed"
    );
  })

  .onError(({ error, request }) => {
    const url = new URL(request.url);

    logger.error(
      {
        method: request.method,
        path: url.pathname,
        error: error instanceof Error ? error.message : String(error)
      },
      "Request error"
    );
  });