import Link from "next/link";
// Sends visitors to their language: English browsers to /en/, everyone else to /fr/.
// Without JavaScript, the two links below do the job.
const pick = `(function(){var l=(navigator.languages&&navigator.languages[0])||navigator.language||"fr";location.replace(/^en\\b/i.test(l)?"/en/":"/fr/");})();`;

export default function LanguagePicker() {
  return (
    <main className="picker">
      <script dangerouslySetInnerHTML={{ __html: pick }} />
      <p className="strata">leoazzopardi.org</p>
      <h1>Léo Azzopardi</h1>
      <p>
        <Link href="/fr/" hrefLang="fr" lang="fr">
          Français
        </Link>
        {" · "}
        <Link href="/en/" hrefLang="en" lang="en">
          English
        </Link>
      </p>
    </main>
  );
}
