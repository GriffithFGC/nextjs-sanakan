import type { Dictionary } from "./types";

// Japanese, translated from fr.ts / en.ts. `**text**` renders as <strong>.
const ja: Dictionary = {
  meta: {
    title: "Léo Azzopardi · システム・ネットワーク管理者",
    description: "フランス・ニースを拠点とするシステム・ネットワーク管理者、Léo Azzopardi のポートフォリオ。クラウド、ハイブリッド、オンプレミス。経歴、インフラと自動化のプロジェクト、趣味。",
  },
  nav: {
    about: "自己紹介",
    background: "経歴",
    projects: "プロジェクト",
    skills: "スキル",
    offline: "オフライン",
    contact: "連絡先",
    languages: "言語",
  },
  hero: {
    eyebrow: "フランス・ニース在住 · 新しい機会を探しています",
    role: "システム・ネットワーク管理者 · クラウド、ハイブリッド、オンプレミス",
    quote: "システムは言語を学ぶように学ぶ。それで考えられるようになるまで。",
    ctaProjects: "プロジェクトを見る",
    ctaContact: "連絡する",
  },
  about: {
    strata: "01 / シグナル",
    title: "自己紹介",
    paragraphs: [
      "私はずっと、ネットワークの少し外側で生きてきました。拒絶からではなく、好奇心から。違う角度から世界を見ることで、当たり前を疑い、使う前に仕組みを理解することを学びました。",
      "内向的で、とても好奇心が強い。言語でも、ツールでも、システムでも、その内側の論理がつかめるまで学ぶのが好きです。それが私をシステム・ネットワーク管理へと導きました。すべてがつながり、各層が下の層の上に成り立ち、厳密さがインフラを支えるか崩すかを分ける分野です。",
      "私は学び続けています。たいていは作りながら。コマンド一つでデプロイする Azure インフラ、マイクロサービスアーキテクチャ、そして今は障害に耐えるよう設計した AI コンテンツ生成プラットフォーム。",
      "チームにもたらせるもの：落ち着き、方法、*なぜ*を理解しようとする姿勢。そして才能ではなく練習で上達する習慣です。",
    ],
    profileTitle: "プロフィール",
    profile: [
      "INTP-T ── 論理学者。いつも物事を分解している",
      "言語：フランス語、英語（流暢）、中国語・日本語（初級）",
      "進め方：理解する → 作る → 改善する（改善）",
    ],
  },
  background: {
    strata: "02 / 起源",
    title: "経歴",
    experienceTitle: "職歴",
    experience: {
      role: "IT テクニシャン",
      org: "Green B",
      place: "ヴァルボンヌ（Valbonne）",
      date: "2024",
      context: "ソフィア・アンティポリスにあった通信事業者（現在は閉鎖）。私の仕事は、本番サーバー、物理ネットワーク、Azure クラウドという三つの世界が交わる場所にありました。",
      missionsTitle: "担当業務",
      missions: [
        { label: "本番環境", text: "本番サーバーの運用保守。止まってはならないものを動かし続けること。" },
        { label: "ネットワーク", text: "Draytek ネットワーク機器の管理と設定。" },
        { label: "クラウド", text: "Azure 上の Infrastructure as Code によるリソース展開の自動化と監視。" },
      ],
      takeawaysTitle: "得たもの",
      takeaways: ["本番環境が求める厳密さ：一つひとつの作業が重要であること。", "ネットワーク機器とクラウドの具体的なつながり。", "確実で再現可能であるべきものを自動化する習慣。"],
      tags: ["本番環境", "Draytek", "Azure", "Infrastructure as Code", "監視"],
    },
    educationTitle: "学歴",
    education: {
      title: "フランス国家職業資格 · システム・ネットワーク管理者（クラウド、ハイブリッド、オンプレミス）",
      school: "Simplon SUD · Microsoft by Simplon スクール",
      place: "ニース",
      date: "2023 – 2024",
      summary: "Microsoft と Simplon による職業訓練。目標は一つ：社内にあっても、クラウドにあっても、その両方にまたがっていても、企業のインフラを設計し、運用し、守ること。",
      modulesTitle: "カリキュラム",
      modules: [
        { label: "ネットワークとセキュリティ", items: ["企業ネットワークの管理とセキュリティ強化", "ファイアウォールとフィルタリング", "暗号技術"] },
        { label: "ID 管理", items: ["認証と認可", "Active Directory"] },
        { label: "システムとクラウド", items: ["仮想化（VMware）", "オンプレミス、クラウド、ハイブリッドのインフラ", "スクリプトと自動化"] },
      ],
      certification: { label: "取得資格", name: "Microsoft SC-900", detail: "セキュリティ、コンプライアンス、ID の基礎" },
      tags: ["Windows Server", "Linux", "Active Directory", "VMware", "Azure", "セキュリティ"],
    },
  },
  projects: {
    strata: "03 / 構造物",
    title: "プロジェクト",
    intro: "枠の外で作っているもの。いちばん多くを学ぶ場所です。",
    items: [
      {
        name: "generation.cell",
        date: "2026",
        status: "進行中",
        body: [
          "自律型の AI コンテンツ生成プラットフォーム。モジュール式のパイプライン（構想 → 生成 → 組み立て → 品質チェック → 公開）で、編集方針はインフラを複製せず、すべて設定で制御されます。",
          "信頼性のための設計：明示的なステートマシン、ロックとクラッシュ後の自動復旧を備えた並行ワーカー、冪等な呼び出し、特定ベンダーに依存しない S3 互換オブジェクトストレージ。",
        ],
        tags: ["Python", "FastAPI", "PostgreSQL / pgvector", "Docker", "S3", "LLM"],
        note: "非公開コード（組織）",
      },
      {
        name: "InfluenceAI",
        date: "2024 – 2025",
        body: [
          "大規模言語モデルで動くマイクロサービス基盤。約 30 のサービス（API ゲートウェイ、イベントバス、オーケストレーター、マルチ LLM マネージャー ── GPT、Claude、Mixtral、Llama）を連携させ、Prometheus による監視、CI/CD パイプライン、Docker Swarm でのデプロイを備えます。",
          "初めての大規模プロジェクト。システムを分割し、部品同士を通信させ、それを見守る方法を学びました。",
        ],
        tags: ["Python", "マイクロサービス", "Docker Swarm", "Prometheus", "CI/CD", "LLM"],
      },
      {
        name: "AzureInfraCLI",
        date: "2024",
        body: [
          "一つのスクリプトで Azure 上に企業インフラ一式をデプロイ：セキュリティルール（NSG）付きの 5 つのセグメント化ネットワーク、Windows Server 2022 上の Active Directory、Windows 11 クライアント、HAProxy 配下の Web サーバー、Uptime Kuma による監視、コンテナ化した TrueNAS と GLPI、Azure SQL データベース。",
        ],
        tags: ["Azure CLI", "Bash", "Active Directory", "ネットワーク", "cloud-init", "Docker"],
      },
      {
        name: "AzureProxies",
        date: "2024",
        body: ["Azure 上に Squid プロキシサーバー群を自動デプロイ。HAProxy による負荷分散、cloud-init と Blob Storage による設定、ライフサイクル管理スクリプトを備えます。"],
        tags: ["Azure", "Bash", "Squid", "HAProxy", "IaC"],
        link: { label: "GitHub", href: "https://github.com/GriffithFGC/AzureProxies" },
      },
    ],
    extrasTitle: "コントリビューションと作業環境",
    extras: [
      {
        name: "neuron_poker",
        body: "強化学習環境を新しい Gym API に移行。",
        tags: ["Python", "RL"],
        link: { label: "GitHub", href: "https://github.com/GriffithFGC/neuron_poker" },
      },
      {
        name: "dotfiles",
        body: "私の作業環境：Arch Linux、Hyprland、Quickshell。自分で組み立てたシステムほど、よく理解できるから。",
        tags: ["Linux"],
        link: { label: "GitHub", href: "https://github.com/GriffithFGC/dotfiles" },
      },
    ],
  },
  skills: {
    strata: "04 / 道具",
    title: "スキル",
    groups: [
      { label: "システム", items: "Linux（Debian、Arch）、Windows Server、Active Directory、仮想化（VMware）" },
      { label: "ネットワークとセキュリティ", items: "セグメンテーション、ファイアウォールとフィルタリング、NSG、HAProxy、認証と認可、暗号技術" },
      { label: "クラウド", items: "Microsoft Azure（VM、VNet、Storage、SQL）、ハイブリッドおよびオンプレミスのインフラ" },
      { label: "自動化", items: "Bash、Python、Infrastructure as Code、cloud-init、Docker / Docker Swarm、CI/CD" },
      { label: "データとバックエンド", items: "SQL、PostgreSQL、FastAPI、マイクロサービスアーキテクチャ" },
      { label: "監視", items: "Prometheus、Uptime Kuma" },
    ],
    softLabel: "ソフトスキル",
    soft: ["適応力", "チームワーク", "好奇心", "技術動向の把握", "問題解決", "主体性", "厳密さ", "冷静さ"],
  },
  offline: {
    strata: "05 / オフライン",
    title: "オフライン",
    intro: "画面が消えたあと（まあ、ほぼ）、私を形づくっているもの。",
    blocks: [
      {
        title: "格闘ゲーム",
        body: [
          "私にとって対戦格闘ゲームは学校です。一つひとつの試合の裏には、何時間もの練習、自分のミスの分析、そしてたった一つの動機で動くコミュニティがあります。一緒に強くなること。ライバル同士で練習し、発見を共有し、初心者を助ける。",
          "初恋は今も **Super Smash Bros. Melee**。あえて派手な Fox を使っていました。今のメインは **Street Fighter 6** の **Viper**。操作の難しさで知られるキャラクターです。キャラクターを選ぶとき、私が求めているのはまさにそれ。急な学習曲線と、トレーニングで勝ち取る一歩一歩の上達です。",
        ],
        link: { label: "start.gg プロフィール — Griffith", href: "https://www.start.gg/user/fc8a6021" },
      },
      {
        title: "武道",
        body: ["**剣道**をやっていました。そこから得たのは技術だけではありません。規律、相手への敬意、そして健全な精神は健全な身体に宿るという信念です。"],
      },
      {
        title: "読書",
        body: ["**ベルセルク**、**バガボンド**、弐瓶勉の **BLAME!**。粘り強さ、自分探し、そして私たちを遥かに超える巨大な構造についての三作品。"],
      },
      { title: "音楽", body: ["ギターを弾いて十年ほど。終わりのない学びです。"] },
      { title: "科学", body: ["生物学と天文学。無限に小さなものから無限に大きなものまで、複雑なシステムを理解する二つの方法。"] },
    ],
  },
  contact: {
    strata: "06 / 送信",
    title: "連絡先",
    intro: "仕事の話でも、プロジェクトでも、BLAME! や SF6 のフレームデータの話でも。チャンネルは開いています。",
    links: [
      { label: "メール", value: "azzopardileo0@gmail.com", href: "mailto:azzopardileo0@gmail.com" },
      { label: "LinkedIn", value: "leoazzopardi", href: "https://www.linkedin.com/in/leoazzopardi/" },
      { label: "GitHub", value: "GriffithFGC", href: "https://github.com/GriffithFGC" },
      { label: "start.gg", value: "Griffith", href: "https://www.start.gg/user/fc8a6021" },
    ],
  },
  depths: { hero: "縦穴", clouds: "雲海", forest: "吊り下がる森" },
  footer: "© 2026 Léo Azzopardi · leoazzopardi.org",
};

export default ja;
