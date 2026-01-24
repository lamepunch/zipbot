import pino from "pino";

let config =
  process.env.NODE_ENV == "development"
    ? { level: "debug", transport: { target: "pino-pretty" } }
    : {};

let logger = pino({ ...config });

export default logger;
