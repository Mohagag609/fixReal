<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable()->unique();
            $table->string('national_id')->nullable()->unique();
            $table->text('address')->nullable();
            $table->string('status')->default('نشط');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['status', 'deleted_at']);
            $table->index('name');
            $table->index('phone');
            $table->index('created_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('customers');
    }
};