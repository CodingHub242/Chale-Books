<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Client;
use App\Models\Quote;
use App\Models\Invoice;
use Illuminate\Support\Facades\Hash;

class ClientPortalController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $client = Client::where('email', $request->email)
            ->where('portal_access', true)
            ->first();

        if (!$client || !Hash::check($request->password, $client->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $client->createToken('client-portal')->plainTextToken;
        $client->update(['last_login' => now()]);

        return response()->json([
            'token' => $token,
            'client' => $client
        ]);
    }

    public function myQuotes()
    {
        $clientId = auth()->user()->id; // Assuming client is authenticated
        return Quote::with('currency', 'items')
            ->where('client_id', $clientId)
            ->get();
    }

    public function myInvoices()
    {
        $clientId = auth()->user()->id;
        return Invoice::with('currency', 'items')
            ->where('client_id', $clientId)
            ->get();
    }

    public function acceptQuote(Quote $quote)
    {
        if ($quote->client_id !== auth()->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $quote->update(['status' => 'accepted']);
        return response()->json(['message' => 'Quote accepted']);
    }

    public function rejectQuote(Quote $quote)
    {
        if ($quote->client_id !== auth()->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $quote->update(['status' => 'rejected']);
        return response()->json(['message' => 'Quote rejected']);
    }
}