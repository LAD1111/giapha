
import React from 'react';

interface AdminPanelProps {
  cloudLink: string;
  onCloudLinkChange: (link: string) => void;
  onExport: () => void;
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  cloudLink, 
  onCloudLinkChange, 
  onExport, 
  onLogout 
}) => {
  return (
    <div className="sticky top-0 z-[100] bg-red-950 text-white p-4 shadow-2xl flex flex-wrap gap-4 justify-between items-center px-6 md:px-12 border-b-2 border-gold/30 backdrop-blur-md bg-opacity-95">
      <div className="flex items-center gap-4">
        <div className="relative">
          <span className="w-3 h-3 bg-green-500 rounded-full block animate-pulse"></span>
          <span className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75"></span>
        </div>
        <div>
          <span className="font-black text-[10px] md:text-xs uppercase tracking-[0.2em] text-gold/90 block">
            Chế độ Quản trị viên
          </span>
          <span className="text-[8px] text-white/40 uppercase">Đang đồng bộ với Google Doc</span>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-3 md:gap-6">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Link Google Doc (Công khai)..." 
            value={cloudLink} 
            onChange={(e) => onCloudLinkChange(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-[11px] w-48 md:w-80 outline-none focus:bg-white/10 focus:border-gold/50 transition-all placeholder:text-white/20 font-medium" 
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
            <span title="Dán link Google Doc của bạn và đặt chế độ 'Bất kỳ ai có liên kết đều có thể xem'">ℹ️</span>
          </div>
        </div>

        <button 
          onClick={onExport} 
          className="text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-5 py-2.5 rounded-full hover:bg-gold hover:text-red-950 hover:border-gold transition-all flex items-center gap-2 group"
          title="Lưu dữ liệu và sao chép để dán vào Google Doc"
        >
          <span>💾</span> Lưu & Sao chép JSON
        </button>

        <button 
          onClick={onLogout} 
          className="bg-gold text-red-950 px-6 py-2.5 rounded-full font-black text-[10px] uppercase shadow-lg shadow-gold/10 hover:bg-white hover:scale-105 active:scale-95 transition-all"
        >
          Thoát
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
