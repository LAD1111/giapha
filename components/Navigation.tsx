
import React from 'react';
import { AppSection } from '../types';

interface NavigationProps {
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeSection, onSectionChange }) => {
  return (
    <div className="flex flex-wrap justify-center gap-6 py-6">
      {Object.values(AppSection).map((section) => (
        <button
          key={section}
          onClick={() => onSectionChange(section)}
          className={`
            px-10 py-5 text-sm font-black transition-all duration-500 transform
            shadow-traditional group relative overflow-hidden
            ${activeSection === section 
              ? 'bg-red-900 text-gold scale-105 z-10' 
              : 'bg-white text-red-950 hover:bg-red-50 hover:-translate-y-1'}
            rounded-2xl border-2 ${activeSection === section ? 'border-gold' : 'border-red-900/5'}
          `}
        >
          {/* Tết Ornament */}
          {activeSection === section && (
            <div className="absolute top-0 right-0 p-1 animate-pulse">
               <span className="text-[10px]">🌸</span>
            </div>
          )}
          
          <span className={`relative z-10 uppercase tracking-[0.2em] ${activeSection === section ? 'drop-shadow-sm' : ''}`}>
            {section}
          </span>
          
          {/* Hover Effect */}
          <div className={`absolute inset-0 bg-gold transition-transform duration-500 origin-left scale-x-0 group-hover:scale-x-100 opacity-10 -z-10`}></div>
        </button>
      ))}
    </div>
  );
};

export default Navigation;
