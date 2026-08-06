'use client';

import React, { useEffect, useState } from 'react';
import { Search, Truck, X, Copy, Check, Mail, Trash2, UserPlus, CheckCircle } from 'lucide-react';
import { useAgendamento } from '@/context/AgendamentoContext';
import { api } from '@/lib/api';
import { TransportadoraCnpjPicker } from './TransportadoraCnpjPicker';

interface AtribuicaoApi {
  id: string;
  nLote: string;
  container: string;
  atribuidoEm: string;
  transportadora: { id: string; nome: string; cnpj: string };
}

function parseContainers(containerStr: string): string[] {
  if (!containerStr) return [];
  return containerStr.split('/').map(c => c.trim()).filter(Boolean);
}

interface ConviteGerado {
  link: string;
  expiresAt: string;
  emailSent: boolean;
}

export function AtribuicaoTransportadorasView() {
  const { dis, isLoadingData, transportadorasConta } = useAgendamento();
  const [search, setSearch] = useState('');
  const [atribuicoes, setAtribuicoes] = useState<AtribuicaoApi[]>([]);
  const [loadingAtribuicoes, setLoadingAtribuicoes] = useState(true);

  // Modal de atribuição
  const [atribuindoNLote, setAtribuindoNLote] = useState<string | null>(null);
  const [formContainer, setFormContainer] = useState('');
  const [formCnpj, setFormCnpj] = useState('');
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [inviteNotice, setInviteNotice] = useState<{ status: 'pending' | 'created'; link?: string; emailSent?: boolean } | null>(null);

  // Modal de convite
  const [showConvite, setShowConvite] = useState(false);
  const [convCnpj, setConvCnpj] = useState('');
  const [convNome, setConvNome] = useState('');
  const [convEmail, setConvEmail] = useState('');
  const [convError, setConvError] = useState('');
  const [convGerado, setConvGerado] = useState<ConviteGerado | null>(null);
  const [convSaving, setConvSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadAtribuicoes = async () => {
    try {
      const { data } = await api.get<AtribuicaoApi[]>('/agendamento/atribuicoes');
      setAtribuicoes(data);
    } catch (err) {
      console.error('[Atribuições] erro ao carregar', err);
    } finally {
      setLoadingAtribuicoes(false);
    }
  };

  useEffect(() => {
    loadAtribuicoes();
  }, []);

  const atribuicoesPorLote = atribuicoes.reduce<Record<string, AtribuicaoApi[]>>((acc, a) => {
    (acc[a.nLote] = acc[a.nLote] ?? []).push(a);
    return acc;
  }, {});

  const filteredDis = dis.filter(di => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      di.numeroDI?.toLowerCase().includes(q) ||
      di.nLote?.toLowerCase().includes(q) ||
      di.cliente?.toLowerCase().includes(q) ||
      (atribuicoesPorLote[di.nLote ?? ''] ?? []).some(a => a.transportadora.nome.toLowerCase().includes(q))
    );
  });

  const diAtribuindo = dis.find(d => d.nLote === atribuindoNLote);
  const containersDaDiAtribuindo = diAtribuindo ? parseContainers(diAtribuindo.container) : [];
  const atribuicaoPorContainerAtribuindo = new Map(
    (atribuicoesPorLote[atribuindoNLote ?? ''] ?? []).map(a => [a.container, a]),
  );
  const conflitoAtribuicao = containersDaDiAtribuindo.length > 0
    ? (formContainer ? atribuicaoPorContainerAtribuindo.get(formContainer) : undefined)
    : atribuicaoPorContainerAtribuindo.get('');

  const abrirModalAtribuir = (lote: string, preselecionarContainer?: string) => {
    setAtribuindoNLote(lote);
    setFormError('');
    const di = dis.find(d => d.nLote === lote);
    const containers = di ? parseContainers(di.container) : [];
    setFormContainer(preselecionarContainer ?? (containers.length === 1 ? containers[0] : ''));
  };

  const handleAtribuir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!atribuindoNLote) return;
    setFormError('');

    if (containersDaDiAtribuindo.length > 0 && !formContainer) { setFormError('Selecione o container que está atribuindo.'); return; }
    const cnpjDigits = formCnpj.replace(/\D/g, '');
    if (cnpjDigits.length !== 14) { setFormError('CNPJ inválido (14 dígitos).'); return; }
    if (formNome.trim().length < 3) { setFormError('Informe o nome da transportadora.'); return; }

    setSaving(true);
    try {
      const { data } = await api.post('/agendamento/atribuicoes', { nLote: atribuindoNLote, container: formContainer, cnpj: cnpjDigits, nome: formNome.trim(), email: formEmail.trim() || undefined, whatsapp: formWhatsapp.trim() || undefined });
      await loadAtribuicoes();
      setAtribuindoNLote(null);
      setFormContainer(''); setFormCnpj(''); setFormNome(''); setFormEmail(''); setFormWhatsapp('');
      if (data.convite && data.convite.status !== 'has_access') {
        setInviteNotice(data.convite);
      }
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Erro ao atribuir transportadora.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemover = async (nLote: string, transportadoraContaId: string, container: string) => {
    try {
      await api.delete(`/agendamento/atribuicoes?nLote=${encodeURIComponent(nLote)}&transportadoraContaId=${encodeURIComponent(transportadoraContaId)}&container=${encodeURIComponent(container)}`);
      setAtribuicoes(prev => prev.filter(a => !(a.nLote === nLote && a.transportadora.id === transportadoraContaId && a.container === container)));
    } catch (err) {
      console.error('[Atribuições] erro ao remover', err);
    }
  };

  const handleConvidar = async (e: React.FormEvent) => {
    e.preventDefault();
    setConvError('');

    const cnpjDigits = convCnpj.replace(/\D/g, '');
    if (cnpjDigits.length !== 14) { setConvError('CNPJ inválido (14 dígitos).'); return; }
    if (convNome.trim().length < 3) { setConvError('Informe o nome da transportadora.'); return; }

    setConvSaving(true);
    try {
      const { data } = await api.post('/agendamento/convites-transportadora', {
        cnpj: cnpjDigits,
        nome: convNome.trim(),
        email: convEmail.trim() || undefined,
      });
      setConvGerado({ link: data.link, expiresAt: data.expiresAt, emailSent: data.emailSent });
    } catch (err: any) {
      setConvError(err?.response?.data?.message ?? 'Erro ao gerar convite.');
    } finally {
      setConvSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (!convGerado) return;
    navigator.clipboard.writeText(convGerado.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeConvite = () => {
    setShowConvite(false);
    setConvCnpj(''); setConvNome(''); setConvEmail('');
    setConvError(''); setConvGerado(null); setCopied(false);
  };

  const isLoading = isLoadingData || loadingAtribuicoes;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-zinc-900">Transportadoras</h2>
          <p className="text-xs text-zinc-500 mt-1">Atribua transportadoras às suas DIs averbadas para que possam agendar a retirada</p>
        </div>
        <button
          onClick={() => setShowConvite(true)}
          className="inline-flex items-center gap-1.5 bg-[#ED6A23] hover:bg-[#D45917] text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Convidar Transportadora</span>
        </button>
      </div>

      {inviteNotice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-800">
              {inviteNotice.status === 'pending' ? 'Convite pendente reaproveitado' : 'Convite enviado à transportadora'}
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              {inviteNotice.status === 'pending'
                ? 'Essa transportadora já tinha um convite pendente — ela poderá aceitá-lo normalmente.'
                : `Transportadora ainda não tinha acesso ao portal — convite ${inviteNotice.emailSent ? 'enviado por e-mail' : 'gerado (sem e-mail cadastrado, compartilhe o link)'}.`}
            </p>
            {inviteNotice.link && (
              <p className="text-[11px] font-mono text-emerald-600 mt-2 break-all">{inviteNotice.link}</p>
            )}
          </div>
          <button onClick={() => setInviteNotice(null)} className="text-emerald-400 hover:text-emerald-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por DI, lote, cliente ou transportadora..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-zinc-800"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  {['DI / Lote', 'Cliente', 'Status', 'Transportadoras Atribuídas', 'Ações'].map(h => (
                    <th key={h} className="text-left py-3 px-3 font-bold text-zinc-500 uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading && (
                  <tr><td colSpan={5} className="py-8 text-center text-zinc-400 text-xs">Carregando...</td></tr>
                )}
                {!isLoading && filteredDis.map(di => {
                  const lote = di.nLote ?? '';
                  const doLote = atribuicoesPorLote[lote] ?? [];
                  const containersDaDi = parseContainers(di.container);
                  const atribuicaoPorContainer = new Map(doLote.map(a => [a.container, a]));

                  const totalUnidades = containersDaDi.length || 1;
                  const unidadesAtribuidas = containersDaDi.length > 0
                    ? containersDaDi.filter(c => atribuicaoPorContainer.has(c)).length
                    : (doLote.length > 0 ? 1 : 0);

                  const StatusBadge = unidadesAtribuidas === 0
                    ? <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">Pendente</span>
                    : unidadesAtribuidas === totalUnidades
                    ? <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">Completo</span>
                    : <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">Parcial · {unidadesAtribuidas}/{totalUnidades}</span>;

                  return (
                    <tr key={di.id} className="hover:bg-zinc-50/60">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-sky-800">{di.numeroDI}</span>
                        {lote && <span className="block text-[10px] text-zinc-400 font-mono">Lote {lote}</span>}
                      </td>
                      <td className="py-3 px-3 text-zinc-600">{di.cliente || '—'}</td>
                      <td className="py-3 px-3">{StatusBadge}</td>
                      <td className="py-3 px-3">
                        {containersDaDi.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {containersDaDi.map(ctnr => {
                              const a = atribuicaoPorContainer.get(ctnr);
                              return a ? (
                                <span key={ctnr} className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                  <Truck className="w-3 h-3" />
                                  {a.transportadora.nome}
                                  <span className="font-mono font-normal text-sky-500">— {ctnr}</span>
                                  <button
                                    onClick={() => handleRemover(a.nLote, a.transportadora.id, a.container)}
                                    title="Remover atribuição"
                                    className="text-sky-400 hover:text-red-500 cursor-pointer ml-0.5"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </span>
                              ) : (
                                <button
                                  key={ctnr}
                                  onClick={() => abrirModalAtribuir(lote, ctnr)}
                                  disabled={!lote}
                                  title="Atribuir transportadora a este container"
                                  className="inline-flex items-center gap-1 border border-dashed border-zinc-300 text-zinc-400 hover:border-[#ED6A23] hover:text-[#ED6A23] px-2 py-0.5 rounded text-[10px] font-bold font-mono cursor-pointer transition-colors"
                                >
                                  {ctnr} — sem transportadora
                                </button>
                              );
                            })}
                          </div>
                        ) : doLote.length === 0 ? (
                          <span className="text-zinc-400 text-[11px]">Nenhuma atribuída</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {doLote.map(a => (
                              <span key={a.id} className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                <Truck className="w-3 h-3" />
                                {a.transportadora.nome}
                                <button
                                  onClick={() => handleRemover(a.nLote, a.transportadora.id, a.container)}
                                  title="Remover atribuição"
                                  className="text-sky-400 hover:text-red-500 cursor-pointer ml-0.5"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => abrirModalAtribuir(lote)}
                          disabled={!lote}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ED6A23] hover:text-[#D45917] disabled:text-zinc-300 cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" /> {unidadesAtribuidas > 0 ? 'Gerenciar' : 'Atribuir'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && filteredDis.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-zinc-400 text-xs">Nenhuma DI averbada encontrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de atribuição */}
      {atribuindoNLote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200">
              <h3 className="text-sm font-extrabold text-zinc-900">Atribuir Transportadora — Lote {atribuindoNLote}</h3>
              <button onClick={() => setAtribuindoNLote(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAtribuir} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700 font-semibold">• {formError}</div>
              )}

              {containersDaDiAtribuindo.length > 0 && (
                <div>
                  <label className="text-zinc-600 font-bold block mb-1.5">Container *</label>
                  {containersDaDiAtribuindo.length === 1 ? (
                    <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg font-mono font-semibold border ${conflitoAtribuicao ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-emerald-300 bg-emerald-50 text-emerald-800'}`}>
                      <span>{containersDaDiAtribuindo[0]}</span>
                      {conflitoAtribuicao && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-sky-600 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded normal-case">
                          <Truck className="w-3 h-3" /> já com {conflitoAtribuicao.transportadora.nome}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {containersDaDiAtribuindo.map(ctnr => {
                        const jaAtribuido = atribuicaoPorContainerAtribuindo.get(ctnr);
                        return (
                          <button
                            key={ctnr}
                            type="button"
                            onClick={() => setFormContainer(ctnr)}
                            className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-lg border font-mono font-semibold transition-colors ${formContainer === ctnr ? 'border-[#ED6A23] bg-[#ED6A23]/5 text-[#ED6A23]' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'}`}
                          >
                            <span>{ctnr}</span>
                            {jaAtribuido && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-sky-600 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded normal-case">
                                <Truck className="w-3 h-3" /> já com {jaAtribuido.transportadora.nome}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <p className={`text-[10px] mt-1 ${conflitoAtribuicao ? 'text-amber-600 font-semibold' : 'text-zinc-400'}`}>
                    {conflitoAtribuicao
                      ? `Este container já está atribuído a ${conflitoAtribuicao.transportadora.nome}. Remova a atribuição atual (botão de lixeira na tabela) antes de trocar.`
                      : 'A transportadora só vai enxergar e agendar este container.'}
                  </p>
                </div>
              )}
              {containersDaDiAtribuindo.length === 0 && conflitoAtribuicao && (
                <p className="text-[10px] text-amber-600 font-semibold">
                  Esta DI já está atribuída a {conflitoAtribuicao.transportadora.nome}. Remova a atribuição atual (botão de lixeira na tabela) antes de trocar.
                </p>
              )}

              <TransportadoraCnpjPicker
                transportadoras={transportadorasConta}
                cnpj={formCnpj}
                nome={formNome}
                onChangeCnpj={setFormCnpj}
                onChangeNome={setFormNome}
                email={formEmail}
                onChangeEmail={setFormEmail}
                whatsapp={formWhatsapp}
                onChangeWhatsapp={setFormWhatsapp}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAtribuindoNLote(null)} className="px-4 py-2 border border-zinc-200 text-zinc-600 bg-white rounded-lg font-semibold text-xs">Cancelar</button>
                <button
                  type="submit"
                  disabled={saving || !!conflitoAtribuicao}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-xs shadow-sm"
                >
                  {saving ? 'Atribuindo...' : 'Atribuir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de convite */}
      {showConvite && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200">
              <h3 className="text-sm font-extrabold text-zinc-900">Convidar Transportadora</h3>
              <button onClick={closeConvite} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            {!convGerado ? (
              <form onSubmit={handleConvidar} className="p-5 space-y-4 text-xs">
                {convError && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700 font-semibold">• {convError}</div>
                )}
                <TransportadoraCnpjPicker
                  transportadoras={transportadorasConta}
                  cnpj={convCnpj}
                  nome={convNome}
                  onChangeCnpj={setConvCnpj}
                  onChangeNome={setConvNome}
                  email={convEmail}
                  onChangeEmail={setConvEmail}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeConvite} className="px-4 py-2 border border-zinc-200 text-zinc-600 bg-white rounded-lg font-semibold text-xs">Cancelar</button>
                  <button type="submit" disabled={convSaving} className="px-4 py-2 bg-[#ED6A23] text-white rounded-lg font-bold hover:bg-[#D45917] disabled:opacity-60 text-xs shadow-sm">
                    {convSaving ? 'Gerando...' : 'Gerar Convite'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-5 space-y-4 text-xs">
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded text-emerald-700 font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Convite gerado com sucesso!
                  {convGerado.emailSent && (
                    <span className="inline-flex items-center gap-1 text-emerald-600"><Mail className="w-3.5 h-3.5" /> E-mail enviado</span>
                  )}
                </div>
                <div>
                  <label className="text-zinc-600 font-bold block mb-1.5">Link do convite</label>
                  <div className="flex gap-2">
                    <input readOnly value={convGerado.link}
                      className="flex-1 py-2 px-3 border border-zinc-200 rounded-lg bg-zinc-50 font-mono text-[10px] text-zinc-700" />
                    <button onClick={handleCopyLink}
                      className="inline-flex items-center gap-1 px-3 py-2 border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 font-bold cursor-pointer">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1.5">
                    Expira em {new Date(convGerado.expiresAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={closeConvite} className="px-4 py-2 bg-zinc-800 text-white rounded-lg font-bold hover:bg-zinc-700 text-xs">Fechar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
