<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UnitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'unit_type' => $this->unit_type,
            'area' => $this->area,
            'floor' => $this->floor,
            'building' => $this->building,
            'total_price' => $this->total_price,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'contracts_count' => $this->whenLoaded('contracts', function () {
                return $this->contracts->count();
            }),
            'installments_count' => $this->whenLoaded('installments', function () {
                return $this->installments->count();
            }),
        ];
    }
}