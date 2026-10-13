# Content draft — English version

> Step 2 — adapted from `brouillon-fr.md`. Natural English rather than a literal translation.

---

## 0. Navigation

Home · About · Background · Projects · Skills · Offline · Contact

*(Decorative "strata" labels kept identical to the French version: `01 / SIGNAL`, `02 / ORIGIN`…)*

---

## 1. Home (hero)

**Léo Azzopardi**

Systems & Network Administrator — cloud, hybrid, on-premise

> I learn systems the way you learn a language: until I can think in them.

Based in Nice, France · Open to opportunities

[See my projects] [Get in touch]

---

## 2. About — `01 / SIGNAL`

I've always lived a little off the grid. Not out of rejection — out of curiosity. Looking at the world from a different angle taught me to question the obvious, and to understand how things work before I use them.

Introverted and deeply curious, I love learning — a language, a tool, a system — until I grasp its inner logic. That's what drew me to systems and network administration: a field where everything is connected, where each layer rests on the one below, and where rigor is the difference between infrastructure that holds and infrastructure that breaks.

I keep learning, mostly by building: Azure infrastructures deployed with a single command, microservice architectures, and now an AI content-generation platform designed to survive failure.

What I bring to a team: calm, method, a drive to understand the *why* — and the habit of improving through practice rather than relying on talent.

*(Small "profile" box:)*
- INTP-T — the logician, always taking things apart
- Languages: French, fluent English
- Operating mode: understand → build → improve (kaizen)

---

## 3. Background — `02 / ORIGIN`

### Experience

**IT Technician** — Green B, Valbonne · 2024
*Telecom operator (company since closed)*
- Kept production servers in operational condition
- Administered and configured Draytek network equipment
- Infrastructure as Code on Azure to automate and monitor resource deployment

### Education

**French National Professional Certification — Systems & Network Administrator (cloud, hybrid and on-premise)** — Simplon SUD (Microsoft School by Simplon), Nice · 2023 – 2024
- Administering and securing an enterprise network
- Scripting and automation
- Firewalls and filtering systems
- Authentication and authorization (Active Directory)
- Cryptography
- Virtualization (VMware) and on-premise, cloud and hybrid infrastructure

### Certification

**Microsoft SC-900** — Security, Compliance & Identity Fundamentals

---

## 4. Projects — `03 / CONSTRUCTS`

> What I build outside the frame — that's where I learn the most.

### generation.cell — *in progress* · 2026
An autonomous AI content-generation platform. A modular pipeline (ideation → generation → assembly → quality control → publishing) whose editorial line is driven entirely by configuration, without duplicating infrastructure.
Built for reliability: an explicit state machine, concurrent workers with locking and automatic crash recovery, idempotent calls, and vendor-neutral S3-compatible object storage.
`Python` `FastAPI` `PostgreSQL / pgvector` `Docker` `S3` `LLM`
*Private code (organization)*

### InfluenceAI · 2024 – 2025
A microservice platform driven by language models: around thirty orchestrated services (API gateway, event bus, orchestrator, multi-LLM manager — GPT, Claude, Mixtral, Llama), with Prometheus monitoring, a CI/CD pipeline and Docker Swarm deployment.
My first large-scale project: it taught me how to split a system apart, make the pieces talk, and keep an eye on them.
`Python` `Microservices` `Docker Swarm` `Prometheus` `CI/CD` `LLM`

### AzureInfraCLI · 2024
A complete enterprise infrastructure deployed on Azure from a single script: 5 segmented networks with their security rules (NSGs), Active Directory on Windows Server 2022, a Windows 11 client, web servers behind HAProxy, Uptime Kuma monitoring, containerized TrueNAS and GLPI, and an Azure SQL database.
`Azure CLI` `Bash` `Active Directory` `Networking` `cloud-init` `Docker`

### AzureProxies · 2024
Automated deployment of a fleet of Squid proxy servers on Azure, with HAProxy load balancing, configuration through cloud-init and Blob Storage, and lifecycle management scripts.
`Azure` `Bash` `Squid` `HAProxy` `IaC`
[GitHub]

### Contributions & environment
- **neuron_poker** — migrated a reinforcement-learning environment to the new Gym API. `Python` `RL`
- **dotfiles** — my workstation: Arch Linux, Hyprland, Quickshell. Because you understand a system better when you've assembled it yourself. `Linux`

---

## 5. Skills — `04 / TOOLS`

**Systems** — Linux (Debian, Arch), Windows Server, Active Directory, virtualization (VMware)
**Networking & security** — segmentation, firewalls and filtering, NSGs, HAProxy, authentication and authorization, cryptography
**Cloud** — Microsoft Azure (VM, VNet, Storage, SQL), hybrid and on-premise infrastructure
**Automation** — Bash, Python, Infrastructure as Code, cloud-init, Docker / Docker Swarm, CI/CD
**Data & back-end** — SQL, PostgreSQL, FastAPI, microservice architectures
**Monitoring** — Prometheus, Uptime Kuma

**Soft skills** — adaptability · teamwork · curiosity · technology watch · problem solving · proactivity · rigor · composure under pressure

---

## 6. Offline — `05 / OFFLINE`

> What shapes me when the screen goes dark (well, almost).

### Fighting games
For me, VS fighting games are a school. Behind every match are hours of practice, honest analysis of your own mistakes, and an entire community driven by a single motivation: getting better — together. Rivals train with each other, share what they discover, and help newcomers find their footing.
My first love is still **Super Smash Bros. Melee**, where I played a deliberately flashy Fox. Today my main game is **Street Fighter 6**, playing **Viper** — a character known for her demanding execution. That's exactly what I look for when I pick up a character: a steep learning curve, where every step forward is earned in training mode.
[start.gg profile — Griffith]

### Martial arts
I practiced **kendo**, and kept far more than technique from it: discipline, respect for the opponent, and the belief that a sound mind needs a sound body.

### Reading
**Berserk**, **Vagabond**, and Tsutomu Nihei's **Blame!**. Three works about perseverance, the search for self, and the vastness of structures far bigger than us.

### Music
Guitar, for about ten years now. A craft you never finish learning.

### Science
Biology and astronomy: from the infinitely small to the infinitely large — two ways of understanding complex systems.

---

## 7. Contact — `06 / TRANSMISSION`

> A role, a project, or a chat about Blame! or SF6 frame data — my channel is open.

- Email — azzopardileo0@gmail.com
- LinkedIn — leoazzopardi
- GitHub — GriffithFGC
- start.gg — Griffith

*Footer:* © 2026 Léo Azzopardi · leoazzopardi.org
