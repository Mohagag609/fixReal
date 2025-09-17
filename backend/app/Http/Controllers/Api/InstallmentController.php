<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InstallmentResource;
use App\Models\Installment;
use App\Models\Unit;
use App\Models\Safe;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class InstallmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Installment::with(['unit']);

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('unit', function($q) use ($search) {
                $q->where('code', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Date range filter
        if ($request->has('start_date')) {
            $query->where('due_date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('due_date', '<=', $request->end_date);
        }

        // Amount range filter
        if ($request->has('min_amount')) {
            $query->where('amount', '>=', $request->min_amount);
        }
        if ($request->has('max_amount')) {
            $query->where('amount', '<=', $request->max_amount);
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $installments = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => InstallmentResource::collection($installments),
            'pagination' => [
                'current_page' => $installments->currentPage(),
                'last_page' => $installments->lastPage(),
                'per_page' => $installments->perPage(),
                'total' => $installments->total(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'unit_id' => 'required|exists:units,id',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'status' => 'nullable|string|in:معلق,مدفوع,متأخر',
            'notes' => 'nullable|string',
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

            $installment = Installment::create($request->all());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Installment created successfully',
                'data' => new InstallmentResource($installment->load(['unit']))
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create installment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Installment $installment): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new InstallmentResource($installment->load(['unit']))
        ]);
    }

    public function update(Request $request, Installment $installment): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'unit_id' => 'required|exists:units,id',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'status' => 'nullable|string|in:معلق,مدفوع,متأخر',
            'notes' => 'nullable|string',
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

            $installment->update($request->all());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Installment updated successfully',
                'data' => new InstallmentResource($installment->load(['unit']))
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update installment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Installment $installment): JsonResponse
    {
        try {
            DB::beginTransaction();

            $installment->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Installment deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete installment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function markAsPaid(Request $request, Installment $installment): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'safe_id' => 'required|exists:safes,id',
            'payer' => 'nullable|string',
            'beneficiary' => 'nullable|string',
            'notes' => 'nullable|string',
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

            // Update installment status
            $installment->update([
                'status' => 'مدفوع',
                'notes' => $request->notes ?? $installment->notes,
            ]);

            // Create voucher
            \App\Models\Voucher::create([
                'type' => 'receipt',
                'date' => now(),
                'amount' => $installment->amount,
                'safe_id' => $request->safe_id,
                'description' => "دفع قسط للوحدة {$installment->unit->code}",
                'payer' => $request->payer ?? null,
                'beneficiary' => $request->beneficiary ?? null,
                'linked_ref' => $installment->unit_id,
            ]);

            // Update safe balance
            $safe = Safe::find($request->safe_id);
            if ($safe) {
                $safe->updateBalance($installment->amount, 'add');
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Installment marked as paid successfully',
                'data' => new InstallmentResource($installment->load(['unit']))
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark installment as paid',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getOverdue(): JsonResponse
    {
        $overdueInstallments = Installment::where('due_date', '<', now())
            ->where('status', 'معلق')
            ->with(['unit'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => InstallmentResource::collection($overdueInstallments)
        ]);
    }
}