#!/usr/bin/env bash
# ============================================================
#  Yuzhou Crystal 询价平台 — 数据库与图片备份脚本
#  用法：bash scripts/backup.sh            # 默认备份到 ./backups
#        BACKUP_DIR=/data/backups bash scripts/backup.sh
#  建议加入 crontab：每日 03:15 执行
#    15 3 * * *  cd /opt/yuzhou-inquiry && bash scripts/backup.sh >> /var/log/yuzhou-backup.log 2>&1
# ============================================================
set -euo pipefail

# 项目根目录（脚本位于 <root>/scripts/，取上级）
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="${DATA_DIR:-$ROOT/data}"
UPLOADS_DIR="${UPLOAD_DIR:-$ROOT/uploads}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="$BACKUP_DIR/yuzhou-backup-$STAMP.tar.gz"

# SQLite 在写入时直接打包可能读到半截；先做一次干净快照（需要 sqlite3 CLI）
# 若没有 sqlite3，则直接打包文件（WAL 模式下次启动会自动恢复）。
DB="$DATA_DIR/inquiries.db"
SNAP="$DATA_DIR/.backup-snapshot.db"
if command -v sqlite3 >/dev/null 2>&1 && [ -f "$DB" ]; then
  sqlite3 "$DB" ".backup '$SNAP'"
  DB_SRC="$SNAP"
else
  DB_SRC="$DB"
fi

tar -czf "$ARCHIVE" -C "$ROOT" \
  $( [ -f "$DB_SRC" ] && echo "$(realpath --relative-to="$ROOT" "$DB_SRC")" ) \
  $( [ -d "$UPLOADS_DIR" ] && echo "$(realpath --relative-to="$ROOT" "$UPLOADS_DIR")" ) \
  2>/dev/null || tar -czf "$ARCHIVE" -C "$ROOT" data uploads 2>/dev/null || true

# 清理快照
[ -f "$SNAP" ] && rm -f "$SNAP"

# 仅保留最近 14 天备份
find "$BACKUP_DIR" -name 'yuzhou-backup-*.tar.gz' -mtime +14 -delete 2>/dev/null || true

echo "[$(date '+%F %T')] 备份完成: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

# 可选：同步到对象存储（取消注释并配置 rclone/aws cli）
# rclone copy "$ARCHIVE" remote:yuzhou-backups/  >/dev/null 2>&1 || true
