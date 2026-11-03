// The setup tutorial on the landing page (voiceover + burnt-in captions).
// Every language has its own edition (the Chinese one demos a QQ group instead of Discord).
import type { Lang } from "./content";

export interface Tutorial { src: string; poster: string; duration: string; uploaded: string; lang: string; name: string; description: string }

const EN: Tutorial = {
  src: "/videos/mochi-setup-tutorial.mp4",
  poster: "/videos/mochi-setup-tutorial.jpg",
  duration: "PT2M37S",
  uploaded: "2026-11-02",
  lang: "en",
  name: "How to set up your own AI chatbot with Mochi (no coding needed)",
  description: "Install Mochi with one command, bind a Flatkey key, connect Discord, Telegram, Slack or a website chat widget, and manage what the bot remembers.",
};
const PT: Tutorial = {
  src: "/videos/mochi-setup-tutorial-pt.mp4",
  poster: "/videos/mochi-setup-tutorial-pt.jpg",
  duration: "PT2M42S",
  uploaded: "2026-11-02",
  lang: "pt-BR",
  name: "Como criar o seu próprio chatbot de IA com a Mochi (sem programar)",
  description: "Instale a Mochi com um comando, vincule uma chave da Flatkey, conecte Discord, Telegram, Slack ou um widget de chat no site e controle o que o bot lembra.",
};

const JA: Tutorial = {
  src: "/videos/mochi-setup-tutorial-ja.mp4",
  poster: "/videos/mochi-setup-tutorial-ja.jpg",
  duration: "PT2M49S",
  uploaded: "2026-11-02",
  lang: "ja",
  name: "プログラミングなしで自分だけの AI チャットボットを作る方法（Mochi）",
  description: "コマンド 1 つで Mochi をインストールし、Flatkey のキーを連携して、Discord・Telegram・Slack・サイトのチャットウィジェットにつなぎ、ボットの記憶を管理する方法。",
};

const ZH: Tutorial = {
  src: "/videos/mochi-setup-tutorial-zh.mp4",
  poster: "/videos/mochi-setup-tutorial-zh.jpg",
  duration: "PT2M38S",
  uploaded: "2026-11-02",
  lang: "zh-CN",
  name: "不会写代码也能搭自己的 AI 聊天机器人（Mochi 部署教程）",
  description: "一行命令安装 Mochi，绑定 Flatkey 密钥，接入 QQ、Discord、Telegram、Slack 或网页聊天插件，并管理机器人的记忆。",
};

export function tutorialFor(lang: Lang): Tutorial {
  return { en: EN, pt: PT, ja: JA, zh: ZH }[lang];
}
