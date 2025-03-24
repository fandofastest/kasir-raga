#!/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# === Konfigurasi Backup ===
BACKUP_DIR="/home/ubuntu/ragabackup"         # Direktori untuk menyimpan backup lokal
# Gunakan MongoURI untuk konfigurasi MongoDB. Contoh format:
# mongodb://username:password@host:port/database
MONGO_URI="mongodb://admin:Palang66@129.150.60.112:27017/kasirku?authSource=admin"

# Folder Linux yang akan di-backup
FOLDER_TO_BACKUP="/home/ubuntu/kasir-raga/uploads"

# Nama remote rclone (sesuai konfigurasi rclone Anda, misalnya "gdrive")
RCLONE_REMOTE="gdrive:raga"     # "BackupFolder" adalah folder tujuan di Google Drive

# Timestamp untuk penamaan backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# === Membuat direktori backup jika belum ada ===
mkdir -p "${BACKUP_DIR}"

# === Backup Database MongoDB menggunakan MongoURI ===
MONGO_BACKUP_DIR="${BACKUP_DIR}/mongo_backup_${TIMESTAMP}"
mkdir -p "${MONGO_BACKUP_DIR}"

echo "Melakukan backup database MongoDB menggunakan MongoURI..."
mongodump --uri="${MONGO_URI}" --out "${MONGO_BACKUP_DIR}"

# === Backup Folder Linux ===
echo "Melakukan backup folder Linux..."
FOLDER_BACKUP_FILE="${BACKUP_DIR}/folder_backup_${TIMESTAMP}.tar.gz"
tar -czvf "${FOLDER_BACKUP_FILE}" "${FOLDER_TO_BACKUP}"

# === Mengirim Backup ke Google Drive dengan rclone ===
echo "Mengirim backup ke Google Drive..."
rclone copy "${BACKUP_DIR}" "${RCLONE_REMOTE}" --transfers=4 --checkers=8 --verbose

# === Opsi: Hapus Backup Lama (misal lebih dari 7 hari) ===
echo "Menghapus backup lokal yang lama (lebih dari 7 hari)..."
find "${BACKUP_DIR}" -type f -mtime +7 -exec rm {} \;
find "${BACKUP_DIR}" -type d -mtime +7 -exec rm -r {} \;

echo "Backup selesai pada ${TIMESTAMP}"

