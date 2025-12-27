
import React, { useState, useEffect } from 'react';
import { EventItem, EventType } from '../types';

interface EventsProps {
  events: EventItem[];
  isAdmin: boolean;
  onAddEvent: (event: EventItem) => void;
  onDeleteEvent: (id: string) => void;
}

const Events: React.FC<EventsProps> = ({ events, isAdmin, onAddEvent, onDeleteEvent }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock Lunar Data Logic (Cải tiến để hiển thị nhãn âm lịch chân thực hơn)
  const getLunarInfo = (date: Date) => {
    // Lưu ý: Đây là logic mô phỏng nhãn âm lịch theo giao diện người dùng yêu cầu
    return {
      hour: "Đinh Hợi",
      day: "Canh Ngọ",
      month: "Mậu Tý",
      year: "Ất Tỵ",
      lunarDay: 8, // Giả định theo ảnh mẫu
      lunarMonth: 11,
      lunarYear: "Ất Tỵ"
    };
  };

  const lunar = getLunarInfo(currentTime);
  const todaySolarStr = currentTime.toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.solarDate === todaySolarStr);
  const upcomingEvents = events
    .filter(e => e.solarDate > todaySolarStr)
    .sort((a, b) => a.solarDate.localeCompare(b.solarDate));

  // Giả lập danh sách ngày hiển thị trên lịch (7 ngày gần nhất)
  const calendarDays = [21, 22, 23, 24, 25, 26, 27];
  const lunarDays = [2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn space-y-4">
      {/* Header Sự kiện */}
      <div className="bg-red-700 rounded-t-2xl p-4 flex justify-between items-center shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/oriental-tiles.png')]"></div>
        <h2 className="text-3xl font-traditional text-white font-bold m-0 z-10">Sự kiện</h2>
        {isAdmin && (
          <button 
            onClick={() => {
              const title = prompt("Tên sự kiện:");
              const date = prompt("Ngày (YYYY-MM-DD):", todaySolarStr);
              if (title && date) {
                onAddEvent({
                  id: Date.now().toString(),
                  title,
                  solarDate: date,
                  type: 'họp mặt'
                });
              }
            }}
            className="bg-red-800/40 backdrop-blur-sm text-white border border-white/20 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-red-600 transition-all flex items-center gap-2 z-10"
          >
            <span className="text-lg">+</span> Tạo sự kiện
          </button>
        )}
      </div>

      {/* Dashboard Âm - Dương Lịch Nổi Bật */}
      <div className="bg-[#fdf6e3] p-6 rounded-2xl shadow-md border border-red-900/10 grid grid-cols-4 gap-2 text-center">
        <div className="space-y-1">
          <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">Giờ</p>
          <p className="text-3xl font-black text-red-700 leading-none">
            {currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}
          </p>
          <p className="text-xs text-gray-700 font-medium pt-1">{lunar.hour}</p>
        </div>
        <div className="space-y-1">
          <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">Ngày</p>
          <p className="text-3xl font-black text-red-700 leading-none">{currentTime.getDate()}</p>
          <p className="text-xs text-gray-700 font-medium pt-1">{lunar.day}</p>
        </div>
        <div className="space-y-1">
          <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">Tháng</p>
          <p className="text-3xl font-black text-red-700 leading-none">{currentTime.getMonth() + 1}</p>
          <p className="text-xs text-gray-700 font-medium pt-1">{lunar.month}</p>
        </div>
        <div className="space-y-1">
          <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">Năm</p>
          <p className="text-3xl font-black text-red-700 leading-none">{currentTime.getFullYear()}</p>
          <p className="text-xs text-gray-700 font-medium pt-1">{lunar.year}</p>
        </div>
      </div>

      {/* Calendar Widget (Theo mẫu ảnh) */}
      <div className="bg-[#fdf6e3] p-5 rounded-2xl shadow-md border border-red-900/10">
        <div className="flex justify-between items-center mb-6">
          <button className="text-gray-400 hover:text-red-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex flex-col items-center">
            <h3 className="text-xl font-bold text-gray-700">{currentTime.getMonth() + 1} / {currentTime.getFullYear()}</h3>
            <span className="mt-1 px-4 py-0.5 rounded-full border border-gray-300 text-[10px] font-black text-gray-500 shadow-sm uppercase">2 tuần</span>
          </div>
          <button className="text-gray-400 hover:text-red-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-gray-400 mb-2">{d}</div>
          ))}
          {calendarDays.map((d, i) => (
            <div 
              key={d} 
              className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer relative
                ${d === 27 ? 'bg-yellow-500 shadow-lg scale-105' : 'hover:bg-red-50/50'}
              `}
            >
              <span className={`text-lg font-black ${d === 27 ? 'text-red-950' : 'text-gray-700'}`}>{d}</span>
              <span className={`text-[10px] font-bold ${d === 27 ? 'text-red-900/80' : 'text-gray-400'}`}>{lunarDays[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danh sách sự kiện */}
      <div className="space-y-4">
        <section>
          <h4 className="text-sm font-black text-red-900 uppercase tracking-widest mb-2 flex items-center gap-2">
             Sự kiện hôm nay
          </h4>
          <div className="bg-white p-5 rounded-2xl border border-red-900/5 shadow-sm">
            {todayEvents.length > 0 ? (
              <div className="space-y-2">
                {todayEvents.map(e => (
                  <div key={e.id} className="flex justify-between items-center bg-red-50 p-3 rounded-xl">
                    <span className="font-bold text-red-800">{e.title}</span>
                    {isAdmin && <button onClick={() => onDeleteEvent(e.id)} className="text-[10px] font-black text-red-400 uppercase">Xóa</button>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-2 text-center">
                <p className="text-gray-400 text-sm font-medium italic">Không có sự kiện nào diễn ra hôm nay</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <h4 className="text-sm font-black text-red-900 uppercase tracking-widest mb-2">30 ngày tới</h4>
          <div className="space-y-2">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(e => (
                <div key={e.id} className="bg-white p-3 rounded-xl border border-red-900/5 flex justify-between items-center shadow-sm hover:border-red-200 transition-colors group">
                  <div className="flex gap-4 items-center">
                    <div className="bg-red-50 text-red-800 w-10 h-10 rounded-lg flex flex-col items-center justify-center font-black">
                       <span className="text-[9px] leading-none">{new Date(e.solarDate).getMonth() + 1}</span>
                       <span className="text-base leading-none">{new Date(e.solarDate).getDate()}</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{e.title}</p>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{e.type}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => onDeleteEvent(e.id)} className="opacity-0 group-hover:opacity-100 bg-red-50 text-red-600 p-1.5 rounded-lg transition-all hover:bg-red-100">
                      🗑️
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white/40 p-6 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 text-sm">
                 Chưa có sự kiện sắp tới
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Events;
