<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Invoice;
use Carbon\Carbon;

class GenerateRecurringInvoices extends Command
{
    protected $signature = 'invoices:generate-recurring';
    protected $description = 'Generate recurring invoices';

    public function handle()
    {
        $recurringInvoices = Invoice::where('is_recurring', true)
            ->where('recurring_start_date', '<=', now())
            ->where(function($q) {
                $q->whereNull('recurring_end_date')
                  ->orWhere('recurring_end_date', '>=', now());
            })
            ->get();

        foreach ($recurringInvoices as $invoice) {
            if ($this->shouldGenerate($invoice)) {
                $this->generateInvoice($invoice);
            }
        }

        $this->info('Recurring invoices generated successfully!');
    }

    private function shouldGenerate($invoice)
    {
        if (!$invoice->last_generated_date) {
            return true;
        }

        $lastGenerated = Carbon::parse($invoice->last_generated_date);
        $now = now();

        switch ($invoice->recurring_frequency) {
            case 'daily':
                return $now->diffInDays($lastGenerated) >= 1;
            case 'weekly':
                return $now->diffInWeeks($lastGenerated) >= 1;
            case 'monthly':
                return $now->diffInMonths($lastGenerated) >= 1;
            case 'yearly':
                return $now->diffInYears($lastGenerated) >= 1;
            default:
                return false;
        }
    }

    private function generateInvoice($parentInvoice)
    {
        $newInvoice = $parentInvoice->replicate();
        $newInvoice->parent_invoice_id = $parentInvoice->id;
        $newInvoice->is_recurring = false;
        $newInvoice->status = 'unpaid';
        $newInvoice->due_date = now()->addDays(30);
        $newInvoice->save();

        // Copy items
        foreach ($parentInvoice->items as $item) {
            $newInvoice->items()->create($item->toArray());
        }

        // Update parent
        $parentInvoice->update([
            'last_generated_date' => now(),
            'recurring_count' => $parentInvoice->recurring_count + 1
        ]);

        $this->info("Generated invoice #{$newInvoice->invoice_number} from #{$parentInvoice->invoice_number}");
    }
}