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
import { ExpenseImportService, ParsedRow, ImportResult } from '../../services/expense-import.service';
import { Api } from '../../services/api';

@Component({
  selector: 'app-import-expenses-modal',
  templateUrl: './import-expenses-modal.component.html',
  styleUrls: ['./import-expenses-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,
    IonIcon, IonSelect, IonSelectOption, IonChip, IonSpinner
  ]
})
export class ImportExpensesModalComponent implements OnInit {
  currentStep = 1;
  selectedFile: File | null = null;
  fileHeaders: string[] = [];
  parsedRows: ParsedRow[] = [];
  columnMapping: { [key: string]: string } = {};
  previewData: ParsedRow[] = [];
  
  validData: ParsedRow[] = [];
  validationErrors: string[] = [];
  isImporting = false;
  importProgress = 0;
  importResult: { success: number; failed: number } | null = null;
  
  isDragOver = false;
  
  availableFields = [
    { field: 'Date', column: 'expense_date', required: true },
    { field: 'Amount', column: 'amount', required: true },
    { field: 'Category', column: 'category', required: false },
    { field: 'Description', column: 'description', required: false },
    { field: 'Paid Through', column: 'paid_through', required: true },
    { field: 'Currency', column: 'currency_id', required: false },
  ];

  // Dynamic custom fields that user can add
  customMappingFields: { field: string, column: string, required: boolean }[] = [];

  // Get all fields (base + custom)
  get allFields() {
    return [...this.availableFields, ...this.customMappingFields];
  }

  addCustomField() {
    this.customMappingFields.push({ 
      field: `Custom Field ${this.customMappingFields.length + 1}`, 
      column: `custom_field_${Date.now()}`,
      required: false 
    });
  }

  removeCustomField(index: number) {
    const field = this.customMappingFields[index];
    // Remove any mapping for this field
    const mappedCol = Object.keys(this.columnMapping).find(key => 
      this.columnMapping[key] === field.column
    );
    if (mappedCol) {
      delete this.columnMapping[mappedCol];
    }
    this.customMappingFields.splice(index, 1);
  }

  updateCustomFieldName(index: number, event: any) {
    const input = event.target as HTMLInputElement;
    this.customMappingFields[index].field = input.value || `Custom Field ${index + 1}`;
    this.customMappingFields[index].column = input.value?.toLowerCase().replace(/\s+/g, '_') || `custom_field_${index}`;
  }

  // Paid through options from parent
  paidThroughOptions = [
    { value: 'MOMO', label: 'MOMO' },
    { value: 'Chale Ecobank Account', label: 'Chale Ecobank Account' },
    { value: 'Cash', label: 'Cash' }
  ];

  constructor(
    private importService: ExpenseImportService,
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

  // Step 1: File Selection
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
    this.importService.downloadTemplate();
  }

  async parseFile() {
    if (!this.selectedFile) return;

    try {
      const result = await this.importService.parseFile(this.selectedFile);
      this.fileHeaders = result.headers;
      this.parsedRows = result.rows;
      this.previewData = result.rows;

      // Auto-map columns
      this.columnMapping = this.importService.autoMapColumns(this.fileHeaders);
      
      this.currentStep = 2;
    } catch (error: any) {
      console.error('Error parsing file:', error);
      this.showError(error.message || 'Failed to parse file');
    }
  }

  // Step 2: Column Mapping
  getColumnMapping(fieldColumn: string): string {
    return Object.keys(this.columnMapping).find(
      key => this.columnMapping[key] === fieldColumn
    ) || '';
  }

  onColumnChange(fieldColumn: string, event: any) {
    const selectedColumn = event.detail.value;
    
    // Remove old mapping for this field
    const oldMapping = Object.keys(this.columnMapping).find(
      key => this.columnMapping[key] === fieldColumn
    );
    if (oldMapping) {
      delete this.columnMapping[oldMapping];
    }
    
    // Add new mapping
    if (selectedColumn) {
      this.columnMapping[selectedColumn] = fieldColumn;
    }
  }

  getPreviewValue(row: ParsedRow, fieldColumn: string): string {
    const mappedColumn = this.getColumnMapping(fieldColumn);
    if (!mappedColumn) return '-';
    
    const value = row[mappedColumn];
    return value !== undefined && value !== null ? String(value) : '-';
  }

  isMappingValid(): boolean {
    // Check required fields are mapped
    const requiredFields = this.availableFields.filter(f => f.required);
    const mappedRequired = requiredFields.filter(f => 
      Object.values(this.columnMapping).includes(f.column)
    );
    
    return mappedRequired.length === requiredFields.length;
  }

  validateData() {
    const result: ImportResult = this.importService.transformData(
      this.parsedRows, 
      this.columnMapping
    );
    
    this.validData = result.data;
    this.validationErrors = result.errors;
    
    this.currentStep = 3;
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Step 3: Import
  async importExpenses() {
    if (this.validData.length === 0) return;
    
    this.isImporting = true;
    this.importProgress = 0;
    
    // Prepare expenses data - include any extra fields in custom_fields
    const expensesData = this.validData.map(row => {
      // Separate standard fields from custom fields
      const standardFields = ['expense_date', 'amount', 'category', 'description', 'paid_through', 'currency_id'];
      const customFieldsData: { [key: string]: any } = {};
      
      // Extract custom fields
      Object.keys(row).forEach(key => {
        if (!standardFields.includes(key) && row[key]) {
          customFieldsData[key] = row[key];
        }
      });
      
      return {
        expense_date: row['expense_date'],
        amount: row['amount'],
        category: row['category'] || 'Uncategorized',
        description: row['description'] || '',
        paid_through: row['paid_through'],
        currency_id: row['currency_id'] || 1,
        custom_fields: Object.keys(customFieldsData).length > 0 ? customFieldsData : null
      };
    });
    
    // Use bulk import API for better performance
    this.api.importExpenses(expensesData).subscribe({
      next: (result: any) => {
        this.isImporting = false;
        this.importResult = { 
          success: result.success_count || this.validData.length, 
          failed: result.failed_count || 0 
        };
        this.dispatchImportComplete(this.importResult.success, this.importResult.failed);
      },
      error: (error: any) => {
        this.isImporting = false;
        console.error('Import failed:', error);
        this.importResult = { 
          success: 0, 
          failed: this.validData.length 
        };
        this.dispatchImportComplete(0, this.validData.length);
      }
    });
  }

  private dispatchImportComplete(success: number, failed: number) {
    // Create and dispatch a custom event that the parent can listen to
    const event = new CustomEvent('importComplete', {
      detail: { success, failed, total: this.validData.length },
      bubbles: true,
      composed: true
    });
    document.dispatchEvent(event);
  }

  private importSingleExpense(expense: ParsedRow): Promise<void> {
    return new Promise((resolve, reject) => {
      // Find or create category
      const categoryName = expense['category'] || 'Uncategorized';
      
      // Determine currency - default to GHS
      const currencyId = this.resolveCurrency(expense['currency_id']);
      
      // Determine paid through - default to Cash
      const paidThrough = expense['paid_through'] || 'Cash';
      
      const expenseData = {
        category: categoryName,
        amount: expense['amount'],
        currency_id: currencyId,
        expense_date: expense['expense_date'],
        description: expense['description'] || '',
        paid_through: paidThrough,
        custom_fields: expense['notes'] ? { notes: expense['notes'] } : null
      };
      
      this.api.createExpense(expenseData).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  private resolveCurrency(currencyCode: any): number {
    // Default to GHS (currency ID 1) if not specified
    if (!currencyCode) return 1;
    
    // Could implement currency lookup here
    // For now, return default
    return 1;
  }

  getRequiredFieldsCount(): number {
    const requiredFields = this.availableFields.filter(f => f.required);
    const mappedRequired = requiredFields.filter(f => 
      Object.values(this.columnMapping).includes(f.column)
    );
    return mappedRequired.length;
  }

  getRequiredFieldsTotal(): number {
    return this.availableFields.filter(f => f.required).length;
  }

  showError(message: string) {
    console.error(message);
  }

  close() {
    // Emit event to parent to close the modal
    const event = new CustomEvent('closeImportModal', {
      bubbles: true,
      composed: true
    });
    document.dispatchEvent(event);
  }
}