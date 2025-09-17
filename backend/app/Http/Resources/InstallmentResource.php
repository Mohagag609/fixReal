<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InstallmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'unit_id' => $this->unit_id,
            'amount' => $this->amount,
            'due_date' => $this->due_date,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'unit' => $this->whenLoaded('unit', function () {
                return [
                    'id' => $this->unit->id,
                    'code' => $this->unit->code,
                    'name' => $this->unit->name,
                    'unit_type' => $this->unit->unit_type,
                ];
            }),
            'is_overdue' => $this->due_date < now() && $this->status === 'معلق',
            'days_overdue' => $this->due_date < now() && $this->status === 'معلق' 
                ? now()->diffInDays($this->due_date) 
                : 0,
        ];
    }
}