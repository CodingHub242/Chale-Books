<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Receipt</title>

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #26332F;
            background: #F4F6F5;
            margin: 0;
            padding: 35px 20px;
            font-size: 13px;
            line-height: 1.5;
        }

        .receipt {
            max-width: 850px;
            margin: auto;
            background: #FFFFFF;
            border: 1px solid #E5EAE7;
            border-radius: 10px;
            overflow: hidden;
        }

        .top-bar {
            height: 7px;
            background: #183B32;
        }

        .content {
            padding: 40px 45px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 30px;
            border-bottom: 1px solid #E5EAE7;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .logo {
            max-width: 75px;
            max-height: 65px;
            object-fit: contain;
        }

        .brand-name {
            font-size: 21px;
            font-weight: 700;
            color: #183B32;
            letter-spacing: -0.5px;
        }

        .brand-caption {
            color: #84918B;
            font-size: 11px;
            margin-top: 3px;
        }

        .receipt-heading {
            text-align: right;
        }

        .receipt-heading h1 {
            margin: 0;
            color: #183B32;
            font-size: 27px;
            letter-spacing: 1.5px;
        }

        .receipt-heading p {
            margin: 4px 0 0;
            color: #89958F;
            font-size: 10px;
            letter-spacing: 1.5px;
        }

        .status {
            display: inline-block;
            margin-top: 10px;
            padding: 5px 13px;
            border-radius: 20px;
            background: #EAF4ED;
            color: #287548;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.7px;
        }

        .details {
            display: flex;
            justify-content: space-between;
            gap: 35px;
            padding: 28px 0;
        }

        .details-column {
            width: 50%;
        }

        .section-label {
            color: #89958F;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            margin-bottom: 10px;
        }

        .detail-line {
            margin-bottom: 7px;
            color: #43524B;
        }

        .detail-line strong {
            color: #26332F;
        }

        .customer-name {
            font-size: 16px;
            font-weight: 700;
            color: #183B32;
            margin-bottom: 5px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        thead {
            background: #F1F5F2;
        }

        th {
            color: #53645C;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.7px;
            text-transform: uppercase;
            padding: 13px 12px;
            text-align: left;
        }

        td {
            padding: 15px 12px;
            border-bottom: 1px solid #EAEFEC;
            color: #43524B;
            vertical-align: middle;
        }

        th:nth-child(n+2),
        td:nth-child(n+2) {
            text-align: right;
        }

        .description {
            color: #26332F;
            font-weight: 600;
        }

        .summary {
            width: 100%;
            max-width: 330px;
            margin: 25px 0 0 auto;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            color: #65736C;
        }

        .summary-total {
            border-top: 2px solid #183B32;
            margin-top: 8px;
            padding-top: 15px;
            color: #183B32;
            font-size: 19px;
            font-weight: 700;
        }

        .summary-total span:last-child {
            white-space: nowrap;
        }

        .payment-note {
            margin-top: 35px;
            padding: 18px 20px;
            background: #F1F5F2;
            border-radius: 7px;
            color: #43524B;
        }

        .payment-note strong {
            color: #183B32;
            display: block;
            margin-bottom: 4px;
        }

        .footer {
            margin-top: 40px;
            padding-top: 22px;
            border-top: 1px solid #E5EAE7;
            text-align: center;
        }

        .footer-title {
            font-size: 15px;
            font-weight: 700;
            color: #183B32;
            margin-bottom: 5px;
        }

        .footer-text {
            font-size: 11px;
            color: #89958F;
        }

        .footer-brand {
            margin-top: 18px;
            font-size: 10px;
            color: #A0AAA5;
        }

        @media print {
            body {
                background: #FFFFFF;
                padding: 0;
            }

            .receipt {
                max-width: 100%;
                border: none;
                border-radius: 0;
            }

            .content {
                padding: 30px;
            }

            .top-bar {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            thead, .payment-note, .status {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }

        @media screen and (max-width: 600px) {
            body {
                padding: 10px;
            }

            .content {
                padding: 25px 18px;
            }

            .header {
                gap: 15px;
                flex-wrap: wrap;
            }

            .receipt-heading {
                text-align: left;
            }

            .details {
                gap: 15px;
            }
        }
    </style>
</head>

<body>

@php
    $isObject = is_object($receipt);

    $items = $isObject
        ? ($receipt->items ?? [])
        : ($receipt['items'] ?? []);

    $client = $isObject
        ? ($receipt->client ?? null)
        : null;

    $currency = $isObject
        ? ($receipt->currency ?? null)
        : null;

    $currencySymbol = $currency->symbol ?? '';
    $currencyCode = $currency->code ?? '';

    $invoiceNumber = $isObject
        ? ($receipt->invoice_number ?? '')
        : '';

    $receiptDate = $isObject
        ? ($receipt->created_at ?? '')
        : '';

    $clientName = $isObject
        ? ($client->name ?? '')
        : '';

    $total = $isObject
        ? ($receipt->total ?? 0)
        : 0;

    $status = $isObject
        ? strtoupper($receipt->status ?? '')
        : '';

    $notes = $isObject
        ? ''
        : ($receipt['notes'] ?? '');
@endphp

<div class="receipt">

    <div class="top-bar"></div>

    <div class="content">

        <!-- Company identity and receipt heading -->
        <div class="header">

            <div class="brand">
                @if(!empty($receipt->invoice_logo))
                    <img
                        src="{{ $receipt->invoice_logo }}"
                        class="logo"
                        alt="Company Logo"
                    >
                @else
                    <div class="brand-name">Chale Books</div>
                @endif
            </div>

            <div class="receipt-heading">
                <h1>RECEIPT</h1>
                <p>PAYMENT RECORD</p>

                @if($status)
                    <span class="status">{{ $status }}</span>
                @endif
            </div>

        </div>

        <!-- Receipt information -->
        <div class="details">

            <div class="details-column">

                <div class="section-label">Invoice Information</div>

                @if($isObject)

                    <div class="detail-line">
                        <strong>Invoice Number:</strong>
                        {{ $invoiceNumber }}
                    </div>

                    <div class="detail-line">
                        <strong>Issue Date:</strong>
                        {{ $receiptDate }}
                    </div>

                    <div class="detail-line">
                        <strong>Currency:</strong>
                        {{ $currencyCode }}
                    </div>

                @else

                    <div class="detail-line">
                        <strong>Notes:</strong>
                        {{ $notes }}
                    </div>

                @endif

            </div>

            <div class="details-column">

                <div class="section-label">Billed To</div>

                @if($isObject)

                    <div class="customer-name">
                        {{ $clientName ?: 'Customer' }}
                    </div>

                @else

                    <div class="customer-name">
                        Chale Books Customer
                    </div>

                @endif

            </div>

        </div>

        <!-- Items -->
        @if($items && count($items))

            <div class="section-label">Transaction Details</div>

            <table>

                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>

                <tbody>

                    @foreach($items as $item)

                        @php
                            $description = $isObject
                                ? ($item->description ?? '')
                                : ($item['description'] ?? '');

                            $quantity = $isObject
                                ? ($item->quantity ?? 0)
                                : ($item['quantity'] ?? 0);

                            $unitPrice = $isObject
                                ? ($item->unit_price ?? 0)
                                : ($item['unit_price'] ?? 0);

                            $lineTotal = $quantity * $unitPrice;
                        @endphp

                        <tr>
                            <td class="description">
                                {{ $description }}
                            </td>

                            <td>{{ $quantity }}</td>

                            <td>
                                {{ $currencySymbol }}{{ number_format($unitPrice, 2) }}
                            </td>

                            <td>
                                {{ $currencySymbol }}{{ number_format($lineTotal, 2) }}
                            </td>
                        </tr>

                    @endforeach

                </tbody>

            </table>

        @endif

        <!-- Total summary -->
        @if($isObject)

            <div class="summary">

                <div class="summary-row">
                    <span>Invoice Total</span>
                    <span>
                        {{ $currencySymbol }}{{ number_format($total, 2) }}
                    </span>
                </div>

                <div class="summary-row summary-total">
                    <span>Total Amount</span>
                    <span>
                        {{ $currencySymbol }}{{ number_format($total, 2) }}
                    </span>
                </div>

            </div>

        @elseif(isset($receipt['total']))

            <div class="summary">

                <div class="summary-row summary-total">
                    <span>Total Amount</span>
                    <span>
                        {{ number_format($receipt['total'], 2) }}
                    </span>
                </div>

            </div>

        @endif

        <!-- Footer -->
        <div class="payment-note">
            <strong>Thank you for your business.</strong>
            We appreciate your trust and look forward to serving you again.
        </div>

        <div class="footer">

            <div class="footer-title">
                Thank You!
            </div>

            <div class="footer-text">
                This document was electronically generated.
            </div>

            <div class="footer-brand">
                Powered by ChaleApp
            </div>

        </div>

    </div>

</div>

</body>
</html>