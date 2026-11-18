<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Currency;

class CurrencySeeder extends Seeder
{
    public function run(): void
    {
        $currencies = [
            ['code' => 'USD', 'name' => 'US Dollar'],
            ['code' => 'EUR', 'name' => 'Euro'],
            ['code' => 'GBP', 'name' => 'British Pound'],
            ['code' => 'JPY', 'name' => 'Japanese Yen'],
            ['code' => 'CAD', 'name' => 'Canadian Dollar'],
            ['code' => 'AUD', 'name' => 'Australian Dollar'],
        ];

        foreach ($currencies as $currency) {
            Currency::create($currency);
        }
    }
}
