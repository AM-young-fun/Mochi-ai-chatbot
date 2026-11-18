import type { Lang } from "./content";

// The Deploy page: every supported way to run Mochi. Railway is the one recommendation everywhere
// else on the site; this page is where the other options live. Keep it in step with deploy/README.md,
// render.yaml, railway.json, deploy/sealos/ and website/public/install*.sh.

const SITE = "https://www.mochichatbot.com";
const REPO = "https://github.com/AM-young-fun/Mochi-ai-chatbot";
const IMAGE = "ghcr.io/am-young-fun/mochi:latest";

export type DeployId = "railway" | "render" | "sealos" | "vps" | "docker" | "helm" | "container" | "computer";

/** Links and commands, the same in every language. */
export const DEPLOY_LINKS = {
  railway: "https://railway.com/new/template/mochi-ai-chatbot",
  render: `https://render.com/deploy?repo=${REPO}`,
  renderYaml: `${REPO}/blob/main/render.yaml`,
  sealos: "https://sealos.io/?utm_source=flatkey&utm_medium=mochi_bot&utm_campaign=mochi&utm_content=deploy_page",
  guide: `${REPO}/blob/main/deploy/README.md`,
  vpsScript: `${REPO}/blob/main/website/public/install-vps.sh`,
  image: "https://github.com/users/AM-young-fun/packages/container/package/mochi",
  chart: `${REPO}/tree/main/deploy/sealos/chart`,
  readme: `${REPO}#readme`,
};

export const DEPLOY_COMMANDS: Partial<Record<DeployId, string>> = {
  vps: `curl -fsSL ${SITE}/install-vps.sh | sudo bash`,
  docker: `docker run -d --name mochi --restart unless-stopped -p 3000:3000 -v mochi-data:/app/data ${IMAGE}`,
  helm: "helm install mochi oci://ghcr.io/am-young-fun/charts/mochi --namespace mochi --create-namespace --set publicUrl=https://mochi.example.com --set ingress.host=mochi.example.com",
  container: IMAGE,
  computer: `curl -fsSL ${SITE}/install.sh | bash`,
};

/** Display order of the cards after the featured Railway one. */
export const DEPLOY_ORDER: DeployId[] = ["render", "sealos", "vps", "docker", "helm", "container", "computer"];
export const DEPLOY_EMOJI: Record<DeployId, string> = {
  railway: "🚂", render: "☁️", sealos: "🌊", vps: "🖥️", docker: "🐳", helm: "⎈", container: "📦", computer: "💻",
};

type Action = { label: string; href: keyof typeof DEPLOY_LINKS | "home"; primary?: boolean };
type Card = { name: string; tagline: string; best: string; chips: string[]; actions: Action[]; note?: string };

export interface DeployCopy {
  title: string;
  description: string;
  h1: string;
  intro: string;
  back: string;
  footerLink: string;
  recommended: string;
  bestFor: string;
  others: string;
  copy: string;
  copied: string;
  needsTitle: string;
  needs: string[];
  afterTitle: string;
  after: string;
  cards: Record<DeployId, Card>;
}

export const DEPLOY: Record<Lang, DeployCopy> = {
  en: {
    title: "Deploy Mochi · Railway, Render, Sealos, VPS, Docker, Kubernetes",
    description: "Every way to run Mochi online: one click on Railway, or Render, Sealos, any VPS with one command, Docker, Kubernetes, or your own computer.",
    h1: "Deploy Mochi",
    intro: "Mochi is a small program that has to stay on, so your bots answer day and night. The easiest way is one click on Railway. If you'd rather use another host or your own machine, every option is below.",
    back: "← Back to Mochi",
    footerLink: "Deploy",
    recommended: "Recommended",
    bestFor: "Good for",
    others: "Other ways to run Mochi",
    copy: "Copy",
    copied: "Copied ✓",
    needsTitle: "What any host needs",
    needs: [
      "A process that stays on (not serverless: Vercel, Netlify and Cloudflare Workers can't run it).",
      "Somewhere to keep her memory: a disk at <code>/app/data</code>, or a Postgres database in <code>DATABASE_URL</code>.",
      "Port <code>3000</code> open to the web, ideally behind HTTPS. LINE and the website widget need a public HTTPS address.",
    ],
    afterTitle: "After it's running",
    after: "Open <code>/dashboard</code> on your new address right away and choose your admin password (the first visitor sets it). Then bind your Flatkey key and connect your channels.",
    cards: {
      railway: {
        name: "Railway",
        tagline: "One click creates Mochi and a Postgres database for her memory in your own Railway account, with an HTTPS address.",
        best: "Almost everyone. Nothing to install, nothing to configure.",
        chips: ["One click", "Postgres included", "HTTPS included", "Billed by Railway"],
        actions: [{ label: "Deploy on Railway", href: "railway", primary: true }],
      },
      render: {
        name: "Render",
        tagline: "One click reads Mochi's render.yaml and creates the service with a 1 GB disk and HTTPS.",
        best: "People who already use Render.",
        chips: ["One click", "Disk included", "Paid Starter plan"],
        actions: [{ label: "Deploy to Render", href: "render", primary: true }, { label: "render.yaml", href: "renderYaml" }],
        note: "Render's free plan sleeps and loses files on restart, so the blueprint uses the Starter plan.",
      },
      sealos: {
        name: "Sealos",
        tagline: "Launch the Mochi image from Sealos's App Launchpad: free domain, automatic HTTPS and a persistent volume.",
        best: "Users in mainland China and anyone who prefers a point-and-click console.",
        chips: ["Visual console", "Free domain", "Volume"],
        actions: [{ label: "Open Sealos", href: "sealos", primary: true }, { label: "Step-by-step guide", href: "guide" }],
      },
      vps: {
        name: "Any VPS, one command",
        tagline: "On a fresh Ubuntu or Debian server, one command installs Docker, Mochi and Caddy with a free HTTPS certificate. Both restart on their own.",
        best: "Hetzner, Sakura VPS, ConoHa, DigitalOcean, Vultr or any server you rent.",
        chips: ["Full control", "Free HTTPS (Caddy)", "Your own disk"],
        actions: [{ label: "Read the script", href: "vpsScript" }],
        note: "Open TCP 80 and 443 in your firewall first. Add MOCHI_DOMAIN=bot.example.com after sudo to use your own domain.",
      },
      docker: {
        name: "Docker",
        tagline: "One container on any machine that runs Docker. The image is public and multi-arch (amd64 and arm64).",
        best: "A home server, a NAS, a Raspberry Pi or an existing Docker host.",
        chips: ["amd64 + arm64", "Public image", "Volume for data"],
        actions: [{ label: "Image on GitHub", href: "image" }],
        note: "Put HTTPS in front of port 3000 (Caddy, Cloudflare Tunnel, your reverse proxy) before sharing it.",
      },
      helm: {
        name: "Kubernetes (Helm)",
        tagline: "A Helm chart with a persistent volume, health checks, an ingress with cert-manager and a generated admin token.",
        best: "Teams already running Kubernetes, including Sealos clusters.",
        chips: ["Helm chart", "PVC + ingress", "One replica"],
        actions: [{ label: "Chart source", href: "chart" }],
        note: "Replace mochi.example.com with your domain. Keep one replica: two copies would fight over the same chat sessions.",
      },
      container: {
        name: "Other container hosts",
        tagline: "Zeabur, Fly.io, Koyeb, Northflank and any host that runs a container image work too. Use the image below.",
        best: "Whatever host you already pay for.",
        chips: ["Port 3000", "Volume at /app/data", "or DATABASE_URL"],
        actions: [{ label: "Deploy notes", href: "guide" }, { label: "README", href: "readme" }],
        note: "Set PUBLIC_URL to the address the host gives you, and TRUST_PROXY=1 when it sits behind the host's proxy.",
      },
      computer: {
        name: "Your own computer",
        tagline: "One line installs Mochi on macOS, Linux or Windows and opens the dashboard. Free, but bots only answer while it's on.",
        best: "Trying Mochi out before putting her online.",
        chips: ["Free", "macOS, Windows, Linux", "On while your computer is"],
        actions: [{ label: "Setup guide (Windows too)", href: "home" }],
      },
    },
  },

  zh: {
    title: "部署 Mochi · Railway、Render、Sealos、VPS、Docker、Kubernetes",
    description: "把 Mochi 放到网上的所有方式:Railway 一键部署,或 Render、Sealos、一条命令装到任意 VPS、Docker、Kubernetes,以及你自己的电脑。",
    h1: "部署 Mochi",
    intro: "Mochi 是一个需要一直运行的小程序,这样你的机器人才能全天候回复。最简单的方式是在 Railway 一键部署。如果你想用别的托管服务或自己的机器,所有方式都在下面。",
    back: "← 返回 Mochi",
    footerLink: "部署",
    recommended: "推荐",
    bestFor: "适合",
    others: "其他运行方式",
    copy: "复制",
    copied: "已复制 ✓",
    needsTitle: "任何托管服务都需要",
    needs: [
      "一个一直运行的进程(不能是 Serverless:Vercel、Netlify、Cloudflare Workers 都跑不了)。",
      "保存记忆的地方:挂在 <code>/app/data</code> 的磁盘,或者 <code>DATABASE_URL</code> 里的 Postgres 数据库。",
      "对外开放 <code>3000</code> 端口,最好放在 HTTPS 后面。LINE 和网站聊天窗口需要公网 HTTPS 地址。",
    ],
    afterTitle: "跑起来之后",
    after: "马上用新地址打开 <code>/dashboard</code> 设置管理员密码(谁先打开谁设置)。然后绑定 Flatkey 密钥,连接你的聊天渠道。",
    cards: {
      railway: {
        name: "Railway",
        tagline: "一键在你自己的 Railway 账号里建好 Mochi 和存记忆用的 Postgres 数据库,并附带 HTTPS 地址。",
        best: "几乎所有人。不用安装,也不用配置。",
        chips: ["一键部署", "含 Postgres", "含 HTTPS", "费用由 Railway 收取"],
        actions: [{ label: "一键部署到 Railway", href: "railway", primary: true }],
      },
      render: {
        name: "Render",
        tagline: "一键读取 Mochi 的 render.yaml,建好带 1 GB 磁盘和 HTTPS 的服务。",
        best: "已经在用 Render 的人。",
        chips: ["一键部署", "含磁盘", "付费 Starter 套餐"],
        actions: [{ label: "部署到 Render", href: "render", primary: true }, { label: "render.yaml", href: "renderYaml" }],
        note: "Render 免费套餐会休眠,重启后文件会丢失,所以这个配置用的是 Starter 套餐。",
      },
      sealos: {
        name: "Sealos",
        tagline: "在 Sealos 的「应用管理」里启动 Mochi 镜像:免费域名、自动 HTTPS、持久化存储。",
        best: "中国大陆用户,以及喜欢图形界面操作的人。",
        chips: ["图形界面", "免费域名", "持久卷"],
        actions: [{ label: "打开 Sealos", href: "sealos", primary: true }, { label: "图文部署指南", href: "guide" }],
      },
      vps: {
        name: "任意 VPS,一条命令",
        tagline: "在全新的 Ubuntu 或 Debian 服务器上,一条命令装好 Docker、Mochi 和带免费 HTTPS 证书的 Caddy,崩溃或重启后都会自动恢复。",
        best: "Hetzner、Sakura VPS、ConoHa、DigitalOcean、Vultr 或任何你租的服务器。",
        chips: ["完全可控", "免费 HTTPS(Caddy)", "自己的磁盘"],
        actions: [{ label: "查看脚本", href: "vpsScript" }],
        note: "先在防火墙放行 TCP 80 和 443。想用自己的域名,在 sudo 后面加上 MOCHI_DOMAIN=bot.example.com。",
      },
      docker: {
        name: "Docker",
        tagline: "任何能跑 Docker 的机器上起一个容器。镜像公开,支持多架构(amd64 和 arm64)。",
        best: "家用服务器、NAS、树莓派或现有的 Docker 主机。",
        chips: ["amd64 + arm64", "公开镜像", "数据卷"],
        actions: [{ label: "GitHub 上的镜像", href: "image" }],
        note: "分享之前,先给 3000 端口加上 HTTPS(Caddy、Cloudflare Tunnel 或你的反向代理)。",
      },
      helm: {
        name: "Kubernetes(Helm)",
        tagline: "Helm chart:持久卷、健康检查、带 cert-manager 证书的 Ingress,并自动生成管理员令牌。",
        best: "已经在用 Kubernetes 的团队,包括 Sealos 集群。",
        chips: ["Helm chart", "PVC + Ingress", "单副本"],
        actions: [{ label: "Chart 源码", href: "chart" }],
        note: "把 mochi.example.com 换成你的域名。保持一个副本:两个副本会争抢同一个聊天会话。",
      },
      container: {
        name: "其他容器平台",
        tagline: "Zeabur、Fly.io、Koyeb、Northflank 等任何能运行容器镜像的平台都可以,用下面这个镜像。",
        best: "你已经在付费使用的平台。",
        chips: ["端口 3000", "数据卷挂 /app/data", "或 DATABASE_URL"],
        actions: [{ label: "部署说明", href: "guide" }, { label: "README", href: "readme" }],
        note: "把 PUBLIC_URL 设为平台给你的地址;如果它在平台的代理后面,再设 TRUST_PROXY=1。",
      },
      computer: {
        name: "你自己的电脑",
        tagline: "一行命令在 macOS、Linux 或 Windows 上装好 Mochi 并打开控制台。免费,但只有电脑开着时机器人才会回复。",
        best: "正式上线之前先试试 Mochi。",
        chips: ["免费", "macOS、Windows、Linux", "电脑开着才在线"],
        actions: [{ label: "安装指南(含 Windows)", href: "home" }],
      },
    },
  },

  ja: {
    title: "Mochi をデプロイ · Railway・Render・Sealos・VPS・Docker・Kubernetes",
    description: "Mochi をオンラインで動かすすべての方法:Railway のワンクリック、Render、Sealos、コマンド 1 つで任意の VPS、Docker、Kubernetes、自分のパソコン。",
    h1: "Mochi をデプロイ",
    intro: "Mochi は動かしっぱなしにする小さなプログラムで、そのおかげでボットが昼も夜も返信できます。いちばん簡単なのは Railway のワンクリックです。ほかのサービスや自分のマシンを使いたい場合は、下にすべての方法があります。",
    back: "← Mochi に戻る",
    footerLink: "デプロイ",
    recommended: "おすすめ",
    bestFor: "向いている人",
    others: "ほかの動かし方",
    copy: "コピー",
    copied: "コピーしました ✓",
    needsTitle: "どのサービスでも必要なもの",
    needs: [
      "動き続けるプロセス(サーバーレスは不可。Vercel、Netlify、Cloudflare Workers では動きません)。",
      "記憶を保存する場所:<code>/app/data</code> のディスク、または <code>DATABASE_URL</code> の Postgres データベース。",
      "外部に開いた <code>3000</code> 番ポート(できれば HTTPS 経由)。LINE とサイトのウィジェットには公開 HTTPS アドレスが必要です。",
    ],
    afterTitle: "動き出したら",
    after: "すぐに新しいアドレスで <code>/dashboard</code> を開き、管理者パスワードを決めます(最初に開いた人が設定できます)。それから Flatkey キーを設定し、チャネルをつなぎます。",
    cards: {
      railway: {
        name: "Railway",
        tagline: "ワンクリックで、あなたの Railway アカウントに Mochi と記憶用の Postgres データベース、HTTPS のアドレスを作ります。",
        best: "ほとんどの人。インストールも設定もいりません。",
        chips: ["ワンクリック", "Postgres 付き", "HTTPS 付き", "料金は Railway へ"],
        actions: [{ label: "Railway にデプロイ", href: "railway", primary: true }],
      },
      render: {
        name: "Render",
        tagline: "ワンクリックで Mochi の render.yaml を読み込み、1 GB のディスクと HTTPS 付きのサービスを作ります。",
        best: "すでに Render を使っている人。",
        chips: ["ワンクリック", "ディスク付き", "有料の Starter プラン"],
        actions: [{ label: "Render にデプロイ", href: "render", primary: true }, { label: "render.yaml", href: "renderYaml" }],
        note: "Render の無料プランはスリープし、再起動でファイルが消えるため、設定では Starter プランを使います。",
      },
      sealos: {
        name: "Sealos",
        tagline: "Sealos の App Launchpad から Mochi のイメージを起動します。無料ドメイン、自動 HTTPS、永続ボリューム付き。",
        best: "中国本土のユーザーや、画面操作で済ませたい人。",
        chips: ["画面で操作", "無料ドメイン", "ボリューム"],
        actions: [{ label: "Sealos を開く", href: "sealos", primary: true }, { label: "手順ガイド", href: "guide" }],
      },
      vps: {
        name: "任意の VPS(コマンド 1 つ)",
        tagline: "まっさらな Ubuntu か Debian のサーバーで、コマンド 1 つで Docker、Mochi、無料の HTTPS 証明書付きの Caddy を入れます。落ちても再起動しても自動で戻ります。",
        best: "Hetzner、さくらの VPS、ConoHa、DigitalOcean、Vultr など、借りているサーバーなら何でも。",
        chips: ["自由に管理", "無料 HTTPS(Caddy)", "自分のディスク"],
        actions: [{ label: "スクリプトを見る", href: "vpsScript" }],
        note: "先にファイアウォールで TCP 80 と 443 を開けてください。独自ドメインを使うなら sudo の後に MOCHI_DOMAIN=bot.example.com を付けます。",
      },
      docker: {
        name: "Docker",
        tagline: "Docker が動くマシンならどこでもコンテナ 1 つで動きます。イメージは公開、マルチアーキテクチャ(amd64 と arm64)。",
        best: "自宅サーバー、NAS、Raspberry Pi、既存の Docker ホスト。",
        chips: ["amd64 + arm64", "公開イメージ", "データ用ボリューム"],
        actions: [{ label: "GitHub のイメージ", href: "image" }],
        note: "共有する前に、3000 番ポートの前に HTTPS を置いてください(Caddy、Cloudflare Tunnel、リバースプロキシなど)。",
      },
      helm: {
        name: "Kubernetes(Helm)",
        tagline: "永続ボリューム、ヘルスチェック、cert-manager 付きの Ingress、自動生成の管理者トークンを備えた Helm チャート。",
        best: "すでに Kubernetes を動かしているチーム(Sealos のクラスタを含む)。",
        chips: ["Helm チャート", "PVC + Ingress", "レプリカ 1 つ"],
        actions: [{ label: "チャートのソース", href: "chart" }],
        note: "mochi.example.com を自分のドメインに置き換えてください。レプリカは 1 つのままに。2 つあると同じチャットのセッションを取り合います。",
      },
      container: {
        name: "ほかのコンテナホスティング",
        tagline: "Zeabur、Fly.io、Koyeb、Northflank など、コンテナイメージが動くサービスならどこでも使えます。下のイメージを指定してください。",
        best: "すでに契約しているサービス。",
        chips: ["ポート 3000", "/app/data にボリューム", "または DATABASE_URL"],
        actions: [{ label: "デプロイメモ", href: "guide" }, { label: "README", href: "readme" }],
        note: "PUBLIC_URL にサービスから割り当てられたアドレスを設定し、サービスのプロキシの後ろにあるなら TRUST_PROXY=1 も設定します。",
      },
      computer: {
        name: "自分のパソコン",
        tagline: "コマンド 1 行で macOS、Linux、Windows に Mochi を入れてダッシュボードを開きます。無料ですが、パソコンがついている間だけ返信します。",
        best: "オンラインに出す前に Mochi を試したい人。",
        chips: ["無料", "macOS・Windows・Linux", "パソコンがついている間だけ"],
        actions: [{ label: "セットアップ手順(Windows も)", href: "home" }],
      },
    },
  },

  pt: {
    title: "Implantar a Mochi · Railway, Render, Sealos, VPS, Docker, Kubernetes",
    description: "Todas as formas de colocar a Mochi no ar: um clique no Railway, ou Render, Sealos, qualquer VPS com um comando, Docker, Kubernetes ou o seu próprio computador.",
    h1: "Implantar a Mochi",
    intro: "A Mochi é um programinha que precisa ficar ligado, para que seus bots respondam dia e noite. O jeito mais fácil é um clique no Railway. Se você prefere outro provedor ou a sua própria máquina, todas as opções estão abaixo.",
    back: "← Voltar ao Mochi",
    footerLink: "Implantar",
    recommended: "Recomendado",
    bestFor: "Bom para",
    others: "Outras formas de rodar a Mochi",
    copy: "Copiar",
    copied: "Copiado ✓",
    needsTitle: "O que qualquer provedor precisa ter",
    needs: [
      "Um processo que fique ligado (não serverless: Vercel, Netlify e Cloudflare Workers não rodam ela).",
      "Um lugar para guardar a memória dela: um disco em <code>/app/data</code> ou um banco Postgres em <code>DATABASE_URL</code>.",
      "A porta <code>3000</code> aberta para a web, de preferência atrás de HTTPS. O LINE e o widget do site precisam de um endereço HTTPS público.",
    ],
    afterTitle: "Depois que estiver rodando",
    after: "Abra <code>/dashboard</code> no novo endereço logo em seguida e escolha sua senha de administrador (quem abrir primeiro define). Depois vincule sua chave Flatkey e conecte seus canais.",
    cards: {
      railway: {
        name: "Railway",
        tagline: "Um clique cria a Mochi e um banco Postgres para a memória dela na sua própria conta do Railway, com endereço HTTPS.",
        best: "Quase todo mundo. Nada para instalar, nada para configurar.",
        chips: ["Um clique", "Postgres incluso", "HTTPS incluso", "Cobrado pelo Railway"],
        actions: [{ label: "Implantar no Railway", href: "railway", primary: true }],
      },
      render: {
        name: "Render",
        tagline: "Um clique lê o render.yaml da Mochi e cria o serviço com disco de 1 GB e HTTPS.",
        best: "Quem já usa o Render.",
        chips: ["Um clique", "Disco incluso", "Plano Starter pago"],
        actions: [{ label: "Implantar no Render", href: "render", primary: true }, { label: "render.yaml", href: "renderYaml" }],
        note: "O plano grátis do Render hiberna e perde os arquivos ao reiniciar, por isso a configuração usa o plano Starter.",
      },
      sealos: {
        name: "Sealos",
        tagline: "Suba a imagem da Mochi pelo App Launchpad do Sealos: domínio grátis, HTTPS automático e volume persistente.",
        best: "Usuários na China continental e quem prefere um painel visual.",
        chips: ["Painel visual", "Domínio grátis", "Volume"],
        actions: [{ label: "Abrir o Sealos", href: "sealos", primary: true }, { label: "Guia passo a passo", href: "guide" }],
      },
      vps: {
        name: "Qualquer VPS, um comando",
        tagline: "Num servidor Ubuntu ou Debian novo, um comando instala Docker, a Mochi e o Caddy com certificado HTTPS grátis. Os dois voltam sozinhos depois de uma queda ou reinício.",
        best: "Hetzner, Sakura VPS, ConoHa, DigitalOcean, Vultr ou qualquer servidor que você alugue.",
        chips: ["Controle total", "HTTPS grátis (Caddy)", "Seu próprio disco"],
        actions: [{ label: "Ler o script", href: "vpsScript" }],
        note: "Libere TCP 80 e 443 no firewall antes. Para usar seu próprio domínio, coloque MOCHI_DOMAIN=bot.example.com depois do sudo.",
      },
      docker: {
        name: "Docker",
        tagline: "Um contêiner em qualquer máquina que rode Docker. A imagem é pública e multiarquitetura (amd64 e arm64).",
        best: "Servidor em casa, NAS, Raspberry Pi ou um host Docker que você já tem.",
        chips: ["amd64 + arm64", "Imagem pública", "Volume para os dados"],
        actions: [{ label: "Imagem no GitHub", href: "image" }],
        note: "Coloque HTTPS na frente da porta 3000 (Caddy, Cloudflare Tunnel, seu proxy reverso) antes de compartilhar.",
      },
      helm: {
        name: "Kubernetes (Helm)",
        tagline: "Um chart Helm com volume persistente, health checks, ingress com cert-manager e token de administrador gerado.",
        best: "Times que já rodam Kubernetes, inclusive clusters Sealos.",
        chips: ["Chart Helm", "PVC + ingress", "Uma réplica"],
        actions: [{ label: "Código do chart", href: "chart" }],
        note: "Troque mochi.example.com pelo seu domínio. Mantenha uma réplica: duas brigariam pelas mesmas sessões de chat.",
      },
      container: {
        name: "Outros provedores de contêiner",
        tagline: "Zeabur, Fly.io, Koyeb, Northflank e qualquer provedor que rode uma imagem de contêiner também servem. Use a imagem abaixo.",
        best: "O provedor que você já paga.",
        chips: ["Porta 3000", "Volume em /app/data", "ou DATABASE_URL"],
        actions: [{ label: "Notas de implantação", href: "guide" }, { label: "README", href: "readme" }],
        note: "Defina PUBLIC_URL com o endereço que o provedor te der, e TRUST_PROXY=1 quando ele ficar atrás do proxy do provedor.",
      },
      computer: {
        name: "Seu próprio computador",
        tagline: "Uma linha instala a Mochi no macOS, Linux ou Windows e abre o painel. É grátis, mas os bots só respondem enquanto ele estiver ligado.",
        best: "Testar a Mochi antes de colocá-la no ar.",
        chips: ["Grátis", "macOS, Windows, Linux", "Ligado só com o computador"],
        actions: [{ label: "Guia de instalação (Windows também)", href: "home" }],
      },
    },
  },
};
