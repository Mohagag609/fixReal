<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContractResource;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ContractController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Contract::with(['unit', 'customer']);

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('customer', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })->orWhereHas('unit', function($q) use ($search) {
                $q->where('code', 'like', "%{$search}%");
            });
        }

        // Date range filter
        if ($request->has('start_date')) {
            $query->where('start', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('start', '<=', $request->end_date);
        }

        // Price range filter
        if ($request->has('min_price')) {
            $query->where('total_price', '>=', $request->min_price);
        }
        if ($request->has('max_price')) {
            $query->where('total_price', '<=', $request->max_price);
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $contracts = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => ContractResource::collection($contracts),
            'pagination' => [
                'current_page' => $contracts->currentPage(),
                'last_page' => $contracts->lastPage(),
                'per_page' => $contracts->perPage(),
                'total' => $contracts->total(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'unit_id' => 'required|exists:units,id',
            'customer_id' => 'required|exists:customers,id',
            'start' => 'required|date',
            'total_price' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'broker_name' => 'nullable|string|max:255',
            'broker_percent' => 'nullable|numeric|min:0|max:100',
            'broker_amount' => 'nullable|numeric|min:0',
            'commission_safe_id' => 'nullable|string',
            'down_payment_safe_id' => 'nullable|string',
            'maintenance_deposit' => 'nullable|numeric|min:0',
            'installment_type' => 'nullable|string|in:شهري,ربع سنوي,نصف سنوي,سنوي',
            'installment_count' => 'nullable|integer|min:0',
            'extra_annual' => 'nullable|integer|min:0',
            'annual_payment_value' => 'nullable|numeric|min:0',
            'down_payment' => 'nullable|numeric|min:0',
            'payment_type' => 'nullable|string|in:installment,cash',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $contract = Contract::create($request->all());

            // Update unit status to sold
            $unit = Unit::find($request->unit_id);
            if ($unit) {
                $unit->update(['status' => 'مباعة']);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Contract created successfully',
                'data' => new ContractResource($contract->load(['unit', 'customer']))
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create contract',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Contract $contract): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new ContractResource($contract->load(['unit', 'customer']))
        ]);
    }

    public function update(Request $request, Contract $contract): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'unit_id' => 'required|exists:units,id',
            'customer_id' => 'required|exists:customers,id',
            'start' => 'required|date',
            'total_price' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'broker_name' => 'nullable|string|max:255',
            'broker_percent' => 'nullable|numeric|min:0|max:100',
            'broker_amount' => 'nullable|numeric|min:0',
            'commission_safe_id' => 'nullable|string',
            'down_payment_safe_id' => 'nullable|string',
            'maintenance_deposit' => 'nullable|numeric|min:0',
            'installment_type' => 'nullable|string|in:شهري,ربع سنوي,نصف سنوي,سنوي',
            'installment_count' => 'nullable|integer|min:0',
            'extra_annual' => 'nullable|integer|min:0',
            'annual_payment_value' => 'nullable|numeric|min:0',
            'down_payment' => 'nullable|numeric|min:0',
            'payment_type' => 'nullable|string|in:installment,cash',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $contract->update($request->all());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Contract updated successfully',
                'data' => new ContractResource($contract->load(['unit', 'customer']))
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update contract',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Contract $contract): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Update unit status back to available
            $unit = $contract->unit;
            if ($unit) {
                $unit->update(['status' => 'متاحة']);
            }

            $contract->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Contract deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete contract',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}