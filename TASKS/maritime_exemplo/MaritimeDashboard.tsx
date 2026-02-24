
import React, { useState, useMemo } from 'react';
import { MaritimeItem, ContainerType } from '../types';
import { 
  PlusCircle, 
  Search, 
  Ship, 
  Trash2, 
  Edit3, 
  Anchor,
  MapPin,
  Calendar,
  Layers,
  Box,
  Code,
  User,
  ShieldCheck,
  FileText
} from 'lucide-react';
import NewMaritimeItemModal from './NewMaritimeItemModal';
import EditMaritimeItemModal from './EditMaritimeItemModal';
import JsonPreviewModal from './JsonPreviewModal';

interface MaritimeDashboardProps {
  items: MaritimeItem[];
  onAddItem: (item: Omit<MaritimeItem, 'id' | 'createdAt'>) => void;
  onUpdateItem: (id: string, updates: Partial<MaritimeItem>) => void;
  onDeleteItem: (id: string) => void;
}

const MaritimeDashboard: React.FC<MaritimeDashboardProps> = ({ 
  items, 
  onAddItem, 
  onUpdateItem, 
  onDeleteItem 
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MaritimeItem | null>(null);
  const [previewJsonItem, setPreviewJsonItem] = useState<MaritimeItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.dta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.navio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.porto && item.porto.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.containers.some(r => 
        r.containers.some(c => c.number.toLowerCase().includes(searchTerm.toLowerCase())) || 
        r.hbls.some(hbl => hbl.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    );
  }, [items, searchTerm]);

  const getContainerSummary = (maritimeItem: MaritimeItem) => {
    let c20 = 0;
    let c40 = 0;
    maritimeItem.containers.forEach(sub => {
      sub.containers.forEach(c => {
        if (c.tipo === ContainerType.C20) c20++;
        else c40++;
      });
    });
    return { c20, c40 };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-800">Controle Marítimo</h2>
        <p className="text-slate-500 text-sm">Gerencie os lotes marítimos e seus containers.</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por Empresa, DTA ou Container..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none transition shadow-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="bg-[#eb6a2d] hover:bg-[#d45a20] text-white px-8 py-3 rounded-lg font-bold text-sm transition-all active:scale-95">
          Buscar
        </button>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-lg font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Novo Lote</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200">
                <th className="px-6 py-4">Empresa</th>
                <th className="px-6 py-4">Responsável</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Detalhes</th>
                <th className="px-6 py-4">Autorização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center text-slate-400 italic font-medium">
                    <Box className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    Nenhum registro marítimo encontrado.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                            <Ship className="w-5 h-5 text-[#eb6a2d]" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm uppercase">{item.empresa}</div>
                            <div className="text-xs text-slate-500 font-medium">{item.dta}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <User className="w-4 h-4" />
                          <span className="text-xs font-medium uppercase">{item.transportador || '-'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase ${
                          item.porto === 'CHIBATÃO' 
                            ? 'bg-blue-50 text-blue-600' 
                            : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {item.porto === 'CHIBATÃO' ? 'Em Aprovação' : 'Ativo'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setPreviewJsonItem(item)}
                          className="flex items-center gap-2 px-4 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition text-xs font-bold"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Detalhes
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSelectedItem(item)}
                            className="flex items-center gap-2 px-4 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition text-xs font-bold"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Gerenciar
                          </button>
                          <button 
                            onClick={() => { if(window.confirm('Excluir este lote completo?')) onDeleteItem(item.id); }}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <NewMaritimeItemModal onClose={() => setIsAddModalOpen(false)} onSubmit={(item) => { onAddItem(item); setIsAddModalOpen(false); }} />
      )}

      {selectedItem && (
        <EditMaritimeItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onSubmit={(updates) => { onUpdateItem(selectedItem.id, updates); setSelectedItem(null); }} />
      )}

      {previewJsonItem && (
        <JsonPreviewModal data={previewJsonItem} onClose={() => setPreviewJsonItem(null)} />
      )}
    </div>
  );
};

export default MaritimeDashboard;
