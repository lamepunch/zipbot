import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import randomExtension from "./extensions/random.js";

const { DATABASE_URL, NODE_ENV } = process.env;

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log:
    NODE_ENV === "production" ? ["warn", "error"] : ["query", "info", "warn"],
}).$extends(randomExtension());

export default prisma;
