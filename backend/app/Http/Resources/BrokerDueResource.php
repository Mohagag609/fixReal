<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BrokerDueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'broker_id' => $this->broker_id,
            'contract_id' => $this->contract_id,
            'amount' => $this->amount,
            'due_date' => $this->due_date,
            'paid_date' => $this->paid_date,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'broker' => $this->whenLoaded('broker'),
            'contract' => $this->whenLoaded('contract'),
        ];
    }
}