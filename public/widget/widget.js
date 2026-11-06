/*!
 * Mochi web chat widget. Add to any site (the dashboard gives you this exact line per bot):
 * <script src="https://YOUR-MOCHI-SERVER/widget/widget.js" data-server="https://YOUR-MOCHI-SERVER" data-bot="BOT_ID" defer></script>
 * The bot's name, avatar, color, description and greeting come from its Persona settings.
 * Optional overrides: data-title, data-color, data-greeting, data-lang (en | pt | ja | zh; default: browser language),
 * data-character="off" (no character even if the bot has one).
 * Character: while the chat is closed a picture peeks in from the screen edge; opening the chat makes the character
 * jump out and stand beside it, drawn live by the LivLiv Player (vendored in ./livliv, Apache-2.0, loaded only then).
 */
(function () {
  var script = document.currentScript || document.querySelector('script[src*="widget.js"]');
  var attr = function (k) { return script && script.getAttribute(k); };
  var server = (attr("data-server") || (script && new URL(script.src).origin) || "").replace(/\/+$/, "");
  var botId = attr("data-bot") || "";
  var key = "__mochiWidget_" + botId;
  if (window[key]) return;
  window[key] = true;

  var T = {
    en: { placeholder: "type a message…", sub: "usually replies in a few seconds", attached: "image attached, add a message…", hiccup: "connection hiccup, try again?", noReply: "(｡•́︿•̀｡) hmm, no reply", hi: "Hi! How can I help?", open: "Open chat", close: "Close", attach: "Attach image", send: "Send", message: "Message", powered: "powered by" },
    pt: { placeholder: "digite uma mensagem…", sub: "costuma responder em segundos", attached: "imagem anexada, escreva algo…", hiccup: "falha na conexão, tenta de novo?", noReply: "(｡•́︿•̀｡) hmm, sem resposta", hi: "Oi! Como posso ajudar?", open: "Abrir chat", close: "Fechar", attach: "Anexar imagem", send: "Enviar", message: "Mensagem", powered: "feito com" },
    ja: { placeholder: "メッセージを入力…", sub: "通常は数秒で返信", attached: "画像を添付しました。メッセージもどうぞ…", hiccup: "接続に失敗しました。もう一度お試しください", noReply: "(｡•́︿•̀｡) 返信がありませんでした", hi: "こんにちは！ 何かお手伝いできますか？", open: "チャットを開く", close: "閉じる", attach: "画像を添付", send: "送信", message: "メッセージ", powered: "powered by" },
    zh: { placeholder: "输入消息…", sub: "通常几秒内回复", attached: "已添加图片，再说点什么吧…", hiccup: "网络开小差了，再试一次？", noReply: "(｡•́︿•̀｡) 嗯…没有回复", hi: "你好！有什么可以帮你？", open: "打开聊天", close: "关闭", attach: "添加图片", send: "发送", message: "消息", powered: "技术支持" },
  };
  var lang = (attr("data-lang") || (navigator.languages && navigator.languages[0]) || navigator.language || "en").toLowerCase().slice(0, 2);
  var L = T[lang] || T.en;

  var base = server + "/api/widget" + (botId ? "/" + encodeURIComponent(botId) : "");
  var cfgUrl = server + "/api/widget/" + encodeURIComponent(botId || "default") + "/config";

  var sid;
  try {
    var sk = "mochi_sid_" + botId;
    sid = localStorage.getItem(sk);
    if (!sid) { sid = "w-" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(sk, sid); }
  } catch (e) {
    sid = "w-" + Math.random().toString(36).slice(2);
  }

  fetch(cfgUrl).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (cfg) {
    if (cfg.enabled === false) return;
    mount({
      name: attr("data-title") || cfg.name || "Chat",
      avatar: cfg.avatar || "💬",
      color: attr("data-color") || cfg.color || "#ff6fae",
      description: cfg.description || L.sub,
      greeting: attr("data-greeting") || cfg.greeting || L.hi,
      character: attr("data-character") === "off" ? null : cfg.character || null,
    });
  });

  function mount(c) {
    var host = document.createElement("div");
    host.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:2147483000";
    document.body.appendChild(host);
    var root = host.attachShadow({ mode: "open" });
    var col = c.color;
    root.innerHTML =
      "<style>" +
      ":host{all:initial}*{box-sizing:border-box;font-family:ui-rounded,'Nunito',system-ui,sans-serif}" +
      ".fab{width:58px;height:58px;border-radius:50%;border:0;background:" + col + ";color:#fff;font-size:28px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.18);transition:transform .15s}" +
      ".fab:hover{transform:scale(1.07)}" +
      ".panel{position:absolute;right:0;bottom:72px;width:min(360px,calc(100vw - 32px));height:min(520px,calc(100vh - 110px));background:#fff;border-radius:22px;box-shadow:0 18px 50px rgba(42,34,51,.22);display:none;flex-direction:column;overflow:hidden}" +
      ".panel.open{display:flex}" +
      ".head{background:" + col + ";color:#fff;padding:12px 14px;font-weight:800;display:flex;align-items:center;gap:10px;font-size:22px}" +
      ".head div{font-size:15px;min-width:0}.head small{font-weight:500;opacity:.9;display:block;font-size:11.5px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".head button{margin-left:auto;background:none;border:0;color:#fff;font-size:22px;cursor:pointer}" +
      ".log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;background:#fdf7fb}" +
      ".m{max-width:82%;padding:9px 13px;border-radius:16px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word;color:#2a2233}" +
      ".u{align-self:flex-end;background:" + col + ";color:#fff;border-bottom-right-radius:5px}" +
      ".b{align-self:flex-start;background:#efe9ff;border-bottom-left-radius:5px}" +
      ".m img{max-width:160px;border-radius:10px;display:block;margin-top:4px}" +
      "form{display:flex;gap:6px;padding:10px;border-top:1px solid #f0e4ef}" +
      "input[type=text]{flex:1;border:1.5px solid #f0e4ef;border-radius:999px;padding:9px 14px;font-size:14px;outline:none}" +
      "input[type=text]:focus{border-color:" + col + "}" +
      ".icon{border:0;background:#f4eef3;border-radius:50%;width:38px;height:38px;cursor:pointer;font-size:16px}" +
      ".send{background:" + col + ";color:#fff}" +
      ".peek{position:absolute;right:-20px;bottom:-8px;width:124px;height:118px;border:0;padding:0;cursor:pointer;background:none;border-radius:20px 0 0 20px;overflow:hidden;box-shadow:0 10px 30px rgba(42,34,51,.25);transform:translateX(18px);transition:transform .25s cubic-bezier(.3,1.4,.5,1),opacity .2s}" +
      ".peek img{width:100%;height:100%;object-fit:cover;display:block}" +
      ".peek:hover,.peek:focus-visible{transform:translateX(0)}" +
      ".peek.gone{opacity:0;transform:translateX(140px);pointer-events:none}" +
      ".peek:after{content:'';position:absolute;left:10px;top:10px;width:12px;height:12px;border-radius:50%;background:" + col + ";border:2px solid #fff;animation:ping 2s infinite}" +
      "@keyframes ping{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}" +
      ".stage{display:none}" +
      // Streaming-room look: with the character, the chat has no box. She stands in the middle, the conversation floats
      // over her lower half like a live chat and fades out upwards, and the input sits at her feet.
      ".panel.room{background:none;box-shadow:none;border-radius:0;overflow:visible;bottom:-8px;width:min(360px,calc(100vw - 32px));height:min(620px,calc(100vh - 32px))}" +
      ".room .stage{display:block;position:absolute;left:0;right:0;top:34px;bottom:58px;z-index:0;pointer-events:none;opacity:0;transform-origin:50% 100%}" +
      ".stage canvas{width:100%;height:100%;display:block;pointer-events:auto}" +
      ".room .stage.in{opacity:1;animation:jump .62s cubic-bezier(.25,.9,.35,1) both}" +
      ".room .stage.out{animation:duck .32s ease-in both}" +
      "@keyframes jump{0%{opacity:0;transform:translate(150px,170px) scale(.3)}45%{opacity:1;transform:translate(30px,-40px) scale(.95)}78%{transform:translate(0,6px) scale(1.03,.96)}100%{opacity:1;transform:none}}" +
      "@keyframes duck{0%{opacity:1;transform:none}100%{opacity:0;transform:translate(150px,170px) scale(.3)}}" +
      ".room .head{position:absolute;top:0;left:0;right:0;z-index:2;background:none;padding:0;color:#2a2233}" +
      ".room .av,.room .head small{display:none}" +
      ".room .nm{display:flex;align-items:center;gap:7px;font-size:13px;padding:6px 13px 6px 10px;border-radius:999px;background:rgba(255,255,255,.85);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 4px 16px rgba(42,34,51,.14)}" +
      ".room .nm:before{content:'';width:8px;height:8px;border-radius:50%;background:" + col + ";animation:ping 1.6s infinite}" +
      ".room .head button{width:32px;height:32px;border-radius:50%;color:#2a2233;font-size:18px;background:rgba(255,255,255,.85);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 4px 16px rgba(42,34,51,.14)}" +
      ".room .log{position:absolute;left:0;right:0;bottom:64px;max-height:46%;z-index:2;background:none;padding:28px 2px 6px;scrollbar-width:none;-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 34px);mask-image:linear-gradient(to bottom,transparent 0,#000 34px)}" +
      ".room .log::-webkit-scrollbar{display:none}" +
      ".room .m{font-size:13.5px;padding:7px 12px;box-shadow:0 4px 14px rgba(42,34,51,.13);animation:pop .22s ease-out}" +
      ".room .b{background:rgba(255,255,255,.88);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}" +
      "@keyframes pop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}" +
      ".room form{position:absolute;left:0;right:0;bottom:18px;z-index:2;padding:0;border:0}" +
      ".room input[type=text]{background:rgba(255,255,255,.92);border-color:rgba(255,255,255,.95);box-shadow:0 6px 20px rgba(42,34,51,.16)}" +
      ".room .icon{box-shadow:0 6px 20px rgba(42,34,51,.16)}.room .attach{background:rgba(255,255,255,.92)}" +
      ".room .foot{position:absolute;left:0;right:0;bottom:0;padding:0;z-index:2;color:#8a7d96;text-shadow:0 1px 2px #fff}" +
      "@media (max-width:719px){.stage{display:none}}" +
      "@media (prefers-reduced-motion:reduce){.room .stage.in,.room .stage.out,.room .m{animation:none}.peek{transition:none}}" +
      ".foot{text-align:center;font-size:10.5px;color:#a99db3;padding:0 0 8px}.foot a{color:inherit}" +
      "</style>" +
      '<div class="panel"><div class="stage"></div><div class="head"><span class="av">' + esc(c.avatar) + '</span><div class="nm">' + esc(c.name) + "<small>" + esc(c.description) + "</small></div>" +
      '<button aria-label="' + esc(L.close) + '">×</button></div><div class="log"></div>' +
      '<form><button type="button" class="icon attach" aria-label="' + esc(L.attach) + '">📎</button><input type="file" accept="image/*" hidden />' +
      '<input type="text" placeholder="' + esc(L.placeholder) + '" aria-label="' + esc(L.message) + '" /><button class="icon send" aria-label="' + esc(L.send) + '">➤</button></form>' +
      '<div class="foot">' + esc(L.powered) + ' <a href="https://www.mochichatbot.com/?utm_source=mochi_widget&utm_medium=referral&utm_campaign=mochi&utm_content=powered_by" target="_blank" rel="noopener">Mochi</a></div></div>' +
      (c.character
        ? '<button class="fab peek" aria-label="' + esc(L.open) + '"><img alt="" src="' + esc(abs(c.character.peek)) + '" /></button>'
        : '<button class="fab" aria-label="' + esc(L.open) + '">' + esc(c.avatar) + "</button>");

    var panel = root.querySelector(".panel");
    var log = root.querySelector(".log");
    var form = root.querySelector("form");
    var input = root.querySelector("input[type=text]");
    var file = root.querySelector("input[type=file]");
    var image = null;
    var greeted = false;

    var fab = root.querySelector(".fab");
    var ch = c.character ? character(root.querySelector(".stage"), c.character, c.name) : null;
    var peekImg = fab.querySelector("img");
    // Start fetching her as soon as the visitor reaches for the button, so the jump isn't kept waiting.
    if (ch) fab.onpointerenter = fab.onfocus = fab.ontouchstart = ch.prepare;
    if (peekImg) peekImg.onerror = function () { fab.className = "fab"; fab.textContent = c.avatar; };
    function setOpen(open) {
      panel.classList.toggle("open", open);
      if (!ch) return;
      fab.classList.toggle("gone", open);
      if (!open) return ch.hide();
      // Room look right away (history and input show while she loads); back to the plain box if she can't be shown.
      panel.classList.toggle("room", ch.possible());
      ch.show().then(function (ok) { if (!ok) panel.classList.remove("room"); });
    }
    fab.onclick = function () {
      setOpen(!panel.classList.contains("open"));
      if (!greeted) { add("b", esc(c.greeting)); greeted = true; if (ch) ch.say(c.greeting); }
      input.focus();
    };
    root.querySelector(".head button").onclick = function () { setOpen(false); };
    root.querySelector(".attach").onclick = function () { file.click(); };
    file.onchange = function () {
      var f = file.files[0];
      if (!f || f.size > 5 * 1024 * 1024) return;
      var r = new FileReader();
      r.onload = function () { image = r.result; input.placeholder = L.attached; };
      r.readAsDataURL(f);
    };

    form.onsubmit = function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text && !image) return;
      add("u", esc(text) + (image ? '<img src="' + image + '" alt="">' : ""));
      var body = JSON.stringify({ sessionId: sid, text: text, image: image });
      input.value = ""; image = null; file.value = ""; input.placeholder = L.placeholder;
      var wait = add("b", "…");
      fetch(base + "/chat", { method: "POST", headers: { "content-type": "application/json" }, body: body })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          wait.innerHTML = esc(d.reply || d.error || L.noReply);
          log.scrollTop = 1e9;
          if (ch) d.reply ? ch.say(d.reply) : ch.mood("sad");
        })
        .catch(function () { wait.textContent = L.hiccup; log.scrollTop = 1e9; if (ch) ch.mood("sad"); });
      if (ch) ch.act("nod");
    };

    function add(cls, html) {
      var d = document.createElement("div");
      d.className = "m " + cls;
      d.innerHTML = html;
      log.appendChild(d);
      log.scrollTop = 1e9;
      return d;
    }
  }

  function abs(u) { return /^\//.test(u) ? server + u : u; }

  // The standing character. Nothing is downloaded until the chat is first opened; without WebGL2, on a narrow screen,
  // or when the model can't be loaded, the chat simply opens without her.
  function character(stage, cfg, name) {
    var player = null, loading = null, open = false, talk = 0;
    var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function possible() { return !!cfg.model && !(window.matchMedia && matchMedia("(max-width: 719px)").matches); }
    function ready() {
      if (!possible()) return Promise.resolve(null);
      if (loading) return loading;
      loading = import(server + "/widget/livliv/index.js").then(function (m) {
        if (!m.Player.isSupported()) return null;
        var canvas = document.createElement("canvas");
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", name);
        stage.appendChild(canvas);
        var p = new m.Player(canvas, { maxPixelRatio: 1.5, autoplay: false });
        canvas.onclick = function () { p.act(Math.random() < 0.5 ? "shy" : "tilt"); };
        return p.load(abs(cfg.model)).then(function () { player = p; return p; }, function (e) {
          console.warn("[mochi] character not shown:", e && e.message);
          p.dispose({ release: true }); canvas.remove(); return null;
        });
      }).catch(function (e) { console.warn("[mochi] character not shown:", e && e.message); return null; });
      return loading;
    }
    function run(fn) { if (player) fn(player); }
    return {
      prepare: function () { ready(); },
      possible: possible,
      show: function () {
        open = true;
        return ready().then(function (p) {
          if (!p) return false;
          if (!open) return true;
          p.play();
          stage.className = "stage in";
          p.setExpression("smile", 0.6);
          setTimeout(function () { if (open) p.act("hop"); }, reduced ? 0 : 420);
          return true;
        });
      },
      hide: function () {
        open = false;
        if (!player) return;
        stage.className = "stage out";
        setTimeout(function () { if (!open) { stage.className = "stage"; run(function (p) { p.pause(); }); } }, reduced ? 0 : 320);
      },
      act: function (a) { run(function (p) { p.act(a); }); },
      mood: function (id) {
        run(function (p) { if (p.setExpression(id)) setTimeout(function () { p.setExpression("smile", 0.6); }, 2500); });
      },
      // Mouth moves for about as long as the reply would take to say, a few syllables a second.
      say: function (text) {
        run(function (p) {
          var id = ++talk, end = performance.now() + Math.min(6000, 400 + String(text).length * 55), t = 0;
          (function step() {
            if (id !== talk) return;
            if (performance.now() > end || !open) { p.params.mouthOpen = 0; return; }
            if (++t % 4 === 0) { p.params.mouthOpen = 0.25 + Math.random() * 0.75; p.params.vowel = Math.random() * 2 - 1; }
            requestAnimationFrame(step);
          })();
        });
      },
    };
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]; });
  }
})();
