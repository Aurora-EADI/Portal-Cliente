'use client';

import React, { useState } from 'react';
import { Plus, Search, User, Truck, CheckCircle, X } from 'lucide-react';
import { useAgendamento } from '@/context/AgendamentoContext';
import { Motorista, Veiculo } from '@/types/agendamento';
import { formatCPF, formatPhone, formatPlaca } from '@/lib/agendamento';

export function MotoristasView() {
  const { motoristas, veiculos, handleAddMotorista, handleAddVeiculo } = useAgendamento();
  const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles'>('drivers');
  const [driverSearch, setDriverSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  const [formName, setFormName] = useState('');
  const [formCPF, setFormCPF] = useState('');
  const [formCNH, setFormCNH] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [driverErrors, setDriverErrors] = useState<string[]>([]);

  const [formPlaca, setFormPlaca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formTipo, setFormTipo] = useState('Cavalo Mecânico');
  const [vehicleErrors, setVehicleErrors] = useState<string[]>([]);

  const filteredDrivers = motoristas.filter(d =>
    !driverSearch.trim() ||
    d.nome.toLowerCase().includes(driverSearch.toLowerCase()) ||
    d.cpf.includes(driverSearch)
  );

  const filteredVehicles = veiculos.filter(v =>
    !vehicleSearch.trim() ||
    v.placa.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.modelo.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const validateDriver = () => {
    const errors: string[] = [];
    if (formName.trim().length < 5) errors.push('Nome deve ter ao menos 5 caracteres.');
    const cpf = formCPF.replace(/\D/g,'');
    if (cpf.length !== 11) errors.push('CPF inválido.');
    if (motoristas.some(m => m.cpf.replace(/\D/g,'') === cpf)) errors.push('CPF já cadastrado.');
    if (formCNH.replace(/\D/g,'').length !== 11) errors.push('CNH inválida (11 dígitos).');
    if (formPhone.replace(/\D/g,'').length < 10) errors.push('Telefone inválido.');
    setDriverErrors(errors);
    return errors.length === 0;
  };

  const validateVehicle = () => {
    const errors: string[] = [];
    if (formPlaca.trim().length !== 7) errors.push('Placa inválida (7 caracteres).');
    if (veiculos.some(v => v.placa.toUpperCase() === formPlaca.toUpperCase())) errors.push('Placa já cadastrada.');
    if (formModelo.trim().length < 3) errors.push('Modelo deve ter ao menos 3 caracteres.');
    setVehicleErrors(errors);
    return errors.length === 0;
  };

  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDriver()) return;
    handleAddMotorista({ id: `mot-${Date.now()}`, nome: formName.trim(), cpf: formCPF, cnh: formCNH, telefone: formPhone });
    setFormName(''); setFormCPF(''); setFormCNH(''); setFormPhone(''); setDriverErrors([]);
    setShowAddDriver(false);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateVehicle()) return;
    handleAddVeiculo({ id: `veic-${Date.now()}`, placa: formPlaca.toUpperCase().trim(), modelo: formModelo.trim(), tipo: formTipo });
    setFormPlaca(''); setFormModelo(''); setFormTipo('Cavalo Mecânico'); setVehicleErrors([]);
    setShowAddVehicle(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white border border-zinc-200 rounded-xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-zinc-900">Diretório de Motoristas & Veículos</h2>
          <p className="text-xs text-zinc-500 mt-1">Cadastros credenciados para retirada FCL</p>
        </div>
        <button
          onClick={() => { if (activeTab === 'drivers') setShowAddDriver(true); else setShowAddVehicle(true); }}
          className="inline-flex items-center gap-1.5 bg-[#ED6A23] hover:bg-[#D45917] text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'drivers' ? 'Novo Motorista' : 'Novo Veículo'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex border-b border-zinc-200">
          {[{ id: 'drivers' as const, label: 'Motoristas', icon: User }, { id: 'vehicles' as const, label: 'Veículos', icon: Truck }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-colors cursor-pointer ${activeTab === tab.id ? 'text-[#ED6A23] border-b-2 border-[#ED6A23] bg-orange-50/30' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'}`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'drivers' ? 'Buscar motoristas...' : 'Buscar veículos...'}
              value={activeTab === 'drivers' ? driverSearch : vehicleSearch}
              onChange={(e) => activeTab === 'drivers' ? setDriverSearch(e.target.value) : setVehicleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-zinc-800"
            />
          </div>

          {/* Drivers table */}
          {activeTab === 'drivers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    {['Nome Completo', 'CPF', 'CNH', 'Telefone', 'Status'].map(h => (
                      <th key={h} className="text-left py-3 px-3 font-bold text-zinc-500 uppercase tracking-wider text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredDrivers.map(d => (
                    <tr key={d.id} className="hover:bg-zinc-50/60">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                            {d.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <span className="font-semibold text-zinc-800">{d.nome}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-600">{d.cpf}</td>
                      <td className="py-3 px-3 font-mono text-zinc-600">{d.cnh}</td>
                      <td className="py-3 px-3 text-zinc-600">{d.telefone}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          <CheckCircle className="w-3 h-3" /> Ativo
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredDrivers.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-zinc-400 text-xs">Nenhum motorista encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Vehicles table */}
          {activeTab === 'vehicles' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    {['Placa', 'Modelo / Marca', 'Tipo de Carroceria', 'Status'].map(h => (
                      <th key={h} className="text-left py-3 px-3 font-bold text-zinc-500 uppercase tracking-wider text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredVehicles.map(v => (
                    <tr key={v.id} className="hover:bg-zinc-50/60">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-sky-800 text-sm">{v.placa}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-zinc-700">{v.modelo}</td>
                      <td className="py-3 px-3 text-zinc-500">{v.tipo}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          <CheckCircle className="w-3 h-3" /> Ativo
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredVehicles.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-zinc-400 text-xs">Nenhum veículo encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Driver Modal */}
      {showAddDriver && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200">
              <h3 className="text-sm font-extrabold text-zinc-900">Cadastrar Novo Motorista</h3>
              <button onClick={() => setShowAddDriver(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveDriver} className="p-5 space-y-4 text-xs">
              {driverErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700 font-semibold">
                  {driverErrors.map((e, i) => <p key={i}>• {e}</p>)}
                </div>
              )}
              <div>
                <label className="text-zinc-600 font-bold block mb-1.5">Nome Completo *</label>
                <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome Civil"
                  className="w-full py-2 px-3 border border-zinc-200 rounded-lg bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-600 font-bold block mb-1.5">CPF *</label>
                  <input type="text" required value={formCPF} onChange={(e) => setFormCPF(formatCPF(e.target.value))} placeholder="000.000.000-00"
                    className="w-full py-2 px-3 border border-zinc-200 rounded-lg bg-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="text-zinc-600 font-bold block mb-1.5">Nº CNH *</label>
                  <input type="text" required maxLength={11} value={formCNH} onChange={(e) => setFormCNH(e.target.value.replace(/\D/g,''))} placeholder="CNH (11 dígitos)"
                    className="w-full py-2 px-3 border border-zinc-200 rounded-lg bg-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>
              <div>
                <label className="text-zinc-600 font-bold block mb-1.5">Telefone *</label>
                <input type="text" required value={formPhone} onChange={(e) => setFormPhone(formatPhone(e.target.value))} placeholder="(00) 00000-0000"
                  className="w-full py-2 px-3 border border-zinc-200 rounded-lg bg-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddDriver(false)} className="px-4 py-2 border border-zinc-200 text-zinc-600 bg-white rounded-lg font-semibold text-xs">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 text-xs shadow-sm">Cadastrar Motorista</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddVehicle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200">
              <h3 className="text-sm font-extrabold text-zinc-900">Cadastrar Novo Veículo</h3>
              <button onClick={() => setShowAddVehicle(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveVehicle} className="p-5 space-y-4 text-xs">
              {vehicleErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700 font-semibold">
                  {vehicleErrors.map((e, i) => <p key={i}>• {e}</p>)}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-600 font-bold block mb-1.5">Placa *</label>
                  <input type="text" required value={formPlaca} onChange={(e) => setFormPlaca(formatPlaca(e.target.value))} placeholder="ABC1D23"
                    className="w-full py-2 px-3 border border-zinc-200 rounded-lg bg-white font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="text-zinc-600 font-bold block mb-1.5">Tipo de Carroceria *</label>
                  <select value={formTipo} onChange={(e) => setFormTipo(e.target.value)} className="w-full py-2 px-3 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <option value="Cavalo Mecânico">Cavalo Mecânico</option>
                    <option value="Carreta Porta-Container">Carreta Porta-Container</option>
                    <option value="Truck 3/4">Truck 3/4</option>
                    <option value="Bi-trem / Rodotrem">Bi-trem / Rodotrem</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-zinc-600 font-bold block mb-1.5">Modelo / Marca *</label>
                <input type="text" required value={formModelo} onChange={(e) => setFormModelo(e.target.value)} placeholder="Ex: Scania R450, Volvo FH"
                  className="w-full py-2 px-3 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddVehicle(false)} className="px-4 py-2 border border-zinc-200 text-zinc-600 bg-white rounded-lg font-semibold text-xs">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 text-xs shadow-sm">Cadastrar Veículo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
