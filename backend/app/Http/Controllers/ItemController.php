<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Item;
use App\Models\Log;

class ItemController extends Controller
{
    public function index()
    {
        //return all items for all users with user's currency
        //return Item::with('currency')->get();
        return Item::with('user')->get();
        //return Item::where('user_id', auth()->id())->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'unit_price' => 'required|numeric|min:0',
            //'tax_rate' => 'nullable|numeric|min:0|max:100',
            //'discount' => 'nullable|numeric|min:0',
        ]);

        if($request->tax_rate===''){
            $request->merge(['tax_rate' => 0]);
        }

        if($request->discount===''){
            $request->merge(['discount' => 0]);
        }

        $item = Item::create([
            'user_id' => auth()->id(),
            'name' => $request->name,
            'description' => $request->description,
            'unit_price' => $request->unit_price,
            'tax_rate' => $request->tax_rate ?? 0,
            'discount' => $request->discount ?? 0,
        ]);

        Log::create([
            'user_id' => auth()->id(),
            'action' => 'created',
            'model' => 'Item',
            'model_id' => $item->id,
            'details' => $request->only(['name', 'unit_price']),
        ]);

        return response()->json($item, 201);
    }

    public function show(Item $item)
    {
        $this->authorize('view', $item);
        return $item;
    }

    public function update(Request $request, Item $item)
    {
        $this->authorize('update', $item);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'unit_price' => 'required|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
        ]);

        $item->update($request->only(['name', 'description', 'unit_price', 'tax_rate', 'discount']));

        Log::create([
            'user_id' => auth()->id(),
            'action' => 'updated',
            'model' => 'Item',
            'model_id' => $item->id,
            'details' => $request->only(['name', 'unit_price']),
        ]);

        return response()->json($item);
    }

    public function destroy(Item $item)
    {
        $this->authorize('delete', $item);
        $item->delete();

        Log::create([
            'user_id' => auth()->id(),
            'action' => 'deleted',
            'model' => 'Item',
            'model_id' => $item->id,
        ]);

        return response()->json(['message' => 'Item deleted']);
    }
}
