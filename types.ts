
export enum AppSection {
  NEWS = 'TIN TỨC',
  TREE = 'PHẢ ĐỒ',
  CHRONICLES = 'PHẢ KỸ',
  ANCESTRAL_HOUSE = 'TỪ ĐƯỜNG',
  REGULATIONS = 'TỘC ƯỚC',
  EVENTS = 'SỰ KIỆN'
}

export type AppTheme = 'classic' | 'tet';

export interface Spouse {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  restingPlace?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  nickname?: string; // Tên tự, Hiệu
  title?: string; // Chức vụ, Phẩm hàm, Học vị
  generation: number;
  birthDate?: string;
  deathDate?: string;
  lunarDeathDate?: string;
  restingPlace?: string; // Mộ phần
  spouseName?: string; // Legacy
  spouseBirthDate?: string; // Legacy
  spouseDeathDate?: string; // Legacy
  spouses?: Spouse[]; // Multi-spouse support
  children?: FamilyMember[];
  bio?: string;
  isMale: boolean;
  parentName?: string;
  otherParentId?: string; // ID of the spouse who is the other parent
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
  theme?: AppTheme;
}
