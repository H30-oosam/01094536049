import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Exports data to an Excel file (.xlsx)
 */
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  
  saveAs(blob, `${fileName}_${new Date().getTime()}.xlsx`);
};

/**
 * Exports data to a PDF file (.pdf)
 */
export const exportToPDF = (data: any[], fileName: string, title: string) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  
  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    const body = data.map(item => headers.map(header => item[header]));
    
    (doc as any).autoTable({
      head: [headers],
      body: body,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 8, font: 'Inter' },
      headStyles: { fillStyle: '#4f46e5' }
    });
  }
  
  doc.save(`${fileName}_${new Date().getTime()}.pdf`);
};
