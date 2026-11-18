<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'client_id',
        'invoice_number',
        'amount', // Keep for backward compatibility
        'total',
        'subtotal',
        'tax_total',
        'discount_total',
        'currency_id',
        'status',
        'due_date',
        'notes',
        'terms_and_conditions',
        'custom_fields',
        'is_recurring',
        'recurring_frequency',
        'recurring_start_date',
        'recurring_end_date',
        'recurring_count',
        'parent_invoice_id',
        'last_generated_date',
        'trip_show',
        'trip_show_details'
    ];

    protected $casts = [
        'due_date' => 'date',
        'amount' => 'decimal:2',
        'total' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'is_recurring' => 'boolean',
        'recurring_start_date' => 'date',
        'recurring_end_date' => 'date',
        'last_generated_date' => 'date',
        'custom_fields' => 'array',
    ];

    // Accessor to use total if available, otherwise amount
    public function getTotalAttribute($value)
    {
        return $value ?? $this->attributes['amount'] ?? 0;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function currency()
    {
        return $this->belongsTo(Currency::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class)->orderBy('order');
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($invoice) {
            if (empty($invoice->invoice_number)) {
                $lastInvoice = Invoice::max('id');
                $invoice->invoice_number = 'INV-' . str_pad(($lastInvoice ?? 0) + 1, 6, '0', STR_PAD_LEFT);
            }
        });
    }

    public function parentInvoice()
    {
        return $this->belongsTo(Invoice::class, 'parent_invoice_id');
    }

    public function childInvoices()
    {
        return $this->hasMany(Invoice::class, 'parent_invoice_id');
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }
}
