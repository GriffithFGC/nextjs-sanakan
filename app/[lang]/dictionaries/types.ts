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
    languages: string;
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
      context: string;
      missionsTitle: string;
      missions: { label: string; text: string }[];
      takeawaysTitle: string;
      takeaways: string[];
      tags: string[];
    };
    educationTitle: string;
    education: {
      title: string;
      school: string;
      place: string;
      date: string;
      summary: string;
      modulesTitle: string;
      modules: { label: string; items: string[] }[];
      certification: { label: string; name: string; detail: string };
      tags: string[];
    };
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
  depths: { hero: string; clouds: string; forest: string };
  a11y: { skip: string; sections: string; newTab: string; pause: string };
  footer: string;
};
