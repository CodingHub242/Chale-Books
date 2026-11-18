<?php

namespace App\Exports;

use App\Models\Invoice;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class InvoicesExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Invoice::with('client', 'currency')
            ->where('user_id', auth()->id())
            ->get();
    }

    public function headings(): array
    {
        return [
            'Invoice Number',
            'Client',
            'Amount',
            'Currency',
            'Status',
            'Due Date',
            'Created At'
        ];
    }

    public function map($invoice): array
    {
        return [
            $invoice->invoice_number,
            $invoice->client->name,
            $invoice->total,
            $invoice->currency->code,
            $invoice->status,
            $invoice->due_date->format('Y-m-d'),
            $invoice->created_at->format('Y-m-d H:i:s')
        ];
    }
}