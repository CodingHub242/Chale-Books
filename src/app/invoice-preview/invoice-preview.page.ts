import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
  IonIcon, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonTextarea,
  IonInput, IonLabel, IonItem, ToastController, LoadingController
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../services/api';
import { Auth } from '../services/auth';
import { addIcons } from 'ionicons';
import { arrowBack, send, mail } from 'ionicons/icons';

@Component({
  selector: 'app-invoice-preview',
  templateUrl: './invoice-preview.page.html',
  styleUrls: ['./invoice-preview.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
    IonIcon, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonTextarea,
    IonInput, IonLabel, IonItem, CommonModule, ReactiveFormsModule
  ]
})
export class InvoicePreviewPage implements OnInit, OnDestroy {
  invoiceId: number = 0;
  invoice: any = null;
  pdfUrl: SafeResourceUrl | null = null;
  private pdfBlobUrl: string | null = null;
  emailForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: Api,
    private auth: Auth,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({ arrowBack, send, mail });
    this.initForm();
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.route.params.subscribe(params => {
      this.invoiceId = +params['id'];
      if (this.invoiceId) {
        this.loadInvoice();
        this.loadPdf();
      }
    });
  }

  ngOnDestroy() {
    if (this.pdfBlobUrl) {
      URL.revokeObjectURL(this.pdfBlobUrl);
    }
  }

  initForm() {
    this.emailForm = this.fb.group({
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  async loadInvoice() {
    const loading = await this.presentLoading('Loading invoice...');
    this.api.getInvoices().subscribe({
      next: (data: any) => {
        this.invoice = data.find((inv: any) => inv.id === this.invoiceId);
        if (this.invoice) {
          // Pre-fill email subject
          this.emailForm.patchValue({
            subject: `Invoice #${this.invoice.invoice_number || this.invoice.id} - ${this.invoice.client?.name}`
          });
        }
        loading.dismiss();
      },
      error: async (error: any) => {
        loading.dismiss();
        await this.presentToast('Error loading invoice: ' + error.message, 'danger');
        this.router.navigate(['/invoices']);
      }
    });
  }

  async loadPdf() {
    const loading = await this.presentLoading('Loading PDF...');
    this.api.previewInvoicePdf(this.invoiceId).subscribe({
      next: (blob: Blob) => {
        loading.dismiss();
        this.pdfBlobUrl = URL.createObjectURL(blob);
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfBlobUrl);
      },
      error: async (error: any) => {
        loading.dismiss();
        await this.presentToast('Error loading PDF: ' + error.message, 'danger');
      }
    });
  }

  async sendInvoice() {
    if (this.emailForm.valid) {
      const loading = await this.presentLoading('Sending invoice...');

      // For now, use the existing sendInvoice method
      // In a real app, you'd want to send with custom message
      this.api.sendInvoice(this.invoiceId).subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast('Invoice sent successfully!', 'success');
          this.router.navigate(['/invoices']);
        },
        error: async (error: any) => {
          loading.dismiss();
          await this.presentToast('Error sending invoice: ' + error.message, 'danger');
        }
      });
    } else {
      await this.presentToast('Please fill all required fields', 'warning');
    }
  }

  goBack() {
    this.router.navigate(['/invoices']);
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
}
