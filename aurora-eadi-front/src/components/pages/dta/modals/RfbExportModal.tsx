'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download } from 'lucide-react';
import { CargoItem } from '@/types/ccte';
import * as XLSX from 'xlsx-js-style';
import { toast } from 'sonner';

interface RfbExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sentItems: CargoItem[];
}

export function RfbExportModal({
  open,
  onOpenChange,
  sentItems,
}: RfbExportModalProps) {
  const today = new Date();
  const todayFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  const todayISO = today.toISOString().split('T')[0];

  const [horaVencimento, setHoraVencimento] = useState('');
  const [dataVencimento, setDataVencimento] = useState(todayISO);
  const [error, setError] = useState('');

  const formatDateInput = (isoDate: string): string => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  const applyDtaMask = (value: string) => {
    let clean = value.replace(/\D/g, '');
    if (clean.length > 10) clean = clean.slice(0, 10);

    let masked = clean;
    if (clean.length > 2) {
      masked = clean.slice(0, 2) + '/' + clean.slice(2);
    }
    if (clean.length > 9) {
      masked = masked.slice(0, 10) + '-' + masked.slice(10);
    }
    return masked;
  };

  const handleSubmit = () => {
    if (!horaVencimento.trim()) {
      setError('Hora Vencimento e obrigatoria');
      return;
    }

    try {
      const dataVencFormatted = formatDateInput(dataVencimento);

      const rows: (string | number | null)[][] = [];

      // Row 1: Beneficiario
      rows.push([
        'BENEFICIARIO: AURORA DA AMAZONIA TERMINAIS E SERVICOS  CNPJ 04.694.548/0001-30',
        null,
        null,
        null,
        null,
      ]);

      // Row 2: Data de hoje
      rows.push([todayFormatted, null, null, null, null]);

      // Row 3: Horario de entrada
      rows.push(['HORARIO DE ENTRADA :', null, null, null, null]);

      // Row 4: Headers
      rows.push(['', 'CANAL', 'DTA', 'HR VENC', 'DATA VENC']);

      // Row 5+: Data rows
      sentItems.forEach((item, index) => {
        const dtaFormatted = item.dta ? applyDtaMask(item.dta) : item.dta;
        rows.push([
          index + 1,
          '',
          dtaFormatted,
          horaVencimento.trim(),
          dataVencFormatted,
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(rows);

      // Merge cells for rows 1-3 (A1:E1, A2:E2, A3:E3)
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
      ];

      // Border + alignment styles
      const border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };

      const centeredStyle = { alignment: { horizontal: 'center' }, border };

      // Total rows and cols
      const totalRows = rows.length;
      const totalCols = 5; // A-E

      // Apply borders to all cells and center merged rows
      for (let r = 0; r < totalRows; r++) {
        for (let c = 0; c < totalCols; c++) {
          const cellRef = XLSX.utils.encode_cell({ r, c });
          if (!worksheet[cellRef]) {
            worksheet[cellRef] = { v: '', t: 's' };
          }
          if (r < 3) {
            // Merged header rows: centered + bordered
            worksheet[cellRef].s = centeredStyle;
          } else if (r === 3) {
            // Header row: bold center + bordered
            worksheet[cellRef].s = {
              font: { bold: true },
              alignment: { horizontal: 'center' },
              border,
            };
          } else {
            // Data rows: centered + bordered
            worksheet[cellRef].s = { alignment: { horizontal: 'center' }, border };
          }
        }
      }

      // Set column widths
      worksheet['!cols'] = [
        { wch: 8 },
        { wch: 10 },
        { wch: 18 },
        { wch: 12 },
        { wch: 14 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'RFB');

      const fileDate = todayFormatted.replace(/\//g, '-');
      XLSX.writeFile(workbook, `RFB_CCTE_${fileDate}.xlsx`);

      toast.success('Planilha RFB exportada com sucesso!');
      handleClose();
    } catch (err) {
      console.error('Erro ao gerar planilha RFB:', err);
      toast.error('Ocorreu um erro ao gerar a planilha.');
    }
  };

  const handleClose = () => {
    setHoraVencimento('');
    setDataVencimento(todayISO);
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[480px] p-0 gap-0 overflow-hidden bg-white"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-emerald-50/50 flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
            <Download size={24} />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Exportar RFB
            </DialogTitle>
            <p className="text-sm text-emerald-700 mt-1 font-medium">
              {sentItems.length} {sentItems.length === 1 ? 'item selecionado' : 'itens selecionados'}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold flex items-center justify-between">
              Hora Vencimento
              <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                Obrigatorio
              </span>
            </Label>
            <Input
              value={horaVencimento}
              onChange={(e) => {
                setHoraVencimento(e.target.value);
                if (error) setError('');
              }}
              placeholder="20H"
              className={error ? 'border-destructive ring-destructive/20' : 'border-slate-200'}
            />
            {error && (
              <p className="text-xs text-destructive font-medium">{error}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">
              Data Vencimento
            </Label>
            <Input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="border-slate-200"
            />
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50/50 border-t border-gray-100 gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px] shadow-sm"
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
