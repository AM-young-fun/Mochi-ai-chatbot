// The "Let your AI set it up" prompt. No imports: the repo-root test imports this file directly.
// Written for the AI, in English (models follow English instructions most reliably); the
// "Talk to me in …" line makes the AI answer in the visitor's language.

const REPO = "https://github.com/AM-young-fun/Mochi-ai-chatbot";
const SITE = "https://www.mochichatbot.com";

export function buildAiPrompt(track: "local" | "server", language: string, flatkeyUrl: string): string {
  const intro =
    track === "local"
      ? `Help me install Mochi, an open-source, self-hosted AI chatbot, on this computer: ${REPO}`
      : `Help me install Mochi, an open-source, self-hosted AI chatbot, on my Linux server with Docker: ${REPO}`;
  const setup =
    track === "local"
      ? [
          "1. Run Mochi's one-line installer for my system. It's open source; read it first if you like (https://github.com/AM-young-fun/Mochi-ai-chatbot/tree/main/website/public). It installs Node.js if needed, downloads Mochi into a `mochi` folder in my home folder, starts it and opens the dashboard.",
          `   - macOS / Linux: \`curl -fsSL ${SITE}/install.sh | bash\``,
          `   - Windows PowerShell: \`$p = Get-ExecutionPolicy -Scope Process; Set-ExecutionPolicy Bypass -Scope Process -Force; try { irm ${SITE}/install.ps1 | iex } finally { Set-ExecutionPolicy $p -Scope Process -Force }\``,
          "2. Keep it running. Open http://localhost:3000/dashboard and help me choose an admin password (the dashboard asks the first time).",
          "3. If anything fails, fall back to the README's Quick start: clone the repo, `npm install`, copy `.env.example` to `.env`, `npm start`.",
        ]
      : [
          "1. Make sure Git and Docker are installed on the server. If not, install them.",
          "2. Clone the repo, copy `.env.example` to `.env` and set PUBLIC_URL to the server's public address (leave ADMIN_TOKEN empty).",
          "3. Build and start it: `docker build -t mochi .` then `docker run -d --name mochi --restart unless-stopped --env-file .env -p 3000:3000 -v mochi-data:/app/data mochi`. Help me put HTTPS in front of port 3000 (for example with Caddy). Then run `docker logs mochi` for the one-time setup code, open /dashboard and help me choose an admin password.",
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
