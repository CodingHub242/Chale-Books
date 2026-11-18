<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Quote #{{ $quote->id }}</title>
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
        /*     background: linear-gradient(135deg, #073336 0%, orange 100%);*/
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
        .quote-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .quote-info h2 {
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
            background: linear-gradient(135deg, #073336 0%, orange 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <!--<div class="header" style="background: linear-gradient(155deg, #073336 0%, orange 100%); color: white; padding: 20px; margin: -20px -20px 20px -20px; border-radius: 10px 10px 0 0;">-->
    <!--    <h1>Quote #{{ $quote->id }}</h1>-->
    <!--    <p>From: {{ $quote->user->name ?? 'Chale App' }}</p>-->
    <!--</div>-->
    
    <div class="content">
        @if(isset($customMessage) && $customMessage)
        <div class="message-content" style="margin: 20px 0; padding: 20px; background: #f8f9fa; border-left: 4px solid #073336; white-space: pre-wrap; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6;">
            {!! nl2br(e($customMessage)) !!}
        </div>
        @endif
        
        <div class="quote-info" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2>Quote Details</h2>
            <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
                <span class="label" style="font-weight: 600; color: #666;">Quote Number:</span>
                <span class="" style="margin-left:3px;">#{{ $quote->id }}</span>
            </div>
            <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
                <span class="label" style="font-weight: 600; color: #666;">Client:</span>
                <span class="" style="margin-left:3px;">{{ $quote->client->name ?? 'N/A' }}</span>
            </div>
            <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
                <span class="label" style="font-weight: 600; color: #666;">Email:</span>
                <span class="" style="margin-left:3px;">{{ $quote->client->email ?? 'N/A' }}</span>
            </div>
            
            <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span class="label" style="font-weight: 600; color: #666;">Total Amount:</span>
                <span class="" style="margin-left:3px;color:#073336;">{{ $quote->currency->code ?? 'GHS' }} {{ number_format($quote->total, 2) }}</span>
            </div>
           
        </div>
        
        @if($quote->notes)
        <div class="quote-info">
            <h2>Notes</h2>
            <p>{!! nl2br(e($quote->notes)) !!}</p>
        </div>
        @endif
        
        <p style="text-align: center;">
            Please find the quote PDF attached to this email for more details.
        </p>
    </div>
    
    <div class="footer">
        <p>This email was sent from Chale App</p>
        <p>&copy; {{ date('Y') }} {{ $quote->user->name ?? 'Chale App' }}. All rights reserved.</p>
    </div>
</body>
</html>
