<?php



// namespace App\Http\Controllers;

// use Illuminate\Http\Request;
// use App\Models\User;
// use Illuminate\Support\Facades\Hash;
// use Spatie\Permission\Models\Role;

// class UserController extends Controller
// {
//     public function index()
//     {
//          //if user email is test@example.com assign admin role to the user
//         // if (auth()->user()->email === 'test@example.com') {
//         //     auth()->user()->assignRole('admin');
//         //     dd('Admin role assigned to user');
//         // }
//         // Only admins can view users
//         if (!auth()->user()->hasRole('admin')) {
//             return response()->json(['message' => 'Unauthorized'], 403);
//         }

//       // dd(auth()->user());
       

//         return User::with('roles')->get();
//     }

//     public function store(Request $request)
//     {
//         // Only admins can create users
//         if (!auth()->user()->hasRole('admin')) {
//             return response()->json(['message' => 'Unauthorized'], 403);
//         }

//         $request->validate([
//             'name' => 'required|string|max:255',
//             'email' => 'required|string|email|max:255|unique:users',
//             'password' => 'required|string|min:8',
//             'role' => 'required|string|exists:roles,name'
//         ]);

//         $user = User::create([
//             'name' => $request->name,
//             'email' => $request->email,
//             'password' => Hash::make($request->password),
//             //get user's currency from user's ip location
//             'currency'=> 'GHS',
//         ]);

//         $user->assignRole($request->role);

//         return response()->json($user->load('roles'), 201);
//     }

//     public function update(Request $request, User $user)
//     {
//         // Only admins can update users
//         if (!auth()->user()->hasRole('admin')) {
//             return response()->json(['message' => 'Unauthorized'], 403);
//         }

//         $request->validate([
//             'name' => 'required|string|max:255',
//             'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
//             'password' => 'nullable|string|min:8',
//             'role' => 'required|string|exists:roles,name'
//         ]);

//         $user->update([
//             'name' => $request->name,
//             'email' => $request->email,
//         ]);

//         if ($request->password) {
//             $user->update(['password' => Hash::make($request->password)]);
//         }

//         // Update role
//         $user->syncRoles([$request->role]);

//         return response()->json($user->load('roles'));
//     }

//     public function destroy(User $user)
//     {
//         // Only admins can delete users
//         if (!auth()->user()->hasRole('admin')) {
//             return response()->json(['message' => 'Unauthorized'], 403);
//         }

//         // Prevent deleting yourself
//         if ($user->id === auth()->id()) {
//             return response()->json(['message' => 'Cannot delete yourself'], 400);
//         }

//         $user->delete();

//         return response()->json(['message' => 'User deleted']);
//     }

//     public function getAllRoles()
//     {
//         return Role::all();
//     }
// }



// use Illuminate\Http\Request;
// use Illuminate\Support\Facades\Route;
// use App\Http\Controllers\AuthController;
// use App\Http\Controllers\ClientController;
// use App\Http\Controllers\InvoiceController;
// use App\Http\Controllers\ExpenseController;
// use App\Http\Controllers\QuoteController;
// use App\Http\Controllers\CurrencyController;
// use App\Http\Controllers\LogController;
// use App\Http\Controllers\UserController;
// use App\Http\Controllers\ReportController;
// use App\Http\Controllers\ExpenseCategoryController;
// use App\Http\Controllers\RevenueController;
// use App\Http\Controllers\ItemController;
// use App\Http\Controllers\QuoteTemplateController;
// use App\Http\Controllers\AttachmentController;
// use App\Http\Controllers\ClientPortalController;

// Route::post('/register', [AuthController::class, 'register']);
// Route::post('/login', [AuthController::class, 'login']);

// Route::middleware('auth:sanctum')->group(function () {
//     Route::get('/user', function (Request $request) {
//         return $request->user();
//     });
//     Route::post('/logout', [AuthController::class, 'logout']);

//     // Clients
//     Route::apiResource('clients', ClientController::class);

//     // Invoices
//     Route::apiResource('invoices', InvoiceController::class);
//     Route::post('invoices/{invoice}/send', [InvoiceController::class, 'send']);
//     Route::get('invoices/{invoice}/pdf/preview', [InvoiceController::class, 'previewPdf']);
//     Route::get('invoices/{invoice}/pdf/download', [InvoiceController::class, 'generatePdf']);

//     // Expenses
//     Route::apiResource('expenses', ExpenseController::class);
//     Route::post('expenses/import', [ExpenseController::class, 'import']);
//     Route::apiResource('expense-categories', ExpenseCategoryController::class);
//     Route::post('expense-categories/{expenseCategory}/toggle-active', [ExpenseCategoryController::class, 'toggleActive']);
//     Route::get('expense-categories/with-count', [ExpenseCategoryController::class, 'withExpenseCount']);

//     // Quotes
// Route::apiResource('quotes', QuoteController::class);
//     Route::post('quotes/{quote}/send', [QuoteController::class, 'send']);
//     Route::post('quotes/{quote}/convert', [QuoteController::class, 'convertToInvoice']);
//     Route::get('quotes/{quote}/pdf/preview', [QuoteController::class, 'previewPdf']);
//     Route::get('quotes/{quote}/pdf/download', [QuoteController::class, 'generatePdf']);

//     // Currencies
//     Route::get('currencies', [CurrencyController::class, 'index']);

//     // Logs
//     Route::get('logs', [LogController::class, 'index']);

//     // Users (Admin only)
//     Route::apiResource('users', UserController::class);
//     Route::get('roles', [UserController::class, 'getRoles']);

//     // Reports
//     Route::get('reports/profit-loss', [ReportController::class, 'profitLoss']);
//     Route::get('reports/revenue-by-client', [ReportController::class, 'revenueByClient']);
//     Route::get('reports/expenses-by-category', [ReportController::class, 'expensesByCategory']);
//     Route::get('reports/monthly-trend', [ReportController::class, 'monthlyTrend']);

//     // Items
//     Route::apiResource('items', ItemController::class);

//     // Quote Templates
//     Route::apiResource('quote-templates', QuoteTemplateController::class);

//     // Revenues
//     Route::apiResource('revenues', RevenueController::class);

// });

// // Route::middleware(['auth:sanctum', 'permission:create-quotes'])->group(function () {
// //     Route::post('quotes', [QuoteController::class, 'store']);
// // });

// Route::post('attachments', [AttachmentController::class, 'upload']);
// Route::get('attachments/{attachment}/download', [AttachmentController::class, 'download']);
// Route::delete('attachments/{attachment}', [AttachmentController::class, 'destroy']);

// Route::post('attachments', [AttachmentController::class, 'upload']);
// Route::get('attachments/{attachment}/download', [AttachmentController::class, 'download']);
// Route::delete('attachments/{attachment}', [AttachmentController::class, 'destroy']);

// Route::get('invoices/export', [InvoiceController::class, 'export']);
// Route::get('expenses/export', [ExpenseController::class, 'export']);

// Route::post('/client-portal/login', [ClientPortalController::class, 'login']);

// Route::middleware('auth:sanctum')->prefix('client-portal')->group(function () {
//     Route::get('/quotes', [ClientPortalController::class, 'myQuotes']);
//     Route::get('/invoices', [ClientPortalController::class, 'myInvoices']);
//     Route::post('/quotes/{quote}/accept', [ClientPortalController::class, 'acceptQuote']);
//     Route::post('/quotes/{quote}/reject', [ClientPortalController::class, 'rejectQuote']);
// });