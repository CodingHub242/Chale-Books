<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quote #{{ $quote->id }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: bold; }
        .quote-title { font-size: 18px; }
        .section { margin: 20px 0; }
        .label { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
        .total { font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{ $quote->user ? $quote->user->name : 'Company Name' }}</div>
        <div class="quote-title">QUOTATION</div>
    </div>

    <div class="section">
        <div><span class="label">Quote #:</span> {{ $quote->id }}</div>
        <div><span class="label">Date:</span> {{ $quote->created_at ? $quote->created_at->format('F d, Y') : 'N/A' }}</div>
        <div><span class="label">Client:</span> {{ $quote->client ? $quote->client->name : 'N/A' }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @forelse($quote->items as $item)
            <tr>
                <td>{{ $item->description }}</td>
                <td>{{ $item->quantity }}</td>
                <td>{{ number_format($item->unit_price, 2) }}</td>
                <td>{{ number_format($item->total, 2) }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="4">No items</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="section">
        <div class="total">Total: {{ number_format($quote->total, 2) }} {{ $quote->currency ? $quote->currency->code : 'USD' }}</div>
    </div>
</body>
</html>
