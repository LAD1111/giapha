
import React from 'react';
import { FamilyMember, NewsItem } from './types';

export const CLAN_NAME = "GIA TỘC HỌ LÊ";
export const CLAN_ADDRESS = "Tiến Thịnh - Mê Linh - Hà Nội";
export const CLAN_LEADER = "Lê Minh Đức";
export const CLAN_PHONE = "0989.065.790";

export const SAMPLE_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Đại Lễ Chạp Họ Năm Giáp Thìn 2024',
    date: '15/12/2024',
    summary: 'Thông báo về việc tổ chức đại lễ chạp họ thường niên tại từ đường dòng họ.',
    content: 'Kính thưa các cụ, các ông các bà và toàn thể con cháu nội ngoại. Ban quản lý dòng họ xin thông báo...',
    imageUrl: 'https://picsum.photos/seed/clan1/800/400'
  },
  {
    id: '2',
    title: 'Khánh Thành Bia Tưởng Niệm Tổ Tiên',
    date: '10/10/2024',
    summary: 'Buổi lễ khánh thành bia đá ghi danh các bậc tiền bối có công với dòng họ.',
    content: 'Với sự đóng góp hào phóng của con cháu, chúng ta đã hoàn thành việc tôn tạo...',
    imageUrl: 'https://picsum.photos/seed/clan2/800/400'
  },
  {
    id: '3',
    title: 'Quỹ Khuyến Học Dòng Họ Phát Thưởng',
    date: '05/09/2024',
    summary: 'Khen thưởng các cháu đạt thành tích xuất sắc trong học tập năm học 2023-2024.',
    content: 'Nhằm động viên tinh thần hiếu học, dòng họ đã tổ chức buổi trao thưởng...',
    imageUrl: 'https://picsum.photos/seed/clan3/800/400'
  }
];

export const SAMPLE_FAMILY_TREE: FamilyMember = {
  id: '0',
  name: 'Lê Văn Tổ',
  generation: 1,
  isMale: true,
  bio: 'Cụ tổ khởi nghiệp tại vùng đất linh thiêng.',
  children: [
    {
      id: '1-1',
      name: 'Lê Văn Trưởng',
      generation: 2,
      isMale: true,
      children: [
        { id: '1-1-1', name: 'Lê Minh Đức', generation: 3, isMale: true },
        { id: '1-1-2', name: 'Lê Thị Hà', generation: 3, isMale: false }
      ]
    },
    {
      id: '1-2',
      name: 'Lê Văn Thứ',
      generation: 2,
      isMale: true,
      children: [
        { id: '1-2-1', name: 'Lê Văn An', generation: 3, isMale: true },
        { id: '1-2-2', name: 'Lê Văn Bình', generation: 3, isMale: true }
      ]
    }
  ]
};

export const DRAGON_SVG = (
  <svg viewBox="0 0 100 100" className="w-16 h-16 fill-gold opacity-80">
    <path d="M50,10 C40,10 30,20 30,35 C30,50 45,60 50,80 C55,60 70,50 70,35 C70,20 60,10 50,10 Z M50,45 C45,45 40,40 40,35 C40,30 45,25 50,25 C55,25 60,30 60,35 C60,40 55,45 50,45 Z" />
    <circle cx="50" cy="35" r="5" className="fill-red-700" />
  </svg>
);
