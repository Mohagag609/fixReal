<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contract extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'unit_id',
        'customer_id',
        'start',
        'total_price',
        'discount_amount',
        'broker_name',
        'broker_percent',
        'broker_amount',
        'commission_safe_id',
        'down_payment_safe_id',
        'maintenance_deposit',
        'installment_type',
        'installment_count',
        'extra_annual',
        'annual_payment_value',
        'down_payment',
        'payment_type',
    ];

    protected $casts = [
        'start' => 'datetime',
        'total_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'broker_percent' => 'decimal:2',
        'broker_amount' => 'decimal:2',
        'maintenance_deposit' => 'decimal:2',
        'annual_payment_value' => 'decimal:2',
        'down_payment' => 'decimal:2',
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

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    // Scopes
    public function scopeByDateRange($query, $start, $end)
    {
        return $query->whereBetween('start', [$start, $end]);
    }

    public function scopeByPriceRange($query, $min, $max)
    {
        return $query->whereBetween('total_price', [$min, $max]);
    }
}