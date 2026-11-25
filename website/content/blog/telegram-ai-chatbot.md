---
title: "Telegram AI Chatbot for Private Chats and Groups"
description: "A Telegram AI chatbot can live in your chats without a bot subscription. Here is how to set one up with Mochi, what it costs, and what the setup involves."
published: "2026-11-20"
updated: "2026-11-25"
keywords: ["telegram ai chatbot","telegram ai bot","ai chatbot for telegram","telegram chatgpt bot","telegram chatbot"]
---

A Telegram AI chatbot is a bot that talks with you in Telegram, in a private chat or in a group. It can answer questions, remember the people in the room, or stay in character as a regular. Many options are hosted services you add and pay a monthly plan for. You can also host one yourself.

[Mochi]({{github}}) is a free, open source (MIT) AI chatbot you run on your own computer or a server. You connect Telegram from a web dashboard, and the same bot can also join Discord, [Slack](/blog/ai-chatbot-for-slack), QQ, [LINE](/blog/line-ai-chatbot) or a [website chat widget](/blog/chatbot-widget). Model replies come from [Flatkey]({{flatkey}}), Mochi's only model provider. The software has no subscription fee. You pay for model usage, and for hosting if you want the bot online all day.

## What a Telegram AI chatbot can be

One group might want a friendly regular who remembers names. Another might want a bot that answers from a help doc. Those are different setups in Mochi, not different products.

If you want a companion you own, with a personality you write and a memory you can inspect, start from the companion preset and see the [self-hosted AI companion](/blog/own-your-ai-companion) post. If the main job is answering from documents, start from the Q&A / support bot preset. That path is in the [knowledge base chatbot](/blog/knowledge-base-chatbot) post. Either one can live in Telegram.

Mochi is not a ready-made bot you search for in Telegram and add. You host the process, you paste a token from [BotFather](https://t.me/BotFather), and you bind a Flatkey key. That is more setup than inviting a hosted bot. The tradeoff is that you can read the code, keep the memory on your server, and decide which model writes the replies.

## What you need before you connect Telegram

You need three things:

1. **Mochi running.** The [setup guide]({{guide}}) covers a one-line install on your computer. For a bot that should stay up all day, [deploy it on a server]({{deploy}}). [Railway]({{railway}}) is one click. The [tutorial video]({{tutorial}}) walks through the same path.
2. **A Flatkey key.** Open **Flatkey API key** in the dashboard, create a key on [Flatkey]({{flatkey}}), paste it and bind it. Mochi verifies the key and stores it only on your server. New Flatkey accounts get $1 in free credit. Mochi does not take your own OpenAI key.
3. **A Telegram bot token.** In the dashboard, open **Channels** and pick Telegram. The page has a step-by-step guide. You create the bot in a chat with [@BotFather](https://t.me/BotFather) by sending `/newbot`, pick a name and a username, then copy the token BotFather sends you.

Telegram's bot documentation says that token is the bot's unique identifier. Anyone who has it has full control of the bot, so paste it only into Mochi on a server you trust. Do not put it in a public chat or a screenshot.

The dashboard verifies the token with Telegram before saving it, then starts the bot. When you change the bot's public description in Mochi, that description is pushed to the Telegram profile (the description and the short description). For an avatar, upload it in BotFather with `/setuserpic`.

You can connect Telegram while trying Mochi on your own computer, but the bot is only online while that computer is on. The [deploy page]({{deploy}}) covers a host that stays up all day.

## How to set up a Telegram AI chatbot

1. Install Mochi on your computer, or deploy it on a server. The first time you open the dashboard, choose an admin password.
2. Bind your [Flatkey]({{flatkey}}) key.
3. Click **New bot** or use the first bot. In **Persona**, set the name, greeting, tone and rules, and pick the companion preset or the Q&A / support preset.
4. Open **Channels**, choose Telegram, and follow the in-dashboard guide: create the bot with BotFather, copy the token, and paste it to connect.
5. Open a private chat with the bot and send a test message. Telegram bots cannot start the first conversation; you have to message them, or add them to a group.
6. If the bot should remember a group conversation, turn Group Privacy off (see below), then add the bot to the group.
7. Optional: add documents in **Knowledge base**, and check questions in **Test retrieval** and **Playground**.

If a label in BotFather changes, trust the Channels page in the dashboard and [Telegram's bot docs](https://core.telegram.org/bots) over a blog post.

## Group chats and Group Privacy

In a private chat, a Telegram AI chatbot already sees the messages you send it. Groups are different. [Telegram's Privacy Mode](https://core.telegram.org/bots/features#privacy-mode) is on by default. In a group, a bot in Privacy Mode only sees messages meant for it, such as commands or replies to the bot. It does not see the rest of the conversation.

Mochi builds group memory from what happens in the room. For that to work, the Channels guide and the [Mochi README]({{github}}) both say to turn **Group Privacy** off: in BotFather, open your bot, then Bot Settings, Group Privacy, and Turn off. Telegram's docs also say that after you change this setting, you need to remove the bot from the group and add it again for the change to take effect.

Add the bot to a group by its username (you need permission to add members). Start in a test group you control, then check Mochi's **Memory** tab before you add it to a busy chat.

## Memory, knowledge and what you pay

Mochi remembers people and conversations, per person and per room. In the **Memory** tab you can see what was written down, forget a person or a room, and download or import a backup. Channel tokens and the Flatkey key are not included in that backup.

Knowledge files are optional. Add text, a document or a public web page, and the bot can look things up on your server. If it should stay inside those documents, turn on **Only answer from the knowledge base**. You can also turn image reading and web search off. Under **Models & abilities** you pick a model for each job and can set a **daily token budget**. Once the budget is reached, the bot goes quiet until the next UTC day.

Mochi itself is free under the MIT license. What costs money is the model that writes replies. Those models come from [Flatkey]({{flatkey}}), priced at least 20% below the model makers' official prices, with one key and one bill. Check current model prices on Flatkey before you choose a model. A server, including [Railway]({{railway}}), is billed by the host.

This is not an offline, on-device model. Memory and settings stay on your server. To write a reply, Mochi still sends the conversation to the model through Flatkey.

## How this differs from a hosted Telegram bot

Hosted Telegram AI bots are often easier to start: you sign up, get a username, and add that bot. Mochi asks you to host a process and to create your own bot with BotFather. That is a real cost in time.

What you get in return is control. You can run more than one bot on the same install, each with its own persona, knowledge, channels, memory, models and daily budget. The same bot can also talk in [Discord](/blog/discord-ai-chatbot), [Slack](/blog/ai-chatbot-for-slack), QQ, [LINE](/blog/line-ai-chatbot) or a [website widget](/blog/chatbot-widget). The code is MIT-licensed on [GitHub]({{github}}).

Some people search for a Telegram ChatGPT bot. Mochi can talk in Telegram with official models from Flatkey. It cannot use an OpenAI key you already have. If you only want to paste a ChatGPT key into a small script, this is a different kind of project.

## FAQ

**Do I need to know how to code?**
No. You install Mochi, bind a Flatkey key, and follow the Telegram guide in **Channels**.

**Does a Telegram AI chatbot work in private chats without changing Group Privacy?**
Yes. Privacy Mode affects groups. In a private chat, the bot already receives the messages you send it. Turn Group Privacy off when you want the bot to remember a group conversation.

**I turned Group Privacy off, but the bot still ignores the group.**
Telegram says the bot must be removed from the group and added again after that change. Check that you have permission to add members, and send a test message after re-adding it.

**Will it run if my computer is off?**
Not if Mochi is only running on that computer. Put it on a server if the bot should stay online all day. The [deploy page]({{deploy}}) lists the options.

**Can the same bot also talk in Slack or LINE?**
Yes. The same Mochi bot can join [Slack](/blog/ai-chatbot-for-slack), a [LINE AI chatbot](/blog/line-ai-chatbot) setup, Discord, QQ or a [website chatbot widget](/blog/chatbot-widget). LINE needs a public HTTPS address for its webhook, which is different from Telegram.

**Is the conversation private?**
Memory stays on your server. Replies still go through Flatkey, so the model provider sees the messages it answers.

A Telegram AI chatbot is worth hosting yourself when you already talk in Telegram, and you want the memory, the persona and the model choice under your control. Set it up, send a test message, and check the memory and the answers before you let it talk in a busy group.
