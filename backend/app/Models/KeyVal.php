<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KeyVal extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'key',
        'value',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public static function get($key, $default = null)
    {
        $keyVal = static::where('key', $key)->first();
        return $keyVal ? $keyVal->value : $default;
    }

    public static function set($key, $value)
    {
        return static::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }
}