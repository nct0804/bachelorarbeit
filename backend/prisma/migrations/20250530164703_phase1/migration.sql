/*
  Warnings:

  - You are about to drop the column `image_src` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `audio_src` on the `exercise_options` table. All the data in the column will be lost.
  - You are about to drop the column `image_src` on the `exercise_options` table. All the data in the column will be lost.
  - You are about to drop the column `image_src` on the `vocabulary_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "courses" DROP COLUMN "image_src";

-- AlterTable
ALTER TABLE "exercise_options" DROP COLUMN "audio_src",
DROP COLUMN "image_src";

-- AlterTable
ALTER TABLE "vocabulary_items" DROP COLUMN "image_src";
