export interface SkillCard {
  title: string;
  subtitle: string;
  iconPath: string;
  description: string;
  items: SkillItem[];
}

export interface SkillItem {
  title: string;
  description: string;
}
