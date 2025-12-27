
import React, { useState, useEffect, useRef } from 'react';
import { AppSection, FamilyMember, NewsItem } from './types';
import Navigation from './components/Navigation';
import FamilyTree from './components/FamilyTree';
import { 
  CLAN_NAME, CLAN_ADDRESS, SAMPLE_NEWS, SAMPLE_FAMILY_TREE 
} from './constants';
import { generateClanHistory } from './services/geminiService';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.TREE);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  
  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // States with Persistence
  const [news, setNews] = useState<NewsItem[]>(() => {
    const saved = localStorage.getItem('clan_news');
    return saved ? JSON.parse(saved) : SAMPLE_NEWS;
  });
  const [familyTree, setFamilyTree] = useState<FamilyMember>(() => {
    const saved = localStorage.getItem('clan_tree');
    return saved ? JSON.parse(saved) : SAMPLE_FAMILY_TREE;
  });
  const [bannerUrl, setBannerUrl] = useState<string>(() => {
    return localStorage.getItem('clan_banner') || "https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/clan-banner-bg.jpg";
  });
  const [address, setAddress] = useState<string>(() => {
    return localStorage.getItem('clan_address') || CLAN_ADDRESS;
  });
  const [historyText, setHistoryText] = useState<string>(() => {
    return localStorage.getItem('clan_history') || "Lịch sử dòng họ đang được cập nhật...";
  });
  const [ancestralHouseText, setAncestralHouseText] = useState<string>(() => {
    return localStorage.getItem('clan_house_text') || "Từ đường là nơi thờ tự linh thiêng, nơi lưu giữ hồn cốt của tổ tiên qua bao thế hệ. Ngôi từ đường được xây dựng trang nghiêm, là điểm tựa tâm linh cho con cháu muôn đời.";
  });
  const [regulations, setRegulations] = useState<string[]>(() => {
    const saved = localStorage.getItem('clan_regulations');
    return saved ? JSON.parse(saved) : [
      "Luôn giữ gìn và phát huy truyền thống tốt đẹp của dòng họ, tôn trọng các bậc tiền bối, yêu thương đùm bọc con cháu.",
      "Khuyến khích con cháu thi đua học tập, lao động sản xuất, đóng góp công sức xây dựng quê hương, dòng họ ngày càng giàu đẹp.",
      "Thực hiện tốt nghĩa vụ công dân, chấp hành pháp luật của Nhà nước và các quy định của địa phương.",
      "Tham gia đầy đủ các hoạt động của dòng họ, đặc biệt là các ngày giỗ tổ, chạp họ hàng năm.",
      "Giữ gìn sự đoàn kết nội bộ, giải quyết các mâu thuẫn trên tinh thần hòa giải, trọng tình trọng nghĩa."
    ];
  });

  // Admin States
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync with LocalStorage
  useEffect(() => { localStorage.setItem('clan_news', JSON.stringify(news)); }, [news]);
  useEffect(() => { localStorage.setItem('clan_tree', JSON.stringify(familyTree)); }, [familyTree]);
  useEffect(() => { localStorage.setItem('clan_banner', bannerUrl); }, [bannerUrl]);
  useEffect(() => { localStorage.setItem('clan_address', address); }, [address]);
  useEffect(() => { localStorage.setItem('clan_history', historyText); }, [historyText]);
  useEffect(() => { localStorage.setItem('clan_house_text', ancestralHouseText); }, [ancestralHouseText]);
  useEffect(() => { localStorage.setItem('clan_regulations', JSON.stringify(regulations)); }, [regulations]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAdmin(true);
      setShowLogin(false);
      setPassword('');
      showToast("Đăng nhập thành công!", "success");
    } else {
      showToast("Mật khẩu không chính xác!", "error");
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setIsEditingText(false);
    setEditingMember(null);
    setEditingNews(null);
    setShowLogin(false);
    showToast("Đã thoát chế độ quản trị", "info");
  };

  const saveAllManually = () => {
    showToast("Dữ liệu đã được lưu trữ vào bộ nhớ trình duyệt", "success");
  };

  // Export Full Data to JSON
  const exportAllData = () => {
    const fullData = {
      news,
      familyTree,
      bannerUrl,
      address,
      historyText,
      ancestralHouseText,
      regulations,
      exportDate: new Date().toISOString(),
      clanName: CLAN_NAME
    };
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `giapha-full-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã xuất file lưu trữ dữ liệu thành công!", "success");
  };

  // Import Full Data from JSON
  const importAllData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.familyTree) setFamilyTree(data.familyTree);
        if (data.news) setNews(data.news);
        if (data.bannerUrl) setBannerUrl(data.bannerUrl);
        if (data.address) setAddress(data.address);
        if (data.historyText) setHistoryText(data.historyText);
        if (data.ancestralHouseText) setAncestralHouseText(data.ancestralHouseText);
        if (data.regulations) setRegulations(data.regulations);
        
        showToast("Đã nhập dữ liệu thành công! Trang sẽ cập nhật ngay.", "success");
      } catch (err) {
        showToast("File không hợp lệ hoặc bị lỗi cấu trúc!", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Kích thước ảnh quá lớn (tối đa 5MB)", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setBannerUrl(base64String);
        showToast("Đã cập nhật ảnh bìa", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const saveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    const updateNode = (node: FamilyMember): FamilyMember => {
      if (node.id === editingMember.id) return editingMember;
      if (node.children) {
        return { ...node, children: node.children.map(updateNode) };
      }
      return node;
    };
    setFamilyTree(updateNode(familyTree));
    setEditingMember(null);
    showToast("Đã lưu thông tin thành viên", "success");
  };

  const saveNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews) return;
    
    setNews(prev => {
      const exists = prev.find(n => n.id === editingNews.id);
      if (exists) {
        return prev.map(n => n.id === editingNews.id ? editingNews : n);
      } else {
        return [editingNews, ...prev];
      }
    });
    setEditingNews(null);
    showToast("Đã lưu bài viết tin tức", "success");
  };

  const addChild = (parent: FamilyMember) => {
    const newId = `child-${Date.now()}`;
    const newChild: FamilyMember = {
      id: newId,
      name: 'Thành viên mới',
      generation: parent.generation + 1,
      isMale: true,
      spouseName: '',
      parentName: parent.name
    };

    const addNode = (node: FamilyMember): FamilyMember => {
      if (node.id === parent.id) {
        return { ...node, children: [...(node.children || []), newChild] };
      }
      if (node.children) return { ...node, children: node.children.map(addNode) };
      return node;
    };
    
    setFamilyTree(addNode(familyTree));
    setEditingMember(newChild);
    showToast("Đã thêm thành viên mới vào nhánh", "success");
  };

  const deleteMember = (id: string) => {
    if (id === familyTree.id) {
      showToast("Không thể xóa Cụ Tổ!", "error");
      setShowDeleteConfirm(null);
      return;
    }
    
    const deleteFromNode = (node: FamilyMember): FamilyMember => {
      if (!node.children) return node;
      return {
        ...node,
        children: node.children.filter(child => child.id !== id).map(deleteFromNode)
      };
    };
    
    setFamilyTree(deleteFromNode(familyTree));
    setEditingMember(null);
    setShowDeleteConfirm(null);
    showToast("Đã xóa thành viên và các nhánh con", "info");
  };

  const renderSection = () => {
    switch (activeSection) {
      case AppSection.NEWS:
        return (
          <div className="animate-fadeIn">
            {isAdmin && (
              <div className="mb-8 flex justify-center">
                <button onClick={() => setEditingNews({ id: Date.now().toString(), title: '', date: new Date().toLocaleDateString('vi-VN'), summary: '', content: '', imageUrl: 'https://picsum.photos/800/400' })} className="bg-green-700 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-green-800 transition-all flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                  Thêm Tin Tức
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gold/20 relative group">
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingNews(item)} className="bg-yellow-500 text-white p-2 rounded-full shadow hover:bg-yellow-600 transition-all">Sửa</button>
                      <button onClick={() => { if(window.confirm("Xóa tin này?")) setNews(news.filter(n => n.id !== item.id)); showToast("Đã xóa tin", "info"); }} className="bg-red-600 text-white p-2 rounded-full shadow hover:bg-red-700 transition-all">Xóa</button>
                    </div>
                  )}
                  <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
                  <div className="p-6">
                    <span className="text-xs font-bold text-red-600 uppercase tracking-widest">{item.date}</span>
                    <h3 className="text-xl font-bold text-red-900 mt-2 mb-3">{item.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-3">{item.summary}</p>
                    <button className="mt-4 text-red-800 font-bold hover:underline">Xem chi tiết →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case AppSection.TREE:
        return <FamilyTree root={familyTree} isAdmin={isAdmin} onEditMember={setEditingMember} onAddChild={addChild} />;
      case AppSection.CHRONICLES:
        return (
          <div className="prose prose-lg max-w-none bg-white p-10 rounded-xl shadow-lg border-2 border-double border-gold animate-fadeIn">
            <div className="flex justify-between items-center border-b-2 border-gold pb-4 mb-6">
               <h2 className="text-3xl font-traditional text-red-900 italic m-0">Phả Kỹ Dòng Họ</h2>
               {isAdmin && (
                 <button onClick={() => { if(isEditingText) showToast("Đã lưu Phả Kỹ", "success"); setIsEditingText(!isEditingText); }} className={`px-4 py-1 rounded text-sm uppercase transition-all ${isEditingText ? 'bg-green-700 text-white' : 'bg-red-800 text-white hover:bg-red-900'}`}>
                   {isEditingText ? "Hoàn tất" : "Chỉnh sửa"}
                 </button>
               )}
            </div>
            {isEditingText && isAdmin ? (
              <textarea 
                value={historyText} 
                onChange={(e) => setHistoryText(e.target.value)}
                className="w-full h-96 p-4 border-2 border-gold/30 rounded font-sans text-base leading-relaxed focus:border-red-800 outline-none"
              />
            ) : (
              <div className="whitespace-pre-wrap leading-relaxed text-gray-800 font-medium">{historyText}</div>
            )}
          </div>
        );
      case AppSection.ANCESTRAL_HOUSE:
        return (
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gold animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-traditional text-red-900 m-0">Từ Đường Dòng Họ</h2>
              {isAdmin && (
                <button onClick={() => { if(isEditingText) showToast("Đã lưu mô tả Từ Đường", "success"); setIsEditingText(!isEditingText); }} className={`px-4 py-1 rounded text-sm uppercase transition-all ${isEditingText ? 'bg-green-700 text-white' : 'bg-red-800 text-white hover:bg-red-900'}`}>
                  {isEditingText ? "Hoàn tất" : "Sửa mô tả"}
                </button>
              )}
            </div>
            <div className="space-y-6">
              <div className="p-4 bg-red-50/50 rounded-lg border border-red-100">
                <p className="text-lg"><strong>📍 Địa chỉ từ đường:</strong> {address}</p>
                {isAdmin && (
                  <button onClick={() => { const a = prompt('Nhập địa chỉ từ đường mới:', address); if(a) { setAddress(a); showToast("Đã cập nhật địa chỉ", "success"); } }} className="text-xs text-blue-600 underline mt-1 hover:text-blue-800">Thay đổi địa chỉ</button>
                )}
              </div>
              {isEditingText && isAdmin ? (
                <textarea 
                  value={ancestralHouseText} 
                  onChange={(e) => setAncestralHouseText(e.target.value)}
                  className="w-full h-64 p-4 border-2 border-gold/30 rounded focus:border-red-800 outline-none text-gray-700 leading-relaxed"
                  placeholder="Nhập mô tả chi tiết về từ đường dòng họ..."
                />
              ) : (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg italic border-l-4 border-red-900 pl-6 py-2">
                  {ancestralHouseText}
                </p>
              )}
            </div>
          </div>
        );
      case AppSection.REGULATIONS:
        return (
          <div className="max-w-4xl mx-auto bg-[#fffdf0] p-12 shadow-2xl rounded-sm border-[16px] border-double border-red-900 relative animate-fadeIn">
             <div className="flex justify-between items-center mb-10">
               <div className="w-10"></div>
               <h2 className="text-4xl font-traditional text-red-900 m-0 uppercase tracking-widest text-center">Tộc Ước Dòng Họ</h2>
               {isAdmin ? (
                  <button onClick={() => { if(isEditingText) showToast("Đã lưu Tộc Ước", "success"); setIsEditingText(!isEditingText); }} className={`px-4 py-1 rounded text-xs uppercase transition-all ${isEditingText ? 'bg-green-700 text-white' : 'bg-red-800 text-white hover:bg-red-900'}`}>
                    {isEditingText ? "Hoàn tất" : "Sửa tộc ước"}
                  </button>
               ) : <div className="w-10"></div>}
             </div>
             {isEditingText && isAdmin ? (
               <textarea 
                 value={regulations.join('\n')}
                 onChange={(e) => setRegulations(e.target.value.split('\n'))}
                 className="w-full h-80 p-6 border-4 border-double border-gold/50 bg-white font-serif text-lg leading-loose focus:outline-none"
               />
             ) : (
               <div className="space-y-6 text-lg text-red-950 italic">
                 {regulations.filter(r => r.trim()).map((reg, idx) => (
                   <p key={idx}><strong>Điều {idx + 1}:</strong> {reg}</p>
                 ))}
               </div>
             )}
             <div className="mt-12 text-center text-sm text-red-800 italic">- Trích lục từ bản gốc lưu tại Từ Đường -</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn border-2
          ${toast.type === 'success' ? 'bg-green-900 border-green-400 text-white' : 
            toast.type === 'error' ? 'bg-red-950 border-red-400 text-white' : 'bg-blue-900 border-blue-400 text-white'}`}
        >
          {toast.type === 'success' && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          <span className="font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <header className="relative w-full h-[300px] md:h-[500px] flex items-center justify-center bg-cover bg-center shadow-2xl border-b-8 border-gold overflow-hidden">
        <img src={bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000" />
        
        {isAdmin && (
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={bannerInputRef}
              onChange={handleBannerUpload}
            />
            <button 
              onClick={() => bannerInputRef.current?.click()}
              className="bg-black/60 text-white px-4 py-2 rounded-lg border border-gold hover:bg-black transition-all flex items-center gap-2 shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" />
              </svg>
              Thay ảnh bìa
            </button>
          </div>
        )}

        <div className="absolute bottom-6 w-full text-center z-10">
          <div className="inline-block bg-black/40 backdrop-blur-sm px-6 py-2 rounded-full border border-gold/50 shadow-lg">
            <p className="text-white font-medium flex items-center gap-2">
              📍 <span className="text-gold font-bold">{address}</span>
            </p>
          </div>
        </div>
      </header>

      {/* Admin Mode Sticky Bar */}
      {isAdmin && (
        <div className="bg-red-950 text-gold py-3 px-6 shadow-2xl sticky top-0 z-[100] border-b-2 border-gold/40 flex flex-col md:flex-row justify-between items-center gap-4 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-gold"></span>
            </span>
            <span className="font-bold uppercase tracking-widest text-sm">Quản trị viên</span>
            <div className="ml-4 h-4 w-px bg-gold/20"></div>
            <div className="flex items-center gap-1 text-[10px] text-gold/60 uppercase font-black">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 animate-pulse" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
              Tự động sao lưu
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={importAllData} />
            <button 
              onClick={() => importInputRef.current?.click()}
              className="bg-white/5 text-gold border border-gold/30 px-4 py-1.5 rounded-full hover:bg-gold/10 transition-all text-[10px] font-bold uppercase flex items-center gap-2"
              title="Nhập dữ liệu từ file lưu trữ"
            >
              📥 Nhập dữ liệu
            </button>
            <button 
              onClick={exportAllData}
              className="bg-white/5 text-gold border border-gold/30 px-4 py-1.5 rounded-full hover:bg-gold/10 transition-all text-[10px] font-bold uppercase flex items-center gap-2"
              title="Tải về bản sao toàn bộ phả hệ"
            >
              📤 Xuất bản sao
            </button>
            <div className="h-6 w-px bg-gold/20 mx-1"></div>
            <button 
              onClick={handleLogout} 
              className="bg-gold text-red-950 px-6 py-1.5 rounded-full hover:bg-yellow-400 transition-all font-black shadow-lg text-xs uppercase active:scale-95"
            >
              Thoát Quản trị
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 mt-[-40px] relative z-20">
        <Navigation activeSection={activeSection} onSectionChange={(s) => { setActiveSection(s); setIsEditingText(false); }} />
        <main className="mt-8">{renderSection()}</main>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white p-8 rounded-xl border-4 border-gold w-full max-w-md shadow-2xl animate-fadeIn">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-50 rounded-full border-2 border-red-900/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-traditional text-red-900 mb-6 text-center">Xác thực Quản trị</h3>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Mật khẩu truy cập (mặc định: admin123)</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-4 focus:border-red-800 focus:bg-white outline-none transition-all shadow-inner text-center text-xl tracking-widest" 
                  placeholder="••••••••" 
                  autoFocus 
                />
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button type="submit" className="w-full bg-red-900 text-gold font-black py-4 rounded-xl hover:bg-red-950 shadow-xl transition-all uppercase tracking-widest active:scale-[0.98]">
                  Đăng nhập Hệ thống
                </button>
                <button type="button" onClick={() => setShowLogin(false)} className="w-full text-gray-400 font-bold py-2 hover:text-gray-600 transition-all text-sm">
                  Quay lại trang chủ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white p-8 rounded-xl border-4 border-gold w-full max-w-lg shadow-2xl max-h-[95vh] overflow-y-auto animate-fadeIn relative">
            
            {/* Confirmation Overlay for Deletion */}
            {showDeleteConfirm === editingMember.id && (
              <div className="absolute inset-0 bg-red-900/95 z-50 rounded-lg flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
                <div className="bg-white p-4 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">Xác Nhận Xóa</h4>
                <p className="text-red-100 mb-8 leading-relaxed">
                  Hành động này sẽ xóa vĩnh viễn <span className="font-bold text-white underline">{editingMember.name}</span> và TOÀN BỘ nhánh con cháu liên quan. Bạn có chắc chắn?
                </p>
                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => deleteMember(editingMember.id)}
                    className="flex-1 bg-white text-red-900 font-black py-4 rounded-xl hover:bg-red-50 transition-all shadow-xl active:scale-95"
                  >
                    CÓ, XÓA NGAY
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 bg-transparent border-2 border-white text-white font-bold py-4 rounded-xl hover:bg-white/10 transition-all active:scale-95"
                  >
                    QUAY LẠI
                  </button>
                </div>
              </div>
            )}

            <h3 className="text-2xl font-traditional text-red-900 mb-6 text-center border-b-2 border-gold pb-2">✏️ Biên tập thành viên</h3>
            <form onSubmit={saveMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Họ và Tên</label>
                  <input type="text" value={editingMember.name} onChange={(e) => setEditingMember({...editingMember, name: e.target.value})} className="w-full border-2 rounded-lg px-4 py-2 focus:border-red-800 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Vợ / Chồng</label>
                  <input type="text" value={editingMember.spouseName || ''} onChange={(e) => setEditingMember({...editingMember, spouseName: e.target.value})} className="w-full border-2 rounded-lg px-4 py-2 focus:border-red-800 outline-none" placeholder="Tên phối ngẫu..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Giới tính</label>
                  <select value={editingMember.isMale ? 'male' : 'female'} onChange={(e) => setEditingMember({...editingMember, isMale: e.target.value === 'male'})} className="w-full border-2 rounded-lg px-4 py-2 focus:border-red-800 outline-none">
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Năm sinh / Ngày mất</label>
                  <input type="text" value={editingMember.birthDate || ''} onChange={(e) => setEditingMember({...editingMember, birthDate: e.target.value})} className="w-full border-2 rounded-lg px-4 py-2 focus:border-red-800 outline-none" placeholder="VD: 1950 - 2020" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tên Cha/Mẹ (Hiển thị phả đồ)</label>
                <input type="text" value={editingMember.parentName || ''} onChange={(e) => setEditingMember({...editingMember, parentName: e.target.value})} className="w-full border-2 rounded-lg px-4 py-2 focus:border-red-800 outline-none" placeholder="Tên cụ thân sinh..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tiểu sử tóm tắt</label>
                <textarea value={editingMember.bio || ''} onChange={(e) => setEditingMember({...editingMember, bio: e.target.value})} className="w-full border-2 rounded-lg px-4 py-2 h-20 focus:border-red-800 outline-none" />
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button type="submit" className="w-full bg-green-700 text-white font-black py-4 rounded-xl shadow-xl hover:bg-green-800 transition-all active:scale-[0.98]">
                  CẬP NHẬT THÔNG TIN
                </button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowDeleteConfirm(editingMember.id)} className="flex-1 bg-red-100 text-red-700 font-bold py-3 rounded-xl hover:bg-red-200 transition-all">
                    XÓA THÀNH VIÊN
                  </button>
                  <button type="button" onClick={() => setEditingMember(null)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all">
                    ĐÓNG
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* News Modal */}
      {editingNews && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white p-8 rounded-xl border-4 border-gold w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            <h3 className="text-2xl font-traditional text-red-900 mb-6 text-center">📰 Biên tập bài viết</h3>
            <form onSubmit={saveNews} className="space-y-4">
              <input type="text" value={editingNews.title} onChange={(e) => setEditingNews({...editingNews, title: e.target.value})} className="w-full border-2 rounded-lg px-4 py-2 focus:border-red-800 outline-none" placeholder="Tiêu đề bài viết..." required />
              <textarea value={editingNews.summary} onChange={(e) => setEditingNews({...editingNews, summary: e.target.value})} className="w-full border-2 rounded-lg px-4 py-2 h-20 focus:border-red-800 outline-none" placeholder="Tóm tắt nội dung..." required />
              <textarea value={editingNews.content} onChange={(e) => setEditingNews({...editingNews, content: e.target.value})} className="w-full border-2 rounded-lg px-4 py-2 h-40 focus:border-red-800 outline-none" placeholder="Nội dung chi tiết..." required />
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg">Đăng bài</button>
                <button type="button" onClick={() => setEditingNews(null)} className="flex-1 bg-gray-100 py-3 rounded-lg">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="mt-20 py-16 bg-[#1a0000] text-yellow-100 border-t-8 border-gold relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6">
            <h4 className="text-3xl font-traditional uppercase text-gold border-l-4 border-gold pl-4">{CLAN_NAME}</h4>
            <div className="flex flex-col gap-2 opacity-80 text-lg">
              <p>🏛️ {address}</p>
              <p>📅 Ngày cập nhật: {new Date().toLocaleDateString('vi-VN')}</p>
            </div>
            {!isAdmin && (
              <button 
                onClick={() => setShowLogin(true)} 
                className="mt-8 text-xs text-gold/30 hover:text-gold flex items-center gap-2 transition-all p-2 border border-gold/10 rounded hover:bg-gold/5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                QUẢN TRỊ VIÊN ĐĂNG NHẬP
              </button>
            )}
          </div>
          <div className="text-center md:text-right space-y-4">
            <p className="text-2xl font-traditional italic text-gold leading-relaxed">"Tổ Tông Công Đức Thiên Niên Thịnh"</p>
            <p className="text-2xl font-traditional italic text-gold leading-relaxed">"Tử Hiếu Tôn Hiền Vạn Đại Vinh"</p>
          </div>
        </div>
        <div className="text-center mt-16 text-[10px] opacity-20 border-t border-gold/10 pt-8 tracking-[0.2em] uppercase">
          &copy; {new Date().getFullYear()} Nền tảng quản trị gia phả Việt Nam - Gìn giữ cội nguồn
        </div>
      </footer >
    </div>
  );
};

export default App;
