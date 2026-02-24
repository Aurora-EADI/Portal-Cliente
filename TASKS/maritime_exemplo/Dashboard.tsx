
import React, { useState, useMemo } from 'react';
import { Flight, FlightStatus, CargoItem } from '../types';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ChevronRight,
  Filter
} from 'lucide-react';

interface DashboardProps {
  flights: Flight[];
  items: CargoItem[];
  onSelectFlight: (id: string) => void;
  onOpenNewFlight: () => void;
  viewMode: 'active' | 'history' | 'home';
}

const Dashboard: React.FC<DashboardProps> = ({ flights, items, onSelectFlight, onOpenNewFlight, viewMode }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFlights = useMemo(() => {
    if (!searchTerm) return flights;
    const term = searchTerm.toLowerCase();
    return flights.filter(flight => 
      flight.flightCode.toLowerCase().includes(term) ||
      flight.aircraftName.toLowerCase().includes(term) ||
      flight.arrivalDate.includes(term)
    );
  }, [flights, searchTerm]);

  // View Mode: HOME (Módulo CCTE - Bege/Marrom)
  if (viewMode === 'home') {
    return (
      <div className="animate-in fade-in duration-700 h-full flex items-start pt-4">
        <div className="bg-[#fffdfa] border border-[#f5e6d3] rounded-[1.2rem] p-12 w-full max-w-6xl shadow-[0_2px_15px_-3px_rgba(139,69,19,0.05)]">
          <h2 className="text-[22px] font-bold text-[#8b4513] mb-8 tracking-tight">
            Bem-vindo ao Módulo CCTE
          </h2>
          <div className="space-y-7 text-[#8b4513]/90 leading-relaxed text-[16px] font-medium">
            <p>
              Aqui você encontrará as informações e fluxos necessários para gerenciar operações de carga aérea e marítima, incluindo controle de voos, cargas, DTAs, processos marítimos e valores.
            </p>
            <p>
              Este espaço foi desenvolvido para centralizar a operação, garantir rastreabilidade e apoiar a execução eficiente das atividades do dia a dia.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // View Mode: ACTIVE / HISTORY (Padrão solicitado na imagem, sem os cards de estatísticas)
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header com Título e Botão Novo */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-tight">
            {viewMode === 'active' ? 'Controle Aéreo' : 'Histórico CCTE'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {viewMode === 'active' 
              ? 'Gerencie as operações de voos e conferência de cargas.' 
              : 'Consulte o histórico de voos finalizados.'}
          </p>
        </div>
        {viewMode === 'active' && (
          <button 
            onClick={onOpenNewFlight}
            className="bg-[#eb6a2d] hover:bg-[#d45a20] text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95 shadow-lg shadow-orange-200"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Voo</span>
          </button>
        )}
      </div>

      {/* Barra de Pesquisa */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input 
            type="text"
            placeholder="Buscar por codigo, aeronave ou data..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all text-sm font-medium placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="bg-[#eb6a2d] text-white px-10 py-3.5 rounded-xl font-bold hover:bg-[#d45a20] transition-colors">
          Buscar
        </button>
      </div>

      {/* Tabela de Resultados */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-900 text-xs font-black uppercase tracking-widest border-b border-slate-200">
              <th className="px-8 py-5">Código</th>
              <th className="px-8 py-5">Aeronave</th>
              <th className="px-8 py-5">Data de Chegada</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredFlights.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium italic">
                  Nenhum voo encontrado.
                </td>
              </tr>
            ) : (
              filteredFlights.map((flight) => (
                <tr key={flight.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5 font-bold text-slate-900 text-sm">{flight.flightCode}</td>
                  <td className="px-8 py-5 font-bold text-slate-600 text-sm uppercase">{flight.aircraftName}</td>
                  <td className="px-8 py-5 text-slate-500 text-sm">{flight.arrivalDate}</td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      flight.status === FlightStatus.PENDING 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {flight.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button 
                      onClick={() => onSelectFlight(flight.id)}
                      className="inline-flex items-center gap-2 text-slate-400 hover:text-[#eb6a2d] transition-colors font-bold text-xs uppercase"
                    >
                      <Eye className="w-4 h-4" />
                      Gerenciar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
