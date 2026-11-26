---
title: "QQ AI Chatbot You Create on the Open Platform"
description: "A QQ AI chatbot can live in groups and private chats without a bot subscription. Here is how to set one up with Mochi, what it costs, and what QQ limits."
published: ""
updated: ""
keywords: ["qq ai chatbot","qq bot","qq chatbot","ai chatbot for qq"]
---

A QQ AI chatbot talks with people in QQ groups, private chats and QQ guild channels. It can answer questions, remember the people in the room, or stay in character as a regular. People looking for a QQ bot often want that kind of assistant without paying a monthly fee for the bot software. You can host one yourself.

[Mochi]({{github}}) is a free, open source (MIT) AI chatbot you run on a computer or server you control. You connect QQ from a web dashboard using the official [QQ Bot Open Platform](https://q.qq.com/). You do not need a QQ client. The same bot can also join [Discord](/blog/discord-ai-chatbot), [Telegram](/blog/telegram-ai-chatbot), [Slack](/blog/ai-chatbot-for-slack), [LINE](/blog/line-ai-chatbot) or a [website chat widget](/blog/chatbot-widget). Model replies come from [Flatkey]({{flatkey}}), Mochi's only model provider. The software has no subscription fee. You pay for model usage, and for hosting if you want the bot online all day.

## What a QQ AI chatbot can be

One group might want a friendly regular who remembers names. Another might want a bot that answers from a help doc. Those are different setups in Mochi, not different products.

If you want a companion you own, with a personality you write and a memory you can inspect, start from the companion preset and see the [self-hosted AI companion](/blog/own-your-ai-companion) post. If the main job is answering from documents, start from the Q&A / support bot preset. That path is in the [knowledge base chatbot](/blog/knowledge-base-chatbot) post. Either one can live on QQ.

Mochi is not a ready-made QQ bot you search for and add. You host the process, create a bot on the Open Platform, and bind a Flatkey key. You do not have to write QQ Bot API code. Mochi uses that official API for you.

## What you need before you connect QQ

Unlike LINE, QQ does not require a public HTTPS address just to receive messages. Mochi keeps a live WebSocket connection to the official gateway, in the same spirit as Slack's Socket Mode. A public URL is optional, and only needed if you also turn on QQ's HTTP callback.

You need three things:

1. **Mochi running on a computer or server.** The [setup guide]({{guide}}) and [tutorial video]({{tutorial}}) cover the install path. For a bot that should stay up all day, [deploy it on a server]({{deploy}}). [Railway]({{railway}}) is one click.
2. **A Flatkey key.** Open **Flatkey API key** in the dashboard, create a key on [Flatkey]({{flatkey}}), paste it and bind it. Mochi verifies the key and stores it only on your server. New Flatkey accounts get $1 in free credit. Mochi does not take your own OpenAI key.
3. **An AppID and AppSecret from the QQ Bot Open Platform.** In the dashboard, open **Channels** and pick QQ. The page has the current steps. If a label on q.qq.com changes, trust the Channels page and [QQ's official bot docs](https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/event-emit.html) over a blog post.

The Channels guide currently starts at [q.qq.com](https://q.qq.com/): sign in, create a bot (创建机器人), then open **开发管理 (Development)**. Copy the **AppID** and generate the **AppSecret**. On the same page, add this server's public IP to the **IP白名单 (IP allowlist)**. QQ blocks API calls from other IPs. If your host's public IP changes, update the allowlist or those calls will start failing.

Under **沙箱配置 (Sandbox)**, add your QQ account and a test group so you can try the bot before it is published. Paste the AppID and AppSecret into Mochi and connect. The dashboard verifies the credentials with QQ before saving them. Anyone who has the AppSecret can act as that bot, so paste it only into Mochi on a server you trust.

## How to set up a QQ AI chatbot

1. Install Mochi or deploy it on a server, then bind your [Flatkey]({{flatkey}}) key.
2. Create or open a bot and set its persona, or start from the companion or Q&A / support preset.
3. Open **Channels**, choose QQ, and follow the in-dashboard guide to copy the AppID, generate the AppSecret, and add your server's public IP to the allowlist.
4. Add your account and a test group in the sandbox, then paste the AppID and AppSecret and connect.
5. @ the bot in the test group, or send it a private message. Optional: add documents in **Knowledge base**.

## Groups, memory, and an optional callback

By default, QQ only delivers group messages that @ the bot. That is also all the bot can remember from the group. So the bot can follow the whole group chat, the group owner opens the group's settings in the latest mobile QQ, opens the bot, and sets **机器人可获取的群聊消息范围** to **获取群内全部消息**. Without that setting, only @-mentions arrive.

QQ has no history API for bots, so Mochi only has messages the bot actually received. Discord and Slack can backfill older channel history; QQ cannot, and neither can Telegram or LINE. Start in a sandbox group you control, then check Mochi's **Memory** tab before you add the bot to a busy group.

The WebSocket gateway is enough for everyday use, and it does not need a public URL. After the bot is connected, you can also let QQ deliver events by HTTP callback. On q.qq.com, open **开发管理 → 回调配置 (Callback)**, set the callback URL to the address shown in Mochi (`/webhook/qq/` plus the bot id), tick every group and private-chat message event offered (including any 全部消息 / all-messages event), and save. QQ checks the URL right away. [QQ's webhook docs](https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/event-emit/webhook.html) say the callback must be public HTTPS on port 443, 80, 8080 or 8443. Mochi verifies the signature on those requests. The gateway connection keeps working alongside the callback, and a message that arrives both ways is answered once.

Replies on QQ quote the incoming message and must go out within five minutes. Mochi does this for you. Messages the bot starts itself, such as a scheduled message, are metered by QQ and can be refused unless the person or group owner allows the bot to send on its own. URLs in replies are blocked unless the domain is registered on the platform, so Mochi rewrites links as plain text.

Mochi can read images people send on QQ. Voice replies work in groups and private chats. Voice on QQ guild channels is text only for now. QQ does not let a bot change its profile through the API, so the persona description is not synced the way it is on Telegram and Discord.

## Memory, knowledge and what you pay

Mochi remembers people and conversations, per person and per room. In the **Memory** tab you can inspect what was written down, forget a person or a room, and download a backup. Channel tokens and the Flatkey key are not included in that backup. Knowledge files are optional; turn on **Only answer from the knowledge base** if the bot should stay inside your documents. Under **Models & abilities** you can set a **daily token budget**. Once it is reached, the bot goes quiet until the next UTC day.

Mochi itself is free under the MIT license. What costs money is the model that writes replies, and the host if you use one. The models come from [Flatkey]({{flatkey}}), priced at least 20% below the model makers' official prices, with one key and one bill. A server, including [Railway]({{railway}}), is billed by the host. This is not an offline, on-device model. Memory stays on your server, but Mochi still sends the conversation to the model through Flatkey to write a reply.

## How this differs from a hosted QQ bot

Hosted QQ bots are often easier to start: you sign up, connect a bot, and the vendor keeps the process running. Mochi asks you to host a process and to create your own bot on the Open Platform. That takes more time. In return you can run more than one bot on the same install, each with its own persona, knowledge, channels, memory, models and daily budget. The same bot can also talk in [Discord](/blog/discord-ai-chatbot), [Telegram](/blog/telegram-ai-chatbot), [Slack](/blog/ai-chatbot-for-slack), [LINE](/blog/line-ai-chatbot) or a [website chatbot widget](/blog/chatbot-widget). The code is MIT-licensed on [GitHub]({{github}}).

Mochi can talk on QQ with official models from Flatkey. It cannot use an OpenAI key you already have.

## FAQ

**Do I need to know how to code?**
No. You install Mochi, bind a Flatkey key, and follow the QQ guide in **Channels**.

**Do I need a public HTTPS URL for a QQ AI chatbot?**
Not for the default setup. Mochi receives QQ events over the official WebSocket gateway. A public HTTPS URL is only required if you also set the optional HTTP callback, and then it must use one of the ports QQ allows. The [deploy page]({{deploy}}) lists hosting options.

**Why does the bot only answer when someone @ it in a group?**
QQ is only sending those messages. The group owner can set **机器人可获取的群聊消息范围** to **获取群内全部消息** in the latest mobile QQ app.

**The dashboard cannot reach QQ, or the credentials are rejected.**
First check the AppID and AppSecret, and that this server's public IP is on the platform's IP allowlist. If the computer running Mochi only reaches QQ through a proxy or VPN app, see the troubleshooting section in the [README]({{github}}).

**Is the conversation private?**
Memory stays on your server. Replies still go through Flatkey, so the model provider sees the messages it answers.

A QQ AI chatbot is worth hosting yourself when you already talk on QQ, and you want the memory, the persona and the model choice under your control. Set it up, send a test message, and check the memory and the answers before you let it talk in a busy group.
