<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Installment;
use App\Models\Unit;
use App\Models\Voucher;
use App\Models\Safe;
use Illuminate\Support\Facades\DB;

class FinancialCalculationService
{
    /**
     * Calculate contract financial details
     */
    public function calculateContractFinancials(Contract $contract): array
    {
        $totalPrice = $contract->total_price;
        $discountAmount = $contract->discount_amount;
        $brokerAmount = $contract->broker_amount;
        $maintenanceDeposit = $contract->maintenance_deposit;
        $downPayment = $contract->down_payment;

        // Calculate net amount after discount
        $netAmount = $totalPrice - $discountAmount;

        // Calculate remaining amount after down payment
        $remainingAmount = $netAmount - $downPayment;

        // Calculate installment amount
        $installmentAmount = $contract->installment_count > 0 
            ? $remainingAmount / $contract->installment_count 
            : 0;

        // Calculate annual payment
        $annualPayment = $contract->annual_payment_value;

        return [
            'total_price' => $totalPrice,
            'discount_amount' => $discountAmount,
            'net_amount' => $netAmount,
            'down_payment' => $downPayment,
            'remaining_amount' => $remainingAmount,
            'installment_amount' => $installmentAmount,
            'installment_count' => $contract->installment_count,
            'annual_payment' => $annualPayment,
            'broker_amount' => $brokerAmount,
            'maintenance_deposit' => $maintenanceDeposit,
        ];
    }

    /**
     * Generate installments for a contract
     */
    public function generateInstallments(Contract $contract): array
    {
        $financials = $this->calculateContractFinancials($contract);
        $installments = [];

        if ($contract->installment_count <= 0) {
            return $installments;
        }

        $startDate = $contract->start;
        $installmentAmount = $financials['installment_amount'];

        for ($i = 1; $i <= $contract->installment_count; $i++) {
            $dueDate = $startDate->copy()->addMonths($i);
            
            $installments[] = [
                'unit_id' => $contract->unit_id,
                'amount' => $installmentAmount,
                'due_date' => $dueDate,
                'status' => 'معلق',
                'notes' => "قسط رقم {$i} من {$contract->installment_count}",
            ];
        }

        return $installments;
    }

    /**
     * Calculate dashboard KPIs
     */
    public function calculateDashboardKPIs(): array
    {
        $totalContracts = Contract::count();
        $totalContractValue = Contract::sum('total_price');
        
        $totalVouchers = Voucher::count();
        $totalVoucherAmount = Voucher::sum('amount');
        
        $paidInstallments = Installment::where('status', 'مدفوع')->count();
        $pendingInstallments = Installment::where('status', 'معلق')->count();
        
        $totalUnits = Unit::count();
        $activeUnits = Unit::where('status', 'متاحة')->count();
        
        $totalCustomers = \App\Models\Customer::count();

        return [
            'total_contracts' => $totalContracts,
            'total_contract_value' => $totalContractValue,
            'total_vouchers' => $totalVouchers,
            'total_voucher_amount' => $totalVoucherAmount,
            'paid_installments' => $paidInstallments,
            'pending_installments' => $pendingInstallments,
            'total_units' => $totalUnits,
            'active_units' => $activeUnits,
            'total_customers' => $totalCustomers,
        ];
    }

    /**
     * Process payment for installment
     */
    public function processInstallmentPayment(Installment $installment, array $paymentData): bool
    {
        try {
            DB::beginTransaction();

            // Update installment status
            $installment->update([
                'status' => 'مدفوع',
                'notes' => $paymentData['notes'] ?? $installment->notes,
            ]);

            // Create voucher
            Voucher::create([
                'type' => 'receipt',
                'date' => now(),
                'amount' => $installment->amount,
                'safe_id' => $paymentData['safe_id'],
                'description' => "دفع قسط للوحدة {$installment->unit->code}",
                'payer' => $paymentData['payer'] ?? null,
                'beneficiary' => $paymentData['beneficiary'] ?? null,
                'linked_ref' => $installment->unit_id,
            ]);

            // Update safe balance
            $safe = Safe::find($paymentData['safe_id']);
            if ($safe) {
                $safe->updateBalance($installment->amount, 'add');
            }

            DB::commit();
            return true;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Process safe transfer
     */
    public function processSafeTransfer(array $transferData): bool
    {
        try {
            DB::beginTransaction();

            // Create transfer record
            $transfer = Transfer::create($transferData);

            // Update from safe balance
            $fromSafe = Safe::find($transferData['from_safe_id']);
            if ($fromSafe) {
                $fromSafe->updateBalance($transferData['amount'], 'subtract');
            }

            // Update to safe balance
            $toSafe = Safe::find($transferData['to_safe_id']);
            if ($toSafe) {
                $toSafe->updateBalance($transferData['amount'], 'add');
            }

            DB::commit();
            return true;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Calculate partner share for a unit
     */
    public function calculatePartnerShare(Unit $unit, Partner $partner): float
    {
        $unitPartner = $unit->unitPartners()
            ->where('partner_id', $partner->id)
            ->first();

        if (!$unitPartner) {
            return 0;
        }

        return ($unit->total_price * $unitPartner->percentage) / 100;
    }

    /**
     * Calculate overdue installments
     */
    public function getOverdueInstallments(): array
    {
        return Installment::where('due_date', '<', now())
            ->where('status', 'معلق')
            ->with(['unit'])
            ->get()
            ->toArray();
    }
}