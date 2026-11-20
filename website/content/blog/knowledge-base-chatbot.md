---
title: "Set Up a Knowledge Base Chatbot Without a Subscription"
description: "A knowledge base chatbot answers from your docs, not a canned script. Here is how to set one up with Mochi, what it costs, and how to check the answers."
published: "2026-11-19"
updated: "2026-11-20"
keywords: ["knowledge base chatbot","Q&A chatbot","chatbot from your docs","self-hosted support bot"]
---

A knowledge base chatbot answers questions from your own documents: help articles, policies, product notes or class materials. It is not a canned FAQ tree, and it is not the same thing as a chat companion whose main job is to remember people.

You can set one up with [Mochi]({{github}}) without a monthly fee for the software. Mochi is open source under the MIT license. You host it yourself, add documents in the dashboard, and connect Discord, Telegram, Slack, QQ, LINE or a chat widget on your website. What you pay for is AI model usage through [Flatkey]({{flatkey}}), plus hosting if you are not running the bot on your own computer.

## What a knowledge base chatbot should do

The useful version of this bot reads the material you give it, pulls the passages that match a question, and answers from those passages instead of inventing a policy it never saw.

That is a different job from a group-chat companion, which is built to chat, remember people and join the room. In Mochi, start from the **Q&A / support bot** preset, or set the bot's **Type** in **Persona** to *Q&A / support*. That applies sensible defaults, which you can still change. If you would rather run a companion that lives on your side, that is a [separate post](/blog/own-your-ai-companion).

## What you actually pay for

**Model usage.** Replies are written by models from Flatkey, Mochi's only supported model provider: one key, one balance and one bill. Check Flatkey's current model prices before choosing a model; your costs depend on the model and the tokens used.

Retrieval itself does not add a separate search bill. Mochi looks up documents on your server, with no embedding calls. Matching passages then go into the prompt, so the amount of retrieved text affects model usage costs. Under **Models & abilities** you can turn memory, web search or image reading off, and set a **daily token budget** per bot. Once the budget is reached, the bot goes quiet until the next UTC day. **Usage & cost** shows tokens per day by bot, ability and model.

**Hosting.** On your own computer, the bot is online while the computer is on. For a bot that should stay up all day, put it on a server. [Deploy on Railway]({{railway}}) is one click; Railway bills its own usage to you. Other options are on the [deploy page]({{deploy}}).

This is not an offline, on-device model, and it does not take your own OpenAI key. Knowledge and memory stay on your server. To write a reply, Mochi still sends the conversation to the model through Flatkey.

## How to set up a knowledge base chatbot

The [setup guide]({{guide}}) and the [tutorial video]({{tutorial}}) walk through the install:

1. Install Mochi with the one-line installer on your computer, or deploy it on a server. The first time you open the dashboard, you choose an admin password.
2. Open **Flatkey API key**, create a key on [Flatkey]({{flatkey}}), paste it and click **Bind key**. Mochi verifies the key and stores it only on your server.
3. Click **New bot** and pick **Q&A / support bot**, or switch the first bot's type. In **Persona**, set the name, greeting, tone and any rules, such as when to hand off to a human.
4. Open **Knowledge base** and add what the bot should know.
5. Try questions in **Test retrieval**, then in **Playground**.
6. Connect a channel in **Channels**, or copy the website snippet.

You can add files (`.pdf`, `.docx`, `.md`, `.txt`, `.csv`, `.json`, `.html`), paste text, or import a public web page. Uploaded files can be up to 15 MB. A page import has to be a public URL; Mochi will not fetch a private or internal address. If a file has almost no extractable text, it is rejected, including scans that are only pictures of pages.

If you need the bot to stay inside your documents, turn on **Only answer from the knowledge base**. This mode is designed to restrict answers to your documents and use your fallback message when no relevant information is retrieved. Test both unsupported questions and misleading premises; this setting is not a guarantee that every answer will be correct. Web search is off in this mode. The dashboard walks you through each channel and checks the token before saving it. For the website widget, restrict it to your domains under **Allowed sites**.

## Where the bot can talk

The same knowledge base chatbot can live in the places people already ask questions. Connect each channel in **Channels**. If you want it in a Discord server, the [Discord AI chatbot](/blog/discord-ai-chatbot) post covers the token, Message Content Intent, and invite steps. If you want it in Telegram, the [Telegram AI chatbot](/blog/telegram-ai-chatbot) post covers the BotFather token and Group Privacy, which matters when the bot should use group memory.

## Where a knowledge base chatbot can still go wrong

Grounding is only as good as the documents and the lookup. Mochi does not use an embedding index. On the default SQLite database it uses full-text search with a trigram index, which works for English, Chinese, Japanese, Korean and more. If you run Mochi on PostgreSQL, lookup uses simpler text matching on the same terms. A question worded very differently from the doc may miss the right passage.

The bot also sees chunks, not always the whole manual at once. Long documents are split into overlapping passages of about 900 characters, and a few of the best matches are added to the prompt. If the important sentence sits in a poorly matched chunk, the reply can be incomplete.

Documents go stale when the real policy changes. Importing a web page is a snapshot of that page at the time you add it, not a live crawl. When something changes, add the new version and remove the outdated one from **Knowledge base**. If **Only answer from the knowledge base** is off, the model can go beyond your documents. For support, the strict setting is usually the safer default. Replies are not guaranteed to cite a filename in the chat. What you can inspect is retrieval.

## How to check the answers

**Test retrieval** shows which passages a question would pull up, without calling any model. Use the questions people actually ask, including paraphrases, and a few questions your docs do not cover. In strict mode, those last ones should not be answered from invented detail.

Then ask the same questions in **Playground**. Keep a short list of questions and the answers you expect, and run it again after you replace a document. That will catch empty retrieval, a missed synonym or a leftover policy. If retrieval looks weak, the fix is usually in the documents: clearer titles, the wording your users type, and one current version of each policy.

## Privacy, backups and updates

Memory and knowledge live on your side, in a local SQLite file (`data/mochi.db`) by default, or in your own PostgreSQL database if you deploy that way. Channel tokens and the Flatkey key stay on your server and are not included in a bot backup.

Each bot's **Memory** tab has **Download backup** and **Import backup**: one JSON file with what the bot remembers, its knowledge base, and its persona and settings. The **Storage** page warns when the data folder is a RAM disk or sits inside a container without a volume.

Mochi keeps the documents and the memory on your server, but it sends the conversation, including the matching passages, to Flatkey to get a reply. If you put the widget on a website, mention the first-party visitor cookie in your site's privacy or cookie notice.

## FAQ

**Is the software really free?**
Yes. Mochi is MIT-licensed. You pay for model usage on Flatkey, and for hosting if you use a server.

**Can I plug in my own OpenAI key?**
No. Mochi works with Flatkey only.

**Does the bot run entirely offline?**
No. You can host Mochi yourself, but replies still go through Flatkey.

**What can I put in the knowledge base?**
PDF, Word, Markdown, text, CSV, JSON and HTML files, pasted text, or a public web page. Files have a 15 MB limit and must contain extractable text.

**Can it live in Discord or Telegram?**
Yes. Connect those channels in **Channels**. See the [Discord](/blog/discord-ai-chatbot) and [Telegram](/blog/telegram-ai-chatbot) posts for the token and privacy steps that are specific to each platform.

**What if the bot is wrong?**
Check **Test retrieval** first. Then update or replace the document, and decide whether **Only answer from the knowledge base** should be on.

A knowledge base chatbot is worth running when you have documents you already trust, and you want people to ask them in the same places they already talk. Set it up, keep the docs current, and check the answers before you let it speak for you.
