/**
 * Picks up a name someone gives in chat ("my name is Alex", "call me Sam", "我叫小林", "私の名前はユキです",
 * "meu nome é Ana"), so a website visitor stops being "visitor" the moment they say who they are.
 * Only explicit phrasings count: "I'm tired" is not a name.
 */

const LATIN_WORD = "[\\p{L}][\\p{L}\\p{M}'’.-]{0,23}";
const LATIN_NAME = `(${LATIN_WORD}(?:\\s+${LATIN_WORD})?)`;
const CJK_NAME = "([\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}ー々A-Za-z]{1,8})";

const PATTERNS: RegExp[] = [
  new RegExp(`\\b(?:my name is|my name's|name's|call me|you can call me|i go by)\\s+${LATIN_NAME}`, "iu"),
  new RegExp(`\\b(?:meu nome é|meu nome e|me chamo|pode me chamar de|me chama de|me chame de)\\s+${LATIN_NAME}`, "iu"),
  new RegExp(`(?:我叫|我的名字是|我的名字叫|叫我|你可以叫我)\\s*${CJK_NAME}`, "u"),
  new RegExp(`(?:私の名前は|僕の名前は|俺の名前は|名前は)\\s*${CJK_NAME}`, "u"),
  new RegExp(`${CJK_NAME}\\s*(?:と呼んで|って呼んで)`, "u"),
];

// Words that follow "call me …" / "我叫 …" without being a name.
const NOT_NAMES = new Set([
  "later", "back", "tomorrow", "tonight", "maybe", "when", "if", "anytime", "now", "soon", "please", "a", "an", "the",
  "what", "anything", "whatever", "crazy", "lazy", "old", "fashioned", "depois", "amanhã", "quando", "o", "a",
  "什么", "啥", "什麼", "なに", "何",
]);
// Polite endings and particles that stick to a CJK name: 小林吧 / ユキです.
const CJK_TAIL = /(?:です|だよ|だ|よ|ね|と申します|吧|啦|哦|呀|呢|就好|就行|就可以了?)$/u;

/** The name the text says the writer goes by, or "" when it doesn't say one. */
export function statedName(text: string): string {
  const t = String(text || "").slice(0, 400);
  for (const re of PATTERNS) {
    const m = re.exec(t);
    if (!m) continue;
    let name = m[1].trim().replace(/[.’'-]+$/u, "");
    name = name.replace(CJK_TAIL, "");
    const first = name.split(/\s+/)[0].toLowerCase();
    if (!name || NOT_NAMES.has(first) || NOT_NAMES.has(name) || /^(什么|什麼|啥|なに|何)/u.test(name)) continue;
    // "my name is alex and i like cats": keep the name, not the rest.
    if (/\s/.test(name) && NOT_NAMES.has(name.split(/\s+/)[1].toLowerCase())) name = name.split(/\s+/)[0];
    if (/\s(and|but|i|im|from|e|eu|mas)$/iu.test(name)) name = name.split(/\s+/)[0];
    return tidy(name);
  }
  return "";
}

/** Capitalises Latin names typed in lowercase ("alex" → "Alex"); leaves everything else alone. */
function tidy(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => (/^\p{Ll}/u.test(w) ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
    .slice(0, 40);
}
