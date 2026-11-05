import Image from "next/image";
import { flatkeyKeyUrl } from "@/lib/links";
import { REPO, pathFor, privacyPathFor } from "@/lib/site";

// /ja/line: for freelancers and small agencies who build LINE Official Account bots for clients.
// Japanese only. Every claim here is something Mochi does today (see src/adapters/line.ts,
// src/core/persona.ts "qa" preset, src/knowledge/ingest.ts, the dashboard's usage page).

export const LINE_FAQ: Array<[string, string]> = [
  [
    "クライアントの名前で出せますか？",
    "はい。LINE 上ではクライアントの LINE 公式アカウントの名前とアイコンで表示されます。ボットの性格・口調・あいさつ文もダッシュボードで自由に設定できます。",
  ],
  [
    "資料にないことを聞かれたらどうなりますか？",
    "Q&A／サポートボットでは、推測で答えずに、あらかじめ決めた案内文（例：「担当者からご連絡します」）を返します。価格やポリシーを作り話で答えないための設定です。",
  ],
  [
    "会話のデータはどこに保存されますか？",
    "Mochi を置いたサーバーのディスクだけです。Mochi の開発元にデータが送られることはありません。返答を作るために、メッセージは AI モデル（Flatkey 経由）に送られます。",
  ],
  [
    "クライアントにも管理画面を使ってもらえますか？",
    "ダッシュボードの管理者は 1 台につき 1 人です。クライアント自身に設定を触ってもらう場合は、クライアントごとに別の Mochi を立ててください。",
  ],
  [
    "LINE のメッセージ料金はどうなりますか？",
    "Mochi は受け取ったメッセージへの返事に reply（応答）を使い、時間がたった後の送信だけ push を使います。料金プランやメッセージ通数の数え方は、LINE 公式の最新情報を確認してください。",
  ],
  [
    "改造して納品してもいいですか？",
    "MIT ライセンスなので、商用利用・改造・納品ができます。著作権表示とライセンス文は残してください。",
  ],
];

const RENDER_DEPLOY = "https://render.com/deploy?repo=https://github.com/AM-young-fun/Mochi-ai-chatbot";

export function LineFreelance() {
  const lang = "ja" as const;
  const fk = (spot: string) => flatkeyKeyUrl(spot, lang);
  const ext = { target: "_blank", rel: "noopener" } as const;
  const cta = (spot: string) => ({ "data-cta": `${spot}_${lang}` });

  return (
    <>
      <header className="nav">
        <div className="wrap nav-in">
          <a className="brand" href={pathFor(lang)}>
            <Image src="/mochi-avatar-128.png" alt="" width={36} height={36} priority />
            <span>Mochi</span>
          </a>
          <nav className="links">
            <a href="#deliver">できること</a>
            <a href="#clients">複数クライアント</a>
            <a href="#cost">費用</a>
            <a href="#steps">導入手順</a>
            <a href="#faq">よくある質問</a>
          </nav>
          <a className="btn btn-pink btn-sm" href="#steps" {...cta("line_nav")}>導入手順を見る</a>
        </div>
      </header>

      <main className="line-page">
        <section className="sec line-hero">
          <div className="wrap narrow">
            <p className="kicker">フリーランス・制作会社の方へ</p>
            <h1>
              LINE 公式アカウントの AI 窓口を、
              <br />
              <span className="grad">クライアントごとに。</span>
            </h1>
            <p className="lead">
              Mochi はオープンソース（MIT）の AI チャットボットです。クライアントの資料から答える LINE ボットを、1 台のサーバーでまとめて運用できます。ソフトは無料。かかるのはサーバー代と AI の利用料だけです。
            </p>
            <div className="ctas">
              <a className="btn btn-pink" href="#steps" {...cta("line_hero")}>🚀 導入手順を見る</a>
              <a className="btn btn-ghost" href={REPO} {...ext} {...cta("line_github")}>⭐ GitHub で見る</a>
            </div>
          </div>
        </section>

        <section id="deliver" className="sec sec-tint">
          <div className="wrap">
            <h2>納品できるもの</h2>
            <p className="sub">クライアントの店舗やサービスの「よくある質問」に、24 時間 LINE で答えるボット。</p>
            <div className="grid4">
              <article className="card">
                <div className="ico">📄</div>
                <h3>資料から答える</h3>
                <p>PDF・Word・テキスト・CSV、ウェブページの URL を読み込ませるだけ。日本語の資料もそのまま検索できます。</p>
              </article>
              <article className="card">
                <div className="ico">🛡️</div>
                <h3>作り話をしない</h3>
                <p>Q&A／サポートボットは資料にないことを推測で答えず、決めた案内文で返します。</p>
              </article>
              <article className="card">
                <div className="ico">🖼️</div>
                <h3>画像も読める</h3>
                <p>お客様が送った写真やスクリーンショットを見て答えられます。</p>
              </article>
              <article className="card">
                <div className="ico">🌐</div>
                <h3>サイトにも同じボット</h3>
                <p>同じボットを、クライアントのサイトのチャット窓にも置けます（コードは 1 行）。LINE のグループでも使えます。</p>
              </article>
            </div>
          </div>
        </section>

        <section id="clients" className="sec">
          <div className="wrap narrow">
            <h2>複数のクライアントを 1 台で</h2>
            <p className="sub">ボットをクライアントの数だけ作れば、サーバーは 1 台で足ります。</p>
            <ul className="checks">
              <li><b>ボットはクライアントごと。</b>性格・口調・資料・LINE チャネルはそれぞれ別です。</li>
              <li><b>Webhook もボットごと。</b><code>https://あなたのドメイン/webhook/line/ボットID</code> の形で、ダッシュボードに表示されます。</li>
              <li><b>使いすぎを防ぐ。</b>ボットごとに 1 日のトークン上限を決められます。</li>
              <li><b>請求の根拠になる。</b>「使用量とコスト」画面で、ボットごとの利用量を確認できます。</li>
            </ul>
            <p className="note">ダッシュボードの管理者は 1 台につき 1 人です。クライアントにも画面を触ってもらうなら、クライアントごとに別の Mochi を立ててください。</p>
          </div>
        </section>

        <section id="cost" className="sec sec-tint">
          <div className="wrap">
            <h2>費用のイメージ</h2>
            <p className="sub">設定費や月額の運用費は、あなたが自由に決められます。</p>
            <div className="grid3">
              <article className="card">
                <div className="ico">🆓</div>
                <h3>ソフトウェア：0 円</h3>
                <p>MIT ライセンス。商用利用・改造・納品ができます（ライセンス表記は残してください）。</p>
              </article>
              <article className="card">
                <div className="ico">🖥️</div>
                <h3>サーバー</h3>
                <p>常時起動と HTTPS が必要です。小さな VPS、Sealos、Render（Starter プランから）など。1 台で複数のボットを動かせます。</p>
              </article>
              <article className="card">
                <div className="ico">⚡</div>
                <h3>AI の利用料</h3>
                <p>Flatkey のキー 1 つで GPT・Claude・Gemini・DeepSeek など。主要モデルは公式価格より 20% 以上安く、失敗した呼び出しは無料です。新規登録で $1 分の無料クレジット付き。</p>
              </article>
            </div>
          </div>
        </section>

        <section id="steps" className="sec">
          <div className="wrap narrow">
            <h2>導入手順</h2>
            <p className="sub">サーバーを用意してから、クライアント 1 社目のボットを LINE につなぐまで。</p>
            <ol className="line-steps">
              <li>
                <h3>サーバーに Mochi を置く</h3>
                <p>Docker が動く VPS か、Sealos・Render を使います。LINE は HTTPS の公開 URL がないとメッセージを届けてくれません。</p>
                <div className="row-btns">
                  <a className="btn btn-ghost btn-sm" href={`${pathFor(lang)}#get-started`} {...cta("line_server_guide")}>サーバーでの手順</a>
                  <a className="btn btn-ghost btn-sm" href={RENDER_DEPLOY} {...ext} {...cta("line_render")}>Render にデプロイ ↗</a>
                </div>
              </li>
              <li>
                <h3>管理者パスワードを決める</h3>
                <p>ダッシュボードを初めて開くとパスワードの設定を求められます。別の PC から最初に設定するときは、サーバーのログに出るワンタイムコードを入力します。</p>
              </li>
              <li>
                <h3>Flatkey のキーを連携する</h3>
                <p>Flatkey でキーを作り、ダッシュボードの「Flatkey API キー」に貼り付けて連携します。すべてのボットがこのキー 1 つで動きます。</p>
                <div className="row-btns">
                  <a className="btn btn-pink btn-sm" href={fk("line_key")} {...ext} {...cta("line_flatkey")}>Flatkey でキーを作る ↗</a>
                </div>
              </li>
              <li>
                <h3>クライアント用のボットを作る</h3>
                <p>「Q&A／サポートボット」のテンプレートで作成し、ナレッジベースにクライアントの資料をアップロードします。資料にないときの案内文もここで決めます。</p>
              </li>
              <li>
                <h3>LINE をつなぐ</h3>
                <p>
                  LINE Developers で Messaging API のチャネルを用意し、<b>チャネルアクセストークン（長期）</b>と<b>チャネルシークレット</b>をボットの「チャネル」画面に貼ります。表示される Webhook URL を LINE 側に設定し、「検証」してから「Webhook の利用」をオンにすれば完了です。
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section id="faq" className="sec sec-tint">
          <div className="wrap narrow">
            <h2>よくある質問</h2>
            {LINE_FAQ.map(([q, a]) => (
              <details key={q} className="faq">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="sec">
          <div className="wrap narrow line-final">
            <h2>まずは自分の PC で試してみてください</h2>
            <p className="sub">コマンド 1 行で起動します。手順を 3 分の動画でも説明しています。</p>
            <div className="ctas">
              <a className="btn btn-pink" href={`${pathFor(lang)}#get-started`} {...cta("line_final")}>🚀 セットアップガイドへ</a>
              <a className="btn btn-ghost" href={fk("line_final")} {...ext} {...cta("line_final_key")}>Flatkey でキーを作る ↗</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-in">
          <div><b>Mochi</b> · オープンソースの AI チャットボット。AI は Flatkey。</div>
          <div className="foot-links">
            <a href={REPO} {...ext} {...cta("line_footer_github")}>GitHub</a>
            <a href={`${REPO}/blob/main/LICENSE`} {...ext}>MIT ライセンス</a>
            <a href={privacyPathFor(lang)}>プライバシー</a>
          </div>
        </div>
      </footer>
    </>
  );
}
