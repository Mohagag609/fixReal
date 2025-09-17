<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Unit extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'unit_type',
        'area',
        'floor',
        'building',
        'total_price',
        'status',
        'notes',
    ];

    protected $casts = [
        'total_price' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = ['deleted_at'];

    // Relations
    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }

    public function installments()
    {
        return $this->hasMany(Installment::class);
    }

    public function vouchers()
    {
        return $this->hasMany(Voucher::class, 'linked_ref');
    }

    public function unitPartners()
    {
        return $this->hasMany(UnitPartner::class);
    }

    public function unitPartnerGroups()
    {
        return $this->hasMany(UnitPartnerGroup::class);
    }

    // Scopes
    public function scopeAvailable($query)
    {
        return $query->where('status', 'متاحة');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('unit_type', $type);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('building', 'like', "%{$search}%");
    }
}