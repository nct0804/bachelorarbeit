/*
  Warnings:

  - You are about to drop the column `challengeId` on the `ExerciseProgress` table. All the data in the column will be lost.
  - You are about to drop the column `explanation` on the `exercise_options` table. All the data in the column will be lost.
  - Added the required column `image_src` to the `courses` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SoundType" AS ENUM ('VOWEL', 'CONSONANT', 'DIPHTHONG', 'UMLAUT');

-- AlterEnum
ALTER TYPE "ExerciseType" ADD VALUE 'PRONUNCIATION_PRACTICE';

-- AlterTable
ALTER TABLE "ExerciseProgress" DROP COLUMN "challengeId";

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "image_src" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "exercise_options" DROP COLUMN "explanation",
ADD COLUMN     "audio_src" TEXT,
ADD COLUMN     "image_src" TEXT;

-- CreateTable
CREATE TABLE "german_sounds" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "exampleWord" TEXT NOT NULL,
    "audio_src" TEXT NOT NULL,
    "type" "SoundType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "german_sounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sound_groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sound_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sound_group_sounds" (
    "id" SERIAL NOT NULL,
    "sound_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,

    CONSTRAINT "sound_group_sounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sound_group_sounds_sound_id_group_id_key" ON "sound_group_sounds"("sound_id", "group_id");

-- AddForeignKey
ALTER TABLE "sound_group_sounds" ADD CONSTRAINT "sound_group_sounds_sound_id_fkey" FOREIGN KEY ("sound_id") REFERENCES "german_sounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sound_group_sounds" ADD CONSTRAINT "sound_group_sounds_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "sound_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
