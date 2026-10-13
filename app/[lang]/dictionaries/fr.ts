import type { Dictionary } from "./types";

// Source: content/brouillon-fr.md (validated). `**text**` renders as <strong>.
const fr: Dictionary = {
  meta: {
    title: "Léo Azzopardi · Administrateur systèmes & réseaux",
    description:
      "Portfolio de Léo Azzopardi, administrateur systèmes & réseaux cloud, hybride et on-premise basé à Nice : parcours, projets d'infrastructure et d'automatisation, passions.",
  },
  nav: {
    about: "À propos",
    background: "Parcours",
    projects: "Projets",
    skills: "Compétences",
    offline: "Hors-ligne",
    contact: "Contact",
    languages: "Langue",
  },
  hero: {
    eyebrow: "Basé à Nice · Ouvert aux opportunités",
    role: "Administrateur systèmes & réseaux · cloud, hybride, on-premise",
    quote: "J'apprends les systèmes comme on apprend une langue : jusqu'à pouvoir y penser.",
    ctaProjects: "Voir mes projets",
    ctaContact: "Me contacter",
  },
  about: {
    strata: "01 / Signal",
    title: "À propos",
    paragraphs: [
      "J'ai toujours vécu un peu en marge du réseau. Pas par rejet : par curiosité. Regarder le monde depuis un autre angle m'a appris à remettre en question les évidences, et à comprendre comment les choses fonctionnent avant de les utiliser.",
      "Introverti et profondément curieux, j'aime apprendre — une langue, un outil, un système — jusqu'à en saisir la logique interne. C'est ce qui m'a mené vers l'administration systèmes et réseaux : un domaine où tout est relié, où chaque couche repose sur la précédente, et où la rigueur fait la différence entre une infrastructure qui tient et une qui cède.",
      "Je me forme en continu, souvent en construisant : infrastructures Azure déployées en une commande, architectures microservices, et aujourd'hui une plateforme de génération de contenu par IA conçue pour résister aux pannes.",
      "Ce que j'apporte à une équipe : du calme, de la méthode, l'envie de comprendre le *pourquoi* — et l'habitude de progresser par l'entraînement plutôt que par le talent.",
    ],
    profileTitle: "Profil",
    profile: [
      "INTP-T — l'architecte logique, toujours en train de déconstruire",
      "Langues : français, anglais courant, chinois et japonais (débutant)",
      "Mode de fonctionnement : comprendre → construire → améliorer (kaizen)",
    ],
  },
  background: {
    strata: "02 / Origine",
    title: "Parcours",
    experienceTitle: "Expérience",
    experience: {
      role: "Technicien informatique",
      org: "Green B",
      place: "Valbonne",
      date: "2024",
      context:
        "Opérateur télécom installé à Sophia Antipolis, aujourd'hui fermé. J'y ai tenu un poste à la jonction de trois mondes : les serveurs de production, le réseau physique et le cloud Azure.",
      missionsTitle: "Missions",
      missions: [
        { label: "Production", text: "Maintien en condition opérationnelle des serveurs de production : garder en service ce qui ne doit pas s'arrêter." },
        { label: "Réseau", text: "Administration et configuration du parc d'équipements réseau Draytek." },
        { label: "Cloud", text: "Infrastructure as Code sur Azure pour automatiser et superviser le déploiement des ressources." },
      ],
      takeawaysTitle: "Ce que j'en retire",
      takeaways: [
        "La rigueur qu'impose une production : chaque intervention compte.",
        "Le lien concret entre le matériel réseau et le cloud.",
        "Le réflexe d'automatiser ce qui doit être fiable et reproductible.",
      ],
      tags: ["Production", "Draytek", "Azure", "Infrastructure as Code", "Supervision"],
    },
    educationTitle: "Formation",
    education: {
      title: "Titre professionnel Administrateur systèmes & réseaux — cloud, hybride et on-premise",
      school: "Simplon SUD · École Microsoft by Simplon",
      place: "Nice",
      date: "2023 – 2024",
      summary:
        "Une formation professionnalisante portée par Microsoft et Simplon, centrée sur un objectif : concevoir, administrer et sécuriser l'infrastructure d'une entreprise, qu'elle soit dans ses murs, dans le cloud ou entre les deux.",
      modulesTitle: "Programme",
      modules: [
        { label: "Réseau & sécurité", items: ["Administration et sécurisation d'un réseau d'entreprise", "Pare-feu et systèmes de filtrage", "Cryptographie"] },
        { label: "Identités", items: ["Authentification et autorisations", "Active Directory"] },
        { label: "Systèmes & cloud", items: ["Virtualisation (VMware)", "Infrastructures on-premise, cloud et hybrides", "Scripting et automatisation"] },
      ],
      certification: { label: "Certification obtenue", name: "Microsoft SC-900", detail: "Security, Compliance & Identity Fundamentals" },
      tags: ["Windows Server", "Linux", "Active Directory", "VMware", "Azure", "Sécurité"],
    },
  },
  projects: {
    strata: "03 / Constructions",
    title: "Projets",
    intro: "Ce que je construis en dehors du cadre — c'est là que j'apprends le plus.",
    items: [
      {
        name: "generation.cell",
        date: "2026",
        status: "en cours",
        body: [
          "Plateforme autonome de génération de contenu par IA. Un pipeline modulaire (idéation → génération → assemblage → contrôle qualité → publication) dont la ligne éditoriale est entièrement pilotée par configuration, sans dupliquer l'infrastructure.",
          "Conçue pour la fiabilité : machine à états explicite, workers concurrents avec verrous et reprise automatique après crash, appels idempotents, stockage objet compatible S3 indépendant du fournisseur.",
        ],
        tags: ["Python", "FastAPI", "PostgreSQL / pgvector", "Docker", "S3", "LLM"],
        note: "Code privé (organisation)",
      },
      {
        name: "InfluenceAI",
        date: "2024 – 2025",
        body: [
          "Plateforme microservices pilotée par des modèles de langage : une trentaine de services orchestrés (API gateway, bus d'événements, orchestrateur, gestionnaire multi-LLM — GPT, Claude, Mixtral, Llama), avec supervision Prometheus, pipeline CI/CD et déploiement Docker Swarm.",
          "Mon premier projet à grande échelle : j'y ai appris à découper un système, à le faire communiquer et à le surveiller.",
        ],
        tags: ["Python", "Microservices", "Docker Swarm", "Prometheus", "CI/CD", "LLM"],
      },
      {
        name: "AzureInfraCLI",
        date: "2024",
        body: [
          "Une infrastructure d'entreprise complète déployée sur Azure en un seul script : 5 réseaux segmentés avec leurs règles de sécurité (NSG), Active Directory sur Windows Server 2022, poste client Windows 11, serveurs web derrière HAProxy, supervision Uptime Kuma, TrueNAS et GLPI conteneurisés, base Azure SQL.",
        ],
        tags: ["Azure CLI", "Bash", "Active Directory", "Réseau", "cloud-init", "Docker"],
      },
      {
        name: "AzureProxies",
        date: "2024",
        body: [
          "Déploiement automatisé d'un parc de serveurs proxy Squid sur Azure, avec répartition de charge HAProxy, configuration par cloud-init et Blob Storage, et scripts de gestion du cycle de vie.",
        ],
        tags: ["Azure", "Bash", "Squid", "HAProxy", "IaC"],
        link: { label: "GitHub", href: "https://github.com/GriffithFGC/AzureProxies" },
      },
    ],
    extrasTitle: "Contributions & environnement",
    extras: [
      {
        name: "neuron_poker",
        body: "Migration d'un environnement d'apprentissage par renforcement vers la nouvelle API Gym.",
        tags: ["Python", "RL"],
        link: { label: "GitHub", href: "https://github.com/GriffithFGC/neuron_poker" },
      },
      {
        name: "dotfiles",
        body: "Mon poste de travail : Arch Linux, Hyprland, Quickshell. Parce qu'on comprend mieux un système qu'on a assemblé soi-même.",
        tags: ["Linux"],
        link: { label: "GitHub", href: "https://github.com/GriffithFGC/dotfiles" },
      },
    ],
  },
  skills: {
    strata: "04 / Outils",
    title: "Compétences",
    groups: [
      { label: "Systèmes", items: "Linux (Debian, Arch), Windows Server, Active Directory, virtualisation (VMware)" },
      { label: "Réseau & sécurité", items: "Segmentation, pare-feu et filtrage, NSG, HAProxy, authentification et autorisations, cryptographie" },
      { label: "Cloud", items: "Microsoft Azure (VM, VNet, Storage, SQL), infrastructures hybrides et on-premise" },
      { label: "Automatisation", items: "Bash, Python, Infrastructure as Code, cloud-init, Docker / Docker Swarm, CI/CD" },
      { label: "Données & back-end", items: "SQL, PostgreSQL, FastAPI, architectures microservices" },
      { label: "Supervision", items: "Prometheus, Uptime Kuma" },
    ],
    softLabel: "Savoir-être",
    soft: ["Adaptabilité", "Esprit d'équipe", "Curiosité", "Veille technologique", "Résolution de problèmes", "Proactivité", "Rigueur", "Calme et sang-froid"],
  },
  offline: {
    strata: "05 / Hors-ligne",
    title: "Hors-ligne",
    intro: "Ce qui me construit quand l'écran s'éteint (ou presque).",
    blocks: [
      {
        title: "Jeux de combat",
        body: [
          "Le VS Fighting est pour moi une école. Derrière chaque match, il y a des heures d'entraînement, l'analyse de ses propres erreurs, et une communauté entière portée par une seule motivation : devenir meilleur — ensemble. On s'entraîne entre adversaires, on partage ses découvertes, on aide les nouveaux.",
          "Mon premier amour reste **Super Smash Bros. Melee**, où je jouais un Fox volontairement flashy. Aujourd'hui, mon jeu principal est **Street Fighter 6**, avec **Viper** — un personnage réputé pour son exigence d'exécution. C'est précisément ce que je recherche en abordant un personnage : une courbe d'apprentissage raide, où chaque progrès se gagne à l'entraînement.",
        ],
        link: { label: "Profil start.gg — Griffith", href: "https://www.start.gg/user/fc8a6021" },
      },
      {
        title: "Arts martiaux",
        body: [
          "J'ai pratiqué le **kendo**, et j'en garde bien plus qu'une technique : une discipline, un respect de l'adversaire, et la conviction qu'un esprit sain demande un corps sain.",
        ],
      },
      {
        title: "Lecture",
        body: [
          "**Berserk**, **Vagabond**, **Blame!** de Tsutomu Nihei. Trois œuvres sur la persévérance, la quête de soi et l'immensité des structures qui nous dépassent.",
        ],
      },
      { title: "Musique", body: ["La guitare, depuis une dizaine d'années. Un apprentissage qui ne s'arrête jamais."] },
      {
        title: "Sciences",
        body: ["La biologie et l'astronomie : de l'infiniment petit à l'infiniment grand, deux façons de comprendre les systèmes complexes."],
      },
    ],
  },
  contact: {
    strata: "06 / Transmission",
    title: "Contact",
    intro: "Un poste, un projet, une discussion sur Blame! ou sur la frame data de SF6 — mon canal est ouvert.",
    links: [
      { label: "Email", value: "azzopardileo0@gmail.com", href: "mailto:azzopardileo0@gmail.com" },
      { label: "LinkedIn", value: "leoazzopardi", href: "https://www.linkedin.com/in/leoazzopardi/" },
      { label: "GitHub", value: "GriffithFGC", href: "https://github.com/GriffithFGC" },
      { label: "start.gg", value: "Griffith", href: "https://www.start.gg/user/fc8a6021" },
    ],
  },
  depths: { hero: "Le puits", clouds: "Mer de nuages", forest: "Forêt suspendue" },
  footer: "© 2026 Léo Azzopardi · leoazzopardi.org",
};

export default fr;
