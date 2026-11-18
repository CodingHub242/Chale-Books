<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});


Route::get('/clear-route', function () {
//Artisan::call('cache:clear');
//Artisan::call('optimize:clear');
//Artisan::call('route:clear');
//Artisan::call('config:clear');
Artisan::call('mail:test jonathanattram@gmail.com');
//Artisan::call('storage:link');
//Artisan::call('migrate --path=/database/migrations/2026_02_04_120000_create_expense_categories_table.php');
return 'Config Refreshed';
});