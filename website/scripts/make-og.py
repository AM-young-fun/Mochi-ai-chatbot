#!/usr/bin/env python3
"""Social share cards (Open Graph / X / LinkedIn), 1200x630, from public/social-preview.png.

Keeps Mochi and her chat bubbles on the right and writes page-specific text on the left, in the page's
language. Re-run after changing the copy:  python3 website/scripts/make-og.py
Fonts: Inter (Latin) and Noto Sans CJK (Chinese, Japanese), both under the SIL Open Font License.
Blog posts get their own cards at build time (app/(en)/blog/[slug]/opengraph-image.tsx) on og/blog-bg.png.
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(HERE, "..", "public")
OUT = os.path.join(PUB, "og")
W, H = 1200, 630
INTER = "/usr/share/fonts/opentype/inter/Inter-{}.otf"
CJK = "/usr/share/fonts/opentype/noto/NotoSansCJK-{}.ttc"
CJK_INDEX = {"zh": 2, "ja": 0}  # SC, JP faces inside the .ttc

def font(lang, weight, size):
    if lang in CJK_INDEX:
        return ImageFont.truetype(CJK.format({"ExtraBold": "Black", "Bold": "Bold", "SemiBold": "Medium", "Medium": "Regular"}[weight]), size, index=CJK_INDEX[lang])
    return ImageFont.truetype(INTER.format(weight), size)

def base():
    src = Image.open(os.path.join(PUB, "social-preview.png")).convert("RGB")
    px = src.load()
    # Paint over the original text: each row becomes a blend between its left edge and the art's left edge.
    # The background is a soft diagonal gradient: rebuild it from the four corners and paint it over the
    # old text, feathering the last 40px into the original so no seam shows.
    Wd, Hd = src.width - 1, src.height - 1
    c00, c10, c01, c11 = px[4, 4], px[Wd - 4, 4], px[4, Hd - 4], px[Wd - 4, Hd - 4]
    def bg(x, y):
        u, v = x / Wd, y / Hd
        return tuple(c00[i] * (1 - u) * (1 - v) + c10[i] * u * (1 - v) + c01[i] * (1 - u) * v + c11[i] * u * v for i in range(3))
    for y in range(src.height):
        edge = 740 if not (100 <= y <= 230 or 430 <= y <= 610) else (660 if y < 300 else 640)
        for x in range(0, edge):
            k = min(1.0, (edge - x) / 40)
            fill, orig = bg(x, y), px[x, y]
            px[x, y] = tuple(round(fill[i] * k + orig[i] * (1 - k)) for i in range(3))
    logo = Image.open(os.path.join(PUB, "social-preview.png")).convert("RGB").crop((72, 112, 166, 206))
    return src.crop((80, 5, 80 + W, 5 + H)), logo

def wrap(draw, text, f, width, cjk):
    """Breaks between words, and between CJK characters, never inside a Latin word."""
    import re
    units = re.findall(r"[\u3000-\u9fff\uff00-\uffef]|[^\s\u3000-\u9fff\uff00-\uffef]+\s*|\s+", text)
    lines, cur = [], ""
    for u in units:
        trial = cur + u
        if draw.textlength(trial.rstrip(), font=f) <= width or not cur.strip():
            cur = trial
        else:
            lines.append(cur.rstrip())
            cur = u.lstrip()
    if cur.strip():
        lines.append(cur.rstrip())
    return lines

def card(name, lang, eyebrow, title, sub, foot="mochichatbot.com"):
    img, logo = base()
    d = ImageDraw.Draw(img)
    cjk = lang in CJK_INDEX
    x, maxw = 64, 520
    img.paste(logo.resize((64, 64), Image.LANCZOS), (x, 56))
    d.text((x + 80, 60), "Mochi", font=font("en", "ExtraBold", 46), fill=(214, 74, 150))
    y = 150
    if eyebrow:
        f = font(lang, "SemiBold", 24)
        d.text((x, y), eyebrow, font=f, fill=(133, 59, 206))
        y += 44
    size = 54 if len(title) < (22 if cjk else 40) else 46
    while True:
        f = font(lang, "ExtraBold", size)
        lines = wrap(d, title, f, maxw, cjk)
        if len(lines) <= 3 or size <= 34:
            break
        size -= 4
    for line in lines:
        d.text((x, y), line, font=f, fill=(42, 34, 51))
        y += int(size * 1.22)
    if sub:
        y += 14
        f = font(lang, "Medium", 26)
        for line in wrap(d, sub, f, maxw, cjk)[:3]:
            d.text((x, y), line, font=f, fill=(93, 81, 104))
            y += 38
    f = font("en", "SemiBold", 22)
    d.text((x, H - 64), foot, font=f, fill=(122, 111, 134))
    pill = "Powered by flatkey"
    pw = d.textlength(pill, font=f) + 28
    px0 = x + d.textlength(foot, font=f) + 20
    d.rounded_rectangle((px0, H - 70, px0 + pw, H - 34), radius=18, fill=(42, 34, 51))
    d.text((px0 + 14, H - 64), pill, font=f, fill=(255, 255, 255))
    img.save(os.path.join(OUT, name), optimize=True)
    print("wrote", name)

PLATFORMS = "Discord · Telegram · Slack · QQ · LINE · your website"
HOME = {
    "en": ("Free & open source", "Self-hosted AI chatbot, no coding needed", "Remembers people, answers from your docs. " + PLATFORMS),
    "zh": ("免费开源", "免费的自托管 AI 聊天机器人,不用写代码", "记得每个人,能根据你的资料回答。Discord · Telegram · Slack · QQ · LINE · 你的网站"),
    "ja": ("無料・オープンソース", "無料のセルフホスト型 AI チャットボット", "人を覚えて、あなたの資料から答える。Discord · Telegram · Slack · QQ · LINE · Web サイト"),
    "pt": ("Grátis e open source", "Chatbot de IA grátis e auto-hospedado", "Lembra das pessoas e responde com seus documentos. Discord · Telegram · Slack · QQ · LINE · seu site"),
}
DEPLOY = {
    "en": ("Deploy", "Put Mochi online in one click", "Railway in one click, or Render, Sealos, any VPS, Docker or Kubernetes."),
    "zh": ("部署", "一键把 Mochi 放到网上", "Railway 一键部署,或 Render、Sealos、任意 VPS、Docker、Kubernetes。"),
    "ja": ("デプロイ", "Mochi をワンクリックで公開", "Railway ならワンクリック。Render・Sealos・VPS・Docker・Kubernetes でも。"),
    "pt": ("Implantar", "Coloque a Mochi no ar com um clique", "Railway com um clique, ou Render, Sealos, qualquer VPS, Docker ou Kubernetes."),
}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for lang, (e, t, s) in HOME.items():
        card(f"home-{lang}.png", lang, e, t, s)
    for lang, (e, t, s) in DEPLOY.items():
        card(f"deploy-{lang}.png", lang, e, t, s)
    card("blog.png", "en", "Blog", "Running your own AI companion", "Memory, costs, hosting and the catches, from the people who build Mochi.")
    card("default.png", "en", "Free & open source", "Your own AI chatbot, on your own server", PLATFORMS)
    # Background for per-post cards: the art on the right, nothing on the left.
    img, logo = base()
    img.paste(logo.resize((64, 64), Image.LANCZOS), (64, 56))
    ImageDraw.Draw(img).text((144, 60), "Mochi", font=font("en", "ExtraBold", 46), fill=(214, 74, 150))
    img.save(os.path.join(OUT, "blog-bg.png"), optimize=True)
    print("wrote blog-bg.png")
