<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Invoice;
use App\Models\Expense;
use App\Models\Quote;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function profitLoss(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfMonth());
        $endDate = $request->input('end_date', now()->endOfMonth());

        $revenue = Invoice::where('status', 'paid')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('total');

        

        $expenses = Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->sum('amount');

        //get data from revenues model table too and sum together with revenue
        $additionalRevenue = \App\Models\Revenue::whereBetween('revenue_date', [$startDate, $endDate])
            ->sum('amount');

        $revenue += $additionalRevenue;

        return response()->json([
            'revenue' => $revenue,
            'expenses' => $expenses,
            'profit' => $revenue - $expenses,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'currency' => auth()->user()->currency
        ]);
    }

    public function revenueByClient(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfYear());
        $endDate = $request->input('end_date', now()->endOfYear());

        $data = Invoice::with('client')
           // ->where('user_id', auth()->id())
            ->where('status', 'paid')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get()
            ->groupBy('client_id')
            ->map(function ($invoices) {
                return [
                    'client' => $invoices->first()->client->name,
                    'total' => $invoices->sum('total'),
                    'currency' => $invoices->first()->currency
                ];
            })
            ->values();

            //get data from revenues model table too and sum together with invoices
            $revenueData = \App\Models\Revenue::with('client')
            //->where('user_id', auth()->id())
            ->whereBetween('revenue_date', [$startDate, $endDate])
            ->get()
            ->groupBy('client_id')
            ->map(function ($revenues) {
                return [
                    'client' => $revenues->first()->client->name,
                    'total' => $revenues->sum('amount'),
                    'currency' => $revenues->first()->currency ? $revenues->first()->currency->code : 'USD'
                ];
            })
            ->values();
            //merge both data
            foreach ($revenueData as $rev) {
                $found = false;
                foreach ($data as &$inv) {
                    if ($inv['client'] === $rev['client']) {
                        $inv['total'] += $rev['total'];
                        $found = true;
                        break;
                    }
                }
                if (!$found) {
                    $data->push($rev);
                }
            }

        return response()->json($data);
    }

    public function expensesByCategory(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfYear());
        $endDate = $request->input('end_date', now()->endOfYear());

        $data = Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->get()
            ->groupBy('category')
            ->map(function ($expenses, $category) {
                return [
                    'category' => $category,
                    'total' => $expenses->sum('amount'),
                    'currency' => $expenses->first()->currency ? $expenses->first()->currency->code : 'USD'
                ];
            })
            ->values();

        return response()->json($data);
    }

    public function monthlyTrend(Request $request)
    {
        $months = 12;
        $data = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();

            $revenue = Invoice::where('status', 'paid')
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->sum('total');

            $expenses = Expense::whereBetween('expense_date', [$startOfMonth, $endOfMonth])
                ->sum('amount');

            $data[] = [
                'month' => $date->format('M Y'),
                'revenue' => $revenue,
                'expenses' => $expenses,
                'profit' => $revenue - $expenses,
                'currency' => auth()->user()->currency
            ];
        }

        return response()->json($data);
    }
}