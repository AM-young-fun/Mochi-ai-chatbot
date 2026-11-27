---
title: "AI Chatbot with Memory You Can Inspect"
description: "An AI chatbot with memory can remember people and rooms without a bot subscription. Here is how Mochi stores it, what you can see, and what it costs."
published: "2026-11-27"
updated: "2026-11-27"
keywords: ["ai chatbot with memory","chatbot with memory","chatbot memory you can inspect","self-hosted chatbot memory"]
---

A long context window is not the same thing as an AI chatbot with memory. A context window is the text the model can see in one reply. Memory is what still matters in the next conversation, after those older lines no longer fit.

[Mochi]({{github}}) is a free, open source (MIT) AI chatbot you host yourself. It remembers each person in a chat and what each room talks about, and you can open that record in the dashboard. Model replies come from [Flatkey]({{flatkey}}), Mochi's only model provider. The software has no subscription fee. You pay for model usage, and for hosting if the bot should stay online all day.

## What an AI chatbot with memory actually stores

Mochi does not treat a full transcript as memory. For each person it keeps a short profile: how they talk, facts they have shared about themselves, and what they are interested in. For each room it keeps a running summary and the topics that came up recently.

Those profiles and summaries are what get added to later replies, along with the last stretch of messages in that room and, when it is relevant, passages from a [knowledge base](/blog/knowledge-base-chatbot) you uploaded. If an older line is no longer in that recent window, the bot can also look back through messages it already stored for that room.

Two limits are worth stating plainly. Only facts people share about themselves are kept, and sensitive traits are excluded. Memory is also scoped per bot, and people are remembered in the chats where they appear. This article does not claim that talking to the same bot in Discord and in Slack automatically merges those two accounts into one person.

## How memory is updated

A small background model updates memory. It does not run on every message. It runs once per room every N messages, and the default is 12. Each of those updates is one call to the memory model, written as structured data: the room summary and topics, plus each person's personality, facts and interests.

You can change that frequency under **Models & abilities**, or turn memory off if a bot should only answer from the current conversation and your documents. Changes apply immediately. New bots use a fast DeepSeek model for chat and memory, and you can point memory at a different model from the same dropdown. Check current prices on Flatkey before you choose.

The persona you wrote still leads the reply. Memory sits beside it, not in place of it. If you want the companion-app version of this story, including what changes when you host the character yourself, see the [self-hosted AI companion](/blog/own-your-ai-companion) post.

## Memory you can see and control

The difference from a hosted assistant is that the record is in front of you. The dashboard's **Memory** tab lists every person and room the bot knows, and what it has written down about each.

You stay in control of it:

- Anyone can tell the bot **forget me**, which erases that person's profile and messages.
- An admin can forget one person, delete a room, or delete a whole bot from the dashboard, without having to wipe everything else.
- **Download backup** and **Import backup** give you one JSON file with the people, rooms and recent messages, plus the bot's knowledge files, persona and settings. Channel tokens and the Flatkey key are never in that file. Use it to move a bot, or to carry memory across a restart on a host without persistent storage.

By default, memory and knowledge live in one SQLite file, `data/mochi.db`, on your server. You can also point Mochi at your own PostgreSQL database. Either way, the data stays in a store you control.

That is not the same as an offline bot. Memory stays on your server. To write a reply, Mochi still sends the conversation to the model through Flatkey, so the model provider sees the messages it answers.

## What you actually pay for

Mochi itself is free under the MIT license. What costs money is the model usage. Those models come from [Flatkey]({{flatkey}}), priced at least 20% below the model makers' official prices, with one key and one bill. New Flatkey accounts get $1 in free credit. That is the only offer to mention. Mochi does not take your own OpenAI key.

Memory adds cost only when it is on: one memory-model call per room every N messages. Retrieval from your knowledge files does not add a separate model call, though matching passages take a little space in the prompt. Web search and image reading are separate abilities, each with their own model, and you can turn them off.

A **daily token budget** per bot puts a hard ceiling on a busy day. Once it is reached, the bot goes quiet until the next UTC day, with no further model calls. **Usage & cost** in the dashboard shows tokens per day, broken down by bot, ability and model.

## Where the same memory can be used

The same bot, with the same memory store, can talk in [Discord](/blog/discord-ai-chatbot), [Telegram](/blog/telegram-ai-chatbot), [Slack](/blog/ai-chatbot-for-slack), [LINE](/blog/line-ai-chatbot), [QQ](/blog/qq-ai-chatbot), and a [chatbot widget](/blog/chatbot-widget) on your own website. Setup for each channel is in those posts.

What the bot can remember still depends on what it has actually seen. Discord and Slack can backfill older channel history after you add the bot. Telegram, QQ and LINE have no history API for the bot, so only messages it witnessed are there. On Telegram, group memory also needs **Group Privacy** turned off in BotFather, or the bot will not see ordinary group messages.

On a website, a returning visitor is remembered after the first message. Mochi stores a random id in localStorage and in a first-party cookie on your domain, and files memory under that id. Because a cookie is involved, mention it in your site's privacy or cookie notice.

## How to set it up

1. Install Mochi on your computer or on a server. The [setup guide]({{guide}}) covers the one-line install, and the [deploy]({{deploy}}) page covers keeping it online, including one-click [Railway]({{railway}}). The [tutorial video]({{tutorial}}) walks through the same path.
2. Bind a [Flatkey]({{flatkey}}) key in the dashboard. Mochi verifies it and stores it only on your server.
3. Create a bot, or keep the first Mochi bot, and write its persona.
4. Leave memory on, or turn it off, under **Models & abilities**. Set the update frequency if you want it to run more or less often than every 12 messages.
5. Connect a channel, send a few messages, then open the **Memory** tab and check what was written down. If something should not be there, forget that person or tell the bot "forget me".

For a bot whose main job is answering from documents, start with the [knowledge base chatbot](/blog/knowledge-base-chatbot) post. Memory and a knowledge base can be used together. They are not the same thing: one is a profile of people and rooms, the other is lookup over files you uploaded.

## FAQ

**Is a long context window enough?**
No. A context window only covers what fits in one reply. An AI chatbot with memory keeps a shorter, updated record for the next conversation, after those older lines have dropped out.

**Can I see and delete what it remembers?**
Yes. The **Memory** tab lists people and rooms. Anyone can say "forget me". An admin can forget one person, delete a room or delete a bot, and can download or import a backup.

**Does the memory stay only on my computer?**
Memory stays in your SQLite file or PostgreSQL database. Replies still go through Flatkey, so the model provider sees the messages it answers. This is not an offline, on-device model.

**Will it remember me across Discord and Slack?**
The same bot can talk in both, and it has one memory store. This article does not claim that your Discord account and your Slack account are automatically treated as one person. People are remembered in the chats where they appear.

**What does memory cost?**
One memory-model call per room every N messages, with a default of 12, and only while memory is turned on. You can pick a cheaper model for that job and set a daily token budget. Check current prices on Flatkey.

An AI chatbot with memory is worth hosting yourself when you want the record in front of you, on a server you control, and you want to decide how often it is updated and what it costs. Send a few test messages, open the Memory tab, and correct it before you trust it in a busy room.
