
export enum AppSection {
  NEWS = 'TIN TỨC',
  TREE = 'PHẢ ĐỒ',
  CHRONICLES = 'PHẢ KỸ',
  ANCESTRAL_HOUSE = 'TỪ ĐƯỜNG',
  REGULATIONS = 'TỘC ƯỚC',
  EVENTS = 'SỰ KIỆN'
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
  parentName?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  imageUrl?: string;
}

export type EventType = 'giỗ' | 'sinh nhật' | 'họp mặt' | 'khác';

export interface EventItem {
  id: string;
  title: string;
  solarDate: string;
  lunarDateLabel?: string;
  type: EventType;
  description?: string;
}

export interface AppData {
  news: NewsItem[];
  familyTree: FamilyMember;
  events: EventItem[];
  bannerUrl: string;
  address: string;
  historyText: string;
  ancestralHouseText: string;
  regulations: string[];
  clanName: string;
  lastUpdated: string;
}
