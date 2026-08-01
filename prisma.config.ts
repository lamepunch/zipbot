import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  datasource: {
    url: env("DIRECT_URL"),
  },
  migrations: {
    seed: "bun ./prisma/seed.ts",
  },
});
