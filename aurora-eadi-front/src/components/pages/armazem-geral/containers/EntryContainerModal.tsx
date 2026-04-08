import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Package, Save, Loader2, Warehouse } from 'lucide-react';
import { OriginContainerEntryDto } from '@/types/armazem-geral';
import { useContainerEntry } from '@/hooks/armazem-geral/useContainers';
import { toast } from 'sonner';

interface EntryContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EntryContainerModal({ isOpen, onClose }: EntryContainerModalProps) {
  const { mutateAsync: registerEntry, isPending } = useContainerEntry();
  
  const [formData, setFormData] = useState<OriginContainerEntryDto>({
    containerNumber: '',
    containerType: '',
    location: '',
  });

  const [errors, setErrors] = useState<Partial<OriginContainerEntryDto>>({});

  const validate = () => {
    const newErrors: Partial<OriginContainerEntryDto> = {};
    if (!formData.containerNumber || formData.containerNumber.length < 4) {
      newErrors.containerNumber = 'Número do contêiner inválido (mín. 4 caracteres)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      await registerEntry(formData);
      toast.success('Entrada de contêiner registrada com sucesso!');
      setFormData({ containerNumber: '', containerType: '', location: '' });
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Falha ao registrar entrada.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    if (errors[name as keyof OriginContainerEntryDto]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-2 rounded-full">
              <Warehouse className="w-5 h-5 text-primary-600" />
            </div>
            <DialogTitle>Registrar Nova Entrada</DialogTitle>
          </div>
          <DialogDescription>
            Registre a entrada de um contêiner no pátio do Armazém Geral.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número do Contêiner <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="containerNumber"
              value={formData.containerNumber}
              onChange={handleChange}
              placeholder="Ex: MEDU1234567"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.containerNumber ? 'border-red-500' : 'border-gray-300'}`}
              maxLength={15}
            />
            {errors.containerNumber && <p className="text-sm text-red-500 mt-1">{errors.containerNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo do Contêiner
            </label>
            <input
              type="text"
              name="containerType"
              value={formData.containerType}
              onChange={handleChange}
              placeholder="Ex: 40HC, 20DC"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localização (Pátio/Armazém)
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Ex: Pátio A - Fila 2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Registrar Entrada
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
