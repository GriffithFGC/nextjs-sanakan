import Link from "next/link";
import { notFound } from "next/navigation";
import { DescentBand } from "@/components/descent/DescentBand";
import { HeroScene } from "@/components/hero/HeroScene";
import { MotionToggle } from "@/components/MotionToggle";
import { Rich } from "@/components/Rich";
import { getDictionary, hasLocale, locales } from "./dictionaries";
import { LOCALES } from "./locales";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = await getDictionary(lang);

  const nav = [
    ["about", d.nav.about],
    ["background", d.nav.background],
    ["projects", d.nav.projects],
    ["skills", d.nav.skills],
    ["offline", d.nav.offline],
    ["contact", d.nav.contact],
  ] as const;

  // Arrow for sighted readers, words for screen readers.
  const newTab = (
    <>
      {" "}
      <span aria-hidden="true">↗</span>
      <span className="sr-only"> {d.a11y.newTab}</span>
    </>
  );

  return (
    <>
      <a className="skip" href="#content">
        {d.a11y.skip}
      </a>
      <header className="site-nav">
        <a className="mark" href={`/${lang}/`}>
          Léo Azzopardi<span>.</span>
        </a>
        <nav aria-label={d.a11y.sections}>
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>
        <div className="tools">
          <nav className="langs" aria-label={d.nav.languages}>
          {locales.map((l) =>
            l === lang ? (
              <span key={l} aria-current="page" title={LOCALES[l].name}>
                {LOCALES[l].label}
              </span>
            ) : (
              <a key={l} href={`/${l}/`} hrefLang={LOCALES[l].hreflang} lang={LOCALES[l].htmlLang} title={LOCALES[l].name}>
                {LOCALES[l].label}
              </a>
            ),
          )}
          </nav>
          <MotionToggle label={d.a11y.pause} />
        </div>
      </header>

      <main id="content">
        <section className="hero" aria-labelledby="hero-name">
          <HeroScene />
          <p className="depth hero-depth">
            <b className="num">0 m</b>
            <span>{d.depths.hero}</span>
          </p>
          <div className="hero-text">
            <p className="strata">{d.hero.eyebrow}</p>
            <h1 id="hero-name">Léo Azzopardi</h1>
            <p className="role">{d.hero.role}</p>
            <p className="quote">{d.hero.quote}</p>
            <div className="ctas">
              <a className="btn solid" href="#projects">
                {d.hero.ctaProjects}
              </a>
              <a className="btn" href="#contact">
                {d.hero.ctaContact}
              </a>
            </div>
          </div>
        </section>

        <section id="about" className="sec">
          <header className="sec-head">
            <p className="strata">{d.about.strata}</p>
            <h2>{d.about.title}</h2>
          </header>
          <div className="about">
            <div className="prose">
              {d.about.paragraphs.map((p, i) => (
                <p key={i}>
                  <Rich text={p} />
                </p>
              ))}
            </div>
            <aside className="profile">
              <h3>{d.about.profileTitle}</h3>
              <ul>
                {d.about.profile.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section id="background" className="sec">
          <header className="sec-head">
            <p className="strata">{d.background.strata}</p>
            <h2>{d.background.title}</h2>
          </header>
          <div className="timeline">
            <article className="entry">
              <p className="when-rail num" aria-hidden="true">
                {d.background.experience.date}
              </p>
              <div className="entry-body">
                <p className="kicker">{d.background.experienceTitle}</p>
                <h3>{d.background.experience.role}</h3>
                <p className="meta">
                  {d.background.experience.org} · {d.background.experience.place} · <span className="num">{d.background.experience.date}</span>
                </p>
                <p className="context">{d.background.experience.context}</p>
                <p className="kicker">{d.background.experience.missionsTitle}</p>
                <ul className="missions">
                  {d.background.experience.missions.map((m) => (
                    <li key={m.label}>
                      <span>{m.label}</span>
                      {m.text}
                    </li>
                  ))}
                </ul>
                <p className="kicker">{d.background.experience.takeawaysTitle}</p>
                <ul className="takeaways">
                  {d.background.experience.takeaways.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <ul className="tags" aria-label="Technologies">
                  {d.background.experience.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </article>
            <article className="entry">
              <p className="when-rail num" aria-hidden="true">
                {d.background.education.date}
              </p>
              <div className="entry-body">
                <p className="kicker">{d.background.educationTitle}</p>
                <h3>{d.background.education.title}</h3>
                <p className="meta">
                  {d.background.education.school} · {d.background.education.place} · <span className="num">{d.background.education.date}</span>
                </p>
                <p className="context">{d.background.education.summary}</p>
                <p className="kicker">{d.background.education.modulesTitle}</p>
                <div className="modules">
                  {d.background.education.modules.map((m) => (
                    <div key={m.label}>
                      <h4>{m.label}</h4>
                      <ul>
                        {m.items.map((i) => (
                          <li key={i}>{i}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="cert">
                  <span>{d.background.education.certification.label}</span>
                  <b>{d.background.education.certification.name}</b> · {d.background.education.certification.detail}
                </p>
                <ul className="tags" aria-label="Technologies">
                  {d.background.education.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </article>
          </div>
        </section>

        <DescentBand scene="clouds" depth="−340 m" name={d.depths.clouds} />

        <section id="projects" className="sec">
          <header className="sec-head">
            <p className="strata">{d.projects.strata}</p>
            <h2>{d.projects.title}</h2>
            <p className="lede">{d.projects.intro}</p>
          </header>
          <div className="cards">
            {d.projects.items.map((p) => (
              <article key={p.name} className="card">
                <div className="row">
                  <h3>{p.name}</h3>
                  <span className="when">
                    {p.status ? `${p.status} · ` : ""}
                    <span className="num">{p.date}</span>
                  </span>
                </div>
                {p.body.map((b, i) => (
                  <p key={i}>{b}</p>
                ))}
                <ul className="tags" aria-label="Technologies">
                  {p.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                {p.note && <p className="note">{p.note}</p>}
                {p.link && (
                  <a className="ext" href={p.link.href} rel="noopener" target="_blank">
                    {p.link.label}
                    {newTab}
                  </a>
                )}
              </article>
            ))}
          </div>
          <h3 className="sub">{d.projects.extrasTitle}</h3>
          <ul className="extras">
            {d.projects.extras.map((x) => (
              <li key={x.name}>
                <b>{x.name}</b> — {x.body}{" "}
                {x.link && (
                  <a className="ext" href={x.link.href} rel="noopener" target="_blank">
                    {x.link.label}
                    {newTab}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section id="skills" className="sec">
          <header className="sec-head">
            <p className="strata">{d.skills.strata}</p>
            <h2>{d.skills.title}</h2>
          </header>
          <dl className="skills">
            {d.skills.groups.map((g) => (
              <div key={g.label}>
                <dt>{g.label}</dt>
                <dd>{g.items}</dd>
              </div>
            ))}
          </dl>
          <p className="kicker">{d.skills.softLabel}</p>
          <ul className="soft">
            {d.skills.soft.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        <section id="offline" className="sec offline">
          <header className="sec-head">
            <p className="strata">{d.offline.strata}</p>
            <h2>{d.offline.title}</h2>
            <p className="lede voice">{d.offline.intro}</p>
          </header>
          <div className="blocks">
            {d.offline.blocks.map((b) => (
              <article key={b.title}>
                <h3>{b.title}</h3>
                {b.body.map((p, i) => (
                  <p key={i}>
                    <Rich text={p} />
                  </p>
                ))}
                {b.link && (
                  <a className="ext" href={b.link.href} rel="noopener" target="_blank">
                    {b.link.label}
                    {newTab}
                  </a>
                )}
                {b.page && (
                  <Link className="btn page-link" href={b.page.href}>
                    {b.page.label} <span aria-hidden="true">→</span>
                  </Link>
                )}
              </article>
            ))}
          </div>
        </section>

        <DescentBand scene="forest" depth="−1 200 m" name={d.depths.forest} />

        <section id="contact" className="sec">
          <header className="sec-head">
            <p className="strata">{d.contact.strata}</p>
            <h2>{d.contact.title}</h2>
            <p className="lede voice">{d.contact.intro}</p>
          </header>
          <ul className="contact">
            {d.contact.links.map((l) => (
              <li key={l.label}>
                <span>{l.label}</span>
                <a href={l.href} {...(l.href.startsWith("http") ? { rel: "noopener", target: "_blank" } : {})}>
                  {l.value}
                  {l.href.startsWith("http") && <span className="sr-only"> {d.a11y.newTab}</span>}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="site-foot">{d.footer}</footer>
    </>
  );
}
