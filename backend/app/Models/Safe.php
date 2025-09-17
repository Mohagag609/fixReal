<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Safe extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'balance',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = ['deleted_at'];

    // Relations
    public function vouchers()
    {
        return $this->hasMany(Voucher::class);
    }

    public function transfersFrom()
    {
        return $this->hasMany(Transfer::class, 'from_safe_id');
    }

    public function transfersTo()
    {
        return $this->hasMany(Transfer::class, 'to_safe_id');
    }

    // Methods
    public function updateBalance($amount, $type = 'add')
    {
        if ($type === 'add') {
            $this->balance += $amount;
        } else {
            $this->balance -= $amount;
        }
        $this->save();
    }
}