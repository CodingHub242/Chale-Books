import { Injectable } from '@angular/core';
import { Api } from './api';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private api: Api, public router: Router) {}

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.api.login(credentials);
  }

  register(userData: { name: string; email: string; password: string }): Observable<any> {
    return this.api.register(userData);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  setToken(token: string, user?: any): void {
    localStorage.setItem('token', token);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    this.isAuthenticatedSubject.next(true);
  }

  getUser(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }
}
