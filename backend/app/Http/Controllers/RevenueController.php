<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Revenue;
use App\Models\Log;

class RevenueController extends Controller
{
    public function index()
    {
        return Revenue::with(['currency', 'client'])->where('user_id', auth()->id())->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'category' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'currency_id' => 'required|exists:currencies,id',
            'revenue_date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        $revenue = Revenue::create([
            'user_id' => auth()->id(),
            'client_id' => $request->client_id,
            'category' => $request->category,
            'amount' => $request->amount,
            'currency_id' => $request->currency_id,
            'revenue_date' => $request->revenue_date,
            'description' => $request->description,
        ]);

        Log::create([
            'user_id' => auth()->id(),
            'action' => 'created',
            'model' => 'Revenue',
            'model_id' => $revenue->id,
            'details' => $request->only(['category', 'amount', 'revenue_date']),
        ]);

        return response()->json($revenue->load(['currency', 'client']), 201);
    }

    public function show(Revenue $revenue)
    {
       // $this->authorize('view', $revenue);
        return $revenue->load(['currency', 'client']);
    }

    public function update(Request $request, Revenue $revenue)
    {
       // $this->authorize('update', $revenue);

        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'category' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'currency_id' => 'required|exists:currencies,id',
            'revenue_date' => 'required|date',
            'description' => 'nullable|string',
        ]);

        $revenue->update($request->only(['client_id', 'category', 'amount', 'currency_id', 'revenue_date', 'description']));

        Log::create([
            'user_id' => auth()->id(),
            'action' => 'updated',
            'model' => 'Revenue',
            'model_id' => $revenue->id,
            'details' => $request->only(['category', 'amount', 'revenue_date']),
        ]);

        return response()->json($revenue->load(['currency', 'client']));
    }

    public function destroy(Revenue $revenue)
    {
       // $this->authorize('delete', $revenue);
        $revenue->delete();

        Log::create([
            'user_id' => auth()->id(),
            'action' => 'deleted',
            'model' => 'Revenue',
            'model_id' => $revenue->id,
        ]);

        return response()->json(['message' => 'Revenue deleted']);
    }
}
