import type { Dictionary } from "./types";

// Source: content/draft-en.md (validated). `**text**` renders as <strong>.
const en: Dictionary = {
  meta: {
    title: "Léo Azzopardi · Systems & Network Administrator",
    description:
      "Portfolio of Léo Azzopardi, a cloud, hybrid and on-premise systems & network administrator based in Nice, France: background, infrastructure and automation projects, passions.",
  },
  nav: {
    about: "About",
    background: "Background",
    projects: "Projects",
    skills: "Skills",
    offline: "Offline",
    contact: "Contact",
    languages: "Language",
  },
  hero: {
    eyebrow: "Based in Nice, France · Open to opportunities",
    role: "Systems & Network Administrator · cloud, hybrid, on-premise",
    quote: "I learn systems the way you learn a language: until I can think in them.",
    ctaProjects: "See my projects",
    ctaContact: "Get in touch",
  },
  about: {
    strata: "01 / Signal",
    title: "About",
    paragraphs: [
      "I've always lived a little off the grid. Not out of rejection — out of curiosity. Looking at the world from a different angle taught me to question the obvious, and to understand how things work before I use them.",
      "Introverted and deeply curious, I love learning — a language, a tool, a system — until I grasp its inner logic. That's what drew me to systems and network administration: a field where everything is connected, where each layer rests on the one below, and where rigor is the difference between infrastructure that holds and infrastructure that breaks.",
      "I keep learning, mostly by building: Azure infrastructures deployed with a single command, microservice architectures, and now an AI content-generation platform designed to survive failure.",
      "What I bring to a team: calm, method, a drive to understand the *why* — and the habit of improving through practice rather than relying on talent.",
    ],
    profileTitle: "Profile",
    profile: [
      "INTP-T — the logician, always taking things apart",
      "Languages: French, fluent English, beginner Chinese and Japanese",
      "Operating mode: understand → build → improve (kaizen)",
    ],
  },
  background: {
    strata: "02 / Origin",
    title: "Background",
    experienceTitle: "Experience",
    experience: {
      role: "IT Technician",
      org: "Green B",
      place: "Valbonne",
      date: "2024",
      context:
        "A telecom operator based in Sophia Antipolis, since closed. My role sat where three worlds meet: production servers, the physical network and the Azure cloud.",
      missionsTitle: "What I did",
      missions: [
        { label: "Production", text: "Kept production servers in operational condition: keeping running what must not stop." },
        { label: "Network", text: "Administered and configured the fleet of Draytek network equipment." },
        { label: "Cloud", text: "Infrastructure as Code on Azure to automate and monitor resource deployment." },
      ],
      takeawaysTitle: "What I took from it",
      takeaways: [
        "The rigor production demands: every intervention counts.",
        "A hands-on link between network hardware and the cloud.",
        "The reflex to automate whatever must be reliable and repeatable.",
      ],
      tags: ["Production", "Draytek", "Azure", "Infrastructure as Code", "Monitoring"],
    },
    educationTitle: "Education",
    education: {
      title: "French National Professional Certification — Systems & Network Administrator (cloud, hybrid and on-premise)",
      school: "Simplon SUD · Microsoft School by Simplon",
      place: "Nice",
      date: "2023 – 2024",
      summary:
        "A career-focused program run by Microsoft and Simplon, built around one goal: designing, running and securing a company's infrastructure, whether it lives on site, in the cloud or across both.",
      modulesTitle: "Curriculum",
      modules: [
        { label: "Networking & security", items: ["Administering and securing an enterprise network", "Firewalls and filtering systems", "Cryptography"] },
        { label: "Identity", items: ["Authentication and authorization", "Active Directory"] },
        { label: "Systems & cloud", items: ["Virtualization (VMware)", "On-premise, cloud and hybrid infrastructure", "Scripting and automation"] },
      ],
      certification: { label: "Certification earned", name: "Microsoft SC-900", detail: "Security, Compliance & Identity Fundamentals" },
      tags: ["Windows Server", "Linux", "Active Directory", "VMware", "Azure", "Security"],
    },
  },
  projects: {
    strata: "03 / Constructs",
    title: "Projects",
    intro: "What I build outside the frame — that's where I learn the most.",
    items: [
      {
        name: "generation.cell",
        date: "2026",
        status: "in progress",
        body: [
          "An autonomous AI content-generation platform. A modular pipeline (ideation → generation → assembly → quality control → publishing) whose editorial line is driven entirely by configuration, without duplicating infrastructure.",
          "Built for reliability: an explicit state machine, concurrent workers with locking and automatic crash recovery, idempotent calls, and vendor-neutral S3-compatible object storage.",
        ],
        tags: ["Python", "FastAPI", "PostgreSQL / pgvector", "Docker", "S3", "LLM"],
        note: "Private code (organization)",
      },
      {
        name: "InfluenceAI",
        date: "2024 – 2025",
        body: [
          "A microservice platform driven by language models: around thirty orchestrated services (API gateway, event bus, orchestrator, multi-LLM manager — GPT, Claude, Mixtral, Llama), with Prometheus monitoring, a CI/CD pipeline and Docker Swarm deployment.",
          "My first large-scale project: it taught me how to split a system apart, make the pieces talk, and keep an eye on them.",
        ],
        tags: ["Python", "Microservices", "Docker Swarm", "Prometheus", "CI/CD", "LLM"],
      },
      {
        name: "AzureInfraCLI",
        date: "2024",
        body: [
          "A complete enterprise infrastructure deployed on Azure from a single script: 5 segmented networks with their security rules (NSGs), Active Directory on Windows Server 2022, a Windows 11 client, web servers behind HAProxy, Uptime Kuma monitoring, containerized TrueNAS and GLPI, and an Azure SQL database.",
        ],
        tags: ["Azure CLI", "Bash", "Active Directory", "Networking", "cloud-init", "Docker"],
      },
      {
        name: "AzureProxies",
        date: "2024",
        body: [
          "Automated deployment of a fleet of Squid proxy servers on Azure, with HAProxy load balancing, configuration through cloud-init and Blob Storage, and lifecycle management scripts.",
        ],
        tags: ["Azure", "Bash", "Squid", "HAProxy", "IaC"],
        link: { label: "GitHub", href: "https://github.com/GriffithFGC/AzureProxies" },
      },
    ],
    extrasTitle: "Contributions & environment",
    extras: [
      {
        name: "neuron_poker",
        body: "Migrated a reinforcement-learning environment to the new Gym API.",
        tags: ["Python", "RL"],
        link: { label: "GitHub", href: "https://github.com/GriffithFGC/neuron_poker" },
      },
      {
        name: "dotfiles",
        body: "My workstation: Arch Linux, Hyprland, Quickshell. Because you understand a system better when you've assembled it yourself.",
        tags: ["Linux"],
        link: { label: "GitHub", href: "https://github.com/GriffithFGC/dotfiles" },
      },
    ],
  },
  skills: {
    strata: "04 / Tools",
    title: "Skills",
    groups: [
      { label: "Systems", items: "Linux (Debian, Arch), Windows Server, Active Directory, virtualization (VMware)" },
      { label: "Networking & security", items: "Segmentation, firewalls and filtering, NSGs, HAProxy, authentication and authorization, cryptography" },
      { label: "Cloud", items: "Microsoft Azure (VM, VNet, Storage, SQL), hybrid and on-premise infrastructure" },
      { label: "Automation", items: "Bash, Python, Infrastructure as Code, cloud-init, Docker / Docker Swarm, CI/CD" },
      { label: "Data & back-end", items: "SQL, PostgreSQL, FastAPI, microservice architectures" },
      { label: "Monitoring", items: "Prometheus, Uptime Kuma" },
    ],
    softLabel: "Soft skills",
    soft: ["Adaptability", "Teamwork", "Curiosity", "Technology watch", "Problem solving", "Proactivity", "Rigor", "Composure under pressure"],
  },
  offline: {
    strata: "05 / Offline",
    title: "Offline",
    intro: "What shapes me when the screen goes dark (well, almost).",
    blocks: [
      {
        title: "Fighting games",
        body: [
          "For me, VS fighting games are a school. Behind every match are hours of practice, honest analysis of your own mistakes, and an entire community driven by a single motivation: getting better — together. Rivals train with each other, share what they discover, and help newcomers find their footing.",
          "My first love is still **Super Smash Bros. Melee**, where I played a deliberately flashy Fox. Today my main game is **Street Fighter 6**, playing **Viper** — a character known for her demanding execution. That's exactly what I look for when I pick up a character: a steep learning curve, where every step forward is earned in training mode.",
        ],
        link: { label: "start.gg profile — Griffith", href: "https://www.start.gg/user/fc8a6021" },
        page: { label: "Learning Resources · SF6", href: "/sf6-learn/" },
      },
      {
        title: "Martial arts",
        body: [
          "I practiced **kendo**, and kept far more than technique from it: discipline, respect for the opponent, and the belief that a sound mind needs a sound body.",
        ],
      },
      {
        title: "Reading",
        body: [
          "**Berserk**, **Vagabond**, and Tsutomu Nihei's **Blame!**. Three works about perseverance, the search for self, and the vastness of structures far bigger than us.",
        ],
      },
      { title: "Music", body: ["Guitar, for about ten years now. A craft you never finish learning."] },
      {
        title: "Science",
        body: ["Biology and astronomy: from the infinitely small to the infinitely large — two ways of understanding complex systems."],
      },
    ],
  },
  contact: {
    strata: "06 / Transmission",
    title: "Contact",
    intro: "A role, a project, or a chat about Blame! or SF6 frame data — my channel is open.",
    links: [
      { label: "Email", value: "azzopardileo0@gmail.com", href: "mailto:azzopardileo0@gmail.com" },
      { label: "LinkedIn", value: "leoazzopardi", href: "https://www.linkedin.com/in/leoazzopardi/" },
      { label: "GitHub", value: "GriffithFGC", href: "https://github.com/GriffithFGC" },
      { label: "start.gg", value: "Griffith", href: "https://www.start.gg/user/fc8a6021" },
    ],
  },
  depths: { hero: "The shaft", clouds: "Sea of clouds", forest: "Hanging forest" },
  a11y: {
    skip: "Skip to content",
    sections: "Sections",
    newTab: "(opens in a new tab)",
    pause: "Pause animations",
  },
  footer: "© 2026 Léo Azzopardi · leoazzopardi.org",
};

export default en;
