import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, 
  IonButton, IonInput, IonCard, IonCardContent, IonFab, IonFabButton, IonIcon,
  IonButtons, IonBackButton, IonSearchbar, IonGrid, IonRow, IonCol,
  ToastController, LoadingController, AlertController,
  IonMenuButton
} from '@ionic/angular/standalone';
import { Api } from '../services/api';
import { Auth } from '../services/auth';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { add,arrowBack, trash, create, close, person } from 'ionicons/icons';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.page.html',
  styleUrls: ['./clients.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ReactiveFormsModule,
    IonList, IonItem, IonLabel, IonButton, IonInput, IonCard, IonCardContent, 
    IonFab, IonFabButton, IonIcon,IonMenuButton, IonButtons, IonBackButton, IonSearchbar,
    IonGrid, IonRow, IonCol
  ]
})
export class ClientsPage implements OnInit {
  clients: any[] = [];
  clientForm!: FormGroup;
  isAdding = false;
  editingClient: any = null;
  searchTerm = '';

  // Pagination properties
  currentPage = 1;
  perPage = 10;
  totalPages = 1;
  totalClients = 0;
  isLoading = false;

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router,
    private fb: FormBuilder,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {
    addIcons({ add,arrowBack, trash, create, close, person });
    this.initForm();
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadClients();
  }

  initForm() {
    this.clientForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: ['']
    });
  }

  async loadClients(page: number = 1) {
    this.isLoading = true;
    const loading = await this.presentLoading('Loading clients...');

    this.api.getClients(page, this.perPage, this.searchTerm || undefined).subscribe({
      next: (response: any) => {
        // Assuming the API returns paginated data with data, current_page, last_page, total
        this.clients = response.data || response;
        this.currentPage = response.current_page || page;
        this.totalPages = response.last_page || 1;
        this.totalClients = response.total || this.clients.length;

        loading.dismiss();
        this.isLoading = false;
      },
      error: async (error: any) => {
        loading.dismiss();
        this.isLoading = false;
        await this.presentToast('Error loading clients: ' + error.message, 'danger');
      }
    });
  }

  async submitClient() {
    if (this.clientForm.valid) {
      const loading = await this.presentLoading('Creating client...');
      
      this.api.createClient(this.clientForm.value).subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast('Client created successfully!', 'success');
          this.loadClients();
          this.clientForm.reset();
          this.isAdding = false;
        },
        error: async (error: any) => {
          loading.dismiss();
          await this.presentToast('Error creating client: ' + error.message, 'danger');
        }
      });
    } else {
      await this.presentToast('Please fill all required fields', 'warning');
    }
  }

  editClient(client: any) {
    this.editingClient = client;
    this.clientForm.patchValue({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address
    });
  }

  async updateClient() {
    if (this.clientForm.valid && this.editingClient) {
      const loading = await this.presentLoading('Updating client...');
      
      this.api.updateClient(this.editingClient.id, this.clientForm.value).subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast('Client updated successfully!', 'success');
          this.loadClients();
          this.cancelEdit();
        },
        error: async (error: any) => {
          loading.dismiss();
          await this.presentToast('Error updating client: ' + error.message, 'danger');
        }
      });
    }
  }

  async deleteClient(client: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this client? This will also delete all related quotes and invoices.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const loading = await this.presentLoading('Deleting client...');
            this.api.deleteClient(client.id).subscribe({
              next: async () => {
                loading.dismiss();
                await this.presentToast('Client deleted successfully!', 'success');
                this.loadClients();
              },
              error: async (error: any) => {
                loading.dismiss();
                await this.presentToast('Error deleting client: ' + error.message, 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  cancelEdit() {
    this.editingClient = null;
    this.clientForm.reset();
  }

  cancelAdd() {
    this.isAdding = false;
    this.clientForm.reset();
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadClients(page);
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
    this.loadClients(1);
  }

  getFilteredClients() {
    // Since search is now server-side, just return current page data
    return this.clients;
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
