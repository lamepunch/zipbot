-- CreateEnum
CREATE TYPE "ObjectType" AS ENUM ('IMAGE', 'WORD', 'COMMAND');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN "objectType" "ObjectType" NOT NULL DEFAULT 'IMAGE';

-- DropIndex
DROP INDEX "Category_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_objectType_key" ON "Category"("name", "objectType");

-- AlterTable
ALTER TABLE "Word" ADD COLUMN "categoryId" INTEGER;

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
