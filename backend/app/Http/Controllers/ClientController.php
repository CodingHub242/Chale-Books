<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Client;
use App\Models\Log;

class ClientController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $query = Client::query();
        if (!$user->hasRole('admin')) {
            $query->where('user_id', $user->id);
        }
        return $query->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        $client = Client::create([
            'user_id' => auth()->id(),
            'name' => $request->name,
            'email' => isset($request->email) ? $request->email : null,
            'phone' => $request->phone,
            'address' => $request->address,
        ]);

        Log::create([
            'user_id' => auth()->id(),
            'action' => 'created',
            'model' => 'Client',
            'model_id' => $client->id,
            'details' => ['name' => $client->name],
        ]);

        return response()->json($client, 201);
    }

    public function show(Client $client)
    {
        $this->authorize('view', $client);
        return $client;
    }

    public function update(Request $request, Client $client)
    {
        //replace authorize with check if user is admin or the owner of the client
        if(!auth()->user()->hasRole('admin') && auth()->id() !== $client->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
           'email' => 'nullable|string|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);
        

        $client->update([
            'name' => $request->name,
            'email' => isset($request->email) ? $request->email : null,
            'phone' => $request->phone,
            'address' => $request->address,
        ]);

        Log::create([
            'user_id' => auth()->id(),
            'action' => 'updated',
            'model' => 'Client',
            'model_id' => $client->id,
            'details' => $request->only(['name', 'email', 'phone', 'address']),
        ]);

        return response()->json($client);
    }

    public function destroy(Client $client)
    {
        //replace authorize with check if user is admin or the owner of the client or the manager of the client
        if(!auth()->user()->hasRole('admin') && auth()->id() !== $client->user_id && !auth()->user()->hasRole('manager')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $client->delete();

        Log::create([
            'user_id' => auth()->id(),
            'action' => 'deleted',
            'model' => 'Client',
            'model_id' => $client->id,
        ]);

        return response()->json(['message' => 'Client deleted']);
    }
}
