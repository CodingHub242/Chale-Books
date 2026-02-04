import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel,
  IonButton, IonInput, IonCard, IonCardContent, IonFab, IonFabButton, IonIcon,
  IonButtons, IonBackButton, IonSearchbar, IonGrid, IonRow, IonCol,
  ToastController, LoadingController, AlertController,
  IonMenuButton, IonCheckbox
} from '@ionic/angular/standalone';
import { Api } from '../services/api';
import { Auth } from '../services/auth';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { add, arrowBack, trash, create, close, person, checkboxOutline, squareOutline } from 'ionicons/icons';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.page.html',
  styleUrls: ['./clients.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ReactiveFormsModule,
    IonList, IonItem, IonLabel, IonButton, IonInput, IonCard, IonCardContent,
    IonFab, IonFabButton, IonIcon, IonMenuButton, IonButtons, IonBackButton, IonSearchbar,
    IonGrid, IonRow, IonCol, IonCheckbox
  ]
})
export class ClientsPage implements OnInit {
  clients: any[] = [];
  clientForm!: FormGroup;
  isAdding = false;
  editingClient: any = null;
  searchTerm = '';

  // Selection and bulk actions
  selectedClients: any[] = [];

  // Filtering and sorting
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

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
    addIcons({ add, arrowBack, trash, create, close, person, checkboxOutline, squareOutline });
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

  onSearch(event: any) {
    this.currentPage = 1;
  }

  getFilteredClients() {
    let filtered = this.clients;

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(client =>
        (client.name && client.name.toLowerCase().includes(searchLower)) ||
        (client.email && client.email.toLowerCase().includes(searchLower)) ||
        (client.phone && client.phone.includes(searchLower)) ||
        (client.address && client.address.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    if (this.sortField) {
      filtered = [...filtered].sort((a: any, b: any) => {
        let aVal: any = a[this.sortField] || '';
        let bVal: any = b[this.sortField] || '';

        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }

  hasActiveFilters(): boolean {
    return !!this.searchTerm;
  }

  clearFilters() {
    this.searchTerm = '';
  }

  // Selection methods
  isSelected(client: any): boolean {
    return this.selectedClients.some(s => s.id === client.id);
  }

  toggleSelect(client: any, event: any) {
    if (event.detail.checked) {
      if (!this.isSelected(client)) {
        this.selectedClients.push(client);
      }
    } else {
      this.selectedClients = this.selectedClients.filter(s => s.id !== client.id);
    }
  }

  toggleSelectAll(event: any) {
    if (event.detail.checked) {
      this.selectedClients = [...this.getFilteredClients()];
    } else {
      this.selectedClients = [];
    }
  }

  isAllSelected(): boolean {
    const filtered = this.getFilteredClients();
    return filtered.length > 0 && filtered.every(client => this.isSelected(client));
  }

  isSomeSelected(): boolean {
    return this.selectedClients.length > 0 && !this.isAllSelected();
  }

  clearSelection() {
    this.selectedClients = [];
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

  // Row click handler
  onRowClick(client: any, event: Event) {
    if ((event.target as HTMLElement).tagName === 'ION-CHECKBOX') {
      return;
    }
    this.editClient(client);
  }

  async bulkDelete() {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete ${this.selectedClients.length} client(s)?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const loading = await this.presentLoading('Deleting clients...');
            
            // Delete clients one by one
            const deleteCalls = this.selectedClients.map(client =>
              this.api.deleteClient(client.id)
            );

            forkJoin(deleteCalls).subscribe({
              next: async () => {
                loading.dismiss();
                await this.presentToast('Clients deleted successfully!', 'success');
                this.loadClients();
                this.clearSelection();
              },
              error: async (error) => {
                loading.dismiss();
                await this.presentToast('Error deleting clients: ' + error.message, 'danger');
                this.loadClients();
                this.clearSelection();
              }
            });
          }
        }
      ]
    });

    await alert.present();
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
