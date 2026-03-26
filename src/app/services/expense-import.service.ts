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
    { field: 'date', column: 'expense_date', required: false },
    { field: 'amount', column: 'amount', required: true },
    { field: 'category', column: 'category', required: false },
    { field: 'description', column: 'description', required: false },
    { field: 'paid_through', column: 'paid_through', required: true },
    { field: 'currency', column: 'currency_id', required: false },
    { field: 'notes', column: 'notes', required: false },
    // Custom fields
    { field: 'vendor', column: 'vendor', required: false },
    { field: 'receipt_number', column: 'receipt_number', required: false },
    { field: 'reference', column: 'reference', required: false },
  ];

  // Default mappings based on common CSV headers
  readonly defaultMappings: { [key: string]: string } = {
    'date': 'expense_date',
    'expense_date': 'expense_date',
    'expense date': 'expense_date',
    'transaction date': 'expense_date',
    'transaction_date': 'expense_date',
    'amount': 'amount',
    ' amount': 'amount',
    'amount (ghs)': 'amount',
    'category': 'category',
    'expense category': 'category',
    'description': 'description',
    'desc': 'description',
    'notes': 'notes',
    'paid_through': 'paid_through',
    'paid through': 'paid_through',
    'payment method': 'paid_through',
    'payment_method': 'paid_through',
    'account': 'paid_through',
    'currency': 'currency_id',
    // Custom field mappings
    'vendor': 'vendor',
    'receipt': 'receipt_number',
    'receipt_number': 'receipt_number',
    'receipt #': 'receipt_number',
    'reference': 'reference',
    'ref': 'reference',
  };

  /**
   * Parse file (CSV or Excel) and return data
   */
  parseFile(file: File): Promise<{ headers: string[], rows: ParsedRow[] }> {
    return new Promise((resolve, reject) => {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'csv') {
        this.parseCSV(file).then(result => {
          console.log('CSV Parsed - Headers:', result.headers);
          console.log('CSV Parsed - First row:', result.rows[0]);
          resolve(result);
        }).catch(err => reject(err));
      } else if (extension === 'xlsx' || extension === 'xls') {
        this.parseExcel(file).then(result => {
          console.log('Excel Parsed - Headers:', result.headers);
          console.log('Excel Parsed - First row:', result.rows[0]);
          resolve(result);
        }).catch(err => reject(err));
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
    
    console.log('Auto-mapping columns:', mapping);
    return mapping;
  }

  /**
   * Validate and transform data based on mappings
   * @param rows - parsed data rows
   * @param columnMapping - mapping from file columns to app fields
   * @param extraFields - optional additional fields beyond the built-in ones
   */
  transformData(rows: ParsedRow[], columnMapping: { [key: string]: string }, extraFields?: ImportMapping[]): ImportResult {
    const errors: string[] = [];
    const transformedData: ParsedRow[] = [];

    // Combine built-in fields with any extra fields
    const allFields = extraFields ? [...this.availableFields, ...extraFields] : this.availableFields;

    rows.forEach((row, index) => {
      const transformedRow: ParsedRow = {};
      let hasError = false;

      allFields.forEach(field => {
        const sourceColumn = Object.keys(columnMapping).find(
          key => columnMapping[key] === field.column
        );

        if (sourceColumn) {
          let value = row[sourceColumn];
          console.log(`Field: ${field.column}, Source column: ${sourceColumn}, Raw value:`, value);
          
          // Apply field-specific transformations
          transformedRow[field.column] = this.transformField(field.column, value);
          console.log(`Transformed value:`, transformedRow[field.column]);
          
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

      // Check if row has minimum required data (amount and paid_through are required)
      // Date is optional - if missing, will be set to today's date during import
      const hasAmount = transformedRow['amount'] !== null && transformedRow['amount'] !== undefined;
      const hasPaidThrough = transformedRow['paid_through'] && transformedRow['paid_through'] !== '';
      const hasDate = transformedRow['expense_date'] !== null && transformedRow['expense_date'] !== undefined;
      
      if (!hasError && hasAmount && hasPaidThrough) {
        // If date is missing, set to today's date
        if (!hasDate) {
          transformedRow['expense_date'] = new Date().toISOString().split('T')[0];
        }
        transformedData.push(transformedRow);
      } else if (!hasAmount) {
        errors.push(`Row ${index + 1}: Amount is required`);
      } else if (!hasPaidThrough) {
        errors.push(`Row ${index + 1}: Paid Through is required`);
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

    // If it's a number (Excel serial date)
    if (typeof value === 'number') {
      // Excel serial date (days since 1899-12-30)
      const date = new Date((value - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }

    // If it's a string, try various formats
    if (typeof value === 'string') {
      const dateStr = value.trim();
      
      // Try standard Date parsing first
      let date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }

      // Try to parse human-readable formats like "Tuesday 1st January 2026"
      // Remove ordinal suffixes (st, nd, rd, th)
      const cleanedDate = dateStr
        .replace(/(\d+)(st|nd|rd|th)/gi, '$1')  // Remove st, nd, rd, th
        .replace(/\s+/g, ' ')  // Normalize whitespace
        .trim();

      // Try parsing the cleaned date
      date = new Date(cleanedDate);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }

      // Try common date formats manually
      // Format: "1 January 2026" or "January 1, 2026"
      const months: { [key: string]: number } = {
        'january': 0, 'february': 1, 'march': 2, 'april': 3,
        'may': 4, 'june': 5, 'july': 6, 'august': 7,
        'september': 8, 'october': 9, 'november': 10, 'december': 11
      };

      // Match "1 January 2026" or "1st January 2026"
      const dayMonthYearMatch = cleanedDate.match(/(\d+)\s+(\w+)\s+(\d{4})/i);
      if (dayMonthYearMatch) {
        const day = parseInt(dayMonthYearMatch[1], 10);
        const monthName = dayMonthYearMatch[2].toLowerCase();
        const year = parseInt(dayMonthYearMatch[3], 10);
        const month = months[monthName];
        if (month !== undefined) {
          date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
      }

      // Match "January 1, 2026" or "Jan 1 2026"
      const monthDayYearMatch = cleanedDate.match(/(\w+)\s+(\d+),?\s+(\d{4})/i);
      if (monthDayYearMatch) {
        const monthName = monthDayYearMatch[1].toLowerCase();
        const day = parseInt(monthDayYearMatch[2], 10);
        const year = parseInt(monthDayYearMatch[3], 10);
        const month = months[monthName.substring(0, 3)]; // Handle Jan, Feb, etc.
        if (month !== undefined) {
          date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
      }
    }

    return null;
  }

  /**
   * Check if row has minimum required data
   * Only amount and paid_through are truly required
   */
  private isValidRow(row: ParsedRow): boolean {
    // Amount and paid_through are required
    return row['amount'] !== null && row['amount'] !== undefined && !!row['paid_through'];
  }

  /**
   * Generate sample CSV template
   */
  generateTemplate(): string {
    const headers = ['Date', 'Amount', 'Category', 'Description', 'Paid Through', 'Currency', 'Vendor', 'Receipt Number', 'Reference'];
    const sampleData = [
      ['2026-01-15', '150.00', 'Office Supplies', 'Printer paper and ink', 'Cash', 'GHS', 'Office Depot', 'REC-001', 'REF-001'],
      ['2026-01-20', '250.00', 'Transportation', 'Taxi to meeting', 'MOMO', 'GHS', 'Uber', 'REC-002', 'REF-002'],
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