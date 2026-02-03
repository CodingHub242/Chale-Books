import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonButtons, IonBackButton, IonButton,
  IonIcon, IonGrid, IonRow, IonCol, IonItem, IonLabel, IonInput,
  IonSelect, IonSelectOption, IonTextarea, IonFab, IonFabButton,
  LoadingController, ToastController,
  IonMenuButton
} from '@ionic/angular/standalone';
import { Api } from '../services/api';
import { Auth } from '../services/auth';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { addIcons } from 'ionicons';
import { barChart, pieChart, trendingUp, download, arrowBack } from 'ionicons/icons';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ReactiveFormsModule,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButtons,
    IonBackButton, IonButton,IonMenuButton, IonIcon, IonGrid, IonRow, IonCol,
    IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonTextarea, IonFab, IonFabButton
  ]
})
export class ReportsPage implements OnInit, AfterViewInit {
  // Data
  profitLossData: any = null;
  revenueByClientData: any[] = [];
  expensesByCategoryData: any[] = [];
  monthlyTrendData: any[] = [];

  // Charts
  monthlyTrendChart: any;
  revenueByClientChart: any;
  expensesByCategoryChart: any;

  // Date filters
  startDate: string = '';
  endDate: string = '';

   // Default currency for display
  defaultCurrency = 'GHS'; // Change this to your desired currency code, e.g., 'EUR', 'GBP', etc.

  // Revenue form
  revenueForm!: FormGroup;
  isAddingRevenue = false;
  clients: any[] = [];
  currencies: any[] = [];

  constructor(
    private api: Api,
    private auth: Auth,
    private router: Router,
    private fb: FormBuilder,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({ barChart,arrowBack, pieChart, trendingUp, download });
    
    // Set default dates (current month)
    const now = new Date();
    this.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    this.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.initRevenueForm();
    this.loadClients();
    this.loadCurrencies();
  }

  ngAfterViewInit() {
    this.loadAllReports();
  }

  async loadAllReports() {
    const loading = await this.presentLoading('Loading reports...');
    
    // Load all reports
    this.loadProfitLoss();
    this.loadRevenueByClient();
    this.loadExpensesByCategory();
    this.loadMonthlyTrend();
    
    loading.dismiss();
  }

  loadProfitLoss() {
    this.api.getProfitLoss(this.startDate, this.endDate).subscribe({
      next: (data: any) => {
        this.profitLossData = data;
      },
      error: async (error: any) => {
        await this.presentToast('Error loading profit/loss: ' + error.message, 'danger');
      }
    });
  }

  loadRevenueByClient() {
    this.api.getRevenueByClient(this.startDate, this.endDate).subscribe({
      next: (data: any) => {
        this.revenueByClientData = data;
        this.createRevenueByClientChart();
      },
      error: async (error: any) => {
        await this.presentToast('Error loading revenue by client: ' + error.message, 'danger');
      }
    });
  }

  loadExpensesByCategory() {
    this.api.getExpensesByCategory(this.startDate, this.endDate).subscribe({
      next: (data: any) => {
        this.expensesByCategoryData = data;
        this.createExpensesByCategoryChart();
      },
      error: async (error: any) => {
        await this.presentToast('Error loading expenses by category: ' + error.message, 'danger');
      }
    });
  }

  loadMonthlyTrend() {
    this.api.getMonthlyTrend().subscribe({
      next: (data: any) => {
        this.monthlyTrendData = data;
        this.createMonthlyTrendChart();
      },
      error: async (error: any) => {
        await this.presentToast('Error loading monthly trend: ' + error.message, 'danger');
      }
    });
  }

  createMonthlyTrendChart() {
    const canvas = document.getElementById('monthlyTrendChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.monthlyTrendChart) {
      this.monthlyTrendChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.monthlyTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.monthlyTrendData.map(d => d.month),
        datasets: [
          {
            label: 'Revenue',
            data: this.monthlyTrendData.map(d => d.revenue),
            borderColor: '#073336',
            backgroundColor: 'rgba(7, 51, 54, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Expenses',
            data: this.monthlyTrendData.map(d => d.expenses),
            borderColor: '#eb445a',
            backgroundColor: 'rgba(235, 68, 90, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Profit',
            data: this.monthlyTrendData.map(d => d.profit),
            borderColor: '#2dd36f',
            backgroundColor: 'rgba(45, 211, 111, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Monthly Trend (Last 12 Months)'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createRevenueByClientChart() {
    const canvas = document.getElementById('revenueByClientChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.revenueByClientChart) {
      this.revenueByClientChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.revenueByClientChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.revenueByClientData.map(d => d.client),
        datasets: [{
          label: 'Revenue',
          data: this.revenueByClientData.map(d => d.total),
          backgroundColor: '#073336',
          borderColor: '#073336',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Revenue by Client'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createExpensesByCategoryChart() {
    const canvas = document.getElementById('expensesByCategoryChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.expensesByCategoryChart) {
      this.expensesByCategoryChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = [
      '#073336', '#0a4d52', '#0d6670', '#eb445a', '#ffc409',
      '#2dd36f', '#3880ff', '#5260ff', '#c5000f', '#f4a942'
    ];

    this.expensesByCategoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.expensesByCategoryData.map(d => d.category),
        datasets: [{
          data: this.expensesByCategoryData.map(d => d.total),
          backgroundColor: colors.slice(0, this.expensesByCategoryData.length),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Expenses by Category'
          }
        }
      }
    });
  }

  applyFilters() {
    this.loadProfitLoss();
    this.loadRevenueByClient();
    this.loadExpensesByCategory();
  }

  // Revenue methods
  initRevenueForm() {
    this.revenueForm = this.fb.group({
      client_id: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      currency_id: ['', Validators.required],
      revenue_date: ['', Validators.required],
      description: [''],
      category: ['', Validators.required]
    });
  }

  loadClients() {
    this.api.getClients().subscribe({
      next: (data: any) => {
        this.clients = data;
      },
      error: async (error: any) => {
        await this.presentToast('Error loading clients: ' + error.message, 'danger');
      }
    });
  }

  loadCurrencies() {
    this.api.getCurrencies().subscribe({
      next: (data: any) => {
        this.currencies = data;
      },
      error: async (error: any) => {
        await this.presentToast('Error loading currencies: ' + error.message, 'danger');
      }
    });
  }

  async submitRevenue() {
    if (this.revenueForm.valid) {
      const loading = await this.presentLoading('Creating revenue...');

      this.api.createRevenue(this.revenueForm.value).subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast('Revenue created successfully!', 'success');
          this.loadAllReports(); // Refresh reports
          this.revenueForm.reset();
          this.initRevenueForm();
          this.isAddingRevenue = false;
        },
        error: async (error: any) => {
          loading.dismiss();
          await this.presentToast('Error creating revenue: ' + error.message, 'danger');
        }
      });
    } else {
      await this.presentToast('Please fill all required fields', 'warning');
    }
  }

  cancelAddRevenue() {
    this.isAddingRevenue = false;
    this.revenueForm.reset();
    this.initRevenueForm();
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
