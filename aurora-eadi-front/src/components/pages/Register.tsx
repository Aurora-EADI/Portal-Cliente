import React, { useState } from 'react';
import { useRegister } from '../../hooks/useAuth';
import { ArrowLeft, Building2, User as UserIcon, CheckCircle, Lock } from 'lucide-react';

export const Register: React.FC<{ setView: (v: 'login' | 'register') => void }> = ({ setView }) => {
  const { mutate: register, isPending: isLoading } = useRegister();
  
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("As senhas não conferem.");
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
        alert(err.message);
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastro Realizado!</h2>
          <p className="text-gray-600 mb-8">
            Seus dados foram enviados para análise. Você receberá a confirmação assim que o administrador liberar seu acesso.
          </p>
          <button
            onClick={() => setView('login')}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
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
        <button 
          onClick={() => setView('login')} 
          className="flex items-center text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Login
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-primary-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Cadastro de Fornecedor</h2>
            <p className="text-primary-100 mt-1">Preencha os dados da empresa para começar.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            
            {/* Progress Indicator */}
            <div className="flex items-center mb-8">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step >= 1 ? 'bg-primary-50 border-primary-500 text-primary-600' : 'border-gray-300 text-gray-300'}`}>
                <UserIcon size={20} />
              </div>
              <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step >= 2 ? 'bg-primary-50 border-primary-500 text-primary-600' : 'border-gray-300 text-gray-400'}`}>
                <Building2 size={20} />
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dados do Usuário e Senha</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Corporativo</label>
                  <input 
                    required
                    type="email" 
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                    placeholder="seu@email.com"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        required
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                        placeholder="********"
                        minLength={6}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                     <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        required
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 outline-none transition ${
                          confirmPassword && password !== confirmPassword 
                            ? 'border-red-300 focus:ring-red-200' 
                            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                        }`}
                        placeholder="********"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    disabled={!password || password !== confirmPassword || !userEmail || !userName}
                    onClick={() => setStep(2)}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                    <input required value={cnpj} onChange={e => setCnpj(e.target.value)} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="00.000.000/0000-00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                    <input required value={socialReason} onChange={e => setSocialReason(e.target.value)} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                    <input required value={fantasyName} onChange={e => setFantasyName(e.target.value)} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                    <input required value={cep} onChange={e => setCep(e.target.value)} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input required value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none" />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                    <input required value={address} onChange={e => setAddress(e.target.value)} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                    <input required value={number} onChange={e => setNumber(e.target.value)} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                    <input value={complement} onChange={e => setComplement(e.target.value)} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                    <input required value={neighborhood} onChange={e => setNeighborhood(e.target.value)} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                    <input required value={city} onChange={e => setCity(e.target.value)} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                    <input required value={state} onChange={e => setState(e.target.value)} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none" maxLength={2} />
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-lg shadow-primary-200 disabled:opacity-50"
                  >
                    {isLoading ? 'Enviando...' : 'Finalizar Cadastro'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
      </div>
    );
  }