<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Log;

class ExpenseController extends Controller
{
    public function index()
    {
        return Expense::with('currency', 'category')->where('user_id', auth()->id())->orderBy('created_at', 'desc')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'category_id' => 'nullable|exists:expense_categories,id',
            'category' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
            'currency_id' => 'required|exists:currencies,id',
            'expense_date' => 'required|date',
            'paid_through' => 'required|string|max:255',
            'description' => 'nullable|string',
            'custom_fields' => 'nullable|array',
        ]);

        $expense = Expense::create([
            'user_id' => auth()->id(),
            'category_id' => $request->category_id,
            'category' => $request->category ?: ($request->category_id ? \App\Models\ExpenseCategory::find($request->category_id)->name : null),
            'amount' => $request->amount,
            'currency_id' => $request->currency_id,
            'expense_date' => $request->expense_date,
            'paid_through' => $request->paid_through,
            'description' => $request->description,
            'custom_fields' => $request->custom_fields,
        ]);

        Log::create([
            'user_id' => auth()->id(),
            'action' => 'created',
            'model' => 'Expense',
            'model_id' => $expense->id,
            'details' => $request->only(['category', 'amount', 'expense_date']),
        ]);

        return response()->json($expense->load('currency', 'category'), 201);
    }
    
         /**
     * Bulk import expenses from array of data
     */
    public function import(Request $request)
    {
        $request->validate([
            'expenses' => 'required|array',
            'expenses.*.amount' => 'required|numeric|min:0',
            'expenses.*.expense_date' => 'nullable|date', // Optional - defaults to today
            'expenses.*.paid_through' => 'required|string|max:255',
            'expenses.*.category' => 'nullable|string|max:255',
            'expenses.*.description' => 'nullable|string',
            'expenses.*.currency_id' => 'nullable|exists:currencies,id',
            'expenses.*.custom_fields' => 'nullable|array',
        ]);

        $results = [];
        $successCount = 0;
        $failedCount = 0;

        foreach ($request->expenses as $index => $expenseData) {
            try {
                // Use today's date if not provided
                $expenseDate = $expenseData['expense_date'] ?? now()->toDateString();

                // Find or create category
                $categoryId = null;
                $categoryName = $expenseData['category'] ?? 'Uncategorized';
                
                if ($categoryName && $categoryName !== 'Uncategorized') {
                    $category = ExpenseCategory::where('name', $categoryName)
                        ->where(function($query) {
                            $query->where('user_id', auth()->id())->orWhereNull('user_id');
                        })
                        ->first();
                    
                    if ($category) {
                        $categoryId = $category->id;
                    } else {
                        // Create new category
                        $newCategory = ExpenseCategory::create([
                            'name' => $categoryName,
                            'user_id' => auth()->id(),
                            'color' => '#6c757d'
                        ]);
                        $categoryId = $newCategory->id;
                    }
                }

                // Use default currency if not specified
                $currencyId = $expenseData['currency_id'] ?? 1;

                $expense = Expense::create([
                    'user_id' => auth()->id(),
                    'category_id' => $categoryId,
                    'category' => $categoryName,
                    'amount' => $expenseData['amount'],
                    'currency_id' => $currencyId,
                    'expense_date' => $expenseDate,
                    'paid_through' => $expenseData['paid_through'],
                    'description' => $expenseData['description'] ?? '',
                    'custom_fields' => $expenseData['custom_fields'] ?? null,
                ]);

                Log::create([
                    'user_id' => auth()->id(),
                    'action' => 'imported',
                    'model' => 'Expense',
                    'model_id' => $expense->id,
                    'details' => ['category' => $categoryName, 'amount' => $expenseData['amount']],
                ]);

                $successCount++;
                $results[] = ['index' => $index, 'success' => true, 'id' => $expense->id];

            } catch (\Exception $e) {
                $failedCount++;
                $results[] = ['index' => $index, 'success' => false, 'error' => $e->getMessage()];
            }
        }

        return response()->json([
            'message' => "Import completed: $successCount successful, $failedCount failed",
            'success_count' => $successCount,
            'failed_count' => $failedCount,
            'results' => $results
        ]);
    }

    public function show(Expense $expense)
    {
        //$this->authorize('view', $expense);
        return $expense->load('currency', 'category');
    }

    public function update(Request $request, Expense $expense)
    {
       // $this->authorize('update', $expense);

        $request->validate([
            'category_id' => 'nullable|exists:expense_categories,id',
            'category' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
            'currency_id' => 'required|exists:currencies,id',
            'expense_date' => 'required|date',
            'paid_through' => 'required|string|max:255',
            'description' => 'nullable|string',
            'custom_fields' => 'nullable|array',
        ]);

        $expense->update([
            'category_id' => $request->category_id,
            'category' => $request->category ?: ($request->category_id ? \App\Models\ExpenseCategory::find($request->category_id)->name : null),
            'amount' => $request->amount,
            'currency_id' => $request->currency_id,
            'expense_date' => $request->expense_date,
            'paid_through' => $request->paid_through,
            'description' => $request->description,
            'custom_fields' => $request->custom_fields,
        ]);

        Log::create([
            'user_id' => auth()->id(),
            'action' => 'updated',
            'model' => 'Expense',
            'model_id' => $expense->id,
            'details' => $request->only(['category', 'amount', 'expense_date']),
        ]);

        return response()->json($expense->load('currency', 'category'));
    }

    public function destroy(Expense $expense)
    {
        //$this->authorize('delete', $expense);
        $expense->delete();

        Log::create([
            'user_id' => auth()->id(),
            'action' => 'deleted',
            'model' => 'Expense',
            'model_id' => $expense->id,
        ]);

        return response()->json(['message' => 'Expense deleted']);
    }
}
