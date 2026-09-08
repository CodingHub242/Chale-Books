import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,
  IonIcon, IonSelect, IonSelectOption, IonChip, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  closeOutline, cloudUploadOutline, arrowForwardOutline, arrowBackOutline, 
  downloadOutline, checkmarkCircleOutline, warningOutline, alertCircleOutline, 
  informationCircleOutline, closeCircleOutline
} from 'ionicons/icons';
import * as XLSX from 'xlsx';
import { Api } from '../../services/api';

@Component({
  selector: 'app-import-chart-of-accounts-modal',
  templateUrl: './import-chart-of-accounts-modal.component.html',
  styleUrls: ['./import-chart-of-accounts-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,
    IonIcon, IonSelect, IonSelectOption, IonChip, IonSpinner
  ]
})
export class ImportChartOfAccountsModalComponent implements OnInit {
  currentStep = 1;
  selectedFile: File | null = null;
  fileHeaders: string[] = [];
  parsedRows: any[] = [];
  columnMapping: { [key: string]: string } = {};
  previewData: any[] = [];
  
  validData: any[] = [];
  validationErrors: string[] = [];
  isImporting = false;
  importProgress = 0;
  importResult: { success: number; failed: number } | null = null;
  
  isDragOver = false;
  
  availableFields = [
    { field: 'Account Name', column: 'name', required: true },
    { field: 'Account Code', column: 'code', required: false },
    { field: 'Account Type', column: 'type', required: true },
    { field: 'Subtype', column: 'subtype', required: false },
    { field: 'Category', column: 'category', required: false },
    { field: 'Normal Balance', column: 'normal_balance', required: false },
    { field: 'Description', column: 'description', required: false },
    { field: 'Notes', column: 'notes', required: false },
    { field: 'Status', column: 'status', required: false }
  ];

  typeOptions = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' }
  ];

  normalBalanceOptions = [
    { value: 'debit', label: 'Debit' },
    { value: 'credit', label: 'Credit' }
  ];

  constructor(
    private api: Api
  ) {
    addIcons({ 
      closeOutline, 
      cloudUploadOutline, 
      arrowForwardOutline, 
      arrowBackOutline,
      downloadOutline, 
      checkmarkCircleOutline, 
      warningOutline, 
      alertCircleOutline,
      informationCircleOutline,
      closeCircleOutline
    });
  }

  ngOnInit() {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  downloadTemplate() {
    const headers = ['Account Name', 'Account Code', 'Account Type', 'Subtype', 'Category', 'Normal Balance', 'Description', 'Notes', 'Status'];
    const sampleData = [
      ['Cash', '1000', 'Asset', 'Cash', 'Operating', 'Debit', 'Main cash account', 'Petty cash notes', 'Active'],
      ['Sales Revenue', '4000', 'Income', 'Sales', 'Operating', 'Credit', 'Primary sales income', 'Service revenue', 'Active'],
      ['Rent Expense', '6000', 'Expense', 'Rent', 'Operating', 'Debit', 'Office rent', 'Monthly rent', 'Active']
    ];

    const csvContent = [headers, ...sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'chart_of_accounts_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async parseFile() {
    if (!this.selectedFile) return;

    try {
      const result = await this.parseFileAsync(this.selectedFile);
      this.fileHeaders = result.headers;
      this.parsedRows = result.rows;
      this.previewData = result.rows;

      this.columnMapping = {};
      this.fileHeaders.forEach((header: string) => {
        const normalizedHeader = header.toLowerCase().trim();
        const mappedField = this.availableFields.find(f => 
          normalizedHeader.includes(f.column.toLowerCase()) ||
          f.field.toLowerCase().includes(normalizedHeader)
        );
        if (mappedField) {
          this.columnMapping[header] = mappedField.column;
        }
      });

      this.currentStep = 2;
    } catch (error: any) {
      alert(error.message || 'Failed to parse file');
    }
  }

  private parseFileAsync(file: File): Promise<{ headers: string[], rows: any[] }> {
    return new Promise((resolve, reject) => {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'csv') {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const text = e.target.result;
            const lines = text.split('\n').filter((line: string) => line.trim());
            const headers = lines[0].split(',').map((h: string) => h.replace(/"/g, '').trim());
            const rows = [];
            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(',').map((v: string) => v.replace(/"/g, '').trim());
              const row: any = {};
              headers.forEach((header: string, index: number) => {
                row[header] = values[index] || '';
              });
              rows.push(row);
            }
            resolve({ headers, rows });
            } catch (error: any) {
              reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
      } else if (extension === 'xlsx' || extension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[];
            const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
            resolve({ headers, rows: jsonData });
            } catch (error: any) {
              reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('Unsupported file format. Please use CSV or Excel files.'));
      }
    });
  }

  getColumnMapping(fieldColumn: string): string {
    return Object.keys(this.columnMapping).find(
      key => this.columnMapping[key] === fieldColumn
    ) || '';
  }

  onColumnChange(fieldColumn: string, event: any) {
    const selectedColumn = event.detail.value;
    
    const oldMapping = Object.keys(this.columnMapping).find(
      key => this.columnMapping[key] === fieldColumn
    );
    if (oldMapping) {
      delete this.columnMapping[oldMapping];
    }
    
    if (selectedColumn) {
      this.columnMapping[selectedColumn] = fieldColumn;
    }
  }

  getPreviewValue(row: any, fieldColumn: string): string {
    const mappedColumn = Object.keys(this.columnMapping).find(
      key => this.columnMapping[key] === fieldColumn
    );
    if (!mappedColumn) return '-';
    
    const value = row[mappedColumn];
    return value !== undefined && value !== null ? String(value) : '-';
  }

  isMappingValid(): boolean {
    const requiredFields = this.availableFields.filter(f => f.required);
    const mappedRequired = requiredFields.filter(f => 
      Object.values(this.columnMapping).includes(f.column)
    );
    return mappedRequired.length === requiredFields.length;
  }

  validateData() {
    this.validData = [];
    this.validationErrors = [];

    this.parsedRows.forEach((row: any, index: number) => {
      const mappedRow: any = {};
      let hasError = false;

      this.availableFields.forEach(field => {
        const sourceColumn = Object.keys(this.columnMapping).find(
          key => this.columnMapping[key] === field.column
        );

        if (sourceColumn) {
          let value = row[sourceColumn];
          if (field.column === 'type') {
            value = this.normalizeType(value);
          }
          if (field.column === 'status') {
            value = this.normalizeStatus(value);
          }
          if (field.column === 'normal_balance') {
            value = this.normalizeNormalBalance(value);
          }
          mappedRow[field.column] = value;

          if (field.required && !value) {
            this.validationErrors.push(`Row ${index + 2}: Missing required field "${field.field}"`);
            hasError = true;
          }
        } else if (field.required) {
          this.validationErrors.push(`Row ${index + 2}: Required field "${field.field}" not mapped`);
          hasError = true;
        }
      });

      if (!hasError && mappedRow.name && mappedRow.type) {
        this.validData.push(mappedRow);
      }
    });

    this.currentStep = 3;
  }

  private normalizeType(value: string): string {
    if (!value) return 'expense';
    const normalized = value.toLowerCase().trim();
    const validTypes = ['asset', 'liability', 'equity', 'income', 'expense'];
    return validTypes.includes(normalized) ? normalized : 'expense';
  }

  private normalizeStatus(value: string): string {
    if (!value) return 'active';
    const normalized = value.toLowerCase().trim();
    return ['active', 'inactive'].includes(normalized) ? normalized : 'active';
  }

  private normalizeNormalBalance(value: string): string {
    if (!value) return 'debit';
    const normalized = value.toLowerCase().trim();
    return ['debit', 'credit'].includes(normalized) ? normalized : 'debit';
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  async importAccounts() {
    if (this.validData.length === 0) return;
    
    this.isImporting = true;
    this.importProgress = 0;

    const promises = this.validData.map((row: any, index: number) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          this.api.createChartOfAccount({
            name: row.name,
            code: row.code || '',
            type: row.type,
            subtype: row.subtype || '',
            category: row.category || '',
            normal_balance: row.normal_balance || '',
            description: row.description || '',
            notes: row.notes || '',
            is_active: row.status === 'active'
          }).subscribe({
            next: () => resolve({ success: true, row: index + 2 }),
            error: () => resolve({ success: false, row: index + 2 })
          });
        }, index * 50);
      });
    });

    const results = await Promise.all(promises);
    const successCount = results.filter((r: any) => r.success).length;
    const failedCount = results.length - successCount;

    this.importProgress = 100;
    this.isImporting = false;
    this.importResult = { success: successCount, failed: failedCount };
  }

  close() {
    const event = new CustomEvent('closeImportModal', {
      bubbles: true,
      composed: true
    });
    document.dispatchEvent(event);
  }
}
