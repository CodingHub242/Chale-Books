import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonContent, IonButtons, IonLabel, IonHeader, IonTitle, IonToolbar, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonMenuButton, IonMenu,
  IonList, IonItem,IonAvatar, IonIcon, IonGrid, IonRow, IonCol, IonBadge
} from '@ionic/angular/standalone';
import { MenuController } from '@ionic/angular';
import { Api } from '../services/api';
import { Auth } from '../services/auth';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  home, people, document, cash, clipboard, logOut, trendingUp, trendingDown,
  alertCircle, timeOutline, walletOutline, barChart,
  cube,
  documentText,
  peopleOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonLabel, IonButtons, IonHeader, IonTitle, IonToolbar, CommonModule,
    RouterModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton,
    IonMenuButton, IonMenu,IonAvatar,IonMenuButton, IonList, IonItem, IonIcon, IonGrid, IonRow, IonCol,
    IonBadge
  ]
})
export class DashboardPage implements OnInit {
  user: any = {};

  // Default currency for display
  defaultCurrency = 'GHS'; // Change this to your desired currency code, e.g., 'EUR', 'GBP', etc.

  // Stats
  totalRevenue = 0;
  totalExpenses = 0;
  netProfit = 0;
  pendingQuotes = 0;
  unpaidInvoices = 0;
  overdueInvoices = 0;
  
  // Recent data
  recentInvoices: any[] = [];
  recentQuotes: any[] = [];
  recentExpenses: any[] = [];
  
  // Loading state
  isLoading = true;

  constructor(
    private api: Api,
    private auth: Auth,
    public router: Router,
    private menuController: MenuController
  ) {
    addIcons({ 
      home, people, document, cash, clipboard, logOut, trendingUp, trendingDown,
      alertCircle, timeOutline, walletOutline, barChart,cube,documentText,peopleOutline,
    });
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadDashboardData();
  }

  async loadDashboardData() {
    this.isLoading = true;
    
    // Load user
    this.user = this.auth.getUser();

    // Load invoices and revenues
    this.api.getInvoices().subscribe((response: any) => {
      //console.log('Response:', response);
      const invoices = response.invoices || response;
      const revenues = response.revenues || [];

      // Calculate revenue from paid invoices
      const paidInvoiceRevenue = invoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + parseFloat(inv.total || inv.amount || 0), 0);

      this.unpaidInvoices = invoices.filter((inv: any) => inv.status === 'unpaid').length;
      this.overdueInvoices = invoices.filter((inv: any) => inv.status === 'overdue').length;

      // Get recent invoices (last 5)
      this.recentInvoices = invoices.slice(0, 5);

      // Calculate revenue from manual revenue entries
      const revenueAmount = revenues.reduce((sum: number, rev: any) => sum + parseFloat(rev.amount || 0), 0);
      this.totalRevenue = paidInvoiceRevenue + revenueAmount;
      this.calculateNetProfit();
    });

    // Load expenses
    this.api.getExpenses().subscribe((expenses: any) => {
      this.totalExpenses = expenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0);
      
      // Get recent expenses (last 5)
      this.recentExpenses = expenses.slice(0, 5);
      
      this.calculateNetProfit();
      this.isLoading = false;
    });

    // Load quotes
    this.api.getQuotes().subscribe((quotes: any) => {
      this.pendingQuotes = quotes.filter((q: any) => q.status === 'draft' || q.status === 'sent').length;
      
      // Get recent quotes (last 5)
      this.recentQuotes = quotes.slice(0, 5);
    });
  }

  calculateNetProfit() {
    this.netProfit = this.totalRevenue - this.totalExpenses;
  }

  logout() {
    this.auth.logout();
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'draft': 'medium',
      'sent': 'primary',
      'accepted': 'success',
      'rejected': 'danger',
      'unpaid': 'warning',
      'paid': 'success',
      'overdue': 'danger'
    };
    return colors[status] || 'medium';
  }

  async previewPdf(quote: any) {
    this.router.navigate(['/quote-preview', quote.id]);
  }

  async handleMenuClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    await this.menuController.close();
  }
}
