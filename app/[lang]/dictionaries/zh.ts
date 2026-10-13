import type { Dictionary } from "./types";

// Simplified Chinese, translated from fr.ts / en.ts. `**text**` renders as <strong>.
const zh: Dictionary = {
  meta: {
    title: "Léo Azzopardi · 系统与网络管理员",
    description: "Léo Azzopardi 的作品集。常驻法国尼斯的系统与网络管理员，涉及云、混合与本地基础设施：经历、基础设施与自动化项目、个人爱好。",
  },
  nav: {
    about: "关于我",
    background: "经历",
    projects: "项目",
    skills: "技能",
    offline: "离线",
    contact: "联系",
    languages: "语言",
  },
  hero: {
    eyebrow: "常驻法国尼斯 · 寻找新的机会",
    role: "系统与网络管理员 · 云、混合与本地部署",
    quote: "我学习系统，就像学习一门语言：直到能用它来思考。",
    ctaProjects: "查看项目",
    ctaContact: "联系我",
  },
  about: {
    strata: "01 / 信号",
    title: "关于我",
    paragraphs: [
      "我一直生活在网络的边缘。不是出于排斥，而是出于好奇。从另一个角度看世界，让我学会质疑理所当然的事，并在使用一样东西之前，先弄懂它如何运作。",
      "我性格内向，好奇心很强，喜欢学习——一门语言、一个工具、一个系统——直到掌握它内在的逻辑。正是这一点把我带向了系统与网络管理：在这个领域里，一切相互关联，每一层都建立在下一层之上，而严谨决定了基础设施是屹立不倒还是轰然倒塌。",
      "我不断自学，多半是通过动手搭建：一条命令部署的 Azure 基础设施、微服务架构，以及如今一个为抵御故障而设计的 AI 内容生成平台。",
      "我能为团队带来的：冷静、方法，以及追问*为什么*的习惯——还有靠练习而不是靠天赋来进步的习惯。",
    ],
    profileTitle: "简介",
    profile: [
      "INTP-T——逻辑学家，总在拆解事物",
      "语言：法语，流利英语，中文与日语（初学）",
      "工作方式：理解 → 构建 → 改进（改善，kaizen）",
    ],
  },
  background: {
    strata: "02 / 起源",
    title: "经历",
    experienceTitle: "工作经历",
    experience: {
      role: "IT 技术员",
      org: "Green B",
      place: "瓦尔博讷（Valbonne）",
      date: "2024",
      context: "位于索菲亚科技园（Sophia Antipolis）的电信运营商，现已关闭。我的岗位处在三个领域的交汇处：生产服务器、物理网络与 Azure 云。",
      missionsTitle: "工作内容",
      missions: [
        { label: "生产", text: "维护生产服务器的运行状态：让不能停的系统持续运转。" },
        { label: "网络", text: "管理与配置 Draytek 网络设备。" },
        { label: "云", text: "在 Azure 上以基础设施即代码（IaC）实现资源部署的自动化与监控。" },
      ],
      takeawaysTitle: "我的收获",
      takeaways: ["生产环境要求的严谨：每一次操作都很重要。", "网络硬件与云之间的实际联系。", "把需要可靠、可重复的事情自动化的习惯。"],
      tags: ["生产环境", "Draytek", "Azure", "基础设施即代码", "监控"],
    },
    educationTitle: "教育",
    education: {
      title: "法国国家职业资格证书 · 系统与网络管理员（云、混合与本地部署）",
      school: "Simplon SUD · Microsoft by Simplon 学院",
      place: "尼斯",
      date: "2023 – 2024",
      summary: "由微软与 Simplon 合办的职业培训，围绕一个目标：设计、管理并保护企业的基础设施，无论它位于本地、云端，还是两者之间。",
      modulesTitle: "课程内容",
      modules: [
        { label: "网络与安全", items: ["企业网络的管理与安全加固", "防火墙与过滤系统", "密码学"] },
        { label: "身份管理", items: ["身份验证与授权", "Active Directory"] },
        { label: "系统与云", items: ["虚拟化（VMware）", "本地、云与混合基础设施", "脚本与自动化"] },
      ],
      certification: { label: "已获认证", name: "Microsoft SC-900", detail: "安全性、合规性与身份基础" },
      tags: ["Windows Server", "Linux", "Active Directory", "VMware", "Azure", "安全"],
    },
  },
  projects: {
    strata: "03 / 构造",
    title: "项目",
    intro: "我在框架之外搭建的东西——也是我学到最多的地方。",
    items: [
      {
        name: "generation.cell",
        date: "2026",
        status: "进行中",
        body: [
          "一个自主运行的 AI 内容生成平台。模块化流水线（构思 → 生成 → 组装 → 质量检查 → 发布），编辑方针完全由配置驱动，无需复制基础设施。",
          "为可靠性而设计：显式状态机、带锁与崩溃后自动恢复的并发工作进程、幂等调用，以及不依赖特定厂商的 S3 兼容对象存储。",
        ],
        tags: ["Python", "FastAPI", "PostgreSQL / pgvector", "Docker", "S3", "LLM"],
        note: "私有代码（组织）",
      },
      {
        name: "InfluenceAI",
        date: "2024 – 2025",
        body: [
          "由大语言模型驱动的微服务平台：约三十个协同运行的服务（API 网关、事件总线、编排器、多模型管理器——GPT、Claude、Mixtral、Llama），配有 Prometheus 监控、CI/CD 流水线与 Docker Swarm 部署。",
          "我的第一个大规模项目：它教会我如何拆分系统、让各部分相互通信，并持续监控它们。",
        ],
        tags: ["Python", "微服务", "Docker Swarm", "Prometheus", "CI/CD", "LLM"],
      },
      {
        name: "AzureInfraCLI",
        date: "2024",
        body: [
          "用一个脚本在 Azure 上部署完整的企业基础设施：5 个分段网络及其安全规则（NSG）、Windows Server 2022 上的 Active Directory、Windows 11 客户端、HAProxy 之后的 Web 服务器、Uptime Kuma 监控、容器化的 TrueNAS 与 GLPI，以及 Azure SQL 数据库。",
        ],
        tags: ["Azure CLI", "Bash", "Active Directory", "网络", "cloud-init", "Docker"],
      },
      {
        name: "AzureProxies",
        date: "2024",
        body: ["在 Azure 上自动部署一组 Squid 代理服务器，使用 HAProxy 负载均衡，通过 cloud-init 与 Blob Storage 进行配置，并附带生命周期管理脚本。"],
        tags: ["Azure", "Bash", "Squid", "HAProxy", "IaC"],
        link: { label: "GitHub", href: "https://github.com/GriffithFGC/AzureProxies" },
      },
    ],
    extrasTitle: "贡献与工作环境",
    extras: [
      {
        name: "neuron_poker",
        body: "将一个强化学习环境迁移到新版 Gym API。",
        tags: ["Python", "RL"],
        link: { label: "GitHub", href: "https://github.com/GriffithFGC/neuron_poker" },
      },
      {
        name: "dotfiles",
        body: "我的工作环境：Arch Linux、Hyprland、Quickshell。因为亲手组装的系统，才理解得最透彻。",
        tags: ["Linux"],
        link: { label: "GitHub", href: "https://github.com/GriffithFGC/dotfiles" },
      },
    ],
  },
  skills: {
    strata: "04 / 工具",
    title: "技能",
    groups: [
      { label: "系统", items: "Linux（Debian、Arch）、Windows Server、Active Directory、虚拟化（VMware）" },
      { label: "网络与安全", items: "网络分段、防火墙与过滤、NSG、HAProxy、身份验证与授权、密码学" },
      { label: "云", items: "Microsoft Azure（VM、VNet、Storage、SQL）、混合与本地基础设施" },
      { label: "自动化", items: "Bash、Python、基础设施即代码、cloud-init、Docker / Docker Swarm、CI/CD" },
      { label: "数据与后端", items: "SQL、PostgreSQL、FastAPI、微服务架构" },
      { label: "监控", items: "Prometheus、Uptime Kuma" },
    ],
    softLabel: "软技能",
    soft: ["适应能力", "团队精神", "好奇心", "技术跟踪", "解决问题", "主动性", "严谨", "冷静沉着"],
  },
  offline: {
    strata: "05 / 离线",
    title: "离线",
    intro: "屏幕熄灭之后塑造我的东西（差不多吧）。",
    blocks: [
      {
        title: "格斗游戏",
        body: [
          "对我来说，对战格斗游戏是一所学校。每一场对局背后，都是数小时的练习、对自身错误的分析，以及一整个只为一个目标而聚在一起的社区：一起变得更强。对手之间一起训练、分享发现、帮助新人。",
          "我的初恋仍是 **Super Smash Bros. Melee**，我在其中玩一个刻意华丽的 Fox。如今我的主力游戏是 **Street Fighter 6**，使用 **Viper**——一个以操作难度著称的角色。这正是我选择角色时所追求的：陡峭的学习曲线，每一点进步都要在训练中赢得。",
        ],
        link: { label: "start.gg 主页 — Griffith", href: "https://www.start.gg/user/fc8a6021" },
      },
      {
        title: "武道",
        body: ["我练过**剑道**，从中收获的远不止技术：纪律、对对手的尊重，以及健全的精神需要健全的身体这一信念。"],
      },
      {
        title: "阅读",
        body: ["**Berserk**、**Vagabond**，以及弐瓶勉的 **Blame!**。三部关于坚持、寻找自我，以及远超我们的庞大结构的作品。"],
      },
      { title: "音乐", body: ["弹吉他已有十年左右。一门永远学不完的手艺。"] },
      { title: "科学", body: ["生物学与天文学：从无限小到无限大，两种理解复杂系统的方式。"] },
    ],
  },
  contact: {
    strata: "06 / 传输",
    title: "联系",
    intro: "一个职位、一个项目，或者聊聊 Blame! 和 SF6 的帧数据——我的频道随时开着。",
    links: [
      { label: "邮箱", value: "azzopardileo0@gmail.com", href: "mailto:azzopardileo0@gmail.com" },
      { label: "LinkedIn", value: "leoazzopardi", href: "https://www.linkedin.com/in/leoazzopardi/" },
      { label: "GitHub", value: "GriffithFGC", href: "https://github.com/GriffithFGC" },
      { label: "start.gg", value: "Griffith", href: "https://www.start.gg/user/fc8a6021" },
    ],
  },
  depths: { hero: "竖井", clouds: "云海", forest: "悬垂之林" },
  footer: "© 2026 Léo Azzopardi · leoazzopardi.org",
};

export default zh;
