---
title: "AI Chatbot for Slack Without a Bot Subscription"
description: "An AI chatbot for Slack can live in your workspace without a bot subscription. Here is how to set one up with Mochi, what it costs, and what setup involves."
published: ""
updated: ""
keywords: ["ai chatbot for slack","slack chatgpt bot","slack chatbot","slack ai bot","slack ai chatbot"]
---

An AI chatbot for Slack is a bot that talks in your Slack workspace, in a direct message or in a channel. It can answer questions, remember the people in the room, or stay in character as a regular. Many options are hosted services you install and pay a monthly plan for. You can also host one yourself.

[Mochi]({{github}}) is a free, open source (MIT) AI chatbot you run on your own computer or a server. You connect Slack from a web dashboard, and the same bot can also join Discord, Telegram, QQ, LINE or a website chat widget. Model replies come from [Flatkey]({{flatkey}}), Mochi's only model provider. The software has no subscription fee. You pay for model usage, and for hosting if you want the bot online all day.

## What an AI chatbot for Slack can be

People look for an AI chatbot for Slack for different jobs. One workspace might want a friendly regular who remembers names. Another might want a bot that answers from a help doc. Those are different setups in Mochi, not different products.

If you want a companion you own, with a personality you write and a memory you can inspect, start from the companion preset and see the [self-hosted AI companion](/blog/own-your-ai-companion) post. If the main job is answering from documents, start from the Q&A / support bot preset. That path is in the [knowledge base chatbot](/blog/knowledge-base-chatbot) post. Either one can live in Slack.

Mochi is not a ready-made Slack app you add from the Slack Marketplace. You host the process, you paste two Slack tokens, and you bind a Flatkey key. That is more setup than installing a hosted bot. The tradeoff is that you can read the code, keep the memory on your server, and decide which model writes the replies.

## What you need before you connect Slack

You need three things:

1. **Mochi running.** The [setup guide]({{guide}}) covers a one-line install on your computer. For a bot that should stay up all day, [deploy it on a server]({{deploy}}). [Railway]({{railway}}) is one click. The [tutorial video]({{tutorial}}) walks through the same path.
2. **A Flatkey key.** Open **Flatkey API key** in the dashboard, create a key on [Flatkey]({{flatkey}}), paste it and bind it. Mochi verifies the key and stores it only on your server. New Flatkey accounts get $1 in free credit. Mochi does not take your own OpenAI key.
3. **Two Slack tokens.** In the dashboard, open **Channels** and pick Slack. The page has a step-by-step guide and lists the scopes the app needs. You paste a bot token (it starts with `xoxb-`) and an app-level token (it starts with `xapp-`).

Those tokens are secrets. Paste them only into Mochi on a server you trust. Do not put them in a public channel, a screenshot, or a shared document.

The dashboard verifies the tokens with Slack before saving them, then starts the bot. You can also put `SLACK_BOT_TOKEN` and `SLACK_APP_TOKEN` in a `.env` file; those values apply to your first bot. The [Mochi README]({{github}}) describes both paths.

You can connect Slack while trying Mochi on your own computer. Because Mochi uses Slack's [Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode), the bot does not need a public HTTPS address to receive Slack events. The bot is still only online while that computer is on and Mochi is running. The [deploy page]({{deploy}}) covers a host that stays up all day.

## How to set up an AI chatbot for Slack

1. Install Mochi on your computer, or deploy it on a server. The first time you open the dashboard, choose an admin password.
2. Bind your [Flatkey]({{flatkey}}) key.
3. Click **New bot** or use the first bot. In **Persona**, set the name, greeting, tone and rules, and pick the companion preset or the Q&A / support preset.
4. Open **Channels**, choose Slack, and follow the in-dashboard guide: create a Slack app, turn on Socket Mode, add the scopes the page lists, then paste the bot token and the app-level token.
5. Invite the bot into a test channel or open a direct message with it, and send a test message.
6. Optional: add documents in **Knowledge base**, and check questions in **Test retrieval** and **Playground**.

If a label in Slack's app settings changes, trust the Channels page in the dashboard and [Slack's Socket Mode docs](https://docs.slack.dev/apis/events-api/using-socket-mode) over a blog post.

## Socket Mode, and why there is no public URL

Many Slack bots need a public Request URL so Slack can send events to them. Mochi does not work that way. It uses [Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode), which Slack documents as a way to use the Events API without exposing a public HTTP endpoint. That is why you can try the bot on a laptop that is not reachable from the internet.

Slack also documents two limits that come with this design. Socket Mode is for apps that use granular permissions. And apps that use Socket Mode are not currently allowed in the public Slack Marketplace. If you wanted a listing people can install from the Marketplace, this setup is the wrong path.

The Channels guide in the dashboard is the place to copy scopes and token steps. This post does not invent a click path through Slack's app settings, because those labels can move.

## Memory, knowledge and what you pay

Mochi remembers people and conversations, per person and per room. In the **Memory** tab you can see what was written down, forget a person or a room, and download or import a backup. Channel tokens and the Flatkey key are not included in that backup.

For Slack, older channel history can also be backfilled from the platform. That is a difference from Telegram, QQ and LINE, which have no history API for the bot, so those channels only have messages the bot actually received.

Knowledge files are optional. Add text, a document or a public web page, and the bot can look things up on your server. If it should stay inside those documents, turn on **Only answer from the knowledge base**. You can also turn image reading and web search off. Under **Models & abilities** you pick a model for each job and can set a **daily token budget**. Once the budget is reached, the bot goes quiet until the next UTC day.

Mochi itself is free under the MIT license. What costs money is the model that writes replies. Those models come from [Flatkey]({{flatkey}}), priced at least 20% below the model makers' official prices, with one key and one bill. Check current model prices on Flatkey before you choose a model. A server, including [Railway]({{railway}}), is billed by the host.

This is not an offline, on-device model. Memory and settings stay on your server. To write a reply, Mochi still sends the conversation to the model through Flatkey.

## How this differs from a hosted Slack bot

Hosted Slack bots and a Slack ChatGPT bot you install from a marketplace are often easier to start: you sign in, approve an app, and it appears in the workspace. Mochi asks you to host a process and to create your own Slack app. That is a real cost in time.

What you get in return is control. You can run more than one bot on the same install, each with its own persona, knowledge, channels, memory, models and daily budget. The same bot can also talk in [Discord](/blog/discord-ai-chatbot), [Telegram](/blog/telegram-ai-chatbot), QQ, LINE or a [website chatbot widget](/blog/chatbot-widget). The code is MIT-licensed on [GitHub]({{github}}).

Some people search for a Slack ChatGPT bot. Mochi can talk in Slack with official models from Flatkey. It cannot use an OpenAI key you already have. If you only want to paste a ChatGPT key into a small script, this is a different kind of project.

## FAQ

**Do I need to know how to code?**
No. You install Mochi, bind a Flatkey key, and follow the Slack guide in **Channels**.

**Does an AI chatbot for Slack need a public website address?**
No. Mochi uses Slack Socket Mode, so Slack does not need to reach a public Request URL. The bot still has to be running, so a laptop that is asleep will not answer.

**Can I list this bot in the Slack Marketplace?**
Not with this setup. Slack says apps that use Socket Mode are not currently allowed in the public Slack Marketplace.

**Will it run if my computer is off?**
Not if Mochi is only running on that computer. Put it on a server if the bot should stay online all day. The [deploy page]({{deploy}}) lists the options.

**Is the conversation private?**
Memory stays on your server. Replies still go through Flatkey, so the model provider sees the messages it answers.

An AI chatbot for Slack is worth hosting yourself when your team already talks in Slack, and you want the memory, the persona and the model choice under your control. Set it up, send a test message, and check the memory and the answers before you let it talk in a busy channel.
