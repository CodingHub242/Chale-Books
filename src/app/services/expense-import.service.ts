import { Injectable } from '@angular/core';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ImportMapping {
  field: string;
  column: string;
  required: boolean;
}

export interface ParsedRow {
  [key: string]: any;
}

export interface ImportResult {
  success: boolean;
  data: ParsedRow[];
  errors: string[];
  totalRows: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseImportService {

  // Available expense fields that can be mapped
  readonly availableFields: ImportMapping[] = [
    { field: 'date', column: 'expense_date', required: true },
    { field: 'amount', column: 'amount', required: true },
    { field: 'category', column: 'category', required: false },
    { field: 'description', column: 'description', required: false },
    { field: 'paid_through', column: 'paid_through', required: true },
    { field: 'currency', column: 'currency_id', required: false },
    { field: 'notes', column: 'notes', required: false },
  ];

  // Default mappings based on common CSV headers
  readonly defaultMappings: { [key: string]: string } = {
    'date': 'expense_date',
    'expense_date': 'expense_date',
    'amount': 'amount',
    ' Amount': 'amount',
    'category': 'category',
    'description': 'description',
    'desc': 'description',
    'notes': 'notes',
    'paid_through': 'paid_through',
    'paid through': 'paid_through',
    'account': 'paid_through',
    'currency': 'currency_id',
  };

  /**
   * Parse file (CSV or Excel) and return data
   */
  parseFile(file: File): Promise<{ headers: string[], rows: ParsedRow[] }> {
    return new Promise((resolve, reject) => {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'csv') {
        this.parseCSV(file).then(result => resolve(result)).catch(err => reject(err));
      } else if (extension === 'xlsx' || extension === 'xls') {
        this.parseExcel(file).then(result => resolve(result)).catch(err => reject(err));
      } else {
        reject(new Error('Unsupported file format. Please use CSV or Excel files.'));
      }
    });
  }

  /**
   * Parse CSV file using PapaParse
   */
  private parseCSV(file: File): Promise<{ headers: string[], rows: ParsedRow[] }> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          
          const headers = results.meta.fields || [];
          const rows = results.data as ParsedRow[];
          resolve({ headers, rows });
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  /**
   * Parse Excel file using SheetJS
   */
  private parseExcel(file: File): Promise<{ headers: string[], rows: ParsedRow[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with header
          const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as ParsedRow[];
          
          // Get headers from first row
          const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
          
          resolve({ headers, rows });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Auto-map columns based on common header names
   */
  autoMapColumns(headers: string[]): { [key: string]: string } {
    const mapping: { [key: string]: string } = {};
    
    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim();
      const mappedField = this.defaultMappings[normalizedHeader];
      if (mappedField) {
        mapping[header] = mappedField;
      }
    });
    
    return mapping;
  }

  /**
   * Validate and transform data based on mappings
   */
  transformData(rows: ParsedRow[], columnMapping: { [key: string]: string }): ImportResult {
    const errors: string[] = [];
    const transformedData: ParsedRow[] = [];

    rows.forEach((row, index) => {
      const transformedRow: ParsedRow = {};
      let hasError = false;

      this.availableFields.forEach(field => {
        const sourceColumn = Object.keys(columnMapping).find(
          key => columnMapping[key] === field.column
        );

        if (sourceColumn) {
          let value = row[sourceColumn];
          
          // Apply field-specific transformations
          transformedRow[field.column] = this.transformField(field.column, value);
          
          // Validate required fields
          if (field.required && (value === null || value === undefined || value === '')) {
            errors.push(`Row ${index + 1}: Missing required field "${field.field}"`);
            hasError = true;
          }
        } else if (field.required) {
          // Required field not mapped
          errors.push(`Row ${index + 1}: Required field "${field.field}" not mapped`);
          hasError = true;
        }
      });

      if (!hasError && this.isValidRow(transformedRow)) {
        transformedData.push(transformedRow);
      }
    });

    return {
      success: errors.length === 0,
      data: transformedData,
      errors: errors,
      totalRows: rows.length
    };
  }

  /**
   * Transform field values based on field type
   */
  private transformField(field: string, value: any): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    switch (field) {
      case 'amount':
        // Remove currency symbols and convert to number
        const numValue = typeof value === 'string' 
          ? parseFloat(value.replace(/[^0-9.-]+/g, '')) 
          : value;
        return isNaN(numValue) ? null : numValue;

      case 'expense_date':
        // Try to parse various date formats
        return this.parseDate(value);

      case 'currency_id':
        // Keep as string, will be resolved on backend
        return value.toString().trim();

      default:
        return value.toString().trim();
    }
  }

  /**
   * Parse date from various formats
   */
  private parseDate(value: any): string | null {
    if (!value) return null;

    // If already a valid date string
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }

    // If it's a serial number (Excel date)
    if (typeof value === 'number') {
      // Excel serial date (days since 1899-12-30)
      const date = new Date((value - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }

    return null;
  }

  /**
   * Check if row has minimum required data
   */
  private isValidRow(row: ParsedRow): boolean {
    return !!(row['expense_date'] && row['amount'] !== null && row['paid_through']);
  }

  /**
   * Generate sample CSV template
   */
  generateTemplate(): string {
    const headers = ['Date', 'Amount', 'Category', 'Description', 'Paid Through', 'Currency'];
    const sampleData = [
      ['2026-01-15', '150.00', 'Office Supplies', 'Printer paper and ink', 'Cash', 'GHS'],
      ['2026-01-20', '250.00', 'Transportation', 'Taxi to meeting', 'MOMO', 'GHS'],
    ];

    return Papa.unparse({
      fields: headers,
      data: sampleData
    });
  }

  /**
   * Download template as file
   */
  downloadTemplate(): void {
    const csv = this.generateTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'expense_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}