<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ExpenseCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $query = ExpenseCategory::query();

        // Filter by active status
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        // Get all categories without user restriction
        $categories = $query->withCount('expenses')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
            'message' => 'Expense categories retrieved successfully'
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:expense_categories,name',
            'description' => 'nullable|string|max:500',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:100',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        $category = ExpenseCategory::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'description' => $request->description,
            'color' => $request->color ?? '#6c757d',
            'icon' => $request->icon,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'success' => true,
            'data' => $category,
            'message' => 'Expense category created successfully'
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(ExpenseCategory $expenseCategory)
    {
        return response()->json([
            'success' => true,
            'data' => $expenseCategory,
            'message' => 'Expense category retrieved successfully'
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ExpenseCategory $expenseCategory)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:expense_categories,name,' . $expenseCategory->id,
            'description' => 'nullable|string|max:500',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:100',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $expenseCategory->update([
            'name' => $request->name,
            'description' => $request->description,
            'color' => $request->color,
            'icon' => $request->icon,
            'is_active' => $request->is_active,
        ]);

        return response()->json([
            'success' => true,
            'data' => $expenseCategory->fresh(),
            'message' => 'Expense category updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ExpenseCategory $expenseCategory)
    {
        // Check if category has expenses
        if ($expenseCategory->expenses()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category with associated expenses. Please reassign or delete the expenses first.'
            ], 422);
        }

        $expenseCategory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Expense category deleted successfully'
        ]);
    }

    /**
     * Toggle the active status of the category.
     */
    public function toggleActive(ExpenseCategory $expenseCategory)
    {
        $expenseCategory->is_active = !$expenseCategory->is_active;
        $expenseCategory->save();

        return response()->json([
            'success' => true,
            'data' => $expenseCategory,
            'message' => 'Category status toggled successfully'
        ]);
    }

    /**
     * Get category with expense count.
     */
    public function withExpenseCount(Request $request)
    {
        $user = Auth::user();

        $categories = ExpenseCategory::forUser($user->id)
            ->withCount('expenses')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
            'message' => 'Categories with expense count retrieved successfully'
        ]);
    }
}
