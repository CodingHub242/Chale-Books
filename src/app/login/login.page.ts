import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInput, IonButton, IonItem, IonLabel, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonToast, IonSpinner } from '@ionic/angular/standalone';
import { Auth } from '../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonInput, IonButton, IonItem, IonLabel, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle, IonToast, IonSpinner]
})
export class LoginPage implements OnInit {
  email: string = '';
  password: string = '';
  isToastOpen = false;
  toastMessage = '';
  isLoading = false;

  constructor(private auth: Auth, private router: Router) { }

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  login() {
    this.isLoading = true;
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.auth.setToken(response.token, response.user);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.toastMessage = 'Login failed';
        this.isToastOpen = true;
      }
    });
  }

  setToastOpen(open: boolean) {
    this.isToastOpen = open;
  }
}
