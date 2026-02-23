'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Ship, Anchor, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import {
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

/**
 * Um container dentro de um grupo H/HBL.
 * `containerId` fica preenchido somente em modo edição (Container.id do banco).
 */
interface ContainerInGroup {
  containerId?: string;
  number: string;
  tipo: string;
}

/**
 * Grupo H/HBL — espelha a célula mesclada do Excel.
 * Cada grupo tem um código BL e N containers abaixo dele.
 */
interface BLGroup {
  bl: string;
  containers: ContainerInGroup[];
}

interface MergedContainer {
  containerId?: string;
  number: string;
  tipo: string;
  bls: string[];
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

function toDateInputValue(dateStr?: string | null): string {
  if (!dateStr) return '';
  return dateStr.substring(0, 10);
}

/**
 * Sanitiza um único número de BL (sem barra — já separado).
 * Remove aspas, vírgulas, ponto-e-vírgula e espaços extras.
 * A barra NÃO é removida aqui; ela é tratada como separador em `splitBl`.
 */
function sanitizeBl(value: string): string {
  return value.trim().replace(/["',;]/g, '').replace(/\s+/g, '');
}

/**
 * Divide um valor de H/HBL pela barra e retorna os códigos válidos.
 * Exemplos:
 *   "OPLSU25MAO1466"              → ["OPLSU25MAO1466"]
 *   "BCN0293743/BCN0295103/"      → ["BCN0293743", "BCN0295103"]
 *   "BCN0293743 / BCN0295103"     → ["BCN0293743", "BCN0295103"]
 */
function splitBl(raw: string): string[] {
  return raw.split('/').map(sanitizeBl).filter(Boolean);
}

function emptyGroup(): BLGroup {
  return { bl: '', containers: [{ number: '', tipo: '' }] };
}

/**
 * Reconstrói os grupos H/HBL a partir dos containers vindos da API.
 * Um container com 2 BLs aparecerá em 2 grupos — exatamente como no Excel.
 */
function buildGroupsFromApi(containers: ContainerDta[]): BLGroup[] {
  const blMap = new Map<string, ContainerInGroup[]>();
  for (const c of containers) {
    for (const bl of c.bls ?? []) {
      if (!blMap.has(bl.numero)) blMap.set(bl.numero, []);
      blMap.get(bl.numero)!.push({
        containerId: c.id,
        number: c.number,
        tipo: c.tipo,
      });
    }
  }
  if (blMap.size === 0) return [emptyGroup()];
  return Array.from(blMap.entries()).map(([bl, cs]) => ({ bl, containers: cs }));
}

/**
 * Achata os grupos em containers únicos (merge por número).
 * Se o mesmo container aparecer em dois grupos (dois BLs), ele é unificado.
 */
/**
 * Achata os grupos em containers únicos (merge por número).
 * O valor do H/HBL é dividido por "/" para suportar múltiplos BLs num campo só.
 * Ex: "BCN0293743/BCN0295103/" → BillOfLading BCN0293743 + BillOfLading BCN0295103
 */
function mergeGroups(groups: BLGroup[]): MergedContainer[] {
  const map = new Map<string, MergedContainer>();
  for (const group of groups) {
    const bls = splitBl(group.bl);
    if (bls.length === 0) continue;
    for (const c of group.containers) {
      const num = c.number.trim().toUpperCase();
      if (!num || !c.tipo) continue;
      if (!map.has(num)) {
        map.set(num, { containerId: c.containerId, number: num, tipo: c.tipo, bls: [] });
      }
      const entry = map.get(num)!;
      for (const bl of bls) {
        if (!entry.bls.includes(bl)) entry.bls.push(bl);
      }
    }
  }
  return Array.from(map.values());
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
  const [cifTotal, setCifTotal] = useState('');

  const [blGroups, setBlGroups] = useState<BLGroup[]>([emptyGroup()]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setDta(processo.dta ?? '');
      setEmpresa(processo.empresa ?? '');
      setPorto(processo.porto ?? '');
      setNavio(processo.navio ?? '');
      setTransportador(processo.transportador ?? '');
      setComissaria(processo.comissaria ?? '');
      setAtaDta(toDateInputValue(processo.ataDta));
      setAtaMao(toDateInputValue(processo.ataMao));
      setAtaEadi(toDateInputValue(processo.ataEadi));
      setConclusao(toDateInputValue(processo.conclusao));
      setFobTotal(processo.fobTotal != null ? String(processo.fobTotal) : '');
      setFreteTotal(processo.freteTotal != null ? String(processo.freteTotal) : '');
      setCifTotal(processo.cifTotal != null ? String(processo.cifTotal) : '');
      setBlGroups(
        processo.containers?.length
          ? buildGroupsFromApi(processo.containers)
          : [emptyGroup()],
      );
    } else {
      setDta(''); setEmpresa(''); setPorto(''); setNavio('');
      setTransportador(''); setComissaria('');
      setAtaDta(''); setAtaMao(''); setAtaEadi(''); setConclusao('');
      setFobTotal(''); setFreteTotal(''); setCifTotal('');
      setBlGroups([emptyGroup()]);
    }
  }, [open, processo]);

  // ─── Handlers de grupos ───────────────────────────────────────────

  const addGroup = () => setBlGroups((prev) => [...prev, emptyGroup()]);

  const removeGroup = (gIdx: number) =>
    setBlGroups((prev) => prev.filter((_, i) => i !== gIdx));

  const handleGroupBL = (gIdx: number, value: string) =>
    setBlGroups((prev) => prev.map((g, i) => (i === gIdx ? { ...g, bl: value } : g)));

  // ─── Handlers de containers dentro do grupo ───────────────────────

  const addContainerToGroup = (gIdx: number) =>
    setBlGroups((prev) =>
      prev.map((g, i) =>
        i === gIdx ? { ...g, containers: [...g.containers, { number: '', tipo: '' }] } : g,
      ),
    );

  const removeContainerFromGroup = (gIdx: number, cIdx: number) =>
    setBlGroups((prev) =>
      prev.map((g, i) =>
        i === gIdx ? { ...g, containers: g.containers.filter((_, ci) => ci !== cIdx) } : g,
      ),
    );

  const handleContainerField = (
    gIdx: number,
    cIdx: number,
    field: 'number' | 'tipo',
    value: string,
  ) =>
    setBlGroups((prev) =>
      prev.map((g, i) =>
        i === gIdx
          ? { ...g, containers: g.containers.map((c, ci) => (ci === cIdx ? { ...c, [field]: value } : c)) }
          : g,
      ),
    );

  // ─── Validação ────────────────────────────────────────────────────

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!dta.trim()) newErrors.dta = 'DTA é obrigatória';
    if (!empresa.trim()) newErrors.empresa = 'Empresa é obrigatória';

    const merged = mergeGroups(blGroups);

    if (merged.length === 0) {
      newErrors.containers = 'Adicione pelo menos 1 H/HBL com 1 container';
    } else {
      for (const group of blGroups) {
        if (splitBl(group.bl).length === 0 && group.containers.some((c) => c.number.trim())) {
          newErrors.containers = 'Preencha o código H/HBL antes de adicionar containers';
          break;
        }
      }
      if (!newErrors.containers) {
        for (const c of merged) {
          if (!c.tipo) {
            newErrors.containers = `Container ${c.number}: selecione o Tipo`;
            break;
          }
          if (c.bls.length === 0) {
            newErrors.containers = `Container ${c.number}: precisa de pelo menos 1 H/HBL válido`;
            break;
          }
        }
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
      const merged = mergeGroups(blGroups);

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
          fobTotal: fobTotal ? parseFloat(fobTotal) : undefined,
          freteTotal: freteTotal ? parseFloat(freteTotal) : undefined,
          cifTotal: cifTotal ? parseFloat(cifTotal) : undefined,
        };
        await updateMutation.mutateAsync({ id: processo.id, data: updateData });

        // Containers que existiam mas foram removidos do formulário
        const keptIds = new Set(merged.filter((c) => c.containerId).map((c) => c.containerId!));
        const toDelete = (processo.containers ?? []).filter((c) => !keptIds.has(c.id));
        await Promise.all(
          toDelete.map((c) =>
            deleteContainerMutation.mutateAsync({ id: c.id, processoId: processo.id }),
          ),
        );

        // Cria novos ou atualiza existentes
        await Promise.all(
          merged.map((c) => {
            if (!c.containerId) {
              return addContainerMutation.mutateAsync({
                processoId: processo.id,
                data: { number: c.number, tipo: c.tipo, bls: c.bls },
              });
            }
            return updateContainerMutation.mutateAsync({
              id: c.containerId,
              processoId: processo.id,
              data: { number: c.number, tipo: c.tipo, bls: c.bls },
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
          fobTotal: fobTotal ? parseFloat(fobTotal) : undefined,
          freteTotal: freteTotal ? parseFloat(freteTotal) : undefined,
          cifTotal: cifTotal ? parseFloat(cifTotal) : undefined,
          containers: merged.map((c) => ({ number: c.number, tipo: c.tipo, bls: c.bls })),
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

  const totalContainers = mergeGroups(blGroups).length;

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
                    onChange={(e) => setDta(e.target.value)}
                    placeholder="Ex: 26/0063224-1"
                    disabled={isEditing}
                    className={cn(errors.dta && 'border-red-400')}
                  />
                  {errors.dta && <p className="text-xs text-red-500">{errors.dta}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="empresa">Empresa <span className="text-red-500">*</span></Label>
                  <Input
                    id="empresa"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    placeholder="Ex: MEGA PACK"
                    className={cn(errors.empresa && 'border-red-400')}
                  />
                  {errors.empresa && <p className="text-xs text-red-500">{errors.empresa}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="navio">Navio</Label>
                  <Input
                    id="navio"
                    value={navio}
                    onChange={(e) => setNavio(e.target.value)}
                    placeholder="Ex: MSC MALENA VG: AZ602R"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="transportador">Transportador</Label>
                  <Input
                    id="transportador"
                    value={transportador}
                    onChange={(e) => setTransportador(e.target.value)}
                    placeholder="Ex: FCC CARGO"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <Label htmlFor="comissaria">Comissária</Label>
                  <Input
                    id="comissaria"
                    value={comissaria}
                    onChange={(e) => setComissaria(e.target.value)}
                    placeholder="Nome da comissária"
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
                  <Label htmlFor="ataDta">ATA DTA</Label>
                  <Input id="ataDta" type="date" value={ataDta} onChange={(e) => setAtaDta(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ataMao">ATA MAO</Label>
                  <Input id="ataMao" type="date" value={ataMao} onChange={(e) => setAtaMao(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ataEadi">ATA EADI</Label>
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
                  <Input id="fobTotal" type="number" min="0" step="0.01" value={fobTotal} onChange={(e) => setFobTotal(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="freteTotal">Frete Total (USD)</Label>
                  <Input id="freteTotal" type="number" min="0" step="0.01" value={freteTotal} onChange={(e) => setFreteTotal(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cifTotal">CIF Total (USD)</Label>
                  <Input id="cifTotal" type="number" min="0" step="0.01" value={cifTotal} onChange={(e) => setCifTotal(e.target.value)} placeholder="0.00" />
                </div>
              </div>
            </div>

          </div>

          {/* ── Bloco 3: Grupos H/HBL ── */}
          <div className="space-y-3">

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Containers por H/HBL
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Digite o H/HBL uma vez e adicione todos os containers abaixo.
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {blGroups.length} H/HBL · {totalContainers} container(s)
              </span>
            </div>

            {errors.containers && (
              <p className="text-xs text-red-500">{errors.containers}</p>
            )}

            <div className="space-y-3">
              {blGroups.map((group, gIdx) => (
                <div
                  key={gIdx}
                  className="border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                >
                  {/* ── H/HBL header ── */}
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      H/HBL
                    </span>
                    <Input
                      value={group.bl}
                      onChange={(e) => handleGroupBL(gIdx, e.target.value)}
                      placeholder="Ex: BCN0293743  ou  BCN0293743/BCN0295103/"
                      className="h-7 text-sm font-mono flex-1 bg-white"
                    />
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {group.containers.length} container(s)
                    </span>
                    {blGroups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGroup(gIdx)}
                        className="flex-shrink-0 p-1 text-slate-300 hover:text-red-400 transition-colors rounded"
                        title="Remover este H/HBL"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* ── Column headers ── */}
                  <div className="grid grid-cols-[1fr_128px_36px] px-4 py-1.5 gap-3 bg-white border-b border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Número do Container
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Tipo
                    </span>
                    <span />
                  </div>

                  {/* ── Container rows ── */}
                  <div className="divide-y divide-slate-50">
                    {group.containers.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="grid grid-cols-[1fr_128px_36px] items-center px-4 py-2 gap-3 bg-white hover:bg-slate-50/50 transition-colors"
                      >
                        <Input
                          value={c.number}
                          onChange={(e) => handleContainerField(gIdx, cIdx, 'number', e.target.value)}
                          placeholder="Ex: MSMU478784-2"
                          className="h-8 text-sm font-mono"
                        />

                        <Select
                          value={c.tipo}
                          onValueChange={(v) => handleContainerField(gIdx, cIdx, 'tipo', v)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTAINER_TIPOS.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <button
                          type="button"
                          onClick={() => removeContainerFromGroup(gIdx, cIdx)}
                          className="flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors rounded p-1"
                          title="Remover container"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {group.containers.length === 0 && (
                      <p className="px-4 py-4 text-center text-xs text-slate-400">
                        Nenhum container neste H/HBL.
                      </p>
                    )}
                  </div>

                  {/* ── Add container to group ── */}
                  <button
                    type="button"
                    onClick={() => addContainerToGroup(gIdx)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-slate-400 hover:text-primary-600 hover:bg-primary-50/30 border-t border-slate-100 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar container neste H/HBL
                  </button>
                </div>
              ))}
            </div>

            {/* Add new H/HBL group */}
            <button
              type="button"
              onClick={addGroup}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/30 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Adicionar H/HBL
            </button>

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
