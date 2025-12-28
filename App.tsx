
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppSection, FamilyMember, NewsItem, EventItem, AppData, Spouse } from './types';
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
  // Thay đổi mặc định khi mở web sẽ vào SỰ KIỆN
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
      events: [{ id: 'e1', title: 'Họp Mặt Đầu Xuân', solarDate: '2025-02-15', type: 'họp mặt' }],
      bannerUrl: "https://images.unsplash.com/photo-1577908581023-95245842c8d2?auto=format&fit=crop&q=80&w=2000",
      address: CLAN_ADDRESS,
      historyText: "Lịch sử dòng họ Lê là một hành trình dài của sự hiếu học, đoàn kết và cống hiến. Khởi nguồn từ vùng đất linh thiêng, con cháu họ Lê đã không ngừng nỗ lực, đóng góp công sức vào sự nghiệp xây dựng và bảo vệ tổ quốc qua nhiều thế hệ.",
      ancestralHouseText: "Từ đường là nơi thiêng liêng thiêng liêng, lưu giữ linh hồn tổ tiên qua bao thế hệ.\n\nĐây không chỉ là công trình kiến trúc tâm linh mà còn là nơi lưu giữ những giá trị văn hóa, truyền thống tốt đẹp của cha ông. Mỗi dịp lễ tết, con cháu lại tề tựu đông đủ để thắp nén tâm nhang, tỏ lòng hiếu kính và cầu mong tổ tiên phù hộ độ trì cho dòng họ mãi mãi hưng thịnh.",
      regulations: [
        "Tôn thờ tổ tiên, giữ gìn nếp nhà, phát huy truyền thống tốt đẹp của dòng họ.",
        "Đoàn kết, thương yêu, giúp đỡ lẫn nhau trong cuộc sống và công việc.",
        "Chăm lo học tập, rèn luyện đạo đức, phấn đấu trở thành người có ích cho gia đình và xã hội.",
        "Tham gia đầy đủ các buổi họp họ, đại lễ chạp họ và đóng góp quỹ khuyến học, quỹ từ đường.",
        "Nghiêm túc thực hiện các nghi lễ thờ cúng tổ tiên đúng theo phong tục tập quán."
      ],
      clanName: CLAN_NAME,
      lastUpdated: new Date().toISOString(),
      theme: 'tet'
    };
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleSync = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    const cloudData = await PersistenceService.fetchFromCloud(cloudLink);
    if (cloudData) { 
      setAppData(cloudData); 
      if (!silent) showToast("Đã cập nhật dữ liệu mới nhất từ hệ thống!");
    } else {
      if (!silent) showToast("Không thể kết nối máy chủ dữ liệu.", "error");
    }
    if (!silent) setIsSyncing(false);
  }, [cloudLink, showToast]);

  useEffect(() => {
    handleSync(true);
  }, [handleSync]);

  const derivedGioEvents = useMemo(() => {
    const gioList: EventItem[] = [];
    const traverse = (member: FamilyMember) => {
      if (member.lunarDeathDate || member.deathDate) {
        gioList.push({ id: `gio-${member.id}`, title: `Giỗ cụ ${member.name}`, solarDate: '', lunarDateLabel: member.lunarDeathDate || member.deathDate, type: 'giỗ' });
      }
      const spouses = member.spouses || (member.spouseName ? [{ id: 'legacy', name: member.spouseName, deathDate: member.spouseDeathDate }] : []);
      spouses.forEach((s, idx) => {
        if (s.deathDate) {
          gioList.push({ id: `gio-s-${member.id}-${idx}`, title: `Giỗ cụ bà (Vợ ${idx + 1} cụ ${member.name})`, solarDate: '', lunarDateLabel: s.deathDate, type: 'giỗ' });
        }
      });
      member.children?.forEach(traverse);
    };
    traverse(appData.familyTree);
    return gioList;
  }, [appData.familyTree]);

  const allEvents = useMemo(() => [...appData.events, ...derivedGioEvents], [appData.events, derivedGioEvents]);

  useEffect(() => { document.body.className = appData.theme === 'classic' ? 'theme-classic' : ''; }, [appData.theme]);
  useEffect(() => { PersistenceService.saveLocal(appData); }, [appData]);

  const updateData = (updates: Partial<AppData>) => {
    setAppData(prev => ({ ...prev, ...updates, lastUpdated: new Date().toISOString() }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') { setIsAdmin(true); setShowLogin(false); setPassword(''); showToast("Chế độ Quản trị đã mở"); }
    else showToast("Sai mật khẩu!", "error");
  };

  const deleteMember = (id: string) => {
    if (id === appData.familyTree.id) {
      showToast("Không thể xoá Cụ Tổ!", "error");
      return;
    }
    const removeRecursive = (node: FamilyMember): FamilyMember => {
      if (!node.children) return node;
      return {
        ...node,
        children: node.children
          .filter(child => child.id !== id)
          .map(removeRecursive)
      };
    };
    const newTree = removeRecursive(appData.familyTree);
    updateData({ familyTree: newTree });
    showToast("Đã xoá thành viên khỏi phả hệ");
  };

  const updateMemberInTree = (updatedMember: FamilyMember) => {
    const updateRecursive = (node: FamilyMember): FamilyMember => {
      if (node.id === updatedMember.id) return updatedMember;
      if (!node.children) return node;
      return {
        ...node,
        children: node.children.map(updateRecursive)
      };
    };
    updateData({ familyTree: updateRecursive(appData.familyTree) });
  };

  const addChildToMember = (parentId: string) => {
    const newChild: FamilyMember = {
      id: `m-${Date.now()}`,
      name: 'Thành viên mới',
      generation: 0,
      isMale: true,
      children: []
    };
    const addRecursive = (node: FamilyMember): FamilyMember => {
      if (node.id === parentId) {
        newChild.generation = node.generation + 1;
        return {
          ...node,
          children: [...(node.children || []), newChild]
        };
      }
      if (!node.children) return node;
      return {
        ...node,
        children: node.children.map(addRecursive)
      };
    };
    const newTree = addRecursive(appData.familyTree);
    updateData({ familyTree: newTree });
    setEditingMember(newChild);
  };

  const renderSection = () => {
    switch (activeSection) {
      case AppSection.TREE:
        return <FamilyTree 
          root={appData.familyTree} 
          isAdmin={isAdmin} 
          onEditMember={(m) => {
            const memberToEdit = {...m};
            if (!memberToEdit.spouses || memberToEdit.spouses.length === 0) {
               if (memberToEdit.spouseName) {
                 memberToEdit.spouses = [{ id: 'legacy-' + m.id, name: memberToEdit.spouseName, deathDate: memberToEdit.spouseDeathDate }];
               } else {
                 memberToEdit.spouses = [];
               }
            }
            setEditingMember(memberToEdit);
          }} 
          onDeleteMember={deleteMember}
          onAddChild={(p) => addChildToMember(p.id)} 
        />;
      case AppSection.EVENTS: return <Events events={allEvents} isAdmin={isAdmin} onAddEvent={(e) => updateData({ events: [...appData.events, e] })} onDeleteEvent={(id) => updateData({ events: appData.events.filter(ev => ev.id !== id) })} />;
      case AppSection.NEWS:
        return (
          <div className="animate-fadeIn space-y-12 px-4 md:px-0">
            <h2 className="text-4xl md:text-5xl font-traditional text-primary font-bold text-center">Tin Tức Dòng Họ</h2>
            {isAdmin && (
              <div className="flex justify-center"><button onClick={() => setEditingNews({ id: Date.now().toString(), title: '', date: new Date().toLocaleDateString('vi-VN'), summary: '', content: '' })} className="bg-primary text-white px-10 py-4 rounded-full font-black shadow-xl hover:scale-105 transition-transform">Soạn tin mới</button></div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {appData.news.map((item) => (
                <div key={item.id} className="bg-white rounded-3xl shadow-lg overflow-hidden group border border-red-900/5 hover:shadow-2xl transition-all">
                  <div className="h-64 bg-gray-100 relative">
                    <img src={item.imageUrl || 'https://picsum.photos/seed/clan/800/400'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.title} />
                    {isAdmin && (
                      <div className="absolute top-4 right-4 flex gap-2"><button onClick={() => setEditingNews(item)} className="bg-white/95 p-2 rounded-full shadow-lg">✏️</button><button onClick={() => setNewsToDelete(item)} className="bg-white/95 p-2 rounded-full shadow-lg text-red-600">🗑️</button></div>
                    )}
                  </div>
                  <div className="p-8">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{item.date}</span>
                    <h3 className="text-2xl font-traditional font-bold mt-2 mb-4 group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-gray-600 text-sm mb-6 line-clamp-3">{item.summary}</p>
                    <button className="text-[10px] font-black uppercase text-primary tracking-widest border-b-2 border-primary/20 pb-1">Xem chi tiết</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case AppSection.CHRONICLES:
        return (
          <div className="max-w-4xl mx-auto animate-fadeIn px-4">
            <div className="paper-texture p-6 md:p-20 shadow-2xl rounded-sm border-[6px] md:border-[12px] border-double border-red-900/10 relative">
              <div className="flex justify-between items-center mb-10 border-b-4 border-red-900/5 pb-8">
                <h2 className="text-3xl md:text-5xl font-traditional italic font-black">Phả Kỹ</h2>
                {isAdmin && <button onClick={() => setIsEditingText(!isEditingText)} className="bg-primary text-gold px-8 py-2 rounded-full text-xs font-black uppercase">{isEditingText ? "Xong" : "Sửa"}</button>}
              </div>
              {isEditingText ? <textarea value={appData.historyText} onChange={(e) => updateData({ historyText: e.target.value })} className="w-full h-96 p-6 border-4 border-gold/10 bg-transparent font-traditional text-lg leading-relaxed focus:border-gold outline-none" /> : <div className="drop-cap whitespace-pre-wrap leading-relaxed text-gray-800 font-traditional text-lg md:text-xl text-justify">{appData.historyText}</div>}
            </div>
          </div>
        );
      case AppSection.ANCESTRAL_HOUSE:
        return (
          <div className="max-w-4xl mx-auto animate-fadeIn px-4">
            <div className="bg-white p-6 md:p-20 shadow-2xl rounded-[2rem] md:rounded-[3rem] border border-red-900/5 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gold via-red-900 to-gold opacity-50"></div>
               <h2 className="text-3xl md:text-5xl font-traditional text-primary font-bold mb-10 text-center">Từ Đường Dòng Họ</h2>
               
               {/* Câu trích dẫn theo font Phả Kỹ (Playfair Display) */}
               <p className="font-traditional italic text-2xl md:text-4xl text-red-800 text-center mb-12 px-4 leading-snug font-bold">
                 "Từ đường là nơi thiêng liêng thiêng liêng, lưu giữ linh hồn tổ tiên qua bao thế hệ."
               </p>

               <div className="prose prose-red max-w-none text-gray-700 leading-relaxed font-serif text-lg text-justify whitespace-pre-wrap">
                 {appData.ancestralHouseText.replace("Từ đường là nơi thiêng liêng thiêng liêng, lưu giữ linh hồn tổ tiên qua bao thế hệ.", "").trim()}
               </div>
            </div>
          </div>
        );
      case AppSection.REGULATIONS:
        return (
          <div className="max-w-4xl mx-auto animate-fadeIn px-4">
             <div className="bg-red-900 p-1 rounded-t-[2rem] md:rounded-t-[3rem]">
               <div className="bg-white p-6 md:p-20 shadow-2xl rounded-t-[1.5rem] md:rounded-t-[2.5rem]">
                  <h2 className="text-3xl md:text-4xl font-traditional text-primary font-black mb-12 text-center uppercase tracking-widest">Tộc Ước & Quy Định</h2>
                  <div className="space-y-8">
                    {appData.regulations.map((reg, i) => (
                      <div key={i} className="flex gap-4 md:gap-6 items-start group">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-red-50 text-red-900 flex items-center justify-center font-black flex-shrink-0 group-hover:bg-red-900 group-hover:text-gold transition-all border border-red-100 shadow-sm">
                          {i + 1}
                        </div>
                        <p className="text-gray-800 font-medium text-base md:text-lg pt-2 leading-snug">{reg}</p>
                      </div>
                    ))}
                  </div>
               </div>
             </div>
          </div>
        );
      default: return <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest">Đang phát triển...</div>;
    }
  };

  return (
    <div className="min-h-screen pb-32">
      {isAdmin && (
        <AdminPanel cloudLink={cloudLink} theme={appData.theme || 'tet'} onCloudLinkChange={(l) => { setCloudLink(l); localStorage.setItem('cloud_data_link', l); }} onThemeChange={(t) => updateData({ theme: t })} onExport={() => { navigator.clipboard.writeText(JSON.stringify(appData, null, 2)); showToast("Đã sao chép JSON!"); }} onLogout={() => setIsAdmin(false)} />
      )}
      
      <div className="bg-primary text-gold text-[10px] py-1.5 text-center font-black tracking-[0.4em] uppercase border-b border-gold/20">Gia Phả Trực Tuyến - {appData.clanName}</div>
      <header className="relative w-full h-[250px] md:h-[450px] flex items-center justify-center bg-black overflow-hidden shadow-2xl">
        <img src={appData.bannerUrl} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="Banner" />
        <div className="absolute bottom-4 right-4 flex gap-2 z-30">
           {isAdmin && <button onClick={() => setShowBannerEdit(true)} className="bg-white/90 text-red-950 px-4 py-2 rounded-full font-black text-xs uppercase shadow-xl hover:bg-white">🖼️ Đổi ảnh</button>}
           <button onClick={() => handleSync()} disabled={isSyncing} className="bg-gold/90 text-red-950 px-4 py-2 rounded-full font-black text-xs uppercase shadow-xl hover:bg-white">{isSyncing ? "⌛ Tải..." : "🔄 Đồng bộ"}</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 mt-[-40px] relative z-20">
        <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="mt-10 md:mt-20">{renderSection()}</main>
      </div>

      {editingMember && (
        <div className="fixed inset-0 bg-black/95 z-[500] flex items-center justify-center p-4 md:p-8 overflow-y-auto backdrop-blur-md animate-fadeIn">
          <div className="bg-white p-6 md:p-12 rounded-[2.5rem] w-full max-w-6xl shadow-2xl border-4 border-red-900/10 relative">
            <button onClick={() => setEditingMember(null)} className="absolute top-6 right-6 text-gray-400 hover:text-red-600 text-3xl transition-colors">×</button>
            <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-red-50 pb-8 mb-8 gap-6">
              <div>
                <h3 className="text-4xl font-traditional font-black text-red-950">Phả Bản: {editingMember.name || 'Thành viên mới'}</h3>
                <p className="text-primary font-black uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
                  <span className="bg-red-900 text-gold px-3 py-1 rounded-full">Đời thứ {editingMember.generation}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500 italic">Mã định danh: {editingMember.id}</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4 space-y-8 border-r-2 border-red-50 pr-8">
                <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-red-950 flex items-center gap-3">1. Nhân thân</h4>
                <div className="space-y-6">
                  <input type="text" value={editingMember.name} onChange={(e) => setEditingMember({...editingMember, name: e.target.value})} className="w-full bg-red-50/30 border-2 border-red-100 p-4 rounded-2xl font-bold text-xl" placeholder="Họ tên" />
                  <textarea value={editingMember.bio || ''} onChange={(e) => setEditingMember({...editingMember, bio: e.target.value})} className="w-full bg-red-50/30 border-2 border-red-100 p-4 rounded-2xl h-32" placeholder="Tiểu sử" />
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 mt-16 pt-10 border-t-4 border-red-50">
              <button onClick={() => { updateMemberInTree(editingMember); setEditingMember(null); showToast("Đã cập nhật"); }} className="bg-red-950 text-gold px-16 py-6 rounded-[2rem] font-black uppercase shadow-2xl flex-1">Cập nhật</button>
              <button onClick={() => setEditingMember(null)} className="bg-gray-100 text-gray-400 px-12 py-6 rounded-[2rem] font-black uppercase flex-1">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-8 backdrop-blur-md animate-fadeIn">
           <div className="bg-white p-12 rounded-[3rem] border-8 border-gray-900 w-full max-w-md text-center shadow-2xl">
              <h3 className="text-4xl font-traditional font-black text-gray-900 mb-8">Admin Access</h3>
              <form onSubmit={handleLogin} className="space-y-6">
                 <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-4 border-gray-100 rounded-2xl p-5 text-center text-3xl font-black outline-none focus:border-primary" placeholder="••••" />
                 <button type="submit" className="w-full bg-primary text-gold py-5 rounded-2xl font-black uppercase text-sm tracking-widest">Kích hoạt quản trị</button>
              </form>
           </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-10 right-10 z-[1000] px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl animate-fadeIn flex items-center gap-4 border-4 ${toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`}>
          {toast.message}
        </div>
      )}

      <footer className="mt-40 bg-primary py-32 text-center border-t-8 border-gold relative overflow-hidden">
         <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/oriental-tiles.png')] scale-150"></div>
         <h4 className="text-6xl font-traditional text-gold font-black uppercase mb-8 relative z-10">{appData.clanName}</h4>
         
         {/* Câu trích dẫn theo font Phả Kỹ (Playfair Display) */}
         <p className="font-traditional italic text-yellow-100 text-3xl md:text-5xl relative z-10 mb-12 px-6 drop-shadow-lg font-bold">
           "Cây có gốc, nước có nguồn. Người có tổ, có giai điệu mới có ngày hôm nay."
         </p>

         <div className="w-24 h-1 bg-gold mx-auto mb-12 opacity-30"></div>
         {!isAdmin && <button onClick={() => setShowLogin(true)} className="relative z-10 text-gold/30 text-[10px] font-black uppercase tracking-[0.6em] hover:text-gold transition-colors">🔒 Quản trị dòng họ</button>}
      </footer>
    </div>
  );
};

export default App;
