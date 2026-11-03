# Security Policy

## Reporting a vulnerability

Please **don't** open a public issue for security problems. Report them privately with GitHub's [private vulnerability reporting](https://github.com/AM-young-fun/Mochi-ai-chatbot/security/advisories/new), or through the [Flatkey contact form](https://flatkey.ai/contact?utm_source=mochi_bot&utm_medium=github&utm_campaign=mochi&utm_content=security). We'll reply as soon as we can and keep you posted on the fix.

## Keeping your Mochi safe

- The first time you open the dashboard it asks you to choose an admin password. Only a salted scrypt hash is stored (in `ADMIN_TOKEN` in `.env`, or `data/admin-password` without a `.env`). Setting it from another computer also needs a one-time code printed in the server log. Choose a long password before putting the dashboard on the internet, and serve it over HTTPS.
- Your Flatkey key and channel tokens are stored in `data/secrets.json` (file mode 600). Back up and protect the `data/` folder; never commit it.
- Restrict the website widget to your own domains under **Channels → Website widget → Allowed sites**.
- Give each bot a daily token budget so a leaked widget can't run up costs.
