/*
  Warnings:

  - You are about to drop the column `difficulty` on the `exercises` table. All the data in the column will be lost.
  - You are about to drop the `vocabulary_exercises` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vocabulary_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "vocabulary_exercises" DROP CONSTRAINT "vocabulary_exercises_exercise_id_fkey";

-- DropForeignKey
ALTER TABLE "vocabulary_exercises" DROP CONSTRAINT "vocabulary_exercises_vocabulary_id_fkey";

-- AlterTable
ALTER TABLE "exercises" DROP COLUMN "difficulty";

-- DropTable
DROP TABLE "vocabulary_exercises";

-- DropTable
DROP TABLE "vocabulary_items";

-- DropEnum
DROP TYPE "ExerciseDifficulty";

-- DropEnum
DROP TYPE "VocabularyCategory";

-- CreateTable
CREATE TABLE "ExerciseProgress" (
    "id" SERIAL NOT NULL,
    "challengeId" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "exerciseId" INTEGER,

    CONSTRAINT "ExerciseProgress_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExerciseProgress" ADD CONSTRAINT "ExerciseProgress_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;
