import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonContent, IonButtons, IonTitle, IonToolbar, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonMenuButton, IonMenu,
  IonList, IonItem, IonAvatar, IonIcon, IonGrid, IonRow, IonCol, IonBadge
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
  list,
  book
} from 'ionicons/icons';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonTitle, IonButtons, IonToolbar, CommonModule,
    RouterModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton,
    IonMenuButton, IonMenu, IonAvatar, IonList, IonItem, IonIcon, IonGrid, IonRow, IonCol,
    IonBadge
  ]
})
export class DashboardPage implements OnInit {
  user: any = {};
  isMobile = false;

  defaultCurrency = 'GHS';

  totalRevenue = 0;
  totalExpenses = 0;
  netProfit = 0;
  pendingQuotes = 0;
  unpaidInvoices = 0;
  overdueInvoices = 0;

  recentInvoices: any[] = [];
  recentQuotes: any[] = [];
  recentExpenses: any[] = [];

  currentDate = new Date();
  isLoading = true;

  constructor(
    private api: Api,
    private auth: Auth,
    public router: Router,
    private menuController: MenuController
  ) {
    addIcons({ 
      home, people, document, cash, clipboard, logOut, trendingUp, trendingDown,
      alertCircle, timeOutline, walletOutline, barChart, cube, documentText, peopleOutline, list, book,
    });
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.checkScreenSize();
    this.loadDashboardData();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 800;
  }

  async loadDashboardData() {
    this.isLoading = true;

    this.user = this.auth.getUser();

    this.api.getInvoices().subscribe((response: any) => {
      const invoices = response.invoices || response;
      const revenues = response.revenues || [];

      const paidInvoiceRevenue = invoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + parseFloat(inv.total || inv.amount || 0), 0);

      this.unpaidInvoices = invoices.filter((inv: any) => inv.status === 'unpaid').length;
      this.overdueInvoices = invoices.filter((inv: any) => inv.status === 'overdue').length;

      this.recentInvoices = invoices.slice(0, 5);

      const revenueAmount = revenues.reduce((sum: number, rev: any) => sum + parseFloat(rev.amount || 0), 0);
      this.totalRevenue = paidInvoiceRevenue + revenueAmount;
      this.calculateNetProfit();
    });

    this.api.getExpenses().subscribe((expenses: any) => {
      this.totalExpenses = expenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0);
      this.recentExpenses = expenses.slice(0, 5);
      this.calculateNetProfit();
      this.isLoading = false;
    });

    this.api.getQuotes().subscribe((quotes: any) => {
      this.pendingQuotes = quotes.filter((q: any) => q.status === 'draft' || q.status === 'sent').length;
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
