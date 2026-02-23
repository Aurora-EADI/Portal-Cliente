import React, { useState, useEffect } from "react";
import { useRegister } from "../../hooks/useAuth";
import {
  ArrowLeft,
  Building2,
  User as UserIcon,
  CheckCircle,
  Lock,
  Loader2,
  Briefcase,
  Trash2,
} from "lucide-react";
import { useCnpjLookup } from "@/hooks/useCnpjLookup";
import { toast } from "sonner";
import {
  companyService,
  requirementRulesService,
  SupplierTypeDto,
} from "@/services/api";
import { useMutation } from "@tanstack/react-query";
import { formatCNPJ, formatCPF, formatPhoneBR } from "@/lib/utils";
import { AllocationRegime, CompanyClassification } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Register: React.FC<{
  setView: (v: "login" | "register") => void;
}> = ({ setView }) => {
  const { mutate: register, isPending: isRegisterLoading } = useRegister();
  const { mutate: requestAccess, isPending: isRequestAccessLoading } =
    useMutation({
      mutationFn: async ({
        companyId,
        company,
        user,
      }: {
        companyId: string;
        company: any;
        user: any;
      }) => {
        return await companyService.requestAccess(companyId, { company, user });
      },
    });
  const {
    lookup,
    isLoading: isLoadingCnpj,
    error: cnpjError,
    company: foundCompany,
  } = useCnpjLookup();

  const isLoading = isRegisterLoading || isRequestAccessLoading;

  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [redirectTimeout, setRedirectTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );

  // User Data
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mainContactName, setMainContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");

  // Company Data
  const [cnpj, setCnpj] = useState("");
  const [fantasyName, setFantasyName] = useState("");
  const [socialReason, setSocialReason] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [classification, setClassification] = useState<
    CompanyClassification | ""
  >("");
  const [allocationRegime, setAllocationRegime] = useState<
    AllocationRegime | ""
  >("");
  const [supplierTypes, setSupplierTypes] = useState<SupplierTypeDto[]>([]);
  const [selectedSupplierTypeIds, setSelectedSupplierTypeIds] = useState<
    string[]
  >([]);
  const [selectedSupplierTypeLabels, setSelectedSupplierTypeLabels] = useState<
    string[]
  >([]);
  const [thirdPartyCollaborators, setThirdPartyCollaborators] = useState([
    { fullName: "", cpf: "", admissionDate: "", role: "" },
  ]);
  const [registeredFixedEmployees, setRegisteredFixedEmployees] = useState("");
  const [registeredOutsourcedEmployees, setRegisteredOutsourcedEmployees] =
    useState("");
  const [annualRevenue, setAnnualRevenue] = useState("");
  const supplierTypeOptions = [
    "Transportador",
    "Fornecedor de materiais",
    "Vigilancia",
    "Manutencao",
    "Locacao de equipamentos",
    "Prestador de servicos",
    "Mao de obra terceirizada",
    "Limpeza",
    "Fornecedor de refeicao",
    "Outros",
  ];

  const normalizeText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const getSupplierTypeByLabel = (label: string) =>
    supplierTypes.find(
      (type) =>
        type.active && normalizeText(type.name) === normalizeText(label),
    );

  const formatBRLMoneyInput = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    const amount = Number(digits) / 100;
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const todayIso = new Date().toISOString().split("T")[0];
  const isFutureAdmissionDate = (date: string) => !!date && date > todayIso;

  const isThirdPartyCollaboratorComplete = (collaborator: {
    fullName: string;
    cpf: string;
    admissionDate: string;
    role: string;
  }) => {
    const cpfDigits = collaborator.cpf.replace(/\D/g, "");
    return (
      collaborator.fullName.trim().length > 0 &&
      cpfDigits.length === 11 &&
      collaborator.admissionDate.trim().length > 0 &&
      !isFutureAdmissionDate(collaborator.admissionDate) &&
      collaborator.role.trim().length > 0
    );
  };

  const canAddThirdPartyCollaborator = thirdPartyCollaborators.every(
    isThirdPartyCollaboratorComplete,
  );

  const addThirdPartyCollaborator = () => {
    if (!canAddThirdPartyCollaborator) {
      toast.error(
        "Preencha todos os campos do colaborador atual antes de adicionar outro.",
      );
      return;
    }
    setThirdPartyCollaborators((current) => [
      ...current,
      { fullName: "", cpf: "", admissionDate: "", role: "" },
    ]);
  };

  const removeThirdPartyCollaborator = (indexToRemove: number) => {
    setThirdPartyCollaborators((current) => {
      if (current.length === 1) {
        return [{ fullName: "", cpf: "", admissionDate: "", role: "" }];
      }
      return current.filter((_, index) => index !== indexToRemove);
    });
  };

  useEffect(() => {
    const loadSupplierTypes = async () => {
      try {
        const types = await requirementRulesService.getSupplierTypes();
        setSupplierTypes(types);
      } catch (error) {
        console.error("Erro ao carregar tipos de fornecedor:", error);
      }
    };
    loadSupplierTypes();
  }, []);

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
    const cnpjNumbers = cnpj.replace(/\D/g, "");

    if (cnpjNumbers.length === 14) {
      handleCnpjLookup(cnpjNumbers);
    } else if (cnpjNumbers.length < 14) {
      // Limpa os dados se o CNPJ for alterado e ficar incompleto
      if (companyId) {
        setCompanyId(null);
        setSocialReason("");
        setFantasyName("");
        setCep("");
        setAddress("");
        setNumber("");
        setComplement("");
        setNeighborhood("");
        setCity("");
        setState("");
        setPhone("");
        setClassification("");
        setAllocationRegime("");
        setSelectedSupplierTypeIds([]);
        setSelectedSupplierTypeLabels([]);
        setThirdPartyCollaborators([
          { fullName: "", cpf: "", admissionDate: "", role: "" },
        ]);
        setRegisteredFixedEmployees("");
        setRegisteredOutsourcedEmployees("");
        setAnnualRevenue("");
        setMainContactName("");
        setContactRole("");
        setContactPhone("");
        setContactWhatsapp("");
        setUserName("");
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
        setSocialReason(company.socialReason || "");
        setFantasyName(company.fantasyName || "");
        setCep(company.zipCode || "");
        setAddress(company.address || "");
        setNumber(company.number || "");
        setComplement(company.complement || "");
        setNeighborhood(company.neighborhood || "");
        setCity(company.city || "");
        setState(company.state || "");
        setPhone(formatPhoneBR(company.phone || ""));
        setClassification(company.classification || "");
        setAllocationRegime(company.allocationRegime || "");
        // Preenche o nome do usuário com a razão social
        setUserName(company.socialReason || "");
        toast.info("Sua solicitação está sendo validada", {
          duration: 6000,
          description:
            "Já existe uma solicitação de acesso em análise para esta empresa. Aguarde a aprovação do administrador.",
        });
        return;
      }

      // Verifica se a empresa já tem usuário cadastrado e está ativa/rejeitada
      if (company.hasUser && company.status !== "PENDING") {
        setCompanyId(null);
        toast.error("Empresa já possui cadastro!", {
          duration: 6000,
          description:
            "Esta empresa já tem um usuário registrado. Faça login ou entre em contato com o administrador.",
        });
        return;
      }

      // Se não tem usuário ou status é PENDING, preenche os dados para permitir registro
      setCompanyId(company.id);
      setSocialReason(company.socialReason || "");
      setFantasyName(company.fantasyName || "");
      setCep(company.zipCode || "");
      setAddress(company.address || "");
      setNumber(company.number || "");
      setComplement(company.complement || "");
      setNeighborhood(company.neighborhood || "");
      setCity(company.city || "");
      setState(company.state || "");
      setPhone(formatPhoneBR(company.phone || ""));
      setClassification(company.classification || "");
      setAllocationRegime(company.allocationRegime || "");
      // Preenche o nome do usuário com a razão social
      setUserName(company.socialReason || "");
      toast.success("Empresa encontrada! Dados preenchidos automaticamente.");
    } else {
      setCompanyId(null);
      toast.error(
        "CNPJ não encontrado. Apenas fornecedores já cadastrados podem se registrar.",
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }
    if (!classification || !allocationRegime) {
      toast.error("Preencha classificação empresarial e regime de atuação.");
      return;
    }
    const resolvedSupplierTypeIds = [
      ...new Set([
        ...selectedSupplierTypeIds,
        ...selectedSupplierTypeLabels
          .map((label) => getSupplierTypeByLabel(label)?.id)
          .filter((id): id is string => !!id),
      ]),
    ];
    if (resolvedSupplierTypeIds.length === 0) {
      toast.error("Selecione pelo menos um tipo de fornecedor.");
      return;
    }
    if (allocationRegime === AllocationRegime.FULL_WORKFORCE_AT_EADI) {
      const hasFutureAdmissionDate = thirdPartyCollaborators.some(
        (collaborator) =>
          collaborator.admissionDate.trim().length > 0 &&
          isFutureAdmissionDate(collaborator.admissionDate),
      );
      if (hasFutureAdmissionDate) {
        toast.error(
          "A data de admissão do colaborador não pode ser posterior ao dia de hoje.",
        );
        return;
      }
    }

    const workforceEmployees =
      allocationRegime === AllocationRegime.FULL_WORKFORCE_AT_EADI
        ? thirdPartyCollaborators.map((collaborator) => ({
            fullName: collaborator.fullName.trim(),
            cpf: collaborator.cpf.replace(/\D/g, ""),
            position: collaborator.role.trim(),
            hiredAt: collaborator.admissionDate,
          }))
        : [];

    const companyData = {
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
      phone,
      classification: classification as CompanyClassification,
      allocationRegime: allocationRegime as AllocationRegime,
      supplierTypeIds: resolvedSupplierTypeIds,
      workforceEmployees,
    };

    const userData = {
      name: userName,
      email: userEmail,
      password,
    };

    // Se tem companyId, significa que veio do Protheus -> usar endpoint de request-access
    if (companyId) {
      console.log(
        "Usando endpoint REQUEST-ACCESS (atualizar empresa existente)",
      );
      requestAccess(
        {
          companyId,
          company: companyData,
          user: userData,
        },
        {
          onSuccess: () => {
            toast.success("Solicitação enviada com sucesso!");
            setIsSuccess(true);
          },
          onError: (err: any) => {
            const errorMessage = err.message || "Erro ao solicitar acesso";
            toast.error(errorMessage);
          },
        },
      );
    } else {
      // Se NAO tem companyId -> criar do zero (comportamento original)
      console.log("Usando endpoint REGISTER (criar nova empresa)");
      register(
        {
          companyId: undefined,
          company: companyData,
          user: userData,
        },
        {
          onSuccess: () => {
            toast.success("Cadastro realizado com sucesso!");
            setIsSuccess(true);
          },
          onError: (err: any) => {
            const errorMessage = err.message || "Erro ao realizar cadastro";
            toast.error(errorMessage);
          },
        },
      );
    }
  };

  const validateStep1 = () => {
    // Bloqueia se a empresa estiver com status PENDING_ACTIVE
    if (foundCompany?.status === "PENDING_ACTIVE") {
      return false;
    }
    if (
      selectedSupplierTypeIds.length === 0 &&
      selectedSupplierTypeLabels.length === 0
    ) {
      return false;
    }
    if (!classification) {
      return false;
    }
    return (
      companyId &&
      cnpj &&
      socialReason &&
      fantasyName &&
      cep &&
      address &&
      number &&
      neighborhood &&
      city &&
      state &&
      phone
    );
  };

  const validateStep2 = () => {
    if (!allocationRegime) {
      return false;
    }
    if (allocationRegime === AllocationRegime.FULL_WORKFORCE_AT_EADI) {
      return thirdPartyCollaborators.every(isThirdPartyCollaboratorComplete);
    }
    return true;
  };

  const validateStep3 = () => {
    return (
      userName &&
      mainContactName &&
      contactRole &&
      contactPhone &&
      contactWhatsapp &&
      userEmail &&
      password &&
      confirmPassword &&
      password === confirmPassword
    );
  };

  // Success Screen
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Solicitação Realizada!
          </h2>
          <p className="text-gray-600 mb-8">
            Seus dados foram enviados para análise. Você receberá a confirmação
            assim que o administrador liberar seu acesso.
          </p>
          <button
            onClick={() => setView("login")}
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
            onClick={() => setView("login")}
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
                {step === 1
                  ? "Informe os dados do fornecedor"
                  : step === 2
                    ? "Informe o regime de atuação"
                    : "Crie sua conta de acesso"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              {/* Progress Indicator */}
              <div className="mb-10">
                <div className="flex items-center justify-between">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                        step >= 1
                          ? "bg-primary-600 border-primary-600"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {step >= 1 ? (
                        <Building2 className="text-white" size={20} />
                      ) : (
                        <Building2 className="text-gray-400" size={20} />
                      )}
                    </div>
                    <p
                      className={`text-sm font-medium mt-3 transition-colors ${
                        step >= 1 ? "text-primary-600" : "text-gray-400"
                      }`}
                    >
                      Dados do Fornecedor
                    </p>
                    <p
                      className={`text-xs mt-1 text-center max-w-[140px] transition-colors ${
                        step >= 1 ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      Informações da empresa
                    </p>
                  </div>

                  {/* Progress Line */}
                  <div
                    className="flex-1 flex items-center px-2 md:px-4"
                    style={{ maxWidth: "140px", marginTop: "-45px" }}
                  >
                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ease-in-out ${
                          step >= 2
                            ? "bg-primary-600 w-full"
                            : "bg-primary-600 w-0"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                        step >= 2
                          ? "bg-primary-600 border-primary-600"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {step >= 2 ? (
                        <Briefcase className="text-white" size={20} />
                      ) : (
                        <Briefcase className="text-gray-400" size={20} />
                      )}
                    </div>
                    <p
                      className={`text-sm font-medium mt-3 transition-colors ${
                        step >= 2 ? "text-primary-600" : "text-gray-400"
                      }`}
                    >
                      Regime de atuação
                    </p>
                    <p
                      className={`text-xs mt-1 text-center max-w-[140px] transition-colors ${
                        step >= 2 ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      Classificação
                    </p>
                  </div>

                  {/* Progress Line */}
                  <div
                    className="flex-1 flex items-center px-2 md:px-4"
                    style={{ maxWidth: "140px", marginTop: "-45px" }}
                  >
                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ease-in-out ${
                          step >= 3
                            ? "bg-primary-600 w-full"
                            : "bg-primary-600 w-0"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                        step >= 3
                          ? "bg-primary-600 border-primary-600"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {step >= 3 ? (
                        <UserIcon className="text-white" size={20} />
                      ) : (
                        <UserIcon className="text-gray-400" size={20} />
                      )}
                    </div>
                    <p
                      className={`text-sm font-medium mt-3 transition-colors ${
                        step >= 3 ? "text-primary-600" : "text-gray-400"
                      }`}
                    >
                      Dados do usuário
                    </p>
                    <p
                      className={`text-xs mt-1 text-center max-w-[140px] transition-colors ${
                        step >= 3 ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
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
                  {!foundCompany &&
                    !isLoadingCnpj &&
                    cnpj.replace(/\D/g, "").length < 14 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-blue-900 mb-1">
                            Informação Importante
                          </h4>
                          <p className="text-sm text-blue-700">
                            Digite o CNPJ completo para verificar se sua empresa
                            está cadastrada no sistema. Apenas fornecedores
                            previamente cadastrados podem se registrar.
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Mensagem quando empresa está com solicitação em análise */}
                  {foundCompany &&
                    foundCompany.status === "PENDING_ACTIVE" &&
                    !isLoadingCnpj && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-blue-900 mb-1">
                            Sua solicitação está sendo validada
                          </h4>
                          <p className="text-sm text-blue-700 mb-2">
                            Já existe uma solicitação de acesso em análise para
                            esta empresa. Aguarde a aprovação do administrador
                            para fazer login.
                          </p>
                          <button
                            onClick={() => setView("login")}
                            className="text-sm font-medium text-blue-800 hover:text-blue-900 underline"
                          >
                            Voltar para o login
                          </button>
                        </div>
                      </div>
                    )}

                  {/* Mensagem de erro quando empresa já possui usuário */}
                  {foundCompany &&
                    foundCompany.hasUser &&
                    !isLoadingCnpj &&
                    foundCompany.status !== "PENDING" &&
                    foundCompany.status !== "PENDING_ACTIVE" && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <svg
                            className="w-5 h-5 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-red-900 mb-1">
                            Empresa já cadastrada
                          </h4>
                          <p className="text-sm text-red-700 mb-2">
                            Esta empresa já possui um usuário registrado no
                            sistema.
                          </p>
                          <button
                            onClick={() => setView("login")}
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
                            <Loader2
                              className="animate-spin text-primary-600"
                              size={20}
                            />
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
                      {cnpj.replace(/\D/g, "").length > 0 &&
                        cnpj.replace(/\D/g, "").length < 14 && (
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
                        disabled={
                          isLoadingCnpj ||
                          !foundCompany ||
                          foundCompany?.status === "PENDING_ACTIVE"
                        }
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
                        disabled={
                          isLoadingCnpj ||
                          !foundCompany ||
                          foundCompany?.status === "PENDING_ACTIVE"
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder="Nome fantasia"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Classificação empresarial *
                      </label>
                      <select
                        value={classification}
                        onChange={(e) =>
                          setClassification(
                            e.target.value as CompanyClassification | "",
                          )
                        }
                        disabled={
                          isLoadingCnpj ||
                          !foundCompany ||
                          foundCompany?.status === "PENDING_ACTIVE"
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Selecione uma opção</option>
                        {Object.values(CompanyClassification).map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
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
                        disabled={
                          isLoadingCnpj ||
                          !foundCompany ||
                          foundCompany?.status === "PENDING_ACTIVE"
                        }
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
                        onChange={(e) =>
                          setPhone(formatPhoneBR(e.target.value))
                        }
                        type="tel"
                        disabled={
                          isLoadingCnpj ||
                          !foundCompany ||
                          foundCompany?.status === "PENDING_ACTIVE"
                        }
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
                        disabled={
                          isLoadingCnpj ||
                          !foundCompany ||
                          foundCompany?.status === "PENDING_ACTIVE"
                        }
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
                        disabled={
                          isLoadingCnpj ||
                          !foundCompany ||
                          foundCompany?.status === "PENDING_ACTIVE"
                        }
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
                        disabled={
                          isLoadingCnpj ||
                          !foundCompany ||
                          foundCompany?.status === "PENDING_ACTIVE"
                        }
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
                        disabled={
                          isLoadingCnpj ||
                          !foundCompany ||
                          foundCompany?.status === "PENDING_ACTIVE"
                        }
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
                        disabled={
                          isLoadingCnpj ||
                          !foundCompany ||
                          foundCompany?.status === "PENDING_ACTIVE"
                        }
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
                        disabled={
                          isLoadingCnpj ||
                          !foundCompany ||
                          foundCompany?.status === "PENDING_ACTIVE"
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                        maxLength={2}
                        placeholder="SP"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2 pt-2">
                      <div className="border-t border-gray-200 pt-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Fornecedor *
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {supplierTypeOptions.map((option) => {
                            const matchedType = getSupplierTypeByLabel(option);
                            const isChecked = matchedType
                              ? selectedSupplierTypeIds.includes(matchedType.id)
                              : selectedSupplierTypeLabels.includes(option);

                            return (
                              <label
                                key={option}
                                className="flex items-center p-3 border rounded-lg border-gray-200 hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 mr-3"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (matchedType) {
                                      setSelectedSupplierTypeIds((current) =>
                                        current.includes(matchedType.id)
                                          ? current.filter(
                                              (id) => id !== matchedType.id,
                                            )
                                          : [...current, matchedType.id],
                                      );
                                      return;
                                    }

                                    setSelectedSupplierTypeLabels((current) =>
                                      current.includes(option)
                                        ? current.filter(
                                            (label) => label !== option,
                                          )
                                        : [...current, option],
                                    );
                                  }}
                                />
                                <span className="text-sm font-medium text-gray-700">
                                  {option}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        {selectedSupplierTypeIds.length === 0 &&
                          selectedSupplierTypeLabels.length === 0 && (
                            <p className="text-xs text-amber-600 mt-2">
                              Selecione pelo menos um tipo de fornecedor.
                            </p>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <div className="flex flex-col items-end gap-2">
                      {foundCompany?.status === "PENDING_ACTIVE" && (
                        <p className="text-xs text-blue-600 font-medium">
                          Sua solicitação está sendo validada.
                        </p>
                      )}
                      {!validateStep1() &&
                        companyId &&
                        foundCompany?.status !== "PENDING_ACTIVE" && (
                          <p className="text-xs text-amber-600">
                            Preencha todos os campos obrigatórios (*)
                          </p>
                        )}
                      {!companyId && cnpj.replace(/\D/g, "").length === 14 && (
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

              {/* Step 2: Allocation Regime */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Regime de atuação
                    </h3>
                    <p className="text-sm text-gray-600">
                      Informe o regime de atuação da sua empresa.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">
                      Regime de atuação *
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="allocationRegime"
                          value={AllocationRegime.NO_WORKFORCE_AT_EADI}
                          checked={
                            allocationRegime ===
                            AllocationRegime.NO_WORKFORCE_AT_EADI
                          }
                          onChange={(e) =>
                            setAllocationRegime(
                              e.target.value as AllocationRegime,
                            )
                          }
                          className="h-4 w-4"
                        />
                        <span className="text-sm text-gray-700">
                          Sem alocação de mão de obra no EADI
                        </span>
                      </label>
                      <label className="flex items-center gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="allocationRegime"
                          value={AllocationRegime.FULL_WORKFORCE_AT_EADI}
                          checked={
                            allocationRegime ===
                            AllocationRegime.FULL_WORKFORCE_AT_EADI
                          }
                          onChange={(e) =>
                            setAllocationRegime(
                              e.target.value as AllocationRegime,
                            )
                          }
                          className="h-4 w-4"
                        />
                        <span className="text-sm text-gray-700">
                          Com alocação de mão de obra no EADI
                        </span>
                      </label>
                    </div>
                  </div>

                  {allocationRegime ===
                    AllocationRegime.FULL_WORKFORCE_AT_EADI && (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="flex-row items-center justify-between space-y-0">
                          <CardTitle className="text-base">
                            Identificação de Pessoal Terceirizado
                          </CardTitle>
                          <button
                            type="button"
                            onClick={addThirdPartyCollaborator}
                            disabled={!canAddThirdPartyCollaborator}
                            className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            + Adicionar
                          </button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {thirdPartyCollaborators.map(
                            (collaborator, index) => (
                              <div
                                key={`third-party-${index}`}
                                className="space-y-3 rounded-md border border-gray-200 p-3"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-700">
                                    Colaborador {index + 1}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeThirdPartyCollaborator(index)
                                    }
                                    className="rounded-md p-2 text-red-600 hover:bg-red-50"
                                    aria-label={`Remover colaborador ${index + 1}`}
                                    title="Remover colaborador"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                                <div className="space-y-1">
                                  <Label>Nome completo</Label>
                                  <Input
                                    value={collaborator.fullName}
                                    onChange={(e) =>
                                      setThirdPartyCollaborators((current) =>
                                        current.map((item, itemIndex) =>
                                          itemIndex === index
                                            ? {
                                                ...item,
                                                fullName: e.target.value,
                                              }
                                            : item,
                                        ),
                                      )
                                    }
                                    placeholder="Nome completo"
                                  />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label>CPF</Label>
                                    <Input
                                      value={collaborator.cpf}
                                      onChange={(e) =>
                                        setThirdPartyCollaborators((current) =>
                                          current.map((item, itemIndex) =>
                                            itemIndex === index
                                              ? {
                                                  ...item,
                                                  cpf: formatCPF(
                                                    e.target.value,
                                                  ),
                                                }
                                              : item,
                                          ),
                                        )
                                      }
                                      placeholder="000.000.000-00"
                                      maxLength={14}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label>Data de admissão</Label>
                                    <Input
                                      type="date"
                                      value={collaborator.admissionDate}
                                      max={todayIso}
                                      onChange={(e) =>
                                        setThirdPartyCollaborators((current) =>
                                          current.map((item, itemIndex) =>
                                            itemIndex === index
                                              ? {
                                                  ...item,
                                                  admissionDate:
                                                    e.target.value > todayIso
                                                      ? todayIso
                                                      : e.target.value,
                                                }
                                              : item,
                                          ),
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label>Função</Label>
                                  <Input
                                    value={collaborator.role}
                                    onChange={(e) =>
                                      setThirdPartyCollaborators((current) =>
                                        current.map((item, itemIndex) =>
                                          itemIndex === index
                                            ? { ...item, role: e.target.value }
                                            : item,
                                        ),
                                      )
                                    }
                                    placeholder="Função"
                                  />
                                </div>
                              </div>
                            ),
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">
                            Nº de empregados registrados
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label>Fixos</Label>
                              <Input
                                type="number"
                                min={0}
                                value={registeredFixedEmployees}
                                onChange={(e) =>
                                  setRegisteredFixedEmployees(e.target.value)
                                }
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>Terceirizados</Label>
                              <Input
                                type="number"
                                min={0}
                                value={registeredOutsourcedEmployees}
                                onChange={(e) =>
                                  setRegisteredOutsourcedEmployees(
                                    e.target.value,
                                  )
                                }
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label>Faturamento anual</Label>
                            <Input
                              value={annualRevenue}
                              onChange={(e) =>
                                setAnnualRevenue(
                                  formatBRLMoneyInput(e.target.value),
                                )
                              }
                              placeholder="0,00"
                              inputMode="numeric"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className="flex justify-between items-end pt-6">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-2"
                    >
                      Voltar
                    </button>
                    <div className="flex flex-col items-end gap-2">
                      {!validateStep2() && (
                        <p className="text-xs text-amber-600">
                          Preencha todos os campos obrigatórios (*).
                        </p>
                      )}
                      <button
                        type="button"
                        disabled={!validateStep2()}
                        onClick={() => setStep(3)}
                        className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none"
                      >
                        Próximo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: User Data */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Dados do Usuário
                    </h3>
                    <p className="text-sm text-gray-600">
                      Crie sua conta de acesso ao portal. Essas serão suas
                      credenciais de login.
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do contato principal *
                      </label>
                      <input
                        required
                        type="text"
                        value={mainContactName}
                        onChange={(e) => setMainContactName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                        placeholder="Nome do contato principal"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cargo *
                      </label>
                      <input
                        required
                        type="text"
                        value={contactRole}
                        onChange={(e) => setContactRole(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                        placeholder="Cargo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone *
                      </label>
                      <input
                        required
                        type="tel"
                        value={contactPhone}
                        onChange={(e) =>
                          setContactPhone(formatPhoneBR(e.target.value))
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Whatsapp *
                      </label>
                      <input
                        required
                        type="tel"
                        value={contactWhatsapp}
                        onChange={(e) =>
                          setContactWhatsapp(formatPhoneBR(e.target.value))
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
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
                        <Lock
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
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
                      <p className="text-xs text-gray-500 mt-1">
                        Mínimo de 6 caracteres
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar Senha *
                      </label>
                      <div className="relative">
                        <Lock
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          required
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition ${
                            confirmPassword && password !== confirmPassword
                              ? "border-red-300 focus:ring-red-200"
                              : "border-gray-300 focus:ring-primary-500 focus:border-primary-500"
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
                      onClick={() => setStep(2)}
                      className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-2"
                    >
                      ← Voltar
                    </button>
                    <div className="flex flex-col items-end gap-2">
                      {!validateStep3() && (
                        <p className="text-xs text-amber-600">
                          {password !== confirmPassword
                            ? "As senhas não conferem"
                            : "Preencha todos os campos obrigatórios (*)"}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={isLoading || !validateStep3()}
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
