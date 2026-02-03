import { Routes } from '@angular/router';

export const routes: Routes = [
  // {
  //   path: 'home',
  //   loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  // },
  // {
  //   path: '',
  //   redirectTo: 'home',
  //   pathMatch: 'full',
  // },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
    path: 'clients',
    loadComponent: () => import('./clients/clients.page').then( m => m.ClientsPage)
  },
  {
    path: 'quotes',
    loadComponent: () => import('./quotes/quotes.page').then( m => m.QuotesPage)
  },
  {
    path: 'quote-preview/:id',
    loadComponent: () => import('./quote-preview/quote-preview.page').then( m => m.QuotePreviewPage)
  },
  {
    path: 'invoices',
    loadComponent: () => import('./invoices/invoices.page').then( m => m.InvoicesPage)
  },
  // {
  //   path: 'invoice-preview/:id',
  //   loadComponent: () => import('./invoice-preview/invoice-preview.page').then( m => m.InvoicePreviewPage)
  // },
  {
    path: 'invoice-preview/:id',
    loadComponent: () => import('./invoice-preview/invoice-preview.page').then( m => m.InvoicePreviewPage)
  },
  {
    path: 'expenses',
    loadComponent: () => import('./expenses/expenses.page').then( m => m.ExpensesPage)
  },
  {
    path: 'reports',
    loadComponent: () => import('./reports/reports.page').then( m => m.ReportsPage)
  },
  {
    path: 'users',
    loadComponent: () => import('./users/users.page').then( m => m.UsersPage)
  },
  {
    path: 'quote-templates',
    loadComponent: () => import('./quote-templates/quote-templates.page').then( m => m.QuoteTemplatesPage)
  },
  {
    path: 'items',
    loadComponent: () => import('./items/items.page').then( m => m.ItemsPage)
  },
];
