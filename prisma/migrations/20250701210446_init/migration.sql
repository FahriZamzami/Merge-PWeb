/*
  Warnings:

  - A unique constraint covering the columns `[file_path]` on the table `modul` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `modul_file_path_key` ON `modul`(`file_path`);
