<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->string('paid_through')->nullable()->after('description');
            $table->foreignId('category_id')->nullable()->after('user_id')->constrained('expense_categories')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropColumn(['paid_through', 'category_id']);
        });
    }
};
