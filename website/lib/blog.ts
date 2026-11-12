/**
 * Blog posts (English only for now). Each post is plain data: sections with an optional heading,
 * paragraphs (HTML allowed for links and emphasis) and an optional list. The pages, the blog index,
 * the sitemap and the BlogPosting structured data all read from here.
 *
 * Facts in posts are checked against the code (memory, forget, channels, models per ability, daily
 * budget, backups). Keep the Flatkey disclosure and the privacy caveat in every post that pitches Mochi.
 */

export interface BlogSection {
  h?: string;
  p?: string[];
  list?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  /** Meta description and the line under the title on the index (about 150 characters). */
  description: string;
  /** ISO dates. */
  published: string;
  updated: string;
  minutes: number;
  /** Shown above the first section. */
  intro: string[];
  sections: BlogSection[];
  keywords: string[];
}

export const BLOG_PATH = "/blog";
export const postPath = (slug: string) => `${BLOG_PATH}/${slug}`;

export const POSTS: BlogPost[] = [
  {
    slug: "own-your-ai-companion",
    title: "Own your AI companion: why Mochi runs on your side, not someone else's",
    description:
      "Companion apps change models, add filters and raise prices. Mochi is an open source AI companion you run yourself, with memory you can see and a bill you control.",
    published: "2026-11-12",
    updated: "2026-11-12",
    minutes: 5,
    keywords: [
      "self-hosted AI companion",
      "AI companion you own",
      "Character.AI alternative",
      "open source AI chatbot",
      "AI chatbot with memory",
      "Discord AI companion",
    ],
    intro: [
      "If you have spent a few months with a companion app, you know the pattern. You get used to how a character talks, it starts to remember the things you care about, and then one update later it sounds different. The model changed, a filter arrived, the price went up, or the app closed. Everyone packs up and moves to the next one, and the history stays behind.",
      "None of that is about the character. It happens because the character lives on someone else's server, under someone else's plans. Mochi takes the other route: it's an open source companion you run yourself. Here is what that changes in practice, and what it costs you.",
    ],
    sections: [
      {
        h: "1. Nobody can change her or take her away",
        p: [
          "Mochi runs where you put it: on your own computer, on a small server you rent, or on a host like Render. The code is on GitHub under the MIT license, so you can read it, change it, and keep running the version you like for as long as you want.",
          "That also means there is no company deciding next month's personality. If a new model comes out, you choose whether to switch. If you like how she talks today, she can talk like that next year.",
        ],
      },
      {
        h: "2. Memory you can actually see",
        p: [
          "Mochi remembers people, not just the last few messages. For each person she builds a short profile: how they talk, facts they mentioned, what they're into. For each chat room she keeps a running summary and the topics that came up recently. When she can't fit an older conversation into the reply, she can search further back in that room's history.",
          "The difference from an app is that all of it is in front of you. The dashboard's Memory page lists every person and room she knows, and what she has written down about each. You stay in control of it:",
        ],
        list: [
          "<b>Forget one person or one room</b> with a button, without wiping anything else. Anyone can also just tell her \"forget me\".",
          "<b>Download a backup</b> of everything she remembers, her knowledge files and her settings as one file, and import it again on another machine or into another bot.",
          "<b>Keep the data where you want it:</b> a file in Mochi's data folder on your computer by default, or your own PostgreSQL database if you'd rather run her in the cloud.",
        ],
      },
      {
        p: [
          "In a group chat she keeps track of everyone separately, so the friend who loves cats and the friend who's always job hunting don't get blended into one person.",
        ],
      },
      {
        h: "3. You write the personality",
        p: [
          "Her name, avatar, greeting, tone and backstory are all fields in the dashboard, not a hidden prompt someone else maintains. You can start from the Mochi preset or a blank bot, and if you want full control there's a custom prompt that replaces the generated one entirely.",
          "Lore and backstory can go in as knowledge files: drop in text, documents or a web page and she'll look things up in them when they're relevant, instead of you cramming everything into one giant prompt.",
        ],
      },
      {
        h: "4. She lives where your friends already are",
        p: [
          "Mochi isn't another app to open. She joins the places you already talk:",
        ],
        list: [
          "<b>Discord</b> and <b>Telegram</b>, in DMs or in a server with your friends",
          "<b>Slack</b>, <b>QQ</b> and <b>LINE</b>",
          "<b>Your own website</b>, as a chat window with an animated character who peeks in from the edge of the page and jumps out when someone opens the chat",
        ],
      },
      {
        p: [
          "She can also look at pictures people send and search the web when a question needs current information. You can turn each of those off per bot.",
        ],
      },
      {
        h: "5. You pay for what you use, not a subscription",
        p: [
          "Mochi itself is free. What costs money is the AI model that writes her replies, and you pay for that per use instead of per month. Mochi runs on AI tokens from <a href=\"https://flatkey.ai\">Flatkey</a>, priced at least 20% below the model makers' official prices, and new Flatkey accounts get $1 in free credit to try it.",
          "You also decide how much each part costs. Chat, reading images, updating memory and web search each have their own model setting, so you can keep a cheap, fast model for everyday chat and a stronger one only where it matters. A daily token budget per bot puts a hard ceiling on what a busy day can cost.",
        ],
      },
      {
        h: "What you give up",
        p: ["Running your own companion isn't free of catches, and you should know them before you start:"],
        list: [
          "<b>Some setup.</b> It isn't an app store download. The setup guide and the tutorial video walk you through every step, and there's a prompt you can paste into ChatGPT or Claude so it guides you as you go.",
          "<b>She's awake when her host is.</b> On your own computer, she sleeps when the computer does. For a bot that's online around the clock, put her on a small server.",
          "<b>Your messages still go to an AI model.</b> Mochi keeps the memory on your side, but to write a reply it sends the conversation to the model through Flatkey. There's no app keeping a profile of you, but the model provider does see the messages it answers.",
          "<b>One provider.</b> Mochi works with Flatkey only, the platform this project comes from. That's how the project pays for itself. Replies follow the content rules of the models behind it.",
        ],
      },
      {
        h: "How to start",
        list: [
          "Get a Flatkey key. New accounts come with $1 in free credit.",
          "Install Mochi with one command on your computer, or put it on a server (Render takes one click).",
          "Open the dashboard, paste the key, give her a personality, and connect Discord, Telegram or any of the others.",
        ],
      },
      {
        p: [
          "The <a href=\"/#get-started\">setup guide</a> has every step for Mac, Windows and servers, with the tutorial video. If you get stuck, open an issue on <a href=\"https://github.com/AM-young-fun/Mochi-ai-chatbot\">GitHub</a>.",
        ],
      },
    ],
  },
];

export const postBySlug = (slug: string) => POSTS.find((p) => p.slug === slug);
