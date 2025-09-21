<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unit_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->datetime('due_date');
            $table->string('status')->default('معلق');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['unit_id', 'deleted_at']);
            $table->index(['status', 'deleted_at']);
            $table->index('due_date');
            $table->index('amount');
        });
    }

    public function down()
    {
        Schema::dropIfExists('installments');
    }
};