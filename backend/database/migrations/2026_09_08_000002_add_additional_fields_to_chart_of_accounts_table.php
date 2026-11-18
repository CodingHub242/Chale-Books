<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chart_of_accounts', function (Blueprint $table) {
            $table->string('category')->nullable()->after('type')->comment('e.g. operating, non-operating');
            $table->string('normal_balance')->nullable()->after('category')->comment('debit or credit');
            $table->text('notes')->nullable()->after('normal_balance')->comment('Additional notes for the account');
        });
    }

    public function down(): void
    {
        Schema::table('chart_of_accounts', function (Blueprint $table) {
            $table->dropColumn(['category', 'normal_balance', 'notes']);
        });
    }
};
