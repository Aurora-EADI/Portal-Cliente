'use client'
import React from 'react';
import { DocumentStatus, CompanyStatus } from '../../types';

interface BadgeProps {
  status: DocumentStatus | CompanyStatus;
  context?: 'document' | 'company';
}

export const Badge: React.FC<BadgeProps> = ({ status, context = 'document' }) => {
  let style = 'bg-gray-100 text-gray-800 border-gray-200';
  let label = status as string;

  // Check for specific statuses
  if (status === DocumentStatus.APPROVED) {
    style = 'bg-green-100 text-green-800 border-green-200';
    label = 'Doc Aprovado';
  } else if (status === CompanyStatus.ACTIVE) {
    style = 'bg-blue-100 text-blue-800 border-blue-200';
    label = 'Cadastro Ativo';
  } 
  // Handle Overlapping "PENDING"
  else if (status === DocumentStatus.PENDING || status === CompanyStatus.PENDING) {
    if (context === 'company') {
      style = 'bg-orange-100 text-orange-800 border-orange-200';
      label = 'Pendente de Acesso';
    } else {
      style = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      label = 'Aguardando Doc';
    }
  } 
  // Handle Overlapping "REJECTED"
  else if (status === DocumentStatus.REJECTED || status === CompanyStatus.REJECTED) {
    if (context === 'company') {
      style = 'bg-gray-100 text-gray-800 border-gray-200';
      label = 'Cadastro Bloqueado';
    } else {
      style = 'bg-red-100 text-red-800 border-red-200';
      label = 'Doc Reprovado';
    }
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${style}`}>
      {label}
    </span>
  );
};