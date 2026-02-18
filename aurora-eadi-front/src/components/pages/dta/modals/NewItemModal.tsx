'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileSpreadsheet, X, Package, Upload } from 'lucide-react';
import { useCreateCargoItems } from '@/hooks/useCcte';
import { TCOptions, WarehouseReason } from '@/types/ccte';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthContext } from '@/context/AuthContext';

interface NewItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flightId: string;
}

interface ParsedItem {
  id: string;
  house: string;
  importer: string;
  tc: TCOptions;
  responsible: string;
  status: string;
}

export function NewItemModal({
  open,
  onOpenChange,
  flightId,
}: NewItemModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');

  const { currentUser } = useAuthContext();
  const defaultResponsible = currentUser?.name || 'ANTONIO GOMES';

  // State for Manual Mode
  const [formData, setFormData] = useState({
    house: '',
    importer: '',
    tc: TCOptions.P as TCOptions,
    warehouseReason: null as WarehouseReason | null,
    responsible: defaultResponsible,
    observations: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State for Import Mode
  const [pasteContent, setPasteContent] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [defaults, setDefaults] = useState({
    responsible: defaultResponsible,
    tc: TCOptions.P as TCOptions,
  });

  const createItemsMutation = useCreateCargoItems();

  // --- Manual Logic ---
  const handleManualChange = (field: string, value: string | number | WarehouseReason | null) => {
    const upperFields = ['house', 'importer'];
    const finalValue =
      typeof value === 'string' && upperFields.includes(field)
        ? value.toUpperCase()
        : value;

    if (field === 'tc' && value === TCOptions.P) {
      setFormData((prev) => ({ ...prev, tc: value as TCOptions, warehouseReason: null }));
    } else if (field === 'warehouseReason') {
      setFormData((prev) => ({ ...prev, warehouseReason: value as WarehouseReason | null }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: finalValue }));
    }

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateManual = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.house.trim()) newErrors.house = 'Campo obrigatorio';
    if (!formData.importer.trim()) newErrors.importer = 'Campo obrigatorio';
    if (formData.tc === TCOptions.A) {
      if (!formData.warehouseReason) {
        newErrors.warehouseReason = 'Motivo é obrigatório quando TC = A (Armazém)';
      }
      if (!formData.observations.trim()) {
        newErrors.observations =
          'Observacoes sao obrigatorias quando o TC nao e P (Patio)';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitManual = async () => {
    if (!validateManual()) return;

    try {
      await createItemsMutation.mutateAsync({
        flightId,
        data: {
          items: [{
            house: formData.house,
            importer: formData.importer,
            tc: formData.tc,
            warehouseReason: formData.warehouseReason || undefined,
            responsible: formData.responsible,
            observations: formData.observations
          }]
        }
      });
      handleClose();
    } catch {
      // Error handled by hook
    }
  };

  // --- Import Logic ---
  const handleParse = () => {
    if (!pasteContent.trim()) return;

    const lines = pasteContent.trim().split('\n');
    const newItems: ParsedItem[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(/\t+/).filter(p => p.trim() !== '');
      if (parts.length >= 1) {
        const house = parts[0]?.trim().toUpperCase() || '';
        const importer = parts[1]?.trim().toUpperCase() || 'NAO INFORMADO';

        if (house) {
          newItems.push({
            id: `temp-${Date.now()}-${index}`,
            house,
            importer,
            tc: defaults.tc,
            responsible: defaults.responsible,
            status: 'EM_ANALISE'
          });
        }
      }
    });

    setParsedItems(newItems);
    if (newItems.length > 0) {
      toast.success(`${newItems.length} itens identificados!`);
    } else {
      toast.warning('Nenhum item valido identificado.');
    }
  };

  const submitImport = async () => {
    if (parsedItems.length === 0) return;

    try {
      const payload = parsedItems.map(item => ({
        house: item.house,
        importer: item.importer,
        tc: item.tc,
        responsible: item.responsible,
        observations: ''
      }));

      await createItemsMutation.mutateAsync({
        flightId,
        data: { items: payload }
      });
      handleClose();
    } catch {
      // Error handled by hook
    }
  };

  const handleClose = () => {
    // Reset states
    setFormData({
      house: '',
      importer: '',
      tc: TCOptions.P,
      warehouseReason: null,
      responsible: defaultResponsible,
      observations: '',
    });
    setErrors({});
    setPasteContent('');
    setParsedItems([]);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden bg-white">

        {/* Header Style Premium */}
        <div className="p-6 border-b border-gray-100 bg-slate-50/50 flex justify-between items-start">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary-600 shadow-sm">
              <Package size={24} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Adicionar Cargas</DialogTitle>
              <p className="text-sm text-slate-500 mt-1">
                Cadastre novas cargas individualmente ou em massa via Excel.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-100 flex gap-6">
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'manual'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <Package size={16} />
            Cadastro Individual
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'import'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <Upload size={16} />
            Importar em Massa (Excel)
          </button>
        </div>

        <div className="p-6 h-[400px] lg:h-[500px] overflow-y-auto">
          {activeTab === 'manual' ? (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>House <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.house}
                    onChange={(e) => handleManualChange('house', e.target.value)}
                    className={`h-11 ${errors.house ? 'border-destructive ring-destructive/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0'}`}
                    placeholder="Ex: 123-4567 8901"
                  />
                  {errors.house && <p className="text-xs text-red-500">{errors.house}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Importador <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.importer}
                    onChange={(e) => handleManualChange('importer', e.target.value)}
                    className={`h-11 ${errors.importer ? 'border-destructive ring-destructive/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0'}`}
                    placeholder="Nome do Importador"
                  />
                  {errors.importer && <p className="text-xs text-red-500">{errors.importer}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Tipo (TC)</Label>
                  <Select
                    value={formData.tc}
                    onValueChange={(v) => handleManualChange('tc', v)}
                  >
                    <SelectTrigger className="h-11 border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TCOptions.P}>P (Patio)</SelectItem>
                      <SelectItem value={TCOptions.A}>A (Armazem)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Responsavel</Label>
                  <Input
                    value={formData.responsible}
                    onChange={(e) => handleManualChange('responsible', e.target.value)}
                    className="h-11 border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {/* Warehouse Reason - Only show when TC = A */}
              {formData.tc === TCOptions.A && (
                <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <Label className="text-slate-700 font-semibold flex items-center justify-between">
                    Motivo do Armazém
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Obrigatório</span>
                  </Label>
                  <RadioGroup
                    value={formData.warehouseReason || ''}
                    onValueChange={(value) => handleManualChange('warehouseReason', value as WarehouseReason)}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={WarehouseReason.CV} id="new-cv" />
                      <Label htmlFor="new-cv" className="font-normal cursor-pointer">Canal Vermelho</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={WarehouseReason.MA} id="new-ma" />
                      <Label htmlFor="new-ma" className="font-normal cursor-pointer">Ministério da Agricultura</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={WarehouseReason.RF} id="new-rf" />
                      <Label htmlFor="new-rf" className="font-normal cursor-pointer">Receita Federal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={WarehouseReason.DOC} id="new-doc" />
                      <Label htmlFor="new-doc" className="font-normal cursor-pointer">Documento Pendente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={WarehouseReason.DIV} id="new-div" />
                      <Label htmlFor="new-div" className="font-normal cursor-pointer">Diversos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={WarehouseReason.MT} id="new-mt" />
                      <Label htmlFor="new-mt" className="font-normal cursor-pointer">Mudança de Tratamento</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={WarehouseReason.P} id="new-p" />
                      <Label htmlFor="new-p" className="font-normal cursor-pointer">Removida no Prazo Pátio</Label>
                    </div>
                  </RadioGroup>
                  {errors.warehouseReason && (
                    <p className="text-xs text-destructive font-medium">{errors.warehouseReason}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  Observacoes
                  {formData.tc === TCOptions.A && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Textarea
                  value={formData.observations}
                  onChange={(e) => handleManualChange('observations', e.target.value)}
                  className={`min-h-[100px] resize-none ${errors.observations ? 'border-destructive ring-destructive/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0'}`}
                  placeholder="Informacoes adicionais..."
                />
                {errors.observations && <p className="text-xs text-red-500">{errors.observations}</p>}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Paste Area */}
              <div className="flex-1 flex flex-col gap-4 min-h-[300px]">
                <div className="space-y-2">
                  <Label className="font-medium text-slate-700">1. Copiar e Colar</Label>
                  <p className="text-xs text-slate-500">Copie as colunas <strong>HOUSE</strong> e <strong>IMPORTADOR</strong> do Excel.</p>
                  <Textarea
                    placeholder="Cole aqui..."
                    className="flex-1 h-80 font-mono text-xs resize-none bg-slate-50 focus:bg-white transition-colors focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleParse}
                  disabled={!pasteContent.trim()}
                  variant={pasteContent.trim() ? "default" : "secondary"}
                  className={pasteContent.trim() ? "bg-primary-600 hover:bg-primary-700 text-white" : ""}
                >
                  Processar Dados
                </Button>
              </div>

              <Separator orientation="vertical" className="hidden md:block" />

              {/* Preview Area */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between h-8">
                  <Label className="font-medium text-slate-700">2. Preview</Label>
                  {parsedItems.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => { setParsedItems([]); setPasteContent(''); }} className="h-6 text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
                      Limpar
                    </Button>
                  )}
                </div>

                <div className="flex-1 border rounded-md overflow-hidden bg-slate-50/50 relative">
                  {parsedItems.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                      <FileSpreadsheet className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">Aguardando dados...</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs h-8">House</TableHead>
                            <TableHead className="text-xs h-8">Importador</TableHead>
                            <TableHead className="text-xs h-8 w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedItems.map((item) => (
                            <TableRow key={item.id} className="hover:bg-slate-100">
                              <TableCell className="py-2 text-xs font-mono">{item.house}</TableCell>
                              <TableCell className="py-2 text-xs truncate max-w-[150px]">{item.importer}</TableCell>
                              <TableCell className="py-2">
                                <Button variant="ghost" size="icon" className="h-5 w-5 opacity-50 hover:opacity-100 hover:text-red-500" onClick={() => setParsedItems(p => p.filter(i => i.id !== item.id))}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </div>

                {/* Optionals for Import */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Valores Padrao</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Label className="text-[10px] text-slate-400">TC</Label>
                      <Select value={defaults.tc} onValueChange={(v) => setDefaults(p => ({ ...p, tc: v as TCOptions }))}>
                        <SelectTrigger className="h-7 text-xs bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TCOptions.P}>P</SelectItem>
                          <SelectItem value={TCOptions.A}>A</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-xs text-slate-500">
            {activeTab === 'import' && parsedItems.length > 0 && (
              <span><strong>{parsedItems.length}</strong> itens prontos para importar.</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button
              onClick={activeTab === 'manual' ? submitManual : submitImport}
              disabled={createItemsMutation.isPending || (activeTab === 'import' && parsedItems.length === 0)}
              className="bg-primary-600 hover:bg-primary-700 text-white min-w-[120px]"
            >
              {createItemsMutation.isPending ? 'Salvando...' : 'Salvar Cargas'}
            </Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
