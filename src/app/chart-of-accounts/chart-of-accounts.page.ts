import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel,
  IonButton, IonInput, IonCard, IonCardContent, IonButtons, IonBackButton,
  IonGrid, IonRow, IonCol, IonIcon, IonBadge, ToastController, LoadingController,
  AlertController, IonFab, IonFabButton, IonSelect, IonSelectOption, IonSearchbar,
  IonCheckbox, IonModal
} from '@ionic/angular/standalone';
import { Api } from '../services/api';
import { Auth } from '../services/auth';
import { addIcons } from 'ionicons';
import { add, trash, create, close, arrowBack, closeCircle, list, ellipsisVertical } from 'ionicons/icons';
import { ImportChartOfAccountsModalComponent } from './components/import-chart-of-accounts-modal.component';

@Component({
  selector: 'app-chart-of-accounts',
  templateUrl: './chart-of-accounts.page.html',
  styleUrls: ['./chart-of-accounts.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonList, IonItem, IonLabel, IonButton, IonInput, IonCard, IonCardContent,
    IonButtons, IonBackButton, IonGrid, IonRow, IonCol, IonIcon, IonBadge,
    IonFab, IonFabButton, IonSelect, IonSelectOption, IonSearchbar, IonCheckbox,
    IonModal,
    ImportChartOfAccountsModalComponent
  ]
})
export class ChartOfAccountsPage implements OnInit {
  accounts: any[] = [];
  filteredAccounts: any[] = [];
  isAdding = false;
  editingAccount: any = null;
  accountForm = {
    name: '',
    code: '',
    type: 'expense',
    subtype: '',
    description: ''
  };

  searchTerm = '';
  activeFilter: string = 'active';
  selectAll = false;
  isImportModalOpen = false;

  typeOptions = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' }
  ];

  subtypeOptions: any = {
    asset: [
      { value: 'cash', label: 'Cash' },
      { value: 'bank', label: 'Bank' },
      { value: 'accounts_receivable', label: 'Accounts Receivable' },
      { value: 'inventory', label: 'Inventory' },
      { value: 'fixed_asset', label: 'Fixed Asset' },
      { value: 'other', label: 'Other' }
    ],
    liability: [
      { value: 'accounts_payable', label: 'Accounts Payable' },
      { value: 'credit_card', label: 'Credit Card' },
      { value: 'loan', label: 'Loan' },
      { value: 'other', label: 'Other' }
    ],
    equity: [
      { value: 'capital', label: 'Capital' },
      { value: 'retained_earnings', label: 'Retained Earnings' },
      { value: 'drawings', label: 'Drawings' },
      { value: 'other', label: 'Other' }
    ],
    income: [
      { value: 'sales', label: 'Sales' },
      { value: 'service_income', label: 'Service Income' },
      { value: 'other_income', label: 'Other Income' },
      { value: 'other', label: 'Other' }
    ],
    expense: [
      { value: 'cost_of_goods_sold', label: 'Cost of Goods Sold' },
      { value: 'salary', label: 'Salary' },
      { value: 'rent', label: 'Rent' },
      { value: 'utilities', label: 'Utilities' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'other', label: 'Other' }
    ]
  };

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {
    addIcons({ add, arrowBack, trash, create, close, closeCircle, list, ellipsisVertical });
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadAccounts();

    const closeHandler = () => {
      this.isImportModalOpen = false;
      document.removeEventListener('closeImportModal', closeHandler);
    };
    document.addEventListener('closeImportModal', closeHandler);
  }

  async loadAccounts() {
    const loading = await this.presentLoading('Loading accounts...');
    this.api.getChartOfAccounts().subscribe({
      next: (response: any) => {
        this.accounts = (response.data || []).map((acc: any) => ({ ...acc, selected: false }));
        this.applyFilters();
        loading.dismiss();
      },
      error: async (error: any) => {
        loading.dismiss();
        await this.presentToast('Error loading accounts: ' + error.message, 'danger');
      }
    });
  }

  applyFilters() {
    let filtered = this.accounts;

    if (this.activeFilter === 'active') {
      filtered = filtered.filter((acc: any) => acc.is_active !== false);
    } else if (this.activeFilter === 'inactive') {
      filtered = filtered.filter((acc: any) => acc.is_active === false);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter((acc: any) =>
        (acc.name && acc.name.toLowerCase().includes(term)) ||
        (acc.code && acc.code.toLowerCase().includes(term)) ||
        (acc.subtype && acc.subtype.toLowerCase().includes(term))
      );
    }

    this.filteredAccounts = filtered;
    this.selectAll = false;
  }

  onSearch(event: any) {
    this.searchTerm = event.detail.value || '';
    this.applyFilters();
  }

  onActiveFilterChange() {
    this.applyFilters();
  }

  getSubtypeOptions() {
    const currentType = this.accountForm.type;
    return this.subtypeOptions[currentType] || [];
  }

  toggleAdd() {
    this.isAdding = !this.isAdding;
    if (!this.isAdding) {
      this.resetForm();
    }
  }

  editAccount(account: any) {
    this.editingAccount = account;
    this.accountForm = {
      name: account.name,
      code: account.code || '',
      type: account.type,
      subtype: account.subtype || '',
      description: account.description || ''
    };
  }

  cancelEdit() {
    this.editingAccount = null;
    this.resetForm();
  }

  resetForm() {
    this.accountForm = {
      name: '',
      code: '',
      type: 'expense',
      subtype: '',
      description: ''
    };
  }

  async saveAccount() {
    if (!this.accountForm.name.trim()) {
      await this.presentToast('Account name is required', 'warning');
      return;
    }

    const loading = await this.presentLoading(
      this.editingAccount ? 'Updating account...' : 'Creating account...'
    );

    if (this.editingAccount) {
      this.api.updateChartOfAccount(this.editingAccount.id, this.accountForm).subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast('Account updated successfully!', 'success');
          this.loadAccounts();
          this.cancelEdit();
        },
        error: async (error: any) => {
          loading.dismiss();
          await this.presentToast('Error updating account: ' + error.message, 'danger');
        }
      });
    } else {
      this.api.createChartOfAccount(this.accountForm).subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast('Account created successfully!', 'success');
          this.loadAccounts();
          this.resetForm();
          this.isAdding = false;
        },
        error: async (error: any) => {
          loading.dismiss();
          await this.presentToast('Error creating account: ' + error.message, 'danger');
        }
      });
    }
  }

  async updateAccountType(account: any) {
    const loading = await this.presentLoading('Updating account type...');
    this.api.updateChartOfAccount(account.id, { type: account.type }).subscribe({
      next: async () => {
        loading.dismiss();
        await this.presentToast('Account type updated!', 'success');
      },
      error: async (error: any) => {
        loading.dismiss();
        await this.presentToast('Error updating account type: ' + error.message, 'danger');
      }
    });
  }

  toggleSelectAll() {
    this.filteredAccounts.forEach(account => {
      account.selected = this.selectAll;
    });
  }

  onSelectChange() {
    this.selectAll = this.filteredAccounts.length > 0 && this.filteredAccounts.every(acc => acc.selected);
  }

  async openAccountActions(account: any) {
    const buttons = [
      {
        text: 'Edit',
        handler: () => {
          this.editAccount(account);
        }
      },
      {
        text: account.is_active ? 'Mark as Inactive' : 'Mark as Active',
        handler: () => {
          this.toggleAccountStatus(account);
        }
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => {
          this.deleteAccount(account);
        }
      }
    ];

    const alert = await this.alertController.create({
      header: 'Account Actions',
      buttons
    });

    await alert.present();
  }

  async openMoreActions() {
    const alert = await this.alertController.create({
      header: 'More Actions',
      buttons: [
        {
          text: 'Import Chart of Accounts',
          handler: () => {
            this.openImportModal();
          }
        },
        {
          text: 'Export Chart of Accounts',
          handler: () => {
            this.exportAccounts();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  openImportModal() {
    this.isImportModalOpen = true;
  }

  onImportModalDismiss(event: any) {
    this.isImportModalOpen = false;
  }

  async exportAccounts() {
    const loading = await this.presentLoading('Preparing export...');
    
    try {
      const blob = await this.api.exportChartOfAccounts().toPromise();
      if (!blob) {
        throw new Error('Export returned no data');
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chart-of-accounts-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      loading.dismiss();
      await this.presentToast('Export downloaded successfully!', 'success');
    } catch (error: any) {
      loading.dismiss();
      await this.presentToast('Error exporting accounts: ' + error.message, 'danger');
    }
  }

  async toggleAccountStatus(account: any) {
    const loading = await this.presentLoading('Updating account status...');
    this.api.toggleChartOfAccountActive(account.id).subscribe({
      next: async () => {
        loading.dismiss();
        account.is_active = !account.is_active;
        await this.presentToast('Account status updated!', 'success');
        this.applyFilters();
      },
      error: async (error: any) => {
        loading.dismiss();
        await this.presentToast('Error updating account status: ' + error.message, 'danger');
      }
    });
  }

  async deleteAccount(account: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete the account "${account.name}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const loading = await this.presentLoading('Deleting account...');
            this.api.deleteChartOfAccount(account.id).subscribe({
              next: async () => {
                loading.dismiss();
                await this.presentToast('Account deleted successfully!', 'success');
                this.loadAccounts();
              },
              error: async (error: any) => {
                loading.dismiss();
                await this.presentToast('Error deleting account: ' + error.message, 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  getTypeColor(type: string): string {
    const colors: any = {
      asset: 'primary',
      liability: 'warning',
      equity: 'success',
      income: 'tertiary',
      expense: 'danger'
    };
    return colors[type] || 'medium';
  }

  getTypeLabel(type: string): string {
    const labels: any = {
      asset: 'Asset',
      liability: 'Liability',
      equity: 'Equity',
      income: 'Income',
      expense: 'Expense'
    };
    return labels[type] || type;
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
    const loading = await this.loadingController.create({ message });
    await loading.present();
    return loading;
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
