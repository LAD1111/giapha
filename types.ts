
export enum AppSection {
  NEWS = 'TIN TỨC',
  CHRONICLES = 'PHẢ KỸ',
  TREE = 'PHẢ ĐỒ',
  ANCESTRAL_HOUSE = 'TỪ ĐƯỜNG',
  REGULATIONS = 'TỘC ƯỚC'
}

export interface FamilyMember {
  id: string;
  name: string;
  generation: number;
  birthDate?: string;
  deathDate?: string;
  spouseName?: string;
  children?: FamilyMember[];
  bio?: string;
  isMale: boolean;
  parentName?: string; // Tên của cha hoặc mẹ để hiển thị trên phả đồ
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  imageUrl?: string;
}

export interface AppState {
  news: NewsItem[];
  familyTree: FamilyMember;
  bannerUrl: string;
  address: string;
  historyText: string;
  ancestralHouseText: string;
  regulations: string[];
}
