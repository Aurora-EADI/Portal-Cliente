"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  User,
  Mail,
  Lock,
  ShieldAlert,
  Check,
  AlertCircle,
  Edit,
  Smartphone,
  Trash2,
} from "lucide-react";
import {
  mobileUsersService,
  type MobileUser,
  type CreateMobileUserDto,
  type UserMobileRole,
} from "@/services/mobile-users/mobile-users.service";
import { EditMobileUserModal } from "./EditMobileUserModal";
import { Pagination } from "@/components/ui/Pagination";
import { SearchBar } from "@/components/ui/DataTable";

export function MobileUserRegistryPage() {
  const [users, setUsers] = useState<MobileUser[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<MobileUser | null>(null);

  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState<CreateMobileUserDto>({
    name: "",
    email: "",
    password: "",
    role: "INSPECTOR",
  });

  useEffect(() => {
    fetchData();
  }, [page, search, limit]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await mobileUsersService.findAll({
        page,
        limit,
        search: search || undefined,
      });
      if (response?.data && Array.isArray(response.data)) {
        setUsers(response.data);
        setTotalUsers(response.pagination.total);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao carregar dados.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    try {
      setIsSaving(true);
      await mobileUsersService.create(formData);
      setFormData({ name: "", email: "", password: "", role: "INSPECTOR" });
      setIsAdding(false);
      setPage(1);
      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(", ") : msg || "Erro ao criar usuário.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (user: MobileUser) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
    setError(null);
  };

  const handleUpdateUser = async (data: any) => {
    if (!editingUser) return;
    try {
      await mobileUsersService.update(editingUser.id, data);
      setIsEditModalOpen(false);
      setEditingUser(null);
      setError(null);
      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      const errorText = Array.isArray(msg) ? msg.join(", ") : msg || "Erro ao atualizar usuário.";
      setError(errorText);
      throw err;
    }
  };

  const handleDelete = async (user: MobileUser) => {
    if (!confirm(`Deseja remover o usuário "${user.name}"?`)) return;
    try {
      setDeletingId(user.id);
      await mobileUsersService.remove(user.id);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao remover usuário.");
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadge = (role: UserMobileRole) => {
    if (role === "SUPERVISOR") return "bg-purple-100 text-purple-700 border-purple-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

  const getRoleLabel = (role: UserMobileRole) => {
    if (role === "SUPERVISOR") return "Supervisor";
    return "Inspetor";
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários Mobile</h1>
          <p className="text-gray-500 mt-1">Controle de acesso ao aplicativo de vistoria.</p>
        </div>
        <button
          onClick={() => { setIsAdding(!isAdding); setError(null); }}
          className={`flex items-center px-4 py-2 text-white rounded-md transition-colors shadow-sm text-sm font-medium ${
            isAdding ? "bg-gray-500 hover:bg-gray-600" : "bg-primary-600 hover:bg-primary-700"
          }`}
        >
          {isAdding ? "Cancelar" : <><Plus className="w-4 h-4 mr-2" />Novo Usuário</>}
        </button>
      </div>

      {/* Search */}
      <SearchBar
        placeholder="Buscar por nome ou e-mail..."
        onSearch={handleSearch}
        onClear={() => handleSearch("")}
        showClearButton={!!search}
      />

      {/* Add Form */}
      {isAdding && (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 animate-in slide-in-from-top duration-300">
          <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
            <div className="bg-primary-100 p-2 rounded-full mr-3">
              <Smartphone className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Cadastrar Usuário Mobile</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase"
                    placeholder="Ex: JOÃO DA SILVA"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                    disabled={isSaving}
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="nome@empresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isSaving}
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                <div className="relative">
                  <select
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserMobileRole })}
                    disabled={isSaving}
                  >
                    <option value="INSPECTOR">Inspetor</option>
                    <option value="SUPERVISOR">Supervisor</option>
                  </select>
                  <ShieldAlert className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Senha */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha Provisória</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={isSaving}
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSaving || !formData.name.trim() || !formData.email.trim() || !formData.password.trim()}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium flex items-center shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Cadastrando...</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" />Cadastrar Usuário</>
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
                <th className="px-6 py-4">Criado em</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
                        {user.avatarInitials || user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{user.name}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border inline-block ${getRoleBadge(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm"
                      >
                        <Edit size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={deletingId === user.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-red-400 hover:text-red-600 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        {deletingId === user.id ? "..." : "Remover"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Nenhum usuário mobile cadastrado</h3>
          <p className="text-gray-500 mt-1 mb-4">Cadastre o primeiro usuário para liberar acesso ao app.</p>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Usuário Mobile
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

      <EditMobileUserModal
        isOpen={isEditModalOpen}
        user={editingUser}
        onClose={() => { setIsEditModalOpen(false); setEditingUser(null); setError(null); }}
        onSave={handleUpdateUser}
        error={error}
        onClearError={() => setError(null)}
      />
    </div>
  );
}
