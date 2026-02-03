import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, 
  IonButton, IonInput, IonCard, IonCardContent, IonFab, IonFabButton, IonIcon, 
  IonSelect, IonSelectOption, IonTextarea, IonButtons, IonBackButton, IonGrid,
  IonRow, IonCol, IonBadge, IonSearchbar, ToastController, LoadingController,
  AlertController,
  IonMenuButton
} from '@ionic/angular/standalone';
import { Api } from '../services/api';
import { Auth } from '../services/auth';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { add, trash, create, close, arrowBack } from 'ionicons/icons';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.page.html',
  styleUrls: ['./expenses.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, ReactiveFormsModule, FormsModule,
    IonList, IonItem, IonLabel, IonButton, IonInput, IonCard, IonCardContent, 
    IonFab, IonFabButton, IonIcon, IonSelect, IonSelectOption, IonTextarea,
    IonButtons, IonBackButton,IonMenuButton, IonGrid, IonRow, IonCol, IonBadge, IonSearchbar
  ]
})
export class ExpensesPage implements OnInit {
  expenses: any[] = [];
  currencies: any[] = [];
  expenseForm!: FormGroup;
  customFields: { key: string, value: string }[] = [];
  isAdding = false;
  editingExpense: any = null;
  searchTerm = '';

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router,
    private fb: FormBuilder,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {
    addIcons({ add,arrowBack, trash, create, close });
    this.initForm();
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadExpenses();
    this.loadCurrencies();
  }

  initForm() {
    this.expenseForm = this.fb.group({
      category: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      currency_id: ['', Validators.required],
      expense_date: ['', Validators.required],
      description: ['']
    });
    this.customFields = [];
  }

  addCustomField() {
    this.customFields.push({ key: '', value: '' });
  }

  removeCustomField(index: number) {
    this.customFields.splice(index, 1);
  }

  async loadExpenses() {
    const loading = await this.presentLoading('Loading expenses...');
    this.api.getExpenses().subscribe({
      next: (data: any) => {
        this.expenses = data;
        loading.dismiss();
      },
      error: async (error: any) => {
        loading.dismiss();
        await this.presentToast('Error loading expenses: ' + error.message, 'danger');
      }
    });
  }

  async loadCurrencies() {
    this.api.getCurrencies().subscribe({
      next: (data: any) => {
        this.currencies = data;
      },
      error: async (error: any) => {
        await this.presentToast('Error loading currencies: ' + error.message, 'danger');
      }
    });
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

      const expenseData = {
        ...this.expenseForm.value,
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
    
    this.expenseForm.patchValue({
      category: expense.category,
      amount: expense.amount,
      currency_id: expense.currency_id,
      expense_date: expense.expense_date,
      description: expense.description
    });

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

      const expenseData = {
        ...this.expenseForm.value,
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
    if (!this.searchTerm) {
      return this.expenses;
    }
    return this.expenses.filter(expense => 
      expense.category.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
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

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
