---
title: "Self-Hosted AI Companion: Your Character.AI Alternative"
description: "Companion apps change models or add filters. Mochi is a self-hosted AI companion and Character.AI alternative: memory you can see, and a bill you control."
published: "2026-11-12"
updated: "2026-11-19"
keywords: ["self-hosted AI companion","AI companion you own","Character.AI alternative","open source AI chatbot","AI chatbot with memory","Discord AI companion","uncensored AI companion","Janitor AI alternative"]
---

If you have spent a few months with a companion app, you know the pattern. You get used to how a character talks, it starts to remember the things you care about, and then one update later it sounds different. The model changed, a filter arrived, the price went up, or the app closed. Everyone packs up and moves to the next one, and the history stays behind.

None of that is about the character. It happens because the character lives on someone else's server, under someone else's plans. That is usually why someone starts looking for a Character.AI alternative, or a Janitor AI alternative. A self-hosted AI companion takes the other route: you run it yourself. Mochi is open source, and here is what that changes in practice, and what it costs you.

## What a self-hosted AI companion changes

Mochi runs where you put it: on your own computer, on a small server you rent, or on a host like [Railway]({{railway}}). The code is on [GitHub]({{github}}) under the MIT license, so you can read it, change it, and keep running the version you like for as long as you want.

That also means there is no company deciding next month's personality. If a new model comes out, you choose whether to switch. If you like how she talks today, she can talk like that next year.

## Memory you can actually see

Mochi remembers people, not just the last few messages. For each person she builds a short profile: how they talk, facts they mentioned, what they're into. For each chat room she keeps a running summary and the topics that came up recently. When she can't fit an older conversation into the reply, she can search further back in that room's history.

The difference from an app is that all of it is in front of you. The dashboard's Memory page lists every person and room she knows, and what she has written down about each. You stay in control of it:

- **Forget one person or one room** with a button, without wiping anything else. Anyone can also just tell her "forget me".
- **Download a backup** of everything she remembers, her knowledge files and her settings as one file, and import it again on another machine or into another bot.
- **Keep the data where you want it:** a file in Mochi's data folder on your computer by default, or your own PostgreSQL database if you'd rather run her in the cloud.

In a group chat she keeps track of everyone separately, so the friend who loves cats and the friend who's always job hunting don't get blended into one person.

## You write the personality

Her name, avatar, greeting, tone and backstory are all fields in the dashboard, not a hidden prompt someone else maintains. You can start from the Mochi preset or a blank bot, and if you want full control there's a custom prompt that replaces the generated one entirely.

Lore and backstory can go in as knowledge files: drop in text, documents or a web page and she'll look things up in them when they're relevant, instead of you cramming everything into one giant prompt.

## She lives where your friends already are

Mochi isn't another app to open. She joins the places you already talk:

- **Discord** and **Telegram**, in DMs or in a server with your friends
- **Slack**, **QQ** and **LINE**
- **Your own website**, as a chat window with an animated character who peeks in from the edge of the page and jumps out when someone opens the chat

She can also look at pictures people send and search the web when a question needs current information. You can turn each of those off per bot.

## No filter on top

Mochi has no content filter of its own, and [Flatkey]({{flatkey}}), the platform she runs on, is OK with uncensored conversations between adults. There's no extra moderation layer between you and your character, and her personality is whatever you write.

What you get is the model itself. Each one has its own style and its own limits, and some are a lot looser than others, so if one holds back, switch chat to another in the dashboard. Adults only, and anything involving minors is never allowed.

## You pay for what you use, not a subscription

Mochi itself is free. What costs money is the AI model that writes her replies, and you pay for that per use instead of per month. Mochi runs on AI tokens from [Flatkey]({{flatkey}}), priced at least 20% below the model makers' official prices, and new Flatkey accounts get $1 in free credit to try it.

You also decide how much each part costs. Chat, reading images, updating memory and web search each have their own model setting, so you can keep a cheap, fast model for everyday chat and a stronger one only where it matters. A daily token budget per bot puts a hard ceiling on what a busy day can cost.

## What you give up

Running your own companion isn't free of catches, and you should know them before you start:

- **Some setup.** It isn't an app store download. The [setup guide]({{guide}}) and the [tutorial video]({{tutorial}}) walk you through every step, and there's a prompt you can paste into ChatGPT or Claude so it guides you as you go.
- **She's awake when her host is.** On your own computer, she sleeps when the computer does. For a bot that's online around the clock, put her on a small server. The [deploy]({{deploy}}) page covers that path.
- **Your messages still go to an AI model.** Mochi keeps the memory on your side, but to write a reply it sends the conversation to the model through Flatkey. There's no app keeping a profile of you, but the model provider does see the messages it answers.
- **One provider.** Mochi works with Flatkey only, the platform this project comes from. That's how the project pays for itself.

## Is Mochi a Character.AI alternative?

If you want a character you talk to in Discord, Telegram or a similar chat, with a personality you write and a memory you can inspect, Mochi is built for that job. It is a self-hosted AI companion, not a website you just open and log into.

It is also not a drop-in clone of Character.AI or Janitor AI. This post does not claim a one-click import of your old chats from those apps, a public character catalog, or a way to keep talking with no setup. You host the bot, you paste a [Flatkey]({{flatkey}}) key, and you connect the channels you actually use.

The useful comparison is ownership. You can read the MIT-licensed code, back up what she remembers, and keep her running if a hosted app changes its model, adds a filter, raises its price or shuts down. If that tradeoff is acceptable, the sections above are what you get. If you only want to open a website and start chatting, a hosted app will feel easier.

## FAQ

**Is Mochi a Character.AI alternative?**
It can be, if you want a companion you host yourself. It is not a hosted web app with a character catalog, and it does not replace logging into Character.AI with a single sign-in.

**Can I import my Character.AI or Janitor AI chats?**
This article does not describe an importer for those apps. In Mochi you can download and import a backup of *her* memory, knowledge files and settings, which is useful when you move the bot to another machine.

**Does a self-hosted AI companion run completely offline?**
No. You can host Mochi on your own computer or server, and memory stays on your side, but replies still go through Flatkey.

**Is she uncensored?**
Mochi has no content filter of its own, and Flatkey allows uncensored conversations between adults. Each model still has its own style and limits, so you may need to switch models. Adults only; anything involving minors is never allowed.

**What do I pay for?**
The software is free under the MIT license. You pay for model usage on Flatkey, and for hosting if you use a server. New Flatkey accounts get $1 in free credit.

**Where can she talk?**
Discord, Telegram, Slack, QQ, LINE, and a chat widget on your own website.

## How to start

- Get a [Flatkey]({{flatkey}}) key. New accounts come with $1 in free credit.
- Install Mochi with one command on your computer, or put it on a server ([Railway]({{railway}}) takes one click). The [deploy]({{deploy}}) page has the server path.
- Open the dashboard, paste the key, give her a personality, and connect Discord, Telegram or any of the others.

The [setup guide]({{guide}}) has every step for Mac, Windows and servers, with the [tutorial video]({{tutorial}}). If you get stuck, open an issue on [GitHub]({{github}}).
