<?php

namespace App\Http\Controllers;

use App\Models\Log;

class LogController extends Controller
{
    public function index()
    {
        return Log::where('user_id', auth()->id())->orderBy('created_at', 'desc')->get();
    }
}
