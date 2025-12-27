
import React, { useState, useEffect, useMemo } from 'react';
import { EventItem, EventType } from '../types';

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

  const getLunarLabel = (day: number) => {
    const lunarDay = (day % 29) + 1;
    return lunarDay;
  };

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
      const dayEvents = events.filter(e => e.solarDate === dateStr);
      days.push({ 
        day: i, 
        currentMonth: true, 
        dateStr,
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
  
  // Tách ngày giỗ và sự kiện thường
  const gioEvents = events.filter(e => e.type === 'giỗ');
  const otherEvents = events
    .filter(e => e.type !== 'giỗ' && (e.solarDate >= todaySolarStr || !e.solarDate))
    .sort((a, b) => (a.solarDate || '').localeCompare(b.solarDate || ''));

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn space-y-6 pb-20 px-2 md:px-0">
      {/* Header Sự kiện */}
      <div className="bg-red-800 rounded-t-[2rem] p-6 flex flex-col md:flex-row justify-between items-center shadow-xl relative overflow-hidden border-b-4 border-gold/30 gap-4">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/oriental-tiles.png')]"></div>
        <div className="z-10 text-center md:text-left">
          <h2 className="text-3xl font-traditional text-white font-black m-0">Sự Kiện Gia Tộc</h2>
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
            className="bg-gold text-red-950 px-6 py-2 rounded-full text-xs font-black uppercase hover:bg-white transition-all flex items-center gap-2 z-10 shadow-lg"
          >
            <span>+</span> Thêm sự kiện
          </button>
        )}
      </div>

      {/* Lịch Widget */}
      <div className="bg-white/80 backdrop-blur-xl p-4 md:p-10 rounded-[2rem] shadow-2xl border border-red-900/5">
        <div className="flex justify-between items-center mb-10">
          <button onClick={() => changeMonth(-1)} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-red-50 text-red-900 hover:bg-red-900 hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-traditional font-black text-red-950">
              Tháng {viewDate.getMonth() + 1}
              <span className="text-red-900/30 ml-2 md:ml-3">/ {viewDate.getFullYear()}</span>
            </h3>
          </div>

          <button onClick={() => changeMonth(1)} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-red-50 text-red-900 hover:bg-red-900 hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 md:gap-4">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d, idx) => (
            <div key={d} className={`text-center text-[8px] md:text-xs font-black mb-2 tracking-widest ${idx === 0 ? 'text-red-600' : 'text-gray-400'}`}>{d}</div>
          ))}
          {calendarData.map((item, i) => {
            const isToday = item.dateStr === todaySolarStr;
            return (
              <div 
                key={i} 
                className={`
                  relative flex flex-col items-center justify-center py-3 md:py-6 rounded-xl md:rounded-3xl transition-all cursor-pointer
                  ${item.day ? 'hover:bg-red-50' : 'opacity-0 pointer-events-none'}
                  ${isToday ? 'bg-red-900 shadow-xl scale-105 z-10' : 'bg-transparent'}
                  ${item.hasDeathAnniversary && !isToday ? 'bg-red-50 border-2 border-red-900/10' : ''}
                `}
              >
                {item.hasDeathAnniversary && (
                  <div className="absolute -top-1 -right-1 text-[10px] md:text-sm animate-pulse z-20">🕯️</div>
                )}
                <span className={`text-sm md:text-2xl font-black ${isToday ? 'text-gold' : item.hasDeathAnniversary ? 'text-red-900' : 'text-gray-800'}`}>
                  {item.day}
                </span>
                <span className={`text-[8px] md:text-[11px] font-bold ${isToday ? 'text-gold/50' : 'text-gray-400'}`}>
                  {item.day ? getLunarLabel(item.day) : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Mục Lễ Giỗ trích xuất từ phả đồ */}
        <section className="space-y-4">
          <h4 className="text-[10px] md:text-xs font-black text-red-950 uppercase tracking-[0.3em] flex items-center gap-3">
             <span className="w-8 h-px bg-red-900/20"></span>
             Lễ Giỗ Trong Năm (Từ Phả Đồ)
             <span className="w-8 h-px bg-red-900/20"></span>
          </h4>
          <div className="space-y-3">
            {gioEvents.length > 0 ? (
              gioEvents.map(e => (
                <div key={e.id} className="bg-red-950 text-white p-4 md:p-5 rounded-[2rem] border-2 border-gold/20 shadow-xl flex justify-between items-center relative overflow-hidden group">
                  <div className="absolute -left-4 -top-4 text-6xl opacity-5 pointer-events-none rotate-12">🕯️</div>
                  <div className="flex gap-4 items-center relative z-10">
                    <div className="bg-gold text-red-950 w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black shadow-lg">
                       <span className="text-[8px] uppercase leading-none mb-0.5">Giỗ</span>
                       <span className="text-sm leading-none">📜</span>
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm md:text-base">{e.title}</p>
                      <p className="text-gold/60 text-[10px] font-black uppercase tracking-widest mt-1">Ngày Âm: {e.lunarDateLabel}</p>
                    </div>
                  </div>
                  {isAdmin && e.id.startsWith('e') && (
                    <button onClick={() => onDeleteEvent(e.id)} className="bg-white/10 hover:bg-red-600 p-2 rounded-full transition-all text-sm relative z-10">🗑️</button>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-[2rem] border-2 border-dashed border-red-900/10 text-center text-gray-400 font-bold italic text-sm">
                Đang cập nhật ngày giỗ từ phả đồ...
              </div>
            )}
          </div>
        </section>

        {/* Các sự kiện dòng họ khác */}
        <section className="space-y-4">
          <h4 className="text-[10px] md:text-xs font-black text-red-950 uppercase tracking-[0.3em] flex items-center gap-3">
             <span className="w-8 h-px bg-red-900/20"></span>
             Hội Họp & Việc Họ
             <span className="w-8 h-px bg-red-900/20"></span>
          </h4>
          <div className="space-y-3">
            {otherEvents.length > 0 ? (
              otherEvents.map(e => (
                <div key={e.id} className="bg-white p-4 rounded-[1.5rem] border border-red-900/5 flex justify-between items-center shadow-md hover:border-gold/50 transition-all group">
                  <div className="flex gap-4 items-center">
                    <div className="bg-red-50 text-red-900 w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-black">
                       <span className="text-[9px] leading-none mb-0.5">{e.solarDate ? new Date(e.solarDate).getMonth() + 1 : '--'}</span>
                       <span className="text-base leading-none">{e.solarDate ? new Date(e.solarDate).getDate() : '??'}</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{e.title}</p>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{e.type}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => onDeleteEvent(e.id)} className="bg-red-50 text-red-600 p-2 rounded-xl transition-all hover:bg-red-100">
                      🗑️
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white/40 p-8 rounded-[2rem] border border-dashed border-gray-200 text-center text-gray-400 font-bold italic text-sm">
                 Chưa có thông báo họp họ
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl flex flex-wrap justify-center gap-6 text-[10px] font-black text-red-950/40 uppercase tracking-widest border border-red-900/5">
         <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-900"></span> Hôm nay
         </div>
         <div className="flex items-center gap-2">
            <span className="text-xs">🕯️</span> Ngày Giỗ Cố Nhân
         </div>
      </div>
    </div>
  );
};

export default Events;
