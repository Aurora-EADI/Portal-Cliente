"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  User,
  Mail,
  Lock,
  Building2,
  Briefcase,
  Trash2,
  ShieldAlert,
  Check,
  AlertCircle,
  Edit,
} from "lucide-react";
import {
  usersService,
  type PaginatedUsersResponse,
} from "@/services/users/users.service";
import { companiesService } from "@/services/companies/companies.service";
import type { User as UserType, CreateUserDto } from "@/types/user";
import type { Company } from "@/types/company";
import { UserRole } from "@/types/auth";
import { EditUserModal } from './EditUserModal';
import { Pagination } from '@/components/ui/Pagination';
import { SearchBar } from '@/components/ui/DataTable';

export function UserRegistryPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [limit, setLimit] = useState(10);

  // Search state
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState<CreateUserDto>({
    name: "",
    email: "",
    password: "",
    role: UserRole.EMPLOYEE,
    position: "",
    companyId: undefined,
  });

  // Limpa companyId quando role é ADMIN
  useEffect(() => {
    if (formData.role === UserRole.ADMIN) {
      setFormData((prev) => ({ ...prev, companyId: undefined }));
    }
  }, [formData.role]);

  // Carrega usuários quando a página, busca ou limit muda
  useEffect(() => {
    fetchData();
  }, [page, search, limit]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Busca usuários (ADMIN e EMPLOYEE) e empresas ativas em paralelo
      const [usersResponse, companiesResponse] = await Promise.all([
        usersService.findAll({
          roles: `${UserRole.ADMIN},${UserRole.EMPLOYEE}`,
          page,
          limit,
          search: search || undefined,
        }),
        companiesService.findActive({ limit: 100 }), // Busca todas as empresas ativas
      ]);

      // Verificação de segurança para response.data
      if (usersResponse && usersResponse.data && Array.isArray(usersResponse.data)) {
        setUsers(usersResponse.data);
        setTotalUsers(usersResponse.pagination.total);
      }

      // Define empresas ativas vindas do endpoint dedicado
      if (companiesResponse && companiesResponse.data && Array.isArray(companiesResponse.data)) {
        setCompanies(companiesResponse.data);
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
      setError(
        err.response?.data?.message ||
        "Erro ao carregar dados. Verifique sua conexão."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Verifica se email já existe
    const emailExists = users.some(
      (u) => u.email.toLowerCase() === formData.email.toLowerCase()
    );
    if (emailExists) {
      setError("Este e-mail já está cadastrado no sistema.");
      return;
    }

    try {
      setIsSaving(true);

      const newUser = await usersService.create(formData);

      // Reset Form
      setFormData({
        name: "",
        email: "",
        password: "",
        role: UserRole.EMPLOYEE,
        position: "",
        companyId: undefined,
      });
      setIsAdding(false);

      // Volta para a primeira página e recarrega os dados
      setPage(1);
      await fetchData();
    } catch (err: any) {
      console.error("Erro ao criar usuário:", err);
      const errorMessage = err.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        setError(errorMessage.join(", "));
      } else {
        setError(errorMessage || "Erro ao criar usuário. Tente novamente.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-purple-100 text-purple-700 border-purple-200";
      case UserRole.SUPPLIER:
        return "bg-blue-100 text-blue-700 border-blue-200";
      case UserRole.EMPLOYEE:
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return "Administrador";
      case UserRole.SUPPLIER:
        return "Fornecedor";
      case UserRole.EMPLOYEE:
        return "Colaborador";
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
    setError(null);
  };

  const handleUpdateUser = async (data: any) => {
    if (!editingUser) return;

    // Validação de email duplicado
    const emailExists = users.some(
      (u) => u.id !== editingUser.id && u.email.toLowerCase() === data.email.toLowerCase()
    );
    if (emailExists) {
      setError("Este e-mail já está cadastrado no sistema.");
      throw new Error("Email já existe");
    }

    // Validação de empresa obrigatória
    if (
      (data.role === UserRole.SUPPLIER || data.role === UserRole.EMPLOYEE) &&
      !data.companyId
    ) {
      setError("A seleção de Empresa é obrigatória para Funcionários e Fornecedores.");
      throw new Error("Empresa obrigatória");
    }

    try {
      // Atualizar usuário via API
      await usersService.update(editingUser.id, data);

      setIsEditModalOpen(false);
      setEditingUser(null);
      setError(null);

      // Recarrega os dados para obter a versão atualizada do servidor
      await fetchData();
    } catch (err: any) {
      console.error("Erro ao atualizar usuário:", err);
      const errorMessage = err.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        setError(errorMessage.join(", "));
      } else {
        setError(errorMessage || "Erro ao atualizar usuário. Tente novamente.");
      }
      throw err; // Re-throw para impedir que o modal feche
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Erro</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cadastro de Usuário</h1>
          <p className="text-gray-500 mt-1">Gerencie os cadastros de usuário.</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setError(null);
          }}
          className={`flex items-center px-4 py-2 text-white rounded-md transition-colors shadow-sm text-sm font-medium ${isAdding
            ? "bg-gray-500 hover:bg-gray-600"
            : "bg-primary-600 hover:bg-primary-700"
            }`}
        >
          {isAdding ? (
            "Cancelar"
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </>
          )}
        </button>
      </div>

      {/* Search */}
      <SearchBar
        placeholder="Buscar por nome, e-mail ou cargo..."
        onSearch={handleSearch}
        onClear={() => handleSearch('')}
        showClearButton={!!search}
      />

      {/* Add User Form */}
      {isAdding && (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 animate-in slide-in-from-top duration-300">
          <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
            <div className="bg-primary-100 p-2 rounded-full mr-3">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              Cadastrar Usuário
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed uppercase"
                    placeholder="Ex: JOÃO DA SILVA"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value.toUpperCase() })
                    }
                    disabled={isSaving}
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="nome@empresa.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={isSaving}
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha Provisória
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    disabled={isSaving}
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Perfil de Acesso (Role)
                </label>
                <div className="relative">
                  <select
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  </select>
                  <ShieldAlert className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Cargo / Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo / Posição
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Ex: Analista Fiscal"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    disabled={isSaving}
                  />
                  <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Company (Conditional) */}
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
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
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

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={
                  isSaving ||
                  !formData.name.trim() ||
                  !formData.email.trim() ||
                  !formData.password.trim() ||
                  ((formData.role === UserRole.EMPLOYEE || formData.role === UserRole.SUPPLIER) && !formData.companyId)
                }
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium flex items-center shadow-lg transform hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Cadastrar Usuário
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User List */}
      {users.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Perfil</th>
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4">Empresa</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  user={user}
                  onEdit={() => handleEdit(user)}
                  getRoleBadgeColor={getRoleBadgeColor}
                  getRoleLabel={getRoleLabel}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Nenhum usuário cadastrado
          </h3>
          <p className="text-gray-500 mt-1 mb-4">
            Comece adicionando o primeiro usuário ao sistema.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Usuário
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalUsers > 0 && (
        <div className="mt-4">
          <Pagination
            page={page}
            total={totalUsers}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </div>
      )}

      <EditUserModal
        isOpen={isEditModalOpen}
        user={editingUser}
        companies={companies}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
          setError(null);
        }}
        onSave={handleUpdateUser}
        error={error}
        onClearError={() => setError(null)}
      />
    </div>
  );
}

function TableRow({
  user,
  onEdit,
  getRoleBadgeColor,
  getRoleLabel
}: {
  user: UserType;
  onEdit: () => void;
  getRoleBadgeColor: (role: string) => string;
  getRoleLabel: (role: string) => string;
}) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">{user.name}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`px-2.5 py-1 rounded-md text-xs font-semibold border inline-block ${getRoleBadgeColor(
            user.role
          )}`}
        >
          {getRoleLabel(user.role)}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Briefcase size={14} className="text-gray-400" />
          <span className="truncate">{user.position || "-"}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Building2 size={14} className="text-gray-400" />
          <span className="truncate" title={user.company?.fantasyName}>
            {user.company?.fantasyName || "N/A"}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm"
            title="Editar usuário"
          >
            <Edit size={16} />
            Editar
          </button>
        </div>
      </td>
    </tr>
  );
}