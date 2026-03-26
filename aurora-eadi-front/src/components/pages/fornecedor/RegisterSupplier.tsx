"use client";

import React, { useState } from 'react';
import { ArrowLeft, Building2, User as UserIcon, CheckCircle, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRegister } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatCNPJ, formatPhoneBR } from '@/lib/utils';

export function RegisterCompanies() {
  const router = useRouter();
  const { mutate: register, isPending: Loading } = useRegister();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);

  // User Data
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Company Data
  const [cnpj, setCnpj] = useState('');
  const [fantasyName, setFantasyName] = useState('');
  const [socialReason, setSocialReason] = useState('');
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');

  const validateStep1 = () => {
    return !!(userName && userEmail && password && confirmPassword && password === confirmPassword);
  };

  const validateStep2 = () => {
    return !!(cnpj && fantasyName && socialReason && cep && address && number && neighborhood && city && state && phone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }

    if (!validateStep2()) {
      toast.error('Preencha todos os campos obrigatórios (*).');
      return;
    }

    register({
      company: { cnpj, fantasyName, socialReason, zipCode: cep, address, number, complement, neighborhood, city, state, phone },
      user: { name: userName, email: userEmail, password }
    }, {
      onSuccess: () => {
        setIsSuccess(true);
      },
      onError: (err) => {
        toast.error(err.message);
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastro em Análise!</h2>
          <p className="text-gray-600 mb-8">
            Seu cadastro foi enviado com sucesso e está aguardando aprovação.
            Você receberá uma confirmação assim que sua conta for ativada.
          </p>

          <button
            onClick={() => router.push("/permissoes")}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Voltar para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-primary-500 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Cadastro de Fornecedor</h2>
            <p className="text-white mt-1">Preencha os dados da empresa para começar.</p>
          </div>

          <div className="p-8">

            {/* Progress Indicator */}
            <div className="flex items-center mb-8">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${step >= 1 ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-300 text-gray-300'}`}>
                <UserIcon size={20} />
              </div>
              <div className={`flex-1 h-1 mx-4 transition-all ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${step >= 2 ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-300 text-gray-400'}`}>
                <Building2 size={20} />
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dados do Usuário e Senha</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail Corporativo
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        required
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="••••••••"
                        minLength={6}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar Senha
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        required
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 outline-none transition ${confirmPassword && password !== confirmPassword
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        placeholder="••••••••"
                      />
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">As senhas não conferem</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  {!validateStep1() && (
                    <p className="text-xs text-amber-600 mr-3 self-center">Preencha todos os campos obrigatórios (*).</p>
                  )}
                  <button
                    type="button"
                    disabled={!validateStep1()}
                    onClick={() => setStep(2)}
                    className="px-6 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dados da Empresa</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CNPJ
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                      <input
                        required
                        value={cnpj}
                        onChange={e => setCnpj(formatCNPJ(e.target.value))}
                        type="text"
                        maxLength={18}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="00.000.000/0000-00"
                      />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Razão Social
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      required
                      value={socialReason}
                      onChange={e => setSocialReason(e.target.value)}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="Empresa Ltda"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Fantasia
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      required
                      value={fantasyName}
                      onChange={e => setFantasyName(e.target.value)}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="Nome Fantasia"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEP
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      required
                      value={cep}
                      onChange={e => setCep(e.target.value)}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="00000-000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      required
                      value={phone}
                      onChange={e => setPhone(formatPhoneBR(e.target.value))}
                      type="tel"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      required
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="Rua, Avenida, etc"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      required
                      value={number}
                      onChange={e => setNumber(e.target.value)}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Complemento
                    </label>
                    <input
                      value={complement}
                      onChange={e => setComplement(e.target.value)}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="Apto, Sala, etc"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bairro
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      required
                      value={neighborhood}
                      onChange={e => setNeighborhood(e.target.value)}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="Centro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cidade
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      required
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="São Paulo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      UF
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      required
                      value={state}
                      onChange={e => setState(e.target.value.toUpperCase())}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition uppercase"
                      maxLength={2}
                      placeholder="SP"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Voltar
                  </button>
                  {!validateStep2() && (
                    <p className="text-xs text-amber-600 self-center">Preencha todos os campos obrigatórios (*).</p>
                  )}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading || !validateStep2()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Enviando...
                      </>
                    ) : (
                      'Finalizar Cadastro'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
