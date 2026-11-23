/**
 * When a reply is spoken, and what text the voice reads. Shared by every channel.
 */
import type { BotSettings } from "./bots.ts";
import type { IncomingMessage } from "./types.ts";

/** "Send me a voice message", "say it out loud", "发语音", "用声音说", "ボイスで", "manda um áudio"… */
const ASKED =
  /\b(voice (?:message|note|reply|msg)|send (?:me )?(?:a |an )?(?:voice|audio)|say it (?:out loud|aloud)|read (?:it|this) (?:out loud|aloud)|talk to me|speak)\b|语音|說話|说话|用声音|声音说|听听你的声音|念给我|ボイス|音声で|声で|声を聞|áudio|audio|mensagem de voz|manda (?:um )?áudio|fala comigo/i;

export function wantsVoice(bot: BotSettings, msg: IncomingMessage): boolean {
  const v = bot.voice;
  if (!v || v.mode === "off" || !v.model) return false;
  if (v.mode === "always") return true;
  return ASKED.test(msg.text);
}

/**
 * What the voice should read: no markdown, links, code or emoji, and not too long to listen to.
 * Returns "" when nothing is left worth saying.
 */
export function speakableText(text: string, max = 600): string {
  let t = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/<@!?\d+>|<#\d+>|@\S+/g, " ")
    .replace(/[*_~#>|]+/g, " ")
    .replace(/\p{Extended_Pictographic}|️|‍/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length > max) {
    const cut = t.slice(0, max);
    const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("。"), cut.lastIndexOf("! "), cut.lastIndexOf("？"), cut.lastIndexOf("? "), cut.lastIndexOf("！"));
    t = end > max * 0.5 ? cut.slice(0, end + 1) : cut;
  }
  return /[\p{L}\p{N}]/u.test(t) ? t : "";
}
