import type { Lang } from "./content";
import type { PrivacyCopy } from "./privacy";

// Terms of use for www.mochichatbot.com and the Mochi software. Same shape as the privacy policy
// (bodies are trusted static HTML: links, <b> and <code> only). Keep it in step with LICENSE (MIT),
// docs/character/README.md (LivLiv model under LivLiv's terms) and lib/privacy.ts.

export const TERMS_UPDATED = "2026-11-17";

const GH = "https://github.com/AM-young-fun/Mochi-ai-chatbot";
const LICENSE = `${GH}/blob/main/LICENSE`;
const GH_ISSUES = `${GH}/issues`;
const a = (href: string, text: string) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
const internal = (href: string, text: string) => `<a href="${href}">${text}</a>`;

export const TERMS: Record<Lang, PrivacyCopy> = {
  en: {
    title: "Terms of use · Mochi",
    description: "The rules for using the Mochi website and the open-source Mochi chatbot software you host yourself.",
    updated: "Last updated: November 17, 2026",
    back: "← Back to Mochi",
    footerLink: "Terms",
    intro: `These terms cover the website www.mochichatbot.com and the Mochi software. Mochi is an open-source project maintained together with the Flatkey team. By using the site or the software you agree to them. How we handle data is in the ${internal("/privacy", "privacy policy")}.`,
    sections: [
      {
        h: "The software is open source",
        p: [
          `Mochi’s code is released under the ${a(LICENSE, "MIT license")}. You may use, copy, change and share it, including for commercial use, as long as you keep the copyright and license notice. Where these terms and the license differ about the code, the license wins.`,
          "Mochi is provided “as is”, without warranty of any kind. We don’t promise it will run without errors, stay compatible with every chat app, or suit any particular purpose.",
        ],
      },
      {
        h: "You run your own bot",
        p: ["Mochi runs on your computer or your server, not ours. When you deploy it, you are the operator of that bot, and you are responsible for:"],
        list: [
          "the server, its security, backups, and keeping Mochi updated;",
          "keeping your Flatkey key, chat app tokens and admin password secret;",
          "what your bot says and does, and how it treats the people who talk to it;",
          "following the laws that apply to you and your users, including privacy and cookie rules (the website widget stores a visitor id; mention it in your own privacy notice);",
          "following the rules of every chat app you connect (Discord, Telegram, Slack, QQ, LINE) and of your hosting provider.",
        ],
      },
      {
        h: "Flatkey and other services",
        p: [
          "Mochi sends messages to <b>Flatkey</b>, the model provider, to write replies. Flatkey is a separate paid service with its own terms, pricing and privacy policy, which apply when you create a Flatkey account and use its API. New Flatkey accounts get $1 of free credit.",
          "Deploy buttons and guides on this site link to hosting providers such as Render, Railway and Sealos, and to other sites such as GitHub, YouTube and livliv.ai. Those services are run by others under their own terms. We aren’t responsible for them, their prices or their availability.",
        ],
      },
      {
        h: "Content and conduct",
        p: [
          "Mochi adds no content filter of its own, and Flatkey allows uncensored conversation. That freedom comes with limits you must keep. Don’t use Mochi to:",
        ],
        list: [
          "create, request or share sexual content involving anyone under 18, in any form, including fiction or drawings;",
          "make sexual or degrading content about a real person without their consent;",
          "harass, threaten, impersonate or deceive people, or collect their personal data without a lawful basis;",
          "break the law, infringe someone’s copyright or other rights, or send spam;",
          "get around the safety rules of the AI models, chat apps or hosting providers you use.",
        ],
      },
      {
        h: "",
        p: [
          "If your bot allows adult content, it’s your job to keep it away from minors, for example by running it only in age-gated spaces. Chat apps and AI models have their own content rules; where they are stricter than these terms, theirs apply too.",
        ],
      },
      {
        h: "The Mochi character",
        p: [
          "The Mochi name, logo, character art and the built-in Mochi character model belong to the project (copyright Flatkey). You may show them in your own Mochi deployment, including the website widget, for as long as you run Mochi. Please don’t use them to suggest that we endorse your bot, product or company.",
          "The moving Mochi character was made on livliv.ai and is also subject to LivLiv’s terms; it carries LivLiv’s watermark. If you upload your own character (a <code>.livliv</code> file or picture), you must have the rights to use it.",
        ],
      },
      {
        h: "This website",
        p: [
          "Guides, prices, comparisons and tutorials on this site are for information and can be out of date. Check a provider’s own pages before you rely on a price or feature. We can change or remove any part of the site at any time.",
        ],
      },
      {
        h: "Limitation of liability",
        p: [
          "To the extent the law allows, the Mochi maintainers and Flatkey are not liable for indirect or consequential losses, lost data, lost profits, or charges from third-party services (including model usage) that come from using the website or the software. Nothing in these terms limits liability that can’t be limited by law, or rights you have as a consumer.",
        ],
      },
      {
        h: "Changes and questions",
        p: [
          `We may update these terms; the date at the top shows the latest version, and continuing to use the site or a new version of Mochi means you accept the update. Questions: ${a(GH_ISSUES, "open an issue on GitHub")}.`,
        ],
      },
    ],
  },

  zh: {
    title: "使用条款 · Mochi",
    description: "使用 Mochi 网站和自托管的开源 Mochi 聊天机器人软件的规则。",
    updated: "最后更新：2026 年 11 月 17 日",
    back: "← 返回 Mochi",
    footerLink: "使用条款",
    intro: `本条款适用于网站 www.mochichatbot.com 和 Mochi 软件。Mochi 是一个开源项目，与 Flatkey 团队共同维护。使用本网站或软件即表示你同意本条款。我们如何处理数据，请见${internal("/zh/privacy", "隐私政策")}。`,
    sections: [
      {
        h: "软件是开源的",
        p: [
          `Mochi 的代码以 ${a(LICENSE, "MIT 协议")}发布。你可以使用、复制、修改和分享，包括商业用途，只要保留版权和许可声明。关于代码，如本条款与该协议不一致，以协议为准。`,
          "Mochi 按“现状”提供，不附带任何形式的保证。我们不保证它没有错误、始终兼容所有聊天应用，或适合某个特定用途。",
        ],
      },
      {
        h: "机器人由你自己运行",
        p: ["Mochi 运行在你的电脑或服务器上，而不是我们的。部署之后，你就是这个机器人的运营者，需要负责："],
        list: [
          "服务器本身、它的安全、备份，以及及时更新 Mochi；",
          "保管好你的 Flatkey 密钥、聊天应用令牌和管理员密码；",
          "你的机器人说了什么、做了什么，以及它如何对待和它聊天的人；",
          "遵守适用于你和你的用户的法律，包括隐私和 Cookie 相关规定（网站聊天窗口会保存访客 ID，请在你自己的隐私说明中提及）；",
          "遵守你接入的每个聊天应用（Discord、Telegram、Slack、QQ、LINE）以及托管服务商的规则。",
        ],
      },
      {
        h: "Flatkey 和其他服务",
        p: [
          "Mochi 会把消息发送给模型服务商 <b>Flatkey</b> 来生成回复。Flatkey 是独立的付费服务，有自己的条款、价格和隐私政策，在你注册 Flatkey 账号并使用其 API 时适用。新注册的 Flatkey 账号可获得 1 美元免费额度。",
          "本网站上的一键部署按钮和指南会链接到 Render、Railway、Sealos 等托管服务商，以及 GitHub、YouTube、livliv.ai 等其他网站。这些服务由他人按各自的条款运营，我们不对它们、它们的价格或可用性负责。",
        ],
      },
      {
        h: "内容与行为",
        p: ["Mochi 自身不加内容过滤，Flatkey 也允许无审查对话。这份自由有你必须遵守的界限。不要用 Mochi："],
        list: [
          "制作、索取或传播任何涉及未满 18 岁者的色情内容，任何形式都不行，包括小说或绘画；",
          "未经本人同意，制作关于真实人物的色情或侮辱性内容；",
          "骚扰、威胁、冒充或欺骗他人，或在没有合法依据的情况下收集他人的个人信息；",
          "违反法律、侵犯他人的著作权或其他权利，或发送垃圾信息；",
          "绕过你所使用的 AI 模型、聊天应用或托管服务商的安全规则。",
        ],
      },
      {
        h: "",
        p: [
          "如果你的机器人允许成人内容，你有责任让未成年人接触不到它，比如只在有年龄验证的空间里运行。聊天应用和 AI 模型有各自的内容规则；如果它们比本条款更严格，也同样适用。",
        ],
      },
      {
        h: "Mochi 角色",
        p: [
          "Mochi 的名称、标志、角色形象以及内置的 Mochi 角色模型归本项目所有（版权归 Flatkey）。在你运行 Mochi 期间，你可以在自己的 Mochi 部署中（包括网站聊天窗口）展示它们。请不要用它们暗示我们为你的机器人、产品或公司背书。",
          "会动的 Mochi 角色是在 livliv.ai 上制作的，同时受 LivLiv 条款约束，并带有 LivLiv 水印。如果你上传自己的角色（<code>.livliv</code> 文件或图片），你必须拥有使用它的权利。",
        ],
      },
      {
        h: "本网站",
        p: [
          "本网站上的指南、价格、对比和教程仅供参考，可能已经过时。在依赖某个价格或功能之前，请以服务商自己的页面为准。我们可以随时更改或删除网站的任何部分。",
        ],
      },
      {
        h: "责任限制",
        p: [
          "在法律允许的范围内，对于因使用本网站或软件而产生的间接或后果性损失、数据丢失、利润损失，或第三方服务产生的费用（包括模型用量），Mochi 维护者和 Flatkey 不承担责任。本条款不限制依法不能限制的责任，也不影响你作为消费者享有的权利。",
        ],
      },
      {
        h: "变更与问题",
        p: [
          `我们可能会更新本条款；顶部日期为最新版本。更新后继续使用本网站或新版 Mochi，即表示你接受更新。有问题请${a(GH_ISSUES, "在 GitHub 上提交 issue")}。`,
        ],
      },
    ],
  },

  ja: {
    title: "利用規約 · Mochi",
    description: "Mochi のウェブサイトと、自分でホストするオープンソースの Mochi チャットボットを使うときのルール。",
    updated: "最終更新：2026 年 11 月 17 日",
    back: "← Mochi に戻る",
    footerLink: "利用規約",
    intro: `この規約は、ウェブサイト www.mochichatbot.com と Mochi ソフトウェアに適用されます。Mochi は Flatkey チームと共同で管理しているオープンソースプロジェクトです。サイトやソフトウェアを使うと、この規約に同意したことになります。データの扱いについては${internal("/ja/privacy", "プライバシーポリシー")}をご覧ください。`,
    sections: [
      {
        h: "ソフトウェアはオープンソースです",
        p: [
          `Mochi のコードは ${a(LICENSE, "MIT ライセンス")}で公開されています。著作権表示とライセンス表示を残せば、商用を含めて使用・複製・改変・配布できます。コードについてこの規約とライセンスが食い違う場合は、ライセンスが優先します。`,
          "Mochi は「現状のまま」提供され、いかなる保証もありません。エラーなく動くこと、すべてのチャットアプリで動き続けること、特定の目的に合うことは約束しません。",
        ],
      },
      {
        h: "ボットはあなたが運用します",
        p: ["Mochi は私たちではなく、あなたのパソコンやサーバーで動きます。デプロイしたら、あなたがそのボットの運用者となり、次のことに責任を持ちます。"],
        list: [
          "サーバー本体、そのセキュリティ、バックアップ、Mochi の更新；",
          "Flatkey のキー、チャットアプリのトークン、管理者パスワードを秘密にしておくこと；",
          "ボットの発言や行動、話しかけてくる人への接し方；",
          "あなたと利用者に適用される法律を守ること。プライバシーや Cookie のルールも含みます（サイトのウィジェットは訪問者 ID を保存するので、あなた自身のプライバシー表示で触れてください）；",
          "接続するすべてのチャットアプリ（Discord、Telegram、Slack、QQ、LINE）とホスティング事業者のルールを守ること。",
        ],
      },
      {
        h: "Flatkey とその他のサービス",
        p: [
          "Mochi は返信を作るために、モデルプロバイダーの <b>Flatkey</b> にメッセージを送ります。Flatkey は独自の規約・料金・プライバシーポリシーを持つ別の有料サービスで、Flatkey のアカウントを作って API を使うときに適用されます。新しい Flatkey アカウントには 1 ドル分の無料クレジットが付きます。",
          "このサイトのデプロイボタンやガイドは、Render、Railway、Sealos などのホスティング事業者や、GitHub、YouTube、livliv.ai などのサイトにリンクしています。これらは他者がそれぞれの規約で運営しており、私たちはそのサービス、料金、提供状況に責任を負いません。",
        ],
      },
      {
        h: "コンテンツと行為",
        p: ["Mochi 自体はコンテンツフィルターを加えず、Flatkey も無検閲の会話を認めています。その自由には守るべき限度があります。Mochi を次の目的に使わないでください。"],
        list: [
          "18 歳未満の人が関わる性的コンテンツを、作成・要求・共有すること（フィクションや絵を含め、どんな形でも）；",
          "実在の人物について、本人の同意なく性的または侮辱的なコンテンツを作ること；",
          "人への嫌がらせ、脅迫、なりすまし、だますこと、または法的根拠なく個人情報を集めること；",
          "法律に違反すること、著作権その他の権利を侵害すること、スパムを送ること；",
          "使用している AI モデル、チャットアプリ、ホスティング事業者の安全ルールを回避すること。",
        ],
      },
      {
        h: "",
        p: [
          "ボットで成人向けコンテンツを許可する場合は、未成年者が触れないようにするのはあなたの責任です（年齢確認のある場所でだけ動かすなど）。チャットアプリや AI モデルにも独自のコンテンツルールがあり、この規約より厳しい場合はそちらも適用されます。",
        ],
      },
      {
        h: "Mochi のキャラクター",
        p: [
          "Mochi の名前、ロゴ、キャラクターのイラスト、内蔵の Mochi キャラクターモデルはプロジェクトに属します（著作権は Flatkey）。Mochi を運用している間は、サイトのウィジェットを含め、あなたの Mochi で表示して構いません。ただし、私たちがあなたのボット、製品、会社を推薦しているように見せる使い方はしないでください。",
          "動く Mochi キャラクターは livliv.ai で作られたもので、LivLiv の規約にも従い、LivLiv の透かしが入っています。自分のキャラクター（<code>.livliv</code> ファイルや画像）をアップロードする場合は、それを使う権利を持っている必要があります。",
        ],
      },
      {
        h: "このウェブサイト",
        p: [
          "このサイトのガイド、料金、比較、チュートリアルは情報提供のためのもので、古くなっていることがあります。料金や機能に頼る前に、各事業者の公式ページを確認してください。サイトのどの部分も、いつでも変更・削除することがあります。",
        ],
      },
      {
        h: "責任の制限",
        p: [
          "法律で認められる範囲で、Mochi の管理者と Flatkey は、サイトやソフトウェアの利用から生じる間接的・派生的な損害、データの消失、逸失利益、第三者サービスの料金（モデルの利用料を含む）について責任を負いません。法律で制限できない責任や、消費者としての権利を制限するものではありません。",
        ],
      },
      {
        h: "変更とお問い合わせ",
        p: [
          `この規約は更新されることがあります。最新版は上部の日付で確認できます。更新後もサイトや新しいバージョンの Mochi を使い続けると、更新に同意したことになります。ご質問は ${a(GH_ISSUES, "GitHub の issue")} でどうぞ。`,
        ],
      },
    ],
  },

  pt: {
    title: "Termos de uso · Mochi",
    description: "As regras para usar o site do Mochi e o software de chatbot open source que você hospeda por conta própria.",
    updated: "Última atualização: 17 de novembro de 2026",
    back: "← Voltar ao Mochi",
    footerLink: "Termos",
    intro: `Estes termos cobrem o site www.mochichatbot.com e o software Mochi. O Mochi é um projeto open source mantido junto com o time da Flatkey. Ao usar o site ou o software, você concorda com eles. Como tratamos dados está na ${internal("/pt/privacy", "política de privacidade")}.`,
    sections: [
      {
        h: "O software é open source",
        p: [
          `O código do Mochi é publicado sob a ${a(LICENSE, "licença MIT")}. Você pode usar, copiar, alterar e compartilhar, inclusive para uso comercial, desde que mantenha o aviso de copyright e de licença. Onde estes termos e a licença divergirem sobre o código, vale a licença.`,
          "O Mochi é fornecido “como está”, sem garantia de nenhum tipo. Não prometemos que ele funcione sem erros, continue compatível com todos os apps de chat ou sirva para um propósito específico.",
        ],
      },
      {
        h: "Você roda o seu próprio bot",
        p: ["O Mochi roda no seu computador ou no seu servidor, não no nosso. Ao implantá-lo, você é o operador desse bot e é responsável por:"],
        list: [
          "o servidor, a segurança dele, backups e manter o Mochi atualizado;",
          "manter em segredo sua chave da Flatkey, os tokens dos apps de chat e a senha de administrador;",
          "o que o seu bot diz e faz, e como ele trata as pessoas que conversam com ele;",
          "cumprir as leis que se aplicam a você e aos seus usuários, incluindo regras de privacidade e de cookies (o widget do site guarda um id de visitante; mencione isso no seu próprio aviso de privacidade);",
          "seguir as regras de cada app de chat que você conectar (Discord, Telegram, Slack, QQ, LINE) e do seu provedor de hospedagem.",
        ],
      },
      {
        h: "Flatkey e outros serviços",
        p: [
          "O Mochi envia mensagens para a <b>Flatkey</b>, a provedora de modelos, para escrever as respostas. A Flatkey é um serviço pago separado, com termos, preços e política de privacidade próprios, que valem quando você cria uma conta na Flatkey e usa a API dela. Contas novas na Flatkey ganham US$ 1 de crédito grátis.",
          "Os botões de implantação e os guias deste site levam a provedores de hospedagem como Render, Railway e Sealos, e a outros sites como GitHub, YouTube e livliv.ai. Esses serviços são operados por terceiros sob os próprios termos. Não somos responsáveis por eles, pelos preços nem pela disponibilidade deles.",
        ],
      },
      {
        h: "Conteúdo e conduta",
        p: ["O Mochi não adiciona filtro de conteúdo próprio, e a Flatkey permite conversas sem censura. Essa liberdade tem limites que você precisa respeitar. Não use o Mochi para:"],
        list: [
          "criar, pedir ou compartilhar conteúdo sexual envolvendo menores de 18 anos, em qualquer forma, inclusive ficção ou desenhos;",
          "criar conteúdo sexual ou degradante sobre uma pessoa real sem o consentimento dela;",
          "assediar, ameaçar, se passar por outra pessoa ou enganar pessoas, ou coletar dados pessoais sem base legal;",
          "violar a lei, infringir direitos autorais ou outros direitos, ou enviar spam;",
          "driblar as regras de segurança dos modelos de IA, apps de chat ou provedores de hospedagem que você usa.",
        ],
      },
      {
        h: "",
        p: [
          "Se o seu bot permite conteúdo adulto, cabe a você mantê-lo longe de menores, por exemplo rodando-o só em espaços com verificação de idade. Apps de chat e modelos de IA têm regras de conteúdo próprias; quando forem mais rígidas que estes termos, elas também valem.",
        ],
      },
      {
        h: "A personagem Mochi",
        p: [
          "O nome Mochi, o logo, a arte da personagem e o modelo da personagem Mochi incluído pertencem ao projeto (copyright Flatkey). Você pode exibi-los na sua própria instalação do Mochi, inclusive no widget do site, enquanto rodar o Mochi. Só não use para sugerir que endossamos o seu bot, produto ou empresa.",
          "A Mochi animada foi feita no livliv.ai, também está sujeita aos termos da LivLiv e traz a marca d’água da LivLiv. Se você enviar sua própria personagem (um arquivo <code>.livliv</code> ou uma imagem), precisa ter o direito de usá-la.",
        ],
      },
      {
        h: "Este site",
        p: [
          "Guias, preços, comparações e tutoriais deste site são informativos e podem estar desatualizados. Confira a página do próprio provedor antes de contar com um preço ou recurso. Podemos mudar ou remover qualquer parte do site a qualquer momento.",
        ],
      },
      {
        h: "Limitação de responsabilidade",
        p: [
          "Na medida permitida por lei, os mantenedores do Mochi e a Flatkey não respondem por perdas indiretas ou consequentes, perda de dados, lucros cessantes ou cobranças de serviços de terceiros (incluindo uso de modelos) decorrentes do uso do site ou do software. Nada nestes termos limita responsabilidades que a lei não permite limitar, nem os seus direitos como consumidor.",
        ],
      },
      {
        h: "Mudanças e dúvidas",
        p: [
          `Podemos atualizar estes termos; a data no topo mostra a versão mais recente, e continuar usando o site ou uma nova versão do Mochi significa aceitar a atualização. Dúvidas: ${a(GH_ISSUES, "abra uma issue no GitHub")}.`,
        ],
      },
    ],
  },
};
