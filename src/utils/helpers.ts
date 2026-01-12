import { Prisma } from "../generated/prisma/client.js";

export function formatError(error: unknown) {
  // Improve error formatting when dealing with Prisma errors
  return error instanceof Prisma.PrismaClientKnownRequestError
    ? { ...error }
    : error;
}
