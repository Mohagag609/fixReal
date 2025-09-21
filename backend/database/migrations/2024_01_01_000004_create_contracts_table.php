<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unit_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->datetime('start');
            $table->decimal('total_price', 15, 2);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->string('broker_name')->nullable();
            $table->decimal('broker_percent', 5, 2)->default(0);
            $table->decimal('broker_amount', 15, 2)->default(0);
            $table->string('commission_safe_id')->nullable();
            $table->string('down_payment_safe_id')->nullable();
            $table->decimal('maintenance_deposit', 15, 2)->default(0);
            $table->string('installment_type')->default('شهري');
            $table->integer('installment_count')->default(0);
            $table->integer('extra_annual')->default(0);
            $table->decimal('annual_payment_value', 15, 2)->default(0);
            $table->decimal('down_payment', 15, 2)->default(0);
            $table->string('payment_type')->default('installment');
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['unit_id', 'deleted_at']);
            $table->index(['customer_id', 'deleted_at']);
            $table->index('start');
            $table->index('total_price');
            $table->index('created_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('contracts');
    }
};