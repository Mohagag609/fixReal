<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name')->nullable();
            $table->string('unit_type')->default('سكني');
            $table->string('area')->nullable();
            $table->string('floor')->nullable();
            $table->string('building')->nullable();
            $table->decimal('total_price', 15, 2)->default(0);
            $table->string('status')->default('متاحة');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['status', 'deleted_at']);
            $table->index(['unit_type', 'deleted_at']);
            $table->index('total_price');
            $table->index('created_at');
            $table->index('code');
        });
    }

    public function down()
    {
        Schema::dropIfExists('units');
    }
};