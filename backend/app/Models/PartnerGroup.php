<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PartnerGroup extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'notes',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = ['deleted_at'];

    // Relations
    public function partners()
    {
        return $this->hasMany(PartnerGroupPartner::class);
    }

    public function unitPartnerGroups()
    {
        return $this->hasMany(UnitPartnerGroup::class);
    }

    // Scopes
    public function scopeSearch($query, $search)
    {
        return $query->where('name', 'like', "%{$search}%");
    }
}