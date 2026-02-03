import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonButton, IonIcon, IonChip, IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonModal, IonToast, IonLoading, IonAvatar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trash, create, add, personAdd,arrowBack, close } from 'ionicons/icons';
import { Api } from '../services/api';
import { Auth } from '../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonButton, IonIcon, IonChip, IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonModal, IonToast, IonLoading, IonAvatar]
})
export class UsersPage implements OnInit {
  users: any[] = [];
  roles: any[] = [];
  currentUser: any;
  isModalOpen = false;
  isLoading = false;
  showToast = false;
  toastMessage = '';
  toastColor = 'success';
  
  editingUser: any = null;
  formData = {
    name: '',
    email: '',
    password: '',
    role: ''
  };

  constructor(
    private api: Api,
    private auth: Auth,
    public router: Router
  ) {
    addIcons({ trash,arrowBack, create, add, personAdd, close });
  }

  ngOnInit() {
    this.loadCurrentUser();
    this.loadUsers();
    this.loadRoles();
  }

  loadCurrentUser() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    //console.log('Current User:', this.currentUser);
  }

  loadUsers() {
    this.isLoading = true;
    this.api.getUsers().subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response!=null) {
          this.users = response;
          console.log('Loaded Users:', this.users);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.showToastMessage('Failed to load users', 'danger');
      }
    });
  }

  loadRoles() {
    this.api.getRoles().subscribe({
      next: (response: any) => {
        if (response!=null) {
          this.roles = response;
        }
      }
    });
  }

  openModal(user?: any) {
    if (user) {
      this.editingUser = user;
      // Handle user.roles as an array
      const userRole = user.roles && user.roles.length > 0 ? user.roles[0].name : '';
      this.formData = {
        name: user.name,
        email: user.email,
        password: '',
        role: userRole
      };
    } else {
      this.editingUser = null;
      this.formData = {
        name: '',
        email: '',
        password: '',
        role: ''
      };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingUser = null;
    this.formData = { name: '', email: '', password: '', role: '' };
  }

  saveUser() {
    if (!this.formData.name || !this.formData.email || !this.formData.role) {
      this.showToastMessage('Please fill in all required fields', 'warning');
      return;
    }

    if (this.editingUser) {
      // Update existing user
      const updateData: any = { ...this.formData };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      this.isLoading = true;
      this.api.updateUser(this.editingUser.id, updateData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.success) {
            this.showToastMessage('User updated successfully', 'success');
            this.closeModal();
            this.loadUsers();
          } else {
            this.showToastMessage(response.message || 'Failed to update user', 'danger');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.showToastMessage(error.message || 'Failed to update user', 'danger');
        }
      });
    } else {
      // Create new user
      if (!this.formData.password) {
        this.showToastMessage('Password is required for new users', 'warning');
        return;
      }
      
      this.isLoading = true;
      this.api.createUser(this.formData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.success) {
            this.showToastMessage('User created successfully', 'success');
            this.closeModal();
            this.loadUsers();
          } else {
            this.showToastMessage(response.message || 'Failed to create user', 'danger');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.showToastMessage(error.message || 'Failed to create user', 'danger');
        }
      });
    }
  }

  deleteUser(user: any) {
    if (user.id === this.currentUser?.id) {
      this.showToastMessage('You cannot delete your own account', 'warning');
      return;
    }

    if (confirm(`Are you sure you want to delete user "${user.name}"?`)) {
      this.isLoading = true;
      this.api.deleteUser(user.id).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.success) {
            this.showToastMessage('User deleted successfully', 'success');
            this.loadUsers();
          } else {
            this.showToastMessage(response.message || 'Failed to delete user', 'danger');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.showToastMessage(error.message || 'Failed to delete user', 'danger');
        }
      });
    }
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'admin': return 'danger';
      case 'manager': return 'warning';
      case 'accountant': return 'success';
      default: return 'primary';
    }
  }

  getRoleLabel(role: string): string {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  showToastMessage(message: string, color: string) {
    this.toastMessage = message;
    this.toastColor = color;
    this.showToast = true;
  }

   goBack() {
    this.router.navigate(['/dashboard']);
  }
}
