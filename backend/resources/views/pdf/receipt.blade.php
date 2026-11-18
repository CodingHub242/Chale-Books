<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt</title></head>
<body style="font-family: serif; padding:20px;">
<h1>Receipt</h1>
@if(is_object($receipt))
  <p>Invoice: {{ $receipt->invoice_number }}</p>
  <p>Client: {{ $receipt->client->name ?? '' }}</p>
  <p>Total: {{ $receipt->currency->symbol ?? '' }}{{ number_format($receipt->total,2) }}</p>
@else
  <p>{{ $receipt['notes'] ?? '' }}</p>
  @if(isset($receipt['items']))
  <table border="1" cellpadding="5" cellspacing="0" width="100%">
    <tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
    @foreach($receipt['items'] as $item)
      <tr>
        <td>{{ $item['description'] }}</td>
        <td>{{ $item['quantity'] }}</td>
        <td>{{ $item['unit_price'] }}</td>
        <td>{{ $item['quantity'] * $item['unit_price'] }}</td>
      </tr>
    @endforeach
  </table>
  @endif
@endif
</body></html>
