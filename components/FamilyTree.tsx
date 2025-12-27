
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { FamilyMember, Spouse } from '../types';
import * as htmlToImage from 'https://esm.sh/html-to-image';

interface MemberNodeProps {
  member: FamilyMember;
  isAdmin: boolean;
  searchQuery: string;
  onEdit?: (member: FamilyMember) => void;
  onDelete?: (id: string) => void;
  onAddChild?: (parent: FamilyMember) => void;
}

const MemberNode: React.FC<MemberNodeProps> = ({ member, isAdmin, searchQuery, onEdit, onDelete, onAddChild }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = member.children && member.children.length > 0;

  // Combine legacy spouse and multi-spouses
  const allSpouses = useMemo(() => {
    const list: Partial<Spouse>[] = [...(member.spouses || [])];
    if (member.spouseName && !list.some(s => s.name === member.spouseName)) {
      list.unshift({ id: 'legacy', name: member.spouseName, deathDate: member.spouseDeathDate });
    }
    return list;
  }, [member.spouses, member.spouseName, member.spouseDeathDate]);

  // Find other parent name for visualization
  const otherParentName = useMemo(() => {
    if (!member.otherParentId) return null;
    // We need to look at the parent's spouses, but since we are at the child node, 
    // the parent object isn't directly passed here. 
    // This is a limitation of the current prop structure.
    // For now, we will assume it's stored in a way we can reference if we passed the parent.
    return null; 
  }, [member.otherParentId]);

  const containsMatch = useMemo(() => {
    if (!searchQuery) return false;
    const q = searchQuery.toLowerCase();
    
    const checkNode = (node: FamilyMember): boolean => {
      if (node.name.toLowerCase().includes(q)) return true;
      if (node.spouses?.some(s => s.name.toLowerCase().includes(q))) return true;
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

  const renderVerticalName = (name: string) => {
    return name.split(' ').map((word, i) => (
      <span key={i} className="block leading-tight">{word}</span>
    ));
  };

  const nameFontSizeClass = isCompact 
    ? 'text-[13px] leading-tight py-1' 
    : (isGen1To2 ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl');

  return (
    <div className="flex flex-col items-center transition-all duration-500 w-full">
      <div className="relative group flex flex-col items-center justify-center">
        <div className="flex flex-row items-start gap-2 relative z-10">
          {/* Main Member Node */}
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

            {isAdmin && (
              <div className="absolute -top-4 -left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-30">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit?.(member); }}
                  className={`bg-yellow-500 text-white rounded-full p-2 shadow-xl hover:bg-yellow-600 ${isCompact ? 'scale-75' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                </button>
                {!isGen1To2 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(confirm(`Xóa ${member.name} và toàn bộ con cháu của người này khỏi phả đồ?`)) onDelete?.(member.id); }}
                    className={`bg-red-600 text-white rounded-full p-2 shadow-xl hover:bg-red-700 ${isCompact ? 'scale-75' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </button>
                )}
              </div>
            )}

            <div className={`
              font-bold text-red-950 font-traditional text-center tracking-tight
              ${nameFontSizeClass}
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
                title="Thêm con"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
              </button>
            )}
          </div>

          {/* Multiple Spouses */}
          {allSpouses.map((spouse, idx) => {
            const isSpouseMatched = searchQuery && spouse.name?.toLowerCase().includes(searchQuery.toLowerCase());
            return (
              <div key={spouse.id || idx} className={`
                relative transition-all duration-500 transform 
                ${isCompact 
                  ? 'w-16 p-3 rounded-2xl border-2 border-dashed bg-white shadow-lg' 
                  : 'w-48 md:w-64 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-4 border-dashed bg-pink-50/20 shadow-xl'
                }
                border-pink-900/20
                ${isSpouseMatched ? 'ring-4 ring-yellow-400 border-yellow-500 scale-105 z-20 !shadow-[0_0_30px_rgba(234,179,8,0.5)]' : 'group-hover:-translate-y-1 md:group-hover:-translate-y-2'}
              `}>
                <div className={`
                  font-bold text-pink-950 font-traditional text-center tracking-tight
                  ${nameFontSizeClass}
                  ${isSpouseMatched ? 'text-yellow-700' : ''}
                `}>
                  {isCompact ? renderVerticalName(spouse.name || '') : spouse.name}
                </div>
                {!isCompact && (
                  <div className="mt-2 md:mt-4 text-center">
                    <div className="text-[8px] md:text-[9px] text-pink-900/60 font-black uppercase tracking-[0.2em]">Vợ / Chồng {allSpouses.length > 1 ? idx + 1 : ''}</div>
                    {spouse.deathDate && (
                      <div className="text-[8px] md:text-[9px] text-pink-700/60 font-bold mt-1">
                        Mất: {spouse.deathDate} (ÂL)
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
                
                // Extract current parent spouse for visual label
                const motherSpouse = allSpouses.find(s => s.id === child.otherParentId);
                
                return (
                  <div key={child.id} className={`relative flex flex-col items-center flex-1 ${childIsCompact ? 'px-1' : 'px-4 md:px-6'}`}>
                     {member.children && member.children.length > 1 && (
                        <div className={`
                          absolute top-0 h-[4px] bg-red-900/20
                          ${isFirst ? 'left-1/2 right-0' : isLast ? 'left-0 right-1/2' : 'left-0 right-0'}
                        `}></div>
                     )}
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[4px] h-6 md:h-8 bg-red-900/20 -z-10"></div>
                     
                     {/* Spouse Branch Label */}
                     {motherSpouse && !childIsCompact && (
                       <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-pink-100/80 text-pink-800 text-[6px] md:text-[8px] font-black uppercase px-2 py-0.5 rounded-full z-10 border border-pink-200 shadow-sm whitespace-nowrap">
                         Bà {motherSpouse.name || '?'}
                       </div>
                     )}

                     <div className="mt-6 md:mt-8 w-full flex justify-center">
                       <MemberNode 
                         member={child} 
                         isAdmin={isAdmin} 
                         searchQuery={searchQuery}
                         onEdit={onEdit} 
                         onDelete={onDelete}
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
  onDeleteMember: (id: string) => void;
  onAddChild: (parent: FamilyMember) => void;
}

const FamilyTree: React.FC<FamilyTreeProps> = ({ root, isAdmin, onEditMember, onDeleteMember, onAddChild }) => {
  const [scale, setScale] = useState(0.6);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const initialPinchDistRef = useRef<number | null>(null);

  const handleZoom = useCallback((delta: number, clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    const contentX = (mouseX + container.scrollLeft) / scale;
    const contentY = (mouseY + container.scrollTop) / scale;

    setScale(prevScale => {
      const newScale = Math.min(Math.max(prevScale * (1 + delta), 0.1), 3.0);
      requestAnimationFrame(() => {
        container.scrollLeft = contentX * newScale - mouseX;
        container.scrollTop = contentY * newScale - mouseY;
      });
      return newScale;
    });
  }, [scale]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      handleZoom(delta, e.clientX, e.clientY);
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [handleZoom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input')) return;
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    containerRef.current.scrollLeft -= dx;
    containerRef.current.scrollTop -= dy;
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
      initialPinchDistRef.current = dist;
    } else if (e.touches.length === 1) {
      setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
      e.preventDefault();
      const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const zoomFactor = (dist / initialPinchDistRef.current) - 1;
      handleZoom(zoomFactor * 0.5, centerX, centerY);
      initialPinchDistRef.current = dist;
    } else if (e.touches.length === 1 && isDragging && containerRef.current) {
      const touch = e.touches[0];
      const dx = touch.clientX - lastMousePos.x;
      const dy = touch.clientY - lastMousePos.y;
      containerRef.current.scrollLeft -= dx;
      containerRef.current.scrollTop -= dy;
      setLastMousePos({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchEnd = () => {
    initialPinchDistRef.current = null;
    setIsDragging(false);
  };

  const handleResetView = useCallback(() => {
    if (!containerRef.current || !treeRef.current) return;
    const isMobile = window.innerWidth < 768;
    const initialScale = isMobile ? 0.3 : 0.6;
    setScale(initialScale);
    setTimeout(() => {
      if (!containerRef.current || !treeRef.current) return;
      const cw = containerRef.current.clientWidth;
      const tw = treeRef.current.offsetWidth * initialScale;
      containerRef.current.scrollLeft = (tw - cw) / 2;
      containerRef.current.scrollTop = 0;
    }, 50);
  }, []);

  useEffect(() => {
    const timer = setTimeout(handleResetView, 300);
    return () => clearTimeout(timer);
  }, [handleResetView]);

  const toggleFullScreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
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

  return (
    <div 
      ref={wrapperRef}
      className={`relative w-full overflow-hidden bg-white/60 backdrop-blur-xl rounded-[2rem] md:rounded-[3rem] border-2 border-red-900/5 shadow-2xl transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-[1000] rounded-none border-none' : 'h-[70vh] md:min-h-[850px]'} flex flex-col`}
    >
      {isExporting && (
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn">
          <div className="bg-white p-12 rounded-[2rem] shadow-2xl border-8 border-double border-red-900 flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-red-900 border-t-gold rounded-full animate-spin"></div>
            <p className="font-black text-red-950 uppercase tracking-[0.3em] text-sm">Đang họa Phả Đồ...</p>
          </div>
        </div>
      )}

      <div className={`controls-panel absolute top-4 right-4 md:top-10 md:right-10 z-50 flex flex-col items-end gap-3`}>
        <div className="flex gap-2">
           <button onClick={toggleFullScreen} className="w-10 h-10 md:w-12 md:h-12 bg-white text-red-950 rounded-full flex items-center justify-center shadow-lg border border-red-900/10 hover:scale-110 active:scale-95 transition-all">
             {isFullscreen ? '↙️' : '↗️'}
           </button>
           <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="w-10 h-10 md:w-12 md:h-12 bg-red-950 text-gold rounded-full flex items-center justify-center shadow-lg border border-gold/30 hover:scale-110 active:scale-95 transition-all">
             {isPanelOpen ? '✖️' : '⚙️'}
           </button>
        </div>

        {isPanelOpen && (
          <div className="bg-white/95 backdrop-blur-2xl shadow-2xl rounded-3xl border border-red-900/10 p-5 w-64 md:w-72 flex flex-col gap-5 animate-fadeIn">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-red-950/40 tracking-widest">Tìm kiếm</label>
                <input type="text" placeholder="Nhập tên..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-red-50/50 border-2 border-red-900/5 rounded-xl px-4 py-2 text-sm font-bold text-red-950 outline-none" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-red-950/40 tracking-widest">Tỉ lệ: {Math.round(scale * 100)}%</label>
                <div className="flex gap-2">
                   <button onClick={() => handleZoom(-0.1, window.innerWidth/2, window.innerHeight/2)} className="flex-1 bg-red-50 text-red-900 py-2 rounded-xl font-bold hover:bg-red-100">-</button>
                   <button onClick={() => handleZoom(0.1, window.innerWidth/2, window.innerHeight/2)} className="flex-1 bg-red-50 text-red-900 py-2 rounded-xl font-bold hover:bg-red-100">+</button>
                   <button onClick={handleResetView} className="bg-red-950 text-gold px-4 rounded-xl">⟲</button>
                </div>
             </div>
             <button onClick={handleExportPNG} className="w-full bg-primary text-gold py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md">Xuất ảnh PNG</button>
          </div>
        )}
      </div>

      <div ref={containerRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className={`w-full flex-1 overflow-auto scrollbar-hide select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
        <div ref={treeRef} style={{ transform: `scale(${scale})`, transformOrigin: '0 0', width: 'fit-content', minWidth: '100%', padding: '200px 100vw' }} className="relative transition-transform duration-75 ease-out">
          <div className="flex justify-center w-full">
            <MemberNode member={root} isAdmin={isAdmin} searchQuery={searchQuery} onEdit={onEditMember} onDelete={onDeleteMember} onAddChild={onAddChild} />
          </div>
        </div>
      </div>
      <div className="bg-white/90 border-t border-red-900/5 px-6 py-2 flex justify-between items-center text-[9px] font-bold text-red-950/30 uppercase tracking-widest">
        <span>Lăn chuột hoặc Pinch để Zoom • Kéo để di chuyển • Xoá thành viên (Admin)</span>
        <span className="hidden md:block">Gia Tộc Họ Lê © 2024</span>
      </div>
    </div>
  );
};

export default FamilyTree;
