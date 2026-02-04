import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel,
  IonButton, IonInput, IonCard, IonCardContent, IonFab, IonFabButton, IonIcon,
  IonSelect, IonSelectOption, IonTextarea, IonButtons, IonBackButton, IonGrid,
  IonRow, IonCol, IonBadge, IonSearchbar, ToastController, LoadingController,
  AlertController, IonChip,
  IonMenuButton
} from '@ionic/angular/standalone';
import { Api } from '../services/api';
import { Auth } from '../services/auth';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { add, trash, create, close, arrowBack, closeCircle, filter } from 'ionicons/icons';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.page.html',
  styleUrls: ['./expenses.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, ReactiveFormsModule, FormsModule,
    IonList, IonItem, IonLabel, IonButton, IonInput, IonCard, IonCardContent,
    IonFab, IonFabButton, IonIcon, IonSelect, IonSelectOption, IonTextarea,
    IonButtons, IonBackButton,IonMenuButton, IonGrid, IonRow, IonCol, IonBadge, IonSearchbar, IonChip
  ]
})
export class ExpensesPage implements OnInit {
  expenses: any[] = [];
  currencies: any[] = [];
  expenseCategories: any[] = [];
  expenseForm!: FormGroup;
  customFields: { key: string, value: string }[] = [];
  isAdding = false;
  editingExpense: any = null;
  searchTerm = '';

  // Selection and bulk actions
  selectedExpenses: any[] = [];

  // Filtering and sorting
  categoryFilter = '';
  showCategoryFilter = true;
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalExpenses = 0;
  isAdmin = false;

  // Filters
  paidThroughFilter = '';
  dateFromFilter = '';
  dateToFilter = '';

  get totalPages(): number {
    return Math.ceil(this.totalExpenses / this.itemsPerPage);
  }

  paidThroughOptions = [
    { value: 'MOMO', label: 'MOMO' },
    { value: 'Chale Ecobank Account', label: 'Chale Ecobank Account' },
    { value: 'Cash', label: 'Cash' }
  ];

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router,
    private fb: FormBuilder,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {
    addIcons({ add,arrowBack, trash, create, close, closeCircle,filter });
    this.initForm();
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Load currencies and categories first before expenses
    this.loadCurrencies().then(() => {
      this.loadExpenseCategories().then(() => {
        this.loadExpenses();
      });
    });

    //get user info from local storage
    const user = this.auth.getUser();
    //check in user roles array if user has admin role
     const hasAdminRole = user && user.roles && user.roles.some((obj: { name: any; }) => obj.name === 'admin');
    if (hasAdminRole) {
      this.isAdmin = true;
    } else {
      this.isAdmin = false;
    }
  }

  initForm() {
    this.expenseForm = this.fb.group({
      category: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      currency_id: ['', Validators.required],
      expense_date: ['', Validators.required],
      description: [''],
      paid_through: ['', Validators.required]
    });
    this.customFields = [];
  }

  addCustomField() {
    this.customFields.push({ key: '', value: '' });
  }

  removeCustomField(index: number) {
    this.customFields.splice(index, 1);
  }

  async loadExpenses(): Promise<void> {
    const loading = await this.presentLoading('Loading expenses...');
    return new Promise((resolve, reject) => {
      this.api.getExpenses().subscribe({
        next: (data: any) => {
          this.expenses = data;
          this.totalExpenses = data.length;
          loading.dismiss();
          resolve();
        },
        error: async (error: any) => {
          loading.dismiss();
          await this.presentToast('Error loading expenses: ' + error.message, 'danger');
          reject(error);
        }
      });
    });
  }

  async loadCurrencies(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.api.getCurrencies().subscribe({
        next: (data: any) => {
          this.currencies = data;
          resolve();
        },
        error: async (error: any) => {
          await this.presentToast('Error loading currencies: ' + error.message, 'danger');
          reject(error);
        }
      });
    });
  }

  async loadExpenseCategories(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.api.getExpenseCategories().subscribe({
        next: (data: any) => {
          this.expenseCategories = data.data;
          resolve();
        },
        error: async (error: any) => {
          await this.presentToast('Error loading expense categories: ' + error.message, 'danger');
          reject(error);
        }
      });
    });
  }

  onCategoryChange(event: any) {
    if (event.detail.value === 'add-custom') {
      this.addCustomCategory();
      // Reset the selection
      setTimeout(() => {
        this.expenseForm.patchValue({ category: '' });
      }, 100);
    }
  }

  async addCustomCategory() {
    const alert = await this.alertController.create({
      header: 'Add Custom Category',
      inputs: [
        {
          name: 'categoryName',
          type: 'text',
          placeholder: 'Enter category name'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add',
          handler: async (data) => {
            if (data.categoryName && data.categoryName.trim()) {
              const loading = await this.presentLoading('Adding category...');
              this.api.createExpenseCategory({ name: data.categoryName.trim() }).subscribe({
                next: (newCategory: any) => {
                  loading.dismiss();
                  this.expenseCategories.push(newCategory);
                  this.expenseForm.patchValue({ category: newCategory.id });
                  this.presentToast('Category added successfully!', 'success');
                  this.loadExpenseCategories();
                },
                error: async (error: any) => {
                  loading.dismiss();
                  await this.presentToast('Error adding category: ' + error.message, 'danger');
                }
              });
            } else {
              this.presentToast('Please enter a category name', 'warning');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async editCategory(category: any) {
    const alert = await this.alertController.create({
      header: 'Edit Category',
      inputs: [
        {
          name: 'categoryName',
          type: 'text',
          value: category.name,
          placeholder: 'Enter category name'
        },
        {
          name: 'categoryColor',
          type: 'text',
          value: category.color,
          placeholder: 'Enter color hex code'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: async (data) => {
            if (data.categoryName && data.categoryName.trim()) {
              const loading = await this.presentLoading('Updating category...');
              this.api.updateExpenseCategory(category.id, { 
                name: data.categoryName.trim(),
                color: data.categoryColor || '#6c757d'
              }).subscribe({
                next: (updatedCategory: any) => {
                  loading.dismiss();
                  const index = this.expenseCategories.findIndex(c => c.id === category.id);
                  if (index !== -1) {
                    this.expenseCategories[index] = updatedCategory;
                  }
                  this.presentToast('Category updated successfully!', 'success');
                },
                error: async (error: any) => {
                  loading.dismiss();
                  await this.presentToast('Error updating category: ' + error.message, 'danger');
                }
              });
            } else {
              this.presentToast('Please enter a category name', 'warning');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteCategory(category: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete the category "${category.name}"? This will not delete associated expenses.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const loading = await this.presentLoading('Deleting category...');
            this.api.deleteExpenseCategory(category.id).subscribe({
              next: async () => {
                loading.dismiss();
                this.expenseCategories = this.expenseCategories.filter(c => c.id !== category.id);
                await this.presentToast('Category deleted successfully!', 'success');
              },
              error: async (error: any) => {
                loading.dismiss();
                await this.presentToast('Error deleting category: ' + error.message, 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async submitExpense() {
    if (this.expenseForm.valid) {
      const loading = await this.presentLoading('Creating expense...');
      
      // Convert custom fields array to object
      const customFieldsObj = this.customFields.reduce((obj: any, field) => {
        if (field.key && field.key.trim()) {
          obj[field.key] = field.value;
        }
        return obj;
      }, {});

      // Get category name from selected category ID
      const categoryId = this.expenseForm.value.category;
      const category = this.expenseCategories.find(c => c.id === categoryId);
      
      const expenseData = {
        category_id: categoryId,
        category: category ? category.name : '',
        amount: this.expenseForm.value.amount,
        currency_id: this.expenseForm.value.currency_id,
        expense_date: this.expenseForm.value.expense_date,
        description: this.expenseForm.value.description || '',
        paid_through: this.expenseForm.value.paid_through,
        custom_fields: Object.keys(customFieldsObj).length > 0 ? customFieldsObj : null
      };
      
      this.api.createExpense(expenseData).subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast('Expense created successfully!', 'success');
          this.loadExpenses();
          this.expenseForm.reset();
          this.initForm();
          this.isAdding = false;
        },
        error: async (error: any) => {
          loading.dismiss();
          await this.presentToast('Error creating expense: ' + error.message, 'danger');
        }
      });
    } else {
      await this.presentToast('Please fill all required fields', 'warning');
    }
  }

  editExpense(expense: any) {
    this.editingExpense = expense;

    // Format date for HTML date input (YYYY-MM-DD)
    let formattedDate = '';
    if (expense.expense_date) {
      const date = new Date(expense.expense_date);
      formattedDate = date.toISOString().split('T')[0];
    }

    // Wait for currencies and categories to be loaded before patching
    const patchForm = () => {
      this.expenseForm.patchValue({
        category: expense.category_id || expense.category,
        amount: expense.amount,
        currency_id: expense.currency_id,
        expense_date: formattedDate,
        description: expense.description,
        paid_through: expense.paid_through
      });
    };

    // Check if currencies and categories are loaded
    if (this.currencies.length > 0 && this.expenseCategories.length > 0) {
      patchForm();
    } else {
      // Wait for them to load
      const checkLoaded = setInterval(() => {
        if (this.currencies.length > 0 && this.expenseCategories.length > 0) {
          clearInterval(checkLoaded);
          patchForm();
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => clearInterval(checkLoaded), 5000);
    }

    // Load custom fields
    this.customFields = [];
    if (expense.custom_fields) {
      Object.keys(expense.custom_fields).forEach(key => {
        this.customFields.push({ key, value: expense.custom_fields[key] });
      });
    }
  }

  async updateExpense() {
    if (this.expenseForm.valid && this.editingExpense) {
      const loading = await this.presentLoading('Updating expense...');
      
      const customFieldsObj = this.customFields.reduce((obj: any, field) => {
        if (field.key && field.key.trim()) {
          obj[field.key] = field.value;
        }
        return obj;
      }, {});

      // Get category name from selected category ID
      const categoryId = this.expenseForm.value.category;
      const category = this.expenseCategories.find(c => c.id === categoryId);
      
      const expenseData = {
        category_id: categoryId,
        category: category ? category.name : '',
        amount: this.expenseForm.value.amount,
        currency_id: this.expenseForm.value.currency_id,
        expense_date: this.expenseForm.value.expense_date,
        description: this.expenseForm.value.description || '',
        paid_through: this.expenseForm.value.paid_through,
        custom_fields: Object.keys(customFieldsObj).length > 0 ? customFieldsObj : null
      };
      
      this.api.updateExpense(this.editingExpense.id, expenseData).subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast('Expense updated successfully!', 'success');
          this.loadExpenses();
          this.cancelEdit();
        },
        error: async (error: any) => {
          loading.dismiss();
          await this.presentToast('Error updating expense: ' + error.message, 'danger');
        }
      });
    }
  }

  async deleteExpense(expense: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this expense?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const loading = await this.presentLoading('Deleting expense...');
            this.api.deleteExpense(expense.id).subscribe({
              next: async () => {
                loading.dismiss();
                await this.presentToast('Expense deleted successfully!', 'success');
                this.loadExpenses();
              },
              error: async (error: any) => {
                loading.dismiss();
                await this.presentToast('Error deleting expense: ' + error.message, 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  cancelEdit() {
    this.editingExpense = null;
    this.expenseForm.reset();
    this.initForm();
  }

  cancelAdd() {
    this.isAdding = false;
    this.expenseForm.reset();
    this.initForm();
  }

  getFilteredExpenses() {
    let filtered = this.expenses;

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(expense => {
        const categoryName = expense.category?.name || expense.category || '';
        const description = expense.description || '';
        const paidThrough = expense.paid_through || '';
        return categoryName.toLowerCase().includes(searchLower) ||
               description.toLowerCase().includes(searchLower) ||
               paidThrough.toLowerCase().includes(searchLower);
      });
    }

    // Apply category filter
    if (this.categoryFilter) {
      filtered = filtered.filter(expense => expense.category_id === parseInt(this.categoryFilter));
    }

    // Apply paid through filter
    if (this.paidThroughFilter) {
      filtered = filtered.filter(expense => expense.paid_through === this.paidThroughFilter);
    }

    // Apply date range filter
    if (this.dateFromFilter) {
      const fromDate = new Date(this.dateFromFilter);
      filtered = filtered.filter(expense => new Date(expense.expense_date) >= fromDate);
    }

    if (this.dateToFilter) {
      const toDate = new Date(this.dateToFilter);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(expense => new Date(expense.expense_date) <= toDate);
    }

    // Apply sorting
    if (this.sortField) {
      filtered = [...filtered].sort((a: any, b: any) => {
        let aVal: any = a[this.sortField];
        let bVal: any = b[this.sortField];

        // Handle date sorting
        if (this.sortField === 'expense_date') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }

        // Compare
        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Update total count for pagination
    this.totalExpenses = filtered.length;

    return filtered;
  }

  // Selection methods
  isSelected(expense: any): boolean {
    return this.selectedExpenses.some(s => s.id === expense.id);
  }

  toggleSelect(expense: any, event: any) {
    if (event.detail.checked) {
      if (!this.isSelected(expense)) {
        this.selectedExpenses.push(expense);
      }
    } else {
      this.selectedExpenses = this.selectedExpenses.filter(s => s.id !== expense.id);
    }
  }

  toggleSelectAll(event: any) {
    if (event.detail.checked) {
      this.selectedExpenses = [...this.getFilteredExpenses()];
    } else {
      this.selectedExpenses = [];
    }
  }

  isAllSelected(): boolean {
    const filtered = this.getFilteredExpenses();
    return filtered.length > 0 && filtered.every(expense => this.isSelected(expense));
  }

  isSomeSelected(): boolean {
    return this.selectedExpenses.length > 0 && !this.isAllSelected();
  }

  clearSelection() {
    this.selectedExpenses = [];
  }

  // Sorting methods
  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
  }

  // Category filter methods
  toggleCategoryFilter() {
    this.showCategoryFilter = !this.showCategoryFilter;
  }

  setCategoryFilter(categoryId: string) {
    console.log(categoryId);
    this.categoryFilter = categoryId;
    this.showCategoryFilter = true;
    this.currentPage = 1; // Reset to first page when filtering
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || 
             this.categoryFilter || 
             this.paidThroughFilter || 
             this.dateFromFilter || 
             this.dateToFilter);
  }

  applyFilters() {
    this.currentPage = 1; // Reset to first page when applying filters
  }

  onSearch(event: any) {
    this.currentPage = 1; // Reset to first page when searching
  }

  clearFilters() {
    this.searchTerm = '';
    this.categoryFilter = '';
    this.paidThroughFilter = '';
    this.dateFromFilter = '';
    this.dateToFilter = '';
    this.currentPage = 1;
  }

  // Pagination methods
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  // Row click handler
  onRowClick(expense: any, event: Event) {
    // If clicking on checkbox, don't trigger row click
    if ((event.target as HTMLElement).tagName === 'ION-CHECKBOX') {
      return;
    }
    this.editExpense(expense);
  }

  // Bulk actions
  bulkEdit() {
    if (this.selectedExpenses.length === 1) {
      this.editExpense(this.selectedExpenses[0]);
      this.clearSelection();
    }
  }

  async bulkDelete() {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete ${this.selectedExpenses.length} expense(s)?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const loading = await this.presentLoading('Deleting expenses...');

            // Delete expenses one by one
            const deleteCalls = this.selectedExpenses.map(expense =>
              this.api.deleteExpense(expense.id)
            );

            forkJoin(deleteCalls).subscribe({
              next: async () => {
                loading.dismiss();
                await this.presentToast('Expenses deleted successfully!', 'success');
                this.loadExpenses();
                this.clearSelection();
              },
              error: async (error: any) => {
                loading.dismiss();
                await this.presentToast('Error deleting expenses: ' + error.message, 'danger');
                this.loadExpenses();
                this.clearSelection();
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  getCustomFieldsDisplay(customFields: any): string {
    if (!customFields) return '';
    return Object.keys(customFields).map(key => `${key}: ${customFields[key]}`).join(', ');
  }

  getCustomFieldKeys(customFields: any): string[] {
    if (!customFields) return [];
    return Object.keys(customFields);
  }

  async presentToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  async presentLoading(message: string) {
    const loading = await this.loadingController.create({
      message,
    });
    await loading.present();
    return loading;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
