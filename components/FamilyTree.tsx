
import React, { useState, useRef, useEffect } from 'react';
import { FamilyMember } from '../types';
import * as htmlToImage from 'https://esm.sh/html-to-image';

interface MemberNodeProps {
  member: FamilyMember;
  isAdmin: boolean;
  onEdit?: (member: FamilyMember) => void;
  onAddChild?: (parent: FamilyMember) => void;
}

const MemberNode: React.FC<MemberNodeProps> = ({ member, isAdmin, onEdit, onAddChild }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = member.children && member.children.length > 0;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const isCompact = member.generation >= 4;
  const isGen1To2 = member.generation === 1;

  const renderVerticalName = (name: string) => {
    return name.split(' ').map((word, i) => (
      <span key={i} className="block leading-tight">{word}</span>
    ));
  };

  return (
    <div className="flex flex-col items-center transition-all duration-500">
      <div className="relative group flex flex-col items-center justify-center">
        <div className={`
          relative z-10 transition-all duration-500 transform group-hover:-translate-y-2
          ${isCompact 
            ? 'w-14 p-3 rounded-2xl border-2 bg-white shadow-xl' 
            : 'w-60 p-6 rounded-[2rem] border-4 bg-white shadow-2xl'
          }
          ${member.isMale 
            ? (isCompact ? 'border-red-100' : 'border-red-900/10') 
            : (isCompact ? 'border-red-100' : 'border-red-900/10')
          }
          ${isGen1To2 ? 'ring-8 ring-red-900/5 ring-offset-4 border-red-900 bg-red-50/50' : ''}
        `}>
          {/* Trang trí Tết mini cho thẻ */}
          {isGen1To2 && (
            <div className="absolute -top-4 -right-4 text-3xl animate-bounce">🧧</div>
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
            ${isCompact ? 'text-[12px] leading-tight py-2' : (isGen1To2 ? 'text-3xl' : 'text-xl')}
          `}>
            {isCompact ? renderVerticalName(member.name) : member.name}
          </div>

          {!isCompact ? (
            <>
              {(member.birthDate || member.deathDate) && (
                <div className="text-[11px] text-red-900/40 font-black italic mt-1 uppercase tracking-widest">
                  {member.birthDate || '...'}
                </div>
              )}
              <div className={`text-[10px] font-black uppercase tracking-[0.3em] rounded-full py-1 mt-4 ${isGen1To2 ? 'bg-red-900 text-gold px-6 shadow-lg' : 'bg-red-50 text-red-900/60'}`}>
                {isGen1To2 ? 'Cụ Tổ' : `Đời ${member.generation}`}
              </div>
            </>
          ) : (
            member.birthDate && (
              <div className="text-[9px] text-red-900/30 font-bold mt-2 border-t border-red-100 pt-2">
                {member.birthDate.split('-')[0].trim().slice(-2)}
              </div>
            )
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
          isCompact ? (
            <div className="mt-2 w-14 p-2 border-2 border-dashed border-red-100 bg-white/50 rounded-2xl text-[10px] text-red-800 text-center font-bold leading-tight shadow-sm">
              {renderVerticalName(member.spouseName)}
            </div>
          ) : (
            <div className="mt-3 p-5 rounded-[1.8rem] border-[3px] border-dashed border-red-900/5 bg-red-50/20 w-60 text-center shadow-md">
               <div className="font-bold text-red-900/80 text-lg font-traditional truncate">{member.spouseName}</div>
               <div className="text-[9px] text-red-900/30 italic font-black uppercase tracking-[0.2em] mt-1">Phối ngẫu</div>
            </div>
          )
        )}

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
        <div className="relative mt-16 animate-fadeIn w-full flex flex-col items-center">
          <div className={`absolute top-[-64px] left-1/2 -translate-x-1/2 bg-red-900/20 -z-10 w-[4px] h-[64px] ${isGen1To2 ? 'w-[6px] bg-red-900/40' : ''}`} />
          <div className="flex flex-row justify-center relative pt-0">
             {member.children?.map((child, index) => {
                const isLast = index === (member.children?.length ?? 0) - 1;
                const childIsCompact = child.generation >= 4;
                return (
                  <div key={child.id} className={`relative flex flex-col items-center ${childIsCompact ? 'px-2' : 'px-12'}`}>
                     {member.children && member.children.length > 1 && (
                        <div className={`
                          absolute top-0 h-[4px] bg-red-900/20
                          ${index === 0 ? 'left-1/2 right-0' : isLast ? 'left-0 right-1/2' : 'left-0 right-0'}
                        `}></div>
                     )}
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[4px] h-8 bg-red-900/20 -z-10"></div>
                     <div className="mt-8">
                       <MemberNode member={child} isAdmin={isAdmin} onEdit={onEdit} onAddChild={onAddChild} />
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
  const containerRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.2));
  const handleResetZoom = () => setScale(0.7);

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
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setStartY(e.pageY - containerRef.current.offsetTop);
    setScrollLeft(containerRef.current.scrollLeft);
    setScrollTop(containerRef.current.scrollTop);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const y = e.pageY - containerRef.current.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walkX;
    containerRef.current.scrollTop = scrollTop - walkY;
  };

  return (
    <div className="relative w-full overflow-hidden bg-white/60 backdrop-blur-xl rounded-[3rem] border-2 border-red-900/5 shadow-2xl min-h-[900px] group/canvas">
      
      {isExporting && (
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn">
          <div className="bg-white p-12 rounded-[2rem] shadow-2xl border-8 border-double border-red-900 flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-red-900 border-t-gold rounded-full animate-spin"></div>
            <p className="font-black text-red-950 uppercase tracking-[0.3em] text-sm">Đang họa Phả Đồ...</p>
          </div>
        </div>
      )}

      {/* Controls Container */}
      <div className="absolute top-10 right-10 z-50 flex flex-col gap-6">
        <div className="bg-red-950/90 backdrop-blur-xl shadow-2xl rounded-3xl p-3 border border-gold/30 flex flex-col gap-3">
          <button onClick={handleZoomIn} className="w-12 h-12 flex items-center justify-center bg-white/10 text-gold hover:bg-gold hover:text-red-950 rounded-2xl transition-all shadow-lg active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          </button>
          <div className="text-center font-black text-[10px] text-gold/80 border-y border-gold/10 py-2">{Math.round(scale * 100)}%</div>
          <button onClick={handleZoomOut} className="w-12 h-12 flex items-center justify-center bg-white/10 text-gold hover:bg-gold hover:text-red-950 rounded-2xl transition-all shadow-lg active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
          </button>
          <button onClick={handleResetZoom} className="w-12 h-12 flex items-center justify-center bg-white/10 text-gold hover:bg-gold hover:text-red-950 rounded-2xl transition-all shadow-lg active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>

        {isAdmin && (
          <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl border border-red-900/5 shadow-2xl flex flex-col gap-4 animate-fadeIn">
            <h5 className="text-[10px] font-black uppercase text-red-950 tracking-[0.2em] border-b border-red-100 pb-3 mb-1">Xuất phả đồ</h5>
            <button onClick={handleExportPNG} disabled={isExporting} className="bg-red-50 text-red-800 px-5 py-3 rounded-2xl hover:bg-red-100 transition-all flex items-center justify-between group font-bold text-xs">
              <span>Ảnh PNG</span>
              <span className="text-lg">🖼️</span>
            </button>
            <button onClick={handleExportJSON} className="bg-blue-50 text-blue-800 px-5 py-3 rounded-2xl hover:bg-blue-100 transition-all flex items-center justify-between font-bold text-xs">
              <span>Data JSON</span>
              <span className="text-lg">💾</span>
            </button>
          </div>
        )}
      </div>

      <div 
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        className={`w-full h-full overflow-auto pt-32 pb-96 px-[80rem] scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div 
          ref={treeRef}
          style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
          className="inline-block p-20"
        >
          {/* Tết Decoration on Tree background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 opacity-10">
             <span className="text-[200px]">🌸</span>
          </div>
          
          <MemberNode member={root} isAdmin={isAdmin} onEdit={onEditMember} onAddChild={onAddChild} />
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;
