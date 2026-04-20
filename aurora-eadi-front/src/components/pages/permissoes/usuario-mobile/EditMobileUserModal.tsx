import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  ShieldAlert,
  Check,
  AlertCircle,
  Edit,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MobileUser, UpdateMobileUserDto, UserMobileRole } from "@/services/mobile-users/mobile-users.service";

interface EditMobileUserModalProps {
  isOpen: boolean;
  user: MobileUser | null;
  onClose: () => void;
  onSave: (data: UpdateMobileUserDto) => Promise<void>;
  error: string | null;
  onClearError: () => void;
}

export function EditMobileUserModal({
  isOpen,
  user,
  onClose,
  onSave,
  error,
  onClearError,
}: EditMobileUserModalProps) {
  const [formData, setFormData] = useState<UpdateMobileUserDto & { name: string; email: string; role: UserMobileRole }>({
    name: "",
    email: "",
    password: "",
    role: "INSPECTOR",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    onClearError();
    try {
      setIsSaving(true);
      const dataToSend: UpdateMobileUserDto = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      if (formData.password && formData.password.trim() !== "") {
        dataToSend.password = formData.password;
      }
      await onSave(dataToSend);
    } catch {
      // Tratado pelo componente pai
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

  if (!isOpen || !user) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-xl z-10">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Editar Usuário Mobile</h3>
              <p className="text-sm text-gray-500 mt-0.5">Atualize as informações de {user.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} disabled={isSaving}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClearError} className="ml-2 h-6 w-6 text-red-400 hover:text-red-600 hover:bg-transparent">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Form */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nome */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 uppercase"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  disabled={isSaving}
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isSaving}
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Perfil <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 appearance-none"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserMobileRole })}
                  disabled={isSaving}
                >
                  <option value="INSPECTOR">Inspetor</option>
                  <option value="SUPERVISOR">Supervisor</option>
                </select>
                <ShieldAlert className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Senha */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isSaving}
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Deixe em branco para manter a senha atual</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSaving} className="bg-primary-600 hover:bg-primary-700 shadow-lg">
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
              ) : (
                <><Check className="w-4 h-4" />Salvar Alterações</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
