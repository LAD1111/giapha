
import React, { useState, useEffect, useMemo } from 'react';
import { Solar, Lunar } from 'lunar-javascript';
import { EventItem, EventType } from '../types';

// Sử dụng thư viện lunar-javascript để tính toán chính xác
const getLunarDateComponent = (d: number, m: number, y: number) => {
  try {
    const solar = Solar.fromYmd(y, m, d);
    const lunar = solar.getLunar();
    
    const day = lunar.getDay();
    const month = lunar.getMonth();
    const year = lunar.getYear();
    const isLeap = month < 0;
    const absMonth = Math.abs(month);

    // Bản đồ dịch thuật từ tiếng Trung sang tiếng Việt cho Can Chi và Con Giáp
    const translationMap: { [key: string]: string } = {
      // Can
      "甲": "Giáp", "乙": "Ất", "丙": "Bính", "丁": "Đinh", "戊": "Mậu", 
      "己": "Kỷ", "庚": "Canh", "辛": "Tân", "壬": "Nhâm", "癸": "Quý",
      // Chi
      "子": "Tý", "丑": "Sửu", "寅": "Dần", "卯": "Mão", "辰": "Thìn", 
      "巳": "Tỵ", "午": "Ngọ", "未": "Mùi", "申": "Thân", "酉": "Dậu", 
      "戌": "Tuất", "亥": "Hợi",
      // Con giáp (Việt Nam: Mão là Mèo, không phải Thỏ)
      "鼠": "Chuột", "牛": "Trâu", "虎": "Hổ", "兔": "Mèo", "龙": "Rồng", 
      "蛇": "Rắn", "马": "Ngựa", "羊": "Dê", "猴": "Khỉ", "鸡": "Gà", 
      "狗": "Chó", "猪": "Lợn"
    };

    const translate = (text: string) => {
      return text.split('').map(char => translationMap[char] || char).join(' ');
    };

    const yearCanChi = translate(lunar.getYearInGanZhi()) + " (" + (translationMap[lunar.getYearShengXiao()] || lunar.getYearShengXiao()) + ")";
    const monthCanChi = translate(lunar.getMonthInGanZhi());

    return { 
      day, 
      month: isLeap ? `${absMonth} (nhuận)` : absMonth, 
      year, 
      yearCanChi, 
      monthCanChi, 
      rawMonth: absMonth 
    };
  } catch (e) {
    return { day: d, month: m, year: y, yearCanChi: "...", monthCanChi: "...", rawMonth: m };
  }
};

// Interface for component props
interface EventsProps {
  events: EventItem[];
  isAdmin: boolean;
  onAddEvent: (event: EventItem) => void;
  onDeleteEvent: (id: string) => void;
}

const Events: React.FC<EventsProps> = ({ events, isAdmin, onAddEvent, onDeleteEvent }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentLunar = useMemo(() => {
    return getLunarDateComponent(currentTime.getDate(), currentTime.getMonth() + 1, currentTime.getFullYear());
  }, [currentTime]);

  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, currentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const lunar = getLunarDateComponent(i, month + 1, year);
      const dayEvents = events.filter(e => e.solarDate === dateStr);
      days.push({ 
        day: i, 
        currentMonth: true, 
        dateStr,
        lunarDay: lunar.day,
        lunarMonth: lunar.rawMonth,
        hasEvent: dayEvents.length > 0,
        hasDeathAnniversary: dayEvents.some(e => e.type === 'giỗ')
      });
    }
    return days;
  }, [viewDate, events]);

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const todaySolarStr = currentTime.toISOString().split('T')[0];
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatFullDate = (date: Date) => {
    const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${weekdays[date.getDay()]}, ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
  };

  const gioEvents = events.filter(e => e.type === 'giỗ');
  const otherEvents = events
    .filter(e => e.type !== 'giỗ' && (e.solarDate >= todaySolarStr || !e.solarDate))
    .sort((a, b) => (a.solarDate || '').localeCompare(b.solarDate || ''));

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn space-y-8 pb-20 px-2 md:px-0">
      
      {/* Widget Thời Gian Hiện Tại (Dương & Âm lịch) */}
      <div className="relative group overflow-hidden">
        <div className="absolute inset-0 bg-red-900 rounded-[2.5rem] transform rotate-1 group-hover:rotate-0 transition-transform duration-500 opacity-10"></div>
        <div className="relative bg-white/90 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl border-2 border-red-900/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
              <h4 className="text-[10px] font-black text-red-950/40 uppercase tracking-[0.4em]">Thời Gian Hiện Tại</h4>
            </div>
            <div className="text-5xl md:text-7xl font-black text-red-950 tracking-tighter tabular-nums drop-shadow-sm">
              {formatTime(currentTime)}
            </div>
            <p className="mt-4 text-sm md:text-base font-bold text-red-900/60 font-traditional">
              {formatFullDate(currentTime)}
            </p>
          </div>

          <div className="h-px md:h-24 w-full md:w-px bg-red-900/10"></div>

          <div className="flex flex-col items-center md:items-end text-center md:text-right">
            <div className="bg-red-950 text-gold px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 shadow-lg">
              Lịch Âm Hôm Nay
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-traditional font-black text-red-900">Ngày {currentLunar.day}</span>
            </div>
            <p className="mt-2 text-xs md:text-sm font-black text-red-950/40 uppercase tracking-widest">
              Tháng {currentLunar.month} ({currentLunar.monthCanChi}) • Năm {currentLunar.year} ({currentLunar.yearCanChi})
            </p>
            <div className="mt-4 flex gap-2">
               <span className="text-xl">🧧</span>
               <span className="text-xl">🌸</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-red-800 rounded-[2.5rem] p-8 flex flex-col md:flex-row justify-between items-center shadow-xl relative overflow-hidden border-b-4 border-gold/30 gap-4">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/oriental-tiles.png')]"></div>
        <div className="z-10 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-traditional text-white font-black m-0">Sự Kiện Gia Tộc</h2>
          <p className="text-gold/70 text-[10px] font-black uppercase tracking-widest mt-1">Lễ nghi & Tưởng nhớ Tổ tiên</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              const title = prompt("Tên sự kiện:");
              const date = prompt("Ngày dương lịch (YYYY-MM-DD) hoặc để trống nếu là ngày âm:");
              if (title) {
                onAddEvent({
                  id: Date.now().toString(),
                  title,
                  solarDate: date || '',
                  type: 'họp mặt'
                });
              }
            }}
            className="bg-gold text-red-950 px-8 py-3 rounded-full text-xs font-black uppercase hover:bg-white transition-all flex items-center gap-2 z-10 shadow-lg active:scale-95"
          >
            <span className="text-lg">+</span> Thêm sự kiện
          </button>
        )}
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-6 md:p-12 rounded-[2.5rem] shadow-2xl border border-red-900/5">
        <div className="flex justify-between items-center mb-12">
          <button onClick={() => changeMonth(-1)} className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-red-50 text-red-900 hover:bg-red-900 hover:text-white transition-all shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="text-center">
            <h3 className="text-3xl md:text-4xl font-traditional font-black text-red-950">
              Tháng {viewDate.getMonth() + 1}
              <span className="text-red-900/30 ml-3">/ {viewDate.getFullYear()}</span>
            </h3>
          </div>

          <button onClick={() => changeMonth(1)} className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-red-50 text-red-900 hover:bg-red-900 hover:text-white transition-all shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-2 md:gap-6">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d, idx) => (
            <div key={d} className={`text-center text-[10px] md:text-xs font-black mb-4 tracking-widest ${idx === 0 ? 'text-red-600' : 'text-gray-400'}`}>{d}</div>
          ))}
          {calendarData.map((item, i) => {
            const isToday = item.dateStr === todaySolarStr;
            return (
              <div 
                key={i} 
                className={`
                  relative flex flex-col items-center justify-center py-4 md:py-8 rounded-2xl md:rounded-[2rem] transition-all cursor-pointer
                  ${item.day ? 'hover:bg-red-50' : 'opacity-0 pointer-events-none'}
                  ${isToday ? 'bg-red-900 shadow-2xl scale-110 z-10' : 'bg-transparent'}
                  ${item.hasDeathAnniversary && !isToday ? 'bg-red-50 border-2 border-red-900/10' : ''}
                `}
              >
                {item.hasDeathAnniversary && (
                  <div className="absolute -top-2 -right-2 text-sm md:text-lg animate-pulse z-20">🕯️</div>
                )}
                <span className={`text-lg md:text-3xl font-black ${isToday ? 'text-gold' : item.hasDeathAnniversary ? 'text-red-900' : 'text-gray-800'}`}>
                  {item.day}
                </span>
                <span className={`text-[10px] md:text-xs font-bold ${isToday ? 'text-gold/50' : 'text-gray-400'}`}>
                  {item.day ? (item.lunarDay === 1 ? `1/${item.lunarMonth}` : item.lunarDay) : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        <section className="space-y-6">
          <h4 className="text-[11px] md:text-xs font-black text-red-950 uppercase tracking-[0.3em] flex items-center gap-3">
             <span className="w-12 h-px bg-red-900/20"></span>
             Lễ Giỗ Trong Năm
             <span className="w-12 h-px bg-red-900/20"></span>
          </h4>
          <div className="space-y-4">
            {gioEvents.length > 0 ? (
              gioEvents.map(e => (
                <div key={e.id} className="bg-red-950 text-white p-6 md:p-8 rounded-[2.5rem] border-2 border-gold/20 shadow-xl flex justify-between items-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
                  <div className="absolute -left-6 -top-6 text-8xl opacity-5 pointer-events-none rotate-12">🕯️</div>
                  <div className="flex gap-6 items-center relative z-10">
                    <div className="bg-gold text-red-950 w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shadow-lg">
                       <span className="text-[10px] uppercase leading-none mb-1">Giỗ</span>
                       <span className="text-xl leading-none">📜</span>
                    </div>
                    <div>
                      <p className="font-bold text-white text-base md:text-lg font-traditional">{e.title}</p>
                      <p className="text-gold/60 text-[10px] font-black uppercase tracking-widest mt-1">Ngày Âm: {e.lunarDateLabel}</p>
                    </div>
                  </div>
                  {isAdmin && e.id.startsWith('e') && (
                    <button onClick={() => onDeleteEvent(e.id)} className="bg-white/10 hover:bg-red-600 p-3 rounded-full transition-all text-sm relative z-10">🗑️</button>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white p-10 rounded-[2.5rem] border-2 border-dashed border-red-900/10 text-center text-gray-400 font-bold italic text-sm">
                Đang cập nhật ngày giỗ từ phả đồ...
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <h4 className="text-[11px] md:text-xs font-black text-red-950 uppercase tracking-[0.3em] flex items-center gap-3">
             <span className="w-12 h-px bg-red-900/20"></span>
             Hội Họp & Việc Họ
             <span className="w-12 h-px bg-red-900/20"></span>
          </h4>
          <div className="space-y-4">
            {otherEvents.length > 0 ? (
              otherEvents.map(e => (
                <div key={e.id} className="bg-white p-6 rounded-[2rem] border border-red-900/5 flex justify-between items-center shadow-lg hover:border-gold/50 transition-all group hover:bg-red-50/30">
                  <div className="flex gap-6 items-center">
                    <div className="bg-red-50 text-red-900 w-14 h-14 rounded-[1.5rem] flex flex-col items-center justify-center font-black shadow-sm group-hover:bg-red-900 group-hover:text-gold transition-colors">
                       <span className="text-[11px] leading-none mb-1">{e.solarDate ? new Date(e.solarDate).getMonth() + 1 : '--'}</span>
                       <span className="text-xl leading-none">{e.solarDate ? new Date(e.solarDate).getDate() : '??'}</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-base">{e.title}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{e.type}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => onDeleteEvent(e.id)} className="bg-red-50 text-red-600 p-3 rounded-xl transition-all hover:bg-red-100">
                      🗑️
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white/40 p-10 rounded-[2.5rem] border border-dashed border-gray-200 text-center text-gray-400 font-bold italic text-sm">
                 Chưa có thông báo họp họ
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="bg-white/50 backdrop-blur-sm p-6 rounded-[2rem] flex flex-wrap justify-center gap-8 text-[11px] font-black text-red-950/40 uppercase tracking-widest border border-red-900/5 mt-10">
         <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-900"></span> Hôm nay
         </div>
         <div className="flex items-center gap-3">
            <span className="text-lg">🕯️</span> Ngày Giỗ Cố Nhân
         </div>
      </div>
    </div>
  );
};

export default Events;
