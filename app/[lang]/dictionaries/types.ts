export type Link = { label: string; href: string };

export type Dictionary = {
  meta: { title: string; description: string };
  nav: {
    about: string;
    background: string;
    projects: string;
    skills: string;
    offline: string;
    contact: string;
    switchTo: string;
    switchLabel: string;
  };
  hero: {
    eyebrow: string;
    role: string;
    quote: string;
    ctaProjects: string;
    ctaContact: string;
  };
  about: {
    strata: string;
    title: string;
    paragraphs: string[];
    profileTitle: string;
    profile: string[];
  };
  background: {
    strata: string;
    title: string;
    experienceTitle: string;
    experience: {
      role: string;
      org: string;
      place: string;
      date: string;
      note: string;
      points: string[];
    };
    educationTitle: string;
    education: {
      title: string;
      school: string;
      place: string;
      date: string;
      points: string[];
    };
    certificationTitle: string;
    certification: { name: string; detail: string };
  };
  projects: {
    strata: string;
    title: string;
    intro: string;
    items: {
      name: string;
      date: string;
      status?: string;
      body: string[];
      tags: string[];
      link?: Link;
      note?: string;
    }[];
    extrasTitle: string;
    extras: { name: string; body: string; tags: string[]; link?: Link }[];
  };
  skills: {
    strata: string;
    title: string;
    groups: { label: string; items: string }[];
    softLabel: string;
    soft: string[];
  };
  offline: {
    strata: string;
    title: string;
    intro: string;
    blocks: { title: string; body: string[]; link?: Link }[];
  };
  contact: {
    strata: string;
    title: string;
    intro: string;
    links: { label: string; value: string; href: string }[];
  };
  footer: string;
};
