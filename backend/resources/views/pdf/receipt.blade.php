<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt</title>
<style>
body { font-family: 'Helvetica', sans-serif; color:#333; padding:30px; }
.header { text-align:center; border-bottom:2px solid #222; padding-bottom:10px; margin-bottom:20px; }
.header h1 { margin:0; letter-spacing:2px; }
.meta { display:flex; justify-content:space-between; margin-bottom:20px; }
.meta div { width:48%; }
table { width:100%; border-collapse:collapse; margin-top:10px; }
th,td { border:1px solid #ddd; padding:8px; }
th { background:#f2f2f2; }
.total { text-align:right; font-weight:bold; margin-top:15px; font-size:16px; }
.footer { margin-top:30px; text-align:center; font-size:12px; color:#777; }
</style></head>
<body>
<div class="header"><h1>RECEIPT</h1><p>Chale Books</p></div>
<div class="meta">
  <div>
    @if(is_object($receipt))
      <strong>Invoice #:</strong> {{ $receipt->invoice_number }}<br>
      <strong>Client:</strong> {{ $receipt->client->name ?? '' }}<br>
      <strong>Date:</strong> {{ $receipt->created_at ?? '' }}
    @else
      <strong>Notes:</strong> {{ $receipt['notes'] ?? '' }}
    @endif
  </div>
  <div style="text-align:right;">
    @if(is_object($receipt))
      <strong>Currency:</strong> {{ $receipt->currency->code ?? '' }}<br>
      <strong>Status:</strong> {{ strtoupper($receipt->status ?? '') }}
    @endif
  </div>
</div>
@if(is_object($receipt) && $receipt->items)
<table>
  <thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
  <tbody>
  @foreach($receipt->items as $item)
    <tr>
      <td>{{ $item->description }}</td>
      <td>{{ $item->quantity }}</td>
      <td>{{ number_format($item->unit_price,2) }}</td>
      <td>{{ number_format($item->quantity * $item->unit_price,2) }}</td>
    </tr>
  @endforeach
  </tbody>
</table>
<div class="total">Total: {{ $receipt->currency->symbol ?? '' }}{{ number_format($receipt->total,2) }}</div>
@elseif(isset($receipt['items']))
<table>
  <thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
  <tbody>
  @foreach($receipt['items'] as $item)
    <tr>
      <td>{{ $item['description'] }}</td>
      <td>{{ $item['quantity'] }}</td>
      <td>{{ number_format($item['unit_price'],2) }}</td>
      <td>{{ number_format($item['quantity'] * $item['unit_price'],2) }}</td>
    </tr>
  @endforeach
  </tbody>
</table>
@endif
<div class="footer">Thank you for your business.</div>
</body></html>
