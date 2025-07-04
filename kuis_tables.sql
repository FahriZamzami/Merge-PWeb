CREATE TABLE IF NOT EXISTS kuis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    praktikum_id INT NOT NULL,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    waktu_mulai DATETIME NOT NULL,
    waktu_selesai DATETIME NOT NULL,
    durasi_menit INT DEFAULT 60,
    status ENUM('aktif', 'tidak_aktif') DEFAULT 'tidak_aktif',
    dibuat_pada DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (praktikum_id) REFERENCES praktikum(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pertanyaan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kuis_id INT NOT NULL,
    pertanyaan TEXT NOT NULL,
    tipe ENUM('pilihan_ganda', 'benar_salah', 'essay') NOT NULL,
    opsi_a VARCHAR(500),
    opsi_b VARCHAR(500),
    opsi_c VARCHAR(500),
    opsi_d VARCHAR(500),
    opsi_e VARCHAR(500),
    jawaban_benar TEXT NOT NULL,
    poin INT DEFAULT 1,
    urutan INT,
    
    FOREIGN KEY (kuis_id) REFERENCES kuis(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jawaban_kuis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kuis_id INT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    waktu_mulai DATETIME DEFAULT CURRENT_TIMESTAMP,
    waktu_selesai DATETIME NULL,
    total_poin FLOAT NULL,
    status VARCHAR(50) DEFAULT 'sedang_berlangsung',
    
    FOREIGN KEY (kuis_id) REFERENCES kuis(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jawaban_pertanyaan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jawaban_kuis_id INT NOT NULL,
    pertanyaan_id INT NOT NULL,
    jawaban_user TEXT,
    poin_didapat FLOAT NULL,
    waktu_jawab DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (jawaban_kuis_id) REFERENCES jawaban_kuis(id) ON DELETE CASCADE,
    FOREIGN KEY (pertanyaan_id) REFERENCES pertanyaan(id) ON DELETE CASCADE
);

CREATE INDEX idx_kuis_praktikum ON kuis(praktikum_id);
CREATE INDEX idx_kuis_status ON kuis(status);
CREATE INDEX idx_pertanyaan_kuis ON pertanyaan(kuis_id);
CREATE INDEX idx_jawaban_kuis_user ON jawaban_kuis(user_id);
CREATE INDEX idx_jawaban_kuis_kuis ON jawaban_kuis(kuis_id);
CREATE INDEX idx_jawaban_pertanyaan_jawaban_kuis ON jawaban_pertanyaan(jawaban_kuis_id);
CREATE INDEX idx_jawaban_pertanyaan_pertanyaan ON jawaban_pertanyaan(pertanyaan_id); 