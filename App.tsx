
import React, { useState, useEffect, useRef } from 'react';
import { AppSection, FamilyMember, NewsItem, EventItem, AppData } from './types';
import Navigation from './components/Navigation';
import FamilyTree from './components/FamilyTree';
import Events from './components/Events';
import { generateClanHistory } from './services/geminiService';
import { 
  CLAN_NAME, CLAN_ADDRESS, SAMPLE_NEWS, SAMPLE_FAMILY_TREE 
} from './constants';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.TREE);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- Khởi tạo dữ liệu an toàn ---
  const [appData, setAppData] = useState<AppData>(() => {
    try {
      const saved = localStorage.getItem('giapha_le_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Dữ liệu lưu trữ không hợp lệ, đang dùng dữ liệu mẫu.");
    }
    
    return {
      news: SAMPLE_NEWS,
      familyTree: SAMPLE_FAMILY_TREE,
      events: [
        { id: '1', title: 'Giỗ Tổ Dòng Họ', solarDate: '2025-04-10', type: 'giỗ' },
        { id: '2', title: 'Họp Mặt Đầu Xuân', solarDate: '2025-02-15', type: 'họp mặt' }
      ],
      bannerUrl: "https://images.unsplash.com/photo-1577908581023-95245842c8d2?auto=format&fit=crop&q=80&w=2000",
      address: CLAN_ADDRESS,
      historyText: "Lịch sử dòng họ Lê là một hành trình dài của sự hiếu học, đoàn kết và cống hiến. Khởi nguồn từ vùng đất linh thiêng, con cháu họ Lê đã không ngừng nỗ lực, đóng góp công sức vào sự nghiệp xây dựng và bảo vệ tổ quốc qua nhiều thế hệ.",
      ancestralHouseText: "Từ đường là nơi thờ tự linh thiêng, nơi lưu giữ hồn cốt của tổ tiên qua bao thế hệ. Ngôi từ đường được xây dựng trang nghiêm với kiến trúc truyền thống, là điểm tựa tâm linh và nơi hội tụ của con cháu mỗi dịp Tết đến xuân về.",
      regulations: [
        "Tôn thờ tổ tiên, hiếu thảo với cha mẹ, giữ gìn đạo đức lối sống lành mạnh.",
        "Đoàn kết, tương trợ giữa các thành viên trong dòng họ, giúp đỡ nhau lúc khó khăn.",
        "Khuyến khích và hỗ trợ việc học tập, thành tài của con cháu thế hệ trẻ.",
        "Giữ gìn và tôn tạo các di sản, từ đường và phần mộ của tổ tiên.",
        "Tổ chức trang trọng các ngày lễ giỗ, Tết và đại hội dòng họ hàng năm."
      ],
      clanName: CLAN_NAME,
      lastUpdated: new Date().toISOString()
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('giapha_le_data', JSON.stringify(appData));
    } catch (e) {
      console.error("Không thể lưu dữ liệu vào localStorage", e);
    }
  }, [appData]);

  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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

  const handleLogout = () => {
    setIsAdmin(false);
    setIsEditingText(false);
    showToast("Đã thoát chế độ Quản trị", "info");
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GiaPha_Le_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast("Đã tải xuống file lưu trữ an toàn!");
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.familyTree && data.clanName) {
          setAppData(data);
          showToast("Khôi phục dữ liệu thành công!", "success");
        } else {
          showToast("File dữ liệu không đúng cấu trúc!", "error");
        }
      } catch (err) {
        showToast("Lỗi khi đọc file!", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleAIGenerate = async () => {
    setAiLoading(true);
    const content = await generateClanHistory(appData.clanName, appData.address);
    updateData({ historyText: content });
    setAiLoading(false);
    showToast("Đã hoàn thành Phả kỹ bằng AI", "success");
  };

  const saveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    const updateNode = (node: FamilyMember): FamilyMember => {
      if (node.id === editingMember.id) return editingMember;
      if (node.children) return { ...node, children: node.children.map(updateNode) };
      return node;
    };
    updateData({ familyTree: updateNode(appData.familyTree) });
    setEditingMember(null);
    showToast("Đã lưu thông tin thành viên");
  };

  const addChild = (parent: FamilyMember) => {
    const newChild: FamilyMember = {
      id: `m-${Date.now()}`,
      name: 'Thành viên mới',
      generation: parent.generation + 1,
      isMale: true,
      parentName: parent.name
    };
    const addNode = (node: FamilyMember): FamilyMember => {
      if (node.id === parent.id) return { ...node, children: [...(node.children || []), newChild] };
      if (node.children) return { ...node, children: node.children.map(addNode) };
      return node;
    };
    updateData({ familyTree: addNode(appData.familyTree) });
    setEditingMember(newChild);
  };

  const renderSection = () => {
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
                  <span className="text-xl">✍️</span> Soạn tin mới
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
                    <button className="text-red-800 font-bold hover:gap-4 transition-all flex items-center gap-2 group/btn">
                      Xem chi tiết <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case AppSection.TREE:
        return <FamilyTree root={appData.familyTree} isAdmin={isAdmin} onEditMember={setEditingMember} onAddChild={addChild} />;
      case AppSection.CHRONICLES:
        return (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="paper-texture p-12 md:p-20 shadow-2xl rounded-sm border-[24px] border-double border-red-900/10 relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <span className="text-[200px]">📜</span>
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-center border-b-4 border-red-900/5 pb-10 mb-12">
                  <h2 className="text-5xl font-traditional text-red-950 italic m-0 font-black">Phả Kỹ Gia Tộc</h2>
                  {isAdmin && (
                    <div className="flex gap-4">
                      <button onClick={handleAIGenerate} disabled={aiLoading} className="bg-gold text-red-950 px-6 py-2 rounded-full font-bold shadow-lg hover:bg-yellow-400 disabled:opacity-50">
                        {aiLoading ? "Đang soạn..." : "AI Soạn thảo"}
                      </button>
                      <button onClick={() => setIsEditingText(!isEditingText)} className={`px-8 py-2 rounded-full font-bold transition-all ${isEditingText ? 'bg-green-700 text-white' : 'bg-red-800 text-white'}`}>
                        {isEditingText ? "Hoàn tất" : "Biên tập"}
                      </button>
                    </div>
                  )}
                </div>
                {isEditingText ? (
                  <textarea value={appData.historyText} onChange={(e) => updateData({ historyText: e.target.value })} className="w-full h-[600px] p-10 border-4 border-double border-red-900/10 bg-transparent font-serif text-xl leading-relaxed outline-none focus:bg-white/30 transition-all" />
                ) : (
                  <div className="whitespace-pre-wrap leading-loose text-gray-800 font-medium text-xl text-justify font-serif drop-shadow-sm indent-12 first-letter:text-7xl first-letter:font-bold first-letter:text-red-900 first-letter:float-left first-letter:mr-3">
                    {appData.historyText}
                  </div>
                )}
                <div className="mt-20 text-center flex items-center justify-center gap-8">
                  <div className="h-px w-20 bg-red-900/20"></div>
                  <span className="text-red-900/40 text-4xl">⚜️</span>
                  <div className="h-px w-20 bg-red-900/20"></div>
                </div>
              </div>
            </div>
          </div>
        );
      case AppSection.ANCESTRAL_HOUSE:
        return (
          <div className="max-w-5xl mx-auto animate-fadeIn space-y-12">
            <div className="bg-white rounded-[3rem] shadow-traditional border-4 border-red-900/5 overflow-hidden">
              <div className="h-[500px] relative group overflow-hidden">
                <img src="https://images.unsplash.com/photo-1598640845355-668b5550dfb0?auto=format&fit=crop&q=80&w=1600" className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-[2s]" />
                <div className="absolute inset-0 bg-gradient-to-t from-red-950 via-transparent to-transparent opacity-90"></div>
                <div className="absolute bottom-0 left-0 p-16 w-full">
                   <h2 className="text-7xl font-traditional text-white m-0 drop-shadow-2xl font-black">Từ Đường Linh Thiêng</h2>
                   <div className="flex items-center gap-4 mt-6">
                      <div className="h-1 w-24 bg-gold"></div>
                      <p className="text-gold font-bold text-2xl tracking-widest">{appData.address}</p>
                   </div>
                </div>
              </div>
              <div className="p-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
                <div className="lg:col-span-2 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-traditional text-red-950 font-bold m-0 flex items-center gap-3">
                      <span className="text-4xl">🏮</span> Giới thiệu Từ đường
                    </h3>
                  </div>
                  {isEditingText ? (
                    <textarea value={appData.ancestralHouseText} onChange={(e) => updateData({ ancestralHouseText: e.target.value })} className="w-full h-80 p-8 border-4 border-double border-red-100 rounded-3xl bg-red-50/20 focus:bg-white transition-all text-xl outline-none" />
                  ) : (
                    <p className="text-gray-700 leading-loose whitespace-pre-wrap text-2xl italic font-medium border-l-12 border-gold/30 pl-12 py-6 bg-red-50/30 rounded-r-3xl">
                      {appData.ancestralHouseText}
                    </p>
                  )}
                  {isAdmin && (
                    <button onClick={() => setIsEditingText(!isEditingText)} className="bg-red-900 text-gold px-10 py-3 rounded-full font-black shadow-lg hover:bg-black transition-all">
                      {isEditingText ? "💾 Lưu thông tin" : "✏️ Chỉnh sửa Từ đường"}
                    </button>
                  )}
                </div>
                <div className="space-y-6">
                   <div className="bg-red-50 p-8 rounded-[2rem] border-2 border-red-100 space-y-6">
                      <h4 className="text-sm font-black text-red-900 uppercase tracking-widest border-b border-red-200 pb-4">Nơi hội tụ con cháu</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          {icon: '🍱', label: 'Chạp Họ'},
                          {icon: '🧧', label: 'Tết Xuân'},
                          {icon: '🏵️', label: 'Thờ Tự'},
                          {icon: '📜', label: 'Họp Họ'}
                        ].map((item, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm text-center transform hover:-translate-y-1 transition-all">
                            <div className="text-3xl mb-1">{item.icon}</div>
                            <div className="text-[10px] font-black text-gray-500 uppercase">{item.label}</div>
                          </div>
                        ))}
                      </div>
                   </div>
                   <div className="relative h-64 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white">
                      <img src="https://picsum.photos/seed/altar/400/600" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                         <span className="text-white font-bold uppercase tracking-widest bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg">Ảnh tư liệu</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        );
      case AppSection.REGULATIONS:
        return (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="bg-[#fffcf0] p-16 md:p-24 shadow-2xl rounded-sm border-[32px] border-double border-red-950 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-48 h-48 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/oriental-tiles.png')]"></div>
               <div className="absolute bottom-0 right-0 w-48 h-48 opacity-10 rotate-180 bg-[url('https://www.transparenttextures.com/patterns/oriental-tiles.png')]"></div>
               
               <div className="relative z-10 text-center space-y-16">
                 <div className="space-y-6">
                   <div className="flex items-center justify-center gap-6 text-red-900">
                      <span className="text-4xl">⚜️</span>
                      <h2 className="text-6xl font-traditional m-0 uppercase tracking-[0.3em] font-black drop-shadow-md">Tộc Ước</h2>
                      <span className="text-4xl">⚜️</span>
                   </div>
                   <p className="text-red-950 font-traditional italic text-3xl font-bold">Gia Tộc Họ Lê Việt Nam</p>
                 </div>

                 {isEditingText ? (
                   <textarea 
                     value={appData.regulations.join('\n')}
                     onChange={(e) => updateData({ regulations: e.target.value.split('\n') })}
                     className="w-full h-[500px] p-12 border-8 border-double border-red-900/20 bg-white/50 font-serif text-2xl leading-relaxed focus:bg-white outline-none transition-all shadow-inner"
                     placeholder="Mỗi dòng là một điều khoản..."
                   />
                 ) : (
                   <div className="space-y-12 text-left max-w-2xl mx-auto">
                     {appData.regulations.filter(r => r.trim()).map((reg, idx) => (
                       <div key={idx} className="flex gap-10 group">
                         <div className="flex-shrink-0 w-20 h-20 rounded-full bg-red-950 text-gold flex items-center justify-center font-traditional text-3xl font-black shadow-2xl border-4 border-gold group-hover:scale-110 transition-transform duration-500">
                           {idx + 1}
                         </div>
                         <div className="flex-1 pt-4 border-b border-red-900/10 pb-6">
                           <p className="text-2xl text-red-950 font-bold italic leading-relaxed group-hover:translate-x-2 transition-transform">{reg}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}

                 <div className="pt-16">
                   <p className="text-red-900 font-traditional italic text-2xl mb-12">"Duy trì gia phong - Gìn giữ cội nguồn - Vạn đại trường tồn"</p>
                   {isAdmin && (
                     <button onClick={() => setIsEditingText(!isEditingText)} className="bg-red-950 text-gold px-12 py-4 rounded-full font-black shadow-2xl hover:bg-black transition-all border-2 border-gold/30">
                       {isEditingText ? "💾 Lưu Tộc Ước" : "📜 Chỉnh sửa Tộc Ước"}
                     </button>
                   )}
                 </div>
               </div>
            </div>
          </div>
        );
      case AppSection.EVENTS:
        return (
          <Events 
            events={appData.events} 
            isAdmin={isAdmin} 
            onAddEvent={(e) => updateData({ events: [...appData.events, e] })}
            onDeleteEvent={(id) => updateData({ events: appData.events.filter(e => e.id !== id) })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-32 selection:bg-red-100 selection:text-red-900">
      {/* Decorative Lanterns */}
      <div className="fixed top-0 left-12 z-[100] lantern hidden xl:block">
        <div className="w-1.5 h-24 bg-red-900 mx-auto"></div>
        <div className="w-20 h-28 bg-red-700 rounded-full border-4 border-gold flex flex-col items-center justify-center shadow-2xl">
           <div className="text-gold font-black text-xl font-traditional">福</div>
           <div className="w-12 h-px bg-gold/50 my-1"></div>
           <div className="text-gold font-bold text-[10px] tracking-widest uppercase">An</div>
        </div>
      </div>
      <div className="fixed top-0 right-12 z-[100] lantern hidden xl:block" style={{ animationDelay: '0.7s' }}>
        <div className="w-1.5 h-20 bg-red-900 mx-auto"></div>
        <div className="w-20 h-28 bg-red-700 rounded-full border-4 border-gold flex flex-col items-center justify-center shadow-2xl">
           <div className="text-gold font-black text-xl font-traditional">祿</div>
           <div className="w-12 h-px bg-gold/50 my-1"></div>
           <div className="text-gold font-bold text-[10px] tracking-widest uppercase">Khang</div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[500] px-10 py-5 rounded-full shadow-2xl flex items-center gap-4 animate-fadeIn border-2 backdrop-blur-xl
          ${toast.type === 'success' ? 'bg-green-900/90 border-green-400 text-white' : 
            toast.type === 'error' ? 'bg-red-950/90 border-red-400 text-white' : 'bg-blue-900/90 border-blue-400 text-white'}`}
        >
          <span className="text-3xl">{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span className="font-black tracking-wider uppercase text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <header className="relative w-full h-[500px] md:h-[700px] flex items-center justify-center shadow-2xl overflow-hidden bg-black">
        <img src={appData.bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-[3s]" />
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/30 via-transparent to-red-950/80"></div>
        
        <div className="relative z-10 text-center px-6">
          <div className="mb-8 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
             <span className="inline-block bg-red-900/80 backdrop-blur-xl text-gold px-10 py-2 rounded-full text-xs font-black uppercase tracking-[0.5em] border-2 border-gold/30 shadow-2xl">Gìn giữ gia phong - Nối nghiệp tổ tông</span>
          </div>
          <h1 className="text-7xl md:text-[10rem] font-traditional text-white font-black mb-6 drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] animate-fadeIn leading-none" style={{ animationDelay: '0.4s' }}>
            {appData.clanName}
          </h1>
          <p className="text-2xl md:text-5xl font-festive text-gold italic animate-fadeIn drop-shadow-xl" style={{ animationDelay: '0.6s' }}>
             - Xuân Giáp Thìn 2024 - Vạn Sự Như Ý -
          </p>
        </div>

        {isAdmin && (
          <div className="absolute top-12 right-12 z-50 flex gap-4">
            <input type="file" accept="image/*" className="hidden" ref={bannerInputRef} onChange={(e) => {
              const file = e.target.files?.[0];
              if(file) {
                const reader = new FileReader();
                reader.onloadend = () => updateData({ bannerUrl: reader.result as string });
                reader.readAsDataURL(file);
              }
            }} />
            <button onClick={() => bannerInputRef.current?.click()} className="bg-black/60 backdrop-blur-xl text-white px-8 py-4 rounded-full border-2 border-gold/50 hover:bg-gold hover:text-red-950 transition-all flex items-center gap-3 shadow-2xl font-black uppercase text-xs tracking-widest">
              📷 Cập nhật ảnh nền
            </button>
          </div>
        )}
      </header>

      {/* Admin Quick Access Bar */}
      {isAdmin && (
        <div className="bg-red-950 text-gold py-6 px-12 shadow-2xl sticky top-0 z-[100] border-b-2 border-gold/20 flex flex-col md:flex-row justify-between items-center gap-8 backdrop-blur-2xl">
          <div className="flex items-center gap-6">
            <div className="relative flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-gold shadow-lg"></span>
            </div>
            <div className="flex flex-col">
               <span className="font-black uppercase tracking-[0.3em] text-xs">Phòng Truyền Thống Kỹ Thuật Số</span>
               <span className="text-[10px] opacity-60 font-bold">Dữ liệu được bảo mật & Lưu trữ tức thì</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={importBackup} />
            <button onClick={() => importInputRef.current?.click()} className="bg-white/5 text-gold border border-gold/30 px-6 py-2.5 rounded-full hover:bg-gold/10 transition-all text-[10px] font-black uppercase tracking-widest shadow-inner">
              📥 Nhập Backup
            </button>
            <button onClick={exportBackup} className="bg-white/5 text-gold border border-gold/30 px-6 py-2.5 rounded-full hover:bg-gold/10 transition-all text-[10px] font-black uppercase tracking-widest shadow-inner">
              📤 Xuất Backup
            </button>
            <div className="h-10 w-px bg-gold/20 mx-2 hidden md:block"></div>
            <button onClick={handleLogout} className="bg-gold text-red-950 px-10 py-3 rounded-full hover:bg-yellow-400 transition-all font-black shadow-2xl text-[10px] uppercase tracking-[0.2em] border-2 border-red-900/20">
              Đóng Quản trị
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 mt-[-80px] relative z-20">
        <Navigation activeSection={activeSection} onSectionChange={(s) => { setActiveSection(s); setIsEditingText(false); }} />
        <main className="mt-24">{renderSection()}</main>
      </div>

      {/* Modals & Forms */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/95 z-[300] flex items-center justify-center p-8 backdrop-blur-2xl">
          <div className="bg-white p-16 rounded-[4rem] border-[12px] border-double border-red-950 w-full max-w-xl shadow-[0_0_150px_rgba(139,0,0,0.4)] animate-fadeIn relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-gold via-red-800 to-gold"></div>
             <div className="text-center mb-12">
                <span className="text-6xl">🔑</span>
                <h3 className="text-5xl font-traditional text-red-950 mt-6 font-black">Xác Thực Quản Trị</h3>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-4">Dành cho trưởng tộc và ban quản lý</p>
             </div>
             <form onSubmit={handleLogin} className="space-y-10">
               <div className="space-y-4">
                 <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-red-50/50 border-4 border-red-100 rounded-[2rem] px-10 py-6 focus:border-red-800 focus:bg-white outline-none transition-all text-center text-4xl tracking-[0.8em] font-black shadow-inner" placeholder="••••" autoFocus />
               </div>
               <div className="flex flex-col gap-6">
                 <button type="submit" className="w-full bg-red-950 text-gold font-black py-6 rounded-[2rem] hover:bg-black shadow-2xl transition-all uppercase tracking-[0.3em] text-sm border-2 border-gold/30 transform active:scale-95">
                   Vào hệ thống quản trị
                 </button>
                 <button type="button" onClick={() => setShowLogin(false)} className="text-gray-400 font-bold hover:text-red-800 transition-all text-xs uppercase tracking-widest text-center">
                   Trở lại trang chủ
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* Member Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/95 z-[300] flex items-center justify-center p-6 backdrop-blur-2xl overflow-y-auto">
          <div className="bg-white p-12 rounded-[3rem] border-8 border-red-900/5 w-full max-w-3xl shadow-2xl my-12 animate-fadeIn">
            <div className="flex justify-between items-center mb-12 border-b-2 border-red-100 pb-8">
               <h3 className="text-4xl font-traditional text-red-950 font-black m-0">🖋️ Cập nhật Thành viên</h3>
               <button onClick={() => setEditingMember(null)} className="text-gray-300 hover:text-red-800 transition-all text-3xl">✕</button>
            </div>
            <form onSubmit={saveMember} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-xs font-black text-red-900/60 uppercase tracking-widest">Họ và Tên</label>
                  <input type="text" value={editingMember.name} onChange={(e) => setEditingMember({...editingMember, name: e.target.value})} className="w-full border-4 border-gray-100 rounded-2xl px-8 py-5 focus:border-red-800 outline-none font-black text-xl transition-all shadow-sm" required />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-red-900/60 uppercase tracking-widest">Phối Ngẫu (Vợ/Chồng)</label>
                  <input type="text" value={editingMember.spouseName || ''} onChange={(e) => setEditingMember({...editingMember, spouseName: e.target.value})} className="w-full border-4 border-gray-100 rounded-2xl px-8 py-5 focus:border-red-800 outline-none font-black text-xl transition-all shadow-sm" placeholder="..." />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-red-900/60 uppercase tracking-widest">Giới tính</label>
                  <select value={editingMember.isMale ? 'male' : 'female'} onChange={(e) => setEditingMember({...editingMember, isMale: e.target.value === 'male'})} className="w-full border-4 border-gray-100 rounded-2xl px-8 py-5 focus:border-red-800 outline-none font-black text-xl transition-all appearance-none bg-white shadow-sm">
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-red-900/60 uppercase tracking-widest">Sinh - Tử</label>
                  <input type="text" value={editingMember.birthDate || ''} onChange={(e) => setEditingMember({...editingMember, birthDate: e.target.value})} className="w-full border-4 border-gray-100 rounded-2xl px-8 py-5 focus:border-red-800 outline-none font-black text-xl transition-all shadow-sm" placeholder="VD: 1945 - 2024" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-red-900/60 uppercase tracking-widest">Ghi chú tiểu sử</label>
                <textarea value={editingMember.bio || ''} onChange={(e) => setEditingMember({...editingMember, bio: e.target.value})} className="w-full border-4 border-gray-100 rounded-2xl px-8 py-5 h-40 focus:border-red-800 outline-none font-medium leading-relaxed shadow-sm" />
              </div>
              <div className="flex gap-6 pt-10 border-t-2 border-red-50">
                <button type="submit" className="flex-1 bg-red-950 text-gold font-black py-6 rounded-2xl shadow-2xl hover:bg-black transition-all uppercase tracking-widest border-2 border-gold/30">Lưu Gia Phả</button>
                <button type="button" onClick={() => setEditingMember(null)} className="px-12 py-6 bg-gray-50 text-gray-400 font-black rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest">Đóng</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* News Edit Modal */}
      {editingNews && (
        <div className="fixed inset-0 bg-black/95 z-[300] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="bg-white p-12 rounded-[3rem] border-8 border-red-900/5 w-full max-w-4xl shadow-2xl animate-fadeIn">
            <h3 className="text-4xl font-traditional text-red-950 font-black mb-12 border-b-2 pb-8">📰 Biên Tập Tin Tức</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if(!editingNews) return;
              const exists = appData.news.find(n => n.id === editingNews.id);
              updateData({
                news: exists 
                  ? appData.news.map(n => n.id === editingNews.id ? editingNews : n)
                  : [editingNews, ...appData.news]
              });
              setEditingNews(null);
              showToast("Đã đăng tin thành công");
            }} className="space-y-8">
              <input type="text" value={editingNews.title} onChange={(e) => setEditingNews({...editingNews, title: e.target.value})} className="w-full border-4 border-gray-100 rounded-2xl px-10 py-5 focus:border-red-800 outline-none font-black text-2xl shadow-sm" placeholder="Tiêu đề bài viết..." required />
              <div className="grid grid-cols-2 gap-8">
                 <input type="text" value={editingNews.date} onChange={(e) => setEditingNews({...editingNews, date: e.target.value})} className="w-full border-4 border-gray-100 rounded-2xl px-10 py-5 focus:border-red-800 outline-none font-bold" placeholder="Ngày đăng..." />
                 <input type="text" value={editingNews.imageUrl} onChange={(e) => setEditingNews({...editingNews, imageUrl: e.target.value})} className="w-full border-4 border-gray-100 rounded-2xl px-10 py-5 focus:border-red-800 outline-none font-bold" placeholder="URL ảnh minh họa..." />
              </div>
              <textarea value={editingNews.summary} onChange={(e) => setEditingNews({...editingNews, summary: e.target.value})} className="w-full border-4 border-gray-100 rounded-2xl px-10 py-5 h-24 focus:border-red-800 outline-none font-medium" placeholder="Tóm tắt ngắn gọn..." required />
              <textarea value={editingNews.content} onChange={(e) => setEditingNews({...editingNews, content: e.target.value})} className="w-full border-4 border-gray-100 rounded-2xl px-10 py-5 h-64 focus:border-red-800 outline-none font-medium leading-relaxed" placeholder="Nội dung bài viết chi tiết..." required />
              <div className="flex gap-6 pt-10">
                <button type="submit" className="flex-1 bg-red-950 text-gold font-black py-6 rounded-2xl shadow-2xl hover:bg-black transition-all uppercase tracking-[0.2em] border-2 border-gold/30">Phát hành thông báo</button>
                <button type="button" onClick={() => setEditingNews(null)} className="px-12 py-6 bg-gray-50 text-gray-400 font-black rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest">Hủy bỏ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-48 pt-40 pb-24 bg-red-950 text-yellow-100 border-t-[12px] border-gold relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-gold via-red-800 to-gold opacity-60"></div>
        <div className="max-w-7xl mx-auto px-12 grid grid-cols-1 lg:grid-cols-2 gap-32 relative z-10">
          <div className="space-y-12">
            <h4 className="text-6xl font-traditional uppercase text-gold font-black tracking-[0.2em] drop-shadow-lg">{appData.clanName}</h4>
            <div className="space-y-6 text-2xl font-medium opacity-90 font-serif">
              <p className="flex items-center gap-6"><span>🏛️</span> {appData.address}</p>
              <p className="flex items-center gap-6"><span>📜</span> Truyền thống vạn đại trường tồn</p>
              <p className="flex items-center gap-6"><span>📅</span> Năm Giáp Thìn - 2024</p>
            </div>
            {!isAdmin && (
              <button onClick={() => setShowLogin(true)} className="group bg-white/5 border-2 border-gold/30 px-12 py-5 rounded-[2rem] hover:bg-gold hover:text-red-950 transition-all flex items-center gap-6 shadow-2xl">
                <span className="bg-gold text-red-950 p-3 rounded-xl text-2xl group-hover:scale-110 transition-transform shadow-lg">🔑</span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold/60 group-hover:text-red-950 transition-colors leading-relaxed">Đăng nhập Quản trị viên<br/>Hệ thống Gia phả nội bộ</span>
              </button>
            )}
          </div>
          <div className="text-center lg:text-right flex flex-col justify-center space-y-12">
            <p className="text-4xl md:text-6xl font-festive text-gold leading-relaxed italic drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">"Tổ Tông Công Đức Thiên Niên Thịnh"</p>
            <p className="text-4xl md:text-6xl font-festive text-gold leading-relaxed italic drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">"Tử Hiếu Tôn Hiền Vạn Đại Vinh"</p>
          </div>
        </div>
        <div className="text-center mt-40 pt-20 border-t border-gold/10">
           <p className="text-[10px] opacity-40 tracking-[0.5em] font-black uppercase mb-6">Bản quyền &copy; {new Date().getFullYear()} - {appData.clanName}</p>
           <div className="flex justify-center gap-6 opacity-30 text-xl">
              <span>🌸</span><span>🏵️</span><span>🌸</span><span>🏵️</span><span>🌸</span>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
