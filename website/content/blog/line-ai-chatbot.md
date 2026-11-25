---
title: "LINE AI Chatbot for Your Official Account"
description: "A LINE AI chatbot can live on your Official Account without a bot subscription. Here is how to set one up with Mochi, what it costs, and what setup involves."
published: "2026-11-25"
updated: "2026-11-25"
keywords: ["line ai chatbot","line chatbot","line bot","line official account chatbot","line messaging api"]
---

A LINE AI chatbot talks with people on LINE through a LINE Official Account, in a one-on-one chat or in a group. It can answer questions, remember the people in the room, or stay in character as a regular. Many options are hosted services you subscribe to. You can also host one yourself.

[Mochi]({{github}}) is a free, open source (MIT) AI chatbot you run on a server you control. You connect LINE from a web dashboard, and the same bot can also join [Discord](/blog/discord-ai-chatbot), [Telegram](/blog/telegram-ai-chatbot), [Slack](/blog/ai-chatbot-for-slack), QQ or a [website chat widget](/blog/chatbot-widget). Model replies come from [Flatkey]({{flatkey}}), Mochi's only model provider. The software has no subscription fee. You pay for model usage, for hosting if you want the bot online all day, and for the messages LINE itself counts against your Official Account plan.

## What a LINE AI chatbot can be

One Official Account might want a friendly regular who remembers names. Another might want a bot that answers from a help doc. Those are different setups in Mochi, not different products.

If you want a companion you own, with a personality you write and a memory you can inspect, start from the companion preset and see the [self-hosted AI companion](/blog/own-your-ai-companion) post. If the main job is answering from documents, start from the Q&A / support bot preset. That path is in the [knowledge base chatbot](/blog/knowledge-base-chatbot) post. Either one can live on LINE.

Mochi is not a ready-made Official Account you search for and add. You host the process, connect a Messaging API channel, and bind a Flatkey key. You do not have to write [LINE Messaging API](https://developers.line.biz/en/docs/messaging-api/overview/) code. Mochi uses that API for you.

## What you need before you connect LINE

LINE is the only Mochi channel that needs a public HTTPS address. LINE pushes events to a webhook on your server. There is no socket to keep open the way Slack's Socket Mode works, so a machine that is only on localhost cannot receive those webhooks unless you add a public HTTPS tunnel.

You need three things:

1. **Mochi on a host with public HTTPS.** The [setup guide]({{guide}}) and [tutorial video]({{tutorial}}) cover the install path. For a bot that should stay up all day, [deploy it on a server]({{deploy}}). [Railway]({{railway}}) is one click and gives you an HTTPS address. 2. **A Flatkey key.** Open **Flatkey API key** in the dashboard, create a key on [Flatkey]({{flatkey}}), paste it and bind it. Mochi verifies the key and stores it only on your server. New Flatkey accounts get $1 in free credit. Mochi does not take your own OpenAI key.
3. **A LINE Official Account, plus two values from its Messaging API channel:** the channel secret and a long-lived channel access token. In the dashboard, open **Channels** and pick LINE. The page has the current steps, including the webhook URL for that bot. If a label in LINE's consoles changes, trust the Channels page and [LINE's Messaging API docs](https://developers.line.biz/en/docs/messaging-api/overview/) over a blog post.

The Channels guide currently starts in [LINE Official Account Manager](https://manager.line.biz/): **Settings**, **Messaging API**, **Enable Messaging API**, and pick a provider. The dashboard notes that since September 2024 a Messaging API channel is created this way, not in the Developers console. Copy the **Channel secret** there, set the **Webhook URL** to the address shown in Mochi, and save it. The URL must be public HTTPS.

Still in Official Account Manager, open **Settings**, **Response settings**. Turn **Webhooks** on. Turn **Auto-response messages** and the **Greeting message** off, or LINE's canned replies arrive next to the bot's.

The access token is not in the Manager. Open the [LINE Developers console](https://developers.line.biz/console/) with the same LINE login, go to the provider you picked, open your channel, and on the **Messaging API** tab issue a **Channel access token (long-lived)**. Paste the token and the channel secret into Mochi and connect. The dashboard verifies the token with LINE before saving it. Do not paste the channel secret into the token field. They are different values, and Mochi also uses the secret to check that each webhook really came from LINE.

Back on that **Messaging API** tab, check that **Use webhook** is on, then click **Verify** next to the webhook URL. It should say **Success**. For groups, open **Settings**, **Account settings**, and allow the account to join groups and multi-person chats. Then add the account as a friend in the LINE app, or invite it into a group.

Anyone who has the channel access token can send messages as that Official Account, so paste it only into Mochi on a server you trust.

## How to set up a LINE AI chatbot

1. Deploy Mochi on a host with public HTTPS, or point a tunnel at a local install, then bind your [Flatkey]({{flatkey}}) key.
2. Create or open a bot and set its persona, or start from the companion or Q&A / support preset.
3. Open **Channels**, choose LINE, and follow the in-dashboard guide to set the webhook, issue the long-lived access token, and paste the token and channel secret.
4. Turn webhooks on, turn auto-response and greeting messages off, and verify the webhook URL.
5. Add the Official Account as a friend and send a test message. For a group, allow it to join groups, then invite it. Optional: add documents in **Knowledge base**.

## Reply tokens, push messages, and LINE's plan

When someone messages the Official Account, LINE sends a webhook event to your server. [LINE's webhook docs](https://developers.line.biz/en/docs/messaging-api/receiving-messages/) say you should verify the signature on that request. Mochi does this with the channel secret before it handles the event.

A reply right after the message uses LINE's reply token. [LINE's sending-messages docs](https://developers.line.biz/en/docs/messaging-api/sending-messages/) describe reply messages and push messages as two different methods. Reply tokens are single-use and short-lived (about a minute). Mochi uses the token while it is still valid, and falls back to the push API when it is not, or when the bot starts a message later, such as a scheduled message.

Mochi's Channels guide says replies sent with the reply token are free, and later push messages count against your Official Account plan's monthly message allowance. On the free plan, push stops working once that allowance runs out. [LINE's Messaging API overview](https://developers.line.biz/en/docs/messaging-api/overview/) says you can get started for free, and that the number of free messages each month depends on the Official Account subscription plan, which can vary by country or region. Check LINE's current pricing from that overview before you rely on a number from a blog post.

Mochi can read images people send on LINE. Voice replies on LINE are text only for now. LINE has no history API for bots, so Mochi only has messages the bot actually received. Discord and Slack can backfill older channel history; LINE cannot, and neither can Telegram or QQ. Start in a test chat you control, then check Mochi's **Memory** tab before you add the bot to a busy group.

## Memory, knowledge and what you pay

Mochi remembers people and conversations, per person and per room. In the **Memory** tab you can inspect what was written down, forget a person or a room, and download a backup. Channel tokens and the Flatkey key are not included in that backup. Knowledge files are optional; turn on **Only answer from the knowledge base** if the bot should stay inside your documents. Under **Models & abilities** you can set a **daily token budget**. Once it is reached, the bot goes quiet until the next UTC day.

Mochi itself is free under the MIT license. What costs money is the model that writes replies, the host if you use one, and LINE's own messaging plan. The models come from [Flatkey]({{flatkey}}), priced at least 20% below the model makers' official prices, with one key and one bill. A server, including [Railway]({{railway}}), is billed by the host. This is not an offline, on-device model. Memory stays on your server, but Mochi still sends the conversation to the model through Flatkey to write a reply.

## How this differs from a hosted LINE bot

Hosted LINE bots are often easier to start: you sign up, connect an Official Account, and the vendor keeps the process running. Mochi asks you to host a process with public HTTPS and to connect your own Messaging API channel. That takes more time. In return you can run more than one bot on the same install, each with its own persona, knowledge, channels, memory, models and daily budget. The same bot can also talk in [Discord](/blog/discord-ai-chatbot), [Telegram](/blog/telegram-ai-chatbot), [Slack](/blog/ai-chatbot-for-slack) or a [website chatbot widget](/blog/chatbot-widget). The code is MIT-licensed on [GitHub]({{github}}).

If you build Official Account bots for clients, Mochi also has a Japanese page at [/ja/line](/ja/line) written for freelancers and small agencies. This English post is the setup path for a LINE AI chatbot you host yourself. Mochi can talk on LINE with official models from Flatkey. It cannot use an OpenAI key you already have.

## FAQ

**Do I need to know how to code?**
No. You install Mochi, bind a Flatkey key, and follow the LINE guide in **Channels**.

**Can I try a LINE AI chatbot on my laptop without a public URL?**
Not for a live webhook. LINE has to reach the public HTTPS URL shown in the Channels guide. Use a host with public HTTPS, or a tunnel in front of a local install. The [deploy page]({{deploy}}) lists the options.

**Why did LINE's own reply show up next to the bot?**
Auto-response messages or the greeting message are probably still on. In Official Account Manager, open **Settings**, **Response settings**, turn those off, and keep **Webhooks** on.

**The webhook verify button does not say Success.**
Check that the URL is public HTTPS and matches the address shown in Mochi's LINE channel guide, and that **Use webhook** is on in the Developers console. Then click **Verify** again.

**Is the conversation private?**
Memory stays on your server. Replies still go through Flatkey, so the model provider sees the messages it answers.

A LINE AI chatbot is worth hosting yourself when you already talk on LINE, and you want the memory, the persona and the model choice under your control. Set it up, send a test message, and check the memory and the answers before you let it talk in a busy group.
