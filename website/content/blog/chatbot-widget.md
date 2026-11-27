---
title: "Chatbot Widget You Add to Your Own Website"
description: "A chatbot widget can live on your website without a bot subscription. Here is how to add one with Mochi, what it costs, and how visitors are remembered."
published: "2026-11-23"
updated: "2026-11-27"
keywords: ["chatbot widget","add chatbot to website","website chat widget","website ai chatbot"]
---

A chatbot widget is a chat box that sits on your website and talks with visitors. It can answer from your documents, remember a returning visitor, or greet people in the personality you wrote. Many tools that add a chatbot to a website are hosted services you subscribe to. You can also host the widget yourself.

[Mochi]({{github}}) is a free, open source (MIT) AI chatbot you run on your own computer or a server. Each bot gets a one-line website snippet you paste into your site. The same bot can also join [Discord](/blog/discord-ai-chatbot), [Telegram](/blog/telegram-ai-chatbot), [Slack](/blog/ai-chatbot-for-slack), [QQ](/blog/qq-ai-chatbot) or [LINE](/blog/line-ai-chatbot). Model replies come from [Flatkey]({{flatkey}}), Mochi's only model provider. The software has no subscription fee. You pay for model usage, and for hosting if the widget should stay online all day.

## What a chatbot widget can be

People look for a chatbot widget for different jobs. A product site might want answers from help docs. A personal site might want a character who remembers visitors. Those are different setups in Mochi, not different products.

If the main job is answering from documents, start from the Q&A / support bot preset. That path is in the [knowledge base chatbot](/blog/knowledge-base-chatbot) post. If you want a companion with a personality you write and a memory you can inspect, see the [self-hosted AI companion](/blog/own-your-ai-companion) post. Either one can live in the website widget.

The widget is not a hosted live-chat desk, and it is not a plugin that only works in one site builder. You host Mochi, copy a snippet, and restrict it to the domains you allow.

## What you need before you add it

You need three things:

1. **Mochi running at a public HTTPS address.** Visitors' browsers have to load the widget, so Mochi must be reachable on the internet. The [setup guide]({{guide}}) covers a one-line install on your computer, which is fine for trying the dashboard. For a public site, [deploy it on a server]({{deploy}}). [Railway]({{railway}}) is one click and includes HTTPS. The [tutorial video]({{tutorial}}) walks through the same path.
2. **A Flatkey key.** Open **Flatkey API key** in the dashboard, create a key on [Flatkey]({{flatkey}}), paste it and bind it. Mochi verifies the key and stores it only on your server. New Flatkey accounts get $1 in free credit. Mochi does not take your own OpenAI key.
3. **A place on your website for a short script.** In **Channels**, pick the website option and copy the snippet. Restrict it to your domains under **Allowed sites**, then paste the snippet into your site's HTML, or into the custom-code box your site builder provides.

The website channel does not need a platform token. You can pause or resume it with a toggle.

## How to add a chatbot widget to your website

1. Deploy Mochi on a server with HTTPS, or use a host from the [deploy page]({{deploy}}). The first time you open the dashboard, choose an admin password.
2. Bind your [Flatkey]({{flatkey}}) key.
3. Click **New bot** or use the first bot. In **Persona**, set the name, greeting, tone, rules, color and avatar. Pick the companion preset or the Q&A / support preset to match the job.
4. Open **Channels**, choose the website option, set **Allowed sites**, and copy the one-line snippet. It loads `/widget/widget.js` from your Mochi server, with `data-server` set to your public HTTPS URL and `data-bot` set to the bot id the dashboard gives you.
5. Paste the snippet into your website, open the site, and send a test message.
6. Optional: add documents in **Knowledge base**, and check questions in **Test retrieval** and **Playground**.

If your site is served over HTTPS, Mochi must be as well, or the browser will block the script. Trust the Channels guide in the dashboard if a label moves.

## Visitors, cookies and memory

Each website visitor gets a random id. Mochi keeps it on your site's own domain in localStorage, with a first-party cookie named `mochi_sid_<bot>` as a backup, and creates it only when the visitor sends a first message. Memory for that visitor is filed under the id, so a returning person can be remembered on the next visit.

When a visitor says their name in an ordinary way ("my name is Alex"), Mochi uses that name from that reply on. If your site already knows who is logged in, pass it in the snippet with `data-visitor-name="Alex"`.

Because a cookie is involved, mention it in your site's privacy or cookie notice. Memory stays on your server. Replies still go through Flatkey, so the model provider sees the messages it answers. You can open the **Memory** tab, forget one person, and download or import a backup. Channel settings and the Flatkey key are not included in a bot backup.

## The character on the widget

By default the widget is a LivLiv character: while the chat is closed she peeks in from the edge of the page, and when it opens she stands beside it. The animation is drawn by the [LivLiv Player](https://github.com/livliv-dev/player) (Apache-2.0), loaded only when the chat opens. On phones the chat fills the screen. Browsers without WebGL2 just get the chat.

Under **Persona, Widget style** you can keep the Mochi character (the default), upload your own LivLiv character, or use the classic chat box. For your own, upload a `.livliv` file made on [livliv.ai](https://livliv.ai). Its picture becomes the peek picture, and uploads stay in Mochi's database, so they survive redeploys. Add `data-character="off"` to the snippet to hide the character on one site. The widget takes its name, avatar, color, description and greeting from the bot's persona.

## What you actually pay for

Mochi itself is free under the MIT license. What costs money is the model that writes replies. Those models come from [Flatkey]({{flatkey}}), priced at least 20% below the model makers' official prices, with one key and one bill. Check current model prices on Flatkey before you choose a model. Your costs depend on the model and the tokens used.

A public chatbot widget also needs a host. A server, including [Railway]({{railway}}), is billed by the host. If Mochi is only running on your computer, visitors on the public internet cannot reach the widget. This is not an offline, on-device model: memory stays on your server, and replies still go through Flatkey.

Knowledge files are optional. The bot can look up a document when it is relevant, and you can turn on **Only answer from the knowledge base** if it should stay inside those files. Under **Models & abilities** you can turn off image reading or web search, pick a model for each job, and set a **daily token budget**. Once the budget is reached, the bot goes quiet until the next UTC day.

## How this differs from a hosted website chatbot

Hosted website chatbots are often easier to start: you create an account, paste their snippet, and they run the bot. Mochi asks you to host a process and to put HTTPS in front of it. That is a real cost in time.

What you get in return is control. You can run more than one bot on the same Mochi install, each with its own persona, knowledge, channels, memory and budget. The same bot can also talk in [Discord](/blog/discord-ai-chatbot), [Telegram](/blog/telegram-ai-chatbot), [Slack](/blog/ai-chatbot-for-slack), [LINE](/blog/line-ai-chatbot) or [QQ](/blog/qq-ai-chatbot). The code is MIT-licensed on [GitHub]({{github}}).

Mochi does not collect leads, hand a chat to a human agent, or ship a one-click plugin for a particular site builder. If you need those, this is a different kind of project.

## FAQ

**Do I need to know how to code?**
No. You deploy Mochi, bind a Flatkey key, copy the snippet from **Channels**, and paste it into your site. Some site builders give you a box for custom HTML or scripts.

**Will the widget work if my computer is off?**
Not if Mochi is only running on that computer. The widget also needs a public HTTPS address so visitors can load the script. The [deploy page]({{deploy}}) lists the options.

**Does it remember returning visitors?**
Yes, once they have sent a first message. Mochi stores a random id in localStorage and in a first-party cookie on your domain, and files memory under that id. If you already know the logged-in name, pass `data-visitor-name` in the snippet.

**Can the same bot also talk in Discord, Telegram, Slack, LINE or QQ?**
Yes. Connect those channels in **Channels**. See the [Discord](/blog/discord-ai-chatbot), [Telegram](/blog/telegram-ai-chatbot), [Slack](/blog/ai-chatbot-for-slack), [LINE](/blog/line-ai-chatbot) and [QQ](/blog/qq-ai-chatbot) posts for the token and privacy steps that are specific to each platform. LINE also needs a public HTTPS webhook.

**Is the conversation private?**
Memory stays on your server. Replies still go through Flatkey, so the model provider sees the messages it answers. Mention the widget cookie in your site's privacy or cookie notice.

A chatbot widget is worth hosting yourself when you want the bot on a site you already run, and you want the memory, the persona and the model choice under your control. Add the snippet, send a test message, and check the answers before you show it to every visitor.
