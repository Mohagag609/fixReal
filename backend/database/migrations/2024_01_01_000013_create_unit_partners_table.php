<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('unit_partners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unit_id')->constrained()->onDelete('cascade');
            $table->foreignId('partner_id')->constrained()->onDelete('cascade');
            $table->decimal('percentage', 5, 2);
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['unit_id', 'deleted_at']);
            $table->index(['partner_id', 'deleted_at']);
            
            // Unique constraint
            $table->unique(['unit_id', 'partner_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('unit_partners');
    }
};