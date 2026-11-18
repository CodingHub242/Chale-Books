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
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->onDelete('cascade');
            $table->string('description');
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->integer('order')->default(0);
            $table->timestamps();
        });

        // Add new columns to invoices table (don't rename yet)
        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'invoice_number')) {
                $table->string('invoice_number')->unique()->nullable()->after('id');
            }
            if (!Schema::hasColumn('invoices', 'subtotal')) {
                $table->decimal('subtotal', 10, 2)->default(0)->after('amount');
            }
            if (!Schema::hasColumn('invoices', 'tax_total')) {
                $table->decimal('tax_total', 10, 2)->default(0)->after('subtotal');
            }
            if (!Schema::hasColumn('invoices', 'discount_total')) {
                $table->decimal('discount_total', 10, 2)->default(0)->after('tax_total');
            }
            if (!Schema::hasColumn('invoices', 'total')) {
                $table->decimal('total', 10, 2)->default(0)->after('discount_total');
            }
        });

        // Copy amount to total and generate invoice numbers for existing records
        DB::statement('UPDATE invoices SET total = amount WHERE total = 0');
        
        // Generate invoice numbers for existing invoices
        $invoices = DB::table('invoices')->whereNull('invoice_number')->get();
        foreach ($invoices as $invoice) {
            DB::table('invoices')
                ->where('id', $invoice->id)
                ->update(['invoice_number' => 'INV-' . str_pad($invoice->id, 6, '0', STR_PAD_LEFT)]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['invoice_number', 'subtotal', 'tax_total', 'discount_total', 'total']);
        });

        Schema::dropIfExists('invoice_items');
    }
};
