import { notFound } from "next/navigation";
import { HeroScene } from "@/components/hero/HeroScene";
import { Rich } from "@/components/Rich";
import { getDictionary, hasLocale } from "./dictionaries";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = await getDictionary(lang);
  const other = lang === "fr" ? "en" : "fr";

  const nav = [
    ["about", d.nav.about],
    ["background", d.nav.background],
    ["projects", d.nav.projects],
    ["skills", d.nav.skills],
    ["offline", d.nav.offline],
    ["contact", d.nav.contact],
  ] as const;

  return (
    <>
      <header className="site-nav">
        <a className="mark" href={`/${lang}/`}>
          Léo Azzopardi<span>.</span>
        </a>
        <nav aria-label="Sections">
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>
        <a className="lang" href={`/${other}/`} hrefLang={other} lang={other} aria-label={d.nav.switchLabel}>
          <span aria-hidden="true">{lang.toUpperCase()} / </span>
          <b>{d.nav.switchTo}</b>
        </a>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-name">
          <HeroScene />
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
              <p className="kicker">{d.background.experienceTitle}</p>
              <h3>{d.background.experience.role}</h3>
              <p className="meta">
                {d.background.experience.org} · {d.background.experience.place} · <span className="num">{d.background.experience.date}</span>
              </p>
              <p className="note">{d.background.experience.note}</p>
              <ul>
                {d.background.experience.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </article>
            <article className="entry">
              <p className="kicker">{d.background.educationTitle}</p>
              <h3>{d.background.education.title}</h3>
              <p className="meta">
                {d.background.education.school} · {d.background.education.place} · <span className="num">{d.background.education.date}</span>
              </p>
              <ul>
                {d.background.education.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </article>
            <article className="entry">
              <p className="kicker">{d.background.certificationTitle}</p>
              <h3>{d.background.certification.name}</h3>
              <p className="meta">{d.background.certification.detail}</p>
            </article>
          </div>
        </section>

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
                    {p.link.label} ↗
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
                    {x.link.label} ↗
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
                    {b.link.label} ↗
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>

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
