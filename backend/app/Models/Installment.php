<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Installment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'unit_id',
        'amount',
        'due_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'datetime',
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

    // Scopes
    public function scopePaid($query)
    {
        return $query->where('status', 'مدفوع');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'معلق');
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
                    ->where('status', 'معلق');
    }

    public function scopeByDateRange($query, $start, $end)
    {
        return $query->whereBetween('due_date', [$start, $end]);
    }
}