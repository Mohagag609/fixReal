<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transfer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'from_safe_id',
        'to_safe_id',
        'amount',
        'description',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = ['deleted_at'];

    // Relations
    public function fromSafe()
    {
        return $this->belongsTo(Safe::class, 'from_safe_id');
    }

    public function toSafe()
    {
        return $this->belongsTo(Safe::class, 'to_safe_id');
    }
}