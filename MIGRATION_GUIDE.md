# 迁移到 crystalwto.com（子域名方案）实施指南

> 适用：公司已有域名 `crystalwto.com`（旧站 `www.crystalwto.com/crystalwto/`），
> 想把新询单平台放到该域名下，**保留旧站不动**。
> 结论：新站放子域名 **`inquiry.crystalwto.com`**，旧站原样保留；无需新买域名；海外 VPS → 无需新备案。
> 唯一前提：拿到 `crystalwto.com` 的 **DNS 解析管理权**（第一步专门解决）。

---

## 0. 总体流程（一眼看完）

```
找回域名 DNS 管理权  →  租海外 VPS 并部署  →  加子域名 A 记录 inquiry→VPS IP
        →  (推荐) Cloudflare 接管域名做 HTTPS+安全  →  验证上线
```

只动 `inquiry` 这条子域名记录，**旧站 `www`/`@` 完全不动**，所以零风险。

---

## 1. 第一步：找回域名管理权（最关键，先做这个）

你现在的卡点是"不确定域名在哪、谁管解析"。按下面顺序一定能定位。

### 1.1 查"解析/DNS 托管商"（在你自己电脑上做，最快）

看 `crystalwto.com` 的 **NS（Nameserver）记录** 就知道 DNS 在哪托管：

- Windows（PowerShell/CMD）：`nslookup -type=NS crystalwto.com`
- Mac / Linux：终端 `dig NS crystalwto.com`
- 在线（无需命令行）：打开 [dnschecker.org](https://dnschecker.org) 或 [whatsmydns.net](https://whatsmydns.net)，输入 `crystalwto.com`，类型选 **NS**

对照返回的 Nameserver 判断托管方：

| Nameserver 特征 | 大概率是 |
|----------------|----------|
| `dns*.hichina.com` / `*.alidns.com` | 阿里云 |
| `*.dnspod.net` | 腾讯云 DNSPod |
| `ns*.myhostadmin.net` | 西部数码 |
| `*.xincache.com` | 新网 |
| `ns*.godaddy.com` | GoDaddy |
| `*.namecheaphosting.com` | Namecheap |

### 1.2 查"注册商"（WHOIS）

- 命令行：`whois crystalwto.com`（Mac/Linux 自带；Windows 可装 whois 或用在线）
- 在线：[who.is](https://who.is) / [whois.com](https://whois.com)
- **中国域名额外看**：[站长工具 whois](https://whois.chinaz.com) 和工信部备案查询 [beian.miit.gov.cn](https://beian.miit.gov.cn)——能直接看到**备案主体**和注册商，且能确认域名是否在你公司名下（备案主体应是你公司）。

### 1.3 翻邮件（最直接）

搜你公司邮箱里的关键词：`crystalwto`、`域名`、`续费`、`renewal`、`aliyun`、`dnspod`、`西部数码` 等。注册商每年会发续费/到期通知邮件，里面写明登录入口。

### 1.4 拿回权限（三种情况）

- **记得注册商** → 直接登录该注册商控制台 → 域名 → DNS 解析，就能加记录了。
- **忘了密码** → 用当时注册的邮箱"找回密码"；或联系注册商客服，凭**营业执照 + 法人/经办人身份**验证后重置。
- **是建站公司代管** → 联系当年做旧站的公司，二选一：
  1. 让他们帮你**加一条** `inquiry` 的 A 记录，值填你新 VPS 的 IP（你把 IP 发他们）；
  2. 更彻底：要求把域名**转移（transfer）**到你自己的账号（需要注册商提供的转移密码 / auth code）。

> 目标只有一个：你能在 `crystalwto.com` 的 DNS 里**新增一条 A 记录 `inquiry` → 新 VPS 的 IP**。能加 = 权限到手。

---

## 2. 第二步：租 VPS + 部署（简述，详见 DEPLOY_GUIDE.md）

1. 租一台**海外 VPS**（面向海外客户延迟低、且免备案）：Hetzner(€4/月)、Vultr($5)、DigitalOcean($6)、AWS Lightsail($3.5)。节点选离客户近的（美/德/日）。
2. 拿到公网 IP（记下来，假设为 `203.0.113.10`）。
3. SSH 登录 → 装 Docker：`curl -fsSL https://get.docker.com | sh`。
4. 上传代码（git clone 或 scp），建生产 `.env`（参考 `.env.production.example`）：
   - `PUBLIC_URL=https://inquiry.crystalwto.com`
   - `ADMIN_CREDENTIALS=admin:你的强密码`、`SESSION_SECRET=随机串`
   - `SMTP_*` 填 Resend/SendGrid 凭据
5. `docker compose up -d --build`，`curl http://localhost:3000/api/health` 应返回 `{"ok":true,...}`。

---

## 3. 第三步：加子域名解析（核心改动）

在 `crystalwto.com` 的 DNS 后台**新增一条记录**：

| 类型 | 主机名/主机 | 值 | TTL |
|------|------------|-----|-----|
| A | `inquiry` | `<你的 VPS IP，如 203.0.113.10>` | 600 |

- **不要动** `www` 和 `@` 的现有记录（它们仍指向旧站主机，旧站照常运行）。
- 等生效：通常几分钟，最多几小时。可用 [whatsmydns.net](https://whatsmydns.net) 查各地解析是否到位。

---

## 4. 第四步（强烈推荐）：Cloudflare 接管域名

好处：旧站完全不受影响，新子域名免费拿到 **HTTPS 证书 + 全球加速 + WAF/防爬/限速**。

1. Cloudflare 添加站点 `crystalwto.com`，按提示把注册商处的 NS 改成 Cloudflare 给的 NS。
2. 在 Cloudflare **DNS** 里：
   - 新建 **A 记录**：`inquiry` → `<VPS IP>`，**代理开启（橙色云）**。
   - 把旧站记录也搬过来：`www`、`@` → 旧主机 IP（代理开/关都行，建议开，旧站也加速）。
3. **SSL/TLS** → 模式 `Full (Strict)`；开启 **Always Use HTTPS**。
4. **Security** → WAF 托管规则集 + Bot Fight Mode；对 `/api/inquiries`、`/api/custom-requests`、`/api/admin/login` 设速率限制。
5. VPS 防火墙（ufw）只放行 22/80/443，并仅允许 Cloudflare 回源 IP 段访问 3000（或用 Cloudflare Tunnel 彻底不暴露 3000）。

> 注意：把 DNS 迁到 Cloudflare 后，旧站的 A 记录也要在 Cloudflare 里重新建一条（指向旧主机 IP），否则旧站会断。照着第 3 步前的原记录抄过来即可。

---

## 5. 第五步：验证上线

- `https://inquiry.crystalwto.com/api/health` → `{"ok":true,...}`
- `https://inquiry.crystalwto.com/admin` → 账号密码登录（凭证在 `.env`）
- 提交一次测试询单 → 业务员邮箱收到中文通知邮件
- 确认旧站 `https://www.crystalwto.com/crystalwto/` 仍正常

---

## 6. ICP 备案说明

- **海外 VPS 托管** → 不需要新备案；`crystalwto.com` 原有备案留着即可（海外托管本就不强制备案）。
- 若以后改**国内服务器** → 沿用现有备案（同域名）即可，在阿里云/腾讯云等支持备案的服务商上操作。
- 所以本方案（海外 VPS + 复用 crystalwto.com）**绕开了备案麻烦**。

---

## 7. 风险与回滚

- 只新增 `inquiry` 子域名，**旧站零影响**，最安全。
- 子域名出问题 → 删掉那条 A 记录即回滚，主站不受影响。
- 若误改了 `www`/`@` → 立刻改回原 IP 即可恢复。

---

## 关键链接 / 命令速查

```bash
# 在你自己电脑查 NS（定位 DNS 托管商）
nslookup -type=NS crystalwto.com      # Windows
dig NS crystalwto.com                 # Mac/Linux

# VPS 上验证
curl http://localhost:3000/api/health
docker compose logs -f
```

- 找回注册商/备案：[beian.miit.gov.cn](https://beian.miit.gov.cn)（工信部备案查询）、[whois.chinaz.com](https://whois.chinaz.com)（站长工具）
- 查解析传播：[whatsmydns.net](https://whatsmydns.net)、[dnschecker.org](https://dnschecker.org)
- VPS 部署细节、邮件、备份、监控：见 `DEPLOY_GUIDE.md`
