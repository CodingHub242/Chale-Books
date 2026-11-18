<?php

namespace App\Mail;

use App\Models\Quote;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
use Barryvdh\DomPDF\Facade\Pdf;

class QuoteMail extends Mailable
{
    use Queueable, SerializesModels;

    public $quoteId;
    public $customSubject;
    public $customMessage;
    public $cc;

    public function __construct($quoteId, $customSubject = null, $customMessage = null, $cc = null)
    {
        $this->quoteId = $quoteId;
        $this->customSubject = $customSubject;
        $this->customMessage = $customMessage;
        $this->cc = $cc;
    }

    public function envelope(): Envelope
    {
        try {
            \Log::info('QuoteMail envelope - loading quote', ['quoteId' => $this->quoteId]);
            
            $quote = Quote::with(['user'])->find($this->quoteId);
            
            if (!$quote) {
                \Log::error('Quote not found in envelope', ['quoteId' => $this->quoteId]);
                return new Envelope(
                    subject: 'Quote #' . $this->quoteId,
                    cc: [],
                );
            }
            
            \Log::info('Quote loaded in envelope', ['quote_id' => $quote->id, 'has_user' => $quote->user !== null]);
            
            $subject = $this->customSubject 
                ? $this->customSubject 
                : 'Quote #' . $quote->id . ' from ' . ($quote->user->name ?? 'Your Company');
                
            // Handle CC properly
            $ccEmails = [];
            if ($this->cc && is_string($this->cc) && filter_var($this->cc, FILTER_VALIDATE_EMAIL)) {
                $ccEmails = [$this->cc];
            }
                
            return new Envelope(
                subject: $subject,
                cc: $ccEmails,
            );
        } catch (\Exception $e) {
            \Log::error('QuoteMail envelope error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return new Envelope(
                subject: 'Quote #' . $this->quoteId,
                cc: [],
            );
        }
    }

    public function content(): Content
    {
        try {
            \Log::info('QuoteMail content - loading quote', ['quoteId' => $this->quoteId]);
            
            $quote = Quote::with(['client', 'currency', 'items', 'user'])->find($this->quoteId);
            
            if (!$quote) {
                \Log::error('Quote not found in content', ['quoteId' => $this->quoteId]);
                $quote = new Quote();
                $quote->id = $this->quoteId;
            }
            
            \Log::info('Quote loaded in content', [
                'quote_id' => $quote->id, 
                'items_count' => $quote->items->count() ?? 0,
                'has_client' => $quote->client !== null
            ]);
            
            return new Content(
                view: 'emails.quote',
                with: [
                    'quote' => $quote,
                    'customMessage' => $this->customMessage,
                ],
            );
        } catch (\Exception $e) {
            \Log::error('QuoteMail content error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            $quote = new Quote();
            $quote->id = $this->quoteId;
            
            return new Content(
                view: 'emails.quote',
                with: [
                    'quote' => $quote,
                    'customMessage' => 'Please find your quote attached.',
                ],
            );
        }
    }

    public function attachments(): array
    {
        return [];
    }
}
