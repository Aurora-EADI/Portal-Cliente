
import React, { useState, useEffect } from 'react';
import { useRegister } from '../../hooks/useAuth';
import { ArrowLeft, Building2, User as UserIcon, CheckCircle, Lock, Loader2 } from 'lucide-react';
import { useCnpjLookup } from '@/hooks/useCnpjLookup';
import { toast } from 'sonner';
import { IconWithTooltip } from '../ui/utils/icon-with-tooltip';

export const Register: React.FC<{ setView: (v: 'login' | 'register') => void }> = ({ setView }) => {
  const { mutate: register, isPending: isLoading } = useRegister();
  const { lookup, isLoading: isLoadingCnpj, error: cnpjError, company: foundCompany } = useCnpjLookup();

  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [redirectTimeout, setRedirectTimeout] = useState<NodeJS.Timeout | null>(null);

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

  // Função para formatar CNPJ
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return value;
  };

  // Cleanup do timeout ao desmontar
  useEffect(() => {
    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [redirectTimeout]);

  // Busca automática de CNPJ
  useEffect(() => {
    const cnpjNumbers = cnpj.replace(/\D/g, '');

    if (cnpjNumbers.length === 14) {
      handleCnpjLookup(cnpjNumbers);
    } else if (cnpjNumbers.length < 14) {
      // Limpa os dados se o CNPJ for alterado e ficar incompleto
      if (companyId) {
        setCompanyId(null);
        setSocialReason('');
        setFantasyName('');
        setCep('');
        setAddress('');
        setNumber('');
        setComplement('');
        setNeighborhood('');
        setCity('');
        setState('');
        setPhone('');
        setUserName('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cnpj]);

  const handleCnpjLookup = async (cnpjNumbers: string) => {
    const company = await lookup(cnpjNumbers);
    if (company) {
      // Verifica se a empresa está com solicitação em análise
      if (company.status === "PENDING_ACTIVE") {
        setCompanyId(company.id);
        setSocialReason(company.socialReason || '');
        setFantasyName(company.fantasyName || '');
        setCep(company.zipCode || '');
        setAddress(company.address || '');
        setNumber(company.number || '');
        setComplement(company.complement || '');
        setNeighborhood(company.neighborhood || '');
        setCity(company.city || '');
        setState(company.state || '');
        setPhone(company.phone || '');
        // Preenche o nome do usuário com a razão social
        setUserName(company.socialReason || '');
        toast.info(
          'Sua solicitação está sendo validada',
          {
            duration: 6000,
            description: 'Já existe uma solicitação de acesso em análise para esta empresa. Aguarde a aprovação do administrador.',
          }
        );
        return;
      }

      // Verifica se a empresa já tem usuário cadastrado e está ativa/rejeitada
      if (company.hasUser && company.status !== "PENDING") {
        setCompanyId(null);
        toast.error(
          'Empresa já possui cadastro!',
          {
            duration: 6000,
            description: 'Esta empresa já tem um usuário registrado. Faça login ou entre em contato com o administrador.',
          }
        );
        return;
      }

      // Se não tem usuário ou status é PENDING, preenche os dados para permitir registro
      setCompanyId(company.id);
      setSocialReason(company.socialReason || '');
      setFantasyName(company.fantasyName || '');
      setCep(company.zipCode || '');
      setAddress(company.address || '');
      setNumber(company.number || '');
      setComplement(company.complement || '');
      setNeighborhood(company.neighborhood || '');
      setCity(company.city || '');
      setState(company.state || '');
      setPhone(company.phone || '');
      // Preenche o nome do usuário com a razão social
      setUserName(company.socialReason || '');
      toast.success('Empresa encontrada! Dados preenchidos automaticamente.');
    } else {
      setCompanyId(null);
      toast.error('CNPJ não encontrado. Apenas fornecedores já cadastrados podem se registrar.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }

    register({
      companyId,
      company: {
        cnpj,
        fantasyName,
        socialReason,
        zipCode: cep,
        address,
        number,
        complement,
        neighborhood,
        city,
        state,
        phone
      },
      user: {
        name: userName,
        email: userEmail,
        password
      }
    }, {
      onSuccess: () => {
        setIsSuccess(true);
      },
      onError: (err: any) => {
        const errorMessage = err.message || 'Erro ao realizar cadastro';

        // Verifica se é erro de empresa já com usuário
        if (errorMessage.toLowerCase().includes('já possui um usuário cadastrado') ||
            errorMessage.toLowerCase().includes('já possui cadastro')) {

          toast.error(
            'Empresa já possui cadastro!',
            {
              duration: 6000,
              description: 'Esta empresa já tem um usuário registrado. Faça login ou entre em contato com o administrador.',
            }
          );
        }
      }
    });
  };

  const validateStep1 = () => {
    // Bloqueia se a empresa estiver com status PENDING_ACTIVE
    if (foundCompany?.status === "PENDING_ACTIVE") {
      return false;
    }
    return companyId && cnpj && socialReason && fantasyName && cep && address && number &&
      neighborhood && city && state && phone;
  };

  const validateStep2 = () => {
    return userName && userEmail && password && confirmPassword && password === confirmPassword;
  };

  // Success Screen
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitação Realizada!</h2>
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
    <div className="h-screen bg-gray-50 overflow-y-auto">
      <div className="min-h-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => setView('login')}
            className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Login
          </button>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-primary-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">Fornecedor</h2>
              <p className="text-primary-100 mt-1">
                {step === 1 ? 'Informe os dados da sua empresa' : 'Crie sua conta de acesso'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              {/* Progress Indicator */}
              <div className="mb-10">
                <div className="flex items-center justify-between">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center flex-1">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                      step >= 1 ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white'
                    }`}>
                      {step >= 1 ? (
                        <Building2 className="text-white" size={20} />
                      ) : (
                        <Building2 className="text-gray-400" size={20} />
                      )}
                    </div>
                    <p className={`text-sm font-medium mt-3 transition-colors ${
                      step >= 1 ? 'text-primary-600' : 'text-gray-400'
                    }`}>
                      Dados do Fornecedor
                    </p>
                    <p className={`text-xs mt-1 text-center max-w-[140px] transition-colors ${
                      step >= 1 ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      Informações da empresa
                    </p>
                  </div>

                  {/* Progress Line */}
                  <div className="flex-1 flex items-center px-4" style={{ maxWidth: '200px', marginTop: '-45px' }}>
                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ease-in-out ${
                          step >= 2 ? 'bg-primary-600 w-full' : 'bg-primary-600 w-0'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center flex-1">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                      step >= 2 ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white'
                    }`}>
                      {step >= 2 ? (
                        <UserIcon className="text-white" size={20} />
                      ) : (
                        <UserIcon className="text-gray-400" size={20} />
                      )}
                    </div>
                    <p className={`text-sm font-medium mt-3 transition-colors ${
                      step >= 2 ? 'text-primary-600' : 'text-gray-400'
                    }`}>
                      Dados do Usuário
                    </p>
                    <p className={`text-xs mt-1 text-center max-w-[140px] transition-colors ${
                      step >= 2 ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      Informações de acesso
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 1: Company Data */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Dados da Empresa</h3>
                    {!foundCompany && cnpj.replace(/\D/g, '').length === 14 && !isLoadingCnpj && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-medium">
                        Aguardando verificação do CNPJ
                      </span>
                    )}
                  </div> */}

                  {/* Mensagem informativa quando CNPJ está incompleto */}
                  {!foundCompany && !isLoadingCnpj && cnpj.replace(/\D/g, '').length < 14 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-1">Informação Importante</h4>
                        <p className="text-sm text-blue-700">
                          Digite o CNPJ completo para verificar se sua empresa está cadastrada no sistema.
                          Apenas fornecedores previamente cadastrados podem se registrar.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mensagem quando empresa está com solicitação em análise */}
                  {foundCompany && foundCompany.status === "PENDING_ACTIVE" && !isLoadingCnpj && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">Sua solicitação está sendo validada</h4>
                        <p className="text-sm text-blue-700 mb-2">
                          Já existe uma solicitação de acesso em análise para esta empresa. Aguarde a aprovação do administrador para fazer login.
                        </p>
                        <button
                          onClick={() => setView('login')}
                          className="text-sm font-medium text-blue-800 hover:text-blue-900 underline"
                        >
                          Voltar para o login
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mensagem de erro quando empresa já possui usuário */}
                  {foundCompany && foundCompany.hasUser && !isLoadingCnpj && foundCompany.status !== "PENDING" && foundCompany.status !== "PENDING_ACTIVE" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-red-900 mb-1">Empresa já cadastrada</h4>
                        <p className="text-sm text-red-700 mb-2">
                          Esta empresa já possui um usuário registrado no sistema.
                        </p>
                        <button
                          onClick={() => setView('login')}
                          className="text-sm font-medium text-red-800 hover:text-red-900 underline"
                        >
                          Ir para o login
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CNPJ with Auto Lookup */}
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CNPJ *
                      </label>
                      <div className="relative">
                        <input
                          required
                          value={cnpj}
                          onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                          type="text"
                          maxLength={18}
                          disabled={isLoadingCnpj}
                          className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                          placeholder="00.000.000/0000-00"
                        />
                        {isLoadingCnpj && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="animate-spin text-primary-600" size={20} />
                          </div>
                        )}
                        {!isLoadingCnpj && foundCompany && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <CheckCircle className="text-green-600" size={20} />
                          </div>
                        )}
                      </div>
                      {isLoadingCnpj && (
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1.5 animate-pulse">
                          <Loader2 className="animate-spin" size={12} />
                          Buscando empresa no sistema...
                        </p>
                      )}
                      {cnpjError && !isLoadingCnpj && (
                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                          <span className="font-medium">⚠</span> {cnpjError}
                        </p>
                      )}
                      {foundCompany && !isLoadingCnpj && (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1.5 font-medium">
                          <CheckCircle size={14} />
                          Empresa encontrada! Dados preenchidos automaticamente.
                        </p>
                      )}
                      {cnpj.replace(/\D/g, '').length > 0 && cnpj.replace(/\D/g, '').length < 14 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Digite os 14 dígitos do CNPJ para busca automática
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Razão Social *
                      </label>
                      <input
                        required
                        value={socialReason}
                        onChange={(e) => setSocialReason(e.target.value)}
                        type="text"
                        disabled={isLoadingCnpj || !foundCompany || foundCompany?.status === "PENDING_ACTIVE"}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder="Razão social da empresa"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome Fantasia *
                      </label>
                      <input
                        required
                        value={fantasyName}
                        onChange={(e) => setFantasyName(e.target.value)}
                        type="text"
                        disabled={isLoadingCnpj || !foundCompany || foundCompany?.status === "PENDING_ACTIVE"}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder="Nome fantasia"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CEP *
                      </label>
                      <input
                        required
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        type="text"
                        disabled={isLoadingCnpj || !foundCompany || foundCompany?.status === "PENDING_ACTIVE"}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder="00000-000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone *
                      </label>
                      <input
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        type="tel"
                        disabled={isLoadingCnpj || !foundCompany || foundCompany?.status === "PENDING_ACTIVE"}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Endereço *
                      </label>
                      <input
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        type="text"
                        disabled={isLoadingCnpj || !foundCompany || foundCompany?.status === "PENDING_ACTIVE"}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder="Rua, Avenida, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número *
                      </label>
                      <input
                        required
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        type="text"
                        disabled={isLoadingCnpj || !foundCompany || foundCompany?.status === "PENDING_ACTIVE"}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder="Nº"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Complemento
                      </label>
                      <input
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        type="text"
                        disabled={isLoadingCnpj || !foundCompany || foundCompany?.status === "PENDING_ACTIVE"}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder="Apto, Sala, etc. (opcional)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bairro *
                      </label>
                      <input
                        required
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        type="text"
                        disabled={isLoadingCnpj || !foundCompany || foundCompany?.status === "PENDING_ACTIVE"}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder="Bairro"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cidade *
                      </label>
                      <input
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        type="text"
                        disabled={isLoadingCnpj || !foundCompany || foundCompany?.status === "PENDING_ACTIVE"}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder="Cidade"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        UF *
                      </label>
                      <input
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value.toUpperCase())}
                        type="text"
                        disabled={isLoadingCnpj || !foundCompany || foundCompany?.status === "PENDING_ACTIVE"}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                        maxLength={2}
                        placeholder="SP"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <div className="flex flex-col items-end gap-2">
                      {foundCompany?.status === "PENDING_ACTIVE" && (
                        <p className="text-xs text-blue-600 font-medium">
                          Sua solicitação está sendo validada.
                        </p>
                      )}
                      {!validateStep1() && companyId && foundCompany?.status !== "PENDING_ACTIVE" && (
                        <p className="text-xs text-amber-600">
                          Preencha todos os campos obrigatórios (*)
                        </p>
                      )}
                      {!companyId && cnpj.replace(/\D/g, '').length === 14 && (
                        <p className="text-xs text-red-600">
                          Empresa não encontrada. Não é possível continuar.
                        </p>
                      )}
                      <button
                        type="button"
                        disabled={!validateStep1()}
                        onClick={() => setStep(2)}
                        className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none"
                      >
                        Próximo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: User Data */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Dados do Usuário</h3>
                    <p className="text-sm text-gray-600">
                      Crie sua conta de acesso ao portal. Essas serão suas credenciais de login.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Razão Social *
                    </label>
                    <input
                      required
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                      placeholder="Razão Social"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail Corporativo *
                    </label>
                    <input
                      required
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Senha *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          required
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                          placeholder="Mínimo 6 caracteres"
                          minLength={6}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar Senha *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          required
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition ${confirmPassword && password !== confirmPassword
                            ? 'border-red-300 focus:ring-red-200'
                            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                            }`}
                          placeholder="Repita a senha"
                        />
                        {confirmPassword && password === confirmPassword && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <CheckCircle className="text-green-600" size={18} />
                          </div>
                        )}
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <span>⚠</span> As senhas não conferem
                        </p>
                      )}
                      {confirmPassword && password === confirmPassword && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle size={12} /> Senhas conferem
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-end pt-6">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-2"
                    >
                      ← Voltar
                    </button>
                    <div className="flex flex-col items-end gap-2">
                      {!validateStep2() && (
                        <p className="text-xs text-amber-600">
                          {password !== confirmPassword
                            ? 'As senhas não conferem'
                            : 'Preencha todos os campos obrigatórios (*)'}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={isLoading || !validateStep2()}
                        className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-all shadow-lg shadow-primary-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            Enviando...
                          </>
                        ) : (
                          <>
                            Solicitar acesso
                            <CheckCircle size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};