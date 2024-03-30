/*
  Warnings:

  - Added the required column `end_at` to the `user_subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_subscriptions" ADD COLUMN     "end_at" TIMESTAMP(3) NOT NULL;
