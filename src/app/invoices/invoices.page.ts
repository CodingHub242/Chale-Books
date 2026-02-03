import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
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
import { add, trash, create, mail, document, close, eye, download, checkmark, cash, arrowBack } from 'ionicons/icons';

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.page.html',
  styleUrls: ['./invoices.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, ReactiveFormsModule, FormsModule,
    IonList, IonItem, IonLabel, IonButton, IonInput, IonCard, IonCardContent,
    IonFab, IonFabButton, IonIcon, IonSelect, IonSelectOption, IonTextarea,
    IonButtons, IonBackButton,IonMenuButton, IonGrid, IonRow, IonCol, IonBadge,
    IonSearchbar
  ]
})
export class InvoicesPage implements OnInit {
  invoices: any[] = [];
  clients: any[] = [];
  currencies: any[] = [];
  invoiceForm!: FormGroup;
  isAdding = false;
  editingInvoice: any = null;
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
    addIcons({ add, trash,arrowBack, create, mail, document, close, eye, download, checkmark, cash });
    this.initForm();
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadInvoices();
    this.loadClients();
    this.loadCurrencies();
  }

  initForm() {
    this.invoiceForm = this.fb.group({
      client_id: ['', Validators.required],
      currency_id: ['', Validators.required],
      due_date: ['', Validators.required],
      status: ['draft'],
      notes: [''],
      items: this.fb.array([this.createItem()])
    });
  }

  createItem(): FormGroup {
    return this.fb.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit_price: [0, [Validators.required, Validators.min(0)]],
      tax_rate: [0, [Validators.min(0), Validators.max(100)]],
      discount: [0, [Validators.min(0)]]
    });
  }

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  addItem() {
    this.items.push(this.createItem());
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  calculateItemTotal(item: any): number {
    const subtotal = (item.quantity || 0) * (item.unit_price || 0);
    const discount = item.discount || 0;
    const tax = (subtotal - discount) * ((item.tax_rate || 0) / 100);
    return subtotal - discount + tax;
  }

  calculateSubtotal(): number {
    return this.items.controls.reduce((total, item) => {
      return total + ((item.value.quantity || 0) * (item.value.unit_price || 0));
    }, 0);
  }

  calculateTotalDiscount(): number {
    return this.items.controls.reduce((total, item) => {
      return total + (item.value.discount || 0);
    }, 0);
  }

  calculateTotalTax(): number {
    return this.items.controls.reduce((total, item) => {
      const subtotal = (item.value.quantity || 0) * (item.value.unit_price || 0);
      const discount = item.value.discount || 0;
      const tax = (subtotal - discount) * ((item.value.tax_rate || 0) / 100);
      return total + tax;
    }, 0);
  }

  calculateGrandTotal(): number {
    const subtotal = this.calculateSubtotal();
    const discount = this.calculateTotalDiscount();
    const tax = this.calculateTotalTax();
    return subtotal - discount + tax;
  }

  async loadInvoices() {
    const loading = await this.presentLoading('Loading invoices...');
    this.api.getInvoices().subscribe({
      next: (data: any) => {
        this.invoices = data.invoices;
        loading.dismiss();
      },
      error: async (error: any) => {
        loading.dismiss();
        await this.presentToast('Error loading invoices: ' + error.message, 'danger');
      }
    });
  }

  async loadClients() {
    this.api.getClients().subscribe({
      next: (data: any) => {
        this.clients = data;
      },
      error: async (error: any) => {
        await this.presentToast('Error loading clients: ' + error.message, 'danger');
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

  async submitInvoice() {
    if (this.invoiceForm.valid) {
      const loading = await this.presentLoading('Creating invoice...');
      
      this.api.createInvoice(this.invoiceForm.value).subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast('Invoice created successfully!', 'success');
          this.loadInvoices();
          this.invoiceForm.reset();
          this.initForm();
          this.isAdding = false;
        },
        error: async (error: any) => {
          loading.dismiss();
          await this.presentToast('Error creating invoice: ' + error.message, 'danger');
        }
      });
    } else {
      await this.presentToast('Please fill all required fields', 'warning');
    }
  }

  editInvoice(invoice: any) {
    this.editingInvoice = invoice;
    
    this.invoiceForm.patchValue({
      client_id: invoice.client_id,
      currency_id: invoice.currency_id,
      due_date: invoice.due_date,
      status: invoice.status,
      notes: invoice.notes
    });

    while (this.items.length) {
      this.items.removeAt(0);
    }

    if (invoice.items && invoice.items.length > 0) {
      invoice.items.forEach((item: any) => {
        this.items.push(this.fb.group({
          description: [item.description, Validators.required],
          quantity: [item.quantity, [Validators.required, Validators.min(1)]],
          unit_price: [item.unit_price, [Validators.required, Validators.min(0)]],
          tax_rate: [item.tax_rate, [Validators.min(0), Validators.max(100)]],
          discount: [item.discount, [Validators.min(0)]]
        }));
      });
    } else {
      this.items.push(this.createItem());
    }
  }

  async updateInvoice() {
    if (this.invoiceForm.valid && this.editingInvoice) {
      const loading = await this.presentLoading('Updating invoice...');
      
      this.api.updateInvoice(this.editingInvoice.id, this.invoiceForm.value).subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast('Invoice updated successfully!', 'success');
          this.loadInvoices();
          this.cancelEdit();
        },
        error: async (error: any) => {
          loading.dismiss();
          await this.presentToast('Error updating invoice: ' + error.message, 'danger');
        }
      });
    }
  }

  async deleteInvoice(invoice: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this invoice?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const loading = await this.presentLoading('Deleting invoice...');
            this.api.deleteInvoice(invoice.id).subscribe({
              next: async () => {
                loading.dismiss();
                await this.presentToast('Invoice deleted successfully!', 'success');
                this.loadInvoices();
              },
              error: async (error: any) => {
                loading.dismiss();
                await this.presentToast('Error deleting invoice: ' + error.message, 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async sendInvoice(invoice: any) {
    const loading = await this.presentLoading('Sending invoice...');
    this.api.sendInvoice(invoice.id).subscribe({
      next: async () => {
        loading.dismiss();
        await this.presentToast('Invoice sent successfully!', 'success');
        this.loadInvoices();
      },
      error: async (error: any) => {
        loading.dismiss();
        await this.presentToast('Error sending invoice: ' + error.message, 'danger');
      }
    });
  }

  async previewPdf(invoice: any) {
    this.router.navigate(['/invoice-preview', invoice.id]);
  }

  async downloadPdf(invoice: any) {
    const loading = await this.presentLoading('Downloading PDF...');
    this.api.downloadInvoicePdf(invoice.id).subscribe({
      next: (blob: Blob) => {
        loading.dismiss();
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoice.invoice_number}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.presentToast('PDF downloaded successfully!', 'success');
      },
      error: async (error: any) => {
        loading.dismiss();
        await this.presentToast('Error downloading PDF: ' + error.message, 'danger');
      }
    });
  }



  cancelEdit() {
    this.editingInvoice = null;
    this.invoiceForm.reset();
    this.initForm();
  }

  cancelAdd() {
    this.isAdding = false;
    this.invoiceForm.reset();
    this.initForm();
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'draft': 'medium',
      'unpaid': 'warning',
      'paid': 'success',
      'overdue': 'danger',
      'partial': 'primary'
    };
    return colors[status] || 'medium';
  }

  getFilteredInvoices() {
    if (!this.searchTerm) {
      return this.invoices;
    }
    return this.invoices.filter(invoice => 
      invoice.client?.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      invoice.invoice_number?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      invoice.status.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
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
