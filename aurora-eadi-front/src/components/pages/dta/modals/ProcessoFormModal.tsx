'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Ship, Anchor, Building2 } from 'lucide-react';
import { cn, formatNumberBR, parseNumberBR } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateProcesso,
  useUpdateProcesso,
  useAddContainer,
  useUpdateContainer,
  useDeleteContainer,
} from '@/hooks/useDtaMaritime';
import { useCustomers } from '@/hooks/useCustomers';
import { CustomerStatus } from '@/types/customer';
import {
  BillOfLading,
  ContainerDta,
  CreateProcessoDto,
  ProcessoImportacao,
  UpdateProcessoDto,
} from '@/types/dtaMaritime';

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTAINER_TIPOS = ['20HC', '40HC'] as const;

const PORTO_OPTIONS = [
  { value: 'Chibatão', label: 'Chibatão', description: 'Terminal Portuário', icon: Anchor },
  { value: 'Super Terminais', label: 'Super Terminais', description: 'Terminal de Contêineres', icon: Building2 },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContainerForm {
  containerId?: string;
  number: string;
  tipo: string;
}

interface FormErrors {
  dta?: string;
  empresa?: string;
  containers?: string;
}

interface ProcessoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processo?: ProcessoImportacao | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Aplica máscara DTA no formato NN/NNNNNNN-N (ex: 26/0054328-1).
 * Aceita apenas dígitos e formata automaticamente conforme a digitação.
 */
function applyDtaMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  let result = '';
  for (let i = 0; i < digits.length; i++) {
    if (i === 2) result += '/';
    else if (i === 9) result += '-';
    result += digits[i];
  }
  return result;
}

/**
 * Aplica máscara de moeda BR em tempo real (ex: 1.234.567,89).
 * Aceita apenas dígitos e vírgula, formata com pontos nos milhares.
 */
function applyNumberMask(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, '');
  const [intRaw, ...rest] = cleaned.split(',');
  const intFormatted = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (rest.length === 0) return intFormatted;
  const decPart = rest[0].slice(0, 2);
  return `${intFormatted},${decPart}`;
}

function toDateInputValue(dateStr?: string | null): string {
  if (!dateStr) return '';
  return dateStr.substring(0, 10);
}

function emptyContainer(): ContainerForm {
  return { number: '', tipo: '' };
}

function buildContainersFromApi(apiContainers: ContainerDta[]): ContainerForm[] {
  if (!apiContainers.length) return [emptyContainer()];
  return apiContainers.map((c) => ({ containerId: c.id, number: c.number, tipo: c.tipo }));
}

function extractHblsFromApi(bls: BillOfLading[]): string[] {
  return bls.length ? bls.map((bl) => bl.numero) : [''];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProcessoFormModal({ open, onOpenChange, processo }: ProcessoFormModalProps) {
  const isEditing = !!processo;

  const [dta, setDta] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [porto, setPorto] = useState('');
  const [navio, setNavio] = useState('');
  const [transportador, setTransportador] = useState('');
  const [comissaria, setComissaria] = useState('');
  const [ataDta, setAtaDta] = useState('');
  const [ataMao, setAtaMao] = useState('');
  const [ataEadi, setAtaEadi] = useState('');
  const [conclusao, setConclusao] = useState('');
  const [fobTotal, setFobTotal] = useState('');
  const [freteTotal, setFreteTotal] = useState('');

  const cifTotal = useMemo(() => {
    const fob = parseNumberBR(fobTotal);
    const frete = parseNumberBR(freteTotal);
    return fob + frete > 0 ? formatNumberBR(fob + frete) : '';
  }, [fobTotal, freteTotal]);

  const [hbls, setHbls] = useState<string[]>(['']);
  const [containers, setContainers] = useState<ContainerForm[]>([emptyContainer()]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: customersData } = useCustomers({ status: CustomerStatus.ACTIVE, limit: 200 });
  const clientes = customersData?.data ?? [];

  const createMutation = useCreateProcesso();
  const updateMutation = useUpdateProcesso();
  const addContainerMutation = useAddContainer();
  const updateContainerMutation = useUpdateContainer();
  const deleteContainerMutation = useDeleteContainer();

  // ─── Reset ao abrir ───────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    setErrors({});

    if (processo) {
      setDta(applyDtaMask(processo.dta ?? ''));
      setEmpresa(processo.empresa ?? '');
      setPorto(processo.porto ?? '');
      setNavio(processo.navio ?? '');
      setTransportador(processo.transportador ?? '');
      setComissaria(processo.comissaria ?? '');
      setAtaDta(toDateInputValue(processo.ataDta));
      setAtaMao(toDateInputValue(processo.ataMao));
      setAtaEadi(toDateInputValue(processo.ataEadi));
      setConclusao(toDateInputValue(processo.conclusao));
      setFobTotal(processo.fobTotal != null ? formatNumberBR(processo.fobTotal) : '');
      setFreteTotal(processo.freteTotal != null ? formatNumberBR(processo.freteTotal) : '');
      setHbls(extractHblsFromApi(processo.bls ?? []));
      setContainers(buildContainersFromApi(processo.containers ?? []));
    } else {
      setDta(''); setEmpresa(''); setPorto(''); setNavio('');
      setTransportador(''); setComissaria('');
      setAtaDta(''); setAtaMao(''); setAtaEadi(''); setConclusao('');
      setFobTotal(''); setFreteTotal('');
      setHbls(['']);
      setContainers([emptyContainer()]);
    }
  }, [open, processo]);

  // ─── Handlers de H/HBLs ───────────────────────────────────────────

  const addHbl = () => setHbls((prev) => [...prev, '']);

  const removeHbl = (idx: number) => setHbls((prev) => prev.filter((_, i) => i !== idx));

  const handleHblField = (idx: number, value: string) =>
    setHbls((prev) => prev.map((bl, i) => (i === idx ? value.toUpperCase() : bl)));

  // ─── Handlers de containers ───────────────────────────────────────

  const addContainer = () => setContainers((prev) => [...prev, emptyContainer()]);

  const removeContainer = (cIdx: number) =>
    setContainers((prev) => prev.filter((_, i) => i !== cIdx));

  const handleContainerField = (cIdx: number, field: 'number' | 'tipo', value: string) =>
    setContainers((prev) =>
      prev.map((c, i) => (i === cIdx ? { ...c, [field]: value } : c)),
    );

  // ─── Validação ────────────────────────────────────────────────────

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!dta.trim()) newErrors.dta = 'DTA é obrigatória';
    if (!empresa.trim()) newErrors.empresa = 'Empresa é obrigatória';

    const validHbls = hbls.filter((bl) => bl.trim());
    if (validHbls.length === 0) {
      newErrors.containers = 'Adicione pelo menos 1 H/HBL';
    }

    const filledContainers = containers.filter((c) => c.number.trim() || c.tipo);
    if (filledContainers.length === 0) {
      newErrors.containers = 'Adicione pelo menos 1 container';
    } else {
      for (const c of filledContainers) {
        const label = c.number.trim() || 'Container';
        if (!c.number.trim()) { newErrors.containers = 'Preencha o número do container'; break; }
        if (!c.tipo) { newErrors.containers = `${label}: selecione o Tipo`; break; }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Submit ───────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const validHbls = hbls.map((bl) => bl.trim()).filter(Boolean);
      const validContainers = containers
        .filter((c) => c.number.trim() && c.tipo)
        .map((c) => ({ ...c, number: c.number.trim().toUpperCase() }));

      if (isEditing && processo) {
        const updateData: UpdateProcessoDto = {
          empresa: empresa.trim() || undefined,
          porto: porto.trim() || undefined,
          navio: navio.trim() || undefined,
          transportador: transportador.trim() || undefined,
          comissaria: comissaria.trim() || undefined,
          ataDta: ataDta || undefined,
          ataMao: ataMao || undefined,
          ataEadi: ataEadi || undefined,
          conclusao: conclusao || undefined,
          fobTotal: fobTotal ? parseNumberBR(fobTotal) : undefined,
          freteTotal: freteTotal ? parseNumberBR(freteTotal) : undefined,
          cifTotal: cifTotal ? parseNumberBR(cifTotal) : undefined,
          bls: validHbls,
        };
        await updateMutation.mutateAsync({ id: processo.id, data: updateData });

        const keptIds = new Set(validContainers.filter((c) => c.containerId).map((c) => c.containerId!));
        const toDelete = (processo.containers ?? []).filter((c) => !keptIds.has(c.id));
        await Promise.all(
          toDelete.map((c) =>
            deleteContainerMutation.mutateAsync({ id: c.id, processoId: processo.id }),
          ),
        );

        await Promise.all(
          validContainers.map((c) => {
            if (!c.containerId) {
              return addContainerMutation.mutateAsync({
                processoId: processo.id,
                data: { number: c.number, tipo: c.tipo },
              });
            }
            return updateContainerMutation.mutateAsync({
              id: c.containerId,
              processoId: processo.id,
              data: { number: c.number, tipo: c.tipo },
            });
          }),
        );
      } else {
        const createData: CreateProcessoDto = {
          dta: dta.trim(),
          empresa: empresa.trim(),
          porto: porto.trim(),
          navio: navio.trim(),
          transportador: transportador.trim() || undefined,
          comissaria: comissaria.trim() || undefined,
          ataDta: ataDta || undefined,
          ataMao: ataMao || undefined,
          ataEadi: ataEadi || undefined,
          conclusao: conclusao || undefined,
          fobTotal: fobTotal ? parseNumberBR(fobTotal) : undefined,
          freteTotal: freteTotal ? parseNumberBR(freteTotal) : undefined,
          cifTotal: cifTotal ? parseNumberBR(cifTotal) : undefined,
          bls: validHbls,
          containers: validContainers.map((c) => ({ number: c.number, tipo: c.tipo })),
        };
        await createMutation.mutateAsync(createData);
      }

      onOpenChange(false);
    } catch {
      // Erro já tratado pelo onError do hook (toast)
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Ship className="w-5 h-5 text-primary-500" />
            {isEditing ? 'Editar Processo de Importação' : 'Novo Processo de Importação'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">

          {/* ── Bloco 1: Informações Gerais + Porto ── */}
          <div className="grid grid-cols-3 gap-6">

            <div className="col-span-2 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Informações Gerais
              </h3>
              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-1">
                  <Label htmlFor="dta">DTA <span className="text-red-500">*</span></Label>
                  <Input
                    id="dta"
                    value={dta}
                    onChange={(e) => setDta(applyDtaMask(e.target.value))}
                    placeholder="Ex: 26/0063224-1"
                    disabled={isEditing}
                    className={cn(errors.dta && 'border-red-400')}
                  />
                  {errors.dta && <p className="text-xs text-red-500">{errors.dta}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="empresa">Empresa <span className="text-red-500">*</span></Label>
                  <Select value={empresa} onValueChange={setEmpresa}>
                    <SelectTrigger id="empresa" className={cn(errors.empresa && 'border-red-400')}>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.empresa && <p className="text-xs text-red-500">{errors.empresa}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="navio">Navio</Label>
                  <Input
                    id="navio"
                    value={navio}
                    onChange={(e) => setNavio(e.target.value.toUpperCase())}
                    placeholder="Ex: MSC MALENA VG: AZ602R"
                    className="uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="transportador">Transportador</Label>
                  <Input
                    id="transportador"
                    value={transportador}
                    onChange={(e) => setTransportador(e.target.value.toUpperCase())}
                    placeholder="Ex: FCC CARGO"
                    className="uppercase"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <Label htmlFor="comissaria">Comissária</Label>
                  <Input
                    id="comissaria"
                    value={comissaria}
                    onChange={(e) => setComissaria(e.target.value.toUpperCase())}
                    placeholder="Nome da comissária"
                    className="uppercase"
                  />
                </div>

              </div>
            </div>

            {/* Porto card selector */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Porto</h3>
              <div className="flex flex-col gap-3">
                {PORTO_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = porto === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPorto(opt.value)}
                      className={cn(
                        'relative flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200',
                        selected
                          ? 'border-primary-500 bg-primary-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                      )}
                    >
                      <div className={cn(
                        'flex-shrink-0 p-2.5 rounded-lg',
                        selected ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500',
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={cn('font-semibold text-sm', selected ? 'text-primary-700' : 'text-slate-700')}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-slate-400">{opt.description}</p>
                      </div>
                      <div className={cn(
                        'absolute top-3 right-3 w-4 h-4 rounded-full border-2 flex items-center justify-center',
                        selected ? 'border-primary-500 bg-primary-500' : 'border-slate-300 bg-white',
                      )}>
                        {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ── Bloco 2: Datas + Valores ── */}
          <div className="grid grid-cols-2 gap-6">

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="ataDta">Registro DTA</Label>
                  <Input id="ataDta" type="date" value={ataDta} onChange={(e) => setAtaDta(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ataMao">ATA MAO</Label>
                  <Input id="ataMao" type="date" value={ataMao} onChange={(e) => setAtaMao(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ataEadi">Chegada EADI</Label>
                  <Input id="ataEadi" type="date" value={ataEadi} onChange={(e) => setAtaEadi(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="conclusao">Conclusão</Label>
                  <Input id="conclusao" type="date" value={conclusao} onChange={(e) => setConclusao(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valores Financeiros</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="fobTotal">FOB Total (USD)</Label>
                  <Input id="fobTotal" type="text" inputMode="decimal" value={fobTotal} onChange={(e) => setFobTotal(applyNumberMask(e.target.value))} onBlur={(e) => { const n = parseNumberBR(e.target.value); setFobTotal(n > 0 ? formatNumberBR(n) : ''); }} placeholder="0,00" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="freteTotal">Frete Total (USD)</Label>
                  <Input id="freteTotal" type="text" inputMode="decimal" value={freteTotal} onChange={(e) => setFreteTotal(applyNumberMask(e.target.value))} onBlur={(e) => { const n = parseNumberBR(e.target.value); setFreteTotal(n > 0 ? formatNumberBR(n) : ''); }} placeholder="0,00" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cifTotal">CIF Total (USD)</Label>
                  <Input id="cifTotal" type="text" value={cifTotal} readOnly placeholder="0,00" className="bg-muted cursor-not-allowed" />
                </div>
              </div>
            </div>

          </div>

          {/* ── Bloco 3: H/HBLs + Containers ── */}
          <div className="grid grid-cols-2 gap-6">

            {/* ── H/HBLs ── */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">H/HBL</h3>

              {errors.containers && errors.containers.includes('H/HBL') && (
                <p className="text-xs text-red-500">{errors.containers}</p>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100">
                  {hbls.map((bl, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50/50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-8 shrink-0">
                        {idx + 1}
                      </span>
                      <Input
                        value={bl}
                        onChange={(e) => handleHblField(idx, e.target.value)}
                        placeholder="Ex: BCN0293743"
                        className="h-8 text-sm font-mono flex-1 uppercase"
                      />
                      {hbls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHbl(idx)}
                          className="shrink-0 p-1 text-slate-300 hover:text-red-400 transition-colors rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addHbl}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-slate-400 hover:text-primary-600 hover:bg-primary-50/30 border-t border-slate-100 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar H/HBL
                </button>
              </div>
            </div>

            {/* ── Containers ── */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Containers</h3>

              {errors.containers && !errors.containers.includes('H/HBL') && (
                <p className="text-xs text-red-500">{errors.containers}</p>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100">
                  {containers.map((container, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50/50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-8 shrink-0">
                        {cIdx + 1}
                      </span>
                      <Input
                        value={container.number}
                        onChange={(e) => handleContainerField(cIdx, 'number', e.target.value.toUpperCase())}
                        placeholder="Ex: MSMU478784-2"
                        className="h-8 text-sm font-mono flex-1 uppercase"
                      />
                      <Select
                        value={container.tipo}
                        onValueChange={(v) => handleContainerField(cIdx, 'tipo', v)}
                      >
                        <SelectTrigger className="h-8 text-sm w-24 shrink-0">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTAINER_TIPOS.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {containers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContainer(cIdx)}
                          className="shrink-0 p-1 text-slate-300 hover:text-red-400 transition-colors rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addContainer}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-slate-400 hover:text-primary-600 hover:bg-primary-50/30 border-t border-slate-100 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Container
                </button>
              </div>
            </div>

          </div>

        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? isEditing ? 'Salvando...' : 'Criando...'
              : isEditing ? 'Salvar Alterações' : 'Criar Processo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
