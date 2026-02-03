import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel,
  IonButton, IonInput, IonCard, IonCardContent, IonFab, IonFabButton, IonIcon,
  IonSelect, IonSelectOption, IonTextarea, IonButtons, IonBackButton, IonGrid,
  IonRow, IonCol, IonBadge, IonModal, IonSearchbar, ToastController, LoadingController,
  AlertController,
  IonMenuButton,
  IonCardHeader,
  IonCardTitle
} from '@ionic/angular/standalone';
import { Api } from '../services/api';
import { Auth } from '../services/auth';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { add, trash, create, checkmark, arrowBack } from 'ionicons/icons';

@Component({
  selector: 'app-items',
  templateUrl: './items.page.html',
  styleUrls: ['./items.page.scss'],
  standalone: true,
  imports: [
    IonContent,IonCardHeader,IonCardTitle, IonHeader, IonTitle, IonToolbar, CommonModule, ReactiveFormsModule, FormsModule,
    IonList, IonItem, IonLabel, IonButton, IonInput, IonCard, IonCardContent,
    IonFab, IonFabButton, IonIcon, IonSelect, IonSelectOption, IonTextarea,
    IonButtons, IonBackButton,IonMenuButton, IonGrid, IonRow, IonCol, IonBadge, IonModal,
    IonSearchbar
  ]
})
export class ItemsPage implements OnInit {
  items: any[] = [];
  itemForm!: FormGroup;
  isAdding = false;
  editingItem: any = null;
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
    addIcons({ add, trash, create, checkmark,arrowBack });
    this.initForm();
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadItems();
  }

  initForm() {
    this.itemForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      unit_price: ['', [Validators.required, Validators.min(0)]],
      tax_rate: ['', [Validators.min(0), Validators.max(100)]],
      discount: ['', [Validators.min(0)]]
    });
  }

  async loadItems() {
    const loading = await this.presentLoading('Loading items...');
    this.api.getItems().subscribe({
      next: (data: any) => {
        this.items = data;
        loading.dismiss();
      },
      error: async (error: any) => {
        loading.dismiss();
        await this.presentToast('Error loading items: ' + error.message, 'danger');
      }
    });
  }

  async createItem() {
    if (this.itemForm.valid) {
      const loading = await this.presentLoading('Creating item...');
      this.api.createItem(this.itemForm.value).subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast('Item created successfully!', 'success');
          this.loadItems();
          this.cancelAdd();
        },
        error: async (error: any) => {
          loading.dismiss();
          await this.presentToast('Error creating item: ' + error.message, 'danger');
        }
      });
    } else {
      await this.presentToast('Please fill all required fields', 'warning');
    }
  }

  async updateItem() {
    if (this.itemForm.valid && this.editingItem) {
      const loading = await this.presentLoading('Updating item...');
      this.api.updateItem(this.editingItem.id, this.itemForm.value).subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast('Item updated successfully!', 'success');
          this.loadItems();
          this.cancelEdit();
        },
        error: async (error: any) => {
          loading.dismiss();
          await this.presentToast('Error updating item: ' + error.message, 'danger');
        }
      });
    } else {
      await this.presentToast('Please fill all required fields', 'warning');
    }
  }

  async deleteItem(item: any) {
    const alert = await this.alertController.create({
      header: 'Delete Item',
      message: `Are you sure you want to delete "${item.name}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const loading = await this.presentLoading('Deleting item...');
            this.api.deleteItem(item.id).subscribe({
              next: async () => {
                loading.dismiss();
                await this.presentToast('Item deleted successfully!', 'success');
                this.loadItems();
              },
              error: async (error: any) => {
                loading.dismiss();
                await this.presentToast('Error deleting item: ' + error.message, 'danger');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  editItem(item: any) {
    this.editingItem = item;
    this.itemForm.patchValue({
      name: item.name,
      description: item.description,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      discount: item.discount
    });
  }

  cancelEdit() {
    this.editingItem = null;
    this.itemForm.reset();
    this.initForm();
  }

  cancelAdd() {
    this.isAdding = false;
    this.itemForm.reset();
    this.initForm();
  }

  getFilteredItems() {
    if (!this.searchTerm) {
      return this.items;
    }
    return this.items.filter(item =>
      item.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(this.searchTerm.toLowerCase()))
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
