<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // receipt or payment
            $table->datetime('date');
            $table->decimal('amount', 15, 2);
            $table->foreignId('safe_id')->constrained()->onDelete('cascade');
            $table->text('description');
            $table->string('payer')->nullable();
            $table->string('beneficiary')->nullable();
            $table->string('linked_ref')->nullable(); // Reference to unit, contract, etc.
            $table->timestamps();
            $table->softDeletes();

            // Foreign key for linked_ref to units
            $table->foreign('linked_ref')->references('id')->on('units')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('vouchers');
    }
};