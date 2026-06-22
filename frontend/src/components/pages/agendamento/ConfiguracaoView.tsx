'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, CheckCircle, Clock, SlidersHorizontal,
  Save, X, Loader2, Users, Timer, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useAgendamento } from '@/context/AgendamentoContext';
import { JanelaAtendimento } from '@/types/agendamento';
import { gerarSlotsDeJanela } from '@/lib/agendamento';

const INTERVALO_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 horas' },
];

const PRESETS = [
  { label: 'Agendamento DTA', value: 'Agendamento DTA' },
  { label: 'Agendamento FCL', value: 'Agendamento FCL' },
  { label: 'Fiscal / Liberação', value: 'Liberação Fiscal' },
  { label: 'Desembaraço Geral', value: 'Desembaraço Geral' },
];

function SlotPreview({ horaInicio, horaFim, intervalo, vagas }: {
  horaInicio: string; horaFim: string; intervalo: number; vagas: number;
}) {
  const slots = useMemo(() => {
    if (!horaInicio || !horaFim) return [];
    return gerarSlotsDeJanela({ id: 'preview', descricao: '', horaInicio, horaFim, intervaloMinutos: intervalo, vagasSimultaneas: vagas });
  }, [horaInicio, horaFim, intervalo, vagas]);

  if (!slots.length) return null;

  return (
    <div className="mt-4 bg-zinc-50 border border-zinc-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          Horários gerados
        </p>
        <p className="text-[10px] text-zinc-400">
          {slots.length} horários &times; {vagas} vagas = <span className="font-bold text-zinc-600">{slots.length * vagas} slots/dia</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {slots.map(s => (
          <span key={s.horario} className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-white border border-zinc-200 text-zinc-700 shadow-sm">
            {s.horario}
          </span>
        ))}
      </div>
    </div>
  );
}

function JanelaCard({ janela, isActive, onEdit, onDelete, onSelect, deleting }: {
  janela: JanelaAtendimento;
  isActive: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
  deleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const slots = useMemo(() => gerarSlotsDeJanela(janela), [janela]);

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-all ${
      isActive ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-zinc-200 hover:border-zinc-300'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <button onClick={onSelect} className="flex-1 text-left group">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isActive ? 'bg-emerald-100' : 'bg-zinc-100'
              }`}>
                <Clock className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-zinc-400'}`} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 group-hover:text-zinc-700">{janela.descricao}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {janela.horaInicio} — {janela.horaFim}
                  </span>
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {janela.intervaloMinutos}min
                  </span>
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {janela.vagasSimultaneas} vaga{janela.vagasSimultaneas > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </button>
          <div className="flex items-center gap-1 shrink-0">
            {isActive && (
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider mr-1">
                Ativa
              </span>
            )}
            <button onClick={onEdit} className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} disabled={deleting} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Compact slot preview */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full flex items-center justify-between text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <span className="font-semibold">{slots.length} horários &middot; {slots.length * janela.vagasSimultaneas} slots/dia</span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="flex flex-wrap gap-1">
            {slots.map(s => (
              <span key={s.horario} className="font-mono text-[10px] bg-zinc-50 border border-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-semibold">
                {s.horario}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ConfiguracaoView() {
  const {
    janelasAtendimento, selectedJanelaId,
    createJanelaApi, updateJanelaApi, deleteJanelaApi,
    saveSelectedJanelaIdToStorage,
  } = useAgendamento();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const emptyForm = () => ({
    descricao: 'Agendamento FCL',
    horaInicio: '08:00',
    horaFim: '17:00',
    intervaloMinutos: 60,
    vagasSimultaneas: 3,
  });

  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState<string[]>([]);

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!form.descricao.trim()) errs.push('Informe a descrição.');
    if (!form.horaInicio || !form.horaFim) errs.push('Defina início e fim.');
    if (form.horaInicio >= form.horaFim) errs.push('Hora início deve ser anterior ao fim.');
    if (form.vagasSimultaneas < 1) errs.push('Mínimo 1 vaga.');
    setErrors(errs);
    return errs.length === 0;
  };

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateJanelaApi(editingId, form);
        flash('Janela atualizada!');
      } else {
        await createJanelaApi(form);
        flash('Janela criada!');
      }
      setForm(emptyForm());
      setEditingId(null);
      setShowForm(false);
      setErrors([]);
    } catch {
      setErrors(['Erro ao salvar. Tente novamente.']);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (j: JanelaAtendimento) => {
    setEditingId(j.id);
    setForm({
      descricao: j.descricao,
      horaInicio: j.horaInicio,
      horaFim: j.horaFim,
      intervaloMinutos: j.intervaloMinutos,
      vagasSimultaneas: j.vagasSimultaneas,
    });
    setShowForm(true);
    setErrors([]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta janela operacional?')) return;
    setDeletingId(id);
    try {
      await deleteJanelaApi(id);
      flash('Janela excluída.');
      if (editingId === id) { setEditingId(null); setForm(emptyForm()); setShowForm(false); }
    } catch {
      setErrors(['Erro ao excluir.']);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(false);
    setErrors([]);
  };

  const totalSlots = useMemo(() => {
    return janelasAtendimento.reduce((acc, j) => {
      return acc + gerarSlotsDeJanela(j).length * j.vagasSimultaneas;
    }, 0);
  }, [janelasAtendimento]);

  return (
    <div className="space-y-5 animate-in fade-in">

      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ED6A23]/10 rounded-xl flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-[#ED6A23]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900">Configurações de Agendamento</h2>
              <p className="text-xs text-zinc-500">Gerencie janelas de atendimento, horários e vagas</p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm()); }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-lg transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Janela
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-800 text-sm font-semibold animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Janelas</p>
            <p className="text-xl font-black text-zinc-900 font-mono mt-0.5">{janelasAtendimento.length}</p>
          </div>
          <div className="bg-blue-50 p-2 rounded-lg"><SlidersHorizontal className="w-4 h-4 text-blue-500" /></div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Slots / Dia</p>
            <p className="text-xl font-black text-zinc-900 font-mono mt-0.5">{totalSlots}</p>
          </div>
          <div className="bg-emerald-50 p-2 rounded-lg"><Users className="w-4 h-4 text-emerald-500" /></div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Janela Ativa</p>
            <p className="text-xs font-bold text-zinc-700 mt-1 truncate">
              {selectedJanelaId === 'all' ? 'Todas' : (janelasAtendimento.find(j => j.id === selectedJanelaId)?.descricao ?? 'Todas')}
            </p>
          </div>
          <div className="bg-amber-50 p-2 rounded-lg"><Clock className="w-4 h-4 text-amber-500" /></div>
        </div>
      </div>

      {/* Janela Ativa Selector */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5">
          Janela exibida no calendário de agendamento
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => saveSelectedJanelaIdToStorage('all')}
            className={`text-xs px-3 py-2 rounded-lg border font-semibold transition-all ${
              selectedJanelaId === 'all'
                ? 'bg-[#ED6A23]/10 text-[#ED6A23] border-[#ED6A23]/30'
                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            Todas as Janelas
          </button>
          {janelasAtendimento.map(j => (
            <button
              key={j.id}
              onClick={() => saveSelectedJanelaIdToStorage(j.id)}
              className={`text-xs px-3 py-2 rounded-lg border font-semibold transition-all ${
                selectedJanelaId === j.id
                  ? 'bg-[#ED6A23]/10 text-[#ED6A23] border-[#ED6A23]/30'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {j.descricao}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className={`bg-white border-2 rounded-xl overflow-hidden shadow-sm ${editingId ? 'border-blue-200 ring-2 ring-blue-100' : 'border-emerald-200 ring-2 ring-emerald-100'}`}>
          <div className="bg-zinc-50 border-b border-zinc-200 px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${editingId ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                {editingId ? <Pencil className="w-3.5 h-3.5 text-blue-600" /> : <Plus className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">{editingId ? 'Editar Janela' : 'Nova Janela'}</h3>
                <p className="text-[10px] text-zinc-500">Configure horários e vagas para este serviço</p>
              </div>
            </div>
            <button onClick={handleCancel} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-5 space-y-4">
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-700 text-xs font-semibold">
                {errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}

            {/* Tipo de serviço */}
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">Tipo de Serviço</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PRESETS.map(p => (
                  <button
                    key={p.value} type="button"
                    onClick={() => setForm(prev => ({ ...prev, descricao: p.value }))}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                      form.descricao === p.value
                        ? 'bg-[#ED6A23]/10 text-[#ED6A23] border-[#ED6A23]/30'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <input
                type="text" required value={form.descricao}
                onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Ou digite um nome personalizado"
                className="w-full py-2 px-3 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Horários */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Hora Início</label>
                <input
                  type="time" required value={form.horaInicio}
                  onChange={e => setForm(prev => ({ ...prev, horaInicio: e.target.value }))}
                  className="w-full py-2 px-3 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Hora Fim</label>
                <input
                  type="time" required value={form.horaFim}
                  onChange={e => setForm(prev => ({ ...prev, horaFim: e.target.value }))}
                  className="w-full py-2 px-3 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Intervalo + Vagas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Intervalo</label>
                <select
                  value={form.intervaloMinutos}
                  onChange={e => setForm(prev => ({ ...prev, intervaloMinutos: Number(e.target.value) }))}
                  className="w-full py-2 px-3 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {INTERVALO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Vagas por horário</label>
                <input
                  type="number" required min={1} max={50} value={form.vagasSimultaneas}
                  onChange={e => setForm(prev => ({ ...prev, vagasSimultaneas: Number(e.target.value) }))}
                  className="w-full py-2 px-3 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <SlotPreview
              horaInicio={form.horaInicio}
              horaFim={form.horaFim}
              intervalo={form.intervaloMinutos}
              vagas={form.vagasSimultaneas}
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button" onClick={handleCancel}
                className="flex-1 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 py-2.5 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit" disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {editingId ? 'Salvar Alterações' : 'Criar Janela'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Janelas list */}
      {janelasAtendimento.length === 0 && !showForm ? (
        <div className="bg-white border border-dashed border-zinc-300 rounded-xl p-12 text-center">
          <Clock className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-500">Nenhuma janela configurada</p>
          <p className="text-xs text-zinc-400 mt-1 mb-4">
            Crie janelas para definir os horários disponíveis para agendamento
          </p>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm()); }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-lg transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Criar primeira janela
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Janelas configuradas ({janelasAtendimento.length})
          </h3>
          {janelasAtendimento.map(j => (
            <JanelaCard
              key={j.id}
              janela={j}
              isActive={selectedJanelaId === j.id}
              onEdit={() => handleEdit(j)}
              onDelete={() => handleDelete(j.id)}
              onSelect={() => saveSelectedJanelaIdToStorage(selectedJanelaId === j.id ? 'all' : j.id)}
              deleting={deletingId === j.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
