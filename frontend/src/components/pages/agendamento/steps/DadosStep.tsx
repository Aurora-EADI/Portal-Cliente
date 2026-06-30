'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, X, UserPlus, Truck, ChevronLeft, ChevronRight, Clock, Users, CheckCircle2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAgendamento } from '@/context/AgendamentoContext';
import { useAuthContext } from '@/context/AuthContext';
import { Motorista, Veiculo, Transportadora } from '@/types/agendamento';
import { formatCPF, formatPhone, formatPlaca, formatCNPJ, gerarSlotsDeJanela } from '@/lib/agendamento';
import { JanelaAtendimento } from '@/types/agendamento';

export interface DadosFormData {
  operacao: string;
  subOperacao: string;
  cargaEspecial: boolean;
  servicos: string[];
  tipoVeiculo: string;
  dataAgendamento: string;
  inicio: string;
  cpfMotorista: string;
  nomeMotorista: string;
  transportadora: string;
  empresa: string;
  awbMawb: string[];
  di: string[];
  dta: string[];
  hawb: string[];
  numeroVoo: string;
  placaVeiculo: string;
  volumes: string;
  peso: string;
  consignatario: string;
  observacoes: string;
  container?: string;
}

interface DadosStepProps {
  data: DadosFormData;
  onChange: (data: DadosFormData) => void;
  disabled?: boolean;
}

const OPERACOES = ['Importação', 'Exportação', 'Cabotagem', 'Nacional'];
const SUB_OPERACOES: Record<string, string[]> = {
  Importação: ['Aéreo', 'Marítimo', 'Terrestre'],
  Exportação: ['Aéreo', 'Marítimo', 'Terrestre'],
  Cabotagem:  ['Carga Geral', 'FCL', 'LCL'],
  Nacional:   ['Carga Geral', 'Carga Especial'],
};
const MODALIDADE_TO_SUB: Record<string, string> = {
  MAR: 'Marítimo', AER: 'Aéreo', FER: 'Terrestre', ROD: 'Terrestre',
};

function parseContainers(containerStr: string): string[] {
  if (!containerStr) return [];
  return containerStr.split('/').map(c => c.trim()).filter(Boolean);
}
const TIPOS_VEICULO = ['BAU','BESTA','CACAMBA','CAMINHAO','CAMINHAO MUCK','CAMINHAO PIPA','CAMINHAO TANQUE','CARRETA','CARRETA CEGONHA','CARRETA DE PASSEIO','CARRO FORTE','CAVALO','DOBLO','FIORINO','FURGAO','GUINDASTE','KOMBI','MOTO','ONIBUS','PERUA','PICKUP','PLATAFORMA','PRANCHA','TROLE','VAN'];

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAY_HEADERS = ['Do','2ª','3ª','4ª','5ª','6ª','Sá'];

function MultiInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft('');
  };

  const remove = (idx: number) => onChange(values.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="flex gap-1.5">
        <input
          type="text"
          placeholder={placeholder}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          className={INPUT + ' flex-1'}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="px-2.5 py-2 border border-zinc-200 rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {values.map((v, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-700 text-[11px] font-mono px-2 py-1 rounded-md border border-zinc-200">
              {v}
              <button type="button" onClick={() => remove(i)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstWeekday(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function DateTimePicker({ date, horario, onDateChange, onHorarioChange, busySlots, janelas }: {
  date: string;
  horario: string;
  onDateChange: (d: string) => void;
  onHorarioChange: (h: string) => void;
  busySlots: Record<string, number>;
  janelas: JanelaAtendimento[];
}) {
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const [sel] = date ? date.split('T') : [''];
  const selParts = sel ? sel.split('-').map(Number) : [today.getFullYear(), today.getMonth() + 1, today.getDate()];
  const [cm, setCm] = useState({ y: selParts[0], m: selParts[1] - 1 });

  const dynamicSlots = useMemo(() => {
    if (janelas.length) return janelas.flatMap(j => gerarSlotsDeJanela(j)).sort((a, b) => a.horario.localeCompare(b.horario));
    return Array.from({ length: 25 }, (_, i) => {
      const h = Math.floor(i / 2) + 6;
      const m = i % 2 === 0 ? '00' : '30';
      return { horario: `${String(h).padStart(2, '0')}:${m}`, descricao: 'Geral', vagasTotais: 3, janelaId: 'default' };
    }).filter(s => Number(s.horario.split(':')[0]) <= 18);
  }, [janelas]);

  const totalDays = daysInMonth(cm.y, cm.m);
  const offset = firstWeekday(cm.y, cm.m);
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d: number) => toDateStr(cm.y, cm.m, d) === todayStr;
  const isSel = (d: number) => toDateStr(cm.y, cm.m, d) === date;
  const isPast = (d: number) => toDateStr(cm.y, cm.m, d) < todayStr;
  const isWeekend = (d: number) => [0, 6].includes(new Date(cm.y, cm.m, d).getDay());

  return (
    <div className="border border-zinc-200 rounded-xl bg-white overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Calendar */}
        <div className="p-4 border-b lg:border-b-0 lg:border-r border-zinc-100 lg:w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-800">{MONTH_NAMES[cm.m]} {cm.y}</span>
            <div className="flex gap-0.5">
              <button type="button" onClick={() => setCm(({ y, m }) => { const d = new Date(y, m - 1); return { y: d.getFullYear(), m: d.getMonth() }; })} className="p-1 rounded hover:bg-zinc-100">
                <ChevronLeft className="w-3.5 h-3.5 text-zinc-500" />
              </button>
              <button type="button" onClick={() => setCm(({ y, m }) => { const d = new Date(y, m + 1); return { y: d.getFullYear(), m: d.getMonth() }; })} className="p-1 rounded hover:bg-zinc-100">
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {DAY_HEADERS.map(h => (
              <div key={h} className="text-center text-[10px] font-semibold text-zinc-400 py-1">{h}</div>
            ))}
            {cells.map((day, i) => {
              const wknd = day ? isWeekend(day) : false;
              const past = day ? isPast(day) : false;
              const disabled = !day || past || wknd;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => day && onDateChange(toDateStr(cm.y, cm.m, day))}
                  className={[
                    'relative mx-auto w-9 h-9 flex flex-col items-center justify-center rounded-full text-xs transition-all',
                    !day ? 'invisible' : '',
                    wknd ? 'text-zinc-300 cursor-default' : '',
                    past && !wknd ? 'text-zinc-300 cursor-not-allowed' : '',
                    day && !disabled && isToday(day) && !isSel(day) ? 'bg-emerald-500 text-white font-bold' : '',
                    day && !disabled && isSel(day) ? 'bg-[#ED6A23] text-white font-bold shadow-md shadow-orange-200' : '',
                    day && !disabled && !isToday(day) && !isSel(day) ? 'text-zinc-700 hover:bg-zinc-100 cursor-pointer' : '',
                  ].join(' ')}
                >
                  <span className="leading-none">{day}</span>
                  {day && !disabled && !isSel(day) && !isToday(day) && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] text-zinc-400">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Disponível</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#ED6A23] inline-block" /> Selecionado</span>
          </div>
        </div>

        {/* Time slots */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-3 border-b border-zinc-100">
            {date ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-800">
                    {date.split('-').reverse().join('/')}
                  </p>
                  <p className="text-[10px] text-zinc-400">{dynamicSlots.length} horários disponíveis</p>
                </div>
                {janelas.length > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <Users className="w-3 h-3" />
                    {dynamicSlots.reduce((a, s) => a + s.vagasTotais, 0)} vagas/dia
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs font-semibold text-zinc-500">← Selecione uma data</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3" style={{ maxHeight: 280 }}>
            {!date ? (
              <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
                <Clock className="w-8 h-8 text-zinc-200" />
                <p className="text-xs text-zinc-400">Selecione uma data no calendário</p>
              </div>
            ) : dynamicSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center gap-1">
                <Clock className="w-6 h-6 text-zinc-200" />
                <p className="text-xs text-zinc-400">Sem horários configurados</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {dynamicSlots.map(slot => {
                  const count = busySlots[slot.horario] ?? 0;
                  const left = Math.max(0, slot.vagasTotais - count);
                  const full = left === 0;
                  const selected = horario === slot.horario;
                  const isDateToday = date === todayStr;
                  const nowMinutes = today.getHours() * 60 + today.getMinutes();
                  const [hh, mm] = slot.horario.split(':').map(Number);
                  const slotPast = isDateToday && (hh * 60 + mm) <= nowMinutes;
                  const disabled = slotPast || full;

                  return (
                    <button
                      key={`${slot.horario}-${slot.janelaId}`}
                      type="button"
                      disabled={disabled}
                      onClick={() => onHorarioChange(slot.horario)}
                      className={[
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all',
                        disabled ? 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed' : '',
                        selected ? 'border-[#ED6A23] bg-[#ED6A23] text-white shadow-sm' : '',
                        !disabled && !selected ? 'border-zinc-200 bg-white text-zinc-700 hover:border-sky-300 hover:bg-sky-50 active:scale-[0.98]' : '',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-2.5">
                        {selected
                          ? <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                          : <Clock className={`w-3.5 h-3.5 shrink-0 ${disabled ? 'text-zinc-300' : 'text-zinc-400'}`} />
                        }
                        <span className={`font-mono font-bold text-sm tabular-nums ${selected ? 'text-white' : disabled ? 'text-zinc-300' : 'text-zinc-800'}`}>
                          {slot.horario}
                        </span>
                        {slot.descricao !== 'Geral' && (
                          <span className={`text-[10px] ${selected ? 'text-orange-100' : disabled ? 'text-zinc-300' : 'text-zinc-400'}`}>
                            {slot.descricao}
                          </span>
                        )}
                      </div>
                      <div>
                        {full ? (
                          <span className="text-[9px] font-bold uppercase text-zinc-300 tracking-wide">Lotado</span>
                        ) : slotPast ? (
                          <span className="text-[9px] font-bold uppercase text-zinc-300 tracking-wide">Passado</span>
                        ) : selected ? (
                          <span className="text-[10px] font-bold text-orange-100">Selecionado</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className="flex gap-0.5">
                              {Array.from({ length: slot.vagasTotais }, (_, i) => (
                                <span
                                  key={i}
                                  className={`w-1.5 h-1.5 rounded-full ${i < left ? (left === 1 ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-zinc-200'}`}
                                />
                              ))}
                            </div>
                            <span className={`text-[10px] font-semibold ${left === 1 ? 'text-amber-500' : 'text-emerald-500'}`}>
                              {left}/{slot.vagasTotais}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const INPUT = 'w-full py-2 px-3 border border-zinc-200 rounded-lg bg-white text-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow';
const INPUT_ERR = 'w-full py-2 px-3 border border-red-400 rounded-lg bg-white text-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-shadow';
const LABEL = 'text-zinc-600 font-bold block mb-1.5 text-xs';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {children}
    </div>
  );
}

function FieldError({ msg, onCadastrar, label }: { msg: string; onCadastrar?: () => void; label?: string }) {
  return (
    <div className="mt-1 flex items-center gap-2">
      <p className="text-xs text-red-500 flex-1">{msg}</p>
      {onCadastrar && (
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); onCadastrar(); }}
          className="text-[11px] font-bold text-[#ED6A23] hover:underline whitespace-nowrap flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />{label ?? 'Cadastrar'}
        </button>
      )}
    </div>
  );
}

function SuggestionList({ items, onSelect }: { items: Motorista[]; onSelect: (m: Motorista) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-1 border border-zinc-200 rounded-lg shadow-sm bg-white overflow-hidden">
      {items.slice(0, 5).map(m => (
        <button
          key={m.id}
          type="button"
          onMouseDown={e => { e.preventDefault(); onSelect(m); }}
          className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 transition-colors flex items-center gap-2 border-b border-zinc-100 last:border-0"
        >
          <span className="font-mono text-zinc-500">{m.cpf}</span>
          <span className="text-zinc-300">—</span>
          <span className="text-zinc-800 font-semibold truncate">{m.nome}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Modal Cadastro Motorista ──────────────────────────────────────────────
function ModalMotorista({
  onClose,
  onSaved,
  motoristas,
  handleAddMotorista,
}: {
  onClose: () => void;
  onSaved: (m: Motorista) => void;
  motoristas: Motorista[];
  handleAddMotorista: (m: Motorista) => void;
}) {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnh, setCnh] = useState('');
  const [telefone, setTelefone] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const validate = () => {
    const errs: string[] = [];
    if (nome.trim().length < 5) errs.push('Nome deve ter ao menos 5 caracteres.');
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) errs.push('CPF inválido.');
    if (motoristas.some(m => m.cpf.replace(/\D/g, '') === digits)) errs.push('CPF já cadastrado.');
    if (cnh.replace(/\D/g, '').length !== 11) errs.push('CNH inválida (11 dígitos).');
    if (telefone.replace(/\D/g, '').length < 10) errs.push('Telefone inválido.');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const novo: Motorista = { id: `mot-${Date.now()}`, nome: nome.trim(), cpf, cnh, telefone };
    handleAddMotorista(novo);
    onSaved(novo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#ED6A23]" />
            <h3 className="text-sm font-bold text-zinc-900">Cadastrar Motorista</h3>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-3">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              {errors.map(e => <p key={e} className="text-xs text-red-600">{e}</p>)}
            </div>
          )}
          <div>
            <label className={LABEL}>Nome completo *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do motorista" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>CPF *</label>
            <input value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} className={INPUT + ' font-mono'} />
          </div>
          <div>
            <label className={LABEL}>CNH *</label>
            <input value={cnh} onChange={e => setCnh(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="00000000000" maxLength={11} className={INPUT + ' font-mono'} />
          </div>
          <div>
            <label className={LABEL}>Telefone *</label>
            <input value={telefone} onChange={e => setTelefone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} className={INPUT} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-[#ED6A23] hover:bg-[#D45917] rounded-lg transition-colors">
              Salvar motorista
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Cadastro Veículo ────────────────────────────────────────────────
function ModalVeiculo({
  onClose,
  onSaved,
  veiculos,
  handleAddVeiculo,
}: {
  onClose: () => void;
  onSaved: (v: Veiculo) => void;
  veiculos: Veiculo[];
  handleAddVeiculo: (v: Veiculo) => void;
}) {
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [tipo, setTipo] = useState(TIPOS_VEICULO[0]);
  const [errors, setErrors] = useState<string[]>([]);

  const validate = () => {
    const errs: string[] = [];
    const p = placa.replace(/\s/g, '');
    if (p.length < 7) errs.push('Placa inválida (mínimo 7 caracteres).');
    if (veiculos.some(v => v.placa.replace(/\s/g, '').toUpperCase() === p.toUpperCase())) errs.push('Placa já cadastrada.');
    if (modelo.trim().length < 2) errs.push('Modelo deve ter ao menos 2 caracteres.');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const novo: Veiculo = { id: `veic-${Date.now()}`, placa: placa.toUpperCase().trim(), modelo: modelo.trim(), tipo };
    handleAddVeiculo(novo);
    onSaved(novo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#ED6A23]" />
            <h3 className="text-sm font-bold text-zinc-900">Cadastrar Veículo</h3>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-3">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              {errors.map(e => <p key={e} className="text-xs text-red-600">{e}</p>)}
            </div>
          )}
          <div>
            <label className={LABEL}>Placa *</label>
            <input
              value={placa}
              onChange={e => setPlaca(formatPlaca(e.target.value))}
              placeholder="ABC1D23"
              maxLength={8}
              className={INPUT + ' uppercase font-mono tracking-widest'}
            />
          </div>
          <div>
            <label className={LABEL}>Modelo *</label>
            <input value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Ex: Volvo FH 540" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Tipo de veículo *</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className={INPUT}>
              {TIPOS_VEICULO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-[#ED6A23] hover:bg-[#D45917] rounded-lg transition-colors">
              Salvar veículo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Cadastro Transportadora ────────────────────────────────────────
function ModalTransportadora({
  onClose,
  onSaved,
  transportadoras,
  handleAddTransportadora,
}: {
  onClose: () => void;
  onSaved: (t: Transportadora) => void;
  transportadoras: Transportadora[];
  handleAddTransportadora: (t: Transportadora) => void;
}) {
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const validate = () => {
    const errs: string[] = [];
    if (nome.trim().length < 3) errs.push('Nome deve ter ao menos 3 caracteres.');
    if (transportadoras.some(t => t.nome.toLowerCase() === nome.trim().toLowerCase())) errs.push('Transportadora já cadastrada.');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const nova: Transportadora = { id: `transp-${Date.now()}`, nome: nome.trim(), cnpj: cnpj || undefined, telefone: telefone || undefined };
    handleAddTransportadora(nova);
    onSaved(nova);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#ED6A23]" />
            <h3 className="text-sm font-bold text-zinc-900">Cadastrar Transportadora</h3>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-3">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              {errors.map(e => <p key={e} className="text-xs text-red-600">{e}</p>)}
            </div>
          )}
          <div>
            <label className={LABEL}>Nome da transportadora *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Super Trans Logística" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>CNPJ</label>
            <input value={cnpj} onChange={e => setCnpj(formatCNPJ(e.target.value))} placeholder="00.000.000/0000-00" maxLength={18} className={INPUT + ' font-mono'} />
          </div>
          <div>
            <label className={LABEL}>Telefone</label>
            <input value={telefone} onChange={e => setTelefone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} className={INPUT} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-[#ED6A23] hover:bg-[#D45917] rounded-lg transition-colors">
              Salvar transportadora
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── DadosStep principal ───────────────────────────────────────────────────
export function DadosStep({ data, onChange, disabled = false }: DadosStepProps) {
  const { motoristas, veiculos, transportadoras, handleAddMotorista, handleAddVeiculo, handleAddTransportadora, activeBookings, visibleDis, isDespachante, janelasAtendimento } = useAgendamento();
  const { currentUser } = useAuthContext();
  const userEmpresa = currentUser?.cliente?.nome ?? '';
  const isExternalUser = currentUser?.role === 'CLIENTE' || currentUser?.role === 'DESPACHANTE';
  const availableDis = visibleDis.filter(d => d.status === 'liberada');

  const busySlots = useMemo(() => {
    if (!data.dataAgendamento) return {};
    const counts: Record<string, number> = {};
    activeBookings
      .filter(b => b.data === data.dataAgendamento && b.status !== 'CANCELADO')
      .forEach(b => { const h = b.horario.split(' ')[0]; counts[h] = (counts[h] ?? 0) + 1; });
    return counts;
  }, [activeBookings, data.dataAgendamento]);

  React.useEffect(() => {
    if (userEmpresa && !data.empresa) {
      onChange({ ...data, empresa: userEmpresa });
    }
  }, [userEmpresa]);

  const searchParams = useSearchParams();
  const [selectedDiObj, setSelectedDiObj] = useState<any>(null);
  const [selectedContainer, setSelectedContainer] = useState('');
  const diContainers = selectedDiObj ? parseContainers(selectedDiObj.container) : [];
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => {
    if (autoFilled || !isExternalUser || availableDis.length === 0) return;
    const diNumero = searchParams.get('diNumero');
    if (!diNumero) return;
    const di = availableDis.find(d => d.numeroDI === diNumero) as any;
    if (!di) return;
    setSelectedDiObj(di);
    const urlContainer = searchParams.get('container') || '';
    const containers = parseContainers(di.container);
    const resolvedContainer = urlContainer || (containers.length === 1 ? containers[0] : '');
    if (resolvedContainer) setSelectedContainer(resolvedContainer);
    const modalSub = di.modalidade ? MODALIDADE_TO_SUB[di.modalidade] ?? '' : '';
    onChange({
      ...data,
      di: [di.numeroDI],
      operacao: 'Importação',
      subOperacao: modalSub,
      empresa: di.cliente || data.empresa,
      consignatario: di.cliente || data.consignatario,
      dta: di.dta ? [di.dta] : data.dta,
      container: resolvedContainer,
    });
    setAutoFilled(true);
  }, [availableDis, searchParams, autoFilled, isExternalUser]);

  const [cpfFocused,    setCpfFocused]    = useState(false);
  const [nameFocused,   setNameFocused]   = useState(false);
  const [placaFocused,  setPlacaFocused]  = useState(false);
  const [cpfTouched,    setCpfTouched]    = useState(false);
  const [nameTouched,   setNameTouched]   = useState(false);
  const [placaTouched,  setPlacaTouched]  = useState(false);
  const [showModalMot,  setShowModalMot]  = useState(false);
  const [showModalVeic, setShowModalVeic] = useState(false);
  const [showModalTransp, setShowModalTransp] = useState(false);
  const [transpFocused, setTranspFocused] = useState(false);
  const [transpTouched, setTranspTouched] = useState(false);

  const set = <K extends keyof DadosFormData>(field: K) =>
    (value: DadosFormData[K]) => onChange({ ...data, [field]: value });

  const subOps = SUB_OPERACOES[data.operacao] ?? [];

  // deduplicate by CPF
  const uniqueMotoristas = useMemo(() => {
    const seen = new Set<string>();
    return motoristas.filter(m => {
      const key = m.cpf.replace(/\D/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [motoristas]);

  const uniqueVeiculos = useMemo(() => {
    const seen = new Set<string>();
    return veiculos.filter(v => {
      const key = v.placa.replace(/\s/g, '').toUpperCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [veiculos]);

  const uniqueTransportadoras = useMemo(() => {
    const seen = new Set<string>();
    return transportadoras.filter(t => {
      const key = t.nome.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [transportadoras]);

  const transpSuggestions = transpFocused && data.transportadora.length > 0
    ? uniqueTransportadoras.filter(t => t.nome.toLowerCase().includes(data.transportadora.toLowerCase()))
    : [];
  const transpMatch = uniqueTransportadoras.find(t => t.nome.toLowerCase() === data.transportadora.toLowerCase());
  const transpLocked = !!transpMatch;
  const transpError: string | null =
    transpTouched && !transpFocused && data.transportadora.length > 2 && !transpMatch
      ? 'Transportadora não cadastrada.'
      : null;

  // autocomplete
  const cpfDigits      = data.cpfMotorista.replace(/\D/g, '');
  const cpfSuggestions = cpfFocused && cpfDigits.length > 0
    ? uniqueMotoristas.filter(m => m.cpf.replace(/\D/g, '').includes(cpfDigits))
    : [];
  const nameSuggestions = nameFocused && data.nomeMotorista.length > 1
    ? uniqueMotoristas.filter(m => m.nome.toLowerCase().includes(data.nomeMotorista.toLowerCase()))
    : [];

  // validações pós-blur
  const motoristaMatch = uniqueMotoristas.find(m => m.cpf.replace(/\D/g, '') === cpfDigits);
  const cpfError: string | null =
    cpfTouched && !cpfFocused && data.cpfMotorista
      ? cpfDigits.length !== 11
        ? 'CPF inválido.'
        : !motoristaMatch
          ? 'Motorista não cadastrado.'
          : null
      : null;

  const nameError: string | null =
    nameTouched && !nameFocused && data.nomeMotorista.length > 1
      ? !uniqueMotoristas.some(m => m.nome.toLowerCase() === data.nomeMotorista.toLowerCase())
        ? 'Motorista não encontrado no cadastro.'
        : null
      : null;

  const placaClean = data.placaVeiculo.replace(/\s/g, '').toUpperCase();
  const veiculoMatch = uniqueVeiculos.find(v => v.placa.replace(/\s/g, '').toUpperCase() === placaClean);
  const placaSuggestions = placaFocused && placaClean.length > 0
    ? uniqueVeiculos.filter(v => v.placa.replace(/\s/g, '').toUpperCase().includes(placaClean))
    : [];
  const placaError: string | null =
    placaTouched && !placaFocused && data.placaVeiculo.length >= 7 && !veiculoMatch
      ? 'Veículo não cadastrado.'
      : null;
  const veiculoLocked = !!veiculoMatch;

  const motoristaLocked = !!motoristaMatch;
  const cpfLocked = motoristaLocked && data.nomeMotorista.length > 0;
  const nameLocked = motoristaLocked && cpfDigits.length > 0;

  const selectMotorista = (m: Motorista) => {
    onChange({ ...data, cpfMotorista: m.cpf, nomeMotorista: m.nome });
    setCpfFocused(false);
    setNameFocused(false);
    setCpfTouched(false);
    setNameTouched(false);
  };

  const clearMotorista = () => {
    onChange({ ...data, cpfMotorista: '', nomeMotorista: '' });
    setCpfTouched(false);
    setNameTouched(false);
  };

  const afterSaveMotorista = (m: Motorista) => {
    onChange({ ...data, cpfMotorista: m.cpf, nomeMotorista: m.nome });
    setCpfTouched(false);
    setNameTouched(false);
    setShowModalMot(false);
  };

  const selectVeiculo = (v: Veiculo) => {
    onChange({ ...data, placaVeiculo: v.placa, tipoVeiculo: v.tipo });
    setPlacaFocused(false);
    setPlacaTouched(false);
  };

  const clearVeiculo = () => {
    onChange({ ...data, placaVeiculo: '', tipoVeiculo: '' });
    setPlacaTouched(false);
  };

  const afterSaveVeiculo = (v: Veiculo) => {
    onChange({ ...data, placaVeiculo: v.placa, tipoVeiculo: v.tipo });
    setPlacaTouched(false);
    setShowModalVeic(false);
  };

  const selectTransportadora = (t: Transportadora) => {
    onChange({ ...data, transportadora: t.nome });
    setTranspFocused(false);
    setTranspTouched(false);
  };

  const clearTransportadora = () => {
    onChange({ ...data, transportadora: '' });
    setTranspTouched(false);
  };

  const afterSaveTransportadora = (t: Transportadora) => {
    onChange({ ...data, transportadora: t.nome });
    setTranspTouched(false);
    setShowModalTransp(false);
  };

  return (
    <>
      {showModalTransp && (
        <ModalTransportadora
          transportadoras={uniqueTransportadoras}
          handleAddTransportadora={handleAddTransportadora}
          onClose={() => setShowModalTransp(false)}
          onSaved={afterSaveTransportadora}
        />
      )}
      {showModalMot && (
        <ModalMotorista
          motoristas={motoristas}
          handleAddMotorista={handleAddMotorista}
          onClose={() => setShowModalMot(false)}
          onSaved={afterSaveMotorista}
        />
      )}
      {showModalVeic && (
        <ModalVeiculo
          veiculos={veiculos}
          handleAddVeiculo={handleAddVeiculo}
          onClose={() => setShowModalVeic(false)}
          onSaved={afterSaveVeiculo}
        />
      )}

      <fieldset disabled={disabled} className={disabled ? 'opacity-60 pointer-events-none' : ''}>
      <div className="flex gap-6">
        <div className="flex-1 space-y-4">

          {/* DI + Container selector for external users */}
          {isExternalUser && availableDis.length > 0 && (
            <>
              <Field label="Declaração de Importação (DI) *">
                {selectedDiObj ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-lg text-sm font-mono font-semibold text-emerald-800">
                      {selectedDiObj.numeroDI} — {selectedDiObj.cliente}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDiObj(null);
                        setSelectedContainer('');
                        onChange({ ...data, di: [], container: '', empresa: '', consignatario: '', subOperacao: '', operacao: '' });
                      }}
                      className="p-2 text-zinc-400 hover:text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <select
                    value=""
                    onChange={e => {
                      const val = e.target.value;
                      if (!val) return;
                      const di = availableDis.find(d => d.numeroDI === val) as any;
                      setSelectedDiObj(di ?? null);
                      setSelectedContainer('');
                      const modalSub = di?.modalidade ? MODALIDADE_TO_SUB[di.modalidade] ?? '' : '';
                      onChange({
                        ...data,
                        di: [val],
                        operacao: 'Importação',
                        subOperacao: modalSub,
                        empresa: di?.cliente || data.empresa,
                        consignatario: di?.cliente || data.consignatario,
                        dta: di?.dta ? [di.dta] : data.dta,
                      });
                    }}
                    className={INPUT}
                  >
                    <option value="">Selecione uma DI...</option>
                    {availableDis.map(di => (
                      <option key={di.id} value={di.numeroDI}>
                        {di.numeroDI} — {di.cliente}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              {selectedDiObj && selectedContainer && (
                <Field label="Container">
                  <div className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-lg text-sm font-mono font-semibold text-emerald-800">
                    {selectedContainer}
                  </div>
                </Field>
              )}

              {selectedDiObj && !selectedContainer && diContainers.length > 0 && (
                <Field label="Container *">
                  <div className="space-y-2">
                    {diContainers.map(ctnr => (
                      <button
                        key={ctnr}
                        type="button"
                        onClick={() => { setSelectedContainer(ctnr); onChange({ ...data, container: ctnr }); }}
                        className="w-full text-left px-4 py-3 rounded-lg border bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all flex items-center justify-between"
                      >
                        <span className="font-mono font-bold text-sm text-zinc-900">{ctnr}</span>
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              {selectedDiObj && !selectedContainer && diContainers.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700">Nenhum container vinculado a esta DI.</p>
                </div>
              )}

              <Field label="SubOperação">
                <input
                  type="text"
                  value={data.subOperacao}
                  readOnly
                  className={INPUT + ' bg-zinc-50 cursor-not-allowed'}
                />
              </Field>
            </>
          )}

          {/* Standard Operação/SubOperação for admin/employee */}
          {!isExternalUser && (
            <>
              <Field label="Operação *">
                <select value={data.operacao} onChange={e => onChange({ ...data, operacao: e.target.value, subOperacao: '' })} className={INPUT}>
                  <option value="">Selecione...</option>
                  {OPERACOES.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </Field>

              <Field label="SubOperação *">
                <select value={data.subOperacao} onChange={e => set('subOperacao')(e.target.value)} disabled={!data.operacao} className={INPUT + ' disabled:opacity-50 disabled:cursor-not-allowed'}>
                  <option value="">Selecione...</option>
                  {subOps.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </Field>
            </>
          )}

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={data.cargaEspecial} onChange={e => set('cargaEspecial')(e.target.checked)} className="w-4 h-4 accent-emerald-600 rounded" />
            <span className="text-sm text-zinc-700 font-medium">Carga especial</span>
          </label>

          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <span className="text-xs font-bold text-zinc-600">Serviços</span>
            <button type="button" className="text-zinc-400 hover:text-zinc-600 transition-colors"><Plus className="w-4 h-4" /></button>
          </div>

          <div>
            <label className={LABEL}>Data e horário *</label>
            <DateTimePicker
              date={data.dataAgendamento}
              horario={data.inicio}
              onDateChange={d => onChange({ ...data, dataAgendamento: d, inicio: '' })}
              onHorarioChange={h => set('inicio')(h)}
              busySlots={busySlots}
              janelas={janelasAtendimento}
            />
          </div>

          {/* CPF motorista */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={LABEL} style={{ marginBottom: 0 }}>CPF do motorista *</label>
              <button type="button" onClick={() => setShowModalMot(true)} className="text-[11px] font-bold text-[#ED6A23] hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Cadastrar motorista
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="000.000.000-00"
                value={data.cpfMotorista}
                onChange={e => onChange({ ...data, cpfMotorista: formatCPF(e.target.value) })}
                onFocus={() => setCpfFocused(true)}
                onBlur={() => { setCpfFocused(false); setCpfTouched(true); }}
                readOnly={cpfLocked}
                maxLength={14}
                className={(cpfError ? INPUT_ERR : INPUT) + ' pl-8 font-mono' + (cpfLocked ? ' bg-zinc-50' : '')}
              />
              {cpfLocked && (
                <button type="button" onClick={clearMotorista} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {!cpfLocked && cpfFocused
              ? <SuggestionList items={cpfSuggestions} onSelect={selectMotorista} />
              : !cpfLocked && cpfError && (
                  <FieldError
                    msg={cpfError}
                    onCadastrar={cpfError.includes('não cadastrado') ? () => setShowModalMot(true) : undefined}
                    label="Cadastrar motorista"
                  />
                )
            }
          </div>

          {/* Nome motorista */}
          <div>
            <label className={LABEL}>Nome do motorista</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Nome do motorista"
                value={data.nomeMotorista}
                onChange={e => onChange({ ...data, nomeMotorista: e.target.value })}
                onFocus={() => setNameFocused(true)}
                onBlur={() => { setNameFocused(false); setNameTouched(true); }}
                readOnly={nameLocked}
                className={(nameError ? INPUT_ERR : INPUT) + ' pl-8' + (nameLocked ? ' bg-zinc-50' : '')}
              />
              {nameLocked && (
                <button type="button" onClick={clearMotorista} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {!nameLocked && nameFocused
              ? <SuggestionList items={nameSuggestions} onSelect={selectMotorista} />
              : !nameLocked && nameError && (
                  <FieldError
                    msg={nameError}
                    onCadastrar={() => setShowModalMot(true)}
                    label="Cadastrar motorista"
                  />
                )
            }
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={LABEL} style={{ marginBottom: 0 }}>Transportadora *</label>
              <button type="button" onClick={() => setShowModalTransp(true)} className="text-[11px] font-bold text-[#ED6A23] hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Cadastrar transportadora
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Nome da transportadora"
                value={data.transportadora}
                onChange={e => onChange({ ...data, transportadora: e.target.value })}
                onFocus={() => setTranspFocused(true)}
                onBlur={() => { setTranspFocused(false); setTranspTouched(true); }}
                readOnly={transpLocked}
                className={(transpError ? INPUT_ERR : INPUT) + ' pl-8' + (transpLocked ? ' bg-zinc-50' : '')}
              />
              {transpLocked && (
                <button type="button" onClick={clearTransportadora} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {!transpLocked && transpFocused && transpSuggestions.length > 0 && (
              <div className="mt-1 border border-zinc-200 rounded-lg shadow-sm bg-white overflow-hidden">
                {transpSuggestions.slice(0, 5).map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); selectTransportadora(t); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 transition-colors flex items-center gap-2 border-b border-zinc-100 last:border-0"
                  >
                    <Truck className="w-3 h-3 text-zinc-400" />
                    <span className="text-zinc-800 font-semibold truncate">{t.nome}</span>
                    {t.cnpj && <span className="text-zinc-400 font-mono text-[10px]">{t.cnpj}</span>}
                  </button>
                ))}
              </div>
            )}
            {!transpLocked && !transpFocused && transpError && (
              <FieldError
                msg={transpError}
                onCadastrar={() => setShowModalTransp(true)}
                label="Cadastrar transportadora"
              />
            )}
          </div>

          <Field label="Empresa *">
            <input
              type="text"
              placeholder="Nome da empresa"
              value={data.empresa}
              onChange={e => set('empresa')(e.target.value)}
              readOnly={!!userEmpresa}
              className={INPUT + (userEmpresa ? ' bg-zinc-50 cursor-not-allowed' : '')}
            />
          </Field>

          {!isExternalUser && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="AWB - MAWB"><MultiInput values={data.awbMawb} onChange={v => set('awbMawb')(v)} placeholder="Adicionar AWB" /></Field>
                <Field label="D.I"><MultiInput values={data.di} onChange={v => set('di')(v)} placeholder="Adicionar D.I" /></Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="DTA"><MultiInput values={data.dta} onChange={v => set('dta')(v)} placeholder="Adicionar DTA" /></Field>
                <Field label="HAWB"><MultiInput values={data.hawb} onChange={v => set('hawb')(v)} placeholder="Adicionar HAWB" /></Field>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(!isExternalUser || data.subOperacao === 'Aéreo') && (
              <Field label="Número do Voo"><input type="text" placeholder="Nº do voo" value={data.numeroVoo} onChange={e => set('numeroVoo')(e.target.value)} className={INPUT} /></Field>
            )}
            {/* Placa */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={LABEL} style={{ marginBottom: 0 }}>Placa do Veículo *</label>
                <button type="button" onClick={() => setShowModalVeic(true)} className="text-[11px] font-bold text-[#ED6A23] hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Cadastrar veículo
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ABC1D23"
                  value={data.placaVeiculo}
                  onChange={e => onChange({ ...data, placaVeiculo: formatPlaca(e.target.value) })}
                  onFocus={() => setPlacaFocused(true)}
                  onBlur={() => { setPlacaFocused(false); setPlacaTouched(true); }}
                  readOnly={veiculoLocked}
                  className={(placaError ? INPUT_ERR : INPUT) + ' pl-8 uppercase font-mono tracking-widest' + (veiculoLocked ? ' bg-zinc-50' : '')}
                />
                {veiculoLocked && (
                  <button type="button" onClick={clearVeiculo} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {!veiculoLocked && placaFocused && placaSuggestions.length > 0 && (
                <div className="mt-1 border border-zinc-200 rounded-lg shadow-sm bg-white overflow-hidden">
                  {placaSuggestions.slice(0, 5).map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onMouseDown={e => { e.preventDefault(); selectVeiculo(v); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 transition-colors flex items-center gap-2 border-b border-zinc-100 last:border-0"
                    >
                      <span className="font-mono text-zinc-500 tracking-wider">{v.placa}</span>
                      <span className="text-zinc-300">—</span>
                      <span className="text-zinc-800 font-semibold truncate">{v.modelo}</span>
                      <span className="text-zinc-400 text-[10px]">{v.tipo}</span>
                    </button>
                  ))}
                </div>
              )}
              {!veiculoLocked && !placaFocused && placaError && (
                <FieldError
                  msg={placaError}
                  onCadastrar={() => setShowModalVeic(true)}
                  label="Cadastrar veículo"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Volumes"><input type="text" placeholder="Qtd. volumes" value={data.volumes} onChange={e => set('volumes')(e.target.value)} className={INPUT} /></Field>
            <Field label="Peso"><input type="text" placeholder="Peso (kg)" value={data.peso} onChange={e => set('peso')(e.target.value)} className={INPUT} /></Field>
          </div>

          <Field label="Consignatário"><input type="text" placeholder="Nome do consignatário" value={data.consignatario} onChange={e => set('consignatario')(e.target.value)} className={INPUT} /></Field>
          <Field label="Observações"><input type="text" placeholder="Observações gerais" value={data.observacoes} onChange={e => set('observacoes')(e.target.value)} className={INPUT} /></Field>

        </div>

      </div>
      </fieldset>
    </>
  );
}
