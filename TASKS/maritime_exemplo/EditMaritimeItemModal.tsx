
import React, { useState, useEffect } from 'react';
import { X, Ship, Anchor, Globe, Save, Plus, Trash2, Tag, Brackets, Check, Box, PlusCircle, MapPin, CheckCircle, Truck, Clock, UserCircle, DollarSign } from 'lucide-react';
import { MaritimeItem, ContainerType, MaritimeSubItem, ContainerEntry } from '../types';

interface EditMaritimeItemModalProps {
  item: MaritimeItem;
  onClose: () => void;
  onSubmit: (updates: Partial<MaritimeItem>) => void;
}

const EditMaritimeItemModal: React.FC<EditMaritimeItemModalProps> = ({ item, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<MaritimeItem>>({ ...item });
  const [rows, setRows] = useState<MaritimeSubItem[]>(item.containers || []);
  const [currentType, setCurrentType] = useState<ContainerType>(ContainerType.C40);
  const [blInputValues, setBlInputValues] = useState<string[]>(item.containers.map(() => ''));
  const [cntInputValues, setCntInputValues] = useState<string[]>(item.containers.map(() => ''));

  useEffect(() => {
    const cif = (Number(formData.fobUsd) || 0) + (Number(formData.freteTotal) || 0);
    if (cif !== formData.cifUsd) {
      setFormData(prev => ({ ...prev, cifUsd: cif }));
    }
  }, [formData.fobUsd, formData.freteTotal]);

  const updateRowData = (id: string, field: keyof MaritimeSubItem, value: any) => {
    const updated = rows.map(r => r.id === id ? { ...r, [field]: value } : r);
    setRows(updated);
  };

  const handleAddContainer = (index: number) => {
    const val = cntInputValues[index].trim();
    if (!val) return;

    const currentList = rows[index].containers;
    if (!currentList.some(c => c.number === val.toUpperCase())) {
      const newList: ContainerEntry[] = [...currentList, { number: val.toUpperCase(), tipo: currentType }];
      updateRowData(rows[index].id, 'containers', newList);
    }

    const n = [...cntInputValues]; n[index] = ''; setCntInputValues(n);
  };

  const handleAddBl = (index: number) => {
    const val = blInputValues[index].trim();
    if (!val) return;

    const currentList = rows[index].hbls;
    if (!currentList.includes(val.toUpperCase())) {
      updateRowData(rows[index].id, 'hbls', [...currentList, val.toUpperCase()]);
    }

    const n = [...blInputValues]; n[index] = ''; setBlInputValues(n);
  };

  const removeContainer = (rowIndex: number, containerIndex: number) => {
    const newList = rows[rowIndex].containers.filter((_, i) => i !== containerIndex);
    updateRowData(rows[rowIndex].id, 'containers', newList);
  };

  const removeBl = (rowIndex: number, blIndex: number) => {
    const newList = rows[rowIndex].hbls.filter((_, i) => i !== blIndex);
    updateRowData(rows[rowIndex].id, 'hbls', newList);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, containers: rows });
  };

  const inputBase = "h-12 w-full px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all";
  const labelBase = "text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2 tracking-widest leading-none";
  const sectionTitle = "flex items-center gap-3 border-b border-slate-100 pb-4 mb-6";
  const titleText = "text-sm font-black text-slate-800 uppercase tracking-widest";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 md:p-12">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white rounded-[3rem] w-full max-w-[95rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in duration-300">
        
        <div className="bg-white px-10 py-6 flex justify-between items-center border-b border-slate-100 shrink-0 shadow-sm relative z-10 text-slate-900">
          <div className="flex items-center gap-5">
            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
              <Anchor className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight leading-none">Editar Lote Marítimo</h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1.5">Módulo de Gestão de Carga Marítima</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 text-slate-400 rounded-full transition-colors border border-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/20">
          <form onSubmit={handleSubmit} className="p-10 space-y-12 pb-32">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 space-y-5">
                <div className={sectionTitle}>
                  <MapPin className="w-4 h-4 text-primary-600" />
                  <h4 className={titleText}>Terminal</h4>
                </div>
                <div>
                  <label className={labelBase}>Selecione o Terminal</label>
                  <div className="grid grid-cols-2 gap-3 h-12">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, porto: 'CHIBATÃO' })}
                      className={`flex items-center justify-center gap-2 h-full rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-wider ${
                        formData.porto === 'CHIBATÃO' 
                          ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-sm' 
                          : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <Anchor className="w-4 h-4" /> Chibatão
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, porto: 'SUPER TERMINAIS' })}
                      className={`flex items-center justify-center gap-2 h-full rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-wider ${
                        formData.porto === 'SUPER TERMINAIS' 
                          ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-sm' 
                          : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <Ship className="w-4 h-4" /> Super
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-5">
                <div className={sectionTitle}>
                  <Globe className="w-4 h-4 text-primary-600" />
                  <h4 className={titleText}>Dados do Processo</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                  <div className="lg:col-span-2">
                    <label className={labelBase}>Empresa Importadora</label>
                    <input required className={`${inputBase} uppercase`} value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value.toUpperCase()})} />
                  </div>
                  <div>
                    <label className={labelBase}>Nº DTA</label>
                    <input className={`${inputBase} font-mono`} value={formData.dta} onChange={e => setFormData({...formData, dta: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelBase}>ATA DTA</label>
                    <input type="date" className={inputBase} value={formData.ataDta} onChange={e => setFormData({...formData, ataDta: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className={sectionTitle}>
                <Truck className="w-4 h-4 text-primary-600" />
                <h4 className={titleText}>Fluxo Logístico</h4>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end">
                  <div><label className={labelBase}>ATA / MAO</label><input type="date" className={inputBase} value={formData.ataMao} onChange={e => setFormData({...formData, ataMao: e.target.value})} /></div>
                  <div className="lg:col-span-2"><label className={labelBase}>Transportador</label><input className={inputBase} value={formData.transportador} onChange={e => setFormData({...formData, transportador: e.target.value.toUpperCase()})} /></div>
                  <div><label className={labelBase}>ATA / EADI</label><input type="date" className={inputBase} value={formData.ataEadi} onChange={e => setFormData({...formData, ataEadi: e.target.value})} /></div>
                  <div><label className={labelBase}>Conclusão</label><input type="date" className={inputBase} value={formData.conclusao} onChange={e => setFormData({...formData, conclusao: e.target.value})} /></div>
                  <div><label className={labelBase}>Comissária</label><input className={inputBase} value={formData.comissaria} onChange={e => setFormData({...formData, comissaria: e.target.value.toUpperCase()})} /></div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className={sectionTitle}>
                <Tag className="w-4 h-4 text-primary-600" />
                <h4 className={titleText}>Containers e HBLs Vinculados</h4>
              </div>
              {rows.map((row, index) => (
                <div key={row.id} className="bg-white rounded-[2rem] border border-slate-100 p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start shadow-sm">
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className={labelBase}>Containers</label>
                      <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                        <button type="button" onClick={() => setCurrentType(ContainerType.C20)} className={`px-3 py-1 rounded-md text-[9px] font-black ${currentType === ContainerType.C20 ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400'}`}>20'</button>
                        <button type="button" onClick={() => setCurrentType(ContainerType.C40)} className={`px-3 py-1 rounded-md text-[9px] font-black ${currentType === ContainerType.C40 ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400'}`}>40'</button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" className={`${inputBase} bg-slate-50/50 font-mono uppercase`} placeholder="Nº Container..." 
                        value={cntInputValues[index]} onChange={e => {const n = [...cntInputValues]; n[index] = e.target.value; setCntInputValues(n);}}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddContainer(index))}
                      />
                      <button type="button" onClick={() => handleAddContainer(index)} className="h-12 w-12 bg-slate-900 text-white rounded-xl flex items-center justify-center transition-all shrink-0"><PlusCircle className="w-5 h-5" /></button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                      {row.containers.map((c, ci) => (
                        <span key={ci} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase font-mono flex items-center gap-2 border ${c.tipo === ContainerType.C20 ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-800 text-white border-slate-900'}`}>
                          {c.number} ({c.tipo}') <button type="button" onClick={() => removeContainer(index, ci)}><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                        <label className={labelBase}>H/BLs</label>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" className={`${inputBase} border-primary-100 bg-primary-50/20`} placeholder="Nº H/BL..." 
                        value={blInputValues[index]} onChange={e => {const n = [...blInputValues]; n[index] = e.target.value; setBlInputValues(n);}}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddBl(index))}
                      />
                      <button type="button" onClick={() => handleAddBl(index)} className="h-12 w-12 bg-primary-600 text-white rounded-xl flex items-center justify-center transition-all shrink-0"><PlusCircle className="w-5 h-5" /></button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                      {row.hbls.map((bl, bi) => (
                        <span key={bi} className="bg-primary-50 text-primary-700 px-3 py-2 rounded-xl text-[10px] font-black uppercase border border-primary-100">
                          {bl} <button type="button" onClick={() => removeBl(index, bi)}><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className={sectionTitle}>
                <DollarSign className="w-4 h-4 text-primary-600" />
                <h4 className={titleText}>Valores Financeiros</h4>
              </div>
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                <div><label className={labelBase}>Navio</label><input required className={inputBase} value={formData.navio} onChange={e => setFormData({...formData, navio: e.target.value.toUpperCase()})} /></div>
                <div><label className={labelBase}>FOB USD</label><input type="number" step="0.01" className={inputBase} value={formData.fobUsd} onChange={e => setFormData({...formData, fobUsd: Number(e.target.value)})} /></div>
                <div><label className={labelBase}>Frete USD</label><input type="number" step="0.01" className={inputBase} value={formData.freteTotal} onChange={e => setFormData({...formData, freteTotal: Number(e.target.value)})} /></div>
                <div>
                    <label className={labelBase}>Total CIF USD (Auto)</label>
                    <div className="h-12 bg-slate-900 rounded-xl flex items-center px-5 justify-between shadow-lg shadow-slate-200">
                        <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Total</span>
                        <div className="text-white font-black text-lg">$ {formData.cifUsd?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="bg-slate-50/80 backdrop-blur-sm px-12 py-8 border-t border-slate-100 flex gap-6 shrink-0 z-10">
          <button type="button" onClick={onClose} className="flex-1 h-14 rounded-xl font-black text-slate-400 hover:bg-white transition border border-slate-200 text-[11px] uppercase tracking-widest">Voltar</button>
          <button onClick={handleSubmit} className="flex-[2] h-14 bg-slate-900 hover:bg-black text-white font-black rounded-xl shadow-xl transition active:scale-[0.98] text-[11px] uppercase tracking-widest flex items-center justify-center gap-3">
            <Save className="w-5 h-5" /> Salvar Lote
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMaritimeItemModal;
