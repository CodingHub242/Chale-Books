
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\ClientPortalController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\QuoteTemplateController;
use App\Http\Controllers\ChartOfAccountController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    // Clients
    Route::apiResource('clients', ClientController::class);

    // Invoices
    Route::apiResource('invoices', InvoiceController::class);
    Route::post('invoices/{invoice}/send', [InvoiceController::class, 'send']);
    Route::get('invoices/{invoice}/pdf/preview', [InvoiceController::class, 'previewPdf']);
    Route::get('invoices/{invoice}/pdf/download', [InvoiceController::class, 'generatePdf']);
    Route::get('invoices/{invoice}/receipt/pdf', [ReceiptController::class, 'fromInvoice']);
    Route::post('receipts/pdf', [ReceiptController::class, 'generatePdf']);

    // Expenses
    Route::apiResource('expenses', ExpenseController::class);
    Route::post('expenses/import', [ExpenseController::class, 'import']);
    Route::apiResource('expense-categories', ExpenseCategoryController::class);
    Route::post('expense-categories/{expenseCategory}/toggle-active', [ExpenseCategoryController::class, 'toggleActive']);
    Route::get('expense-categories/with-count', [ExpenseCategoryController::class, 'withExpenseCount']);

    // Quotes
    Route::apiResource('quotes', QuoteController::class);
    Route::post('quotes/{quote}/send', [QuoteController::class, 'send']);
    Route::post('quotes/{quote}/convert', [QuoteController::class, 'convertToInvoice']);
    Route::get('quotes/{quote}/pdf/preview', [QuoteController::class, 'previewPdf']);
    Route::get('quotes/{quote}/pdf/download', [QuoteController::class, 'generatePdf']);

    // Currencies
    Route::get('currencies', [CurrencyController::class, 'index']);

    // Logs
    Route::get('logs', [LogController::class, 'index']);

    // Users (Admin only)
    Route::apiResource('users', UserController::class);
    Route::get('roles', [UserController::class, 'getAllRoles']);

    // Items
    Route::apiResource('items', ItemController::class);

    // Quote Templates
    Route::apiResource('quote-templates', QuoteTemplateController::class);
    
     // Chart of Accounts
    Route::apiResource('chart-of-accounts', ChartOfAccountController::class);
    Route::post('chart-of-accounts/{chartOfAccount}/toggle-active', [ChartOfAccountController::class, 'toggleActive']);
    Route::post('chart-of-accounts/import', [ChartOfAccountController::class, 'import'])->middleware('throttle:60,1');
    Route::post('chart-of-accounts/import-data', [ChartOfAccountController::class, 'importData'])->middleware('throttle:60,1');
    Route::get('chart-of-accounts/export', [ChartOfAccountController::class, 'export'])->middleware('throttle:30,1');


    // Reports
    Route::get('reports/profit-loss', [ReportController::class, 'profitLoss']);
    Route::get('reports/revenue-by-client', [ReportController::class, 'revenueByClient']);
    Route::get('reports/expenses-by-category', [ReportController::class, 'expensesByCategory']);
    Route::get('reports/monthly-trend', [ReportController::class, 'monthlyTrend']);
});

Route::post('attachments', [AttachmentController::class, 'upload']);
Route::get('attachments/{attachment}/download', [AttachmentController::class, 'download']);
Route::delete('attachments/{attachment}', [AttachmentController::class, 'destroy']);

Route::get('invoices/export', [InvoiceController::class, 'export']);
Route::get('expenses/export', [ExpenseController::class, 'export']);
Route::post('invoices/bulk-update-status', [InvoiceController::class, 'bulkUpdateStatus']);
Route::post('quotes/bulk-update-status', [QuoteController::class, 'bulkUpdateStatus']);


Route::post('/client-portal/login', [ClientPortalController::class, 'login']);

Route::middleware('auth:sanctum')->prefix('client-portal')->group(function () {
    Route::get('/quotes', [ClientPortalController::class, 'myQuotes']);
    Route::get('/invoices', [ClientPortalController::class, 'myInvoices']);
    Route::post('/quotes/{quote}/accept', [ClientPortalController::class, 'acceptQuote']);
    Route::post('/quotes/{quote}/reject', [ClientPortalController::class, 'rejectQuote']);
});
