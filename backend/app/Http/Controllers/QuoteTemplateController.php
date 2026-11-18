<?php

namespace App\Http\Controllers;

use App\Models\QuoteTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class QuoteTemplateController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(
            QuoteTemplate::with('currency')
                ->where('user_id', auth()->id())
                ->get()
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'currency_id' => 'required|exists:currencies,id',
            'notes' => 'nullable|string',
            'items' => 'required|array',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.discount' => 'nullable|numeric|min:0',
        ]);

        $template = QuoteTemplate::create([
            'user_id' => auth()->id(),
            'name' => $request->name,
            'currency_id' => $request->currency_id,
            'notes' => $request->notes,
            'items' => $request->items,
        ]);

        Log::info('Quote template created', [
            'user_id' => auth()->id(),
            'template_id' => $template->id,
            'name' => $template->name,
        ]);

        return response()->json($template->load('currency'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(QuoteTemplate $quoteTemplate)
    {
        $this->authorize('view', $quoteTemplate);
        return response()->json($quoteTemplate->load('currency'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, QuoteTemplate $quoteTemplate)
    {
        $this->authorize('update', $quoteTemplate);

        $request->validate([
            'name' => 'required|string|max:255',
            'currency_id' => 'required|exists:currencies,id',
            'notes' => 'nullable|string',
            'items' => 'required|array',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.discount' => 'nullable|numeric|min:0',
        ]);

        $quoteTemplate->update($request->only(['name', 'currency_id', 'notes', 'items']));

        Log::info('Quote template updated', [
            'user_id' => auth()->id(),
            'template_id' => $quoteTemplate->id,
            'name' => $quoteTemplate->name,
        ]);

        return response()->json($quoteTemplate->load('currency'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(QuoteTemplate $quoteTemplate)
    {
        $this->authorize('delete', $quoteTemplate);

        $quoteTemplate->delete();

        Log::info('Quote template deleted', [
            'user_id' => auth()->id(),
            'template_id' => $quoteTemplate->id,
            'name' => $quoteTemplate->name,
        ]);

        return response()->json(['message' => 'Quote template deleted successfully']);
    }
}
