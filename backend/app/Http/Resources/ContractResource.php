<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'unit_id' => $this->unit_id,
            'customer_id' => $this->customer_id,
            'start' => $this->start,
            'total_price' => $this->total_price,
            'discount_amount' => $this->discount_amount,
            'broker_name' => $this->broker_name,
            'broker_percent' => $this->broker_percent,
            'broker_amount' => $this->broker_amount,
            'commission_safe_id' => $this->commission_safe_id,
            'down_payment_safe_id' => $this->down_payment_safe_id,
            'maintenance_deposit' => $this->maintenance_deposit,
            'installment_type' => $this->installment_type,
            'installment_count' => $this->installment_count,
            'extra_annual' => $this->extra_annual,
            'annual_payment_value' => $this->annual_payment_value,
            'down_payment' => $this->down_payment,
            'payment_type' => $this->payment_type,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'unit' => $this->whenLoaded('unit', function () {
                return [
                    'id' => $this->unit->id,
                    'code' => $this->unit->code,
                    'name' => $this->unit->name,
                    'unit_type' => $this->unit->unit_type,
                    'total_price' => $this->unit->total_price,
                ];
            }),
            'customer' => $this->whenLoaded('customer', function () {
                return [
                    'id' => $this->customer->id,
                    'name' => $this->customer->name,
                    'phone' => $this->customer->phone,
                    'national_id' => $this->customer->national_id,
                ];
            }),
        ];
    }
}