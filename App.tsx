
import React, { useState, useEffect, useMemo } from 'react';
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
  // Mặc định vào mục SỰ KIỆN khi truy cập
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
      historyText: "Lịch sử dòng họ Lê là một hành trình dài...",
      ancestralHouseText: "Từ đường là nơi thờ tự linh thiêng...",
      regulations: ["Tôn thờ tổ tiên...", "Đoàn kết..."],
      clanName: CLAN_NAME,
      lastUpdated: new Date().toISOString(),
      theme: 'tet'
    };
  });

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

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const cloudData = await PersistenceService.fetchFromCloud(cloudLink);
    if (cloudData) { setAppData(cloudData); showToast("Đồng bộ thành công!"); }
    setIsSyncing(false);
  };

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
            if (memberToEdit.spouseName && (!memberToEdit.spouses || memberToEdit.spouses.length === 0)) {
               memberToEdit.spouses = [{ id: 'legacy-' + m.id, name: memberToEdit.spouseName, deathDate: memberToEdit.spouseDeathDate }];
            }
            setEditingMember(memberToEdit);
          }} 
          onDeleteMember={deleteMember}
          onAddChild={(p) => addChildToMember(p.id)} 
        />;
      case AppSection.EVENTS:
        return <Events events={allEvents} isAdmin={isAdmin} onAddEvent={(e) => updateData({ events: [...appData.events, e] })} onDeleteEvent={(id) => updateData({ events: appData.events.filter(ev => ev.id !== id) })} />;
      case AppSection.NEWS:
        return (
          <div className="animate-fadeIn space-y-12">
            <h2 className="text-5xl font-traditional text-primary font-bold text-center">Tin Tức Dòng Họ</h2>
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
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="paper-texture p-10 md:p-20 shadow-2xl rounded-sm border-[12px] border-double border-red-900/10 relative">
              <div className="flex justify-between items-center mb-10 border-b-4 border-red-900/5 pb-8">
                <h2 className="text-5xl font-traditional italic font-black">Phả Kỹ</h2>
                {isAdmin && <button onClick={() => setIsEditingText(!isEditingText)} className="bg-primary text-gold px-8 py-2 rounded-full text-xs font-black uppercase">{isEditingText ? "Xong" : "Sửa"}</button>}
              </div>
              {isEditingText ? <textarea value={appData.historyText} onChange={(e) => updateData({ historyText: e.target.value })} className="w-full h-96 p-6 border-4 border-gold/10 bg-transparent font-traditional text-lg leading-relaxed focus:border-gold outline-none" /> : <div className="drop-cap whitespace-pre-wrap leading-relaxed text-gray-800 font-traditional text-xl">{appData.historyText}</div>}
            </div>
          </div>
        );
      case AppSection.ANCESTRAL_HOUSE:
        return (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="bg-white p-10 md:p-20 shadow-2xl rounded-[3rem] border border-red-900/5">
               <h2 className="text-5xl font-traditional text-primary font-bold mb-10 text-center">Từ Đường Dòng Họ</h2>
               <div className="prose prose-red max-w-none text-gray-700 leading-relaxed font-serif text-lg">
                 {appData.ancestralHouseText}
               </div>
            </div>
          </div>
        );
      case AppSection.REGULATIONS:
        return (
          <div className="max-w-4xl mx-auto animate-fadeIn">
             <div className="bg-red-900 p-1 rounded-t-[3rem]">
               <div className="bg-white p-10 md:p-20 shadow-2xl rounded-t-[2.5rem]">
                  <h2 className="text-4xl font-traditional text-primary font-black mb-12 text-center uppercase tracking-widest">Tộc Ước & Quy Định</h2>
                  <div className="space-y-6">
                    {appData.regulations.map((reg, i) => (
                      <div key={i} className="flex gap-6 items-start group">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-900 flex items-center justify-center font-black flex-shrink-0 group-hover:bg-red-900 group-hover:text-gold transition-all">
                          {i + 1}
                        </div>
                        <p className="text-gray-800 font-medium text-lg pt-2">{reg}</p>
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
        {/* Đã xóa tiêu đề và khẩu hiệu đè lên ảnh theo yêu cầu */}
        <div className="absolute bottom-4 right-4 flex gap-2 z-30">
           {isAdmin && <button onClick={() => setShowBannerEdit(true)} className="bg-white/90 text-red-950 px-4 py-2 rounded-full font-black text-xs uppercase shadow-xl hover:bg-white">🖼️ Đổi ảnh</button>}
           <button onClick={handleSync} disabled={isSyncing} className="bg-gold/90 text-red-950 px-4 py-2 rounded-full font-black text-xs uppercase shadow-xl hover:bg-white">{isSyncing ? "⌛ Tải..." : "🔄 Đồng bộ"}</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 mt-[-40px] relative z-20">
        <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="mt-10 md:mt-20">{renderSection()}</main>
      </div>

      {editingMember && (
        <div className="fixed inset-0 bg-black/95 z-[500] flex items-center justify-center p-4 md:p-8 overflow-y-auto backdrop-blur-md animate-fadeIn">
          <div className="bg-white p-6 md:p-12 rounded-[2.5rem] w-full max-w-5xl shadow-2xl border-4 border-gold/20 relative">
            <button onClick={() => setEditingMember(null)} className="absolute top-6 right-6 text-gray-400 hover:text-red-600 text-3xl transition-colors">×</button>
            <div className="flex flex-col md:flex-row justify-between items-start border-b pb-8 mb-8 gap-6">
              <div>
                <h3 className="text-3xl font-traditional font-black text-gray-900">Thông tin: {editingMember.name || 'Thành viên mới'}</h3>
                <p className="text-primary font-black uppercase text-[10px] tracking-widest mt-1">Thế hệ thứ {editingMember.generation}</p>
              </div>
              <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                <button onClick={() => setEditingMember({...editingMember, isMale: true})} className={`px-8 py-3 rounded-xl text-xs font-black uppercase transition-all ${editingMember.isMale ? 'bg-primary text-white shadow-xl scale-105' : 'text-gray-400'}`}>Nam</button>
                <button onClick={() => setEditingMember({...editingMember, isMale: false})} className={`px-8 py-3 rounded-xl text-xs font-black uppercase transition-all ${!editingMember.isMale ? 'bg-pink-600 text-white shadow-xl scale-105' : 'text-gray-400'}`}>Nữ</button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="space-y-8">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span> 1. Thông tin cá nhân
                </h4>
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-1">Họ và tên</label>
                    <input type="text" value={editingMember.name} onChange={(e) => setEditingMember({...editingMember, name: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl focus:border-gold outline-none font-bold text-lg" placeholder="Ví dụ: Lê Văn A" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-1">Năm sinh</label>
                      <input type="text" value={editingMember.birthDate || ''} onChange={(e) => setEditingMember({...editingMember, birthDate: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl font-bold" placeholder="19xx" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-1">Ngày mất (ÂL)</label>
                      <input type="text" value={editingMember.lunarDeathDate || editingMember.deathDate || ''} onChange={(e) => setEditingMember({...editingMember, lunarDeathDate: e.target.value, deathDate: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl font-bold text-red-900" placeholder="15/1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-1">Tiểu sử ngắn</label>
                    <textarea value={editingMember.bio || ''} onChange={(e) => setEditingMember({...editingMember, bio: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl font-medium h-24" placeholder="Thông tin thêm..." />
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                   <h4 className="text-[11px] font-black uppercase tracking-widest text-pink-700 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-pink-600"></span> 2. Vợ / Chồng
                   </h4>
                   <button onClick={() => setEditingMember({...editingMember, spouses: [...(editingMember.spouses || []), { id: `s-${Date.now()}`, name: '' }]})} className="bg-pink-100 text-pink-700 w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-pink-600 hover:text-white transition-all shadow-sm">+</button>
                </div>
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-hide">
                  {(editingMember.spouses || []).map((s, idx) => (
                    <div key={s.id} className="p-5 bg-pink-50/50 border-2 border-pink-100/50 rounded-2xl relative group">
                      <button onClick={() => setEditingMember({...editingMember, spouses: editingMember.spouses?.filter(sp => sp.id !== s.id)})} className="absolute -top-3 -right-3 bg-red-100 text-red-600 w-7 h-7 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-all shadow-md">×</button>
                      <div className="space-y-4">
                        <input type="text" value={s.name} onChange={(e) => {
                            const newSpouses = [...(editingMember.spouses || [])];
                            newSpouses[idx].name = e.target.value;
                            setEditingMember({...editingMember, spouses: newSpouses});
                          }} className="w-full bg-white border-b-2 border-pink-200 p-2 outline-none font-bold text-pink-950" placeholder="Họ tên vợ/chồng..." />
                        <div className="flex gap-2 items-center">
                          <span className="text-[8px] font-black uppercase text-pink-300">Giỗ ÂL:</span>
                          <input type="text" value={s.deathDate || ''} onChange={(e) => {
                              const newSpouses = [...(editingMember.spouses || [])];
                              newSpouses[idx].deathDate = e.target.value;
                              setEditingMember({...editingMember, spouses: newSpouses});
                            }} className="flex-1 bg-transparent border-b border-pink-100 p-1 text-xs" placeholder="Ngày..." />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-8">
                 <div className="flex justify-between items-center">
                   <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-600"></span> 3. Con cái
                   </h4>
                   <button onClick={() => addChildToMember(editingMember.id)} className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm">Thêm con</button>
                 </div>
                 <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-hide">
                    {(editingMember.children || []).map((child, idx) => (
                      <div key={child.id} className="p-4 bg-emerald-50/50 border-2 border-emerald-100/30 rounded-2xl flex flex-col gap-3">
                         <div className="flex justify-between items-center">
                            <span className="font-bold text-emerald-950 text-sm truncate max-w-[120px]">{child.name}</span>
                            <button onClick={() => {
                                const newChildren = [...(editingMember.children || [])];
                                newChildren.splice(idx, 1);
                                setEditingMember({...editingMember, children: newChildren});
                              }} className="text-[10px] font-black text-red-400 hover:text-red-600">Xoá</button>
                         </div>
                         <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-black uppercase text-emerald-300 tracking-wider">Là con của bà:</label>
                            <select value={child.otherParentId || ''} onChange={(e) => {
                                const newChildren = [...(editingMember.children || [])];
                                newChildren[idx] = {...newChildren[idx], otherParentId: e.target.value};
                                setEditingMember({...editingMember, children: newChildren});
                              }} className="w-full bg-white border border-emerald-100 p-2 rounded-xl text-xs font-bold text-emerald-900 outline-none">
                               <option value="">-- Không xác định --</option>
                               {(editingMember.spouses || []).map(s => (
                                 <option key={s.id} value={s.id}>{s.name || 'Vợ chưa đặt tên'}</option>
                               ))}
                            </select>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mt-16 pt-10 border-t-4 border-gray-50">
              <button onClick={() => { updateMemberInTree(editingMember); setEditingMember(null); showToast("Đã cập nhật gia phả"); }} className="bg-primary text-gold px-12 py-5 rounded-2xl font-black uppercase shadow-2xl flex-1 hover:brightness-110 active:scale-95 transition-all text-sm tracking-widest">Lưu thay đổi</button>
              <button onClick={() => setEditingMember(null)} className="bg-gray-100 text-gray-500 px-12 py-5 rounded-2xl font-black uppercase flex-1 hover:bg-gray-200 transition-all text-sm tracking-widest">Hủy & Đóng</button>
            </div>
          </div>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-8 backdrop-blur-md animate-fadeIn">
           <div className="bg-white p-12 rounded-[3rem] border-8 border-gray-900 w-full max-w-md text-center shadow-2xl">
              <h3 className="text-4xl font-traditional font-black text-gray-900 mb-8">Admin Access</h3>
              <form onSubmit={handleLogin} className="space-y-6">
                 <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-4 border-gray-100 rounded-2xl p-5 text-center text-3xl font-black outline-none focus:border-primary transition-all" placeholder="••••" />
                 <button type="submit" className="w-full bg-primary text-gold py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl">Kích hoạt quản trị</button>
                 <button type="button" onClick={() => setShowLogin(false)} className="text-gray-400 text-[10px] font-black uppercase mt-6 block mx-auto tracking-widest hover:text-primary transition-colors">Hủy bỏ</button>
              </form>
           </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-10 right-10 z-[1000] px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-fadeIn flex items-center gap-4 border-4 ${toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`}>
          <span className="text-lg">{toast.type === 'error' ? '❌' : '✅'}</span> {toast.message}
        </div>
      )}

      <footer className="mt-40 bg-primary py-32 text-center border-t-8 border-gold relative overflow-hidden">
         <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/oriental-tiles.png')] scale-150"></div>
         <h4 className="text-6xl font-traditional text-gold font-black uppercase mb-8 relative z-10">{appData.clanName}</h4>
         <p className="text-yellow-100 font-serif italic text-2xl relative z-10 mb-12">"Cây có cội, nước có nguồn. Người có tổ, có tông mới có ngày hôm nay."</p>
         <div className="w-24 h-1 bg-gold mx-auto mb-12 opacity-30"></div>
         {!isAdmin && <button onClick={() => setShowLogin(true)} className="relative z-10 text-gold/30 text-[10px] font-black uppercase tracking-[0.6em] hover:text-gold transition-colors">🔒 Quản trị dòng họ</button>}
      </footer>
    </div>
  );
};

export default App;
