import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonButton, IonIcon, IonCard, IonCardContent, IonList, IonItem, IonLabel,
  IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { Api } from '../services/api';
import { Auth } from '../services/auth';
import { addIcons } from 'ionicons';
import { arrowBack, create, trash, download } from 'ionicons/icons';

@Component({
  selector: 'app-expense-details',
  templateUrl: './expense-details.page.html',
  styleUrls: ['./expense-details.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonButton, IonIcon, IonCard, IonCardContent, IonList, IonItem, IonLabel,
    IonGrid, IonRow, IonCol, CommonModule
  ]
})
export class ExpenseDetailsPage implements OnInit {
  expense: any = null;
  isLoading = true;
  expenseId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: Api,
    private auth: Auth
  ) {
    addIcons({ arrowBack, create, trash, download });
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.expenseId = parseInt(this.route.snapshot.paramMap.get('id') || '0', 10);
    if (this.expenseId) {
      this.loadExpense();
    } else {
      this.router.navigate(['/expenses']);
    }
  }

  async loadExpense() {
    this.isLoading = true;
    
    // Get all expenses and find the one we need
    this.api.getExpenses().subscribe({
      next: (data: any) => {
        this.expense = data.find((e: any) => e.id === this.expenseId);
        this.isLoading = false;
        
        if (!this.expense) {
          this.router.navigate(['/expenses']);
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error loading expense:', error);
        this.router.navigate(['/expenses']);
      }
    });
  }

  goBack() {
    this.router.navigate(['/expenses']);
  }

  editExpense() {
    // Navigate back to expenses with the edit state
    this.router.navigate(['/expenses'], { 
      queryParams: { edit: this.expenseId }
    });
  }

  deleteExpense() {
    // This will be implemented with an alert dialog in the full version
    // For now, we navigate back to expenses page which has the delete functionality
    this.router.navigate(['/expenses']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatAmount(amount: number): string {
    return amount ? amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) : '0.00';
  }

  getCustomFields(): { key: string; value: any }[] {
    if (!this.expense?.custom_fields) return [];
    return Object.entries(this.expense.custom_fields).map(([key, value]) => ({
      key,
      value
    }));
  }
}
