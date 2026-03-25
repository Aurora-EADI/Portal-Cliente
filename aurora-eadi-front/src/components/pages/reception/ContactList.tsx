'use client'

import React from 'react';
import { Edit2, Trash2, Phone, Mail, Download, FileSpreadsheet, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { ReceptionContact } from '@/types/reception/contact';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as XLSX from 'xlsx';
import { applyAutoWidth } from '@/lib/exportExcel';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ContactListProps {
  contacts: ReceptionContact[];
  total: number;
  onEdit: (contact: ReceptionContact) => void;
  onDelete: (contact: ReceptionContact) => void;
  isAdmin: boolean;
}

export function ContactList({ contacts, total, onEdit, onDelete, isAdmin }: ContactListProps) {
  const exportToExcel = () => {
    const data = contacts.map(c => ({
      'Nome': c.name,
      'Setor': c.department,
      'Função': c.position,
      'Ramal': c.extension || '-',
      'E-mail': c.email || '-',
      'Status': c.active ? 'Ativo' : 'Inativo'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    applyAutoWidth(worksheet, data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contatos');
    XLSX.writeFile(workbook, `Contatos_Recepcao_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const auroraOrange = [245, 130, 32];
    const auroraLightGray = [245, 247, 250];

    // Cabeçalho - Faixa Laranja
    doc.setFillColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Logo
    try {
      const logoUrl = '/logo-aurora.png';
      doc.addImage(logoUrl, 'PNG', 15, 12, 35, 12);
    } catch (e) {
      console.error('Erro ao adicionar logo ao PDF', e);
    }

    // Título
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('AURORA EADI', pageWidth - 15, 20, { align: 'right' });
    
    doc.setFontSize(12);
    doc.text('Contatos Internos - Recepção', pageWidth - 15, 28, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, 15, 35);

    const tableData = contacts.map(c => [
      c.name,
      c.department,
      c.position,
      c.extension || '-',
      c.email || '-'
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Nome', 'Setor', 'Função', 'Ramal', 'E-mail']],
      body: tableData,
      headStyles: { 
        fillColor: auroraOrange as any, 
        textColor: [255, 255, 255], 
        fontStyle: 'bold' 
      },
      alternateRowStyles: { fillColor: auroraLightGray as any },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 9 },
    });

    doc.save(`Contatos_Recepcao_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-bold text-gray-900">Lista de Colaboradores ({total})</h3>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download size={16} />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToExcel} className="gap-2">
                <FileSpreadsheet size={16} className="text-green-600" />
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF} className="gap-2">
                <FileText size={16} className="text-red-600" />
                PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
            <TableHead className="font-bold">Nome</TableHead>
            <TableHead className="font-bold">Setor</TableHead>
            <TableHead className="font-bold">Função</TableHead>
            <TableHead className="font-bold text-center">Ramal</TableHead>
            <TableHead className="font-bold">E-mail</TableHead>
            {isAdmin && <TableHead className="text-right font-bold w-[100px]">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isAdmin ? 6 : 5} className="h-32 text-center text-gray-500">
                Nenhum contato encontrado.
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => (
              <TableRow key={contact.id} className="group transition-colors hover:bg-gray-50/30">
                <TableCell className="font-medium text-gray-900">{contact.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal bg-blue-50/50 border-blue-100 text-blue-700">
                    {contact.department}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">{contact.position}</TableCell>
                <TableCell className="text-center">
                  {contact.extension ? (
                    <div className="flex items-center justify-center gap-1.5 text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded-md">
                      <Phone size={14} />
                      {contact.extension}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {contact.email ? (
                    <div className="flex items-center gap-1.5 text-gray-500 hover:text-orange-600 transition-colors cursor-default">
                      <Mail size={14} />
                      <span className="text-sm">{contact.email}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-orange-600 transition-colors"
                        onClick={() => onEdit(contact)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-600 transition-colors"
                        onClick={() => onDelete(contact)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
