import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  IonContent,IonCardTitle,IonCardHeader, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel,
  IonButton, IonInput, IonCard, IonCardContent, IonFab, IonFabButton, IonIcon,
  IonSelect, IonSelectOption, IonTextarea, IonButtons, IonBackButton, IonGrid,
  IonRow, IonCol, IonBadge, IonModal, IonSearchbar, ToastController, LoadingController,
  AlertController,
  IonMenuButton
} from '@ionic/angular/standalone';
import { Api } from '../services/api';
import { Auth } from '../services/auth';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { add, trash, create, mail, document, close, eye, download, checkmark, arrowBack } from 'ionicons/icons';

@Component({
  selector: 'app-quote-templates',
  templateUrl: './quote-templates.page.html',
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  styleUrls: ['./quote-templates.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonCardTitle,IonCardHeader, IonHeader, IonTitle, IonToolbar, CommonModule, ReactiveFormsModule, FormsModule,
    IonList, IonItem, IonLabel, IonButton, IonInput, IonCard, IonCardContent,
    IonFab, IonFabButton, IonIcon, IonSelect, IonSelectOption, IonTextarea,
    IonButtons, IonBackButton,IonMenuButton, IonGrid, IonRow, IonCol, IonBadge, IonModal,
    IonSearchbar
  ]
})
export class QuoteTemplatesPage implements OnInit {
  quoteTemplates: any[] = [];
  currencies: any[] = [];
  availableItems: any[] = [];
  templateForm!: FormGroup;
  isAdding = false;
  editingTemplate: any = null;
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
    addIcons({ add, trash, create, mail, document, close, eye, download, checkmark,arrowBack });
    this.initForm();
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadQuoteTemplates();
    this.loadCurrencies();
    this.loadItems();
  }

  initForm() {
    this.templateForm = this.fb.group({
      name: ['', Validators.required],
      currency_id: ['', Validators.required],
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
    return this.templateForm.get('items') as FormArray;
  }

  addItem() {
    this.items.push(this.createItem());
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  async loadQuoteTemplates() {
    const loading = await this.presentLoading('Loading templates...');
    this.api.getQuoteTemplates().subscribe({
      next: (data: any) => {
        this.quoteTemplates = data;
        loading.dismiss();
      },
      error: async (error: any) => {
        loading.dismiss();
        await this.presentToast('Error loading templates: ' + error.message, 'danger');
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

  async loadItems() {
    this.api.getItems().subscribe({
      next: (data: any) => {
        this.availableItems = data;
      },
      error: async (error: any) => {
        await this.presentToast('Error loading items: ' + error.message, 'danger');
      }
    });
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

  async saveTemplate() {
    if (this.templateForm.valid) {
      const loading = await this.presentLoading('Saving template...');

      const templateData = this.templateForm.value;

      const request = this.editingTemplate
        ? this.api.updateQuoteTemplate(this.editingTemplate.id, templateData)
        : this.api.createQuoteTemplate(templateData);

      request.subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast(`Template ${this.editingTemplate ? 'updated' : 'created'} successfully!`, 'success');
          this.loadQuoteTemplates();
          this.cancelEdit();
        },
        error: async (error: any) => {
          loading.dismiss();
          await this.presentToast('Error saving template: ' + error.message, 'danger');
        }
      });
    } else {
      await this.presentToast('Please fill all required fields', 'warning');
    }
  }

  editTemplate(template: any) {
    this.editingTemplate = template;
    this.templateForm.patchValue({
      name: template.name,
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

    this.isAdding = true;
  }

  async deleteTemplate(template: any) {
    const alert = await this.alertController.create({
      header: 'Delete Template',
      message: `Are you sure you want to delete "${template.name}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const loading = await this.presentLoading('Deleting template...');
            this.api.deleteQuoteTemplate(template.id).subscribe({
              next: async () => {
                loading.dismiss();
                await this.presentToast('Template deleted successfully!', 'success');
                this.loadQuoteTemplates();
              },
              error: async (error: any) => {
                loading.dismiss();
                await this.presentToast('Error deleting template: ' + error.message, 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  useTemplate(template: any) {
    // Navigate to quotes page with template data
    this.router.navigate(['/quotes'], { state: { template: template } });
  }

  cancelEdit() {
    this.editingTemplate = null;
    this.templateForm.reset();
    this.initForm();
    this.isAdding = false;
  }

  cancelAdd() {
    this.isAdding = false;
    this.templateForm.reset();
    this.initForm();
  }

  getFilteredTemplates() {
    if (!this.searchTerm) {
      return this.quoteTemplates;
    }
    return this.quoteTemplates.filter(template =>
      template.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
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
    return this.calculateSubtotal() - this.calculateTotalDiscount() + this.calculateTotalTax();
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
