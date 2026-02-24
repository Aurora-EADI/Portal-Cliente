
import React, { useState, useEffect } from 'react';
import { X, Ship, Anchor, Globe, Calendar, Plus, Trash2, Tag, Brackets, Check, Box, PlusCircle, CheckCircle, MapPin, Truck, UserCircle, Clock, DollarSign, Calculator, Code } from 'lucide-react';
import { MaritimeItem, ContainerType, MaritimeSubItem, ContainerEntry } from '../types';
import JsonPreviewModal from './JsonPreviewModal';

interface NewMaritimeItemModalProps {
  onClose: () => void;
  onSubmit: (item: Omit<MaritimeItem, 'id' | 'createdAt'>) => void;
}

const NewMaritimeItemModal: React.FC<NewMaritimeItemModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Omit<MaritimeItem, 'id' | 'createdAt'>>({
    empresa: '',
    dta: '',
    porto: 'CHIBATÃO',
    ataDta: '',
    navio: '',
    ataMao: '',
    transportador: '',
    ataEadi: '',
    conclusao: '',
    comissaria: '',
    fobUsd: 0,
    freteTotal: 0,
    cifUsd: 0,
    containers: []
  });

  const [rows, setRows] = useState<Omit<MaritimeSubItem, 'id'>[]>([
    { containers: [], hbls: [] }
  ]);

  const [currentType, setCurrentType] = useState<ContainerType>(ContainerType.C40);
  const [blInputValues, setBlInputValues] = useState<string[]>(['']);
  const [cntInputValues, setCntInputValues] = useState<string[]>(['']);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      cifUsd: (Number(prev.fobUsd) || 0) + (Number(prev.freteTotal) || 0)
    }));
  }, [formData.fobUsd, formData.freteTotal]);

  const updateRowData = (index: number, field: keyof Omit<MaritimeSubItem, 'id'>, value: any) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const handleAddContainer = (index: number) => {
    const val = cntInputValues[index].trim();
    if (!val) return;

    const currentList = rows[index].containers;
    if (!currentList.some(c => c.number === val.toUpperCase())) {
      const newList: ContainerEntry[] = [...currentList, { number: val.toUpperCase(), tipo: currentType }];
      updateRowData(index, 'containers', newList);
    }

    const next = [...cntInputValues];
    next[index] = '';
    setCntInputValues(next);
  };

  const handleAddBl = (index: number) => {
    const val = blInputValues[index].trim();
    if (!val) return;

    const currentList = rows[index].hbls;
    if (!currentList.includes(val.toUpperCase())) {
      const newList = [...currentList, val.toUpperCase()];
      updateRowData(index, 'hbls', newList);
    }

    const next = [...blInputValues];
    next[index] = '';
    setBlInputValues(next);
  };

  const removeContainer = (rowIndex: number, containerIndex: number) => {
    const newList = rows[rowIndex].containers.filter((_, i) => i !== containerIndex);
    updateRowData(rowIndex, 'containers', newList);
  };

  const removeBl = (rowIndex: number, blIndex: number) => {
    const newList = rows[rowIndex].hbls.filter((_, i) => i !== blIndex);
    updateRowData(rowIndex, 'hbls', newList);
  };

  // Prepara o objeto como ele seria salvo para o preview
  const getPreparedItem = () => {
    return {
      ...formData,
      id: "TEMP-GUID-PENDING",
      createdAt: Date.now(),
      containers: rows.map(r => ({ ...r, id: `LOTE-${Math.random().toString(36).substr(2, 9)}` }))
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rows.some(r => r.hbls.length === 0 || r.containers.length === 0)) {
      alert("Por favor, adicione pelo menos um Container e um H/BL em cada lote.");
      return;
    }
    const finalItem: Omit<MaritimeItem, 'id' | 'createdAt'> = {
      ...formData,
      containers: rows.map(r => ({ ...r, id: `LOTE-${Math.random().toString(36).substring(2, 11)}` }))
    };
    onSubmit(finalItem);
  };

  const labelBase = "text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2 tracking-widest leading-none";
  const inputBase = "h-12 w-full px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all placeholder:text-slate-300 placeholder:font-normal";
  const sectionTitle = "flex items-center gap-3 border-b border-slate-100 pb-4 mb-6";
  const titleText = "text-sm font-black text-slate-800 uppercase tracking-widest";

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 md:p-12">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
        <div className="relative bg-white rounded-[3.5rem] w-full max-w-[95rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh]">
          
          <div className="bg-white px-10 py-6 flex justify-between items-center border-b border-slate-100 shrink-0 relative z-10 text-slate-900">
            <div className="flex items-center gap-5">
              <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100">
                <Anchor className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight leading-none">Novo Registro Marítimo</h3>
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
                    <h4 className={titleText}>1. Terminal</h4>
                  </div>
                  <div>
                    <label className={labelBase}>Porto de Destino</label>
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
                    <h4 className={titleText}>2. Identificação</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                    <div className="lg:col-span-2">
                      <label className={labelBase}>Empresa Importadora</label>
                      <input required className={`${inputBase} uppercase`} placeholder="NOME DO CLIENTE / IMPORTADOR" value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value.toUpperCase()})} />
                    </div>
                    <div>
                      <label className={labelBase}><Box className="w-3 h-3" /> Nº DTA</label>
                      <input required className={`${inputBase} font-mono`} placeholder="00/000000-0" value={formData.dta} onChange={e => setFormData({...formData, dta: e.target.value})} />
                    </div>
                    <div>
                      <label className={labelBase}><Calendar className="w-3 h-3" /> ATA DTA</label>
                      <input type="date" required className={inputBase} value={formData.ataDta} onChange={e => setFormData({...formData, ataDta: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className={sectionTitle}>
                  <Truck className="w-4 h-4 text-primary-600" />
                  <h4 className={titleText}>3. Fluxo Logístico</h4>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end">
                    <div>
                      <label className={labelBase}><Clock className="w-3 h-3" /> ATA / MAO</label>
                      <input type="date" className={inputBase} value={formData.ataMao} onChange={e => setFormData({...formData, ataMao: e.target.value})} />
                    </div>
                    <div className="lg:col-span-2">
                      <label className={labelBase}><Truck className="w-3 h-3" /> Transportador</label>
                      <input className={inputBase} placeholder="NOME DA TRANSPORTADORA" value={formData.transportador} onChange={e => setFormData({...formData, transportador: e.target.value.toUpperCase()})} />
                    </div>
                    <div>
                      <label className={labelBase}><MapPin className="w-3 h-3" /> ATA / EADI</label>
                      <input type="date" className={inputBase} value={formData.ataEadi} onChange={e => setFormData({...formData, ataEadi: e.target.value})} />
                    </div>
                    <div>
                      <label className={labelBase}><CheckCircle className="w-3 h-3" /> Conclusão</label>
                      <input type="date" className={inputBase} value={formData.conclusao} onChange={e => setFormData({...formData, conclusao: e.target.value})} />
                    </div>
                    <div>
                      <label className={labelBase}><UserCircle className="w-3 h-3" /> Comissária</label>
                      <input className={inputBase} placeholder="NOME DA COMISSÁRIA" value={formData.comissaria} onChange={e => setFormData({...formData, comissaria: e.target.value.toUpperCase()})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className={sectionTitle}>
                  <Tag className="w-4 h-4 text-primary-600" />
                  <h4 className={titleText}>4. Itens do Conhecimento (Containers & HBLs)</h4>
                </div>
                <div className="space-y-4">
                  {rows.map((row, index) => (
                    <div key={index} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start shadow-sm border-l-8 border-l-primary-500">
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center h-5">
                          <label className={labelBase}>Nº Containers</label>
                          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            <button 
                              type="button" 
                              onClick={() => setCurrentType(ContainerType.C20)}
                              className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${currentType === ContainerType.C20 ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                            >20'</button>
                            <button 
                              type="button" 
                              onClick={() => setCurrentType(ContainerType.C40)}
                              className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${currentType === ContainerType.C40 ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                            >40'</button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                             <input 
                              type="text" className={`${inputBase} bg-slate-50/50 font-mono uppercase pr-14`} placeholder="ABCD1234567" 
                              value={cntInputValues[index]} onChange={e => {const n = [...cntInputValues]; n[index] = e.target.value; setCntInputValues(n);}}
                              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddContainer(index))}
                            />
                            <div className={`absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[8px] font-black border ${currentType === ContainerType.C20 ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-100 border-slate-300 text-slate-700'}`}>
                               {currentType}'
                            </div>
                          </div>
                          <button type="button" onClick={() => handleAddContainer(index)} className="h-12 w-12 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all shrink-0 shadow-lg shadow-slate-200">
                            <PlusCircle className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[48px] p-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          {row.containers.map((c, ci) => (
                            <span key={ci} className={`px-3 py-2 rounded-xl text-[10px] font-black font-mono flex items-center gap-2 border shadow-sm transition-all animate-in zoom-in ${c.tipo === ContainerType.C20 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-800 text-white border-slate-950'}`}>
                              {c.number} <span className="opacity-40 text-[8px]">({c.tipo}')</span>
                              <button type="button" onClick={() => removeContainer(index, ci)} className="hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                            </span>
                          ))}
                          {row.containers.length === 0 && <span className="text-[10px] text-slate-300 italic self-center ml-2">Aguardando containers...</span>}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="h-5 flex items-center">
                          <label className={labelBase}>Nº H/BLs (House)</label>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" className={`${inputBase} bg-primary-50/30 border-primary-100 uppercase`} placeholder="Ex: MAEU900..." 
                            value={blInputValues[index]} onChange={e => {const n = [...blInputValues]; n[index] = e.target.value; setBlInputValues(n);}}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddBl(index))}
                          />
                          <button type="button" onClick={() => handleAddBl(index)} className="h-12 w-12 bg-primary-600 text-white rounded-xl flex items-center justify-center hover:bg-primary-700 transition-all shrink-0 shadow-lg shadow-primary-200">
                            <PlusCircle className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[48px] p-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          {row.hbls.map((bl, bi) => (
                            <span key={bi} className="bg-primary-50 text-primary-700 px-3 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-primary-100 shadow-sm transition-all animate-in zoom-in">
                              {bl} <button type="button" onClick={() => removeBl(index, bi)} className="hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                            </span>
                          ))}
                          {row.hbls.length === 0 && <span className="text-[10px] text-slate-300 italic self-center ml-2">Aguardando H/BLs...</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className={sectionTitle}>
                  <DollarSign className="w-4 h-4 text-primary-600" />
                  <h4 className={titleText}>5. Financeiro e Navio</h4>
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                  <div>
                    <label className={labelBase}>Navio / Viagem</label>
                    <input required className={inputBase} placeholder="NOME DO NAVIO" value={formData.navio} onChange={e => setFormData({...formData, navio: e.target.value.toUpperCase()})} />
                  </div>
                  
                  <div>
                    <label className={labelBase}>FOB USD</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input type="number" step="0.01" className={`${inputBase} pl-10`} value={formData.fobUsd} onChange={e => setFormData({...formData, fobUsd: Number(e.target.value)})} />
                    </div>
                  </div>
                  
                  <div>
                    <label className={labelBase}>FRETE USD</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input type="number" step="0.01" className={`${inputBase} pl-10`} value={formData.freteTotal} onChange={e => setFormData({...formData, freteTotal: Number(e.target.value)})} />
                    </div>
                  </div>

                  <div>
                    <label className={labelBase}>Total CIF USD (Calculado)</label>
                    <div className="h-12 bg-primary-600 rounded-xl flex items-center px-5 justify-between shadow-xl shadow-primary-500/20">
                      <span className="text-white/60 text-[9px] font-black uppercase tracking-widest">CIF Total</span>
                      <div className="text-white font-black text-lg flex items-baseline gap-1">
                        <span className="text-[10px] opacity-70 font-normal">$</span>
                        {formData.cifUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-slate-50/80 backdrop-blur-sm px-12 py-8 border-t border-slate-100 flex gap-6 shrink-0 relative z-10">
            <button 
              type="button" 
              onClick={() => setShowJsonPreview(true)} 
              className="px-6 h-14 rounded-xl font-black text-indigo-600 hover:bg-indigo-50 transition-all border border-indigo-100 text-[11px] uppercase tracking-widest flex items-center gap-2"
            >
              <Code className="w-4 h-4" /> Inspecionar JSON
            </button>
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="px-10 h-14 rounded-xl font-black text-slate-400 hover:bg-white hover:text-slate-600 transition-all border border-slate-200 text-[11px] uppercase tracking-widest">
              Descartar
            </button>
            <button onClick={handleSubmit} className="px-12 h-14 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-xl shadow-xl shadow-primary-500/20 transition-all active:scale-[0.98] text-[11px] uppercase tracking-widest flex items-center justify-center gap-3">
              <CheckCircle className="w-5 h-5" /> Finalizar Registro
            </button>
          </div>
        </div>
      </div>

      {showJsonPreview && (
        <JsonPreviewModal data={getPreparedItem()} onClose={() => setShowJsonPreview(false)} />
      )}
    </>
  );
};

export default NewMaritimeItemModal;
