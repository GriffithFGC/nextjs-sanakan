# Brouillon de contenu — version française

> Étape 2 — textes à valider avant traduction et intégration.
> Version validée par Léo (dates et localisation corrigées).

---

## 0. Navigation

Accueil · À propos · Parcours · Projets · Compétences · Hors-ligne · Contact

*(Chaque section porte aussi un petit numéro de « strate » façon carnet de bord : `01 / SIGNAL`, `02 / ORIGINE`… — purement décoratif, les titres restent lisibles pour un recruteur.)*

---

## 1. Accueil (hero)

**Léo Azzopardi**

Administrateur systèmes & réseaux — cloud, hybride, on-premise

> J'apprends les systèmes comme on apprend une langue : jusqu'à pouvoir y penser.

Basé à Nice · Ouvert aux opportunités

[Voir mes projets] [Me contacter]

---

## 2. À propos — `01 / SIGNAL`

J'ai toujours vécu un peu en marge du réseau. Pas par rejet : par curiosité. Regarder le monde depuis un autre angle m'a appris à remettre en question les évidences, et à comprendre comment les choses fonctionnent avant de les utiliser.

Introverti et profondément curieux, j'aime apprendre — une langue, un outil, un système — jusqu'à en saisir la logique interne. C'est ce qui m'a mené vers l'administration systèmes et réseaux : un domaine où tout est relié, où chaque couche repose sur la précédente, et où la rigueur fait la différence entre une infrastructure qui tient et une qui cède.

Je me forme en continu, souvent en construisant : infrastructures Azure déployées en une commande, architectures microservices, et aujourd'hui une plateforme de génération de contenu par IA conçue pour résister aux pannes.

Ce que j'apporte à une équipe : du calme, de la méthode, l'envie de comprendre le *pourquoi* — et l'habitude de progresser par l'entraînement plutôt que par le talent.

*(Mini-encart « profil » :)*
- INTP-T — l'architecte logique, toujours en train de déconstruire
- Langues : français, anglais courant
- Mode de fonctionnement : comprendre → construire → améliorer (kaizen)

---

## 3. Parcours — `02 / ORIGINE`

### Expérience

**Technicien informatique** — Green B, Valbonne · 2024
*Opérateur télécom (entreprise aujourd'hui fermée)*
- Maintien en condition opérationnelle des serveurs de production
- Administration et configuration des équipements réseau Draytek
- Infrastructure as Code sur Azure pour automatiser et superviser le déploiement de ressources

### Formation

**Titre professionnel Administrateur systèmes & réseaux — cloud, hybride et on-premise** — Simplon SUD (École Microsoft by Simplon), Nice · 2023 - 2024
- Administration et sécurisation d'un réseau d'entreprise
- Scripting et automatisation
- Pare-feu et systèmes de filtrage
- Authentification et autorisations (Active Directory)
- Cryptographie
- Virtualisation (VMware) et infrastructures on-premise, cloud et hybrides

### Certification

**Microsoft SC-900** — Security, Compliance & Identity Fundamentals

---

## 4. Projets — `03 / CONSTRUCTIONS`

> Ce que je construis en dehors du cadre — c'est là que j'apprends le plus.

### generation.cell — *en cours* · 2026
Plateforme autonome de génération de contenu par IA. Un pipeline modulaire (idéation → génération → assemblage → contrôle qualité → publication) dont la ligne éditoriale est entièrement pilotée par configuration, sans dupliquer l'infrastructure.
Conçue pour la fiabilité : machine à états explicite, workers concurrents avec verrous et reprise automatique après crash, appels idempotents, stockage objet compatible S3 indépendant du fournisseur.
`Python` `FastAPI` `PostgreSQL / pgvector` `Docker` `S3` `LLM`
*Code privé (organisation)*

### InfluenceAI · 2024 – 2025
Plateforme microservices pilotée par des modèles de langage : une trentaine de services orchestrés (API gateway, bus d'événements, orchestrateur, gestionnaire multi-LLM — GPT, Claude, Mixtral, Llama), avec supervision Prometheus, pipeline CI/CD et déploiement Docker Swarm.
Mon premier projet à grande échelle : j'y ai appris à découper un système, à le faire communiquer et à le surveiller.
`Python` `Microservices` `Docker Swarm` `Prometheus` `CI/CD` `LLM`

### AzureInfraCLI · 2024
Une infrastructure d'entreprise complète déployée sur Azure en un seul script : 5 réseaux segmentés avec leurs règles de sécurité (NSG), Active Directory sur Windows Server 2022, poste client Windows 11, serveurs web derrière HAProxy, supervision Uptime Kuma, TrueNAS et GLPI conteneurisés, base Azure SQL.
`Azure CLI` `Bash` `Active Directory` `Réseau` `cloud-init` `Docker`

### AzureProxies · 2024
Déploiement automatisé d'un parc de serveurs proxy Squid sur Azure, avec répartition de charge HAProxy, configuration par cloud-init et Blob Storage, et scripts de gestion du cycle de vie.
`Azure` `Bash` `Squid` `HAProxy` `IaC`
[GitHub]

### Contributions & environnement
- **neuron_poker** — migration d'un environnement d'apprentissage par renforcement vers la nouvelle API Gym. `Python` `RL`
- **dotfiles** — mon poste de travail : Arch Linux, Hyprland, Quickshell. Parce qu'on comprend mieux un système qu'on a assemblé soi-même. `Linux`

---

## 5. Compétences — `04 / OUTILS`

**Systèmes** — Linux (Debian, Arch), Windows Server, Active Directory, virtualisation (VMware)
**Réseau & sécurité** — segmentation, pare-feu et filtrage, NSG, HAProxy, authentification et autorisations, cryptographie
**Cloud** — Microsoft Azure (VM, VNet, Storage, SQL), infrastructures hybrides et on-premise
**Automatisation** — Bash, Python, Infrastructure as Code, cloud-init, Docker / Docker Swarm, CI/CD
**Données & back-end** — SQL, PostgreSQL, FastAPI, architectures microservices
**Supervision** — Prometheus, Uptime Kuma

**Savoir-être** — adaptabilité · esprit d'équipe · curiosité · veille technologique · résolution de problèmes · proactivité · rigueur · calme et sang-froid

---

## 6. Hors-ligne — `05 / HORS-LIGNE`

> Ce qui me construit quand l'écran s'éteint (ou presque).

### Jeux de combat
Le VS Fighting est pour moi une école. Derrière chaque match, il y a des heures d'entraînement, l'analyse de ses propres erreurs, et une communauté entière portée par une seule motivation : devenir meilleur — ensemble. On s'entraîne entre adversaires, on partage ses découvertes, on aide les nouveaux.
Mon premier amour reste **Super Smash Bros. Melee**, où je jouais un Fox volontairement flashy. Aujourd'hui, mon jeu principal est **Street Fighter 6**, avec **Viper** — un personnage réputé pour son exigence d'exécution. C'est précisément ce que je recherche en abordant un personnage : une courbe d'apprentissage raide, où chaque progrès se gagne à l'entraînement.
[Profil start.gg — Griffith]

### Arts martiaux
J'ai pratiqué le **kendo**, et j'en garde bien plus qu'une technique : une discipline, un respect de l'adversaire, et la conviction qu'un esprit sain demande un corps sain.

### Lecture
**Berserk**, **Vagabond**, **Blame!** de Tsutomu Nihei. Trois œuvres sur la persévérance, la quête de soi et l'immensité des structures qui nous dépassent.

### Musique
La guitare, depuis une dizaine d'années. Un apprentissage qui ne s'arrête jamais.

### Sciences
La biologie et l'astronomie : de l'infiniment petit à l'infiniment grand, deux façons de comprendre les systèmes complexes.

---

## 7. Contact — `06 / TRANSMISSION`

> Un poste, un projet, une discussion sur Blame! ou sur la frame data de SF6 — mon canal est ouvert.

- Email — azzopardileo0@gmail.com
- LinkedIn — leoazzopardi
- GitHub — GriffithFGC
- start.gg — Griffith

*Pied de page :* © 2026 Léo Azzopardi · leoazzopardi.org
