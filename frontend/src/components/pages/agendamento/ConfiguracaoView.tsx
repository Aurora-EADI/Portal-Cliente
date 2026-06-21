'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, RotateCcw, Clock, SlidersHorizontal } from 'lucide-react';
import { useAgendamento } from '@/context/AgendamentoContext';
import { JanelaAtendimento } from '@/types/agendamento';
import { gerarSlotsDeJanela } from '@/lib/agendamento';

export function ConfiguracaoView() {
  const { janelasAtendimento, saveJanelasToStorage, selectedJanelaId, saveSelectedJanelaIdToStorage } = useAgendamento();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const emptyForm = (): Omit<JanelaAtendimento, 'id'> => ({
    descricao: 'Agendamento FCL',
    horaInicio: '08:00',
    horaFim: '17:00',
    intervaloMinutos: 60,
    vagasSimultaneas: 3,
  });

  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState<string[]>([]);

  const PRESETS = [
    { label: 'Agendamento DTA', value: 'Agendamento DTA' },
    { label: 'Agendamento FCL', value: 'Agendamento FCL' },
    { label: 'Fiscal / Liberação', value: 'Liberação Fiscal' },
    { label: 'Desembaraço Geral', value: 'Desembaraço Geral' },
  ];

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!form.descricao.trim()) errs.push('Informe a descrição da janela.');
    if (!form.horaInicio || !form.horaFim) errs.push('Defina início e fim.');
    if (form.horaInicio >= form.horaFim) errs.push('Hora início deve ser anterior ao fim.');
    if (form.vagasSimultaneas < 1) errs.push('Vagas simultâneas deve ser ≥ 1.');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    let updated: JanelaAtendimento[];
    if (editingId) {
      updated = janelasAtendimento.map(j => j.id === editingId ? { ...form, id: editingId } : j);
      setSuccessMsg('Janela atualizada!');
    } else {
      const newJanela: JanelaAtendimento = { ...form, id: `janela-${Date.now()}` };
      updated = [...janelasAtendimento, newJanela];
      setSuccessMsg('Janela criada!');
    }
    saveJanelasToStorage(updated);
    setForm(emptyForm());
    setEditingId(null);
    setErrors([]);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleEdit = (j: JanelaAtendimento) => {
    setEditingId(j.id);
    setForm({ descricao: j.descricao, horaInicio: j.horaInicio, horaFim: j.horaFim, intervaloMinutos: j.intervaloMinutos, vagasSimultaneas: j.vagasSimultaneas });
    setErrors([]);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remover esta janela operacional?')) return;
    saveJanelasToStorage(janelasAtendimento.filter(j => j.id !== id));
    if (selectedJanelaId === id) saveSelectedJanelaIdToStorage('all');
    if (editingId === id) { setEditingId(null); setForm(emptyForm()); }
  };

  const handleReset = () => {
    if (!confirm('Restaurar janelas padrão?')) return;
    saveJanelasToStorage([]);
    saveSelectedJanelaIdToStorage('all');
    setEditingId(null);
    setForm(emptyForm());
    setSuccessMsg('Janelas restauradas ao padrão!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const previewSlots = form.horaInicio && form.horaFim && form.intervaloMinutos
    ? gerarSlotsDeJanela({ id: 'preview', ...form }).map(s => s.horario)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SlidersHorizontal className="w-5 h-5 text-[#ED6A23]" />
            <h2 className="text-base font-extrabold text-zinc-900">Configurações Operacionais</h2>
          </div>
          <p className="text-xs text-zinc-500">Gerencie janelas de atendimento, horários e vagas por período</p>
        </div>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 px-4 py-2 rounded-lg transition-all cursor-pointer shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Padrão Aurora</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-800 text-sm font-semibold animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Window selector */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-[#ED6A23]" /> <span>Janela Ativa para Agendamentos</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => saveSelectedJanelaIdToStorage('all')}
            className={`text-xs px-3 py-2 rounded-lg border font-semibold transition-all cursor-pointer ${selectedJanelaId === 'all' ? 'bg-[#ED6A23]/10 text-[#ED6A23] border-[#ED6A23]/30' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}
          >
            Todas as Janelas (Padrão)
          </button>
          {janelasAtendimento.map(j => (
            <button
              key={j.id}
              onClick={() => saveSelectedJanelaIdToStorage(j.id)}
              className={`text-xs px-3 py-2 rounded-lg border font-semibold transition-all cursor-pointer ${selectedJanelaId === j.id ? 'bg-[#ED6A23]/10 text-[#ED6A23] border-[#ED6A23]/30' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}
            >
              {j.descricao}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">A janela ativa define quais horários aparecem no calendário de agendamento.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest">Janelas Configuradas ({janelasAtendimento.length})</h3>
          {janelasAtendimento.length === 0 ? (
            <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded-xl p-8 text-center text-zinc-400 text-xs">
              <Clock className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="font-semibold">Nenhuma janela configurada</p>
              <p className="mt-1">Crie janelas operacionais no formulário ao lado.</p>
            </div>
          ) : (
            janelasAtendimento.map(j => {
              const slots = gerarSlotsDeJanela(j);
              const isActive = selectedJanelaId === j.id;
              return (
                <div
                  key={j.id}
                  className={`bg-white border rounded-xl p-4 space-y-2 transition-all ${editingId === j.id ? 'border-[#ED6A23] ring-2 ring-[#ED6A23]/20' : isActive ? 'border-emerald-400 bg-emerald-50/30' : 'border-zinc-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-extrabold text-zinc-900">{j.descricao}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{j.horaInicio} — {j.horaFim} • {j.intervaloMinutos}min • {j.vagasSimultaneas} vagas/slot</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleEdit(j)} className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-sky-50 text-zinc-500 hover:text-sky-700 transition-colors cursor-pointer">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(j.id)} className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-red-50 text-zinc-500 hover:text-red-700 transition-colors cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {slots.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {slots.map(s => (
                        <span key={s.horario} className="font-mono text-[10px] bg-zinc-100 border border-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded">{s.horario}</span>
                      ))}
                    </div>
                  )}
                  {isActive && <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">✓ Janela Ativa</span>}
                </div>
              );
            })
          )}
        </div>

        {/* Form */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-zinc-50 border-b border-zinc-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">{editingId ? 'Editar Janela Operacional' : 'Nova Janela Operacional'}</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Configure os horários de atendimento para este serviço</p>
              </div>
              {editingId && (
                <button onClick={() => { setEditingId(null); setForm(emptyForm()); setErrors([]); }}
                  className="text-xs text-zinc-500 hover:text-zinc-700 font-semibold hover:underline cursor-pointer">
                  Cancelar edição
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700 font-semibold">
                  {errors.map((e, i) => <p key={i}>• {e}</p>)}
                </div>
              )}

              <div>
                <label className="text-zinc-600 font-bold block mb-1.5">Tipo de Serviço *</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESETS.map(p => (
                    <button key={p.value} type="button" onClick={() => setForm(prev => ({ ...prev, descricao: p.value }))}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${form.descricao === p.value ? 'bg-[#ED6A23]/10 text-[#ED6A23] border-[#ED6A23]/30' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <input type="text" required value={form.descricao} onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))} placeholder="Nome do serviço"
                  className="w-full py-2 px-3 border border-zinc-200 rounded-lg bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-600 font-bold block mb-1.5">Hora Início *</label>
                  <input type="time" required value={form.horaInicio} onChange={(e) => setForm(prev => ({ ...prev, horaInicio: e.target.value }))}
                    className="w-full py-2 px-3 border border-zinc-200 rounded-lg bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="text-zinc-600 font-bold block mb-1.5">Hora Fim *</label>
                  <input type="time" required value={form.horaFim} onChange={(e) => setForm(prev => ({ ...prev, horaFim: e.target.value }))}
                    className="w-full py-2 px-3 border border-zinc-200 rounded-lg bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-600 font-bold block mb-1.5">Intervalo entre Slots</label>
                  <select value={form.intervaloMinutos} onChange={(e) => setForm(prev => ({ ...prev, intervaloMinutos: Number(e.target.value) }))}
                    className="w-full py-2 px-3 border border-zinc-200 rounded-lg bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value={30}>30 minutos</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1h 30min</option>
                    <option value={120}>2 horas</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-600 font-bold block mb-1.5">Vagas por Horário *</label>
                  <input type="number" required min={1} max={50} value={form.vagasSimultaneas} onChange={(e) => setForm(prev => ({ ...prev, vagasSimultaneas: Number(e.target.value) }))}
                    className="w-full py-2 px-3 border border-zinc-200 rounded-lg bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>

              {/* Preview */}
              {previewSlots.length > 0 && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Pré-visualização dos horários gerados:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {previewSlots.map(h => (
                      <span key={h} className="font-mono text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded font-semibold">{h}</span>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-2">{previewSlots.length} slot(s) • {form.vagasSimultaneas} vaga(s) cada</p>
                </div>
              )}

              <button type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-xs cursor-pointer mt-2">
                <Plus className="w-4 h-4" />
                <span>{editingId ? 'Salvar Alterações' : 'Criar Janela Operacional'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
