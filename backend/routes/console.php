<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('mail:test {email?}', function ($email = 'test@example.com') {
    $this->info('Sending test email to: ' . $email);
    
    try {
        \Illuminate\Support\Facades\Mail::raw('This is a test email from ChaleBooks', function($msg) use ($email) {
            $msg->to($email)->subject('Test Email');
        });
        
        $this->info('Email sent successfully!');
    } catch (\Exception $e) {
        $this->error('Failed to send email: ' . $e->getMessage());
    }
})->purpose('Test email configuration');

Schedule::command('invoices:generate-recurring')->daily();



