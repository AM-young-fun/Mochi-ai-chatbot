import type { Lang } from "./content";

// Privacy policy for www.mochichatbot.com. Bodies are trusted static HTML (links and <b> only).
// The self-hosted dashboard only reports to GA when its operator sets GA_MEASUREMENT_ID, which is off by default.
// Keep it in step with what the site really does: components/Tracking.tsx (GA4, GTM, ad click ID),
// components/Guide.tsx (progress in localStorage) and components/TutorialVideo.tsx (YouTube on Play).

export const PRIVACY_UPDATED = "2026-11-03";

const GH = "https://github.com/AM-young-fun/Mochi-ai-chatbot";
const GH_ISSUES = `${GH}/issues`;
const GH_SECURITY = `${GH}/security/advisories/new`;
const GOOGLE_PRIVACY = "https://policies.google.com/privacy";
const GA_OPTOUT = "https://tools.google.com/dlpage/gaoptout";
const a = (href: string, text: string) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;

export interface PrivacySection { h: string; p?: string[]; list?: string[] }
export interface PrivacyCopy { title: string; description: string; updated: string; back: string; footerLink: string; intro: string; sections: PrivacySection[] }

export const PRIVACY: Record<Lang, PrivacyCopy> = {
  en: {
    title: "Privacy policy · Mochi",
    description: "What the Mochi website collects (Google Analytics), and why the self-hosted Mochi software sends us nothing.",
    updated: "Last updated: November 3, 2026",
    back: "← Back to Mochi",
    footerLink: "Privacy",
    intro: `This policy covers the website www.mochichatbot.com and the Mochi software. Mochi is an open-source project (MIT license) maintained together with the Flatkey team.`,
    sections: [
      {
        h: "What this website collects",
        p: ["We use <b>Google Analytics 4</b> and <b>Google Tag Manager</b> to understand how people use the site. They record:"],
        list: [
          "the pages you visit and how you arrived (the referring site and any campaign tags in the link);",
          "clicks on buttons and links, such as Copy, Play, “Mark as done” and links to GitHub or Flatkey;",
          "your approximate location (country and city, worked out from your IP address), device type, browser and language.",
        ],
      },
      {
        h: "",
        p: [
          `Google sets cookies (such as <code>_ga</code>) for this and processes the data under its own ${a(GOOGLE_PRIVACY, "privacy policy")}. To opt out, use the ${a(GA_OPTOUT, "Google Analytics opt-out add-on")} or block cookies in your browser.`,
          "<b>Ads.</b> If you arrive from one of our Google ads, the ad’s click ID (<code>gclid</code>, <code>gbraid</code> or <code>wbraid</code>) is kept in your browser for 90 days and added to our links to Flatkey, so a sign-up there can be credited to the ad.",
          "<b>Setup guide progress.</b> The steps you mark as done are saved only in your browser’s local storage. They are never sent to us.",
          "<b>Tutorial video.</b> The video is hosted on YouTube and only loads when you press Play. From then on, YouTube’s privacy policy and cookies apply.",
          "We don’t ask for your name or email, there are no accounts or forms, and we never sell data.",
        ],
      },
      {
        h: "The Mochi software",
        list: [
          "Mochi runs on your own computer or server. It sends us no data and no usage statistics. Its dashboard can report visits to Google Analytics, but only if whoever deployed it sets GA_MEASUREMENT_ID — that switch is off by default.",
          "Your bots, chats, memory, knowledge base and API keys are stored in the <code>data</code> folder of your install, on your disk.",
          "To write replies, Mochi sends messages (and images people share) to Flatkey, the model provider, which passes them to the AI model you chose. Flatkey’s own privacy policy covers that.",
          "Chat apps you connect (Discord, Telegram, Slack, QQ, LINE) handle messages under their own privacy policies.",
          "The install scripts download Node.js and Mochi from their official sources (nodejs.org or winget, and GitHub). Those sites see the download like any other.",
          "You stay in control: delete what the bot remembers from the dashboard, let people say “forget me” to the bot, or delete the <code>data</code> folder to remove everything.",
        ],
      },
      {
        h: "Security",
        p: [
          `Please report security problems privately through ${a(GH_SECURITY, "GitHub’s private vulnerability reporting")}. If a vulnerability is found, we fix it, publish a GitHub security advisory and release, and post a notice on this site and in the README so everyone running Mochi knows to update.`,
        ],
      },
      {
        h: "Questions and changes",
        p: [
          `Questions about this policy: ${a(GH_ISSUES, "open an issue on GitHub")}. When this policy changes, we update the date at the top.`,
        ],
      },
    ],
  },
  zh: {
    title: "隐私政策 · Mochi",
    description: "Mochi 网站收集哪些数据（Google Analytics），以及为什么自托管的 Mochi 软件不会向我们发送任何数据。",
    updated: "最后更新：2026 年 11 月 3 日",
    back: "← 返回 Mochi",
    footerLink: "隐私政策",
    intro: "本政策适用于网站 www.mochichatbot.com 和 Mochi 软件。Mochi 是一个开源项目（MIT 协议），与 Flatkey 团队共同维护。",
    sections: [
      {
        h: "本网站收集的数据",
        p: ["我们使用 <b>Google Analytics 4</b> 和 <b>Google Tag Manager</b> 了解大家如何使用本站，它们会记录："],
        list: [
          "你访问的页面，以及你从哪里来（来源网站和链接里的推广参数）；",
          "对按钮和链接的点击，比如「复制」「播放」「标记完成」，以及前往 GitHub 或 Flatkey 的链接；",
          "大致位置（根据 IP 地址推算的国家和城市）、设备类型、浏览器和语言。",
        ],
      },
      {
        h: "",
        p: [
          `Google 会为此设置 Cookie（例如 <code>_ga</code>），并按其${a(GOOGLE_PRIVACY, "隐私政策")}处理这些数据。如需退出，可以安装 ${a(GA_OPTOUT, "Google Analytics 停用插件")}，或在浏览器中禁用 Cookie。`,
          "<b>广告。</b>如果你是通过我们的 Google 广告来到本站，广告的点击 ID（<code>gclid</code>、<code>gbraid</code> 或 <code>wbraid</code>）会在你的浏览器里保留 90 天，并附加到前往 Flatkey 的链接上，以便把在那里的注册归因到这条广告。",
          "<b>部署教程进度。</b>你标记完成的步骤只保存在浏览器的本地存储里，不会发送给我们。",
          "<b>教程视频。</b>视频托管在 YouTube 上，只有在你点击播放后才会加载。从那时起适用 YouTube 的隐私政策和 Cookie。",
          "我们不会索要你的姓名或邮箱，没有账号也没有表单，也绝不出售数据。",
        ],
      },
      {
        h: "Mochi 软件",
        list: [
          "Mochi 运行在你自己的电脑或服务器上，不会向我们发送任何数据或使用统计。控制台的访问统计默认关闭，只有部署者自己在 GA_MEASUREMENT_ID 里填入统计 id 时才会上报。",
          "你的机器人、聊天记录、记忆、知识库和 API 密钥都保存在安装目录的 <code>data</code> 文件夹里，也就是你自己的硬盘上。",
          "为了生成回复，Mochi 会把消息（以及大家发的图片）发送给模型服务商 Flatkey，再由它转给你选择的 AI 模型。这部分适用 Flatkey 自己的隐私政策。",
          "你接入的聊天软件（QQ、Discord、Telegram、Slack、LINE）按各自的隐私政策处理消息。",
          "安装脚本会从官方渠道下载 Node.js 和 Mochi（nodejs.org 或 winget，以及 GitHub）。这些网站会像处理普通下载一样看到这次请求。",
          "一切由你掌控：可以在后台删除机器人记住的内容，大家也可以对机器人说「忘掉我」，删除 <code>data</code> 文件夹即可清除全部数据。",
        ],
      },
      {
        h: "安全",
        p: [
          `如发现安全问题，请通过 ${a(GH_SECURITY, "GitHub 私密漏洞报告")} 私下告诉我们。一旦确认漏洞，我们会修复、发布 GitHub 安全公告和新版本，并在本站和 README 中发布通知，提醒所有使用 Mochi 的人更新。`,
        ],
      },
      {
        h: "问题与更新",
        p: [`对本政策有疑问，请${a(GH_ISSUES, "在 GitHub 上提 issue")}。本政策如有变更，我们会更新页首的日期。`],
      },
    ],
  },
  ja: {
    title: "プライバシーポリシー · Mochi",
    description: "Mochi のサイトが収集する情報（Google アナリティクス）と、セルフホストの Mochi ソフトウェアが私たちに何も送らない理由。",
    updated: "最終更新日：2026 年 11 月 3 日",
    back: "← Mochi に戻る",
    footerLink: "プライバシー",
    intro: "このポリシーは、ウェブサイト www.mochichatbot.com と Mochi ソフトウェアを対象としています。Mochi は Flatkey チームと共同で開発しているオープンソースプロジェクト（MIT ライセンス）です。",
    sections: [
      {
        h: "このサイトが収集する情報",
        p: ["サイトの使われ方を把握するため、<b>Google アナリティクス 4</b> と <b>Google タグマネージャー</b> を使っています。記録されるのは次の情報です："],
        list: [
          "閲覧したページと、どこから来たか（参照元サイトやリンクのキャンペーンパラメータ）",
          "ボタンやリンクのクリック（「コピー」「再生」「完了にする」、GitHub や Flatkey へのリンクなど）",
          "おおよその位置（IP アドレスから推定した国と市）、端末の種類、ブラウザ、言語",
        ],
      },
      {
        h: "",
        p: [
          `Google はこのために Cookie（<code>_ga</code> など）を設定し、Google の${a(GOOGLE_PRIVACY, "プライバシーポリシー")}に従ってデータを処理します。オプトアウトするには ${a(GA_OPTOUT, "Google アナリティクス オプトアウト アドオン")}を使うか、ブラウザで Cookie をブロックしてください。`,
          "<b>広告。</b>当サイトの Google 広告から来た場合、広告のクリック ID（<code>gclid</code>・<code>gbraid</code>・<code>wbraid</code>）がブラウザに 90 日間保存され、Flatkey へのリンクに付与されます。Flatkey での登録をその広告の成果として計測するためです。",
          "<b>セットアップガイドの進み具合。</b>「完了」にした手順はブラウザのローカルストレージにだけ保存され、私たちには送られません。",
          "<b>チュートリアル動画。</b>動画は YouTube にあり、再生ボタンを押したときにだけ読み込まれます。それ以降は YouTube のプライバシーポリシーと Cookie が適用されます。",
          "名前やメールアドレスはお聞きしません。アカウントもフォームもなく、データを販売することもありません。",
        ],
      },
      {
        h: "Mochi ソフトウェア",
        list: [
          "Mochi はあなた自身のパソコンやサーバーで動きます。私たちにデータや利用統計を送ることはありません。管理画面のアクセス解析は既定でオフで、デプロイした人が GA_MEASUREMENT_ID を設定した場合だけ送信されます。",
          "ボット、会話、記憶、ナレッジベース、API キーは、インストール先の <code>data</code> フォルダ、つまりあなたのディスクに保存されます。",
          "返信を作るために、Mochi はメッセージ（と共有された画像）をモデル提供元の Flatkey に送り、Flatkey が選んだ AI モデルに渡します。この部分には Flatkey のプライバシーポリシーが適用されます。",
          "接続したチャットアプリ（Discord・Telegram・Slack・QQ・LINE）は、それぞれのプライバシーポリシーに従ってメッセージを扱います。",
          "インストールスクリプトは Node.js と Mochi を公式の配布元（nodejs.org または winget、GitHub）からダウンロードします。これらのサイトには通常のダウンロードと同じようにリクエストが届きます。",
          "データはあなたが管理できます。ボットの記憶はダッシュボードから削除でき、ボットに「忘れて」と言ってもらうこともできます。<code>data</code> フォルダを消せばすべて削除されます。",
        ],
      },
      {
        h: "セキュリティ",
        p: [
          `セキュリティ上の問題は、${a(GH_SECURITY, "GitHub の非公開脆弱性報告")}から非公開でお知らせください。脆弱性が見つかった場合は修正し、GitHub のセキュリティアドバイザリとリリースを公開して、このサイトと README でお知らせし、Mochi を使っている皆さんにアップデートを呼びかけます。`,
        ],
      },
      {
        h: "お問い合わせと変更",
        p: [`このポリシーについてのご質問は ${a(GH_ISSUES, "GitHub の issue")} からどうぞ。ポリシーを変更した場合は、冒頭の日付を更新します。`],
      },
    ],
  },
  pt: {
    title: "Política de privacidade · Mochi",
    description: "O que o site da Mochi coleta (Google Analytics) e por que o software Mochi, auto-hospedado, não nos envia nada.",
    updated: "Última atualização: 3 de novembro de 2026",
    back: "← Voltar para a Mochi",
    footerLink: "Privacidade",
    intro: "Esta política vale para o site www.mochichatbot.com e para o software Mochi. A Mochi é um projeto open source (licença MIT) mantido junto com o time da Flatkey.",
    sections: [
      {
        h: "O que este site coleta",
        p: ["Usamos o <b>Google Analytics 4</b> e o <b>Google Tag Manager</b> para entender como as pessoas usam o site. Eles registram:"],
        list: [
          "as páginas que você visita e de onde você veio (o site de origem e os parâmetros de campanha do link);",
          "cliques em botões e links, como Copiar, Assistir, “Marcar como feito” e links para o GitHub ou a Flatkey;",
          "sua localização aproximada (país e cidade, calculados a partir do seu IP), tipo de dispositivo, navegador e idioma.",
        ],
      },
      {
        h: "",
        p: [
          `O Google coloca cookies para isso (como o <code>_ga</code>) e trata os dados conforme a ${a(GOOGLE_PRIVACY, "política de privacidade dele")}. Para não participar, use o ${a(GA_OPTOUT, "complemento de desativação do Google Analytics")} ou bloqueie cookies no navegador.`,
          "<b>Anúncios.</b> Se você chegou por um anúncio nosso no Google, o ID do clique (<code>gclid</code>, <code>gbraid</code> ou <code>wbraid</code>) fica guardado no seu navegador por 90 dias e é adicionado aos nossos links para a Flatkey, para que um cadastro lá seja atribuído ao anúncio.",
          "<b>Progresso do guia.</b> Os passos que você marca como feitos ficam salvos só no armazenamento local do seu navegador. Nunca são enviados para nós.",
          "<b>Vídeo tutorial.</b> O vídeo fica no YouTube e só carrega quando você aperta Assistir. A partir daí valem a política de privacidade e os cookies do YouTube.",
          "Não pedimos seu nome nem e-mail, não há contas nem formulários, e nunca vendemos dados.",
        ],
      },
      {
        h: "O software Mochi",
        list: [
          "A Mochi roda no seu computador ou servidor. Ela não nos envia nenhum dado nem estatística de uso. O painel pode enviar visitas ao Google Analytics, mas só se quem o instalou definir GA_MEASUREMENT_ID — isso vem desligado por padrão.",
          "Seus bots, conversas, memória, base de conhecimento e chaves de API ficam na pasta <code>data</code> da sua instalação, no seu disco.",
          "Para responder, a Mochi envia as mensagens (e as imagens que as pessoas mandam) para a Flatkey, a provedora de modelos, que repassa ao modelo de IA que você escolheu. Essa parte segue a política de privacidade da própria Flatkey.",
          "Os apps de chat que você conecta (Discord, Telegram, Slack, QQ, LINE) tratam as mensagens conforme as políticas de privacidade deles.",
          "Os scripts de instalação baixam o Node.js e a Mochi das fontes oficiais (nodejs.org ou winget, e GitHub). Esses sites veem o download como qualquer outro.",
          "O controle é seu: apague o que o bot lembra pelo painel, deixe as pessoas dizerem “esquece de mim” para o bot, ou apague a pasta <code>data</code> para remover tudo.",
        ],
      },
      {
        h: "Segurança",
        p: [
          `Reporte problemas de segurança de forma privada pelo ${a(GH_SECURITY, "relatório privado de vulnerabilidades do GitHub")}. Se uma vulnerabilidade for encontrada, a gente corrige, publica um alerta de segurança e uma nova versão no GitHub, e avisa neste site e no README para que todo mundo que usa a Mochi atualize.`,
        ],
      },
      {
        h: "Dúvidas e mudanças",
        p: [`Dúvidas sobre esta política: ${a(GH_ISSUES, "abra uma issue no GitHub")}. Quando a política mudar, atualizamos a data no topo.`],
      },
    ],
  },
};
