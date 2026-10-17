export interface ExperienceData {
  id: string;
  role: string;
  company: string;
  year: string;
  description: string;
  achievements: string[];
  tools: string[];
  link?: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}

export const experiences: Record<string, ExperienceData> = {
  star: {
    id: 'star',
    role: 'Engineering Assistant',
    company: 'Star Garments',
    year: '2023',
    description: 'Assisted in IT infrastructure maintenance, hardware troubleshooting, and network diagnostics across large-scale manufacturing facilities.',
    achievements: [
      'Diagnosed and resolved critical hardware malfunctions to minimize factory downtime.',
      'Assisted in the rollout of internal network upgrades across multiple factory floors.',
      'Provided direct technical support to staff and maintained IT infrastructure integrity.'
    ],
    tools: ['Hardware', 'Networking', 'IT Support', 'Windows Server'],
    icon: 'fa-cogs',
    iconColor: 'text-textMuted',
    iconBg: 'bg-bgMain'
  },
  wybe: {
    id: 'wybe',
    role: 'E-Commerce Admin',
    company: 'Wybe Fashion',
    year: 'Present',
    description: 'Managing digital storefront operations, inventory synchronization, and leveraging data analytics to optimize customer purchasing workflows.',
    achievements: [
      'Streamlined product catalog synchronization via RESTful E-Commerce APIs.',
      'Leveraged data analytics to track user drop-offs and increased checkout conversion rates.',
      'Orchestrated multi-channel marketing campaigns and managed digital assets.'
    ],
    tools: ['E-Commerce APIs', 'Data Analytics', 'Shopify/WooCommerce', 'SEO'],
    link: 'https://wybefashion.com',
    icon: 'fa-shopping-cart',
    iconColor: 'text-accent',
    iconBg: 'bg-bgMain'
  },
  future: {
    id: 'future',
    role: 'Software Engineer Intern',
    company: 'Your Company',
    year: '2026',
    description: 'Seeking a challenging internship role to apply backend engineering, cloud architecture, and modern web development skills in production environments.',
    achievements: [
      'Ready to architect and deploy scalable cloud backend services.',
      'Eager to collaborate in agile teams and contribute to production codebases.',
      'Passionate about solving real-world performance bottlenecks.'
    ],
    tools: ['React', 'Node.js', 'Python', 'Cloud Platforms'],
    icon: 'fa-question',
    iconColor: 'text-textMuted',
    iconBg: 'bg-card'
  }
};
