/*
  Warnings:

  - Added the required column `title` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `event` ADD COLUMN `title` VARCHAR(191) NOT NULL,
    MODIFY `eventType` VARCHAR(191) NULL;
