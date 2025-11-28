import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ModuleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
  disabled = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative bg-white rounded-2xl border-2 border-gray-200 
        p-8 text-left transition-all duration-300
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:border-primary-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer'
        }
      `}
    >
      {/* Ícone */}
      <div className={`
        w-16 h-16 rounded-xl mb-6 flex items-center justify-center
        ${disabled 
          ? 'bg-gray-100 text-gray-400' 
          : 'bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white'
        }
        transition-all duration-300
      `}>
        <Icon size={32} />
      </div>

      {/* Conteúdo */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed">
        {description}
      </p>

      {/* Botão de Ação */}
      <div className="mt-6 flex items-center text-primary-600 font-medium text-sm">
        Acessar Módulo
        <svg 
          className={`ml-2 w-5 h-5 transition-transform duration-300 ${
            disabled ? '' : 'group-hover:translate-x-1'
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 5l7 7-7 7" 
          />
        </svg>
      </div>
    </button>
  );
};