<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('unit_partner_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unit_id')->constrained()->onDelete('cascade');
            $table->foreignId('partner_group_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();

            // Unique constraint
            $table->unique(['unit_id', 'partner_group_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('unit_partner_groups');
    }
};