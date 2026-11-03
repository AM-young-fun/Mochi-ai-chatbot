// The setup tutorial on the landing page, hosted on YouTube (voiceover + burnt-in captions).
// Every language has its own edition (the Chinese one demos a QQ group instead of Discord).
import type { Lang } from "./content";

/** A chapter (YouTube key moment): start time in seconds and its title, matching the video description. */
export type Chapter = [number, string];
export interface Tutorial { youtubeId: string; poster: string; duration: string; seconds: number; uploaded: string; lang: string; name: string; description: string; chapters: Chapter[] }

const EN: Tutorial = {
  youtubeId: "pqYZY2s3nd4",
  poster: "/videos/mochi-setup-tutorial.jpg",
  duration: "PT2M37S",
  seconds: 157,
  chapters: [[0, "What you'll build"], [11, "Step 1: copy the command from mochichatbot.com"], [23, "Step 2: paste it into PowerShell (Mac/Linux: Terminal)"], [38, "Step 3 + Part 1: dashboard and your Flatkey key"], [67, "Part 2: persona, channels and the website widget"], [110, "Part 3: chatting on Discord"], [131, "Part 4: managing memory"]],
  uploaded: "2026-11-03T00:00:00-08:00",
  lang: "en",
  name: "How to set up your own AI chatbot with Mochi (no coding needed)",
  description: "Install Mochi with one command, bind a Flatkey key, connect Discord, Telegram, Slack or a website chat widget, and manage what the bot remembers.",
};
const PT: Tutorial = {
  youtubeId: "xzLL-ffUDLs",
  poster: "/videos/mochi-setup-tutorial-pt.jpg",
  duration: "PT2M42S",
  seconds: 161,
  chapters: [[0, "O que você vai criar"], [12, "Passo 1: copie o comando em mochichatbot.com"], [24, "Passo 2: cole no PowerShell (Mac/Linux: Terminal)"], [39, "Passo 3 + Parte 1: o painel e a sua chave Flatkey"], [70, "Parte 2: persona, canais e o widget do site"], [115, "Parte 3: conversando no Discord"], [136, "Parte 4: controlando a memória"]],
  uploaded: "2026-11-03T00:00:00-08:00",
  lang: "pt-BR",
  name: "Como criar o seu próprio chatbot de IA com a Mochi (sem programar)",
  description: "Instale a Mochi com um comando, vincule uma chave da Flatkey, conecte Discord, Telegram, Slack ou um widget de chat no site e controle o que o bot lembra.",
};

const JA: Tutorial = {
  youtubeId: "EBOyXmRwcyY",
  poster: "/videos/mochi-setup-tutorial-ja.jpg",
  duration: "PT2M49S",
  seconds: 168,
  chapters: [[0, "今回つくるもの"], [14, "ステップ1：mochichatbot.com でコマンドをコピー"], [30, "ステップ2：PowerShell に貼り付け（Mac/Linux はターミナル）"], [45, "ステップ3＋パート1：ダッシュボードと Flatkey のキー"], [78, "パート2：ペルソナ、チャンネル、サイト用ウィジェット"], [119, "パート3：Discord でおしゃべり"], [141, "パート4：記憶の管理"]],
  uploaded: "2026-11-03T00:00:00-08:00",
  lang: "ja",
  name: "プログラミングなしで自分だけの AI チャットボットを作る方法（Mochi）",
  description: "コマンド 1 つで Mochi をインストールし、Flatkey のキーを連携して、Discord・Telegram・Slack・サイトのチャットウィジェットにつなぎ、ボットの記憶を管理する方法。",
};

const ZH: Tutorial = {
  youtubeId: "d_I-NO8HpJo",
  poster: "/videos/mochi-setup-tutorial-zh.jpg",
  duration: "PT2M38S",
  seconds: 158,
  chapters: [[0, "我们要搭什么"], [11, "第 1 步：在 mochichatbot.com 复制命令"], [24, "第 2 步：粘贴到 PowerShell（Mac/Linux 用终端）"], [38, "第 3 步 + 第一部分：后台和 Flatkey 密钥"], [67, "第二部分：人设、渠道和网页插件"], [111, "第三部分：在 QQ 群里聊天"], [133, "第四部分：管理记忆"]],
  uploaded: "2026-11-03T00:00:00-08:00",
  lang: "zh-CN",
  name: "不会写代码也能搭自己的 AI 聊天机器人（Mochi 部署教程）",
  description: "一行命令安装 Mochi，绑定 Flatkey 密钥，接入 QQ、Discord、Telegram、Slack 或网页聊天插件，并管理机器人的记忆。",
};

export function tutorialFor(lang: Lang): Tutorial {
  return { en: EN, pt: PT, ja: JA, zh: ZH }[lang];
}

export const youtubeWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const youtubeEmbed = (id: string) => `https://www.youtube.com/embed/${id}`;
