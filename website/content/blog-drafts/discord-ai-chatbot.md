---
title: "Discord AI Chatbot You Host on Your Own Server"
description: "A Discord AI chatbot can live in your server without a bot subscription. Here is how to set one up with Mochi, what it costs, and what setup actually involves."
published: ""
updated: ""
keywords: ["discord ai chatbot","discord ai bot","ai chatbot for discord","self-hosted ai chatbot","discord chatgpt bot"]
---

A Discord AI chatbot is a bot that talks in your Discord server. It can answer questions, remember the people in the room, or stay in character as a group regular. Many options are hosted services you invite and pay a monthly plan for. You can also host one yourself.

[Mochi]({{github}}) is a free, open source (MIT) AI chatbot you run on your own computer or a server. You connect Discord from a web dashboard, and the same bot can also join Telegram, Slack, QQ, LINE or a website chat widget. Model replies come from [Flatkey]({{flatkey}}), Mochi's only model provider. The software has no subscription fee. You pay for model usage, and for hosting if you want the bot online all day.

## What a Discord AI chatbot can be

People look for a Discord AI chatbot for different jobs. One server might want a friendly regular who remembers names. Another might want a bot that answers from a help doc. Those are different setups in Mochi, not different products.

If you want a companion you own, with a personality you write and a memory you can inspect, start from the companion preset and see the [self-hosted AI companion](/blog/own-your-ai-companion) post. If the main job is answering from documents, start from the Q&A / support bot preset. That path is in the [knowledge base chatbot](/blog/knowledge-base-chatbot) post. Either one can live in Discord.

Mochi is not a drop-in invite from a bot marketplace. You host the process, you paste a Discord bot token, and you bind a Flatkey key. That is more setup than adding a hosted bot to your server. The tradeoff is that you can read the code, keep the memory on your server, and decide which model writes the replies.

## What you need before you connect Discord

You need three things:

1. **Mochi running.** The [setup guide]({{guide}}) covers a one-line install on your computer. For a bot that should stay up all day, [deploy it on a server]({{deploy}}). [Railway]({{railway}}) is one click. The [tutorial video]({{tutorial}}) walks through the same path, including chatting on Discord.
2. **A Flatkey key.** Open **Flatkey API key** in the dashboard, create a key on [Flatkey]({{flatkey}}), paste it and bind it. Mochi verifies the key and stores it only on your server. New Flatkey accounts get $1 in free credit. Mochi does not take your own OpenAI key.
3. **A Discord bot token.** In the dashboard, open **Channels** and pick Discord. The page has a step-by-step guide. You will need a bot token from Discord's developer portal, and you need to turn on **Message Content Intent**. Mochi checks for that intent. After the token is saved, you get an invite link to add the bot to your server.

The dashboard verifies the token with Discord before saving it, then starts the bot. You can pause and resume the channel with a toggle. If you also want an avatar on the Discord bot, upload it in Discord's developer portal under Bot. When you change the bot's public description in Mochi, that description is pushed to the Discord application description.

You can connect Discord while trying Mochi on your own computer. In that case the bot is only in the server while the computer is on. LINE and the website widget need a public HTTPS address. The [deploy page]({{deploy}}) explains what a host needs if you want the bot online all day.

## How to set up a Discord AI chatbot

1. Install Mochi on your computer, or deploy it on a server. The first time you open the dashboard, choose an admin password.
2. Bind your [Flatkey]({{flatkey}}) key.
3. Click **New bot** or use the first bot. In **Persona**, set the name, greeting, tone and rules. Pick the companion preset or the Q&A / support preset to match the job.
4. Open **Channels**, choose Discord, and follow the in-dashboard guide: bot token, Message Content Intent, then the invite link.
5. Send the bot a test message in Discord.
6. Optional: add documents in **Knowledge base**, and check questions in **Test retrieval** and **Playground**.

That is the documented path. If a click in Discord's developer portal changes, trust the Channels page in the dashboard over a blog post.

## Memory, knowledge and models

Mochi remembers people and conversations, per person and per room. In a group, that keeps two members from being blended into one profile. You can open the **Memory** tab, see what was written down, forget one person or one room, and download or import a backup. Channel tokens and the Flatkey key are not included in a bot backup.

Knowledge files are optional. Drop in text, a document or a public web page and the bot can look things up when they are relevant. Retrieval happens on your server. If you need the bot to stay inside those documents, turn on **Only answer from the knowledge base**.

The bot can also read images people send and search the web when a question needs current information. You can turn each of those off per bot. Under **Models & abilities** you pick a model for chat, image reading, memory updates and web search, and you can set a **daily token budget**. Once the budget is reached, the bot goes quiet until the next UTC day. **Usage & cost** shows tokens per day by bot, ability and model.

## What you actually pay for

Mochi itself is free under the MIT license. What costs money is the model that writes replies. Those models come from [Flatkey]({{flatkey}}), priced at least 20% below the model makers' official prices, with one key and one bill. Check current model prices on Flatkey before you choose a model. Your costs depend on the model and the tokens used.

If you run Mochi on your own computer, there is no hosting bill, but the Discord bot is only online while the computer is on. A server, including [Railway]({{railway}}), is billed by the host.

This is not an offline, on-device model. Memory and settings stay on your server. To write a reply, Mochi still sends the conversation to the model through Flatkey.

## How this differs from a hosted Discord bot

Hosted Discord AI bots are often easier to start: you sign up, invite a shared app, and you are in the server. Mochi asks you to host a process and to create a Discord bot token. That is a real cost in time.

What you get in return is control. You can run more than one bot on the same Mochi install, each with its own persona, knowledge, channels, memory, models and daily budget. The same bot can also talk in Telegram, Slack, QQ, LINE or a website widget, instead of being a Discord-only guest. The code is MIT-licensed on [GitHub]({{github}}).

Some people search for a Discord ChatGPT bot. Mochi can talk in Discord with official models from Flatkey. It cannot use an OpenAI key you already have. If you only want to paste a ChatGPT key into a small script, this is a different kind of project.

## FAQ

**Do I need to know how to code?**
No. You install Mochi, bind a Flatkey key, and follow the Discord guide in **Channels**.

**Can I add it with one click, like a public Discord bot listing?**
You still create a Discord bot token and invite that bot to your server. Mochi gives you the invite link after the token is verified. There is some setup.

**Will it run if my computer is off?**
Not if Mochi is only running on that computer. Put it on a server if the Discord bot should stay in the server all day. The [deploy page]({{deploy}}) lists the options.

**Does a Discord AI chatbot work in DMs and in a server?**
Yes. Mochi can join Discord in DMs or in a server.

**Can the same bot also talk in Telegram?**
Yes. Connect another channel in **Channels**. Telegram needs a token from BotFather. For group memory on Telegram, turn Group Privacy off.

**Is the conversation private?**
Memory stays on your server. Replies still go through Flatkey, so the model provider sees the messages it answers.

A Discord AI chatbot is worth hosting yourself when you want the bot in a server you already use, and you want the memory, the persona and the model choice under your control. Set it up, send a test message, and check the memory and the answers before you let it talk to the whole room.
