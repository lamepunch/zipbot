import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import randomExtension from "./extensions/random.js";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

let prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "production" ? [] : ["query", "info", "warn"],
}).$extends(randomExtension());

export default prisma;
