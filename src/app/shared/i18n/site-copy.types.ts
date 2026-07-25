export type SiteCopy = {
  common: {
    showMore: string;
    showLess: string;
  };
  home: {
    founder: string;
    recruiter: string;
    developer: string;
    reset: string;
    adminPage: string;
    admin: string;
    loadingProfile: string;
    failedProfile: string;
  };
  intro: {
    /** Use `{platform}` — replaced with LinkedIn, Xing, etc. */
    socialLinkAriaLabel: string;
  };
  skills: {
    title: string;
  };
  projects: {
    eyebrow: string;
    title: string;
    description: string;
    viewAll: string;
    loading: string;
    error: string;
    empty: string;
    /** Short project-card link label (heading above already shows the title). */
    openProjectCta: string;
    /** Accessible name; use `{title}` placeholder so each destination stays unique for assistive tech. */
    openProjectAriaLabel: string;
  };
  projectsPage: {
    title: string;
    backToPortfolio: string;
    loading: string;
    error: string;
    empty: string;
  };
  projectDetail: {
    backToProjects: string;
    loading: string;
    published: string;
    draft: string;
    overview: string;
    emptyDescription: string;
    liveSiteHeading: string;
    liveSiteLinkLabel: string;
    liveSiteAriaLabel: string;
    notFoundTitle: string;
    loadErrorTitle: string;
    notFoundMessage: string;
    loadErrorMessage: string;
  };
  devProxy: {
    label: string;
    back: string;
    home: string;
    admin: string;
  };
  chat: {
    title: string;
    subtitle: string;
    introLine1: string;
    introLine2: string;
    promptAngular: string;
    promptFreelance: string;
    typingSrOnly: string;
    placeholder: string;
    toggleOpenAriaLabel: string;
    toggleCloseAriaLabel: string;
    sendAriaLabel: string;
  };
  adminLogin: {
    title: string;
    email: string;
    password: string;
    login: string;
    loggingIn: string;
    invalidCredentials: string;
    accessDenied: string;
    accessDeniedToast: string;
  };
  adminProjects: {
    newProject: string;
    cancel: string;
    title: string;
    subtitle: string;
    createSuccess: string;
    createFormTitle: string;
    createSubmitLabel: string;
    createSubmittingLabel: string;
    loading: string;
    loadingIdle: string;
    published: string;
    draft: string;
    view: string;
    edit: string;
    delete: string;
    empty: string;
    failedLoad: string;
    failedCreate: string;
    failedDelete: string;
    confirmDelete: string;
  };
  projectForm: {
    titleLabel: string;
    slugLabel: string;
    descriptionLabel: string;
    contentMarkdownLabel: string;
    coverImageUrlLabel: string;
    tagsLabel: string;
    tagsPlaceholder: string;
    projectUrlLabel: string;
    projectUrlPlaceholder: string;
    cancel: string;
    publishImmediately: string;
    titleRequired: string;
    slugRequired: string;
  };
  about: {
    adaptiveTitle: {
      recruiter: string;
      founder: string;
      developer: string;
      hiringManager: string;
    };
    founderParagraphs: [string, string];
    recruiterParagraphs: [string, string];
    developerParagraphs: [string, string];
    previewSplitToken: string;
  };
  contact: {
    validation: {
      emailRequired: string;
      messageRequired: string;
    };
    adaptiveTitle: {
      recruiter: string;
      founder: string;
      developer: string;
    };
    adaptiveDescription: {
      recruiter: string;
      founder: string;
      developer: string;
    };
    adaptivePlaceholder: {
      recruiter: string;
      founder: string;
      developer: string;
      default: string;
    };
    adaptiveButtonText: {
      recruiter: string;
      founder: string;
      developer: string;
      default: string;
    };
    placeholderName: string;
    placeholderEmail: string;
    submitSuccess: string;
    submitError: string;
  };
  hero: {
    defaultTitle: string;
    adaptiveTitle: {
      recruiter: string;
      founder: string;
      developer: string;
    };
    frontend: {
      default: {
        description: string;
        items: [{ title: string; description: string; }, { title: string; description: string; }, { title: string; description: string; }];
      };
      founder: {
        description: string;
        items: [{ title: string; description: string; }, { title: string; description: string; }, { title: string; description: string; }];
      };
      recruiter: {
        description: string;
        items: [{ title: string; description: string; }, { title: string; description: string; }, { title: string; description: string; }];
      };
      developer: {
        description: string;
        items: [{ title: string; description: string; }, { title: string; description: string; }, { title: string; description: string; }];
      };
    };
    backend: {
      default: {
        description: string;
        items: [{ title: string; description: string; }, { title: string; description: string; }, { title: string; description: string; }];
      };
      founder: {
        description: string;
        items: [{ title: string; description: string; }, { title: string; description: string; }, { title: string; description: string; }];
      };
      recruiter: {
        description: string;
        items: [{ title: string; description: string; }, { title: string; description: string; }, { title: string; description: string; }];
      };
      developer: {
        description: string;
        items: [{ title: string; description: string; }, { title: string; description: string; }, { title: string; description: string; }];
      };
    };
  };
};
