<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quote extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'client_id',
        'amount', // Keep for backward compatibility
        'total',
        'subtotal',
        'tax_total',
        'discount_total',
        'currency_id',
        'show_name',
        'show_time',
        'show_date',
        'show_location',
        'status',
        'expiry_date',
        'notes',
        'custom_fields'
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'amount' => 'decimal:2',
        'total' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'discount_total' => 'decimal:2',
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
        return $this->hasMany(QuoteItem::class)->orderBy('order');
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }
}
