<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Invoice;
use App\Models\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\InvoicesExport;
use Dompdf\Dompdf;
use Dompdf\Options;

class InvoiceController extends Controller
{
    public function index()
    {
        //return with invoices and revenues model too
        $invoices = Invoice::with('client', 'currency', 'items')->get();
        $revenues = \App\Models\Revenue::all(); // Assuming Revenue model exists and is accessible
        return response()->json([
            'invoices' => $invoices,
            'revenues' => $revenues,
        ]);
        
    }

    public function store(Request $request)
    {
        $request->validate([
            'invoice_number' => 'nullable|string|max:255|unique:invoices,invoice_number',
            'client_id' => 'required|exists:clients,id',
            'currency_id' => 'required|exists:currencies,id',
            'status' => 'in:draft,paid,unpaid,overdue',
            'due_date' => 'required|date',
            'notes' => 'nullable|string',
            //'terms_and_conditions' => 'nullable|string',
            'custom_fields' => 'nullable|array',
            'custom_fields.*.label' => 'nullable|string|max:255',
            'custom_fields.*.value' => 'nullable|string',
            'trip_show' => 'nullable|string|in:trip,show',
            'trip_show_details' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.discount' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $invoice = Invoice::create([
                'user_id' => auth()->id(),
                'invoice_number' => $request->invoice_number,
                'client_id' => $request->client_id,
                'currency_id' => $request->currency_id,
                'status' => $request->status ?? 'draft',
                'due_date' => $request->due_date,
                'notes' => $request->notes,
                'invoice_logo'=>'https://boltesolutions.net/books/public/Chalelogo.jpg',
               // 'terms_and_conditions' => $request->terms_and_conditions,
                'custom_fields' => $request->custom_fields,
                'trip_show' => $request->trip_show,
                'trip_show_details' => $request->trip_show_details,
                'subtotal' => 0,
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

                $invoice->items()->create([
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

            $invoice->update([
                'subtotal' => $subtotal,
                'tax_total' => $taxTotal,
                'discount_total' => $discountTotal,
                'total' => $subtotal - $discountTotal + $taxTotal,
            ]);

            Log::create([
                'user_id' => auth()->id(),
                'action' => 'created',
                'model' => 'Invoice',
                'model_id' => $invoice->id,
                'details' => ['total' => $invoice->total, 'status' => $invoice->status],
            ]);

            DB::commit();
            return response()->json($invoice->load('client', 'currency', 'items'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating invoice', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Invoice $invoice)
    {
       //this->authorize('view', $invoice);
        return $invoice->load('client', 'currency', 'items');
    }

    public function update(Request $request, Invoice $invoice)
    {
       //this->authorize('update', $invoice);

        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'currency_id' => 'required|exists:currencies,id',
            'status' => 'in:draft,paid,unpaid,overdue',
            'due_date' => 'required|date',
            'notes' => 'nullable|string',
           // 'terms_and_conditions' => 'nullable|string',
            'custom_fields' => 'nullable|array',
            'custom_fields.*.label' => 'nullable|string|max:255',
            'custom_fields.*.value' => 'nullable|string',
            'trip_show' => 'nullable|string|in:trip,show',
            'trip_show_details' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.discount' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $invoice->update([
                'client_id' => $request->client_id,
                'currency_id' => $request->currency_id,
                'status' => $request->status,
                'due_date' => $request->due_date,
                'notes' => $request->notes,
                'invoice_logo'=>'https://boltesolutions.net/books/public/Chalelogo.jpg',
              //  'terms_and_conditions' => $request->terms_and_conditions,
                'custom_fields' => $request->custom_fields,
                'trip_show' => $request->trip_show,
                'trip_show_details' => $request->trip_show_details,
            ]);

            // Delete existing items
            $invoice->items()->delete();

            $subtotal = 0;
            $taxTotal = 0;
            $discountTotal = 0;

            foreach ($request->items as $index => $item) {
                $itemSubtotal = $item['quantity'] * $item['unit_price'];
                $itemDiscount = $item['discount'] ?? 0;
                $itemTax = ($itemSubtotal - $itemDiscount) * (($item['tax_rate'] ?? 0) / 100);
                $itemTotal = $itemSubtotal - $itemDiscount + $itemTax;

                $invoice->items()->create([
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

            $invoice->update([
                'subtotal' => $subtotal,
                'tax_total' => $taxTotal,
                'discount_total' => $discountTotal,
                'total' => $subtotal - $discountTotal + $taxTotal,
            ]);

            Log::create([
                'user_id' => auth()->id(),
                'action' => 'updated',
                'model' => 'Invoice',
                'model_id' => $invoice->id,
                'details' => ['total' => $invoice->total, 'status' => $invoice->status],
            ]);

            DB::commit();
            return response()->json($invoice->load('client', 'currency', 'items'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error updating invoice', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Invoice $invoice)
    {
       //this->authorize('delete', $invoice);
        $invoice->delete();

        Log::create([
            'user_id' => auth()->id(),
            'action' => 'deleted',
            'model' => 'Invoice',
            'model_id' => $invoice->id,
        ]);

        return response()->json(['message' => 'Invoice deleted']);
    }

    public function send(Request $request, Invoice $invoice)
    {
        //$this->authorize('update', $invoice);

        // Validate request
        $validated = $request->validate([
            'to' => 'required|email',
            'cc' => 'nullable|email',
            'subject' => 'nullable|string',
            'message' => 'nullable|string',
        ]);

        if ($invoice->status === 'draft') {
            $invoice->update(['status' => 'unpaid']);
        }

        try {
            // Load invoice with all required relationships
            $invoice = Invoice::with(['client', 'currency', 'items', 'user'])->find($invoice->id);
            
            if (!$invoice) {
                return response()->json(['message' => 'Invoice not found'], 404);
            }
            
            $to = $request->input('to', $invoice->client->email);
            $cc = $request->input('cc');
            $subject = $request->input('subject') ?? 'Invoice #' . $invoice->invoice_number . ' from Your Company';
            $message = $request->input('message') ?? 'Please find your invoice attached.';

            \Log::info('About to send Invoice email', [
                'invoice_id' => $invoice->id,
                'to' => $to,
                'subject' => $subject
            ]);

            // Generate PDF with remote images (e.g. logo) enabled
            $options = new Options();
            $options->set('isRemoteEnabled', true);
            $options->set('isJavascriptEnabled', false);
            $options->set('defaultFont', 'serif');
            $options->set('isHtml5ParserEnabled', true);

            $dompdf = new Dompdf($options);
            $html = view('pdf.invoice', ['invoice' => $invoice])->render();
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();
            $pdfContent = $dompdf->output();
            
            // Use Mail::html instead of Mailable to avoid serialization issues
            try {
                \Mail::html(view('emails.invoice', [
                    'invoice' => $invoice,
                    'customMessage' => $message
                ])->render(), function ($mailMessage) use ($to, $cc, $subject, $pdfContent, $invoice) {
                    $mailMessage->to($to)
                        ->subject($subject);
                    
                    if ($cc && filter_var($cc, FILTER_VALIDATE_EMAIL)) {
                        $mailMessage->cc($cc);
                    }
                    
                    // Attach PDF
                    $mailMessage->attachData($pdfContent, 'Invoice-' . $invoice->invoice_number . '.pdf', [
                        'mime' => 'application/pdf'
                    ]);
                });
                
                \Log::info('Invoice email sent successfully with PDF attachment');
            } catch (\Exception $mailError) {
                \Log::error('Mail::html failed', ['error' => $mailError->getMessage()]);
                return response()->json(['message' => 'Error sending email', 'error' => $mailError->getMessage()], 500);
            }

            Log::create([
                'user_id' => auth()->id(),
                'action' => 'sent',
                'model' => 'Invoice',
                'model_id' => $invoice->id,
                'details' => ['to' => $to, 'subject' => $subject],
            ]);

            return response()->json(['message' => 'Invoice sent successfully']);
        } catch (\Exception $e) {
            \Log::error('Error sending invoice', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Error sending invoice', 'error' => $e->getMessage()], 500);
        }
    }

    public function previewPdf(Invoice $invoice)
    {
        try {
            $invoice->load('client', 'currency', 'items', 'user');

            $options = new Options();
            $options->set('isRemoteEnabled', true);
            $options->set('isJavascriptEnabled', false);
            $options->set('defaultFont', 'serif');
            $options->set('isHtml5ParserEnabled', true);

            $dompdf = new Dompdf($options);
            $html = view('pdf.invoice', compact('invoice'))->render();
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

    public function generatePdf(Invoice $invoice)
    {
        try {
            $invoice->load('client', 'currency', 'items', 'user');

            $options = new Options();
            $options->set('isRemoteEnabled', true);
            $options->set('isJavascriptEnabled', false);
            $options->set('defaultFont', 'serif');
            $options->set('isHtml5ParserEnabled', true);

            $dompdf = new Dompdf($options);
            $html = view('pdf.invoice', compact('invoice'))->render();
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
            return response()->json(['message' => 'Error generating PDF', 'error' => $e->getMessage()], 500);
        }
    }

    public function export()
    {
        return Excel::download(new InvoicesExport, 'invoices.xlsx');
    }
    
    public function bulkUpdateStatus(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:invoices,id',
            'status' => 'required|in:draft,paid,unpaid,overdue',
        ]);

        $updated = Invoice::whereIn('id', $request->ids)
            ->update(['status' => $request->status]);

        return response()->json([
            'message' => $updated . ' invoice(s) updated successfully',
            'updated' => $updated
        ]);
    }
}
