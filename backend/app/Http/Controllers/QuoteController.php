<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Quote;
use App\Models\Invoice;
use App\Models\Log;
use App\Models\Client;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Dompdf\Dompdf;
use Dompdf\Options;
use TCPDF;

class QuoteController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $query = Quote::with('client', 'currency', 'items');
        if (!$user->hasRole('admin')) {
            $query->where('user_id', $user->id);
        }
        return $query->get();
    }

    public function store(Request $request)
    {
      // return response()->json(['message' => $request->all()], 403);
        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'currency_id' => 'required|exists:currencies,id',
            'status' => 'in:draft,sent,accepted,rejected',
            'expiry_date' => 'required|date',
            'notes' => 'nullable|string',
            'custom_fields' => 'nullable|array',
            'custom_fields.*.label' => 'nullable|string|max:255',
            'custom_fields.*.value' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.discount' => 'nullable|numeric|min:0',
        ]);

        // // Check if client belongs to the authenticated user or if user is admin
        $client = Client::find($request->client_id);
       // print_r($client);
        $user = auth()->user();
        if (!$client || (!$user->hasRole('admin') && $client->user_id !== $user->id)) {
            return response()->json(['message' => 'Client not found or does not belong to you'], 404);
        }

        DB::beginTransaction();
        try {
            $quote = Quote::create([
                'user_id' => auth()->id(),
                'client_id' => $request->client_id,
                'currency_id' => $request->currency_id,
                'status' => $request->status ?? 'draft',
                'expiry_date' => $request->expiry_date,
                'notes' => $request->notes,
                'custom_fields' => $request->custom_fields,
                'subtotal' => 0,
                'show_name'=>$request->show_name,
                'show_date'=>$request->show_date,
                'show_time'=>$request->show_time,
                'show_location'=>$request->show_location,
                'tax_total' => 0,
                'discount_total' => 0,
                'total' => 0,
            ]);

            $subtotal = 0;
            $taxTotal = 0;
            $discountTotal = 0;

            foreach ($request->items as $index => $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $itemDiscount = $item['discount'] ?? 0;
                $itemTax = ($itemSubtotal - $itemDiscount) * (($item['tax_rate'] ?? 0) / 100);
                $itemTotal = $itemSubtotal - $itemDiscount + $itemTax;

                $quote->items()->create([
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'discount' => $itemDiscount,
                    'total' => $itemTotal,
                    'order' => $index,
                ]);

                $subtotal += $itemSubtotal;
                $taxTotal += $itemTax;
                $discountTotal += $itemDiscount;
            }

            $quote->update([
                'subtotal' => $subtotal,
                'tax_total' => $taxTotal,
                'discount_total' => $discountTotal,
                'total' => $subtotal - $discountTotal + $taxTotal,
            ]);

            Log::create([
                'user_id' => auth()->id(),
                'action' => 'created',
                'model' => 'Quote',
                'model_id' => $quote->id,
                'details' => ['total' => $quote->total, 'status' => $quote->status],
            ]);

            DB::commit();
            return response()->json($quote->load('client', 'currency', 'items'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating quote', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Quote $quote)
    {
        $this->authorize('view', $quote);
        return $quote->load('client', 'currency', 'items');
    }

    public function update(Request $request, Quote $quote)
    {
        //$this->authorize('update', $quote);

        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'currency_id' => 'required|exists:currencies,id',
            'status' => 'in:draft,sent,accepted,rejected',
            'expiry_date' => 'required|date',
            'notes' => 'nullable|string',
            'custom_fields' => 'nullable|array',
            'custom_fields.*.label' => 'nullable|string|max:255',
            'custom_fields.*.value' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.discount' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $quote->update([
                'client_id' => $request->client_id,
                'currency_id' => $request->currency_id,
                'status' => $request->status,
                'show_name'=>$request->show_name,
                'show_date'=>$request->show_date,
                'show_time'=>$request->show_time,
                'show_location'=>$request->show_location,
                'expiry_date' => $request->expiry_date,
                'notes' => $request->notes,
                'custom_fields' => $request->custom_fields,
            ]);

            // Delete existing items
            $quote->items()->delete();

            $subtotal = 0;
            $taxTotal = 0;
            $discountTotal = 0;

            foreach ($request->items as $index => $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $itemDiscount = $item['discount'] ?? 0;
                $itemTax = ($itemSubtotal - $itemDiscount) * (($item['tax_rate'] ?? 0) / 100);
                $itemTotal = $itemSubtotal - $itemDiscount + $itemTax;

                $quote->items()->create([
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'discount' => $itemDiscount,
                    'total' => $itemTotal,
                    'order' => $index,
                ]);

                $subtotal += $itemSubtotal;
                $taxTotal += $itemTax;
                $discountTotal += $itemDiscount;
            }

            $quote->update([
                'subtotal' => $subtotal,
                'tax_total' => $taxTotal,
                'discount_total' => $discountTotal,
                'total' => $subtotal - $discountTotal + $taxTotal,
            ]);

            Log::create([
                'user_id' => auth()->id(),
                'action' => 'updated',
                'model' => 'Quote',
                'model_id' => $quote->id,
                'details' => ['total' => $quote->total, 'status' => $quote->status],
            ]);

            DB::commit();
            return response()->json($quote->load('client', 'currency', 'items'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error updating quote', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Quote $quote)
    {
        //$this->authorize('delete', $quote);
        $quote->delete();

        Log::create([
            'user_id' => auth()->id(),
            'action' => 'deleted',
            'model' => 'Quote',
            'model_id' => $quote->id,
        ]);

        return response()->json(['message' => 'Quote deleted']);
    }

    public function bulkUpdateStatus(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:quotes,id',
            'status' => 'required|in:draft,sent,accepted,rejected',
        ]);

        $updated = Quote::whereIn('id', $request->ids)
            ->update(['status' => $request->status]);

        return response()->json([
            'message' => $updated . ' quote(s) updated successfully',
            'updated' => $updated
        ]);
    }

    public function send(Request $request, Quote $quote)
    {
        // try {
        //     $this->authorize('update', $quote);
        // } catch (\Exception $e) {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }

        // Validate request
        $validated = $request->validate([
            'to' => 'required|email',
            'cc' => 'nullable|email',
            'subject' => 'nullable|string',
            'message' => 'nullable|string',
        ]);

        if ($quote->status !== 'draft') {
            return response()->json(['message' => 'Only draft quotes can be sent'], 400);
        }

        try {
            // Load quote with all required relationships
            $quote = Quote::with(['client', 'currency', 'items', 'user'])->find($quote->id);
            
            if (!$quote) {
                return response()->json(['message' => 'Quote not found'], 404);
            }
            
            $to = $request->input('to', $quote->client->email);
            $cc = $request->input('cc');
            $subject = $request->input('subject') ?? 'Quote #' . $quote->id . ' from Your Company';
            $message = $request->input('message') ?? 'Please find your quote attached.';

            \Log::info('About to send QuoteMail', [
                'quote_id' => $quote->id,
                'to' => $to,
                'subject' => $subject
            ]);

            // Generate PDF first
            $pdf = Pdf::loadView('pdf.quote', ['quote' => $quote]);
            $pdfContent = $pdf->output();
            
            // Use Mail::html instead of Mailable to avoid serialization issues
            try {
                \Mail::html(view('emails.quote', [
                    'quote' => $quote,
                    'customMessage' => $message
                ])->render(), function ($mailMessage) use ($to, $cc, $subject, $pdfContent, $quote) {
                    $mailMessage->to($to)
                        ->subject($subject);
                    
                    if ($cc && filter_var($cc, FILTER_VALIDATE_EMAIL)) {
                        $mailMessage->cc($cc);
                    }
                    
                    // Attach PDF
                    $mailMessage->attachData($pdfContent, 'Quote-' . $quote->id . '.pdf', [
                        'mime' => 'application/pdf'
                    ]);
                });
                
                \Log::info('Quote email sent successfully with PDF attachment');
            } catch (\Exception $mailError) {
                \Log::error('Mail::html failed', ['error' => $mailError->getMessage()]);
                return response()->json(['message' => 'Error sending email', 'error' => $mailError->getMessage()], 500);
            }

            $quote->update(['status' => 'sent']);

            Log::create([
                'user_id' => auth()->id(),
                'action' => 'sent',
                'model' => 'Quote',
                'model_id' => $quote->id,
                'details' => ['to' => $to, 'subject' => $subject],
            ]);

            return response()->json(['message' => 'Quote sent successfully']);
        } catch (\Exception $e) {
            \Log::error('Error sending quote', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Error sending quote', 'error' => $e->getMessage()], 500);
        }
    }
    
    public function convertToInvoice(Request $request, Quote $quote)
    {
       // $this->authorize('update', $quote);

        if ($quote->status !== 'accepted') {
            return response()->json(['message' => 'Quote must be accepted to convert'], 400);
        }

        DB::beginTransaction();
        try {
            $invoice = Invoice::create([
                'user_id' => $quote->user_id,
                'client_id' => $quote->client_id,
                'currency_id' => $quote->currency_id,
                'status' => 'draft',
                'due_date' => now()->addDays(30),
                'notes' => $quote->notes,
                'subtotal' => $quote->subtotal,
                'tax_total' => $quote->tax_total,
                'discount_total' => $quote->discount_total,
                'total' => $quote->total,
            ]);

            // Copy items from quote to invoice
            foreach ($quote->items as $quoteItem) {
                $invoice->items()->create([
                    'description' => $quoteItem->description,
                    'quantity' => $quoteItem->quantity,
                    'unit_price' => $quoteItem->unit_price,
                    'tax_rate' => $quoteItem->tax_rate,
                    'discount' => $quoteItem->discount,
                    'total' => $quoteItem->total,
                    'order' => $quoteItem->order,
                ]);
            }

            $quote->update(['status' => 'converted']);

            Log::create([
                'user_id' => auth()->id(),
                'action' => 'converted',
                'model' => 'Quote',
                'model_id' => $quote->id,
                'details' => ['invoice_id' => $invoice->id],
            ]);

            DB::commit();
            return response()->json($invoice->load('client', 'currency', 'items'));
            } catch (\Exception $e) {
                DB::rollBack();
                return response()->json(['message' => 'Error converting quote', 'error' => $e->getMessage()], 500);
            }
    }
    
    public function previewPdf(Quote $quote)
    {
        try {
            $quote->load('client', 'currency', 'items', 'user');

            $options = new Options();
            $options->set('isRemoteEnabled', false);
            $options->set('isJavascriptEnabled', false);
            $options->set('defaultFont', 'serif');
            $options->set('isHtml5ParserEnabled', true);

            $dompdf = new Dompdf($options);
            $html = view('pdf.quote', compact('quote'))->render();
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();

            return response($dompdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Allow-Credentials' => 'true'
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error generating PDF', 'error' => $e->getMessage()], 500)->header('Access-Control-Allow-Origin', '*');
        }
    }
    
    public function generatePdf(Quote $quote)
    {
        try {
            $quote->load('client', 'currency', 'items', 'user');

            $options = new Options();
            $options->set('isRemoteEnabled', false);
            $options->set('isJavascriptEnabled', false);
            $options->set('defaultFont', 'serif');
            $options->set('isHtml5ParserEnabled', true);

            $dompdf = new Dompdf($options);
            $html = view('pdf.quote', compact('quote'))->render();
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();

      //return $dompdf->stream('quote.pdf', ['Attachment' => true]);
      return response($dompdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Allow-Credentials' => 'true'
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error generating PDF', 'error' => $e->getMessage()], 500);
        }
    }
    }
