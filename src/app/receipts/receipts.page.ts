import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../services/api';

@Component({
  selector: 'app-receipts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './receipts.page.html',
  styleUrls: ['./receipts.page.scss']
})
export class ReceiptsPage {
  receipt: any = { notes: '', items: [] };
  newItem = { description: '', quantity: 1, unit_price: 0 };

  constructor(private api: Api) {}

  addItem() {
    this.receipt.items.push({ ...this.newItem });
    this.newItem = { description: '', quantity: 1, unit_price: 0 };
  }

  removeItem(i: number) { this.receipt.items.splice(i, 1); }

  generate() {
    this.api.generateReceiptPdf(this.receipt).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'receipt.pdf'; a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
