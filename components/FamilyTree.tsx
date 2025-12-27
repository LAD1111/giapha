
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FamilyMember } from '../types';
import * as htmlToImage from 'https://esm.sh/html-to-image';

interface MemberNodeProps {
  member: FamilyMember;
  isAdmin: boolean;
  searchQuery: string;
  onEdit?: (member: FamilyMember) => void;
  onAddChild?: (parent: FamilyMember) => void;
}

const MemberNode: React.FC<MemberNodeProps> = ({ member, isAdmin, searchQuery, onEdit, onAddChild }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = member.children && member.children.length > 0;

  const containsMatch = useMemo(() => {
    if (!searchQuery) return false;
    const q = searchQuery.toLowerCase();
    
    const checkNode = (node: FamilyMember): boolean => {
      if (node.name.toLowerCase().includes(q)) return true;
      if (node.spouseName?.toLowerCase().includes(q)) return true;
      if (node.children) return node.children.some(checkNode);
      return false;
    };
    
    return checkNode(member);
  }, [member, searchQuery]);

  useEffect(() => {
    if (searchQuery && containsMatch) {
      setIsExpanded(true);
    }
  }, [searchQuery, containsMatch]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const isCompact = member.generation >= 4;
  const isGen1To2 = member.generation === 1;

  const isNameMatched = searchQuery && member.name.toLowerCase().includes(searchQuery.toLowerCase());
  const isSpouseMatched = searchQuery && member.spouseName?.toLowerCase().includes(searchQuery.toLowerCase());

  const renderVerticalName = (name: string) => {
    return name.split(' ').map((word, i) => (
      <span key={i} className="block leading-tight">{word}</span>
    ));
  };

  return (
    <div className="flex flex-col items-center transition-all duration-500 w-full">
      <div className="relative group flex flex-col items-center justify-center">
        <div className="flex flex-row items-start gap-2 relative z-10">
          <div className={`
            relative transition-all duration-500 transform 
            ${isCompact 
              ? 'w-16 p-3 rounded-2xl border-2 bg-white shadow-xl' 
              : 'w-48 md:w-64 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-4 bg-white shadow-2xl'
            }
            ${member.isMale 
              ? 'border-red-900/40 shadow-red-900/5' 
              : 'border-pink-900/40 shadow-pink-900/5'
            }
            ${isGen1To2 ? 'ring-8 ring-red-900/5 ring-offset-4 border-red-900 bg-red-50/50' : ''}
            ${isNameMatched ? 'ring-4 ring-yellow-400 border-yellow-500 scale-105 z-20 !shadow-[0_0_30px_rgba(234,179,8,0.5)]' : 'group-hover:-translate-y-1 md:group-hover:-translate-y-2'}
          `}>
            {!isCompact && (
              <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm z-20 ${member.isMale ? 'bg-red-900 text-white' : 'bg-pink-600 text-white'}`}>
                {member.isMale ? 'Nam' : 'Nữ'}
              </div>
            )}

            {isGen1To2 && (
              <div className="absolute -top-6 -right-6 text-2xl md:text-3xl animate-bounce">🧧</div>
            )}

            {isAdmin && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit?.(member); }}
                className={`absolute -top-4 -left-4 bg-yellow-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all z-30 shadow-xl hover:bg-yellow-600 ${isCompact ? 'scale-75' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
              </button>
            )}

            <div className={`
              font-bold text-red-950 font-traditional text-center tracking-tight
              ${isCompact ? 'text-[13px] leading-tight py-1' : (isGen1To2 ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl')}
              ${isNameMatched ? 'text-yellow-700' : ''}
            `}>
              {isCompact ? renderVerticalName(member.name) : member.name}
            </div>

            {!isCompact && (
              <div className="mt-2 md:mt-4 space-y-1 text-center">
                {member.birthDate && (
                  <div className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    Sinh: <span className="text-red-900/60 italic">{member.birthDate}</span>
                  </div>
                )}
                {(member.deathDate || member.lunarDeathDate) && (
                  <div className="text-[9px] md:text-[10px] text-red-700/80 font-black uppercase tracking-wider">
                    Mất: <span className="italic">{member.lunarDeathDate || member.deathDate} (ÂL)</span>
                  </div>
                )}
                <div className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] rounded-full py-1 mt-2 md:mt-4 inline-block px-3 md:px-4 ${isGen1To2 ? 'bg-red-900 text-gold shadow-lg' : 'bg-red-50 text-red-900/60'}`}>
                  {isGen1To2 ? 'Cụ Tổ' : `Đời ${member.generation}`}
                </div>
              </div>
            )}

            {isAdmin && (
              <button 
                onClick={(e) => { e.stopPropagation(); onAddChild?.(member); }}
                className={`absolute -bottom-4 -right-4 bg-red-800 text-white rounded-full p-2 shadow-xl hover:bg-red-950 hover:scale-110 z-30 transition-all ${isCompact ? 'scale-75' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
              </button>
            )}
          </div>

          {member.spouseName && (
            <div className={`
              relative transition-all duration-500 transform 
              ${isCompact 
                ? 'w-16 p-3 rounded-2xl border-2 border-dashed bg-white/70 shadow-lg' 
                : 'w-48 md:w-64 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-4 border-dashed bg-pink-50/30 shadow-xl'
              }
              border-pink-900/20
              ${isSpouseMatched ? 'ring-4 ring-yellow-400 border-yellow-500 scale-105 z-20 !shadow-[0_0_30px_rgba(234,179,8,0.5)]' : 'group-hover:-translate-y-1 md:group-hover:-translate-y-2'}
            `}>
              <div className={`
                font-bold text-pink-950 font-traditional text-center tracking-tight opacity-80
                ${isCompact ? 'text-[12px] leading-tight py-1' : 'text-lg md:text-xl'}
                ${isSpouseMatched ? 'text-yellow-700 opacity-100' : ''}
              `}>
                {isCompact ? renderVerticalName(member.spouseName) : member.spouseName}
              </div>
              {!isCompact && (
                <div className="mt-2 md:mt-4 text-center">
                  <div className="text-[8px] md:text-[9px] text-pink-900/60 font-black uppercase tracking-[0.2em]">Vợ / Chồng</div>
                  {member.spouseDeathDate && (
                    <div className="text-[8px] md:text-[9px] text-pink-700/60 font-bold mt-1">
                      Mất: {member.spouseDeathDate} (ÂL)
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {hasChildren && (
          <button
            onClick={toggleExpand}
            className={`
              absolute left-1/2 -translate-x-1/2 z-20 w-8 h-8 rounded-full border-2 shadow-2xl flex items-center justify-center transition-all duration-300
              ${isCompact ? '-bottom-5 scale-90' : '-bottom-4'}
              ${isExpanded ? 'bg-red-950 border-gold text-gold rotate-0' : 'bg-gold border-red-950 text-red-950 rotate-180'}
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          </button>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div className="relative mt-12 md:mt-16 animate-fadeIn w-full flex flex-col items-center">
          <div className={`absolute top-[-48px] md:top-[-64px] left-1/2 -translate-x-1/2 bg-red-900/20 -z-10 w-[4px] h-[48px] md:h-[64px] ${isGen1To2 ? 'w-[6px] bg-red-900/40' : ''}`} />
          
          <div className="flex flex-row justify-center relative w-full pt-0">
             {member.children?.map((child, index) => {
                const isFirst = index === 0;
                const isLast = index === (member.children?.length ?? 0) - 1;
                const childIsCompact = child.generation >= 4;
                
                return (
                  <div key={child.id} className={`relative flex flex-col items-center flex-1 ${childIsCompact ? 'px-1' : 'px-4 md:px-6'}`}>
                     {member.children && member.children.length > 1 && (
                        <div className={`
                          absolute top-0 h-[4px] bg-red-900/20
                          ${isFirst ? 'left-1/2 right-0' : isLast ? 'left-0 right-1/2' : 'left-0 right-0'}
                        `}></div>
                     )}
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[4px] h-6 md:h-8 bg-red-900/20 -z-10"></div>
                     <div className="mt-6 md:mt-8 w-full flex justify-center">
                       <MemberNode 
                         member={child} 
                         isAdmin={isAdmin} 
                         searchQuery={searchQuery}
                         onEdit={onEdit} 
                         onAddChild={onAddChild} 
                       />
                     </div>
                  </div>
                );
             })}
          </div>
        </div>
      )}
    </div>
  );
};

interface FamilyTreeProps {
  root: FamilyMember;
  isAdmin: boolean;
  onEditMember: (member: FamilyMember) => void;
  onAddChild: (parent: FamilyMember) => void;
}

const FamilyTree: React.FC<FamilyTreeProps> = ({ root, isAdmin, onEditMember, onAddChild }) => {
  const [scale, setScale] = useState(0.7);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false); // Mặc định thu gọn
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const initialPinchDistRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelEvent = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        const zoomSpeed = 0.0015;
        const delta = -e.deltaY * zoomSpeed;
        
        setScale(prevScale => {
          const newScale = Math.min(Math.max(prevScale + delta, 0.2), 2.0);
          
          if (container) {
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const contentX = (mouseX + container.scrollLeft) / prevScale;
            const contentY = (mouseY + container.scrollTop) / prevScale;

            setTimeout(() => {
              container.scrollLeft = contentX * newScale - mouseX;
              container.scrollTop = contentY * newScale - mouseY;
            }, 0);
          }
          
          return newScale;
        });
      }
    };

    container.addEventListener('wheel', handleWheelEvent, { passive: false });
    return () => container.removeEventListener('wheel', handleWheelEvent);
  }, [containerRef]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      initialPinchDistRef.current = dist;
    } else {
      onMouseDown(e as unknown as React.MouseEvent);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      
      const zoomFactor = dist / initialPinchDistRef.current;
      setScale(prev => {
        const newScale = Math.min(Math.max(prev * zoomFactor, 0.2), 2.0);
        return newScale;
      });
      initialPinchDistRef.current = dist;
    } else if (e.touches.length === 1) {
      onMouseMove(e as unknown as React.MouseEvent);
    }
  };

  const handleTouchEnd = () => {
    initialPinchDistRef.current = null;
    setIsDragging(false);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleResetView();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.2));
  
  const handleResetView = () => {
    if (containerRef.current && treeRef.current) {
      const isMobile = window.innerWidth < 768;
      setScale(isMobile ? 0.4 : 0.6);
      
      const containerWidth = containerRef.current.clientWidth;
      const treeWidth = treeRef.current.scrollWidth;
      
      containerRef.current.scrollLeft = (treeWidth - containerWidth) / 2;
      containerRef.current.scrollTop = 0;
    }
  };

  const toggleFullScreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(root, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `giapha-le-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPNG = async () => {
    if (!treeRef.current) return;
    try {
      setIsExporting(true);
      const originalScale = scale;
      setScale(1);
      await new Promise(resolve => setTimeout(resolve, 800));
      const dataUrl = await htmlToImage.toPng(treeRef.current, {
        backgroundColor: '#fdf6e3',
        pixelRatio: 2,
        style: { transform: 'scale(1)', transformOrigin: 'top center' }
      });
      const link = document.createElement('a');
      link.download = `phado-le-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      setScale(originalScale);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('.controls-panel')) return;
    
    setIsDragging(true);
    const pageX = 'touches' in e ? (e as unknown as TouchEvent).touches[0].pageX : e.pageX;
    const pageY = 'touches' in e ? (e as unknown as TouchEvent).touches[0].pageY : e.pageY;
    
    setStartX(pageX - containerRef.current.offsetLeft);
    setStartY(pageY - containerRef.current.offsetTop);
    setScrollLeft(containerRef.current.scrollLeft);
    setScrollTop(containerRef.current.scrollTop);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const pageX = 'touches' in e ? (e as unknown as TouchEvent).touches[0].pageX : e.pageX;
    const pageY = 'touches' in e ? (e as unknown as TouchEvent).touches[0].pageY : e.pageY;
    
    const x = pageX - containerRef.current.offsetLeft;
    const y = pageY - containerRef.current.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walkX;
    containerRef.current.scrollTop = scrollTop - walkY;
  };

  return (
    <div 
      ref={wrapperRef}
      className={`relative w-full overflow-hidden bg-white/60 backdrop-blur-xl rounded-[2rem] md:rounded-[3rem] border-2 border-red-900/5 shadow-2xl transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-[1000] rounded-none border-none' : 'h-[70vh] md:min-h-[850px]'} group/canvas flex flex-col`}
    >
      {isExporting && (
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn">
          <div className="bg-white p-12 rounded-[2rem] shadow-2xl border-8 border-double border-red-900 flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-red-900 border-t-gold rounded-full animate-spin"></div>
            <p className="font-black text-red-950 uppercase tracking-[0.3em] text-sm">Đang họa Phả Đồ...</p>
          </div>
        </div>
      )}

      {/* Bảng điều khiển */}
      <div className={`controls-panel absolute top-4 right-4 md:top-10 md:right-10 z-50 transition-all duration-500 flex flex-col gap-4 ${isPanelOpen ? 'w-full max-w-[calc(100%-2rem)] md:max-w-md' : 'w-12 h-12'}`}>
        <div className="flex justify-end gap-2">
           {/* Nút Toàn màn hình chỉ hiện khi mở panel hoặc ở chế độ desktop */}
           {(isPanelOpen || window.innerWidth > 768) && (
             <button 
              onClick={toggleFullScreen}
              className={`w-12 h-12 bg-white text-red-950 rounded-full flex items-center justify-center shadow-xl border border-red-900/10 hover:scale-110 active:scale-95 transition-all z-[60] ${!isPanelOpen ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100'}`}
              title={isFullscreen ? "Thoát toàn màn hình" : "Phóng toàn màn hình"}
            >
              {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0l5 0m-5 0l0 5m11 0l5-5m0 0l-5 0m5 0l0 5m-5 11l5 5m0 0l-5 0m5 0l0-5m-11 0l-5 5m0 0l5 0m-5 0l0-5" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              )}
            </button>
           )}
          <button 
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className={`w-12 h-12 bg-red-950 text-gold rounded-full flex items-center justify-center shadow-2xl transition-all border border-gold/30 hover:scale-110 active:scale-95 z-[60]`}
            title={isPanelOpen ? "Thu gọn" : "Công cụ"}
          >
            {isPanelOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            )}
          </button>
        </div>

        {/* Nội dung bảng điều khiển */}
        <div className={`bg-white/95 backdrop-blur-2xl shadow-2xl rounded-[2rem] border border-red-900/10 p-4 md:p-8 flex flex-col gap-6 transition-all duration-500 overflow-hidden ${isPanelOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}>
          <div className="space-y-3">
            <h5 className="text-[10px] font-black uppercase text-red-950 tracking-[0.2em]">Tìm kiếm nhanh</h5>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Tên thành viên..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-red-50/50 border-2 border-red-900/5 focus:border-red-900/20 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-red-950 outline-none transition-all"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-900/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-[10px] font-black uppercase text-red-950 tracking-[0.2em]">Tỉ lệ hiển thị</h5>
            <div className="flex items-center gap-4 bg-red-950/5 p-2 rounded-2xl">
              <button onClick={handleZoomOut} className="w-10 h-10 flex items-center justify-center bg-white text-red-900 rounded-xl shadow-md hover:bg-red-50 transition-all active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
              </button>
              <div className="flex-1 text-center font-black text-xs text-red-950">{Math.round(scale * 100)}%</div>
              <button onClick={handleZoomIn} className="w-10 h-10 flex items-center justify-center bg-white text-red-900 rounded-xl shadow-md hover:bg-red-50 transition-all active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </button>
              <button onClick={handleResetView} className="w-10 h-10 flex items-center justify-center bg-red-900 text-gold rounded-xl shadow-md hover:bg-red-800 transition-all active:scale-90" title="Căn giữa phả đồ">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>
            <p className="text-[9px] text-gray-400 text-center font-medium italic">Lăn chuột hoặc dùng 2 ngón tay để zoom</p>
          </div>

          <div className="space-y-3 pt-2 border-t border-red-100">
            <h5 className="text-[10px] font-black uppercase text-red-950 tracking-[0.2em]">Xuất dữ liệu</h5>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleExportPNG} disabled={isExporting} className="bg-red-50 text-red-800 px-4 py-3 rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2 group font-black text-[10px] uppercase">
                🖼️ Ảnh PNG
              </button>
              <button onClick={handleExportJSON} className="bg-blue-50 text-blue-800 px-4 py-3 rounded-2xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase">
                💾 Data JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-full flex-1 overflow-auto pt-20 md:pt-32 pb-64 md:pb-96 scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isFullscreen ? 'bg-[#fdf6e3]' : ''}`}
      >
        <div 
          ref={treeRef}
          style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
          className="inline-block min-w-full px-[100vw] md:px-[150vw]"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 opacity-5 pointer-events-none">
             <span className="text-[200px] md:text-[300px]">🌸</span>
          </div>
          
          <div className="flex justify-center w-full">
            <MemberNode 
              member={root} 
              isAdmin={isAdmin} 
              searchQuery={searchQuery}
              onEdit={onEditMember} 
              onAddChild={onAddChild} 
            />
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md border-t border-red-900/5 px-6 py-3 flex justify-between items-center text-[10px] font-bold text-red-950/40">
        <div className="flex gap-4">
          <span>{isFullscreen ? 'Đang ở chế độ Toàn màn hình (Esc để thoát)' : 'Kéo để di chuyển'}</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">Lăn chuột/2 ngón tay để Zoom</span>
        </div>
        <div>
          Gia Tộc Họ Lê © 2024
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;
