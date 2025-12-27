
import React from 'react';
import { AppSection } from '../types';

interface NavigationProps {
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeSection, onSectionChange }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 py-8">
      {Object.values(AppSection).map((section) => (
        <button
          key={section}
          onClick={() => onSectionChange(section)}
          className={`
            px-8 py-3 text-lg font-bold transition-all duration-300 transform
            border-4 border-gold shadow-traditional
            ${activeSection === section 
              ? 'bg-red-800 text-yellow-300 scale-110' 
              : 'bg-white text-red-900 hover:bg-yellow-50'}
            rounded-lg
          `}
          style={{
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%)',
            clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%)'
          }}
        >
          {section}
        </button>
      ))}
    </div>
  );
};

export default Navigation;
