// Taken from prisma-extension-random
// https://github.com/nkeil/prisma-extension-random

import { Prisma, User } from "../generated/prisma/client.js";

// "User" types are used to simplify type inference

export const $findRandom = async (
  context: Prisma.UserDelegate,
  args?: Prisma.UserFindFirstArgs,
): Promise<any> => {
  const numRows = await context.count({
    where: args?.where,
  });
  return await context.findFirst({
    ...args,
    skip: Math.max(0, Math.floor(Math.random() * numRows)),
  });
};

export const $findManyRandom = async (
  context: Prisma.UserDelegate,
  num: number,
  args?: {
    select?: Prisma.UserFindFirstArgs["select"];
    where?: Prisma.UserFindFirstArgs["where"];
    custom_uniqueKey?: "id";
  },
): Promise<any> => {
  const uniqueKey = args?.custom_uniqueKey ?? "id";

  const rows = [];
  const rowIds: User["id"][] = [];

  const select = args?.select ?? {};
  select[uniqueKey] = true;

  const where = args?.where ?? {};
  where[uniqueKey] = { notIn: rowIds };

  let numRows = await context.count({ where });
  for (let i = 0; i < num && numRows > 0; ++i) {
    const row = await context.findFirst({
      select,
      where,
      skip: Math.max(0, Math.floor(Math.random() * numRows)),
    });

    if (!row) {
      console.error(
        `get random row failed. Where clause: ${JSON.stringify(where)}`,
      );
      break;
    }
    rows.push(row);
    rowIds.push(row[uniqueKey]);
    numRows--;
  }

  return rows;
};

type Args = {};

export default (_extensionArgs?: Args) =>
  Prisma.getExtensionContext({
    name: "prisma-extension-random",
    model: {
      $allModels: {
        async findRandom<T, A>(
          this: T,
          args?: Prisma.Exact<A, Prisma.Args<T, "findFirst">> & object,
        ) {
          const context = Prisma.getExtensionContext(this);

          return (await $findRandom(
            context as any,
            args as any,
          )) as Prisma.Result<T, A, "findFirst">;
        },

        async findManyRandom<T, TWhere, TSelect, TUnique extends string = "id">(
          this: T,
          num: number,
          args?: {
            where?: Prisma.Exact<TWhere, Prisma.Args<T, "findFirst">["where"]>;
            select?: Prisma.Exact<
              TSelect,
              Prisma.Args<T, "findFirst">["select"]
            >;
            custom_uniqueKey?: TUnique; // TODO: add intellisense?
          },
        ) {
          const context = Prisma.getExtensionContext(this);
          type ExtendedSelect = TSelect & Record<TUnique, true>;

          return (await $findManyRandom(
            context as any,
            num,
            args as any,
          )) as Array<
            NonNullable<
              Prisma.Result<
                T,
                { where: TWhere; select: ExtendedSelect },
                "findFirst"
              >
            >
          >;
        },
      },
    },
  });
