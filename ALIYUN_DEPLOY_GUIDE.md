# 阿里云海外 + 轻量应用服务器 + Cloudflare 部署操作指南

> 目标：把询单平台部署到 **阿里云海外（香港/新加坡）轻量应用服务器**，用 **Cloudflare** 做域名/HTTPS/安全，
> 新站放在子域名 **`inquiry.crystalwto.com`**，旧站 `www.crystalwto.com/crystalwto/` 原样保留。
> 读者：不熟悉运维的公司业务员/老板，按步骤抄即可。

---

## 0. 架构一览

```
外商浏览器
   │  https://inquiry.crystalwto.com
   ▼
Cloudflare（HTTPS 证书 + 全球加速 + WAF/防爬/限速）
   │  Cloudflare Tunnel（加密隧道，出站连接，不暴露任何端口）
   ▼
阿里云轻量应用服务器（香港/新加坡）
   ├─ cloudflared  ──►  localhost:3000
   └─ Docker 容器 web（询单平台，SQLite + 图片）
```

要点：**服务器只开 22 端口（SSH）**，3000 不对外，全靠 Tunnel 打通。安全又省心。

---

## 阶段一：买阿里云轻量应用服务器（海外）

1. 登录 [阿里云](https://www.aliyun.com)（用公司账号）。
2. 控制台 → **产品与服务** → **轻量应用服务器** → **创建实例**。
3. 按下面选（**地域最关键**）：
   | 选项 | 选择 | 说明 |
   |------|------|------|
   | **地域** | **香港** 或 **新加坡** | ⚠️ 必须海外！别选杭州/北京（要备案、外商慢） |
   | **镜像** | **应用镜像 → Docker** | 自带 Docker，最省事；或选 系统镜像 Ubuntu 22.04 自己装 |
   | **实例规格** | **2核2G**（或 1核2G） | 询单量低，1核2G 也够；2核更稳 |
   | **带宽** | 按套餐（轻量自带，如 30Mbps 峰值/流量包） | 低流量足够 |
   | **购买时长** | 包年 | 比按量便宜 |
4. 创建后，在实例详情里记下 **公网 IP**（如 `47.1.2.3`），并设置 **root 密码**（或绑定 SSH 密钥）。
5. 控制台 → 该实例 → **防火墙** → 放行 **22**（SSH）。80/443/3000 先不管（Tunnel 用不到）。

> 费用参考：海外轻量 2C2G 约 **¥300–600/年**。

---

## 阶段二：连上服务器

- **最省事（推荐）**：阿里云控制台 → 实例 → **远程连接（Workbench）**，浏览器里直接开终端，不用装任何客户端。
- **本地终端**：`ssh root@47.1.2.3`（Windows 用 PowerShell/Terminal 或 PuTTY）。
- 登录后建议建普通用户（可选）：`adduser deploy && usermod -aG sudo deploy`，之后用密钥登录。

---

## 阶段三：装 Docker（若镜像没自带）

应用镜像已带 Docker；系统镜像则执行：
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker          # 或退出重登，使 docker 免 sudo
docker --version       # 应看到版本号
```

---

## 阶段四：上传代码

`yuzhou-crystal-inquiry.zip`（项目分发包）在哪里拿？
> 在开发环境的聊天里我会给你一个**下载链接**（形如 `https://webview.e2b…sandbox.cloudstudio.club/?x-cs-sandbox-id=…&x-cs-sandbox-port=8000`）。
> 用浏览器打开它，页面会自动把 `yuzhou-crystal-inquiry.zip` 存到你的电脑（约 100KB）。这就是真实代码包，**不是**云端预览地址。

拿到 zip 后，把它弄到服务器（推荐放在家目录，避免 `/opt` 权限问题）：
- **方式 A（控制台，最省事）**：阿里云实例详情 → **文件** → 上传，把 `yuzhou-crystal-inquiry.zip` 拖进去（建议传到 `/root/yuzhou-inquiry` 或你的家目录）。
- **方式 B（本地终端 scp）**：
  ```bash
  scp yuzhou-crystal-inquiry.zip root@47.1.2.3:/root/yuzhou-inquiry/
  ```
- 在服务器上建目录并解压：
  ```bash
  mkdir -p ~/yuzhou-inquiry
  cd ~/yuzhou-inquiry
  unzip yuzhou-crystal-inquiry.zip      # 解压出 server.js / public / docker-compose.yml 等
  ls                                    # 应看到 server.js、public、docker-compose.yml、.env.production.example
  ```
> ⚠️ 之前在 `/opt/yuzhou-inquiry` 报 `Permission denied`，是因为你以普通用户登录、没写 `/opt` 的权限。改用家目录 `~/yuzhou-inquiry`（或 `sudo mkdir -p /opt/yuzhou-inquiry`）即可。

---

## 阶段五：配置 .env

```bash
cp .env.production.example .env
nano .env            # 或 vim .env
```
改成你自己的值：
```ini
ADMIN_CREDENTIALS=admin:你的强密码          # 务必改！多个账号用逗号：admin:密码,lisa:密码
SESSION_SECRET=$(openssl rand -hex 32)      # 随机长串，重启后旧会话失效
PUBLIC_URL=https://inquiry.crystalwto.com   # 对外域名
SMTP_HOST=smtp.resend.com                    # Resend（海外推荐），见阶段六
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=re_xxxxx                           # Resend API Key
SMTP_PASS=re_xxxxx
SMTP_FROM=Yuzhou Crystal <noreply@crystalwto.com>
NOTIFY_EMAIL=sales@crystalwto.com
SALES_NOTIFY_EMAIL=sales@crystalwto.com
DESIGN_NOTIFY_EMAIL=design@crystalwto.com
```
> 应用仍跑在容器内的 3000 端口（docker-compose 已映射），`PUBLIC_URL` 填对外域名即可，Tunnel 会接管。

---

## 阶段六：起服务（先不接 Cloudflare）

```bash
docker compose up -d --build
docker compose ps            # 应看到 yuzhou-inquiry 状态 Up
curl http://localhost:3000/api/health     # 期望 {"ok":true,...}
```
此时 `http://<公网IP>:3000` 也能直接打开（测试用，正式走 Tunnel 后无需对外）。

---

## 阶段七：Cloudflare Tunnel（核心，让域名指向服务器且不暴露端口）

### 7.1 把域名交给 Cloudflare
1. 注册 [Cloudflare](https://www.cloudflare.com)，**Add a Site** → 输入 `crystalwto.com`。
2. 套餐选 **Free**。
3. Cloudflare 会显示两组 **NS**（如 `ella.ns.cloudflare.com`），去**阿里云控制台**把 `crystalwto.com` 的 DNS 服务器改成这两组（域名 → 解析设置 → 修改 DNS）。
4. 等生效（几分钟到几小时；用 [whatsmydns.net](https://whatsmydns.net) 查 NS 是否变成 Cloudflare）。

### 7.2 建 Tunnel
1. Cloudflare 控制台 → **Zero Trust**（免费）→ **Networks** → **Tunnels** → **Create a tunnel**，起名 `yuzhou`。
2. 按提示选环境 **Docker**，复制它给的启动命令（含一段 token）：
   ```bash
   docker run --name cloudflared -d --restart=always --network host \
     cloudflare/cloudflared:latest tunnel --no-autoupdate run --token <你的TOKEN>
   ```
   （`--network host` 让 cloudflared 的 `localhost` 等于宿主机；宿主机 3000 已由 compose 映射给 web 容器，故能连通。`--restart=always` 保证重启后自动连。）
3. 回到 Cloudflare Tunnel 页面 → **Public Hostname** → **Add a public hostname**：
   - Subdomain：`inquiry`，Domain：`crystalwto.com`
   - Service：`http://localhost:3000`（Tunnel 连本机容器）
4. 保存。Cloudflare 会**自动**建好 `inquiry.crystalwto.com` 的 DNS 记录（CNAME 到 Tunnel），无需手动加。
5. **旧站保留**：`www` / `@` 的现有记录如果之前在阿里云解析，现在 NS 已迁到 Cloudflare，需在 Cloudflare **DNS** 里补回旧站记录（`www`/`@` → 旧站 IP，代理可开可关）。旧站主机 IP 在你原解析后台能看到。

### 7.3 收尾安全
- 阿里云实例 **防火墙**：确认只放行 **22**；**80/443/3000 都不用开**（Tunnel 是出站，不依赖这些入站端口）。
- Cloudflare：**SSL/TLS** → 模式 **Full (Strict)**；开启 **Always Use HTTPS**。
- Cloudflare：**Security** → WAF 托管规则集 + **Bot Fight Mode**；对 `/api/inquiries`、`/api/custom-requests`、`/api/admin/login` 设速率限制。

---

## 阶段八：验证上线

```bash
# 在你本地电脑的浏览器：
https://inquiry.crystalwto.com/api/health     # 应返回 {"ok":true,...}
https://inquiry.crystalwto.com/admin          # 账号密码登录（见 .env）
```
- 提交一次测试询单 → 业务员邮箱（`SALES_NOTIFY_EMAIL`）收到中文通知邮件。
- 确认旧站 `https://www.crystalwto.com/crystalwto/` 仍正常。

---

## 阶段九：每日备份

把项目里的 `scripts/backup.sh` 传到服务器，加入定时任务：
```bash
crontab -e
# 加入一行（每日 03:15 备份）：
15 3 * * *  cd /opt/yuzhou-inquiry && bash scripts/backup.sh >> /var/log/yuzhou-backup.log 2>&1
```

---

## 备选：传统 Caddy 反代（不想用 Tunnel 时）

若你更习惯"反向代理"方式，可在服务器上用 Caddy 监听 80/443 转发到 3000（需改防火墙放行 80/443、并配置 Cloudflare Origin 证书做 Full Strict）：

`Caddyfile`：
```caddy
inquiry.crystalwto.com {
    # 用 Cloudflare 签发的 Origin 证书（Cloudflare→源站用）
    tls /opt/yuzhou-inquiry/certs/origin.crt /opt/yuzhou-inquiry/certs/origin.key
    reverse_proxy localhost:3000
}
```
启动：`caddy run --config Caddyfile`（或 `apt install caddy`）。Cloudflare SSL 模式选 **Full (Strict)**，并在 Cloudflare → SSL/TLS → Origin Server 下载对应证书挂到上面路径。
> 相比 Tunnel，Caddy 要开放 80/443、要管证书；Tunnel 更省事更安全，**新手优先 Tunnel**。

---

## 常见问题

| 现象 | 排查 |
|------|------|
| SSH 连不上 | 阿里云防火墙放行 22？密码/密钥对？或用控制台 Workbench |
| 域名打不开 / 还是旧内容 | [whatsmydns.net](https://whatsmydns.net) 查 NS 是否变 Cloudflare；清浏览器 DNS 缓存 |
| Cloudflare 502/523 | Tunnel 容器是否运行 `docker ps`；`docker logs cloudflared`；Service 填的是 `localhost:3000` 且 web 容器在跑 |
| 邮件收不到 | Resend 域名是否验证、SMTP_USER/PASS 是否填 API Key、是否被丢进垃圾箱 |
| 中国访问偏慢 | Cloudflare 已加速；要更快可开 **Argo**（付费）；或把 Tunnel 地域选近的 |

---

## 命令速查

```bash
docker compose up -d --build     # 部署/更新
docker compose ps                 # 看状态
docker compose logs -f web        # 看日志
docker compose restart            # 重启
docker compose down               # 停止
docker ps                         # 看 cloudflared 是否在跑
curl http://localhost:3000/api/health   # 本机健康检查
```

## 成本合计（估算）
- 阿里云轻量海外 2C2G：¥300–600/年
- Cloudflare：免费
- Resend 邮件：免费层（3000/月）够用
- **合计约 ¥300–700/年**
