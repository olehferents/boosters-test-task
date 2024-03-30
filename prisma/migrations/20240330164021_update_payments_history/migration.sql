/*
  Warnings:

  - You are about to drop the column `payment_method` on the `user_subscriptions` table. All the data in the column will be lost.
  - Added the required column `payment_method_id` to the `user_subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_subscriptions" DROP COLUMN "payment_method",
ADD COLUMN     "payment_method_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payments_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
