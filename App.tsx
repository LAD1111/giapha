
import React, { useState, useEffect, useMemo } from 'react';
import { AppSection, FamilyMember, NewsItem, EventItem, AppData, AppTheme } from './types';
import Navigation from './components/Navigation';
import FamilyTree from './components/FamilyTree';
import Events from './components/Events';
import AdminPanel from './components/AdminPanel';
import { PersistenceService } from './services/persistenceService';
import { 
  CLAN_NAME, CLAN_ADDRESS, SAMPLE_NEWS, SAMPLE_FAMILY_TREE 
} from './constants';

const DEFAULT_CLOUD_LINK = "https://docs.google.com/document/d/17fVZaOxx8s-gS3tFE3nj1fdmSJdYWw0mi_ar45TUoQw/edit?usp=sharing";

const App: React.FC = () => {
  // Yêu cầu: Mở web sẽ vào mục Sự kiện
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.EVENTS);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [cloudLink, setCloudLink] = useState<string>(() => localStorage.getItem('cloud_data_link') || DEFAULT_CLOUD_LINK);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [newsToDelete, setNewsToDelete] = useState<NewsItem | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [showBannerEdit, setShowBannerEdit] = useState(false);

  const [appData, setAppData] = useState<AppData>(() => {
    const saved = PersistenceService.loadLocal();
    if (saved) return saved;
    
    return {
      news: SAMPLE_NEWS,
      familyTree: SAMPLE_FAMILY_TREE,
      events: [
        { id: 'e1', title: 'Họp Mặt Đầu Xuân', solarDate: '2025-02-15', type: 'họp mặt' }
      ],
      bannerUrl: "https://images.unsplash.com/photo-1577908581023-95245842c8d2?auto=format&fit=crop&q=80&w=2000",
      address: CLAN_ADDRESS,
      historyText: "Lịch sử dòng họ Lê là một hành trình dài của sự hiếu học, đoàn kết và cống hiến...",
      ancestralHouseText: "Từ đường là nơi thờ tự linh thiêng, lưu giữ hồn cốt tổ tiên qua bao thế hệ.",
      regulations: [
        "Tôn thờ tổ tiên, hiếu thảo với cha mẹ.",
        "Đoàn kết, tương trợ giữa các thành viên.",
        "Khuyến học, khuyến tài cho thế hệ trẻ.",
        "Giữ gìn và tôn tạo di sản dòng họ."
      ],
      clanName: CLAN_NAME,
      lastUpdated: new Date().toISOString(),
      theme: 'tet'
    };
  });

  // Logic trích xuất ngày giỗ từ phả đồ
  const derivedGioEvents = useMemo(() => {
    const gioList: EventItem[] = [];
    const traverse = (member: FamilyMember) => {
      if (member.lunarDeathDate || member.deathDate) {
        gioList.push({
          id: `gio-${member.id}`,
          title: `Giỗ cụ ${member.name}`,
          solarDate: '', // Ngày âm lịch thường không cố định dương lịch hàng năm
          lunarDateLabel: member.lunarDeathDate || member.deathDate,
          type: 'giỗ',
          description: `Ngày mất: ${member.lunarDeathDate || member.deathDate}`
        });
      }
      if (member.spouseName && member.spouseDeathDate) {
         gioList.push({
          id: `gio-spouse-${member.id}`,
          title: `Giỗ cụ bà (vợ cụ ${member.name})`,
          solarDate: '',
          lunarDateLabel: member.spouseDeathDate,
          type: 'giỗ',
          description: `Ngày mất: ${member.spouseDeathDate}`
        });
      }
      member.children?.forEach(traverse);
    };
    traverse(appData.familyTree);
    return gioList;
  }, [appData.familyTree]);

  // Gộp sự kiện hệ thống và sự kiện từ phả đồ
  const allEvents = useMemo(() => {
    return [...appData.events, ...derivedGioEvents];
  }, [appData.events, derivedGioEvents]);

  useEffect(() => {
    document.body.className = appData.theme === 'classic' ? 'theme-classic' : '';
  }, [appData.theme]);

  useEffect(() => {
    const autoSync = async () => {
      setIsSyncing(true);
      const data = await PersistenceService.fetchFromCloud(cloudLink);
      if (data) {
        setAppData(data);
      }
      setIsSyncing(false);
    };
    autoSync();
  }, []);

  useEffect(() => {
    PersistenceService.saveLocal(appData);
  }, [appData]);

  const handleSync = async () => {
    if (!cloudLink) {
      showToast("Vui lòng cung cấp link Google Doc!", "info");
      return;
    }
    setIsSyncing(true);
    const cloudData = await PersistenceService.fetchFromCloud(cloudLink);
    if (cloudData) {
      setAppData(cloudData);
      showToast("Đồng bộ dữ liệu thành công!", "success");
    } else {
      showToast("Lỗi đồng bộ. Hãy đảm quả Google Doc ở chế độ Công Khai!", "error");
    }
    setIsSyncing(false);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const updateData = (updates: Partial<AppData>) => {
    setAppData(prev => ({ ...prev, ...updates, lastUpdated: new Date().toISOString() }));
  };

  // Fix: Added missing handleCloudLinkChange function to update cloud link and persist it localy.
  const handleCloudLinkChange = (link: string) => {
    setCloudLink(link);
    localStorage.setItem('cloud_data_link', link);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAdmin(true);
      setShowLogin(false);
      setPassword('');
      showToast("Đã kích hoạt chế độ Quản trị dòng họ", "success");
    } else {
      showToast("Mật khẩu không đúng!", "error");
    }
  };

  const exportBackup = () => {
    const jsonString = JSON.stringify(appData, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      showToast("Đã sao chép JSON! Hãy dán vào Google Doc.", "success");
    });
  };

  const renderSection = () => {
    switch (activeSection) {
      case AppSection.NEWS:
        return (
          <div className="animate-fadeIn space-y-12">
            <div className="text-center">
              <h2 className="text-5xl font-traditional text-primary font-bold mb-4">Tin Tức & Thông Báo</h2>
              <div className="h-1.5 w-32 bg-gold mx-auto rounded-full"></div>
            </div>
            {isAdmin && (
              <div className="flex justify-center">
                <button onClick={() => setEditingNews({ id: Date.now().toString(), title: '', date: new Date().toLocaleDateString('vi-VN'), summary: '', content: '', imageUrl: 'https://picsum.photos/seed/new/800/400' })} className="bg-primary text-white px-10 py-4 rounded-full font-black shadow-xl hover:opacity-90 transition-all border-2 border-gold/30 flex items-center gap-2">
                  <span>✍️</span> Soạn tin mới
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {appData.news.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl shadow-lg overflow-hidden border border-red-900/5 group relative">
                  <div className="h-64 overflow-hidden relative">
                    <img src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.title} />
                    {isAdmin && (
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingNews(item)} className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-gold transition-all">✏️</button>
                        <button onClick={() => setNewsToDelete(item)} className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-red-600 hover:text-white transition-all">🗑️</button>
                      </div>
                    )}
                  </div>
                  <div className="p-8">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{item.date}</span>
                    <h3 className="text-2xl font-traditional font-bold text-gray-900 mt-2 mb-4">{item.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-6">{item.summary}</p>
                    <button className="text-primary font-bold flex items-center gap-2 hover:translate-x-1 transition-transform">Xem thêm →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case AppSection.TREE:
        return <FamilyTree root={appData.familyTree} isAdmin={isAdmin} onEditMember={setEditingMember} onAddChild={(p) => {
          const newChild: FamilyMember = { id: `m-${Date.now()}`, name: 'Thành viên mới', generation: p.generation + 1, isMale: true };
          const addNode = (node: FamilyMember): FamilyMember => {
            if (node.id === p.id) return { ...node, children: [...(node.children || []), newChild] };
            if (node.children) return { ...node, children: node.children.map(addNode) };
            return node;
          };
          updateData({ familyTree: addNode(appData.familyTree) });
          setEditingMember(newChild);
        }} />;
      case AppSection.CHRONICLES:
        return (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="paper-texture p-12 md:p-20 shadow-2xl rounded-sm border-[24px] border-double border-red-900/10">
              <div className="flex justify-between items-center border-b-4 border-red-900/5 pb-10 mb-12">
                <h2 className="text-5xl font-traditional text-gray-900 italic font-black">Phả Kỹ Gia Tộc</h2>
                {isAdmin && (
                  <button onClick={() => setIsEditingText(!isEditingText)} className="bg-primary text-white px-8 py-2 rounded-full font-bold">
                    {isEditingText ? "Hoàn tất" : "Biên tập"}
                  </button>
                )}
              </div>
              {isEditingText ? (
                <textarea value={appData.historyText} onChange={(e) => updateData({ historyText: e.target.value })} className="w-full h-[600px] p-10 border-4 bg-transparent font-serif text-xl leading-relaxed outline-none" />
              ) : (
                <div className="whitespace-pre-wrap leading-loose text-gray-800 font-serif text-xl text-justify first-letter:text-7xl first-letter:font-bold first-letter:text-primary first-letter:float-left first-letter:mr-3">
                  {appData.historyText}
                </div>
              )}
            </div>
          </div>
        );
      case AppSection.ANCESTRAL_HOUSE:
        return (
          <div className="max-w-5xl mx-auto animate-fadeIn space-y-12">
            <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden">
              <div className="h-[300px] md:h-[500px] relative">
                <img src="https://images.unsplash.com/photo-1598640845355-668b5550dfb0?auto=format&fit=crop&q=80&w=1600" className="w-full h-full object-cover" alt="Từ Đường" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-10 left-10 md:bottom-16 md:left-16">
                   <h2 className="text-4xl md:text-7xl font-traditional text-white font-black">Từ Đường Dòng Họ</h2>
                   <p className="text-gold font-bold text-lg md:text-2xl mt-2 md:mt-4">{appData.address}</p>
                </div>
              </div>
              <div className="p-10 md:p-16">
                 {isEditingText ? (
                   <textarea value={appData.ancestralHouseText} onChange={(e) => updateData({ ancestralHouseText: e.target.value })} className="w-full h-40 border p-4 rounded-xl" />
                 ) : (
                   <p className="text-gray-700 leading-loose text-xl md:text-2xl italic border-l-8 border-gold pl-6 md:pl-10 py-4 bg-gray-50/50">
                     {appData.ancestralHouseText}
                   </p>
                 )}
                 {isAdmin && (
                   <button onClick={() => setIsEditingText(!isEditingText)} className="mt-8 bg-primary text-gold px-8 py-3 rounded-full font-black">
                     {isEditingText ? "Lưu" : "Chỉnh sửa"}
                   </button>
                 )}
              </div>
            </div>
          </div>
        );
      case AppSection.REGULATIONS:
        return (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="bg-[#fffcf0] p-10 md:p-16 shadow-2xl rounded-sm border-[16px] md:border-[32px] border-double border-gray-900/10 text-center">
               <h2 className="text-4xl md:text-6xl font-traditional text-primary font-black uppercase mb-8 md:mb-12">Tộc Ước</h2>
               {isEditingText ? (
                 <textarea value={appData.regulations.join('\n')} onChange={(e) => updateData({ regulations: e.target.value.split('\n') })} className="w-full h-80 border p-4" />
               ) : (
                 <div className="space-y-6 md:space-y-8 text-left max-w-2xl mx-auto">
                    {appData.regulations.map((reg, idx) => (
                      <div key={idx} className="flex gap-4 md:gap-8 items-start">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-primary text-gold rounded-full flex items-center justify-center font-bold flex-shrink-0">{idx + 1}</div>
                        <p className="text-lg md:text-2xl text-gray-900 font-bold italic">{reg}</p>
                      </div>
                    ))}
                 </div>
               )}
               {isAdmin && (
                 <button onClick={() => setIsEditingText(!isEditingText)} className="mt-8 md:mt-12 bg-primary text-gold px-8 md:px-12 py-3 md:py-4 rounded-full font-black">
                   {isEditingText ? "Lưu Tộc Ước" : "Chỉnh sửa Tộc Ước"}
                 </button>
               )}
            </div>
          </div>
        );
      case AppSection.EVENTS:
        // Truyền allEvents (bao gồm ngày giỗ từ phả đồ) vào component Events
        return <Events events={allEvents} isAdmin={isAdmin} onAddEvent={(e) => updateData({ events: [...appData.events, e] })} onDeleteEvent={(id) => updateData({ events: appData.events.filter(ev => ev.id !== id) })} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen pb-32">
      {isAdmin && (
        <AdminPanel 
          cloudLink={cloudLink} 
          theme={appData.theme || 'tet'}
          onCloudLinkChange={handleCloudLinkChange} 
          onThemeChange={(theme) => updateData({ theme })}
          onExport={exportBackup} 
          onLogout={() => setIsAdmin(false)} 
        />
      )}

      <div className="bg-primary text-gold text-[10px] py-1.5 text-center font-black tracking-[0.4em] uppercase border-b border-gold/20">
         Gia Phả Trực Tuyến - {appData.clanName} - Đồng bộ Google Docs
      </div>

      <header className="relative w-full h-[250px] md:h-[450px] lg:h-[600px] flex items-center justify-center bg-black overflow-hidden shadow-2xl">
        <img src={appData.bannerUrl} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000" alt="Clan Banner" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10"></div>
        <div className="absolute bottom-4 right-4 md:bottom-10 md:right-10 flex flex-col md:flex-row gap-2 md:gap-4 z-30">
           {isAdmin && (
             <button 
               onClick={() => setShowBannerEdit(true)}
               className="bg-white/90 text-red-950 px-4 md:px-6 py-2 md:py-3 rounded-full font-black text-[10px] md:text-xs uppercase hover:bg-gold transition-all shadow-xl active:scale-95 border border-red-900/10"
             >
               🖼️ Đổi ảnh bìa
             </button>
           )}
           <button 
             onClick={handleSync} 
             disabled={isSyncing} 
             className="bg-gold/90 text-red-950 px-4 md:px-6 py-2 md:py-3 rounded-full font-black text-[10px] md:text-xs uppercase flex items-center gap-2 hover:bg-white transition-all shadow-xl active:scale-95 disabled:opacity-50 border border-gold/30"
           >
             {isSyncing ? "⌛ Đang tải..." : "🔄 Cập nhật từ Google Doc"}
           </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-[-40px] md:mt-[-60px] relative z-20">
        <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="mt-10 md:mt-20">{renderSection()}</main>
      </div>

      {/* Modals remain the same... */}
      {showBannerEdit && (
        <div className="fixed inset-0 bg-black/90 z-[500] flex items-center justify-center p-8 backdrop-blur-md">
          <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] w-full max-w-lg text-center shadow-2xl border-4 border-gold">
            <h3 className="text-2xl md:text-3xl font-traditional font-black text-gray-900 mb-4 md:mb-6">Thay đổi ảnh bìa</h3>
            <p className="text-xs md:text-sm text-gray-500 mb-6">Dán link ảnh vào đây:</p>
            <input 
              type="text" 
              defaultValue={appData.bannerUrl}
              onBlur={(e) => updateData({ bannerUrl: e.target.value })}
              className="w-full border-2 border-gray-100 rounded-2xl p-4 mb-8 outline-none focus:border-gold"
              placeholder="https://..."
            />
            <div className="flex gap-4">
              <button onClick={() => setShowBannerEdit(false)} className="flex-1 bg-primary text-gold py-3 md:py-4 rounded-2xl font-black uppercase text-xs md:text-sm">Hoàn tất</button>
              <button onClick={() => setShowBannerEdit(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 md:py-4 rounded-2xl font-black uppercase text-xs md:text-sm">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-8 backdrop-blur-md">
           <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] border-8 border-gray-900 w-full max-w-md text-center shadow-2xl">
              <h3 className="text-3xl md:text-4xl font-traditional font-black text-gray-900 mb-6 md:mb-8">Quản Trị Viên</h3>
              <form onSubmit={handleLogin} className="space-y-6">
                 <input 
                   type="password" 
                   value={password} 
                   onChange={(e) => setPassword(e.target.value)} 
                   className="w-full border-4 border-gray-100 rounded-2xl p-4 text-center text-xl md:text-2xl font-black focus:border-primary outline-none" 
                   placeholder="••••" 
                 />
                 <button type="submit" className="w-full bg-primary text-gold py-4 rounded-2xl font-black uppercase hover:opacity-90 shadow-lg active:scale-95 text-xs md:text-sm">Đăng nhập</button>
                 <button type="button" onClick={() => setShowLogin(false)} className="text-gray-400 text-[10px] font-bold uppercase hover:text-primary">Quay lại</button>
              </form>
           </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-4 right-4 md:bottom-10 md:right-10 z-[500] px-6 md:px-8 py-3 md:py-4 rounded-2xl font-bold shadow-2xl animate-fadeIn flex items-center gap-3 border-2 text-xs md:text-sm ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 
          toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 
          'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
          {toast.message}
        </div>
      )}

      <footer className="mt-20 md:mt-40 bg-primary py-12 md:py-24 text-center border-t-8 border-gold px-4">
         <h4 className="text-3xl md:text-5xl font-traditional text-gold font-black uppercase mb-6 md:mb-8">{appData.clanName}</h4>
         <p className="text-yellow-100 font-serif italic text-lg md:text-xl">"Tổ Tông Công Đức Thiên Niên Thịnh - Tử Hiếu Tôn Hiền Vạn Đại Vinh"</p>
         {!isAdmin && (
           <button onClick={() => setShowLogin(true)} className="mt-8 md:mt-12 text-gold/30 hover:text-gold text-[10px] font-black uppercase tracking-[0.5em]">
             🔒 Quản trị hệ thống
           </button>
         )}
      </footer>

      {editingMember && (
        <div className="fixed inset-0 bg-black/90 z-[400] flex items-center justify-center p-4 md:p-8 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white p-8 md:p-12 rounded-[2rem] w-full max-w-4xl shadow-2xl border-4 border-gold/20">
            <div className="flex flex-col md:flex-row justify-between items-center border-b pb-4 mb-8 gap-4">
              <h3 className="text-2xl md:text-3xl font-traditional font-bold text-gray-900">Biên tập: {editingMember.name}</h3>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setEditingMember({...editingMember, isMale: true})} className={`px-4 md:px-6 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest ${editingMember.isMale ? 'bg-primary text-white shadow-md' : 'text-gray-400'}`}>Nam</button>
                <button onClick={() => setEditingMember({...editingMember, isMale: false})} className={`px-4 md:px-6 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest ${!editingMember.isMale ? 'bg-pink-600 text-white shadow-md' : 'text-gray-400'}`}>Nữ</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary bg-gray-100 px-4 py-2 rounded-lg">Thông tin chính</h4>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Họ và tên</label>
                  <input type="text" value={editingMember.name} onChange={(e) => setEditingMember({...editingMember, name: e.target.value})} className="w-full border-2 border-gray-50 p-3 md:p-4 rounded-xl focus:border-gold outline-none font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Năm sinh</label>
                    <input type="text" value={editingMember.birthDate || ''} onChange={(e) => setEditingMember({...editingMember, birthDate: e.target.value})} className="w-full border-2 border-gray-50 p-3 md:p-4 rounded-xl focus:border-gold outline-none font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Năm mất (Âm lịch)</label>
                    <input type="text" value={editingMember.lunarDeathDate || editingMember.deathDate || ''} onChange={(e) => setEditingMember({...editingMember, lunarDeathDate: e.target.value, deathDate: e.target.value})} className="w-full border-2 border-gray-50 p-3 md:p-4 rounded-xl focus:border-gold outline-none font-medium" />
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-pink-900 bg-pink-50 px-4 py-2 rounded-lg">Thông tin Vợ / Chồng</h4>
                <input type="text" value={editingMember.spouseName || ''} onChange={(e) => setEditingMember({...editingMember, spouseName: e.target.value})} className="w-full border-2 border-pink-50 p-3 md:p-4 rounded-xl focus:border-pink-200 outline-none font-bold" placeholder="Họ tên vợ/chồng" />
                <input type="text" value={editingMember.spouseDeathDate || ''} onChange={(e) => setEditingMember({...editingMember, spouseDeathDate: e.target.value})} className="w-full border-2 border-pink-50 p-3 md:p-4 rounded-xl focus:border-pink-200 outline-none font-medium" placeholder="Ngày mất (Âm lịch)" />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mt-8 md:mt-12 pt-8 border-t">
              <button onClick={() => {
                const updateNode = (node: FamilyMember): FamilyMember => {
                  if (node.id === editingMember.id) return editingMember;
                  if (node.children) return { ...node, children: node.children.map(updateNode) };
                  return node;
                };
                updateData({ familyTree: updateNode(appData.familyTree) });
                setEditingMember(null);
                showToast("Đã lưu thay đổi");
              }} className="bg-primary text-gold px-8 md:px-10 py-3 md:py-4 rounded-2xl font-black uppercase shadow-lg flex-1 text-xs md:text-sm">Lưu thay đổi</button>
              <button onClick={() => setEditingMember(null)} className="bg-gray-100 text-gray-600 px-8 md:px-10 py-3 md:py-4 rounded-2xl font-black uppercase flex-1 text-xs md:text-sm">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {editingNews && (
        <div className="fixed inset-0 bg-black/90 z-[400] flex items-center justify-center p-8 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white p-12 rounded-[2rem] w-full max-w-3xl shadow-2xl border-4 border-gold/20">
            <h3 className="text-3xl font-traditional font-bold mb-8 text-gray-900">
              {appData.news.find(n => n.id === editingNews.id) ? "Sửa tin tức" : "Soạn tin mới"}
            </h3>
            <div className="space-y-6">
              <input type="text" value={editingNews.title} onChange={(e) => setEditingNews({...editingNews, title: e.target.value})} className="w-full border-2 border-gray-50 p-4 rounded-xl font-bold text-xl" placeholder="Tiêu đề..." />
              <textarea value={editingNews.summary} onChange={(e) => setEditingNews({...editingNews, summary: e.target.value})} className="w-full border-2 border-gray-50 p-4 rounded-xl h-24 resize-none" placeholder="Tóm tắt ngắn..." />
              <textarea value={editingNews.content} onChange={(e) => setEditingNews({...editingNews, content: e.target.value})} className="w-full border-2 border-gray-50 p-4 rounded-xl h-64 resize-none" placeholder="Nội dung chi tiết..." />
              <input type="text" value={editingNews.imageUrl || ''} onChange={(e) => setEditingNews({...editingNews, imageUrl: e.target.value})} className="w-full border-2 border-gray-50 p-4 rounded-xl" placeholder="Link ảnh..." />
              <div className="flex gap-4 pt-4">
                <button onClick={() => {
                  if (appData.news.find(n => n.id === editingNews.id)) {
                    updateData({ news: appData.news.map(n => n.id === editingNews.id ? editingNews : n) });
                  } else {
                    updateData({ news: [editingNews, ...appData.news] });
                  }
                  setEditingNews(null);
                }} className="bg-primary text-gold px-10 py-4 rounded-2xl font-black uppercase shadow-lg flex-1">Đăng tin</button>
                <button onClick={() => setEditingNews(null)} className="bg-gray-100 text-gray-600 px-10 py-4 rounded-2xl font-black uppercase flex-1">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {newsToDelete && (
        <div className="fixed inset-0 bg-black/90 z-[500] flex items-center justify-center p-8 backdrop-blur-md">
          <div className="bg-white p-10 rounded-[2.5rem] border-8 border-gray-900 w-full max-w-md text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">⚠️</div>
            <h3 className="text-3xl font-traditional font-black text-gray-900 mb-4">Xác nhận xóa?</h3>
            <div className="flex gap-4">
              <button onClick={() => { updateData({ news: appData.news.filter(n => n.id !== newsToDelete.id) }); setNewsToDelete(null); }} className="flex-1 bg-red-700 text-white py-4 rounded-2xl font-black uppercase">Xác nhận</button>
              <button onClick={() => setNewsToDelete(null)} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black uppercase">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
