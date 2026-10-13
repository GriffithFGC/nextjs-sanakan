import Link from "next/link";
// Sends visitors to their language (English, Chinese, Japanese); everyone else gets French.
// Without JavaScript, the two links below do the job.
const pick = `(function(){var l=(navigator.languages&&navigator.languages[0])||navigator.language||"fr";var m=/^(en|zh|ja)\\b/i.exec(l);location.replace("/"+(m?m[1].toLowerCase():"fr")+"/");})();`;

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
        {" · "}
        <Link href="/zh/" hrefLang="zh-Hans" lang="zh-Hans">
          简体中文
        </Link>
        {" · "}
        <Link href="/ja/" hrefLang="ja" lang="ja">
          日本語
        </Link>
      </p>
    </main>
  );
}
