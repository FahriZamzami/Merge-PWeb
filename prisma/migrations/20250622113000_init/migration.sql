-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `kata_sandi` VARCHAR(191) NOT NULL,
    `peran` ENUM('admin', 'mahasiswa', 'asisten') NOT NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_lab` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asistenLab` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `lab_id` INTEGER NOT NULL,

    UNIQUE INDEX `asistenLab_user_id_lab_id_key`(`user_id`, `lab_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `praktikum` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_praktikum` VARCHAR(191) NOT NULL,
    `kode_masuk` VARCHAR(191) NOT NULL,
    `lab_id` INTEGER NOT NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `praktikum_kode_masuk_key`(`kode_masuk`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mahasiswa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `praktikum_id` INTEGER NOT NULL,
    `waktu_daftar` DATETIME(3) NULL,

    UNIQUE INDEX `mahasiswa_user_id_praktikum_id_key`(`user_id`, `praktikum_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jadwal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `praktikum_id` INTEGER NOT NULL,
    `tanggal` DATETIME(3) NOT NULL,
    `jam` DATETIME(3) NOT NULL,
    `ruangan` VARCHAR(191) NULL,
    `materi` VARCHAR(191) NULL,
    `nama_pengajar` VARCHAR(191) NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('Selesai', 'Belum_Mulai') NOT NULL DEFAULT 'Belum_Mulai',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modul` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `praktikum_id` INTEGER NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `file_path` VARCHAR(191) NOT NULL,
    `diunggah_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tugas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `praktikum_id` INTEGER NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NULL,
    `fileTugas` VARCHAR(191) NULL,
    `batas_waktu` DATETIME(3) NOT NULL,
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('open', 'close') NOT NULL DEFAULT 'open',
    `tutup_penugasan` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengumpulan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tugas_id` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `file_path` VARCHAR(191) NULL,
    `waktu_kirim` DATETIME(3) NULL,
    `nilai` DOUBLE NULL,
    `catatan` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengumuman` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `praktikum_id` INTEGER NOT NULL,
    `isi` VARCHAR(191) NOT NULL,
    `dibuat_oleh` VARCHAR(191) NOT NULL,
    `dibuat_pada` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `absensi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `jadwal_id` INTEGER NOT NULL,
    `status` ENUM('Hadir', 'Tidak_Hadir') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kuis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `praktikum_id` INTEGER NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `deskripsi` VARCHAR(191) NULL,
    `waktu_mulai` DATETIME(3) NOT NULL,
    `waktu_selesai` DATETIME(3) NOT NULL,
    `durasi_menit` INTEGER NOT NULL DEFAULT 60,
    `status` ENUM('aktif', 'tidak_aktif') NOT NULL DEFAULT 'tidak_aktif',
    `dibuat_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pertanyaan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kuis_id` INTEGER NOT NULL,
    `pertanyaan` VARCHAR(191) NOT NULL,
    `tipe` ENUM('pilihan_ganda', 'benar_salah', 'essay') NOT NULL,
    `opsi_a` VARCHAR(191) NULL,
    `opsi_b` VARCHAR(191) NULL,
    `opsi_c` VARCHAR(191) NULL,
    `opsi_d` VARCHAR(191) NULL,
    `opsi_e` VARCHAR(191) NULL,
    `jawaban_benar` VARCHAR(191) NOT NULL,
    `poin` INTEGER NOT NULL DEFAULT 1,
    `urutan` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jawabanKuis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kuis_id` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `waktu_mulai` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `waktu_selesai` DATETIME(3) NULL,
    `total_poin` DOUBLE NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'sedang_berlangsung',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jawabanPertanyaan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jawaban_kuis_id` INTEGER NOT NULL,
    `pertanyaan_id` INTEGER NOT NULL,
    `jawaban_user` VARCHAR(191) NULL,
    `poin_didapat` DOUBLE NULL,
    `waktu_jawab` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `asistenLab` ADD CONSTRAINT `asistenLab_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asistenLab` ADD CONSTRAINT `asistenLab_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `lab`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `praktikum` ADD CONSTRAINT `praktikum_lab_id_fkey` FOREIGN KEY (`lab_id`) REFERENCES `lab`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mahasiswa` ADD CONSTRAINT `mahasiswa_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mahasiswa` ADD CONSTRAINT `mahasiswa_praktikum_id_fkey` FOREIGN KEY (`praktikum_id`) REFERENCES `praktikum`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jadwal` ADD CONSTRAINT `jadwal_praktikum_id_fkey` FOREIGN KEY (`praktikum_id`) REFERENCES `praktikum`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `modul` ADD CONSTRAINT `modul_praktikum_id_fkey` FOREIGN KEY (`praktikum_id`) REFERENCES `praktikum`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tugas` ADD CONSTRAINT `tugas_praktikum_id_fkey` FOREIGN KEY (`praktikum_id`) REFERENCES `praktikum`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengumpulan` ADD CONSTRAINT `pengumpulan_tugas_id_fkey` FOREIGN KEY (`tugas_id`) REFERENCES `tugas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengumpulan` ADD CONSTRAINT `pengumpulan_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengumuman` ADD CONSTRAINT `pengumuman_praktikum_id_fkey` FOREIGN KEY (`praktikum_id`) REFERENCES `praktikum`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengumuman` ADD CONSTRAINT `pengumuman_dibuat_oleh_fkey` FOREIGN KEY (`dibuat_oleh`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `absensi` ADD CONSTRAINT `absensi_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `absensi` ADD CONSTRAINT `absensi_jadwal_id_fkey` FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kuis` ADD CONSTRAINT `kuis_praktikum_id_fkey` FOREIGN KEY (`praktikum_id`) REFERENCES `praktikum`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pertanyaan` ADD CONSTRAINT `pertanyaan_kuis_id_fkey` FOREIGN KEY (`kuis_id`) REFERENCES `kuis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jawabanKuis` ADD CONSTRAINT `jawabanKuis_kuis_id_fkey` FOREIGN KEY (`kuis_id`) REFERENCES `kuis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jawabanKuis` ADD CONSTRAINT `jawabanKuis_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jawabanPertanyaan` ADD CONSTRAINT `jawabanPertanyaan_jawaban_kuis_id_fkey` FOREIGN KEY (`jawaban_kuis_id`) REFERENCES `jawabanKuis`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jawabanPertanyaan` ADD CONSTRAINT `jawabanPertanyaan_pertanyaan_id_fkey` FOREIGN KEY (`pertanyaan_id`) REFERENCES `pertanyaan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
