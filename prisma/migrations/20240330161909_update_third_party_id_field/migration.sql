/*
  Warnings:

  - A unique constraint covering the columns `[third_party_id]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `third_party_id` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "third_party_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_third_party_id_key" ON "subscriptions"("third_party_id");
