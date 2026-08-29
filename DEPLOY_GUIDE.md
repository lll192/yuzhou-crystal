# Yuzhou Crystal 询单网站 · 从零到生产部署清单

> 适用前提：**主要海外客户（免 ICP 备案）** + **轻量云服务器 / VPS + Docker**。
> 目标：把当前"沙箱演示"变成**真实客户可用**的询单网站——稳定在线、自有域名、邮件实时通知、后台账号安全、有备份与监控。

---

## 0. 成本估算（海外、低询单量 B2B）

| 项目 | 推荐 | 月/年费用 |
|------|------|-----------|
| 域名 | Namecheap / Porkbun / Cloudflare Registrar | ~$10/年 |
| VPS | Hetzner CPX11、Vultr $5、DigitalOcean $6、Lightsail $3.5（选离客户近的节点：US/DE/FI/JP） | $4–6/月 |
| Cloudflare | 免费版（DNS + TLS + WAF + 限速 + 反爬） | $0 |
| 邮件 | Resend 免费层 3000/月 / SendGrid 免费 100/天 | $0 起 |
| 图片存储 | 起步本地+备份即可；要更稳用 Cloudflare R2 / Backblaze B2（免费额度） | $0 起 |
| **合计** | | **约 $8–15/月** |

---

## 阶段一：买域名（境外注册商，免备案）

1. 在 Namecheap / Porkbun 搜 `yuzhoucrystal.com`（或你心仪的域名）并购买。
2. **不要**在国内注册商买（否则需 ICP 备案，且面向海外访问慢）。
3. 记下注册商的 **Nameserver** 设置入口，下一步交给 Cloudflare。

## 阶段二：租 VPS + 初始化

1. 租一台海外 VPS（1 vCPU / 1–2 GB RAM 足够，SQLite 低量够用）。
2. SSH 登录，做基础加固：
   ```bash
   # 创建非 root 用户、禁用密码登录前先确保密钥可用
   adduser deploy && usermod -aG sudo deploy
   # 用 ssh-keygen 把你的公钥放到 ~/.ssh/authorized_keys
   # 改 sshd 端口、禁用 root 密码登录（可选但推荐）
   ```
3. 安装 Docker + Compose：
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker deploy
   ```

## 阶段三：部署应用（Docker）

1. 把代码传上去（推荐 `git clone` 你的仓库；或 `scp` 整个目录，**排除** `node_modules`/`data`/`uploads`）。
2. 在项目根目录创建生产 `.env`（参考 `.env.production.example`）：
   ```bash
   cp .env.production.example .env
   # 编辑 .env：设置 ADMIN_CREDENTIALS、SESSION_SECRET、SMTP_*、PUBLIC_URL
   ```
3. 启动：
   ```bash
   docker compose up -d --build
   docker compose ps        # 应看到 yuzhou-inquiry 状态 Up
   curl http://localhost:3000/api/health   # 期望 {"ok":true,...}
   ```
   > 数据持久化：`docker-compose.yml` 已把 `./data` 和 `./uploads` 映射为卷，重启不丢数据。

## 阶段四：域名 + HTTPS + 安全防护（Cloudflare）

1. 在 Cloudflare 添加你的域名 → 按提示把域名的 Nameserver 改成 Cloudflare 的。
2. DNS 记录：`A` 记录 `@` 和 `www` 指向你的 VPS 公网 IP。
3. **开启代理（橙色云图标）**：Cloudflare 自动签发 HTTPS 证书。
   - SSL/TLS 模式：`Full (Strict)`，并在 Cloudflare 里为源站生成 **Origin Certificate** 部署到服务器（或用 `Flexible` 起步也行）。
4. 安全加固（Cloudflare 免费版即可）：
   - **SSL/TLS → Edge Certificates**：强制 HTTPS 重定向（Always Use HTTPS）。
   - **Security → WAF → Managed Rules**：开启托管规则集（免费）。
   - **Security → Bots**：开启 Bot Fight Mode。
   - **Security → WAF → Rate Limiting**：对 `/api/inquiries`、`/api/custom-requests`、`/api/admin/login` 设登录/提交速率限制。
5. **只允许 Cloudflare 回源访问 3000 端口**（强烈推荐）：在 VPS 防火墙（ufw）只放行 22/80/443，并用 Cloudflare 的[官方 IP 段](https://www.cloudflare.com/ips/)限制 3000；或用 **Cloudflare Tunnel** 彻底不暴露 3000。

## 阶段五：邮件通知（真实可用的关键）

1. 注册 Resend → 添加并验证你的域名 → 拿到 SMTP 凭据。
2. 填入 `.env`：`SMTP_HOST=smtp.resend.com`、`SMTP_PORT=465`、`SMTP_SECURE=true`、`SMTP_USER/SMTP_PASS`、`SMTP_FROM`、`SALES_NOTIFY_EMAIL`。
3. 重启 `docker compose up -d` → 提交一次测试询单，确认业务员邮箱收到中文通知邮件。
   > 没配 SMTP 也不会丢数据：询单照常入库、后台照常可看，只是不邮件通知。

## 阶段六：后台安全（已从演示 token 升级为真实账号）

- 代码已支持：账号 + scrypt 哈希口令 + 签名会话 Cookie（`HttpOnly;Secure;SameSite=Strict`，8 小时过期）。
- 在 `.env` 配置：`ADMIN_CREDENTIALS=admin:强密码[,其他:密码]`。
- 登录地址：`https://你的域名/admin`（若走本沙箱演示：原预览地址 `#admin`）。
- 演示账号（仅沙箱，生产请改）：`admin` / `YzCrystal@2026Admin`。
- 进阶（可选）：加 TOTP 二次验证、按角色分权限（销售/设计）。

## 阶段七：反垃圾

- 表单已有限速；再叠加 Cloudflare Turnstile（免费、比 reCAPTCHA 体验好）放到提交按钮前。
- 后端可加**蜜罐字段**（隐藏 input，机器人填了就拒收）——已在规划，可后续补。

## 阶段八：数据持久与备份

- 每日备份：把 `scripts/backup.sh` 加入 crontab（脚本会打包 SQLite + uploads，保留 14 天）：
  ```bash
  15 3 * * *  cd /opt/yuzhou-inquiry && bash scripts/backup.sh >> /var/log/yuzhou-backup.log 2>&1
  ```
- 可选：备份同步到对象存储（脚本末尾有 rclone/aws 示例，取消注释即可）。
- 当询单量上到几千/月，再把 SQLite 平滑迁移到 **PostgreSQL**（代码层 store 已隔离，改 `src/store.js` 即可）。

## 阶段九：监控 + 合规上线

- **监控**：UptimeRobot 免费版监控 `https://你的域名/api/health`，掉线发邮件/钉钉。
- **合规**：加隐私政策与条款页（前端 `index.html` 底部加链接）；询单提交成功页/自动回复客户邮件。
- **上线检查清单**：见文末。

---

## 关键命令速查

```bash
# 部署 / 更新
docker compose up -d --build
docker compose logs -f          # 看日志
docker compose restart
docker compose down

# 进入容器排错
docker compose exec web sh

# 手动备份
bash scripts/backup.sh

# 查看数据库（需 sqlite3）
sqlite3 data/inquiries.db "SELECT id,type,name,company,status FROM submissions ORDER BY id DESC LIMIT 20;"
```

## 上线前检查清单

- [ ] 自有域名已解析到 Cloudflare，代理开启，HTTPS 强制重定向
- [ ] 仅 Cloudflare 回源 IP 能访问 3000（或用了 Cloudflare Tunnel）
- [ ] Cloudflare WAF / Bot / Rate Limiting 已开
- [ ] `.env` 中 `ADMIN_CREDENTIALS`、`SESSION_SECRET` 已设为你自己的强值（**非演示值**）
- [ ] SMTP 已配，测试询单能收到通知邮件
- [ ] `scripts/backup.sh` 已加入 crontab 且手动跑通
- [ ] UptimeRobot 监控 `/api/health` 已建
- [ ] 隐私政策/条款页已加
- [ ] 后台用账号密码（非演示 token）登录验证通过
```
