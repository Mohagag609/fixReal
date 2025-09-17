<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PartnerDebt extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'partner_id',
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
    public function partner()
    {
        return $this->belongsTo(Partner::class);
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
}