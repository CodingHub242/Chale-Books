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
import { arrowBack, send, mail, document, informationCircle } from 'ionicons/icons';

@Component({
  selector: 'app-quote-preview',
  templateUrl: './quote-preview.page.html',
  styleUrls: ['./quote-preview.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
    IonIcon, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonTextarea,
    IonInput, IonLabel, IonItem, CommonModule, ReactiveFormsModule
  ]
})
export class QuotePreviewPage implements OnInit, OnDestroy {
  quoteId: number = 0;
  quote: any = null;
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
    addIcons({ arrowBack, send, mail,document,informationCircle });
    this.initForm();
  }

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.route.params.subscribe(params => {
      this.quoteId = +params['id'];
      if (this.quoteId) {
        this.loadQuote();
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

  async loadQuote() {
    const loading = await this.presentLoading('Loading quote...');
    //this.api.getQuote(this.quoteId)
    this.api.getQuotes().subscribe({
      next: (data: any) => {
       // this.quote = data;
       this.quote = data.find((q: any) => q.id === this.quoteId);
        if (this.quote) {
          // Pre-fill email subject
          this.emailForm.patchValue({
            subject: `Quote #${this.quote.id} - ${this.quote.client?.name}`
          });
        }
        loading.dismiss();
      },
      error: async (error: any) => {
        loading.dismiss();
        await this.presentToast('Error loading quote: ' + error.message, 'danger');
        this.router.navigate(['/quotes']);
      }
    });
  }

  async loadPdf() {
    const loading = await this.presentLoading('Loading PDF...');
    this.api.previewQuotePdf(this.quoteId).subscribe({
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

  async sendQuote() {
    if (this.emailForm.valid) {
      const loading = await this.presentLoading('Sending quote...');

      // For now, use the existing sendQuote method
      // In a real app, you'd want to send with custom message
      this.api.sendQuote(this.quoteId).subscribe({
        next: async () => {
          loading.dismiss();
          await this.presentToast('Quote sent successfully!', 'success');
          this.router.navigate(['/quotes']);
        },
        error: async (error: any) => {
          loading.dismiss();
          await this.presentToast('Error sending quote: ' + error.message, 'danger');
        }
      });
    } else {
      await this.presentToast('Please fill all required fields', 'warning');
    }
  }

  formatExpiryDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    // Check if the date has expired
    if (date < today) {
      return 'Expired';
    }

    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();

    // Add ordinal suffix to day
    const getOrdinalSuffix = (day: number): string => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'draft': 'medium',
      'sent': 'primary',
      'accepted': 'success',
      'rejected': 'danger',
      'converted': 'warning'
    };
    return colors[status] || 'medium';
  }

  goBack() {
    this.router.navigate(['/quotes']);
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
