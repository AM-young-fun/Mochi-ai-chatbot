// The setup tutorial on the landing page (voiceover + burnt-in captions).
// Portuguese has its own edition; the other languages show the English one.
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

export function tutorialFor(lang: Lang): Tutorial {
  return lang === "pt" ? PT : EN;
}
