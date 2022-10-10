import prisma from "../src/prisma";

async function main() {
  let servers = await prisma.guild.createMany({
    data: [
      {
        id: "356603723470077954",
        name: "General Use",
      },
      {
        id: "829607606867066911",
        name: "Cranewife",
      },
    ],
  });

  let reactionTypes = await prisma.reactionType.createMany({
    data: [
      {
        id: 1,
        name: "Unzips",
        slug: "unzips",
      },
      {
        id: 2,
        name: "Spinning Pictures of Food",
        slug: "food",
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
