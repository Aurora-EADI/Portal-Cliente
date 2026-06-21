'use client';

import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';
import { formatPhone } from '@/lib/agendamento';

export interface NotificacoesFormData {
  notificarEmail: boolean;
  email: string;
  notificarWhatsapp: boolean;
  whatsapp: string;
}

interface NotificacoesStepProps {
  data: NotificacoesFormData;
  onChange: (data: NotificacoesFormData) => void;
  errors?: Partial<Record<keyof NotificacoesFormData, string>>;
  disabled?: boolean;
}

const INPUT = 'w-full py-2 px-3 border border-zinc-200 rounded-lg bg-white text-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow';
const LABEL = 'text-zinc-600 font-bold block mb-1.5 text-xs';

export function NotificacoesStep({ data, onChange, errors = {}, disabled = false }: NotificacoesStepProps) {
  const set = <K extends keyof NotificacoesFormData>(field: K) =>
    (value: NotificacoesFormData[K]) => onChange({ ...data, [field]: value });

  return (
    <fieldset disabled={disabled} className={disabled ? 'opacity-60 pointer-events-none' : ''}>
    <div className="space-y-4 max-w-lg">
      <p className="text-sm text-zinc-500">
        Configure como deseja receber notificações sobre este agendamento.
      </p>

      {/* E-mail */}
      <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={data.notificarEmail}
            onChange={e => set('notificarEmail')(e.target.checked)}
            className="w-4 h-4 accent-emerald-600 rounded"
          />
          <Mail className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-700">Notificação por E-mail</span>
        </label>

        {data.notificarEmail && (
          <div>
            <label className={LABEL}>E-mail *</label>
            <input
              type="email"
              placeholder="exemplo@empresa.com"
              value={data.email}
              onChange={e => set('email')(e.target.value)}
              className={INPUT + (errors.email ? ' border-red-400 focus:ring-red-400' : '')}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>
        )}
      </div>

      {/* WhatsApp */}
      <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={data.notificarWhatsapp}
            onChange={e => set('notificarWhatsapp')(e.target.checked)}
            className="w-4 h-4 accent-emerald-600 rounded"
          />
          <MessageCircle className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-700">Notificação por WhatsApp</span>
        </label>

        {data.notificarWhatsapp && (
          <div>
            <label className={LABEL}>WhatsApp *</label>
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              value={data.whatsapp}
              onChange={e => set('whatsapp')(formatPhone(e.target.value))}
              maxLength={15}
              className={INPUT + ' font-mono' + (errors.whatsapp ? ' border-red-400 focus:ring-red-400' : '')}
            />
            {errors.whatsapp && (
              <p className="text-xs text-red-500 mt-1">{errors.whatsapp}</p>
            )}
          </div>
        )}
      </div>
    </div>
    </fieldset>
  );
}
