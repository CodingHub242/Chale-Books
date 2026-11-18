<?php

namespace App\Http\Controllers;

use App\Models\ChartOfAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ChartOfAccountsExport;
use Illuminate\Support\Facades\Storage;

class ChartOfAccountController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = ChartOfAccount::query();

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        $perPage = (int) ($request->input('per_page', 50));
        $page = (int) ($request->input('page', 1));

        $accounts = $query->orderByRaw("CAST(code AS UNSIGNED) ASC")
            ->orderBy('name')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'data' => $accounts->items(),
            'meta' => [
                'total' => $accounts->total(),
                'per_page' => $accounts->perPage(),
                'current_page' => $accounts->currentPage(),
                'last_page' => $accounts->lastPage(),
            ],
            'message' => 'Chart of accounts retrieved successfully'
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:chart_of_accounts,code',
            'type' => 'required|string|in:asset,liability,equity,income,expense',
            'subtype' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
            'normal_balance' => 'nullable|string|in:debit,credit',
            'description' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        $account = ChartOfAccount::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'code' => $request->code,
            'type' => $request->type,
            'subtype' => $request->subtype,
            'category' => $request->category,
            'normal_balance' => $request->normal_balance,
            'description' => $request->description,
            'notes' => $request->notes,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'success' => true,
            'data' => $account,
            'message' => 'Account created successfully'
        ], 201);
    }

    public function show(ChartOfAccount $chartOfAccount)
    {
        return response()->json([
            'success' => true,
            'data' => $chartOfAccount,
            'message' => 'Account retrieved successfully'
        ]);
    }

    public function update(Request $request, ChartOfAccount $chartOfAccount)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:chart_of_accounts,code,' . $chartOfAccount->id,
            'type' => 'required|string|in:asset,liability,equity,income,expense',
            'subtype' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
            'normal_balance' => 'nullable|string|in:debit,credit',
            'description' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $chartOfAccount->update([
            'name' => $request->name,
            'code' => $request->code,
            'type' => $request->type,
            'subtype' => $request->subtype,
            'category' => $request->category,
            'normal_balance' => $request->normal_balance,
            'description' => $request->description,
            'notes' => $request->notes,
            'is_active' => $request->is_active,
        ]);

        return response()->json([
            'success' => true,
            'data' => $chartOfAccount->fresh(),
            'message' => 'Account updated successfully'
        ]);
    }

    public function destroy(ChartOfAccount $chartOfAccount)
    {
        $chartOfAccount->delete();

        return response()->json([
            'success' => true,
            'message' => 'Account deleted successfully'
        ]);
    }

    public function toggleActive(ChartOfAccount $chartOfAccount)
    {
        $chartOfAccount->is_active = !$chartOfAccount->is_active;
        $chartOfAccount->save();

        return response()->json([
            'success' => true,
            'data' => $chartOfAccount,
            'message' => 'Account status toggled successfully'
        ]);
    }

    public function export()
    {
        $fileName = 'chart-of-accounts-' . now()->format('Y-m-d-H-i-s') . '.xlsx';
        return Excel::download(new ChartOfAccountsExport, $fileName);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:2048',
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();
        $extension = $file->getClientOriginalExtension();

        $results = [];
        $successCount = 0;
        $failedCount = 0;

        try {
            if ($extension === 'csv') {
                $rows = $this->parseCsv($path);
            } else {
                $rows = $this->parseExcel($path);
            }

            foreach ($rows as $index => $row) {
                if ($index === 0) {
                    continue;
                }

                $name = $row[0] ?? null;
                $code = $row[1] ?? null;
                $type = $row[2] ?? null;
                $subtype = $row[3] ?? null;
                $category = $row[4] ?? null;
                $normalBalance = $row[5] ?? null;
                $description = $row[6] ?? null;
                $notes = $row[7] ?? null;
                $status = strtolower($row[8] ?? 'active');

                if (!$name || !$type) {
                    $failedCount++;
                    $results[] = ['row' => $index + 1, 'success' => false, 'error' => 'Name and type are required'];
                    continue;
                }

                $isActive = in_array($status, ['active', '1', 'yes', 'true'], true);

                $account = ChartOfAccount::create([
                    'user_id' => auth()->id(),
                    'name' => $name,
                    'code' => $code,
                    'type' => strtolower($type),
                    'subtype' => $subtype,
                    'category' => $category,
                    'normal_balance' => $normalBalance ? strtolower($normalBalance) : null,
                    'description' => $description,
                    'notes' => $notes,
                    'is_active' => $isActive,
                ]);

                $successCount++;
                $results[] = ['row' => $index + 1, 'success' => true, 'id' => $account->id];
            }

            return response()->json([
                'message' => "Import completed: $successCount successful, $failedCount failed",
                'success_count' => $successCount,
                'failed_count' => $failedCount,
                'results' => $results
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Import failed: ' . $e->getMessage(),
                'success_count' => $successCount,
                'failed_count' => $failedCount,
                'results' => $results
            ], 500);
        }
    }

    public function importData(Request $request)
    {
        $request->validate([
            'data' => 'required|array|min:1',
            'data.*.name' => 'required|string|max:255',
            'data.*.code' => 'nullable|string|max:50',
            'data.*.type' => 'required|string|in:asset,liability,equity,income,expense',
            'data.*.subtype' => 'nullable|string|max:100',
            'data.*.category' => 'nullable|string|max:100',
            'data.*.normal_balance' => 'nullable|string|in:debit,credit',
            'data.*.description' => 'nullable|string|max:500',
            'data.*.notes' => 'nullable|string|max:500',
            'data.*.status' => 'nullable|string|in:active,inactive',
        ]);

        $userId = auth()->id();
        $successCount = 0;
        $failedCount = 0;
        $results = [];

        foreach ($request->data as $index => $row) {
            try {
                $isActive = isset($row['status']) ? strtolower($row['status']) === 'active' : true;

                $account = ChartOfAccount::create([
                    'user_id' => $userId,
                    'name' => $row['name'],
                    'code' => $row['code'] ?? null,
                    'type' => strtolower($row['type']),
                    'subtype' => $row['subtype'] ?? null,
                    'category' => $row['category'] ?? null,
                    'normal_balance' => isset($row['normal_balance']) ? strtolower($row['normal_balance']) : null,
                    'description' => $row['description'] ?? null,
                    'notes' => $row['notes'] ?? null,
                    'is_active' => $isActive,
                ]);

                $successCount++;
                $results[] = ['row' => $index + 1, 'success' => true, 'id' => $account->id];
            } catch (\Exception $e) {
                $failedCount++;
                $results[] = ['row' => $index + 1, 'success' => false, 'error' => $e->getMessage()];
            }
        }

        return response()->json([
            'message' => "Import completed: $successCount successful, $failedCount failed",
            'success_count' => $successCount,
            'failed_count' => $failedCount,
            'results' => $results
        ]);
    }

    private function parseCsv(string $path): array
    {
        $handle = fopen($path, 'r');
        if (!$handle) {
            return [];
        }

        $rows = [];
        while (($row = fgetcsv($handle)) !== false) {
            $rows[] = $row;
        }
        fclose($handle);

        return $rows;
    }

    private function parseExcel(string $path): array
    {
        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($path);
        $sheet = $spreadsheet->getActiveSheet();
        $rows = [];

        foreach ($sheet->getRowIterator() as $row) {
            $cellIterator = $row->getCellIterator();
            $cellIterator->setIterateOnlyExistingCells(false);
            $rowData = [];
            foreach ($cellIterator as $cell) {
                $rowData[] = $cell->getValue();
            }
            $rows[] = $rowData;
        }

        return $rows;
    }
}
