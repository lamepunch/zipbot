import prisma from "../src/prisma";

async function main() {
  let generalUse = await prisma.guild.upsert({
    where: { id: "356603723470077954" },
    update: {},
    create: {
      id: "356603723470077954",
      name: "General Use",
    },
  });

  let craneWife = await prisma.guild.upsert({
    where: { id: "829607606867066911" },
    update: {},
    create: {
      id: "829607606867066911",
      name: "Cranewife",
    },
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
