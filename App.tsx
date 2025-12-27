
import React, { useState, useEffect, useRef } from 'react';
import { AppSection, FamilyMember, NewsItem, EventItem, AppData } from './types';
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
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.TREE);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [cloudLink, setCloudLink] = useState<string>(() => localStorage.getItem('cloud_data_link') || DEFAULT_CLOUD_LINK);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);

  // --- Khởi tạo dữ liệu ---
  const [appData, setAppData] = useState<AppData>(() => {
    const saved = PersistenceService.loadLocal();
    if (saved) return saved;
    
    return {
      news: SAMPLE_NEWS,
      familyTree: SAMPLE_FAMILY_TREE,
      events: [
        { id: '1', title: 'Giỗ Tổ Dòng Họ', solarDate: '2025-04-10', type: 'giỗ' },
        { id: '2', title: 'Họp Mặt Đầu Xuân', solarDate: '2025-02-15', type: 'họp mặt' }
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
      lastUpdated: new Date().toISOString()
    };
  });

  // Tự động đồng bộ khi mở Web
  useEffect(() => {
    const autoSync = async () => {
      setIsSyncing(true);
      const data = await PersistenceService.fetchFromCloud(cloudLink);
      if (data) {
        setAppData(data);
        showToast("Đã tự động cập nhật dữ liệu từ Cloud", "success");
      } else {
        showToast("Sử dụng dữ liệu tạm thời (Không thể tải từ Cloud)", "info");
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
      showToast("Lỗi đồng bộ. Hãy đảm bảo Google Doc ở chế độ Công Khai!", "error");
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
    // Sao chép vào clipboard để người dùng dán vào Google Doc
    navigator.clipboard.writeText(jsonString).then(() => {
      showToast("Đã sao chép JSON! Hãy dán (Ctrl+V) vào Google Doc của bạn.", "success");
      
      // Đồng thời tải file về như một phương án backup phụ
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GiaPha_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    }).catch(err => {
      showToast("Lỗi sao chép, vui lòng tải file backup bên dưới.", "error");
    });
  };

  const handleCloudLinkChange = (link: string) => {
    setCloudLink(link);
    localStorage.setItem('cloud_data_link', link);
  };

  const renderSection = () => {
    switch (activeSection) {
      case AppSection.NEWS:
        return (
          <div className="animate-fadeIn space-y-12">
            <div className="text-center">
              <h2 className="text-5xl font-traditional text-red-900 font-bold mb-4">Tin Tức & Thông Báo</h2>
              <div className="h-1.5 w-32 bg-gold mx-auto rounded-full"></div>
            </div>
            {isAdmin && (
              <div className="flex justify-center">
                <button onClick={() => setEditingNews({ id: Date.now().toString(), title: '', date: new Date().toLocaleDateString('vi-VN'), summary: '', content: '', imageUrl: 'https://picsum.photos/seed/new/800/400' })} className="bg-red-800 text-white px-10 py-4 rounded-full font-black shadow-xl hover:bg-red-950 transition-all border-2 border-gold/30">
                  ✍️ Soạn tin mới
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {appData.news.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl shadow-lg overflow-hidden border border-red-900/5 group">
                  <div className="h-64 overflow-hidden relative">
                    <img src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="p-8">
                    <span className="text-[10px] font-black text-red-800 uppercase tracking-widest">{item.date}</span>
                    <h3 className="text-2xl font-traditional font-bold text-red-950 mt-2 mb-4">{item.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-6">{item.summary}</p>
                    <button className="text-red-800 font-bold flex items-center gap-2">Xem thêm →</button>
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
                <h2 className="text-5xl font-traditional text-red-950 italic font-black">Phả Kỹ Gia Tộc</h2>
                {isAdmin && (
                  <button onClick={() => setIsEditingText(!isEditingText)} className="bg-red-800 text-white px-8 py-2 rounded-full font-bold">
                    {isEditingText ? "Hoàn tất" : "Biên tập"}
                  </button>
                )}
              </div>
              {isEditingText ? (
                <textarea value={appData.historyText} onChange={(e) => updateData({ historyText: e.target.value })} className="w-full h-[600px] p-10 border-4 bg-transparent font-serif text-xl leading-relaxed outline-none" />
              ) : (
                <div className="whitespace-pre-wrap leading-loose text-gray-800 font-serif text-xl text-justify first-letter:text-7xl first-letter:font-bold first-letter:text-red-900 first-letter:float-left first-letter:mr-3">
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
              <div className="h-[500px] relative">
                <img src="https://images.unsplash.com/photo-1598640845355-668b5550dfb0?auto=format&fit=crop&q=80&w=1600" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-red-950 to-transparent"></div>
                <div className="absolute bottom-16 left-16">
                   <h2 className="text-7xl font-traditional text-white font-black">Từ Đường Dòng Họ</h2>
                   <p className="text-gold font-bold text-2xl mt-4">{appData.address}</p>
                </div>
              </div>
              <div className="p-16">
                 {isEditingText ? (
                   <textarea value={appData.ancestralHouseText} onChange={(e) => updateData({ ancestralHouseText: e.target.value })} className="w-full h-40 border p-4 rounded-xl" />
                 ) : (
                   <p className="text-gray-700 leading-loose text-2xl italic border-l-8 border-gold pl-10 py-4 bg-red-50/30">
                     {appData.ancestralHouseText}
                   </p>
                 )}
                 {isAdmin && (
                   <button onClick={() => setIsEditingText(!isEditingText)} className="mt-8 bg-red-950 text-gold px-8 py-3 rounded-full font-black">
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
            <div className="bg-[#fffcf0] p-16 shadow-2xl rounded-sm border-[32px] border-double border-red-950 text-center">
               <h2 className="text-6xl font-traditional text-red-900 font-black uppercase mb-12">Tộc Ước</h2>
               {isEditingText ? (
                 <textarea value={appData.regulations.join('\n')} onChange={(e) => updateData({ regulations: e.target.value.split('\n') })} className="w-full h-80 border p-4" />
               ) : (
                 <div className="space-y-8 text-left max-w-2xl mx-auto">
                    {appData.regulations.map((reg, idx) => (
                      <div key={idx} className="flex gap-8 items-start">
                        <div className="w-12 h-12 bg-red-950 text-gold rounded-full flex items-center justify-center font-bold flex-shrink-0">{idx + 1}</div>
                        <p className="text-2xl text-red-950 font-bold italic">{reg}</p>
                      </div>
                    ))}
                 </div>
               )}
               {isAdmin && (
                 <button onClick={() => setIsEditingText(!isEditingText)} className="mt-12 bg-red-950 text-gold px-12 py-4 rounded-full font-black">
                   {isEditingText ? "Lưu Tộc Ước" : "Chỉnh sửa Tộc Ước"}
                 </button>
               )}
            </div>
          </div>
        );
      case AppSection.EVENTS:
        return <Events events={appData.events} isAdmin={isAdmin} onAddEvent={(e) => updateData({ events: [...appData.events, e] })} onDeleteEvent={(id) => updateData({ events: appData.events.filter(e => e.id !== id) })} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen pb-32">
      {isAdmin && (
        <AdminPanel 
          cloudLink={cloudLink} 
          onCloudLinkChange={handleCloudLinkChange} 
          onExport={exportBackup} 
          onLogout={() => setIsAdmin(false)} 
        />
      )}

      <div className="bg-red-950 text-gold text-[10px] py-1.5 text-center font-black tracking-[0.4em] uppercase border-b border-gold/20">
         Gia Phả Trực Tuyến - {appData.clanName} - Đồng bộ Google Docs
      </div>

      <header className="relative w-full h-[600px] flex items-center justify-center bg-black overflow-hidden shadow-2xl">
        <img src={appData.bannerUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Clan Banner" />
        <div className="relative z-10 text-center">
          <h1 className="text-8xl md:text-[10rem] font-traditional text-white font-black drop-shadow-2xl">{appData.clanName}</h1>
          <p className="text-4xl font-festive text-gold italic mt-4">Vạn Đại Trường Tồn</p>
        </div>
        
        <div className="absolute bottom-10 right-10 flex gap-4">
           <button 
             onClick={handleSync} 
             disabled={isSyncing} 
             className="bg-gold/90 text-red-950 px-6 py-3 rounded-full font-black text-xs uppercase flex items-center gap-2 hover:bg-white transition-all shadow-xl active:scale-95 disabled:opacity-50"
             title="Cập nhật dữ liệu mới nhất từ Google Doc"
           >
             {isSyncing ? "⌛ Đang tải..." : "🔄 Cập nhật từ Google Doc"}
           </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 mt-[-60px] relative z-20">
        <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="mt-20">{renderSection()}</main>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-8 backdrop-blur-md">
           <div className="bg-white p-12 rounded-[3rem] border-8 border-red-950 w-full max-w-md text-center shadow-2xl">
              <h3 className="text-4xl font-traditional font-black text-red-950 mb-8">Quản Trị Viên</h3>
              <form onSubmit={handleLogin} className="space-y-6">
                 <input 
                   type="password" 
                   value={password} 
                   onChange={(e) => setPassword(e.target.value)} 
                   className="w-full border-4 border-red-100 rounded-2xl p-4 text-center text-2xl font-black focus:border-red-800 outline-none transition-all" 
                   placeholder="••••" 
                   autoFocus
                 />
                 <button type="submit" className="w-full bg-red-950 text-gold py-4 rounded-2xl font-black uppercase hover:bg-red-800 transition-all shadow-lg active:scale-95">Đăng nhập</button>
                 <button type="button" onClick={() => setShowLogin(false)} className="text-gray-400 text-xs font-bold uppercase hover:text-red-800">Quay lại</button>
              </form>
           </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-10 right-10 z-[500] px-8 py-4 rounded-2xl font-bold shadow-2xl animate-fadeIn flex items-center gap-3 border-2 ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 
          toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 
          'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
          {toast.message}
        </div>
      )}

      <footer className="mt-40 bg-red-950 py-24 text-center border-t-8 border-gold">
         <h4 className="text-5xl font-traditional text-gold font-black uppercase mb-8">{appData.clanName}</h4>
         <p className="text-yellow-100 font-serif italic text-xl">"Tổ Tông Công Đức Thiên Niên Thịnh - Tử Hiếu Tôn Hiền Vạn Đại Vinh"</p>
         {!isAdmin && (
           <button onClick={() => setShowLogin(true)} className="mt-12 text-gold/30 hover:text-gold transition-all text-[10px] font-black uppercase tracking-[0.5em]">
             🔒 Quản trị hệ thống
           </button>
         )}
      </footer>

      {/* Member Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/90 z-[400] flex items-center justify-center p-8 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white p-12 rounded-[2rem] w-full max-w-2xl shadow-2xl border-4 border-gold/20">
            <h3 className="text-3xl font-traditional font-bold mb-8 text-red-950">Chỉnh sửa: {editingMember.name}</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Họ và tên</label>
                <input type="text" value={editingMember.name} onChange={(e) => setEditingMember({...editingMember, name: e.target.value})} className="w-full border-2 border-red-50 p-4 rounded-xl focus:border-red-200 outline-none font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Năm sinh - Năm mất (Dương lịch)</label>
                <input type="text" value={editingMember.birthDate || ''} onChange={(e) => setEditingMember({...editingMember, birthDate: e.target.value})} className="w-full border-2 border-red-50 p-4 rounded-xl focus:border-red-200 outline-none font-medium" placeholder="Ví dụ: 1950 - 2020" />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => {
                  const updateNode = (node: FamilyMember): FamilyMember => {
                    if (node.id === editingMember.id) return editingMember;
                    if (node.children) return { ...node, children: node.children.map(updateNode) };
                    return node;
                  };
                  updateData({ familyTree: updateNode(appData.familyTree) });
                  setEditingMember(null);
                  showToast("Đã lưu vào bộ nhớ tạm");
                }} className="bg-red-950 text-gold px-10 py-4 rounded-2xl font-black uppercase shadow-lg hover:bg-red-800 transition-all flex-1">Lưu tạm</button>
                <button onClick={() => setEditingMember(null)} className="bg-gray-100 text-gray-600 px-10 py-4 rounded-2xl font-black uppercase hover:bg-gray-200 transition-all">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
