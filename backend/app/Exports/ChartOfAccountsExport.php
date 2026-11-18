<?php

namespace App\Exports;

use App\Models\ChartOfAccount;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ChartOfAccountsExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return ChartOfAccount::forUser(auth()->id())
            ->orderByRaw("CAST(code AS UNSIGNED) ASC")
            ->orderBy('name')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Account Name',
            'Account Code',
            'Account Type',
            'Subtype',
            'Category',
            'Normal Balance',
            'Description',
            'Notes',
            'Status'
        ];
    }

    public function map($account): array
    {
        return [
            $account->name,
            $account->code,
            ucfirst($account->type),
            $account->subtype ?: '-',
            $account->category ?: '-',
            $account->normal_balance ? ucfirst($account->normal_balance) : '-',
            $account->description ?: '-',
            $account->notes ?: '-',
            $account->is_active ? 'Active' : 'Inactive'
        ];
    }
}
