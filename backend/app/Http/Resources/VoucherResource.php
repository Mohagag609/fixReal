<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VoucherResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'date' => $this->date,
            'amount' => $this->amount,
            'safe_id' => $this->safe_id,
            'description' => $this->description,
            'payer' => $this->payer,
            'beneficiary' => $this->beneficiary,
            'linked_ref' => $this->linked_ref,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'safe' => $this->whenLoaded('safe', function () {
                return [
                    'id' => $this->safe->id,
                    'name' => $this->safe->name,
                    'balance' => $this->safe->balance,
                ];
            }),
            'unit' => $this->whenLoaded('unit', function () {
                return [
                    'id' => $this->unit->id,
                    'code' => $this->unit->code,
                    'name' => $this->unit->name,
                ];
            }),
            'type_label' => $this->type === 'receipt' ? 'قبض' : 'دفع',
            'type_color' => $this->type === 'receipt' ? 'green' : 'red',
        ];
    }
}