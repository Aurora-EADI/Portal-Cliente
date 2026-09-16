'use client';

import React, { useState } from 'react';
import { Search, ArrowLeft, ChevronRight, Truck, PlusCircle, User, ShieldCheck, FileSignature, CreditCard } from 'lucide-react';
import { Motorista, Veiculo } from '@/types/agendamento';
import { formatCPF, formatPhone, formatPlaca } from '@/lib/agendamento';

interface DriverStepProps {
  motoristas: Motorista[];
  onAddMotorista: (m: Motorista) => void;
  selectedMotorista: Motorista | null;
  onSelectMotorista: (m: Motorista | null) => void;
  veiculos: Veiculo[];
  onAddVeiculo: (v: Veiculo) => void;
  selectedVeiculo: Veiculo | null;
  onSelectVeiculo: (v: Veiculo | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DriverStep({ motoristas, onAddMotorista, selectedMotorista, onSelectMotorista, veiculos, onAddVeiculo, selectedVeiculo, onSelectVeiculo, onNext, onBack }: DriverStepProps) {
  const [driverSearch, setDriverSearch] = useState('');
  const [isRegDriver, setIsRegDriver] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [isRegVehicle, setIsRegVehicle] = useState(false);

  const [formName, setFormName] = useState('');
  const [formCPF, setFormCPF] = useState('');
  const [formCNH, setFormCNH] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [driverErrors, setDriverErrors] = useState<string[]>([]);

  const [formPlaca, setFormPlaca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formTipo, setFormTipo] = useState('Cavalo Mecânico');
  const [vehicleErrors, setVehicleErrors] = useState<string[]>([]);

  const filteredDrivers = driverSearch.trim()
    ? motoristas.filter(d => d.nome.toLowerCase().includes(driverSearch.toLowerCase()) || d.cpf.replace(/\D/g,'').includes(driverSearch.replace(/\D/g,'')))
    : [];

  const filteredVehicles = vehicleSearch.trim()
    ? veiculos.filter(v => v.placa.toLowerCase().includes(vehicleSearch.toLowerCase()) || v.modelo.toLowerCase().includes(vehicleSearch.toLowerCase()))
    : [];

  const validateDriver = () => {
    const errors: string[] = [];
    if (formName.trim().length < 5) errors.push('Nome deve ter ao menos 5 caracteres.');
    const cpf = formCPF.replace(/\D/g,'');
    if (cpf.length !== 11) errors.push('CPF inválido (11 dígitos).');
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
    const newDriver: Motorista = { id: `mot-${Date.now()}`, nome: formName.trim(), cpf: formCPF, cnh: formCNH, telefone: formPhone };
    onAddMotorista(newDriver);
    onSelectMotorista(newDriver);
    setDriverSearch(newDriver.nome);
    setIsRegDriver(false);
    setFormName(''); setFormCPF(''); setFormCNH(''); setFormPhone(''); setDriverErrors([]);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateVehicle()) return;
    const newVehicle: Veiculo = { id: `veic-${Date.now()}`, placa: formPlaca.toUpperCase().trim(), modelo: formModelo.trim(), tipo: formTipo };
    onAddVeiculo(newVehicle);
    onSelectVeiculo(newVehicle);
    setVehicleSearch(newVehicle.placa);
    setIsRegVehicle(false);
    setFormPlaca(''); setFormModelo(''); setFormTipo('Cavalo Mecânico'); setVehicleErrors([]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 md:p-5 flex items-start gap-4">
        <div className="bg-sky-50 text-sky-700 p-2 rounded-lg"><Truck className="w-5 h-5 text-[#ED6A23]" /></div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Identificação do Motorista e Veículo</h3>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Selecione ou cadastre o condutor e o veículo separadamente.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left */}
        <div className="lg:col-span-7 space-y-6">
          {/* Motorista */}
          <div className={`p-5 rounded-xl border transition-all ${!selectedMotorista ? 'border-sky-300 bg-white shadow-sm' : 'border-zinc-200 bg-zinc-50/40'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${selectedMotorista ? 'bg-emerald-500 text-white' : 'bg-sky-600 text-white'}`}>
                  {selectedMotorista ? '✓' : '1'}
                </span>
                <h4 className="text-sm font-bold text-zinc-900">Selecionar Condutor</h4>
              </div>
              {selectedMotorista && (
                <button onClick={() => { onSelectMotorista(null); setDriverSearch(''); }} className="text-xs text-[#ED6A23] font-bold hover:underline">Alterar</button>
              )}
            </div>

            {!selectedMotorista ? (
              <div className="space-y-4">
                {!isRegDriver ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="text" placeholder="Pesquise por CPF ou Nome..." value={driverSearch} onChange={(e) => setDriverSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-lg text-xs bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    {driverSearch.trim() && (
                      <div className="border border-zinc-150 rounded-lg overflow-hidden bg-white shadow-sm">
                        <div className="bg-zinc-50 text-zinc-400 text-[9px] uppercase font-bold px-3 py-1.5 border-b border-zinc-100">Resultados ({filteredDrivers.length})</div>
                        {filteredDrivers.length === 0 ? (
                          <div className="p-4 text-center space-y-2">
                            <p className="text-xs text-zinc-500">Nenhum motorista encontrado.</p>
                            <button type="button" onClick={() => { setIsRegDriver(true); if (driverSearch.length >= 4) setFormName(driverSearch); }}
                              className="text-xs text-sky-600 font-bold flex items-center gap-1 mx-auto hover:underline">
                              <PlusCircle className="w-3.5 h-3.5" /> Cadastrar "{driverSearch}"
                            </button>
                          </div>
                        ) : (
                          <div className="divide-y divide-zinc-100 max-h-48 overflow-y-auto">
                            {filteredDrivers.map(item => (
                              <button key={item.id} type="button" onClick={() => { onSelectMotorista(item); setDriverSearch(item.nome); }}
                                className="w-full text-left p-3 hover:bg-sky-50/50 flex justify-between items-center text-xs text-zinc-700">
                                <div>
                                  <p className="font-bold text-zinc-850">{item.nome}</p>
                                  <p className="text-[10px] text-zinc-400 mt-0.5">CPF: {item.cpf} • CNH: {item.cnh}</p>
                                </div>
                                <span className="text-xs text-sky-600 font-bold">✓ Selecionar</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {!driverSearch.trim() && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Atalhos:</span>
                        <div className="flex flex-wrap gap-2">
                          {motoristas.slice(0, 3).map(item => (
                            <button key={item.id} type="button" onClick={() => { onSelectMotorista(item); setDriverSearch(item.nome); }}
                              className="text-xs bg-white text-zinc-700 font-semibold py-1.5 px-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm">
                              <User className="w-3 h-3 text-zinc-400" />
                              <span>{item.nome.split(' ')[0]} ({item.cpf.slice(0,7)}...)</span>
                            </button>
                          ))}
                          <button type="button" onClick={() => setIsRegDriver(true)}
                            className="text-xs bg-sky-50 text-sky-700 border border-sky-150 py-1.5 px-3 rounded-lg font-bold flex items-center gap-1 hover:bg-sky-100 cursor-pointer">
                            <PlusCircle className="w-3.5 h-3.5" /> <span>Novo Motorista</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSaveDriver} className="space-y-3.5 text-xs bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                      <span className="font-bold text-zinc-800">Cadastrar Novo Condutor</span>
                      <button type="button" onClick={() => setIsRegDriver(false)} className="text-zinc-500 hover:text-zinc-900 underline font-semibold">Buscar na lista</button>
                    </div>
                    {driverErrors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 p-2.5 rounded text-red-700 font-semibold">
                        {driverErrors.map((e, i) => <p key={i}>• {e}</p>)}
                      </div>
                    )}
                    <div>
                      <label className="text-zinc-500 font-bold block mb-1">Nome Completo *</label>
                      <input type="text" required placeholder="Nome Civil" value={formName} onChange={(e) => setFormName(e.target.value)}
                        className="w-full py-1.5 px-3 border border-zinc-250 bg-white text-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-zinc-500 font-bold block mb-1">CPF *</label>
                        <input type="text" required placeholder="000.000.000-00" value={formCPF} onChange={(e) => setFormCPF(formatCPF(e.target.value))}
                          className="w-full py-1.5 px-3 border border-zinc-250 bg-white rounded-lg text-xs font-mono focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-zinc-500 font-bold block mb-1">Nº CNH *</label>
                        <input type="text" required maxLength={11} placeholder="CNH (11 dígitos)" value={formCNH} onChange={(e) => setFormCNH(e.target.value.replace(/\D/g,''))}
                          className="w-full py-1.5 px-3 border border-zinc-250 bg-white rounded-lg text-xs font-mono focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-zinc-500 font-bold block mb-1">Telefone *</label>
                      <input type="text" required placeholder="(00) 00000-0000" value={formPhone} onChange={(e) => setFormPhone(formatPhone(e.target.value))}
                        className="w-full py-1.5 px-3 border border-zinc-250 bg-white rounded-lg text-xs font-mono focus:outline-none" />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button type="button" onClick={() => setIsRegDriver(false)} className="px-3 py-1.5 border border-zinc-200 text-zinc-600 bg-white rounded-lg font-semibold text-xs">Cancelar</button>
                      <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 text-xs shadow-sm">Salvar e Selecionar</button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="p-3 bg-zinc-100 border border-zinc-200 rounded-lg flex justify-between items-center text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    {selectedMotorista.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h5 className="font-bold text-zinc-850">{selectedMotorista.nome}</h5>
                    <p className="text-[10px] text-zinc-500">CPF: {selectedMotorista.cpf} • CNH: {selectedMotorista.cnh}</p>
                  </div>
                </div>
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-150 rounded px-2 py-0.5 text-[9px] font-bold uppercase">Confirmado</div>
              </div>
            )}
          </div>

          {/* Veículo */}
          <div className={`p-5 rounded-xl border transition-all ${selectedMotorista && !selectedVeiculo ? 'border-sky-300 bg-white shadow-sm' : selectedMotorista ? 'border-zinc-200 bg-white' : 'border-zinc-200 bg-zinc-50/35 opacity-60 pointer-events-none'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${selectedVeiculo ? 'bg-emerald-500 text-white' : 'bg-sky-600 text-white'}`}>
                  {selectedVeiculo ? '✓' : '2'}
                </span>
                <h4 className="text-sm font-bold text-zinc-900">Selecionar Conjunto Transportador</h4>
              </div>
              {selectedVeiculo && (
                <button onClick={() => { onSelectVeiculo(null); setVehicleSearch(''); }} className="text-xs text-[#ED6A23] font-bold hover:underline">Alterar</button>
              )}
            </div>

            {!selectedVeiculo ? (
              <div className="space-y-4">
                {!isRegVehicle ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="text" placeholder="Busque por Placa ou Modelo..." value={vehicleSearch} onChange={(e) => setVehicleSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-lg text-xs bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    {vehicleSearch.trim() && (
                      <div className="border border-zinc-150 rounded-lg overflow-hidden bg-white shadow-sm">
                        <div className="bg-zinc-50 text-zinc-400 text-[9px] uppercase font-bold px-3 py-1.5 border-b border-zinc-100">Veículos ({filteredVehicles.length})</div>
                        {filteredVehicles.length === 0 ? (
                          <div className="p-4 text-center space-y-2">
                            <p className="text-xs text-zinc-500">Nenhum veículo encontrado.</p>
                            <button type="button" onClick={() => { setIsRegVehicle(true); if (vehicleSearch.length <= 7) setFormPlaca(vehicleSearch.toUpperCase()); else setFormModelo(vehicleSearch); }}
                              className="text-xs text-sky-600 font-bold flex items-center gap-1 mx-auto hover:underline">
                              <PlusCircle className="w-3.5 h-3.5" /> Cadastrar placa "{vehicleSearch}"
                            </button>
                          </div>
                        ) : (
                          <div className="divide-y divide-zinc-100 max-h-48 overflow-y-auto">
                            {filteredVehicles.map(item => (
                              <button key={item.id} type="button" onClick={() => { onSelectVeiculo(item); setVehicleSearch(item.placa); }}
                                className="w-full text-left p-3 hover:bg-sky-50/50 flex justify-between items-center text-xs text-zinc-700">
                                <div>
                                  <p className="font-bold text-sky-900 font-mono">{item.placa}</p>
                                  <p className="text-[10px] text-zinc-400 mt-0.5">{item.modelo} • {item.tipo}</p>
                                </div>
                                <span className="text-xs text-sky-600 font-bold">✓ Selecionar</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {!vehicleSearch.trim() && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Frota Disponível:</span>
                        <div className="flex flex-wrap gap-2">
                          {veiculos.map(item => (
                            <button key={item.id} type="button" onClick={() => { onSelectVeiculo(item); setVehicleSearch(item.placa); }}
                              className="text-xs bg-white text-zinc-700 font-mono font-semibold py-1.5 px-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm">
                              <CreditCard className="w-3 h-3 text-zinc-400" />
                              <span>{item.placa} ({item.modelo.split(' ')[0]})</span>
                            </button>
                          ))}
                          <button type="button" onClick={() => setIsRegVehicle(true)}
                            className="text-xs bg-sky-50 text-sky-700 border border-sky-150 py-1.5 px-3 rounded-lg font-bold flex items-center gap-1 hover:bg-sky-100 cursor-pointer">
                            <PlusCircle className="w-3.5 h-3.5" /> <span>Novo Veículo</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSaveVehicle} className="space-y-3.5 text-xs bg-zinc-50 border border-zinc-200 p-4 rounded-xl font-medium">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                      <span className="font-bold text-zinc-800">Cadastrar Novo Veículo</span>
                      <button type="button" onClick={() => setIsRegVehicle(false)} className="text-zinc-500 hover:text-zinc-900 underline font-semibold">Buscar na frota</button>
                    </div>
                    {vehicleErrors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 p-2.5 rounded text-red-700 font-semibold">
                        {vehicleErrors.map((e, i) => <p key={i}>• {e}</p>)}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-zinc-500 font-bold block mb-1">Placa *</label>
                        <input type="text" required placeholder="ABC1D23" value={formPlaca} onChange={(e) => setFormPlaca(formatPlaca(e.target.value))}
                          className="w-full py-1.5 px-3 border border-zinc-250 bg-white rounded-lg text-xs font-mono uppercase tracking-widest focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-zinc-500 font-bold block mb-1">Tipo de Carroceria *</label>
                        <select value={formTipo} onChange={(e) => setFormTipo(e.target.value)}
                          className="w-full py-1.5 px-3 border border-zinc-250 bg-white rounded-lg text-xs focus:outline-none">
                          <option value="Cavalo Mecânico">Cavalo Mecânico</option>
                          <option value="Carreta Porta-Container">Carreta Porta-Container</option>
                          <option value="Truck 3/4">Truck 3/4</option>
                          <option value="Bi-trem / Rodotrem">Bi-trem / Rodotrem</option>
                          <option value="Outros">Outras Carrocerias</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-zinc-500 font-bold block mb-1">Modelo / Marca *</label>
                      <input type="text" required placeholder="Ex: Scania R450, Volvo FH" value={formModelo} onChange={(e) => setFormModelo(e.target.value)}
                        className="w-full py-1.5 px-3 border border-zinc-250 bg-white rounded-lg text-xs focus:outline-none" />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button type="button" onClick={() => setIsRegVehicle(false)} className="px-3 py-1.5 border border-zinc-200 text-zinc-600 bg-white rounded-lg font-semibold text-xs">Cancelar</button>
                      <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 text-xs shadow-sm">Salvar e Selecionar</button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="p-3 bg-zinc-100 border border-zinc-200 rounded-lg flex justify-between items-center text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-sky-900 text-sky-100 flex items-center justify-center font-bold font-mono">V</div>
                  <div>
                    <h5 className="font-bold text-sky-900 font-mono tracking-wider">{selectedVeiculo.placa}</h5>
                    <p className="text-[10px] text-zinc-500">{selectedVeiculo.modelo} • {selectedVeiculo.tipo}</p>
                  </div>
                </div>
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-150 rounded px-2 py-0.5 text-[9px] font-bold uppercase">Confirmado</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: summary card */}
        <div className="lg:col-span-5">
          {selectedMotorista ? (
            <div className="bg-white border border-zinc-250 rounded-xl overflow-hidden shadow-sm sticky top-4 flex flex-col">
              <div className="bg-sky-950 text-white p-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#FFEBE0]">Passo 2 de 3 / Credenciamento</span>
                <h4 className="text-sm font-bold mt-1">Síntese do Transporte</h4>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <span className="text-[9px] text-zinc-400 font-mono block uppercase">CONDUTOR CREDENCIADO</span>
                  <p className="text-sm font-extrabold text-zinc-900 mt-0.5">{selectedMotorista.nome}</p>
                  <p className="text-[11px] text-zinc-500 font-medium">CPF: {selectedMotorista.cpf} • CNH: {selectedMotorista.cnh}</p>
                </div>
                <div className="border-t border-zinc-100" />
                {selectedVeiculo ? (
                  <div>
                    <span className="text-[9px] text-zinc-400 font-mono block uppercase">VEÍCULO ALOCADO</span>
                    <p className="text-sm font-extrabold font-mono text-sky-900 mt-0.5">{selectedVeiculo.placa}</p>
                    <p className="text-[11px] text-zinc-500 font-medium">{selectedVeiculo.modelo} ({selectedVeiculo.tipo})</p>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 text-amber-800 text-[11px] font-semibold border border-dashed border-amber-200 rounded-lg">
                    Aguardando seleção do veículo.
                  </div>
                )}
                <div className="border-t border-zinc-100" />
                {selectedMotorista && selectedVeiculo ? (
                  <div className="bg-sky-50 border border-sky-150 text-sky-900 p-3 rounded-lg text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-4 h-4 text-sky-600" />
                      <span>Validação Eletrônica Autorizada</span>
                    </div>
                    <p className="text-sky-700 text-[10.5px]">Registros vinculados para esta retirada FCL.</p>
                  </div>
                ) : null}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    disabled={!selectedMotorista || !selectedVeiculo}
                    onClick={onNext}
                    className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Ir para data e horário</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold py-2 rounded-lg text-[11px] flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Voltar ao Documento</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded-xl p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
              <FileSignature className="w-8 h-8 text-zinc-400 mb-2 animate-pulse" />
              <p className="text-sm font-semibold text-zinc-700">Selecione os Dados para Continuar</p>
              <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">Complete a alocação do condutor e do veículo para prosseguir.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
