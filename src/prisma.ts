import { PrismaClient } from "./generated/prisma";

let prisma = new PrismaClient({
  log: process.env.NODE_ENV === "production" ? [] : ["query", "info", "warn"]
})

export default prisma
