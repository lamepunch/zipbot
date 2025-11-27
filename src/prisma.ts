import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

let prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "production" ? [] : ["query", "info", "warn"]
})

export default prisma
