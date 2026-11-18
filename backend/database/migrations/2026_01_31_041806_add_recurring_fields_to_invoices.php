<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->boolean('is_recurring')->default(false)->after('status');
            $table->string('recurring_frequency')->nullable()->after('is_recurring'); // daily, weekly, monthly, yearly
            $table->date('recurring_start_date')->nullable()->after('recurring_frequency');
            $table->date('recurring_end_date')->nullable()->after('recurring_start_date');
            $table->integer('recurring_count')->default(0)->after('recurring_end_date');
            $table->foreignId('parent_invoice_id')->nullable()->constrained('invoices')->after('recurring_count');
            $table->date('last_generated_date')->nullable()->after('parent_invoice_id');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['parent_invoice_id']);
            $table->dropColumn([
                'is_recurring', 'recurring_frequency', 'recurring_start_date',
                'recurring_end_date', 'recurring_count', 'parent_invoice_id',
                'last_generated_date'
            ]);
        });
    }
};