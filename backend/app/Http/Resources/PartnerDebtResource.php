<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PartnerDebtResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'partner_id' => $this->partner_id,
            'unit_id' => $this->unit_id,
            'amount' => $this->amount,
            'due_date' => $this->due_date,
            'paid_date' => $this->paid_date,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'partner' => $this->whenLoaded('partner'),
            'unit' => $this->whenLoaded('unit'),
        ];
    }
}