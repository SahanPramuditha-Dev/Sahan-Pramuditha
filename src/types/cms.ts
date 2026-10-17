export interface HeroConfig {
  logoText: string;
  bio: string;
  location: string;
  taglineWords: string[];
  githubUrl: string;
  linkedinUrl: string;
  resumeDownloadUrl: string;
}

export const DEFAULT_HERO_CONFIG: HeroConfig = {
  logoText: "S.",
  bio: "Hi, I'm Sahan Pramuditha. A 3rd-year BICT undergraduate at the University of Colombo, specializing in robust backend systems, IT support, and software engineering.",
  location: "Sri Lanka",
  taglineWords: ["scale", "inspire", "perform", "convert"],
  githubUrl: "https://github.com/SahanPramuditha-Dev",
  linkedinUrl: "https://linkedin.com/in/sahan-pramuditha",
  resumeDownloadUrl: "/Sahan_Pramuditha_Resume.pdf"
};

export interface ArticleItem {
  id: string;
  title: string;
  platform: string;
  date: string;
  readTime: string;
  url: string;
  icon: string;
}

export const DEFAULT_ARTICLES: ArticleItem[] = [
  { id: "art-1", title: "Building a Modern Portfolio", platform: "Medium", date: "Oct 2026", readTime: "5 min", url: "#", icon: "fab fa-medium" }
];

export interface CertificateItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  date: string;
  url?: string;
}

export const DEFAULT_CERTS: CertificateItem[] = [
  { id: "cert-1", icon: "fas fa-shield-alt", title: "Cybersecurity Essentials", subtitle: "Cisco Networking Academy", date: "2024" },
  { id: "cert-2", icon: "fas fa-network-wired", title: "CCNA: Enterprise Networking", subtitle: "Cisco Networking Academy", date: "2024" }
];

export interface ProjectItem {
  id: string;
  title: string;
  desc: string;
  tags: string[];
  img: string;
  link: string;
  features: string[];
}

export const DEFAULT_PROJECTS: ProjectItem[] = [
  { 
    id: "proj-1",
    title: "StudyOS Platform", 
    desc: "An all-in-one student workspace integrating task management, SM-2 spaced repetition, and Orion.", 
    tags: ["React 19", "Firebase", "Gen AI"], 
    img: "studyos", 
    link: "#", 
    features: ["AI tutoring", "Spaced Repetition"] 
  },
  { 
    id: "proj-2",
    title: "FamilyTree Directory", 
    desc: "A scalable, responsive church directory and census management system built for over 500+ parishioners.", 
    tags: ["React", "Tailwind"], 
    img: "familytree", 
    link: "#", 
    features: ["Member tracking", "Audit logs"] 
  }
];

export interface ServiceItem {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  tech: string[];
}

export const DEFAULT_SERVICES: ServiceItem[] = [
  { id: "srv-1", title: "Frontend Engineering", desc: "Building scalable, pixel-perfect UIs.", icon: "fas fa-code", color: "blue", tech: ["React", "Next.js"] },
  { id: "srv-2", title: "Backend Architecture", desc: "Designing robust APIs and databases.", icon: "fas fa-server", color: "green", tech: ["Node.js", "Express"] }
];

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  text: string;
  avatar: string;
}

export const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  { id: "test-1", name: "Dr. Smith", role: "Professor", text: "Exceptional student with great technical aptitude.", avatar: "fas fa-user-tie" }
];
