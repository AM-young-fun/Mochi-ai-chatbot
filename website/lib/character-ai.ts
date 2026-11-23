// English conversion page at /character-ai-alternative.
// The informational companion essay stays at /blog/own-your-ai-companion.
// Localized homepages link here (hrefLang=en). There is no /zh|ja|pt copy of this page,
// so nothing should point at those paths.
//
// Facts checked against src/core/persona.ts, src/core/brain.ts, src/core/bots.ts,
// src/memory/store.ts, src/channels/factory.ts, src/flatkey/why.ts, src/server/app.ts
// and the dashboard Memory / Persona / Channels tabs.

/** The only URL for this page. English lives at the site root, same as /blog and /deploy. */
export const CHARACTER_AI_PATH = "/character-ai-alternative";

/** Footer label on each locale homepage. The link target is always CHARACTER_AI_PATH. */
export const CHARACTER_AI_FOOTER = {
  en: "Character.AI Alternative",
  zh: "Character.AI 替代方案",
  ja: "Character.AI の代替",
  pt: "Alternativa ao Character.AI",
} as const;

export const CHARACTER_AI_H1 = "Your AI companion. Your memories. Your control.";

export const CHARACTER_AI = {
  title: "Character.AI Alternative: Your Companion, Your Memories · Mochi",
  description:
    "Host your own AI companion with Mochi. You write the persona, you can inspect and delete what she remembers, and you can back it up. She can talk on Discord, Telegram, Slack, QQ, LINE and your website. The software is free. Model usage and hosting are paid separately.",
  h1Lines: ["Your AI companion.", "Your memories.", "Your control."],
  eyebrow: "A companion you host yourself",
  position:
    "Mochi is for people who already like talking to a character and want that companion on their own side: a persona you write, a memory you can open, and a chat app you already use. She is not a public character catalog, and she is not a website you log into to start a chat.",
  disclaimer:
    "Mochi is an independent open-source project. It is not affiliated with, endorsed by, or a product of Character.AI.",
  runsOn: "Talks on",
  nav: {
    memory: "Memory",
    persona: "Persona",
    channels: "Channels",
    setup: "Setup",
    fit: "Fit",
    faq: "FAQ",
    cta: "Get started",
  },
  heroCta: "Get started",
  deployCta: "Deploy on Railway",
  keyCta: "Get a Flatkey key",
  guideCta: "Full setup guide",
  deployMore: "Other ways to deploy",
  githubCta: "View on GitHub",
  benefits: {
    h2: "What you actually get",
    sub: "A companion you can read, change and keep. Not a second copy of someone else's app.",
    items: [
      {
        icon: "✍️",
        t: "A persona you write",
        b: "Name, greeting, personality, tone, backstory and rules are fields in your dashboard. A custom prompt can replace the generated one entirely.",
      },
      {
        icon: "👁️",
        t: "Memory you can open",
        b: "The Memory tab lists each person and room, with the notes she has saved. You can forget one person or one room, and you can download a backup.",
      },
      {
        icon: "🗄️",
        t: "Records on your server",
        b: "People, rooms, messages, knowledge files and settings stay in your database. Mochi the project does not collect that database.",
      },
      {
        icon: "💬",
        t: "Chats you already use",
        b: "Discord, Telegram, Slack, QQ, LINE, or a widget on your own site. Private chats and groups both work. Each bot is a separate character.",
      },
    ],
  },
  memory: {
    h2: "Memory you can see, remove and take with you",
    sub: "She keeps notes so a later chat still knows who someone is. Those notes are on your server, and the Memory tab is where you deal with them.",
    items: [
      {
        icon: "👁️",
        t: "Inspect",
        b: "Every person shows a name, the platform, a short personality note, facts and interests, plus how many messages and when they were last seen. Every room shows a summary and recent topics.",
      },
      {
        icon: "🗑️",
        t: "Delete",
        b: "Forget one person or one room without wiping the rest. Someone can also tell her “forget me”. That phrase is recognized in English, Portuguese, Japanese and Chinese.",
      },
      {
        icon: "💾",
        t: "Back up",
        b: "Download one file with what she remembers, the knowledge base and the bot settings. Keys and channel tokens are left out. Import it into this bot or another one. Importing replaces that bot’s memory and knowledge. You choose whether the persona and settings are restored too.",
      },
    ],
    limitsTitle: "What this is not",
    limits: [
      "There is no text box in the dashboard for rewriting one saved fact. Profiles change when a later memory update merges in new messages, or when you import a backup. The persona itself is edited on the Persona tab, which is separate from these notes.",
      "Recall is not perfect. A reply sees a recent window of that room (20 messages unless you change it), the room summary, and the profiles of people in that window. Older lines in the same room can be searched. Each room keeps up to 300 stored messages.",
      "Discord and Slack can also backfill older channel history from the platform. Telegram, QQ and LINE have no history API for the bot, so she only has messages she actually received. A summary is not a transcript.",
      "The same human on two platforms is two people. Profiles are stored per bot, per platform, per account id. Nothing links a Discord account to a Telegram account.",
      "The database stays on your server, but a reply does not stay there. The request sent to Flatkey includes the recent conversation, the persona, the room summary, those people profiles, and any knowledge passages that matched. Images go too when image reading is on.",
    ],
  },
  persona: {
    h2: "You write the character",
    sub: "Start from the group-chat companion preset, or from a blank bot, and edit every field after that.",
    body: [
      "The companion preset turns memory on and gives you a playful starting personality. You can replace all of it. Name, avatar, color, description, greeting, nicknames, personality, tone, emoji, reply length, language, backstory and rules are the fields. If you want the exact prompt, a custom prompt replaces the generated one.",
      "Lore can live in the knowledge base instead of one giant prompt: text, Markdown, CSV, PDF, Word, or a public web page. She looks up passages that match the message. Those matched passages are part of the request to the model. A Q&A preset also exists, for a bot that should answer only from documents. That is a different job from a companion.",
      "You can run more than one bot. Each has its own persona, memory, channels and budget.",
    ],
    shotAlt:
      "Mochi dashboard Persona tab: name, description, greeting, bot type, personality, tone and emoji, with a preview of the instructions the bot is given.",
    shotCaption: "The Persona tab. The companion preset uses this same page. The screenshot shows the Q&A type so the fields are visible.",
  },
  channels: {
    h2: "She joins the chat you already have",
    sub: "Six places, each with its own connect steps in the dashboard. Tokens stay on your server.",
    body: "Discord, Telegram, Slack, QQ, LINE, and a chat widget on your own website. The widget needs no platform token. You can give it a character that peeks in from the edge of the page. Private messages and group chats both work. In a group she keeps a separate profile for each person.",
    notes: [
      "Telegram groups only deliver messages that mention the bot until you turn Group Privacy off in BotFather. Until then, that is all she can remember.",
      "LINE needs a public HTTPS address. Replies right after a message use LINE’s reply token. Messages she sends later use LINE’s push API, which counts against the LINE plan.",
      "QQ answers @-mentions unless the group allows the bot to receive the whole chat. QQ also needs your server’s public IP on its allowlist.",
    ],
    shotAlt: "Mochi dashboard Channels tab for a companion bot, with connect steps for Discord, Telegram and Slack.",
    shotCaption: "Discord, Telegram and Slack on the Channels tab. QQ, LINE and the website widget are on this same page, each with its own steps.",
    tutorialsLead: "Written setup for the two most common apps:",
    discordTutorial: "Discord AI chatbot tutorial",
    telegramTutorial: "Telegram AI chatbot tutorial",
    tutorialsRest: "Slack, QQ, LINE and the website widget are covered step by step in the dashboard.",
  },
  setup: {
    h2: "Set her up",
    sub: "A short path is below. The full setup guide on the home page checks off every step, including Windows, and your progress is saved in this browser.",
    installLabel: "macOS and Linux",
    installNote: "Windows uses a different command in the full setup guide. On your own computer she answers only while that computer is on and the Mochi window stays open.",
    copy: "Copy",
    copied: "Copied",
    steps: [
      {
        t: "Run Mochi",
        b: "On a computer, one command installs Node.js if you need it, downloads Mochi, starts it and opens the dashboard. For a companion that stays online, deploy her. Railway’s template creates Mochi and a Postgres database in your own Railway account and gives you an HTTPS address. Railway bills that usage to you. Render, Sealos, a VPS, Docker and Kubernetes are on the Deploy page.",
      },
      {
        t: "Choose the admin password",
        b: "Open /dashboard as soon as it starts. The first visitor sets the password. Do that before you share the address. On a server, put HTTPS in front before other people can open it. LINE and the website widget need a public HTTPS address.",
      },
      {
        t: "Bind a Flatkey key",
        b: "Flatkey is the only model provider Mochi supports. Create a key, paste it on the Flatkey API key page and bind it. Mochi checks the key with Flatkey and stores it only on your server. New Flatkey accounts get $1 in free credit. One key covers chat, image reading, web search and the memory update.",
      },
      {
        t: "Write the companion",
        b: "Create a bot from the group-chat companion preset, or a blank bot, and fill in the Persona tab. Turn on the abilities you want. Memory, image reading and web search can each be switched off, and each can use a different model from the Flatkey catalog.",
      },
      {
        t: "Connect a channel",
        b: "Open Channels and pick Discord, Telegram, Slack, QQ, LINE or the website widget. Each card has its own steps. Then send her a message.",
      },
      {
        t: "Open Memory",
        b: "After a few conversations, read the profiles. Forget anyone who should not be there, and download a backup before you move machines or restart a host that does not keep the disk.",
      },
    ],
  },
  cost: {
    h2: "The software is free. The model is not.",
    sub: "Three separate bills. Only the first one is zero.",
    items: [
      {
        icon: "🆓",
        t: "Mochi: $0",
        b: "MIT license. You can read the code, run it, and change it. There is no Mochi subscription.",
      },
      {
        icon: "⚡",
        t: "Model usage",
        b: "You pay Flatkey for the tokens a reply, an image, a search or a memory update actually uses. Mainstream models are at least 20% below those makers’ official prices. Failed calls cost $0. New accounts start with $1 in credit, then you top up. There is no free unlimited model.",
      },
      {
        icon: "🖥️",
        t: "Hosting, if you want it",
        b: "Your own computer costs nothing extra, and she sleeps when it does. A server that stays on is billed by that host, not by Mochi. The Deploy page lists the options. You can also set a daily token budget per bot. The default is no cap.",
      },
    ],
  },
  fit: {
    h2: "Who it fits",
    sub: "A fair split, before you spend an afternoon on setup.",
    goodTitle: "A good fit",
    poorTitle: "Look elsewhere if",
    good: [
      "You want a companion whose persona you write and can keep running.",
      "You want to see what she remembers, delete a person or a room, and keep a backup.",
      "You already talk on Discord, Telegram, Slack, QQ, LINE, or your own site.",
      "You are fine doing a short setup, and paying for model usage and for hosting if she should stay online.",
    ],
    poor: [
      "You want to open a website, pick a public character, and chat with no setup.",
      "You need an automatic import of chats or characters from Character.AI or another app. Mochi does not have one.",
      "You need one memory that follows the same person across Discord and Telegram. Profiles are not linked.",
      "You need the model to run offline on your machine, or to paste an OpenAI, Anthropic or other provider key. Mochi talks to Flatkey only.",
      "You need a promise of perfect recall, or a promise that prompts never leave your server. Recall is partial, and each reply is sent to Flatkey.",
    ],
  },
  essay: {
    h2: "This page and the companion essay",
    body: "Own your AI companion is the longer post: why a character that lives on someone else’s server can change under you, and what self-hosting changes in practice. This page is the product. It says what Mochi does today, who it fits, and how to start. It does not repeat that post.",
    link: "Read: Own your AI companion",
  },
  faq: {
    h2: "Questions people ask before they switch",
    items: [
      {
        q: "Is Mochi a Character.AI alternative?",
        a: "It can be, if you want a companion you host yourself, with a persona you write and a memory you can inspect, delete and back up. It is not a hosted website with a public character catalog, and it does not replace logging into Character.AI.",
      },
      {
        q: "Is Mochi affiliated with Character.AI?",
        a: "No. Mochi is an independent open-source project. It is not affiliated with, endorsed by, or a product of Character.AI.",
      },
      {
        q: "Can I import my Character.AI chats or characters?",
        a: "No. Mochi does not import chats or characters from Character.AI or from other companion apps. A Mochi backup moves her own memory, knowledge files and settings between Mochi installs. It is not a converter for another product.",
      },
      {
        q: "Where is memory stored, and what is sent to the model?",
        a: "People, rooms, messages, knowledge files and settings are stored on the server you run: a SQLite file in Mochi’s data folder, or your own PostgreSQL database. The Mochi project does not receive that database. To write a reply, Mochi sends the request to Flatkey. The request includes the recent conversation, images when image reading is on, the persona, the room summary, profiles of people in those recent messages, and knowledge passages that matched. Web search, if you leave it on, also goes through Flatkey. There is no mode that runs the model on your machine.",
      },
      {
        q: "Can I inspect, edit, delete and back up memory?",
        a: "You can inspect every person and room on the Memory tab. You can delete one person or one room, and someone can say “forget me”. You can download a backup of memory, the knowledge base and settings, without keys or channel tokens, and import it later. Importing replaces that bot’s memory and knowledge. The dashboard does not have a field for rewriting one saved fact. Those notes change when a later memory update merges new messages, or when you import a backup. Name, personality, tone, backstory and rules are edited on the Persona tab.",
      },
      {
        q: "Will she remember everything?",
        a: "No. Each reply sees a recent window of that room, 20 messages unless you change it, plus the room summary and the profiles of people in that window. Older lines in the same room can be searched, up to 300 stored messages per room. Discord and Slack can backfill older history from the platform. Telegram, QQ and LINE cannot, so she only has messages she received. Memory updates run in the background every 12 messages per room unless you change that, using a separate model you can pick.",
      },
      {
        q: "Does one person share a memory across Discord and Telegram?",
        a: "No. A person is stored per bot, per platform and per account id. The same human on Discord and on Telegram is two profiles. Mochi does not link those accounts.",
      },
      {
        q: "Is Mochi free?",
        a: "The software is free under the MIT license. There is no Mochi subscription. You pay Flatkey for model usage. New Flatkey accounts get $1 in free credit. After that, replies, image reading, web search and memory updates draw from your balance. Failed model calls cost $0. Mainstream models are at least 20% below the makers’ official prices. If you put Mochi on a server so she stays online, that host bills you separately. On your own computer, the hosting cost is zero and she only answers while the computer is on.",
      },
      {
        q: "Can I use my own OpenAI key, or run the model offline?",
        a: "No. Mochi talks to Flatkey only. You cannot paste an OpenAI, Anthropic or other provider key, and the model does not run locally without a network. One Flatkey key is what chat, vision, search and memory all use. Any model in your Flatkey catalog can be selected in the dashboard. Mochi starts on a fast, low-cost DeepSeek model for chat, and you can change it.",
      },
      {
        q: "Which chat apps work?",
        a: "Discord, Telegram, Slack, QQ, LINE, and a widget on your own website. The dashboard has connect steps for each. Discord and Telegram also have written tutorials on this site. She can talk in private chats and in groups. She does not appear inside the Character.AI app.",
      },
      {
        q: "Does Mochi add its own content filter?",
        a: "Mochi adds no content filter of its own. Flatkey allows uncensored conversations between adults. Each model still has its own limits, and some hold back more than others. If one refuses, you can pick a different chat model in the dashboard. That is not a promise that any model will accept a given request, and it is not an uncensored or NSFW mode you can switch on. Adults only. Anything involving minors is never allowed.",
      },
    ],
  },
  final: {
    h2: "Start with the companion you can open",
    sub: "Follow the steps on this page, or the full setup guide. Bind a Flatkey key, write the persona, and connect one channel.",
  },
} as const;
