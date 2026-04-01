import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel,
  IonButton, IonInput, IonCard, IonCardContent, IonButtons, IonBackButton,
  IonGrid, IonRow, IonCol, IonIcon, IonBadge, ToastController, LoadingController,
  AlertController, IonFab, IonFabButton, IonChip
} from '@ionic/angular/standalone';
import { Api } from '../services/api';
import { Auth } from '../services/auth';
import { addIcons } from 'ionicons';
import { add, trash, create, close, arrowBack, closeCircle } from 'ionicons/icons';

@Component({
  selector: 'app-expense-categories',
  templateUrl: './expense-categories.page.html',
  styleUrls: ['./expense-categories.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonList, IonItem, IonLabel, IonButton, IonInput, IonCard, IonCardContent,
    IonButtons, IonBackButton, IonGrid, IonRow, IonCol, IonIcon, IonBadge, IonChip,
    IonFab, IonFabButton
  ]
})
export class ExpenseCategoriesPage implements OnInit {
  categories: any[] = [];
  isAdding = false;
  editingCategory: any = null;
  categoryForm = {
    name: '',
    description: '',
    color: '#6c757d'
  };

  // Predefined color options
  colorOptions = [
    '#6c757d', '#28a745', '#17a2b8', '#ffc107', '#dc3545',
    '#6610f2', '#e83e8c', '#fd7e14', '#20c997', '#007bff'
  ];

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {
    addIcons({ add, arrowBack, trash, create, close, closeCircle });
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadCategories();
  }

  async loadCategories() {
    const loading = await this.presentLoading('Loading categories...');
    this.api.getExpenseCategories().subscribe({
      next: (response: any) => {
        this.categories = response.data || [];
        loading.dismiss();
      },
      error: async (error: any) => {
        loading.dismiss();
        await this.presentToast('Error loading categories: ' + error.message, 'danger');
      }
    });
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
    this.router.navigate(['/expenses']);
  }

  toggleAdd() {
    this.isAdding = !this.isAdding;
    if (!this.isAdding) {
      this.resetForm();
    }
  }

  editCategory(category: any) {
    this.editingCategory = category;
    this.categoryForm = {
      name: category.name,
      description: category.description || '',
      color: category.color || '#6c757d'
    };
  }

  cancelEdit() {
    this.editingCategory = null;
    this.resetForm();
  }

  resetForm() {
    this.categoryForm = {
      name: '',
      description: '',
      color: '#6c757d'
    };
  }

  async saveCategory() {
    if (!this.categoryForm.name.trim()) {
      await this.presentToast('Category name is required', 'warning');
      return;
    }

    const loading = await this.presentLoading(
      this.editingCategory ? 'Updating category...' : 'Creating category...'
    );

    if (this.editingCategory) {
      this.api.updateExpenseCategory(this.editingCategory.id, this.categoryForm).subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast('Category updated successfully!', 'success');
          this.loadCategories();
          this.cancelEdit();
        },
        error: async (error: any) => {
          loading.dismiss();
          await this.presentToast('Error updating category: ' + error.message, 'danger');
        }
      });
    } else {
      this.api.createExpenseCategory(this.categoryForm).subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast('Category created successfully!', 'success');
          this.loadCategories();
          this.resetForm();
          this.isAdding = false;
        },
        error: async (error: any) => {
          loading.dismiss();
          await this.presentToast('Error creating category: ' + error.message, 'danger');
        }
      });
    }
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
                await this.presentToast('Category deleted successfully!', 'success');
                this.loadCategories();
              },
              error: async (error: any) => {
                loading.dismiss();
                let errorMessage = 'Error deleting category';
                if (error.error && error.error.message) {
                  errorMessage = error.error.message;
                }
                await this.presentToast(errorMessage, 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  selectColor(color: string) {
    this.categoryForm.color = color;
  }

  isColorSelected(color: string): boolean {
    return this.categoryForm.color === color;
  }
}
