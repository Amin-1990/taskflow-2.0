const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const { getLocalDateTime, formatDateForAPI } = require('../utils/datetime');

class ExportService {
  
  // ===========================================
  // EXPORTS CSV
  // ===========================================
  
  /**
    * Exporte des données au format CSV
    */
  async toCSV(data, fields = null) {
    try {
      if (!data || data.length === 0) {
        return '';
      }
      
      const json2csv = new Parser({ fields: fields || Object.keys(data[0]) });
      return json2csv.parse(data);
    } catch (error) {
      console.error('Erreur export CSV:', error);
      throw error;
    }
  }
  
  // ===========================================
  // EXPORTS EXCEL
  // ===========================================
  
  /**
    * Exporte des données au format Excel
    */
  async toExcel(data, sheetName = 'Sheet1', columns = null) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    
    // Définir les colonnes
    if (columns) {
      worksheet.columns = columns;
    } else if (data.length > 0) {
      worksheet.columns = Object.keys(data[0]).map(key => ({
        header: key,
        key: key,
        width: 20
      }));
    }
    
    // Ajouter les données
    worksheet.addRows(data);
    
    // Styliser l'en-tête
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    return await workbook.xlsx.writeBuffer();
  }
  
  /**
    * Exporte le planning en Excel avec formatage
    */
  async planningToExcel(planning, semaine) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Planning');
    
    // Titre
    const titleRow = worksheet.addRow([`Planning - ${semaine}`]);
    titleRow.font = { bold: true, size: 14 };
    worksheet.mergeCells('A1:G1');
    
    // Date d'export
    const dateRow = worksheet.addRow([`Généré le ${formatDateForAPI(getLocalDateTime())}`]);
    dateRow.font = { italic: true };
    worksheet.mergeCells('A2:G2');
    
    worksheet.addRow([]);
    
    // En-têtes
    const headers = ['Code Article', 'Lot', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Total'];
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    // Données
    if (planning && planning.length > 0) {
      planning.forEach(row => {
        worksheet.addRow([
          row['Code Article'] || '',
          row['Lot'] || '',
          row['Lundi'] || 0,
          row['Mardi'] || 0,
          row['Mercredi'] || 0,
          row['Jeudi'] || 0,
          row['Vendredi'] || 0,
          row['Total Prévu'] || 0
        ]);
      });
    }
    
    // Largeurs de colonne
    worksheet.columns.forEach(col => col.width = 15);
    
    return await workbook.xlsx.writeBuffer();
  }
  
  // ===========================================
  // EXPORTS PDF
  // ===========================================
  
  /**
   * Crée un document PDF de base
   */
  createPDF(title = 'Rapport Taskflow') {
    const doc = new PDFDocument({ margin: 50 });
    
    // En-tête
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Généré le ${formatDateForAPI(getLocalDateTime())}`, { align: 'right' });
    doc.moveDown();
    
    return doc;
  }
  
  /**
    * Exporte un tableau simple au format PDF
    */
  async tableToPDF(data, title) {
    const doc = this.createPDF(title);
    
    if (data.length === 0) {
      doc.text('Aucune donnée disponible');
      return doc;
    }
    
    const headers = Object.keys(data[0]);
    const columnWidth = 500 / headers.length;
    
    // En-tête du tableau
    let y = doc.y;
    headers.forEach((header, i) => {
      doc.rect(50 + i * columnWidth, y, columnWidth, 25).stroke();
      doc.text(header, 55 + i * columnWidth, y + 5, { 
        width: columnWidth - 10,
        align: 'center'
      });
    });
    
    // Données
    y += 25;
    data.forEach((row, rowIndex) => {
      headers.forEach((header, colIndex) => {
        const value = row[header] || '';
        doc.rect(50 + colIndex * columnWidth, y + rowIndex * 20, columnWidth, 20).stroke();
        doc.text(String(value), 55 + colIndex * columnWidth, y + rowIndex * 20 + 2, { 
          width: columnWidth - 10 
        });
      });
    });
    
    return doc;
  }
  
  /**
    * Exporte le planning en PDF
    */
  async planningToPDF(planning, semaine) {
    const doc = this.createPDF(`Planning - ${semaine}`);
    
    if (!planning || planning.length === 0) {
      doc.text('Aucun planning disponible');
      return doc;
    }
    
    const columns = ['Code Article', 'Lot', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Total'];
    const columnWidth = 65;
    const rows = [columns, ...planning.map(p => [
      p['Code Article'] || '',
      p['Lot'] || '',
      p['Lundi'] || 0,
      p['Mardi'] || 0,
      p['Mercredi'] || 0,
      p['Jeudi'] || 0,
      p['Vendredi'] || 0,
      p['Total Prévu'] || 0
    ])];
    
    // En-têtes
    let y = doc.y;
    columns.forEach((col, i) => {
      doc.rect(50 + i * columnWidth, y, columnWidth, 25)
        .fillAndStroke('lightblue', 'black');
      doc.fontSize(10).text(col, 55 + i * columnWidth, y + 5, {
        width: columnWidth - 10,
        align: 'center'
      });
    });
    
    // Données
    y += 25;
    planning.forEach((row, rowIndex) => {
      const rowData = [
        row['Code Article'] || '',
        row['Lot'] || '',
        row['Lundi'] || 0,
        row['Mardi'] || 0,
        row['Mercredi'] || 0,
        row['Jeudi'] || 0,
        row['Vendredi'] || 0,
        row['Total Prévu'] || 0
      ];
      
      rowData.forEach((value, colIndex) => {
        doc.rect(50 + colIndex * columnWidth, y + rowIndex * 20, columnWidth, 20)
          .stroke();
        doc.fontSize(9).text(String(value), 55 + colIndex * columnWidth, y + rowIndex * 20 + 2, {
          width: columnWidth - 10
        });
      });
    });
    
    return doc;
  }
}

module.exports = new ExportService();