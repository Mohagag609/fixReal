<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('broker_dues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('broker_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->datetime('due_date');
            $table->string('status')->default('معلق');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down()
    {
        Schema::dropIfExists('broker_dues');
    }
};