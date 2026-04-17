-- AlterTable
ALTER TABLE "Dataset" ADD COLUMN     "evaluationCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "careerLevel" TEXT,
ADD COLUMN     "imagingFamiliarity" TEXT,
ADD COLUMN     "primaryBackground" TEXT;
