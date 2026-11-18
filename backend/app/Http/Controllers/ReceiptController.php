<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Dompdf\Dompdf;
use Dompdf\Options;

class ReceiptController extends Controller
{
    public function generatePdf(Request $request)
    {
        $data = $request->all();
        try {
            $options = new Options();
            $options->set('isRemoteEnabled', true);
            $options->set('isJavascriptEnabled', false);
            $options->set('defaultFont', 'serif');
            $options->set('isHtml5ParserEnabled', true);
            $dompdf = new Dompdf($options);
            $html = view('pdf.receipt', ['receipt' => $data])->render();
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();
            return response($dompdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Access-Control-Allow-Origin' => '*',
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error generating PDF', 'error' => $e->getMessage()], 500);
        }
    }

    public function fromInvoice(\App\Models\Invoice $invoice)
    {
        $invoice->load('client', 'currency', 'items', 'user');
        try {
            $options = new Options();
            $options->set('isRemoteEnabled', true);
            $options->set('isJavascriptEnabled', false);
            $options->set('defaultFont', 'serif');
            $options->set('isHtml5ParserEnabled', true);
            $dompdf = new Dompdf($options);
            $html = view('pdf.receipt', ['receipt' => $invoice])->render();
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();
            return response($dompdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Access-Control-Allow-Origin' => '*',
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error generating PDF', 'error' => $e->getMessage()], 500);
        }
    }
}
