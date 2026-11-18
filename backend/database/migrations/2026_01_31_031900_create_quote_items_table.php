<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('quote_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_id')->constrained()->onDelete('cascade');
            $table->string('description');
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        // Add new columns to quotes table (don't rename yet)
        Schema::table('quotes', function (Blueprint $table) {
            if (!Schema::hasColumn('quotes', 'subtotal')) {
                $table->decimal('subtotal', 10, 2)->default(0)->after('amount');
            }
            if (!Schema::hasColumn('quotes', 'tax_total')) {
                $table->decimal('tax_total', 10, 2)->default(0)->after('subtotal');
            }
            if (!Schema::hasColumn('quotes', 'discount_total')) {
                $table->decimal('discount_total', 10, 2)->default(0)->after('tax_total');
            }
            if (!Schema::hasColumn('quotes', 'total')) {
                $table->decimal('total', 10, 2)->default(0)->after('discount_total');
            }
        });

        // Copy amount to total for existing records
        DB::statement('UPDATE quotes SET total = amount WHERE total = 0');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropColumn(['subtotal', 'tax_total', 'discount_total', 'total']);
        });

        Schema::dropIfExists('quote_items');
    }
};
