import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel,
  IonButton, IonInput, IonCard, IonCardContent, IonFab, IonFabButton, IonIcon,
  IonSelect, IonSelectOption, IonTextarea, IonButtons, IonBackButton, IonGrid,
  IonRow, IonCol, IonBadge, IonModal, IonSearchbar, ToastController, LoadingController,
  AlertController,
  IonMenuButton
} from '@ionic/angular/standalone';
import {Location} from '@angular/common';
import { Api } from '../services/api';
import { Auth } from '../services/auth';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { add, trash, create, mail, document, close, eye, download, checkmark, arrowBack } from 'ionicons/icons';

@Component({
  selector: 'app-quotes',
  templateUrl: './quotes.page.html',
  styleUrls: ['./quotes.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, ReactiveFormsModule, FormsModule,
    IonList, IonItem, IonLabel, IonButton, IonInput, IonCard, IonCardContent,
    IonFab, IonFabButton, IonIcon, IonSelect, IonSelectOption, IonTextarea,
    IonButtons, IonBackButton,IonMenuButton, IonGrid, IonRow, IonCol, IonBadge, IonModal,
    IonSearchbar
  ]
})
export class QuotesPage implements OnInit {
  quotes: any[] = [];
  clients: any[] = [];
  currencies: any[] = [];
  availableItems: any[] = [];
  quoteForm!: FormGroup;
  isAdding = false;
  editingQuote: any = null;
  searchTerm = '';

  // Pagination properties
  currentPage = 1;
  perPage = 10;
  totalPages = 1;
  totalQuotes = 0;
  isLoading = false;

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router,
    private fb: FormBuilder,
    private _location: Location,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {
    addIcons({ add,arrowBack, trash, create, mail, document, close, eye, download, checkmark });
    this.initForm();
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadQuotes();
    this.loadClients();
    this.loadCurrencies();
    this.loadItems();

    // Check if template was passed from quote-templates page
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['template']) {
      const template = navigation.extras.state['template'];
      this.applyTemplate(template);
    }
  }

  initForm() {
    this.quoteForm = this.fb.group({
      client_id: ['', Validators.required],
      currency_id: ['', Validators.required],
      expiry_date: ['', Validators.required],
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
    return this.quoteForm.get('items') as FormArray;
  }

  addItem() {
    this.items.push(this.createItem());
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  selectItem(item: any, index: number) {
    const itemForm = this.items.at(index);
    itemForm.patchValue({
      description: item.name,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      discount: item.discount
    });
  }

  applyTemplate(template: any) {
    // Set currency from template
    this.quoteForm.patchValue({
      currency_id: template.currency_id,
      notes: template.notes
    });

    // Clear existing items
    while (this.items.length > 0) {
      this.items.removeAt(0);
    }

    // Add template items
    template.items.forEach((item: any) => {
      this.items.push(this.fb.group({
        description: [item.description, Validators.required],
        quantity: [item.quantity, [Validators.required, Validators.min(1)]],
        unit_price: [item.unit_price, [Validators.required, Validators.min(0)]],
        tax_rate: [item.tax_rate || 0, [Validators.min(0), Validators.max(100)]],
        discount: [item.discount || 0, [Validators.min(0)]]
      }));
    });

    // Switch to add mode
    this.isAdding = true;
    this.presentToast('Template applied! Please select a client and expiry date.', 'success');
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

  async loadQuotes(page: number = 1) {
    this.isLoading = true;
    const loading = await this.presentLoading('Loading quotes...');

    this.api.getQuotes(page, this.perPage, this.searchTerm || undefined).subscribe({
      next: (response: any) => {
        // Assuming the API returns paginated data with data, current_page, last_page, total
        this.quotes = response.data || response;
        this.currentPage = response.current_page || page;
        this.totalPages = response.last_page || 1;
        this.totalQuotes = response.total || this.quotes.length;

        loading.dismiss();
        this.isLoading = false;
      },
      error: async (error) => {
        loading.dismiss();
        this.isLoading = false;
        await this.presentToast('Error loading quotes: ' + error.message, 'danger');
      }
    });
  }

  async loadClients() {
    this.api.getClients().subscribe({
      next: (data: any) => {
        this.clients = data;
      },
      error: async (error) => {
        await this.presentToast('Error loading clients: ' + error.message, 'danger');
      }
    });
  }

  async loadCurrencies() {
    this.api.getCurrencies().subscribe({
      next: (data: any) => {
        this.currencies = data;
      },
      error: async (error) => {
        await this.presentToast('Error loading currencies: ' + error.message, 'danger');
      }
    });
  }

  async loadItems() {
    this.api.getItems().subscribe({
      next: (data: any) => {
        this.availableItems = data;
      },
      error: async (error) => {
        await this.presentToast('Error loading items: ' + error.message, 'danger');
      }
    });
  }

  async submitQuote() {
    if (this.quoteForm.valid) {
      const loading = await this.presentLoading('Creating quote...');

      this.api.createQuote(this.quoteForm.value).subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast('Quote created successfully!', 'success');
          this.loadQuotes();
          this.quoteForm.reset();
          this.initForm();
          this.isAdding = false;
        },
        error: async (error) => {
          loading.dismiss();
          const errorMessage = error.error?.message || error.error?.error || error.message || 'Unknown error';
          await this.presentToast('Error creating quote: ' + errorMessage, 'danger');
        }
      });
    } else {
      await this.presentToast('Please fill all required fields', 'warning');
    }
  }

  editQuote(quote: any) {
    this.editingQuote = quote;

    // Populate form with quote data
    this.quoteForm.patchValue({
      client_id: quote.client_id,
      currency_id: quote.currency_id,
      expiry_date: quote.expiry_date,
      status: quote.status,
      notes: quote.notes
    });

    // Clear existing items
    while (this.items.length) {
      this.items.removeAt(0);
    }

    // Add quote items or create one empty item
    if (quote.items && quote.items.length > 0) {
      quote.items.forEach((item: any) => {
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

  async updateQuote() {
    if (this.quoteForm.valid && this.editingQuote) {
      const loading = await this.presentLoading('Updating quote...');

      this.api.updateQuote(this.editingQuote.id, this.quoteForm.value).subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast('Quote updated successfully!', 'success');
          this.loadQuotes();
          this.cancelEdit();
        },
        error: async (error) => {
          loading.dismiss();
          await this.presentToast('Error updating quote: ' + error.message, 'danger');
        }
      });
    }
  }

  async deleteQuote(quote: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this quote?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const loading = await this.presentLoading('Deleting quote...');
            this.api.deleteQuote(quote.id).subscribe({
              next: async () => {
                loading.dismiss();
                await this.presentToast('Quote deleted successfully!', 'success');
                this.loadQuotes();
              },
              error: async (error) => {
                loading.dismiss();
                await this.presentToast('Error deleting quote: ' + error.message, 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async sendQuote(quote: any) {
    const loading = await this.presentLoading('Sending quote...');
    this.api.sendQuote(quote.id).subscribe({
      next: async () => {
        loading.dismiss();
        await this.presentToast('Quote sent successfully!', 'success');
        this.loadQuotes();
      },
      error: async (error) => {
        loading.dismiss();
        await this.presentToast('Error sending quote: ' + error.message, 'danger');
      }
    });
  }

  async convertToInvoice(quote: any) {
    const loading = await this.presentLoading('Converting to invoice...');
    this.api.convertQuoteToInvoice(quote.id).subscribe({
      next: async () => {
        loading.dismiss();
        await this.presentToast('Quote converted to invoice!', 'success');
        this.loadQuotes();
        this.router.navigate(['/invoices']);
      },
      error: async (error) => {
        loading.dismiss();
        await this.presentToast('Error converting quote: ' + error.message, 'danger');
      }
    });
  }

  async previewPdf(quote: any) {
    this.router.navigate(['/quote-preview', quote.id]);
  }

  async downloadPdf(quote: any) {
    const loading = await this.presentLoading('Downloading PDF...');
    this.api.downloadQuotePdf(quote.id).subscribe({
      next: (blob: Blob) => {
        loading.dismiss();
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = `quote-${quote.id}.pdf`;
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
    this.editingQuote = null;
    this.quoteForm.reset();
    this.initForm();
  }

  cancelAdd() {
    this.isAdding = false;
    this.quoteForm.reset();
    this.initForm();
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'draft': 'medium',
      'sent': 'primary',
      'accepted': 'success',
      'rejected': 'danger',
      'converted': 'warning'
    };
    return colors[status] || 'medium';
  }

  formatExpiryDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    // Check if the date has expired
    if (date < today) {
      return 'Expired';
    }

    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();

    // Add ordinal suffix to day
    const getOrdinalSuffix = (day: number): string => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadQuotes(page);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  onSearchChange() {
    // Reset to first page when searching
    this.currentPage = 1;
    this.loadQuotes(1);
  }

  getFilteredQuotes() {
    // Since search is now server-side, just return current page data
    return this.quotes;
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
