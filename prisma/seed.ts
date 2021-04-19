import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  let generalUse = await prisma.server.upsert({
    where: { id: "356603723470077954" },
    update: {},
    create: {
      id: "356603723470077954",
      name: "General Use"
    }
  })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
