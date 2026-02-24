export interface DemoTemplate {
  key: string
  title: string
  subtitle: string
  icon: 'marketing' | 'handwerk' | 'kanzlei'
  colorClass: string
  iconBgClass: string
  bullets: string[]
}

export const DEMO_TEMPLATES: DemoTemplate[] = [
  {
    key: 'marketing',
    title: 'Online Marketing',
    subtitle: 'Performance Marketing Team',
    icon: 'marketing',
    colorClass: 'text-violet-500',
    iconBgClass: 'bg-violet-500/10',
    bullets: [
      '3 Mitarbeiter (SEO, Ads, Content)',
      '4 Projekte inkl. Kampagnen-Relaunch',
      'Jour Fixes, KPIs und Entwicklungsplan',
    ],
  },
  {
    key: 'handwerk',
    title: 'Handwerksbetrieb',
    subtitle: 'Elektro-Installationsbetrieb',
    icon: 'handwerk',
    colorClass: 'text-amber-500',
    iconBgClass: 'bg-amber-500/10',
    bullets: [
      '3 Mitarbeiter (Meister, Geselle, Azubi)',
      '4 Projekte inkl. Grossauftrag Neubau',
      'Ausbildungsplan und Weiterbildungen',
    ],
  },
  {
    key: 'kanzlei',
    title: 'Steuerkanzlei',
    subtitle: 'Steuerberatung & Digitalisierung',
    icon: 'kanzlei',
    colorClass: 'text-sky-500',
    iconBgClass: 'bg-sky-500/10',
    bullets: [
      '3 Mitarbeiterinnen (Beraterin, Fachkraft, Azubi)',
      '4 Projekte inkl. DATEV-Migration',
      'Mandantenportal und Fristenverwaltung',
    ],
  },
]
