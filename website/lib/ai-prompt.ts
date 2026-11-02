// The "Let your AI set it up" prompt. No imports: the repo-root test imports this file directly.
// Written for the AI, in English (models follow English instructions most reliably); the
// "Talk to me in …" line makes the AI answer in the visitor's language.

const REPO = "https://github.com/flatkey-ai/Mochi-ai-chatbot";

export function buildAiPrompt(track: "local" | "server", language: string, flatkeyUrl: string): string {
  const intro =
    track === "local"
      ? `Help me install Mochi, an open-source, self-hosted AI chatbot, on this computer: ${REPO}`
      : `Help me install Mochi, an open-source, self-hosted AI chatbot, on my Linux server with Docker: ${REPO}`;
  const setup =
    track === "local"
      ? [
          "1. Check that Node.js 22.13 or newer and Git are installed. If not, install them, or tell me exactly what to download and click.",
          "2. Clone the repo, run `npm install`, copy `.env.example` to `.env`, and set ADMIN_TOKEN in `.env` to a long random value. Tell me the token.",
          "3. Start Mochi with `npm start` and keep it running. Then open http://localhost:3000/dashboard and help me sign in with the token.",
        ]
      : [
          "1. Make sure Git and Docker are installed on the server. If not, install them.",
          "2. Clone the repo, copy `.env.example` to `.env`, set ADMIN_TOKEN to a long random value and PUBLIC_URL to the server's public address. Tell me the token.",
          "3. Build and start it: `docker build -t mochi .` then `docker run -d --name mochi --restart unless-stopped --env-file .env -p 3000:3000 -v mochi-data:/app/data mochi`. Help me put HTTPS in front of port 3000 (for example with Caddy) and open /dashboard.",
        ];
  return [
    intro,
    `I'm not technical, so do as much as you can yourself and explain each step simply. Talk to me in ${language}.`,
    "",
    ...setup,
    `4. Mochi uses Flatkey as its model provider. Send me to ${flatkeyUrl} to create an API key and top up my balance. Then have me paste the key into the dashboard under "Flatkey API key" and click "Bind key". Never ask me to paste the key into this chat.`,
    "5. Help me connect a channel (Discord, Telegram, Slack, QQ, LINE or the website widget) by following the guide inside the dashboard's Channels page, then send the bot a test message.",
    "",
    "If something fails, read the error, fix it and keep going. Use the README in the repo as the source of truth.",
  ].join("\n");
}
