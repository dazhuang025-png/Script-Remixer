import React from 'react';
import { DirectorProfile, DirectorStyle } from '../types';
import { Film, Clock, Building2, Laugh, CheckCircle2 } from 'lucide-react';

interface DirectorCardProps {
  director: DirectorProfile;
  isSelected: boolean;
  onSelect: (id: DirectorStyle) => void;
}

const DirectorCard: React.FC<DirectorCardProps> = ({ director, isSelected, onSelect }) => {
  const IconComponent = () => {
    switch (director.id) {
      case DirectorStyle.ANG_LEE: return <Film className="w-5 h-5" />;
      case DirectorStyle.WONG_KAR_WAI: return <Clock className="w-5 h-5" />;
      case DirectorStyle.EDWARD_YANG: return <Building2 className="w-5 h-5" />;
      case DirectorStyle.STEPHEN_CHOW: return <Laugh className="w-5 h-5" />;
      default: return <Film className="w-5 h-5" />;
    }
  };

  return (
    <button
      onClick={() => onSelect(director.id)}
      className={`group relative flex flex-col items-start p-5 rounded-xl border transition-all duration-200 w-full text-left overflow-hidden
        ${isSelected 
          ? 'bg-white border-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500' 
          : 'bg-white border-stone-200 hover:border-amber-300 hover:shadow-md'
        }
      `}
    >
      {/* Background Gradient Mesh (Very subtle in light mode) */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${director.color} opacity-20`} />
      
      {isSelected && (
        <div className="absolute top-3 right-3 text-amber-600 animate-in zoom-in duration-200">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      )}

      <div className={`mb-3 p-2.5 rounded-lg z-10 transition-colors ${isSelected ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500 group-hover:bg-white group-hover:text-amber-600'}`}>
        <IconComponent />
      </div>

      <h3 className="text-lg font-bold text-stone-900 mb-1 font-serif-sc z-10">{director.name}</h3>
      <p className="text-sm text-stone-500 mb-4 line-clamp-2 leading-relaxed z-10">
        {director.description}
      </p>

      <div className="flex flex-wrap gap-2 mt-auto z-10">
        {director.keywords.map((kw) => (
          <span 
            key={kw} 
            className="text-xs px-2 py-1 rounded-md bg-stone-100 border border-stone-200 text-stone-600"
          >
            {kw}
          </span>
        ))}
      </div>
    </button>
  );
};

export default DirectorCard;