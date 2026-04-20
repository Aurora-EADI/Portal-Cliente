import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  Building2,
  Briefcase,
  ShieldAlert,
  Check,
  AlertCircle,
  Edit,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Types - Ajuste conforme seus tipos reais da API
enum UserRole {
  ADMIN = "ADMIN",
  EMPLOYEE = "EMPLOYEE",
  SUPPLIER = "SUPPLIER",
}

type Company = {
  id: string;
  fantasyName: string;
};

type UserType = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  position: string | null;
  createdAt: string;
  updatedAt: string;
  company?: Company;
};

type UpdateUserDto = {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  position?: string;
  companyId?: string;
};

interface EditUserModalProps {
  isOpen: boolean;
  user: UserType | null;
  companies: Company[];
  onClose: () => void;
  onSave: (data: UpdateUserDto) => Promise<void>;
  error: string | null;
  onClearError: () => void;
}

export function EditUserModal({
  isOpen,
  user,
  companies,
  onClose,
  onSave,
  error,
  onClearError,
}: EditUserModalProps) {
  const [formData, setFormData] = useState<UpdateUserDto>({
    name: "",
    email: "",
    password: "",
    role: UserRole.EMPLOYEE,
    position: "",
    companyId: undefined,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Atualiza o formulário quando o usuário muda
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
        position: user.position || "",
        companyId: user.companyId || undefined,
      });
    }
  }, [user]);

  // Limpa companyId quando role é ADMIN
  useEffect(() => {
    if (formData.role === UserRole.ADMIN) {
      setFormData((prev) => ({ ...prev, companyId: undefined }));
    }
  }, [formData.role]);

  const handleSubmit = async () => {
    onClearError();

    // Validação: SUPPLIER e EMPLOYEE precisam de companyId
    if (
      (formData.role === UserRole.SUPPLIER ||
        formData.role === UserRole.EMPLOYEE) &&
      !formData.companyId
    ) {
      return;
    }

    try {
      setIsSaving(true);

      // Remove password do payload se estiver vazio
      const dataToSend = { ...formData };
      if (!dataToSend.password || dataToSend.password.trim() === "") {
        delete dataToSend.password;
      }

      await onSave(dataToSend);
    } catch (err) {
      // Erro será tratado pelo componente pai
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
      onClearError();
    }
  };

  // Se não está aberto ou não tem usuário, não renderiza nada
  if (!isOpen || !user) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-xl z-10">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Editar Usuário</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Atualize as informações de {user.name}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={isSaving}
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Error Alert dentro do Modal */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start animate-in slide-in-from-top duration-200">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Erro na validação</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearError}
              className="ml-2 h-6 w-6 text-red-400 hover:text-red-600 hover:bg-transparent"
              aria-label="Fechar alerta"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Form */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  placeholder="Ex: João da Silva"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={isSaving}
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Email Corporativo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail Corporativo
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  placeholder="nome@empresa.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={isSaving}
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Nova Senha (Opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  disabled={isSaving}
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Deixe em branco para manter a senha atual
              </p>
            </div>

            {/* Perfil de Acesso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Perfil de Acesso
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <select
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors appearance-none"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as UserRole,
                    })
                  }
                  disabled={isSaving}
                >
                  <option value={UserRole.ADMIN}>Administrador</option>
                  <option value={UserRole.EMPLOYEE}>
                    Colaborador (Employee)
                  </option>
                  <option value={UserRole.SUPPLIER}>
                    Fornecedor (Supplier)
                  </option>
                </select>
                <ShieldAlert className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Cargo / Posição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo / Posição
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  placeholder="Ex: Analista Fiscal"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  disabled={isSaving}
                />
                <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Empresa Vinculada */}
            <div
              className={formData.role === UserRole.ADMIN ? "opacity-50" : ""}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empresa Vinculada
                {(formData.role === UserRole.EMPLOYEE ||
                  formData.role === UserRole.SUPPLIER) && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              <div className="relative">
                <select
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors appearance-none"
                  value={formData.companyId || ""}
                  disabled={formData.role === UserRole.ADMIN || isSaving}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      companyId: value || undefined,
                    });
                  }}
                >
                  <option value="">Selecione uma empresa...</option>
                  {companies.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.fantasyName}
                    </option>
                  ))}
                </select>
                <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              {formData.role === UserRole.ADMIN && (
                <p className="text-xs text-gray-400 mt-1">
                  Administradores têm acesso global.
                </p>
              )}
              {companies.length === 0 && formData.role !== UserRole.ADMIN && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Nenhuma empresa cadastrada no sistema.
                </p>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-primary-600 hover:bg-primary-700 shadow-lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}