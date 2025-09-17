<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Partner extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'phone',
        'notes',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = ['deleted_at'];

    // Relations
    public function unitPartners()
    {
        return $this->hasMany(UnitPartner::class);
    }

    public function partnerDebts()
    {
        return $this->hasMany(PartnerDebt::class);
    }

    public function partnerGroupPartners()
    {
        return $this->hasMany(PartnerGroupPartner::class);
    }

    // Scopes
    public function scopeSearch($query, $search)
    {
        return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
    }
}