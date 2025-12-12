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
} from "@/services/users/users.service";
import type { User as UserType, CreateUserDto } from "@/types/user";
import type { Company } from "@/types/company";
import { UserRole } from "@/types/auth";
import { companiesService } from "@/services/companies/companies.service";
import { EditUserModal } from './EditUserModal';

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

  // Carrega usuários e empresas
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [usersData, companiesData] = await Promise.all([
        usersService.findAll(),
        companiesService.findAll(),
      ]);

      setUsers(usersData);
      setCompanies(companiesData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validação: SUPPLIER e EMPLOYEE precisam de companyId
    if (
      (formData.role === UserRole.SUPPLIER ||
        formData.role === UserRole.EMPLOYEE) &&
      !formData.companyId
    ) {
      setError(
        "A seleção de Empresa é obrigatória para Funcionários e Fornecedores."
      );
      return;
    }

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

      setUsers((prev) => [...prev, newUser]);

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

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) {
      return;
    }

    try {
      setDeletingId(userId);
      setError(null);

      await usersService.remove(userId);

      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (err: any) {
      console.error("Erro ao excluir usuário:", err);
      setError(
        err.response?.data?.message || "Erro ao excluir usuário."
      );
    } finally {
      setDeletingId(null);
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

    // Atualizar usuário
    const updatedUser: UserType = {
      ...editingUser,
      name: data.name,
      email: data.email,
      role: data.role,
      position: data.position,
      company: data.companyId ? companies.find((c) => c.id === data.companyId) : undefined,
    };

    // Chamar API aqui: await usersService.update(editingUser.id, data);

    setUsers((prev) =>
      prev.map((user) => (user.id === editingUser.id ? updatedUser : user))
    );

    setIsEditModalOpen(false);
    setEditingUser(null);
    setError(null);
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
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Ex: João da Silva"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
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
                    <option value={UserRole.SUPPLIER}>
                      Fornecedor (Supplier)
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
                disabled={isSaving}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow group relative"
            >
              <div className="flex">
                <button
                  onClick={() => handleEdit(user)}
                  className="absolute top-4 right-12 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Editar usuário"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(user.id)}
                  disabled={deletingId === user.id}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === user.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xl border-2 border-white shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{user.name}</h4>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              <div className="space-y-3 mt-2 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Perfil:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold border ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Cargo:</span>
                  <span className="font-medium text-gray-700 truncate max-w-[150px]">
                    {user.position || "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Empresa:</span>
                  <span
                    className="font-medium text-gray-700 truncate max-w-[150px]"
                    title={user.company?.fantasyName}
                  >
                    {user.company?.fantasyName || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          ))}
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