import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.message || errorMessage;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Auth
  login(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data)
      .pipe(catchError(this.handleError));
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data)
      .pipe(catchError(this.handleError));
  }

  getUser(): Observable<any> {
    return this.http.get(`${this.baseUrl}/user`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Clients
  getClients(page: number = 1, perPage: number = 10, search?: string): Observable<any> {
    let params = `?page=${page}&per_page=${perPage}`;
    if (search) {
      params += `&search=${encodeURIComponent(search)}`;
    }
    return this.http.get(`${this.baseUrl}/clients${params}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createClient(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/clients`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateClient(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/clients/${id}`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteClient(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/clients/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Invoices
  getInvoices(page: number = 1, perPage: number = 10, search?: string): Observable<any> {
    let params = `?page=${page}&per_page=${perPage}`;
    if (search) {
      params += `&search=${encodeURIComponent(search)}`;
    }
    return this.http.get(`${this.baseUrl}/invoices${params}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getInvoice(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/invoices/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createInvoice(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/invoices`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateInvoice(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/invoices/${id}`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteInvoice(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/invoices/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  sendInvoice(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/invoices/${id}/send`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  previewInvoicePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/invoices/${id}/pdf/preview`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  downloadInvoicePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/invoices/${id}/pdf/download`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  // Expenses
  getExpenses(): Observable<any> {
    return this.http.get(`${this.baseUrl}/expenses`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createExpense(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/expenses`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateExpense(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/expenses/${id}`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteExpense(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/expenses/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Expense Categories
  getExpenseCategories(): Observable<any> {
    return this.http.get(`${this.baseUrl}/expense-categories`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createExpenseCategory(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/expense-categories`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateExpenseCategory(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/expense-categories/${id}`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteExpenseCategory(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/expense-categories/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Quotes
  getQuotes(page: number = 1, perPage: number = 10, search?: string): Observable<any> {
    let params = `?page=${page}&per_page=${perPage}`;
    if (search) {
      params += `&search=${encodeURIComponent(search)}`;
    }
    return this.http.get(`${this.baseUrl}/quotes${params}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getQuote(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/quotes/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createQuote(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/quotes`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateQuote(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/quotes/${id}`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteQuote(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/quotes/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  sendQuote(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/quotes/${id}/send`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  convertQuoteToInvoice(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/quotes/${id}/convert`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  previewQuotePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/quotes/${id}/pdf/preview`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  downloadQuotePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/quotes/${id}/pdf/download`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  // Currencies
  getCurrencies(): Observable<any> {
    return this.http.get(`${this.baseUrl}/currencies`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Logs
  getLogs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/logs`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Users
  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createUser(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateUser(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/${id}`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getRoles(): Observable<any> {
    return this.http.get(`${this.baseUrl}/roles`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getProfitLoss(startDate?: string, endDate?: string): Observable<any> {
  let params = '';
  if (startDate) params += `?start_date=${startDate}`;
  if (endDate) params += `${params ? '&' : '?'}end_date=${endDate}`;
  return this.http.get(`${this.baseUrl}/reports/profit-loss${params}`, { headers: this.getHeaders() })
    .pipe(catchError(this.handleError));
}

getRevenueByClient(startDate?: string, endDate?: string): Observable<any> {
  let params = '';
  if (startDate) params += `?start_date=${startDate}`;
  if (endDate) params += `${params ? '&' : '?'}end_date=${endDate}`;
  return this.http.get(`${this.baseUrl}/reports/revenue-by-client${params}`, { headers: this.getHeaders() })
    .pipe(catchError(this.handleError));
}

getExpensesByCategory(startDate?: string, endDate?: string): Observable<any> {
  let params = '';
  if (startDate) params += `?start_date=${startDate}`;
  if (endDate) params += `${params ? '&' : '?'}end_date=${endDate}`;
  return this.http.get(`${this.baseUrl}/reports/expenses-by-category${params}`, { headers: this.getHeaders() })
    .pipe(catchError(this.handleError));
}

getMonthlyTrend(): Observable<any> {
  return this.http.get(`${this.baseUrl}/reports/monthly-trend`, { headers: this.getHeaders() })
    .pipe(catchError(this.handleError));
}

// Items
getItems(): Observable<any> {
  return this.http.get(`${this.baseUrl}/items`, { headers: this.getHeaders() })
    .pipe(catchError(this.handleError));
}

createItem(data: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/items`, data, { headers: this.getHeaders() })
    .pipe(catchError(this.handleError));
}

updateItem(id: number, data: any): Observable<any> {
  return this.http.put(`${this.baseUrl}/items/${id}`, data, { headers: this.getHeaders() })
    .pipe(catchError(this.handleError));
}

deleteItem(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/items/${id}`, { headers: this.getHeaders() })
    .pipe(catchError(this.handleError));
}

// Revenue
getRevenues(): Observable<any> {
  return this.http.get(`${this.baseUrl}/revenues`, { headers: this.getHeaders() })
    .pipe(catchError(this.handleError));
}

createRevenue(data: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/revenues`, data, { headers: this.getHeaders() })
    .pipe(catchError(this.handleError));
}

updateRevenue(id: number, data: any): Observable<any> {
  return this.http.put(`${this.baseUrl}/revenues/${id}`, data, { headers: this.getHeaders() })
    .pipe(catchError(this.handleError));
}

deleteRevenue(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/revenues/${id}`, { headers: this.getHeaders() })
    .pipe(catchError(this.handleError));
}

// Quote Templates
getQuoteTemplates(): Observable<any> {
  return this.http.get(`${this.baseUrl}/quote-templates`, { headers: this.getHeaders() })
    .pipe(catchError(this.handleError));
}

createQuoteTemplate(data: any): Observable<any> {
  return this.http.post(`${this.baseUrl}/quote-templates`, data, { headers: this.getHeaders() })
    .pipe(catchError(this.handleError));
}

updateQuoteTemplate(id: number, data: any): Observable<any> {
  return this.http.put(`${this.baseUrl}/quote-templates/${id}`, data, { headers: this.getHeaders() })
    .pipe(catchError(this.handleError));
}

deleteQuoteTemplate(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/quote-templates/${id}`, { headers: this.getHeaders() })
    .pipe(catchError(this.handleError));
}
}
