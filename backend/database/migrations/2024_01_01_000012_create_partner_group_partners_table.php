<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('partner_group_partners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_group_id')->constrained()->onDelete('cascade');
            $table->foreignId('partner_id')->constrained()->onDelete('cascade');
            $table->decimal('percentage', 5, 2);
            $table->timestamps();
            $table->softDeletes();

            // Unique constraint
            $table->unique(['partner_group_id', 'partner_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('partner_group_partners');
    }
};