const ExcelJS = require('exceljs');
const db = require('../config/database');
const { Readable } = require('stream');

class ImportService {
  formatDate(value) {
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = value.getUTCFullYear();
    const mm = pad(value.getUTCMonth() + 1);
    const dd = pad(value.getUTCDate());
    const hh = pad(value.getUTCHours());
    const mi = pad(value.getUTCMinutes());
    const ss = pad(value.getUTCSeconds());

    // Excel time-only cells are often based on 1899-12-30 / 1899-12-31.
    if ((yyyy === 1899 && (value.getUTCMonth() === 11) && (value.getUTCDate() === 30 || value.getUTCDate() === 31)) || yyyy === 1900) {
      return `${hh}:${mi}:${ss}`;
    }

    if (hh === '00' && mi === '00' && ss === '00') {
      return `${yyyy}-${mm}-${dd}`;
    }

    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  }
  
  /**
   * Lit un fichier Excel et retourne les données
   */
  async readExcel(buffer) {
    if (!buffer || buffer.length === 0) {
      throw new Error('Fichier vide ou illisible');
    }

    let worksheet = null;

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      worksheet = workbook.worksheets[0] || null;
    } catch (_) {
      worksheet = null;
    }

    if (!worksheet) {
      try {
        const csvText = buffer.toString('utf8');
        const firstNonEmptyLine = csvText.split(/\r?\n/).find((line) => line && line.trim().length > 0) || '';
        const semicolonCount = (firstNonEmptyLine.match(/;/g) || []).length;
        const commaCount = (firstNonEmptyLine.match(/,/g) || []).length;
        const delimiter = semicolonCount > commaCount ? ';' : ',';

        const workbookCsv = new ExcelJS.Workbook();
        worksheet = await workbookCsv.csv.read(Readable.from([csvText]), {
          parserOptions: { delimiter }
        });
      } catch (_) {
        worksheet = null;
      }
    }

    if (!worksheet) {
      throw new Error('Format non supporte. Utilisez un fichier .xlsx ou .csv');
    }

    const data = [];
    const headers = [];
    const headerRow = worksheet.getRow(1);

    if (!headerRow) {
      throw new Error('Fichier invalide: en-tetes introuvables');
    }

    headerRow.eachCell((cell) => {
      const headerValue = cell?.value;
      headers.push(headerValue !== null && headerValue !== undefined ? String(headerValue).trim() : '');
    });

    if (headers.length === 0 || headers.every((h) => !h)) {
      throw new Error('Fichier invalide: en-tetes vides');
    }

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;

      const rowData = {};
      row.eachCell((cell, colNumber) => {
        let value = cell.value;
        if (cell.type === ExcelJS.ValueType.Date && value instanceof Date) {
          value = this.formatDate(value);
        }
        rowData[headers[colNumber - 1]] = value;
      });
      data.push(rowData);
    });

    return data;
  }

  validateData(data, schema) {
    const errors = [];
    const validData = [];
    
    data.forEach((row, index) => {
      const rowErrors = [];
      const validatedRow = {};
      
      for (const [field, rules] of Object.entries(schema)) {
        const value = row[field];
        
        if (rules.required && !value) {
          rowErrors.push(`Ligne ${index + 2}: ${field} requis`);
          continue;
        }
        
        if (rules.type && value) {
          if (rules.type === 'number' && isNaN(Number(value))) {
            rowErrors.push(`Ligne ${index + 2}: ${field} doit être un nombre`);
          } else if (rules.type === 'date' && isNaN(new Date(value).getTime())) {
            rowErrors.push(`Ligne ${index + 2}: ${field} doit être une date`);
          }
        }
        
        validatedRow[field] = value;
      }
      
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validData.push(validatedRow);
      }
    });
    
    return { validData, errors };
  }
  
  /**
   * Importe des commandes
   */
  async importCommandes(data, connection) {
    const resultats = [];
    
    for (const row of data) {
      // Chercher la semaine
      let semaineId = null;
      if (row['Semaine']) {
        const [semaine] = await connection.query(
          'SELECT ID FROM semaines WHERE Code_semaine = ?',
          [row['Semaine']]
        );
        semaineId = semaine[0]?.ID;
      }
      
      // Chercher l'article
      const [article] = await connection.query(
        'SELECT ID FROM articles WHERE Code_article = ?',
        [row['Code article']]
      );
      
      const [result] = await connection.query(
        `INSERT INTO commandes (
          Date_debut, Code_article, Lot, Quantite, Origine,
          ID_Semaine, ID_Article, Date_creation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          row['Date début'],
          row['Code article'],
          row['Lot'] || null,
          row['Quantité'],
          row['Origine'] || 'Import Excel',
          semaineId,
          article[0]?.ID || null
        ]
      );
      
      resultats.push({ id: result.insertId, code: row['Code article'] });
    }
    
    return resultats;
  }
  
  /**
   * Importe du personnel
   */
  async importPersonnel(data, connection) {
    const resultats = [];
    
    for (const row of data) {
      const [result] = await connection.query(
        `INSERT INTO personnel (
          Nom_prenom, Matricule, Date_embauche, Email,
          Telephone, Poste, Site_affectation, Date_creation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          row['Nom et prénom'],
          row['Matricule'],
          row['Date embauche'],
          row['Email'] || null,
          row['Téléphone'] || null,
          row['Poste'] || 'Operateur',
          row['Site'] || null
        ]
      );
      
      resultats.push({ id: result.insertId, matricule: row['Matricule'] });
    }
    
    return resultats;
  }
  
  /**
   * Génère un template Excel
   */
  async generateTemplate(columns, sheetName = 'Template') {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    
    worksheet.columns = columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width || 20
    }));
    
    if (columns[0]?.example) {
      const exampleRow = {};
      columns.forEach(col => {
        exampleRow[col.key] = col.example;
      });
      worksheet.addRow(exampleRow);
      worksheet.getRow(2).font = { italic: true, color: { argb: 'FF808080' } };
    }
    
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    return await workbook.xlsx.writeBuffer();
  }
}

module.exports = new ImportService();
