import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PDFConfig {
  title: string;
  subtitle?: string;
  filename: string;
  columns: { header: string; dataKey: string }[];
  data: any[];
}

/**
 * Função para converter uma URL de imagem em Base64
 */
const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    };
    img.onerror = (error) => reject(error);
    img.src = url;
  });
};

export async function exportToPdf({
  title,
  subtitle,
  filename,
  columns,
  data,
}: PDFConfig) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  
  try {
    // 1. Adicionar Logo (Timbrado)
    // Usando o logo da pasta public. Em ambiente Next.js, acessamos direto pela raiz /
    try {
      const logoBase64 = await getBase64ImageFromURL("/logo-aurora.png");
      doc.addImage(logoBase64, "PNG", 15, 10, 35, 12);
    } catch (e) {
      console.warn("Logo não carregada no PDF", e);
    }

    // 2. Cabeçalho da Empresa (Texto)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("AURORA EADI - ARMAZÉM GERAL", pageWidth - 15, 15, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Relatório Operacional - Portal Aurora", pageWidth - 15, 20, { align: "right" });
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, pageWidth - 15, 25, { align: "right" });

    // Linha divisória
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 30, pageWidth - 15, 30);

    // 3. Título do Relatório
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(title.toUpperCase(), 15, 45);

    if (subtitle) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(subtitle, 15, 52);
    }

    // 4. Gerar Tabela
    autoTable(doc, {
      startY: subtitle ? 60 : 55,
      head: [columns.map((c) => c.header)],
      body: data.map((row) => columns.map((c) => row[c.dataKey] ?? "—")),
      theme: "striped",
      headStyles: {
        fillColor: [249, 115, 22], // Laranja Aurora (#f97316)
        textColor: 255,
        fontSize: 10,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      margin: { left: 15, right: 15 },
    });

    // 5. Rodapé (Paginação)
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Página ${i} de ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
        );
    }

    // 6. Download
    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    throw error;
  }
}
