
import React, { useState, useEffect, useRef } from 'react';
import { AppSection, FamilyMember, NewsItem, EventItem, AppData } from './types';
import Navigation from './components/Navigation';
import FamilyTree from './components/FamilyTree';
import Events from './components/Events';
import { generateClanHistory, saveToCloud, loadFromCloud } from './services/geminiService';
import { 
  CLAN_NAME, CLAN_ADDRESS, SAMPLE_NEWS, SAMPLE_FAMILY_TREE 
} from './constants';

const GOOGLE_DRIVE_FOLDER = "https://drive.google.com/drive/folders/1XU-B-zFLjhCA3dwJtSplnkuI6vCxaxOL";

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.TREE);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [cloudBinId, setCloudBinId] = useState(() => localStorage.getItem('giapha_bin_id') || "67be846e8c61793740924089"); // ID mặc định hoặc của bạn
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [appData, setAppData] = useState<AppData>({
    news: SAMPLE_NEWS,
    familyTree: SAMPLE_FAMILY_TREE,
    events: [],
    bannerUrl: "https://images.unsplash.com/photo-1577908581023-95245842c8d2?auto=format&fit=crop&q=80&w=2000",
    address: CLAN_ADDRESS,
    historyText: "Lịch sử dòng họ đang được tải...",
    ancestralHouseText: "Thông tin từ đường đang được tải...",
    regulations: ["Đang tải tộc ước..."],
    clanName: CLAN_NAME,
    lastUpdated: new Date().toISOString()
  });

  // Tự động tải dữ liệu từ Cloud khi khởi chạy để đảm bảo mọi người xem giống nhau
  useEffect(() => {
    const initData = async () => {
      if (cloudBinId) {
        setIsLoadingCloud(true);
        const cloudData = await loadFromCloud(cloudBinId);
        if (cloudData) {
          setAppData(cloudData);
          showToast("Dữ liệu đã được đồng bộ từ hệ thống", "success");
        } else {
          loadLocal();
        }
        setIsLoadingCloud(false);
      } else {
        loadLocal();
      }
    };

    const loadLocal = () => {
      const saved = localStorage.getItem('giapha_le_data');
      if (saved) {
        try { setAppData(JSON.parse(saved)); } catch (e) { console.error(e); }
      }
    };

    initData();
  }, [cloudBinId]);

  // Lưu bản sao tạm thời ở máy hiện tại
  useEffect(() => {
    localStorage.setItem('giapha_le_data', JSON.stringify(appData));
  }, [appData]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateData = (updates: Partial<AppData>) => {
    setAppData(prev => ({ ...prev, ...updates, lastUpdated: new Date().toISOString() }));
  };

  const handleSyncCloud = async () => {
    if (!cloudBinId) {
      const id = prompt("Nhập Mã định danh dữ liệu (Bin ID):");
      if (id) {
        setCloudBinId(id);
        localStorage.setItem('giapha_bin_id', id);
      }
      return;
    }
    
    setIsLoadingCloud(true);
    const success = await saveToCloud(appData, cloudBinId);
    if (success) {
      showToast("Đã xuất bản! Tất cả mọi người sẽ thấy thay đổi này.", "success");
    } else {
      showToast("Lỗi đồng bộ! Vui lòng kiểm tra kết nối mạng.", "error");
    }
    setIsLoadingCloud(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAdmin(true);
      setShowLogin(false);
      setPassword('');
      showToast("Đã kích hoạt quyền quản trị", "success");
    } else {
      showToast("Mật khẩu không chính xác", "error");
    }
  };

  // Các state hỗ trợ edit
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const renderSection = () => {
    if (isLoadingCloud && activeSection !== AppSection.TREE) {
      return (
        <div className="flex flex-col items-center justify-center py-40">
          <div className="w-16 h-16 border-4 border-red-900 border-t-gold rounded-full animate-spin mb-6"></div>
          <p className="text-red-900 font-black tracking-widest uppercase animate-pulse">Đang kết nối kho dữ liệu dòng họ...</p>
        </div>
      );
    }

    switch (activeSection) {
      case AppSection.NEWS:
        return (
          <div className="animate-fadeIn space-y-12">
            <div className="text-center relative">
              <h2 className="text-5xl font-traditional text-red-900 font-bold mb-4">Tin Tức & Thông Báo</h2>
              <div className="h-1.5 w-32 bg-gold mx-auto rounded-full shadow-sm"></div>
            </div>
            {isAdmin && (
              <div className="flex justify-center">
                <button onClick={() => setEditingNews({ id: Date.now().toString(), title: '', date: new Date().toLocaleDateString('vi-VN'), summary: '', content: '', imageUrl: 'https://picsum.photos/seed/new/800/400' })} className="bg-red-800 text-white px-10 py-4 rounded-full font-black shadow-xl hover:bg-red-950 transition-all flex items-center gap-3 transform hover:scale-105 active:scale-95 border-2 border-gold/30">
                  <span className="text-xl">✍️</span> Đăng thông báo mới
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {appData.news.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl shadow-traditional overflow-hidden border border-red-900/5 group hover:shadow-2xl transition-all duration-500">
                  <div className="h-64 overflow-hidden relative">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                    {isAdmin && (
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button onClick={() => setEditingNews(item)} className="bg-yellow-500 text-white p-2.5 rounded-full shadow-lg hover:bg-yellow-600 transition-colors">✏️</button>
                        <button onClick={() => { if(confirm("Xóa tin này?")) updateData({ news: appData.news.filter(n => n.id !== item.id) }); }} className="bg-red-600 text-white p-2.5 rounded-full shadow-lg hover:bg-red-700 transition-colors">🗑️</button>
                      </div>
                    )}
                  </div>
                  <div className="p-8">
                    <span className="inline-block bg-red-50 text-red-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4">{item.date}</span>
                    <h3 className="text-2xl font-traditional font-bold text-red-950 mb-4 leading-tight group-hover:text-red-700 transition-colors">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3">{item.summary}</p>
                    <button className="text-red-800 font-bold hover:gap-4 transition-all flex items-center gap-2 group/btn">Xem chi tiết <span className="group-hover/btn:translate-x-1 transition-transform">→</span></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case AppSection.TREE:
        return <FamilyTree root={appData.familyTree} isAdmin={isAdmin} onEditMember={setEditingMember} onAddChild={(p) => {
           const newChild: FamilyMember = { id: `m-${Date.now()}`, name: 'Thành viên mới', generation: p.generation + 1, isMale: true, parentName: p.name };
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
            <div className="paper-texture p-12 md:p-20 shadow-2xl rounded-sm border-[24px] border-double border-red-900/10 relative">
              <div className="absolute top-0 right-0 p-8 opacity-5"><span className="text-[200px]">📜</span></div>
              <div className="relative z-10">
                <div className="flex justify-between items-center border-b-4 border-red-900/5 pb-10 mb-12">
                  <h2 className="text-5xl font-traditional text-red-950 italic m-0 font-black">Phả Kỹ Gia Tộc</h2>
                  {isAdmin && (
                    <div className="flex gap-4">
                      <button onClick={async () => { setAiLoading(true); const c = await generateClanHistory(appData.clanName, appData.address); updateData({ historyText: c }); setAiLoading(false); }} disabled={aiLoading} className="bg-gold text-red-950 px-6 py-2 rounded-full font-bold shadow-lg">
                        {aiLoading ? "Đang viết..." : "AI Soạn thảo"}
                      </button>
                      <button onClick={() => setIsEditingText(!isEditingText)} className="bg-red-800 text-white px-8 py-2 rounded-full font-bold">
                        {isEditingText ? "Hoàn tất" : "Chỉnh sửa"}
                      </button>
                    </div>
                  )}
                </div>
                {isEditingText ? (
                  <textarea value={appData.historyText} onChange={(e) => updateData({ historyText: e.target.value })} className="w-full h-[600px] p-10 border-4 border-double border-red-900/10 bg-transparent font-serif text-xl leading-relaxed outline-none" />
                ) : (
                  <div className="whitespace-pre-wrap leading-loose text-gray-800 font-medium text-xl text-justify font-serif">
                    {appData.historyText}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case AppSection.ANCESTRAL_HOUSE:
        return (
          <div className="max-w-5xl mx-auto animate-fadeIn space-y-12">
            <div className="bg-white rounded-[3rem] shadow-traditional border-4 border-red-900/5 overflow-hidden">
              <div className="h-[500px] relative">
                <img src="https://images.unsplash.com/photo-1598640845355-668b5550dfb0?auto=format&fit=crop&q=80&w=1600" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-red-950 via-transparent to-transparent opacity-90"></div>
                <div className="absolute bottom-0 left-0 p-16 w-full">
                   <h2 className="text-7xl font-traditional text-white m-0 font-black">Từ Đường Linh Thiêng</h2>
                   <p className="text-gold font-bold text-2xl tracking-widest mt-4 uppercase">{appData.address}</p>
                </div>
              </div>
              <div className="p-16">
                 {isEditingText ? (
                    <textarea value={appData.ancestralHouseText} onChange={(e) => updateData({ ancestralHouseText: e.target.value })} className="w-full h-80 p-8 border-4 border-double border-red-100 rounded-3xl bg-red-50/20 text-xl outline-none" />
                 ) : (
                    <p className="text-gray-700 leading-loose whitespace-pre-wrap text-2xl italic font-medium border-l-12 border-gold/30 pl-12 py-6">
                      {appData.ancestralHouseText}
                    </p>
                 )}
                 {isAdmin && (
                    <button onClick={() => setIsEditingText(!isEditingText)} className="mt-8 bg-red-900 text-gold px-10 py-3 rounded-full font-black shadow-lg">
                      {isEditingText ? "💾 Lưu" : "✏️ Chỉnh sửa"}
                    </button>
                 )}
              </div>
            </div>
          </div>
        );
      case AppSection.REGULATIONS:
        return (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="bg-[#fffcf0] p-16 md:p-24 shadow-2xl rounded-sm border-[32px] border-double border-red-950 text-center">
               <h2 className="text-6xl font-traditional text-red-900 uppercase tracking-widest font-black mb-12">Tộc Ước</h2>
               {isEditingText ? (
                   <textarea value={appData.regulations.join('\n')} onChange={(e) => updateData({ regulations: e.target.value.split('\n') })} className="w-full h-[500px] p-12 border-8 border-double border-red-900/20 bg-white/50 text-2xl outline-none" />
               ) : (
                   <div className="space-y-8 text-left max-w-2xl mx-auto">
                     {appData.regulations.map((reg, idx) => (
                       <div key={idx} className="flex gap-6 items-start">
                         <div className="w-12 h-12 rounded-full bg-red-950 text-gold flex items-center justify-center font-bold flex-shrink-0 shadow-lg">{idx + 1}</div>
                         <p className="text-2xl text-red-950 font-bold italic leading-relaxed">{reg}</p>
                       </div>
                     ))}
                   </div>
               )}
               {isAdmin && (
                 <button onClick={() => setIsEditingText(!isEditingText)} className="mt-12 bg-red-950 text-gold px-12 py-4 rounded-full font-black">
                   {isEditingText ? "💾 Lưu Tộc Ước" : "📜 Chỉnh sửa"}
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
      {toast && (
        <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[500] px-10 py-5 rounded-full shadow-2xl flex items-center gap-4 animate-fadeIn border-2 backdrop-blur-xl ${toast.type === 'success' ? 'bg-green-900/90 border-green-400 text-white' : 'bg-red-950/90 border-red-400 text-white'}`}>
          <span className="text-3xl">{toast.type === 'success' ? '✅' : '❌'}</span>
          <span className="font-black tracking-wider uppercase text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <header className="relative w-full h-[500px] md:h-[700px] flex items-center justify-center bg-black overflow-hidden">
        <img src={appData.bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-950/80"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-7xl md:text-[10rem] font-traditional text-white font-black mb-6 drop-shadow-2xl">{appData.clanName}</h1>
          <p className="text-2xl md:text-5xl font-festive text-gold italic">- Vạn Đại Trường Tồn -</p>
        </div>
      </header>

      {/* Admin Quick Control Bar - Tích hợp Google Drive */}
      {isAdmin && (
        <div className="bg-red-950 text-gold py-6 px-12 sticky top-0 z-[100] border-b-2 border-gold/20 flex justify-between items-center shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-6">
             <div className="flex flex-col">
                <span className="font-black uppercase tracking-widest text-xs">Hệ Thống Quản Trị Trung Tâm</span>
                <span className="text-[10px] opacity-60">ID Dữ liệu: {cloudBinId}</span>
             </div>
          </div>
          <div className="flex gap-4 items-center">
             <a href={GOOGLE_DRIVE_FOLDER} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2">
                <span>📂</span> Mở Folder Google Drive
             </a>
             <button onClick={handleSyncCloud} disabled={isLoadingCloud} className="bg-gold text-red-950 px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-lg">
               {isLoadingCloud ? "Đang đẩy dữ liệu..." : "☁️ Xuất bản toàn cầu"}
             </button>
             <button onClick={() => setIsAdmin(false)} className="bg-white/10 text-white border border-white/20 px-6 py-2.5 rounded-full text-[10px] font-black uppercase">Đóng</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 mt-[-80px] relative z-20">
        <Navigation activeSection={activeSection} onSectionChange={(s) => { setActiveSection(s); setIsEditingText(false); }} />
        <main className="mt-24">{renderSection()}</main>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-8 backdrop-blur-md">
          <div className="bg-white p-12 rounded-[3rem] border-8 border-red-950 w-full max-w-md text-center">
             <h3 className="text-4xl font-traditional text-red-950 font-black mb-8">Xác thực Trưởng tộc</h3>
             <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-4 border-red-100 rounded-2xl px-6 py-4 text-center text-3xl font-black mb-6" placeholder="••••" autoFocus />
             <button onClick={handleLogin} className="w-full bg-red-950 text-gold font-black py-4 rounded-2xl text-xl">Đăng nhập</button>
             <button onClick={() => setShowLogin(false)} className="mt-4 text-gray-400 font-bold uppercase text-xs">Quay lại</button>
          </div>
        </div>
      )}

      {/* Member Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-6 backdrop-blur-md overflow-y-auto">
          <div className="bg-white p-12 rounded-[3rem] w-full max-w-2xl border-4 border-red-900/10">
             <h3 className="text-3xl font-traditional font-black mb-8 text-red-950">Chỉnh sửa Thành viên</h3>
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Họ và tên</label>
                    <input type="text" value={editingMember.name} onChange={(e) => setEditingMember({...editingMember, name: e.target.value})} className="w-full border-2 p-4 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Phối ngẫu</label>
                    <input type="text" value={editingMember.spouseName || ''} onChange={(e) => setEditingMember({...editingMember, spouseName: e.target.value})} className="w-full border-2 p-4 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase">Năm sinh - Năm mất</label>
                  <input type="text" value={editingMember.birthDate || ''} onChange={(e) => setEditingMember({...editingMember, birthDate: e.target.value})} className="w-full border-2 p-4 rounded-xl" placeholder="VD: 1945 - 2024" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase">Tiểu sử chi tiết</label>
                  <textarea value={editingMember.bio || ''} onChange={(e) => setEditingMember({...editingMember, bio: e.target.value})} className="w-full border-2 p-4 rounded-xl h-32" />
                </div>
             </div>
             <div className="flex gap-4 mt-8">
                <button onClick={() => {
                   const updateNode = (node: FamilyMember): FamilyMember => {
                      if (node.id === editingMember.id) return editingMember;
                      if (node.children) return { ...node, children: node.children.map(updateNode) };
                      return node;
                   };
                   updateData({ familyTree: updateNode(appData.familyTree) });
                   setEditingMember(null);
                   showToast("Đã lưu thông tin tạm thời. Nhớ 'Xuất bản' để mọi người cùng thấy.", "info");
                }} className="flex-1 bg-red-900 text-white py-4 rounded-xl font-black">Lưu thay đổi</button>
                <button onClick={() => setEditingMember(null)} className="flex-1 bg-gray-100 text-gray-400 py-4 rounded-xl font-black">Hủy</button>
             </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-40 py-24 bg-red-950 text-yellow-100 border-t-8 border-gold text-center">
         <h4 className="text-4xl font-traditional text-gold font-black mb-4">{appData.clanName}</h4>
         <p className="text-xl italic opacity-80 mb-12">"{appData.address}"</p>
         {!isAdmin && (
           <button onClick={() => setShowLogin(true)} className="bg-white/5 border border-gold/30 px-8 py-3 rounded-full text-gold text-xs font-black uppercase tracking-widest hover:bg-gold hover:text-red-900 transition-all">
             Đăng nhập Quản trị
           </button>
         )}
         <p className="mt-12 text-[10px] opacity-30 tracking-[0.5em] uppercase">Gìn giữ cội nguồn - Phát huy truyền thống</p>
      </footer>
    </div>
  );
};

export default App;
