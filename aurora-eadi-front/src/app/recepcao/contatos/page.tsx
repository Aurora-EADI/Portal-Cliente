'use client'

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { ContactList } from '@/components/pages/reception/ContactList';
import { ContactFilters } from '@/components/pages/reception/ContactFilters';
import { ContactFormModal } from '@/components/pages/reception/ContactFormModal';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { receptionService } from '@/services/reception/reception.service';
import { ReceptionContact } from '@/types/reception/contact';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';
import { toast } from 'sonner';
import {
  ConfirmDialog,
} from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';

export default function ContactsPage() {
  const { currentUser } = useAuthContext();
  const [contacts, setContacts] = useState<ReceptionContact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ReceptionContact | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<ReceptionContact | null>(null);

  const [filters, setFilters] = useState({
    name: '',
    department: '',
    position: '',
  });

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const { data, total } = await receptionService.findAll({ ...filters, page, limit });
      setContacts(data);
      setTotal(total);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadContacts();
    }, 300); // Debounce
    return () => clearTimeout(timer);
  }, [filters, page, limit]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleEdit = (contact: ReceptionContact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (contact: ReceptionContact) => {
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!contactToDelete) return;
    try {
      await receptionService.delete(contactToDelete.id);
      toast.success('Contato removido com sucesso');
      loadContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Erro ao remover contato');
    } finally {
      setIsDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  const handleClearFilters = () => {
    setFilters({ name: '', department: '', position: '' });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50/50">
      <Header />
      <Layout>
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto pb-10">
            {/* Header Area */}
            <header className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Users className="text-orange-600" size={28} />
                  Lista de Ramais
                </h1>
                <p className="text-gray-500">
                  Acompanhe e gerencie ramais e e-mails corporativos em tempo real
                </p>
              </div>

              {isAdmin && (
                <Button 
                  onClick={() => { setSelectedContact(null); setIsModalOpen(true); }} 
                  className="bg-orange-600 hover:bg-orange-700 text-white gap-2 h-11 px-6 shadow-sm transition-all"
                >
                  <Plus size={18} />
                  Novo Contato
                </Button>
              )}
            </header>

            {/* Filters */}
            <ContactFilters
              filters={filters}
              setFilters={setFilters}
              onClear={handleClearFilters}
            />

            {/* List */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-100 shadow-sm">
                 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
                 <p className="text-gray-500 font-medium">Carregando contatos...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <ContactList
                  contacts={contacts}
                  total={total}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  isAdmin={isAdmin}
                />
                
                <Pagination
                  page={page}
                  total={total}
                  limit={limit}
                  onPageChange={setPage}
                  onLimitChange={setLimit}
                />
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <ContactFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          contact={selectedContact}
          onSuccess={loadContacts}
        />

        <ConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Remover Contato"
          description={`Tem certeza que deseja remover o contato de ${contactToDelete?.name}?`}
          variant="destructive"
        />
      </Layout>
    </div>
  );
}
