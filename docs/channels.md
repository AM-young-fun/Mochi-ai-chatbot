# Channels: one contract, one factory

Every chat channel implements the same abstract class ([`src/core/channel.ts`](../src/core/channel.ts)) and is
built in one place ([`src/channels/factory.ts`](../src/channels/factory.ts)). Adding a platform means writing an
adapter that extends `ChannelAdapter` and adding one line to the builder map — no `if`-chains anywhere else.

## The contract

```ts
abstract class ChannelAdapter {
  abstract readonly platform: Platform;
  abstract readonly capabilities: ReadonlySet<ChannelCapability>;

  supports(cap: ChannelCapability): boolean;
  protected require(cap: ChannelCapability): void;   // throws UnsupportedCapability

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract status(): { running: boolean; detail?: string };

  abstract replyTo(msg: IncomingMessage, text: string): Promise<void>;  // answer this message
  abstract sendTo(target: ChatTarget, text: string): Promise<void>;     // start a conversation

  async fetchHistory(target: ChatTarget, limit: number): Promise<HistoryMessage[]>;
}
```

`IncomingMessage.ref` carries the platform id of the message being answered, so `replyTo` quotes the right one
even when several messages are in flight (a per-room "last message" is a race; a test pins this down).

## Capabilities (what each platform can actually do)

| capability | meaning | discord | telegram | slack | qq | web |
|---|---|:-:|:-:|:-:|:-:|:-:|
| `reply` | answer a specific message (quote / thread / passive) | ✅ | ✅ | ✅ | ✅ (needs `msg_id`) | ✅ |
| `send` | send without being asked (channel post, DM a person) | ✅ | ✅ | ✅ | ⚠️ quota-limited | ✅ |
| `history` | backfill older messages from the platform API | ✅ | ❌ no API | ✅ | ❌ no API | n/a |
| `media` | download attachments for the vision model | ✅ | ✅ | ✅ | ✅ | ✅ (`data:` URL) |
| `threads` | keep replies in a thread | ✅ | ❌ | ✅ | ❌ | ❌ |
| `typing` | typing indicator | ✅ | ✅ | ✅ | ❌ | ❌ |

The matrix lives in `CAPABILITY_MATRIX` and a test asserts it never drifts from what the adapters declare.

### What that means for reading history

* `search_history` reads Mochi's own database first (every message the bot received), then asks the channel for
  older lines through `fetchHistory` when the platform has an API.
* **Discord / Slack**: full backfill — the bot can read a channel it was just added to.
* **Telegram**: the Bot API has no "read history" call at all, so only messages the bot witnessed exist.
* **QQ**: no history endpoint either, and in groups the bot only receives messages that @ it unless the group
  grants full-message events. Media and passive replies work, history does not. Events arrive over the WebSocket
  gateway and, when a callback URL is set on q.qq.com (`/webhook/qq/<botId>`, Ed25519-signed), over HTTP too;
  a message delivered both ways is handled once. The callback carries the same events, so it does not unlock
  messages QQ isn't sending: the group's own "获取群内全部消息" setting still decides that.

## Envelope for every channel

All adapters normalize into `IncomingMessage` and hand it to the same `Brain.handle()`, so memory, personas,
knowledge, safety guards, flood control and cost accounting behave identically no matter where the message came
from. Anything that is not an image becomes a text note (`[sent a video (video/mp4)]`), so the model knows
something arrived instead of claiming it saw nothing.

## Voice replies (text-to-speech)

Set on the Persona page → Voice replies: never, when someone asks for a voice message, or every reply,
with a TTS model id from Flatkey (`/v1/audio/speech`, OpenAI-style). The text reply always goes out
first; the voice follows and a failure only logs.

| Channel | How it arrives |
| --- | --- |
| QQ (groups, private chats) | Voice message: PCM from Flatkey, encoded to silk, uploaded as `file_type: 3` |
| Telegram | Voice note (Ogg/Opus) |
| Discord | Audio attachment (Ogg/Opus) under the message it answers |
| Slack | mp3 in the thread; needs the `files:write` scope (reinstall the app after adding it) |
| Website widget | Plays once, with a 🔊 button to replay |
| LINE, QQ guild channels | Text only for now (LINE needs m4a audio from a public URL) |

## Scheduled messages

Dashboard → a bot → **Schedule**: one-time or repeating messages (every day, weekdays, weekly, or any
5-field cron), sent to a group or private chat the bot has already talked in. Times use the bot's time
zone (set on the same page). With "write it fresh each time" on, the bot writes each message in character
from the text as an instruction; otherwise it sends the text as is.

People ticked under "Who can schedule by chatting" can also do it in chat: "remind me at 10am to drink a
glass of water", "every weekday at 9 say good morning", "what reminders are there?", "cancel the water
reminder". For them the chat model gets three tools (schedule_message, list_scheduled_messages,
cancel_scheduled_messages) for the chat they are in; anyone else gets no tools and a polite no (the bot is told
not to pretend it will remind them).

Messages are sent through the channel's normal send, so platform limits apply: LINE push messages count
against the monthly quota, and QQ meters messages a bot starts itself (they can be refused). The website
widget can't receive them. A run more than an hour late (server was down) is skipped, not sent late.
