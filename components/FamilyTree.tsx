
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
    <div className="flex flex-col items-center transition-all duration-300">
      <div className="relative group flex flex-col items-center justify-center">
        <div className={`
          relative z-10 transition-all duration-300 transform group-hover:-translate-y-1 shadow-xl
          ${isCompact 
            ? 'w-12 p-2 rounded-xl border-[2px] bg-white' 
            : 'w-52 p-4 rounded-2xl border-[4px] bg-blue-50 shadow-blue-900/5'
          }
          ${member.isMale 
            ? (isCompact ? 'border-blue-400' : 'bg-blue-50 border-blue-500/60') 
            : (isCompact ? 'border-pink-400' : 'bg-pink-50 border-pink-500/60')
          }
          ${isGen1To2 ? 'ring-4 ring-red-900/20 ring-offset-4 border-red-900 bg-red-50' : ''}
        `}>
          {isAdmin && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit?.(member); }}
              className={`absolute -top-3 -left-3 bg-yellow-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-md ${isCompact ? 'scale-75' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
            </button>
          )}

          <div className={`
            font-bold text-red-950 font-traditional text-center
            ${isCompact ? 'text-[11px] leading-none py-1' : (isGen1To2 ? 'text-2xl' : 'text-lg')}
          `}>
            {isCompact ? renderVerticalName(member.name) : member.name}
          </div>

          {!isCompact ? (
            <>
              {(member.birthDate || member.deathDate) && (
                <div className="text-[10px] text-gray-400 font-bold italic mt-[-2px] mb-1">
                  {member.birthDate || '...'} {member.deathDate ? `- ${member.deathDate}` : ''}
                </div>
              )}
              <div className={`text-[9px] font-black uppercase tracking-widest rounded-full py-0.5 mt-2 ${isGen1To2 ? 'bg-red-900 text-gold px-3' : 'bg-gray-100 text-gray-700'}`}>
                {isGen1To2 ? 'Cụ Tổ' : `Đời ${member.generation}`}
              </div>
            </>
          ) : (
            member.birthDate && (
              <div className="text-[8px] text-gray-400 font-bold mt-1 border-t border-gray-100 pt-1">
                {member.birthDate.split('-')[0].trim().slice(-2)}
              </div>
            )
          )}

          {isAdmin && (
            <button 
              onClick={(e) => { e.stopPropagation(); onAddChild?.(member); }}
              className={`absolute -bottom-3 -right-3 bg-green-600 text-white rounded-full p-1 shadow-lg hover:scale-110 z-30 ${isCompact ? 'scale-75' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
            </button>
          )}
        </div>

        {member.spouseName && (
          isCompact ? (
            <div className="mt-1 w-12 p-1 border border-dashed border-gray-300 bg-white rounded-lg text-[9px] text-red-800 text-center font-bold leading-tight">
              {renderVerticalName(member.spouseName)}
            </div>
          ) : (
            <div className="mt-2 p-3 rounded-xl border-[3px] border-dashed border-pink-200 bg-pink-50/30 w-52 text-center shadow-sm">
               <div className="font-bold text-red-800 text-md font-traditional truncate">{member.spouseName}</div>
               <div className="text-[9px] text-gray-400 italic font-bold uppercase">Phối ngẫu</div>
            </div>
          )
        )}

        {hasChildren && (
          <button
            onClick={toggleExpand}
            className={`
              absolute left-1/2 -translate-x-1/2 z-20 w-6 h-6 rounded-full border-2 shadow-lg flex items-center justify-center transition-all
              ${isCompact ? '-bottom-4 scale-75' : '-bottom-3'}
              ${isExpanded ? 'bg-red-900 border-white text-white' : 'bg-white border-red-900 text-red-900 rotate-180'}
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          </button>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div className="relative mt-12 animate-fadeIn w-full flex flex-col items-center">
          <div className={`absolute top-[-48px] left-1/2 -translate-x-1/2 bg-red-900 -z-10 w-[4px] h-[52px] ${isGen1To2 ? 'w-[6px] bg-red-950' : ''}`} />
          <div className="flex flex-row justify-center relative pt-0">
             {member.children?.map((child, index) => {
                const isLast = index === (member.children?.length ?? 0) - 1;
                const childIsCompact = child.generation >= 4;
                return (
                  <div key={child.id} className={`relative flex flex-col items-center ${childIsCompact ? 'px-1' : 'px-8'}`}>
                     {member.children && member.children.length > 1 && (
                        <div className={`
                          absolute top-0 h-[4px] bg-red-900
                          ${index === 0 ? 'left-1/2 right-0' : isLast ? 'left-0 right-1/2' : 'left-0 right-0'}
                        `}></div>
                     )}
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[4px] h-6 bg-red-900 -z-10"></div>
                     <div className="mt-6">
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
  const [scale, setScale] = useState(0.8);
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
  const handleResetZoom = () => setScale(0.8);

  const flattenTree = (node: FamilyMember, parentId: string | null = null): any[] => {
    const { children, ...rest } = node;
    let rows = [{ ...rest, parentId }];
    if (children) {
      children.forEach(child => {
        rows = [...rows, ...flattenTree(child, node.id)];
      });
    }
    return rows;
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(root, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gia-pha-ho-le-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const flatData = flattenTree(root);
    const headers = ['id', 'name', 'generation', 'isMale', 'birthDate', 'deathDate', 'spouseName', 'parentName', 'parentId'];
    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...flatData.map(row => headers.map(header => {
        const value = row[header] !== undefined ? row[header] : '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gia-pha-ho-le-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPNG = async () => {
    if (!treeRef.current) return;
    
    try {
      setIsExporting(true);
      const originalScale = scale;
      setScale(1);
      
      // Chờ cho DOM ổn định sau khi đổi scale
      await new Promise(resolve => setTimeout(resolve, 500));

      const dataUrl = await htmlToImage.toPng(treeRef.current, {
        backgroundColor: '#fdf6e3',
        quality: 1,
        pixelRatio: 2,
        // Bỏ qua các stylesheet gây lỗi truy cập rules (như một số widget ngoài hoặc extension)
        filter: (node) => {
          if (node.tagName === 'LINK' && (node as HTMLLinkElement).rel === 'stylesheet') {
            // Kiểm tra xem có thuộc tính crossorigin không, nếu không có thể gây lỗi rules
            return (node as HTMLLinkElement).crossOrigin !== null;
          }
          return true;
        },
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top center'
        }
      });

      const link = document.createElement('a');
      link.download = `phado-ho-le-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      
      setScale(originalScale);
    } catch (err) {
      console.error('Lỗi xuất ảnh:', err);
      alert('Có lỗi xảy ra khi xuất ảnh. Vui lòng đảm bảo các font chữ đã tải xong và thử lại.');
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

  const onMouseUpOrLeave = () => setIsDragging(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        setScale(prev => Math.min(Math.max(prev + delta, 0.2), 2.0));
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-[#fdf6e3]/60 backdrop-blur-md rounded-3xl border-2 border-red-900/10 shadow-2xl min-h-[800px]">
      
      {/* Export Loading State */}
      {isExporting && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl shadow-2xl border-4 border-gold flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-red-900 border-t-gold rounded-full animate-spin"></div>
            <p className="font-bold text-red-900 uppercase tracking-widest text-sm">Đang tạo hình ảnh...</p>
          </div>
        </div>
      )}

      {/* Controls Container */}
      <div className="absolute top-6 right-6 z-50 flex flex-col gap-4">
        {/* Zoom Controls */}
        <div className="bg-red-950/90 backdrop-blur-lg shadow-2xl rounded-2xl p-2 border border-gold/30 flex flex-col gap-2">
          <button onClick={handleZoomIn} className="w-10 h-10 flex items-center justify-center bg-white/10 text-gold hover:bg-gold hover:text-red-950 rounded-xl transition-all shadow-md active:scale-90" title="Phóng to">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          </button>
          <div className="text-center font-bold text-[10px] text-gold/90 border-y border-gold/10 py-1">{Math.round(scale * 100)}%</div>
          <button onClick={handleZoomOut} className="w-10 h-10 flex items-center justify-center bg-white/10 text-gold hover:bg-gold hover:text-red-950 rounded-xl transition-all shadow-md active:scale-90" title="Thu nhỏ">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
          </button>
          <button onClick={handleResetZoom} className="w-10 h-10 flex items-center justify-center bg-white/10 text-gold hover:bg-gold hover:text-red-950 rounded-xl transition-all shadow-md active:scale-90" title="Đặt lại">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>

        {/* Admin Export Controls */}
        {isAdmin && (
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl border border-gold/30 shadow-xl flex flex-col gap-3 animate-fadeIn">
            <h5 className="text-[10px] font-black uppercase text-red-900 border-b border-red-900/10 pb-2 mb-1 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Xuất dữ liệu
            </h5>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleExportPNG}
                disabled={isExporting}
                className="text-[10px] font-bold bg-red-50 text-red-800 px-3 py-2 rounded-lg hover:bg-red-100 border border-red-200 transition-all flex items-center justify-between group"
              >
                <span>Xuất Hình Ảnh (PNG)</span>
                <span className="opacity-40 group-hover:opacity-100">🖼️</span>
              </button>
              <button 
                onClick={handleExportJSON}
                className="text-[10px] font-bold bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 border border-blue-200 transition-all flex items-center justify-between"
              >
                <span>Định dạng JSON</span>
                <span className="opacity-40">.json</span>
              </button>
              <button 
                onClick={handleExportCSV}
                className="text-[10px] font-bold bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 border border-green-200 transition-all flex items-center justify-between"
              >
                <span>Định dạng CSV (Excel)</span>
                <span className="opacity-40">.csv</span>
              </button>
            </div>
          </div>
        )}

        <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl border border-red-900/10 shadow-xl hidden md:block">
          <h5 className="text-[10px] font-black uppercase text-red-900 mb-2">📊 Tối ưu không gian</h5>
          <div className="space-y-1 text-[9px] text-gray-700 font-bold">
            <p className="flex items-center gap-2">Đời 1-3: <span className="text-blue-700">Thẻ rộng</span></p>
            <p className="flex items-center gap-2">Đời 4+: <span className="text-red-700">Thẻ hẹp (Tên dọc)</span></p>
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUpOrLeave}
        onMouseLeave={onMouseUpOrLeave}
        className={`w-full h-full overflow-auto pt-20 pb-60 px-[60rem] scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div 
          ref={treeRef}
          style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'top center',
            transition: (isDragging || isExporting) ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}
          className="inline-block p-20"
        >
          <MemberNode 
            member={root} 
            isAdmin={isAdmin} 
            onEdit={onEditMember} 
            onAddChild={onAddChild} 
          />
        </div>
      </div>
      
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#8b0000 0.8px, transparent 0.8px)', backgroundSize: '50px 50px' }}></div>
    </div>
  );
};

export default FamilyTree;
