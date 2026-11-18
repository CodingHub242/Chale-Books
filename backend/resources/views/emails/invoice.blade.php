<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Invoice #{{ $invoice->invoice_number }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        /*.header {*/
        /*    background: linear-gradient(135deg, #073336 0%, orange 100%);*/
        /*    color: white;*/
        /*    padding: 30px;*/
        /*    border-radius: 10px 10px 0 0;*/
        /*    text-align: center;*/
        /*}*/
        /*.content {*/
        /*    background: #ffffff;*/
        /*    padding: 30px;*/
        /*    border: 1px solid #e0e0e0;*/
        /*    border-top: none;*/
        /*    border-radius: 0 0 10px 10px;*/
        /*}*/
        .invoice-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .invoice-info h2 {
            margin-top: 0;
            color: #073336;
        }
        /*.info-row {*/
        /*    display: flex;*/
        /*    justify-content: space-between;*/
        /*    padding: 10px 0;*/
        /*    border-bottom: 1px solid #e0e0e0;*/
        /*}*/
        /*.info-row:last-child {*/
        /*    border-bottom: none;*/
        /*}*/
        .label {
            font-weight: 600;
            color: #666;
        }
        .value {
            color: #333;
        }
        .amount {
            font-size: 24px;
            font-weight: 700;
            color: #073336;
        }
        .message-content {
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-left: 4px solid #073336;
            white-space: pre-wrap;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .items-table th,
        .items-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        .items-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #073336;
        }
        .items-table .amount-col {
            text-align: right;
        }
        .total-section {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
        }
        .grand-total {
            font-size: 20px;
            font-weight: 700;
            color: #073336;
        }
        .notes {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #999;
            font-size: 12px;
        }
        .btn {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #073336 0%, #4CAF50 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <!--<div class="header">-->
    <!--    <h1>Invoice #{{ $invoice->invoice_number }}</h1>-->
    <!--    <p>From: {{ $invoice->user->name ?? 'Chale App' }}</p>-->
    <!--</div>-->
    
    <div class="content">
        @if(isset($customMessage) && $customMessage)
        <div class="message-content" style="margin: 20px 0; padding: 20px; background: #f8f9fa; border-left: 4px solid #073336; white-space: pre-wrap; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6;">
            {!! nl2br(e($customMessage)) !!}
        </div>
        @endif
        
        <!--<div class="invoice-info">-->
        <!--    <h2>Invoice Details</h2>-->
        <!--    <div class="info-row">-->
        <!--        <span class="label">Invoice Number:</span>-->
        <!--        <span class="value">#{{ $invoice->invoice_number }}</span>-->
        <!--    </div>-->
        <!--    <div class="info-row">-->
        <!--        <span class="label">Client:</span>-->
        <!--        <span class="" style="margin-left:3px;">{{ $invoice->client->name ?? 'N/A' }}</span>-->
        <!--    </div>-->
        <!--    <div class="info-row">-->
        <!--        <span class="label">Email:</span>-->
        <!--        <span class="" style="margin-left:3px;">{{ $invoice->client->email ?? 'N/A' }}</span>-->
        <!--    </div>-->
        <!--    <div class="info-row">-->
        <!--        <span class="label">Invoice Date:</span>-->
        <!--        <span class="" style="margin-left:3px;">{{ $invoice->created_at ? \Carbon\Carbon::parse($invoice->created_at)->format('F j, Y') : 'N/A' }}</span>-->
        <!--    </div>-->
        <!--    <div class="info-row">-->
        <!--        <span class="label">Due Date:</span>-->
        <!--        <span class="" style="margin-left:3px;">{{ \Carbon\Carbon::parse($invoice->due_date)->format('F j, Y') }}</span>-->
        <!--    </div>-->
        <!--    <div class="info-row">-->
        <!--        <span class="label">Status:</span>-->
        <!--        <span class="" style="margin-left:3px;">{{ ucfirst($invoice->status) }}</span>-->
        <!--    </div>-->
        <!--</div>-->
        
        <!--<table class="items-table">-->
        <!--    <thead>-->
        <!--        <tr>-->
        <!--            <th>Description</th>-->
        <!--            <th class="amount-col">Qty</th>-->
        <!--            <th class="amount-col">Price</th>-->
        <!--            <th class="amount-col">Tax</th>-->
        <!--            <th class="amount-col">Total</th>-->
        <!--        </tr>-->
        <!--    </thead>-->
        <!--    <tbody>-->
        <!--        @foreach($invoice->items as $item)-->
        <!--        <tr>-->
        <!--            <td>{{ $item->description }}</td>-->
        <!--            <td class="amount-col">{{ $item->quantity }}</td>-->
        <!--            <td class="amount-col">{{ number_format($item->unit_price, 2) }}</td>-->
        <!--            <td class="amount-col">{{ $item->tax_rate }}%</td>-->
        <!--            <td class="amount-col">{{ number_format($item->total, 2) }}</td>-->
        <!--        </tr>-->
        <!--        @endforeach-->
        <!--    </tbody>-->
        <!--</table>-->
        
        <div class="total-section">
            <div class="total-row">
                <span class="label">Subtotal:</span>
                <span class="" style="margin-left:3px;">{{ $invoice->currency->code ?? 'GHS' }} {{ number_format($invoice->subtotal, 2) }}</span>
            </div>
            @if($invoice->discount_total > 0)
            <div class="total-row">
                <span class="label">Discount:</span>
                <span class="" style="margin-left:3px;">-{{ $invoice->currency->code ?? 'GHS' }} {{ number_format($invoice->discount_total, 2) }}</span>
            </div>
            @endif
            <div class="total-row">
                <span class="label">Tax:</span>
                <span class="" style="margin-left:3px;">{{ $invoice->currency->code ?? 'GHS' }} {{ number_format($invoice->tax_total, 2) }}</span>
            </div>
            <div class="total-row grand-total">
                <span>Total:</span>
                <span style="margin-left:3px;">{{ $invoice->currency->code ?? 'GHS' }} {{ number_format($invoice->total, 2) }}</span>
            </div>
        </div>
        
        @if($invoice->notes)
        <div class="notes">
            <h3>Notes</h3>
            <p>{!! nl2br(e($invoice->notes)) !!}</p>
        </div>
        @endif
        
        <p style="text-align: center;">
            Please find the invoice PDF attached to this email for more details.
        </p>
    </div>
    
    <div class="footer">
        <p>This email was sent from Chale App</p>
        <p>&copy; {{ date('Y') }} {{ $invoice->user->name ?? 'Chale App' }}. All rights reserved.</p>
    </div>
</body>
</html>
