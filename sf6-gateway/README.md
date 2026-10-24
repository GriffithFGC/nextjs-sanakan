# sf6-gateway

Passerelle en lecture seule entre la page statique **leoazzopardi.org/sf6-learn** et le dépôt **sf6-learn** de ton Forgejo.

```
navigateur ──HTTPS──▶ tailscale serve/funnel ──▶ sf6-gateway (127.0.0.1:8787) ──▶ Forgejo (tailnet / localhost)
   clé sf6_…                                       vérifie la clé, jeton read-only     reste privé
```

- **Clés d'accès** à la GitHub : `sf6_<id>_<secret>`, affichées une seule fois, stockées hachées (SHA-256, fichier `0600`), avec expiration optionnelle, révocables à chaud (pas de redémarrage).
- **Liens médias signés** : `<img>` et `<video>` ne peuvent pas envoyer d'en-tête `Authorization`, donc la passerelle signe des URL courtes (HMAC, 6 h par défaut) liées à la clé : révoquer la clé coupe aussi ses liens.
- **Vidéo** : les requêtes `Range` passent jusqu'à Forgejo (endpoint `/media`, compatible Git LFS), la lecture et le déplacement dans la vidéo fonctionnent.
- **Rien d'autre n'est exposé** : un seul dépôt, seulement les fichiers présents dans l'arborescence publiée, jamais les fichiers/dossiers cachés (`.obsidian`, `.git*`, `.trash`…), les symlinks ni ce que tu ajoutes dans `SF6_EXCLUDE`.
- Anti-bruteforce : 10 clés refusées en 10 min depuis une adresse ⇒ pause (429).
- **Python 3.11+ standard uniquement**, aucune dépendance. Tests : `python3 -m unittest -v test_sf6_gateway`.

## API

| Route | Auth | Rôle |
|---|---|---|
| `GET /v1/health` | — | état |
| `GET /v1/session` | `Authorization: Bearer sf6_…` | valide la clé, infos du dépôt, jeton média |
| `GET /v1/index` | Bearer | arborescence complète du commit publié |
| `GET /v1/files/<chemin>` | Bearer **ou** `?t=<jeton média>` | contenu du fichier, `Range` supporté |

Une clé fonctionne donc aussi hors navigateur : `curl -H "Authorization: Bearer sf6_…" https://…/v1/index`.

## Installation (Arch, sur la machine de Forgejo)

**1. Un compte Forgejo dédié, en lecture seule.** Les portées d'un jeton Forgejo s'appliquent à *tous* les dépôts de son propriétaire : ne mets pas ton propre jeton. Crée un utilisateur `sf6-reader`, ajoute-le au dépôt `sf6-learn` en collaborateur **Lecture**, puis dans *Paramètres → Applications* génère un jeton avec la seule portée `read:repository`.

**2. La passerelle.**

```bash
sudo useradd -r -s /usr/bin/nologin sf6
sudo install -Dm644 sf6_gateway.py /opt/sf6-gateway/sf6_gateway.py
sudo install -Dm640 -g sf6 sf6-gateway.env.example /etc/sf6-gateway.env   # puis remplis-le
sudo install -Dm644 sf6-gateway.service /etc/systemd/system/sf6-gateway.service
sudo systemctl daemon-reload && sudo systemctl enable --now sf6-gateway
```

Vérifie la connexion à Forgejo :

```bash
sudo -u sf6 sh -c 'set -a; . /etc/sf6-gateway.env; SF6_DATA_DIR=/var/lib/sf6-gateway python3 /opt/sf6-gateway/sf6_gateway.py check'
```

**3. L'exposer avec Tailscale.** Forgejo reste privé : seul le port de la passerelle est publié.

```bash
# visiteurs publics munis d'une clé (Funnel : ports 443, 8443 ou 10000)
sudo tailscale funnel --bg --https=8443 http://127.0.0.1:8787
# ou, si tous tes lecteurs sont dans ton tailnet
sudo tailscale serve --bg --https=8443 http://127.0.0.1:8787
```

Funnel doit être autorisé pour la machine dans la politique du tailnet (attribut `funnel`). L'URL obtenue ressemble à `https://sanakan.<ton-tailnet>.ts.net:8443`. Teste : `curl https://sanakan.<ton-tailnet>.ts.net:8443/v1/health`.

**4. Brancher le site.** L'URL n'est pas secrète, elle est intégrée au build :

- GitHub Pages : *Settings → Secrets and variables → Actions → Variables*, crée `SF6_GATEWAY_URL` (le workflow la passe en `NEXT_PUBLIC_SF6_GATEWAY`).
- Vercel : *Project → Settings → Environment Variables*, ajoute `NEXT_PUBLIC_SF6_GATEWAY` avec la même valeur.
- En local : `NEXT_PUBLIC_SF6_GATEWAY=https://… npm run dev`, et `http://localhost:3000` dans `SF6_ALLOWED_ORIGINS`.

## Gérer les clés

```bash
alias sf6='sudo -u sf6 env SF6_DATA_DIR=/var/lib/sf6-gateway python3 /opt/sf6-gateway/sf6_gateway.py'
sf6 keys add --label "Alex" --expires 2027-01-31   # la clé s'affiche une seule fois
sf6 keys list
sf6 keys revoke 1a2b3c4d                           # effet immédiat, liens médias compris
```

Les commandes `keys` ne demandent pas la configuration Forgejo. Journal des accès (id de clé, jamais la clé ni le jeton) : `journalctl -u sf6-gateway`.
