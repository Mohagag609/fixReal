<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UnitPartner extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'unit_id',
        'partner_id',
        'percentage',
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = ['deleted_at'];

    // Relations
    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }
}