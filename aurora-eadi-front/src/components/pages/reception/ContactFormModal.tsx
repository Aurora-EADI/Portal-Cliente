'use client'

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { receptionService } from '@/services/reception/reception.service';
import { ReceptionContact } from '@/types/reception/contact';

import { Switch } from '@/components/ui/switch';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: ReceptionContact | null;
  onSuccess: () => void;
}

export function ContactFormModal({ isOpen, onClose, contact, onSuccess }: ContactFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    position: '',
    extension: '',
    mobile: '',
    email: '',
    active: true,
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        department: contact.department,
        position: contact.position,
        extension: contact.extension || '',
        mobile: contact.mobile || '',
        email: contact.email || '',
        active: contact.active ?? true,
      });
    } else {
      setFormData({
        name: '',
        department: '',
        position: '',
        extension: '',
        mobile: '',
        email: '',
        active: true,
      });
    }
  }, [contact, isOpen]);

  const formatPhone = (value: string) => {
    let v = value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length === 0) return '';
    if (v.length <= 2) return `(${v}`;
    if (v.length <= 6) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    if (v.length <= 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
    return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (contact) {
        await receptionService.update(contact.id, formData);
        toast.success('Contato atualizado com sucesso');
      } else {
        await receptionService.create(formData);
        toast.success('Contato criado com sucesso');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving contact:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar contato');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{contact ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
          <DialogDescription>
            {contact ? 'Atualize as informações do contato.' : 'Preencha os dados do novo funcionário para a recepção.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: João Silva"
                required
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="extension">Ramal *</Label>
                <Input
                  id="extension"
                  value={formData.extension}
                  onChange={(e) => setFormData({ ...formData, extension: e.target.value })}
                  placeholder="Ex: 1234"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Celular</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: formatPhone(e.target.value) })}
                  placeholder="Ex: (00) 00000-0000"
                  maxLength={15}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: joao@aurora.com.br"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Setor</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Ex: Comercial"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Função</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Ex: Assistente"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="space-y-0.5">
                <Label className="text-base">Cadastro Ativo</Label>
                <p className="text-sm text-gray-500">
                  Desative para ocultar este contato da lista.
                </p>
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700 text-white min-w-[120px]">
              {isLoading ? 'Salvando...' : contact ? 'Salvar Alterações' : 'Criar Contato'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
