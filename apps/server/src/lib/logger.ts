import pino from "pino";

const isProduction = process.env.ENV === "production";
const isDesktop = process.env.TARGET === "desktop";
const usePrettyTransport = !isProduction && !isDesktop;

export const logger = pino(
  usePrettyTransport
    ? {
        level: "info",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {
        level: "info",
      },
);