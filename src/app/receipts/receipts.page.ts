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

  get receiptTotal(): number {
    return this.receipt.items.reduce(
      (total: number, item: any) =>
        total + (Number(item.quantity) * Number(item.unit_price)),
      0
    );
  }

  get canAddItem(): boolean {
    return (
      !!this.newItem.description.trim() &&
      Number(this.newItem.quantity) > 0 &&
      Number(this.newItem.unit_price) >= 0 &&
      Number.isFinite(Number(this.newItem.quantity)) &&
      Number.isFinite(Number(this.newItem.unit_price))
    );
  }

 addItem(): void {
    if (!this.canAddItem) {
      return;
    }

    this.receipt.items.push({
      description: this.newItem.description.trim(),
      quantity: Number(this.newItem.quantity),
      unit_price: Number(this.newItem.unit_price)
    });

    this.newItem = {
      description: '',
      quantity: 1,
      unit_price: 0
    };
  }

   removeItem(index: number): void {
    this.receipt.items.splice(index, 1);
  }

  generate(): void {
    if (!this.receipt.items.length) {
      return;
    }

    this.api.generateReceiptPdf(this.receipt).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'receipt.pdf';
        link.click();

        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        console.error('Receipt generation failed:', error);
      }
    });
  }
}
