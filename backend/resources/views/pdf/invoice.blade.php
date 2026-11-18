<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6; }
        .container { padding: 40px; }
        
        .top-section {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }
        
        .left-column {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 40px;
        }
        
        .right-column {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            text-align: right;
        }
        
        .logo-section {
            margin-bottom: 20px;
        }
        
         .logo-placeholder {
            width: 200px;
            height: 120px;
            /*border: 2px dashed #ccc;*/
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 12px;
            margin-bottom: 10px;
            overflow: hidden;
            /*background: #f8f9fa;*/
        }
        
        .logo-placeholder img {
            width: 100%;
            height: 100%;
            /*object-fit: contain;*/
        }
        
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #073336;
            margin-bottom: 5px;
        }
        
        .bill-to-section {
            margin-top: 30px;
        }
        
        .section-title {
            font-weight: bold;
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 10px;
        }
        
        .bill-to-name {
            font-weight: 600;
            margin-bottom: 5px;
            color: #333;
        }
        
        .invoice-header-right {
            text-align: right;
        }
        
        .invoice-title {
            font-size: 32px;
            font-weight: bold;
            color: #073336;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .invoice-number {
            font-size: 16px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .balance-due {
            font-size: 18px;
            font-weight: bold;
            color: #073336;
            margin-top: 10px;
            padding: 8px 16px;
            background: #f8f9fa;
            border-radius: 6px;
            display: inline-block;
            margin-left: auto;
        }
        
        .details-section {
            padding-top: 5px;
        }
        
        .notes-content {
            white-space: pre-wrap;
            line-height: 1.6;
        }
        
        .details-grid {
            display: table;
            width: 100%;
        }
        
        .details-left {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }
        
        .details-right {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            text-align: right;
        }
        
        .detail-row {
            margin: 8px 0;
            font-size: 13px;
        }
        
        .detail-label {
            font-weight: 600;
            color: #555;
            top: 3px;
            position: relative;
            display: inline-block;
            min-width: 120px;
        }
        
        .detail-value {
            color: #333;
        }
        
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 30px 0; 
        }
        
        thead { 
            background-color: #073336; 
            color: white; 
        }
        
        th { 
            padding: 14px 10px; 
            text-align: left; 
            font-weight: 600; 
            font-size: 12px; 
            text-transform: uppercase; 
        }
        
        td { 
            padding: 14px 10px; 
            border-bottom: 1px solid #e0e0e0; 
            font-size: 13px; 
        }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        .totals-section { 
            float: right; 
            width: 400px; 
            margin-top: 20px; 
        }
        
        .totals-row { 
            display: table; 
            width: 100%; 
            padding: 10px 0; 
        }
        
        .totals-label { 
            display: table-cell; 
            text-align: right; 
            padding-right: 20px; 
            font-weight: 600; 
        }
        
        .totals-value { 
            display: table-cell; 
            text-align: right; 
            width: 140px; 
        }
        
        .grand-total { 
            font-size: 20px; 
            font-weight: bold; 
            color: #073336; 
            border-top: 3px solid #073336; 
            padding-top: 15px; 
            margin-top: 15px; 
        }
        
        .notes-section { 
            clear: both; 
            margin-top: 50px; 
            padding: 20px; 
            background-color: #f9f9f9; 
            border-left: 4px solid #073336; 
            border-radius: 4px;
        }
        
        .notes-title { 
            font-weight: bold; 
            margin-bottom: 10px; 
            color: #333; 
            text-transform: uppercase;
            font-size: 12px;
        }
        
        .footer { 
            margin-top: 60px; 
            text-align: center; 
            font-size: 11px; 
            color: #999; 
            border-top: 1px solid #e0e0e0; 
            padding-top: 20px; 
        }
        
        .status-badge { 
            display: inline-block; 
            padding: 6px 14px; 
            border-radius: 4px; 
            font-size: 11px; 
            font-weight: bold; 
            text-transform: uppercase; 
        }
        
        .status-paid { background-color: #2b742d; color: white; }
        .status-unpaid { background-color: #FF9800; color: white; }
        .status-overdue { background-color: #F44336; color: white; }
        .status-draft { background-color: #FF9800; color: white; }
        
        .payment-terms { 
            margin-top: 30px; 
            padding: 15px; 
            background-color: #fff3cd; 
            border-left: 4px solid #ffc107; 
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Top Section: Left (Logo + Company + Bill To) and Right (Invoice Title + Number + Balance) -->
        <div class="top-section">
            <div class="left-column">
                <div class="logo-section">
                    <div class="logo-placeholder">
                            <img src="{{$invoice->invoice_logo}}" alt="">
                        
                    </div>
                    <div class="company-name">{{ $invoice->user ? $invoice->user->name : 'Company Name' }}</div>
                </div>
                
                <div class="bill-to-section">
                    <div class="section-title">Bill To</div>
                    <div class="bill-to-name">{{ $invoice->client ? $invoice->client->name : 'Client Name' }}</div>
                    <div>{{ $invoice->client ? $invoice->client->email : 'client@example.com' }}</div>
                    @if($invoice->client && $invoice->client->phone)
                    <div>{{ $invoice->client->phone }}</div>
                    @endif
                    @if($invoice->client && $invoice->client->address)
                    <div>{{ $invoice->client->address }}</div>
                    @endif
                </div>

                <div class="details">
                    <div class="detail-row">
                        <span class="status-badge status-{{ $invoice->status }}">{{ $invoice->status }}</span>
                    </div>
                </div>
            </div>
            
            <div class="right-column">
                <div class="invoice-header-right">
                    <div class="invoice-title">Invoice</div>
                    <div class="invoice-number">#{{ $invoice->invoice_number }}</div>
                    <!-- Details Section: Below the top section -->
                    <div class="details-section">
                        <div class="details-grid">
                            <div class="details-right">
                                <div class="detail-row">
                                    <span class="detail-label">Invoice Date:</span>
                                    <span class="detail-value">{{ $invoice->created_at->format('F d, Y') }}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Terms:</span>
                                    <span class="detail-value">Due On Receipt</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Due Date:</span>
                                    <span class="detail-value">{{ $invoice->due_date->format('F d, Y') }}</span>
                                </div>
                                @if($invoice->trip_show && $invoice->trip_show_details)
                                <div class="detail-row">
                                    <span class="detail-label">{{ ucfirst($invoice->trip_show) }}:</span>
                                    <span class="detail-value">{{ $invoice->trip_show_details }}</span>
                                </div>
                                @endif
                            </div>
                        </div>
                    </div>
                    <div class="balance-due">
                        Balance Due: {{ number_format($invoice->total, 2) }} {{ $invoice->currency ? $invoice->currency->code : 'N/A' }}
                    </div>
                </div>
            </div>
        </div>

        

        @if($invoice->custom_fields && count($invoice->custom_fields) > 0)
        <div class="custom-fields-section" style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <div class="section-title" style="font-weight: bold; font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 10px;">Additional Information</div>
            <div class="custom-fields-grid" style="display: table; width: 100%;">
                @foreach($invoice->custom_fields as $field)
                @if(!empty($field['label']) && !empty($field['value']))
                <div class="custom-field-row" style="display: table-row; padding: 5px 0;">
                    <div class="custom-field-label" style="display: table-cell; font-weight: 600; color: #555; width: 8%; padding: 5px 0;">{{ $field['label'] }}:</div>
                    <div class="custom-field-value" style="display: table-cell; color: #333; padding: 5px 0;">{{ $field['value'] }}</div>
                </div>
                @endif
                @endforeach
            </div>
        </div>
        @endif

        <!-- Items Table -->
        <table>
            <thead>
                <tr>
                    <th style="width: 40%;">Item & Description</th>
                    <th class="text-center" style="width: 10%;">Qty</th>
                    <th class="text-right" style="width: 15%;">Unit Price</th>
                    <th class="text-center" style="width: 10%;">Tax</th>
                    <th class="text-right" style="width: 10%;">Discount</th>
                    <th class="text-right" style="width: 15%;">Total</th>
                </tr>
            </thead>
            <tbody>
                @forelse($invoice->items as $item)
                <tr>
                    <td>{{ $item->description }}</td>
                    <td class="text-center">{{ $item->quantity }}</td>
                    <td class="text-right">{{ number_format($item->unit_price, 2) }}</td>
                    <td class="text-center">{{ $item->tax_rate }}%</td>
                    <td class="text-right">{{ number_format($item->discount, 2) }}</td>
                    <td class="text-right">{{ number_format($item->total, 2) }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="text-center" style="padding: 30px; color: #999;">No items</td>
                </tr>
                @endforelse
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
            <div class="totals-row">
                <div class="totals-label">Subtotal:</div>
                <div class="totals-value">{{ number_format($invoice->subtotal ?: 0, 2) }} {{ $invoice->currency ? $invoice->currency->code : 'N/A' }}</div>
            </div>
            @if(($invoice->discount_total ?? 0) > 0)
            <div class="totals-row">
                <div class="totals-label">Discount:</div>
                <div class="totals-value">-{{ number_format($invoice->discount_total, 2) }} {{ $invoice->currency ? $invoice->currency->code : 'N/A' }}</div>
            </div>
            @endif
            <div class="totals-row">
                <div class="totals-label">Tax:</div>
                <div class="totals-value">{{ number_format($invoice->tax_total ?? 0, 2) }} {{ $invoice->currency ? $invoice->currency->code : 'N/A' }}</div>
            </div>
            <div class="totals-row grand-total">
                <div class="totals-label">TOTAL:</div>
                <div class="totals-value">{{ number_format($invoice->total, 2) }} {{ $invoice->currency ? $invoice->currency->code : 'N/A' }}</div>
            </div>
        </div>

        <div style="clear: both;"></div>

       

        @if($invoice->notes)
        <div class="notes-section">
            <div class="notes-title">Notes:</div>
            <div class="notes-content">{!! nl2br(e($invoice->notes)) !!}</div>
        </div>
        @endif

        @if($invoice->terms_and_conditions)
        <div class="notes-section">
            <div class="notes-title">Terms and Conditions:</div>
              <div class="notes-content">{!! nl2br(e($invoice->terms_and_conditions)) !!}</div> 
        </div>
        @endif

        <div class="footer">
            <p>Thank you for your business!</p>
        </div>
    </div>
</body>
</html>
