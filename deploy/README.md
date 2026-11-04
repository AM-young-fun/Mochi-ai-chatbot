# 把 Mochi 部署到云上

## 先搞清楚一件事：Mochi 不是 Serverless 应用

| Mochi 需要 | Serverless（Vercel / Netlify / Cloudflare Workers） |
|---|---|
| 常驻进程：Discord & QQ 的 WebSocket 网关、Slack Socket Mode、Telegram 长轮询、LINE 的 webhook 端点 | 函数只在请求期间存在，返回后冻结 |
| 可写持久盘：`data/mochi.db`（SQLite，WAL）、`bots.json`、`secrets.json` | 文件系统只读，`/tmp` 每次调用即丢 |
| 后台任务：记忆更新、渠道重连、心跳、每日预算重置 | 没有后台执行 |
| 长连接：QQ 心跳 41s、Slack Socket Mode 常连、Discord 网关 | 执行时长有硬上限 |

**结论：Vercel 跑不了 bot 本体。** 可以放的只有静态部分：

- `public/widget/*` 聊天窗口 → 丢到 Vercel 当静态站（或者直接由 Mochi 自己托管，它本来就会 serve）。
- 想做反向代理/自定义域名 → 用 Vercel 的 `rewrites` 指向你真正的容器地址，但 bot 仍必须跑在容器里。

## 镜像已经发布

`.github/workflows/docker.yml` 在 `main` 上构建并推送到 GitHub Container Registry：

| tag | 何时产生 |
|---|---|
| `ghcr.io/am-young-fun/mochi:latest` | 每次 push 到 `main` |
| `ghcr.io/am-young-fun/mochi:sha-<短 sha>` | 每次 push（便于回滚） |
| `ghcr.io/am-young-fun/mochi:1.2.3`、`:1.2` | 打 `v1.2.3` tag 时 |

多架构：`linux/amd64`（Sealos / Railway / Render / VPS）+ `linux/arm64`（Apple Silicon、Oracle 免费额度、Hetzner CAX）。

> **包现在就是公开的**：仓库已转到个人账号 `AM-young-fun`，GHCR 包 <https://github.com/users/AM-young-fun/packages/container/mochi>
> 匿名可拉，`docker pull ghcr.io/am-young-fun/mochi:latest` 直接可用，不需要 pull secret。
>
> 想再推一份到 Docker Hub（国内拉取更快）：仓库 → Settings → Secrets and variables → Actions 加
> `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN`，workflow 会自动多推 `docker.io/<user>/mochi:latest`。
>
> 如果哪天把包改回私有，Sealos 侧就配 pull secret：
> ```bash
> kubectl create secret docker-registry ghcr-pull \
>   --docker-server=ghcr.io --docker-username=AM-young-fun \
>   --docker-password=<带 read:packages 的 PAT>
> ```
> 然后取消 `deploy/sealos/mochi.yaml` 里 `imagePullSecrets` 两行的注释。
>
> 不想碰镜像仓库的话：**Zeabur / Railway / Render 直接从 GitHub 仓库构建**，完全不需要 registry。

## 一条命令装完（Helm chart，CI 自动发布）

`deploy/sealos/chart/` 是一个完整 chart，`.github/workflows/helm.yml` 在 `main` 上逐次
`helm lint --strict` + 渲染三种取值组合，然后打包推到 `oci://ghcr.io/am-young-fun/charts`。

```bash
helm install mochi oci://ghcr.io/am-young-fun/charts/mochi \
  --namespace mochi --create-namespace \
  --set publicUrl=https://mochi.<你的域名> \
  --set ingress.host=mochi.<你的域名>
```

它会自动：建 PVC（1Gi）、生成一个 48 位 `ADMIN_TOKEN`（升级时保持不变）、挂 `/health`
探针、`Recreate` 策略（避免两个 pod 抢同一条 Telegram 会话/SQLite 写锁）、`TRUST_PROXY=1`、
Ingress + cert-manager 证书。

装完 `helm status mochi -n mochi` 会直接打印：

- 控制台地址
- 取密码的命令
- **LINE webhook 该填什么**（`https://<域名>/webhook/line/mochi`）
- 数据卷名字、升级镜像的命令

常用取值：

| 值 | 默认 | 说明 |
|---|---|---|
| `publicUrl` | 必填 | 对外地址（widget、安装链接、LINE webhook 都基于它） |
| `ingress.host` | `mochi.example.com` | 域名 |
| `adminToken` | 自动生成 | 想自己定就填；留空则 48 位随机并写进 Secret |
| `existingSecret` | 空 | 用现成 Secret（含 `ADMIN_TOKEN`/`PUBLIC_URL`/`DATA_DIR`/`PORT`） |
| `persistence.size` | `1Gi` | 数据卷大小 |
| `persistence.existingClaim` | 空 | 复用已有 PVC |
| `extraEnv.GA_MEASUREMENT_ID` | 空 | 控制台统计（默认关闭） |
| `image.tag` | `latest` | 升级/回滚用 `sha-xxxxxxx` |
| `trustProxy` | `1` | 在 ingress 后面时取真实访客 IP |

> Sealos Desktop 的「应用管理 / App Launchpad」不读 chart，它只吃镜像。用图形界面时按下表填：
>
> | 字段 | 值 |
> |---|---|
> | 镜像 | `ghcr.io/am-young-fun/mochi:latest` |
> | 端口 | `3000`（开外网访问） |
> | 环境变量 | `ADMIN_TOKEN=<64 位随机>`、`PUBLIC_URL=https://<域名>`、`DATA_DIR=/app/data`、`PORT=3000`、`TRUST_PROXY=1` |
> | 存储 | 1Gi 挂到 `/app/data` |

## 能跑的地方（都支持 Dockerfile + 持久卷 + 常驻）

| 平台 | 一键程度 | 持久卷 | 免费额度 | 适合谁 |
|---|---|---|---|---|
| **Sealos** | ★★★ 图形化「应用管理」 | ✅ PVC | 有 | 国内用户、想要免费公网域名 + 自动 HTTPS |
| **Zeabur** | ★★★ 中文界面，连 GitHub 即部署 | ✅ Volume | 有试用 | 想要"像 Vercel 一样"但支持容器 |
| **Railway** | ★★★ | ✅ Volume | 试用金 | 海外、部署最快 |
| **Render** | ★★☆ | ✅ Disk（付费） | 有免费 web 服务（会休眠） | 简单 demo |
| **Fly.io** | ★★☆ 需 CLI | ✅ Volume | 有 | 要低延迟多区域 |
| **任意 VPS** | ★☆☆ 自己装 Docker | ✅ 磁盘 | — | 完全可控 |

> LINE 渠道 **必须** 有公网 HTTPS（它把事件 POST 给 webhook，不像 Slack/QQ 那样连出去）。
> 上面每个平台都会自动给一个 HTTPS 域名，所以 LINE 只有在这些平台或自建隧道下才可用。

## 三条路，从最省心开始

### A. Sealos（推荐给国内用户）

图形界面「应用管理 / App Launchpad」，不需要写 YAML：

1. **镜像**：`ghcr.io/am-young-fun/mochi:latest`（私有就先按上一节改成 public 或配 pull secret）
2. **环境变量**：
   ```
   PUBLIC_URL=https://<Sealos 给你的域名>
   DATA_DIR=/app/data
   PORT=3000
   TRUST_PROXY=1
   ```
3. **存储**：挂一个 1Gi 的 PVC 到 `/app/data`（SQLite 和密钥都在这里，不挂就重启丢数据）
4. **外网访问**：开启，端口 3000；Sealos 会给 `https://xxx.sealos.run` 这类域名（HTTPS 自动签好）
5. 打开 `https://<域名>/dashboard/`，第一次会让你设置管理员密码。因为是从别的电脑访问，还要输入一次性**设置码**：在 Sealos 应用详情 → 日志里找 `one-time setup code`。然后绑定 Flatkey 密钥 → 渠道

> 想要声明式部署：`kubectl apply -f deploy/sealos/mochi.yaml`（先改里面的域名、镜像）。

关于管理员密码：
- 不需要再手动生成 `ADMIN_TOKEN`。密码只以 scrypt 哈希保存；容器里没有 `.env` 时存在数据卷的 `/app/data/admin-password`。
- 忘记密码：删掉 `/app/data/admin-password`（或清空 `ADMIN_TOKEN`）后重启，再按上面重新设置。
- 旧方式仍然可用：直接设置 `ADMIN_TOKEN=<随机串>` 环境变量，就用它登录。

### B. Zeabur / Railway / Render（"像 Vercel 一样"的那类）

共同步骤，三个平台几乎一致：

1. 新建项目 → **Deploy from GitHub repo** → 选这个仓库（Dockerfile 会被自动识别）
2. 加环境变量：`DATA_DIR=/app/data`、`PUBLIC_URL=https://<平台域名>`、`TRUST_PROXY=1`
3. 加持久卷：挂载点 `/app/data`，1Gi 起步
4. 生成域名（平台自带 HTTPS），把该域名填回 `PUBLIC_URL` 并重启一次
5. 打开 `https://<域名>/dashboard/`，设置管理员密码（设置码在平台的日志里）

注意：**单实例**。SQLite 不支持多副本同时写，别开 autoscale/多 replica。

平台专属说明：

- **Render**：仓库根目录有 `render.yaml`，直接点 README 里的 **Deploy to Render** 按钮即可（会自动建 1GB 磁盘挂到 `/app/data`）。Render 的磁盘需要付费实例（最小 Starter）。`PUBLIC_URL` 不用填，Mochi 会自动读 Render 提供的 `RENDER_EXTERNAL_URL`。
- **Railway**：仓库根目录有 `railway.json`（Dockerfile 构建、`/health` 健康检查、单副本）。在服务上加一个 Volume 挂到 `/app/data`，再加变量 `TRUST_PROXY=1`。生成域名后 `PUBLIC_URL` 也不用填，Mochi 会自动读 `RAILWAY_PUBLIC_DOMAIN`。
- 卷是 root 所有也没关系：镜像启动时会先把 `/app/data` 交给 `node` 用户，再以 `node` 身份运行 Mochi，所以**不需要** `RAILWAY_RUN_UID=0`。
- 地区：Railway 和 Render 在亚洲都只有新加坡；要东京机房可以用 Fly.io（`nrt`）或 Zeabur。

### C. 自己的 VPS

```bash
git clone https://github.com/AM-young-fun/Mochi-ai-chatbot.git && cd Mochi-ai-chatbot
docker build -t mochi .
docker run -d --name mochi --restart unless-stopped \
  -p 3000:3000 \
  -v /srv/mochi-data:/app/data \
  -e PUBLIC_URL=https://bot.example.com \
  mochi
```

`docker logs mochi` 里能看到一次性设置码，第一次打开 `/dashboard/` 设置管理员密码时要用。

前面放 Nginx/Caddy 做 TLS，或者用 Cloudflare Tunnel（`cloudflared tunnel --url http://localhost:3000`）拿临时域名。

## 接 LINE 时唯一要改的

绑定 LINE 后，把 webhook 填成：

```
https://<你的公网域名>/webhook/line/mochi
```

（`mochi` 是默认 bot 的 id；多机器人时用控制台 URL 里的那个 id。）先在 LINE 后台点 **Verify**，再打开 **Use webhook**。

签名校验用的是 **channel secret**，所以就算有人乱 POST，也不会进大脑 —— 但**域名必须是 HTTPS 且可公网访问**，否则 LINE 根本不给你发。

## 平台通用注意事项

| 事项 | 说明 |
|---|---|
| `GA_MEASUREMENT_ID` | 可选。控制台的 GA4 统计 id（`G-XXXXXXXXXX`）。不填 = 完全不上报；填了就由 `/ga.js` 下发，页面本身不含 id。想做跨域统计（网站 → 控制台算同一次会话）就填官网那串 id（`G-FG9VQMZ6BZ`），`/ga.js` 自带 `linker` 域名列表 |
| `PUBLIC_URL` | 必须是**外部可访问的最终地址**（含 https）：网页 widget 的嵌入代码、LINE webhook 提示、安装链接都基于它 |
| 数据卷 | 只挂 `/app/data` 一处；`mochi.db` 是 WAL 模式，卷要支持文件锁（NFS 之类不合适，Sealos/Railway 的块存储可以） |
| 副本数 | 固定 1。SQLite + 渠道会话（同一个 Telegram token 只能有一个轮询者）都不允许多实例 |
| 滚动更新 | 用 `Recreate` 而不是 `RollingUpdate`，避免新旧实例同时抢渠道连接（清单里已配置） |
| 反向代理 | 部署在 ingress 后面时，设置环境变量 `TRUST_PROXY=1`，限流才能看到访客的真实 IP（默认 `loopback`，只信任本机反代） |
| 健康检查 | `/health` 不需要鉴权，可直接做 liveness/readiness |
| 密钥 | `data/secrets.json` 明文存 key/token，卷权限设 700；云厂商的加密卷更稳妥 |
