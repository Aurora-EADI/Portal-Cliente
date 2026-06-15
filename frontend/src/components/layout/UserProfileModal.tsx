'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/context/AuthContext';
import { usersService } from '@/services/users/users.service';
import { toast } from 'sonner';
import { Loader2, User, Mail, Lock } from 'lucide-react';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
    const { currentUser, updateCurrentUser } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (isOpen && currentUser) {
            setFormData({
                name: currentUser.name || '',
                email: currentUser.email || '',
                password: '',
                confirmPassword: '',
            });
        }
    }, [isOpen, currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }

        setLoading(true);
        try {
            const updateData: any = {
                name: formData.name,
                email: formData.email,
            };

            if (formData.password) {
                updateData.password = formData.password;
            }

            const updatedUser = await usersService.update(currentUser.id, updateData);

            // Atualiza o contexto global com os novos dados para refletir na UI imediatamente
            updateCurrentUser(updatedUser);

            toast.success('Perfil atualizado com sucesso!');
            onClose();
        } catch (error: any) {
            console.error('Erro ao atualizar perfil:', error);
            toast.error(error.response?.data?.message || 'Erro ao atualizar perfil');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-white border-slate-200 text-slate-950">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
                        <div className="p-2 bg-primary-50 rounded-lg">
                            <User className="w-5 h-5 text-primary-600" />
                        </div>
                        Editar Perfil
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-700 flex items-center gap-2 font-semibold">
                                <User size={14} className="text-slate-400" /> Nome
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Seu nome"
                                className="bg-slate-50 border-slate-200 text-slate-950 focus-visible:ring-primary-500"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 flex items-center gap-2 font-semibold">
                                <Mail size={14} className="text-slate-400" /> E-mail
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="seu@email.com"
                                className="bg-slate-50 border-slate-200 text-slate-950 focus-visible:ring-primary-500"
                                required
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded border border-slate-100 italic">
                                Deixe em branco para manter a senha atual
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-slate-700 flex items-center gap-2 font-semibold">
                                        <Lock size={14} className="text-slate-400" /> Nova Senha
                                    </Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="bg-slate-50 border-slate-200 text-slate-950 focus-visible:ring-primary-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-slate-700 flex items-center gap-2 font-semibold">
                                        <Lock size={14} className="text-slate-400" /> Confirmar Senha
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="bg-slate-50 border-slate-200 text-slate-950 focus-visible:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/10"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar Alterações'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
