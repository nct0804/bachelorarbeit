/*
  Warnings:

  - You are about to drop the `user_social_accounts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_social_accounts" DROP CONSTRAINT "user_social_accounts_userId_fkey";

-- DropTable
DROP TABLE "user_social_accounts";
