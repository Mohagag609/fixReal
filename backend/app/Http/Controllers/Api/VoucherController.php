<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VoucherResource;
use App\Models\Voucher;
use App\Models\Safe;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class VoucherController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Voucher::with(['safe', 'unit']);

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('description', 'like', "%{$search}%")
                  ->orWhere('payer', 'like', "%{$search}%")
                  ->orWhere('beneficiary', 'like', "%{$search}%");
        }

        // Type filter
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Date range filter
        if ($request->has('start_date')) {
            $query->where('date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('date', '<=', $request->end_date);
        }

        // Amount range filter
        if ($request->has('min_amount')) {
            $query->where('amount', '>=', $request->min_amount);
        }
        if ($request->has('max_amount')) {
            $query->where('amount', '<=', $request->max_amount);
        }

        // Safe filter
        if ($request->has('safe_id')) {
            $query->where('safe_id', $request->safe_id);
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $vouchers = $query->orderBy('date', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => VoucherResource::collection($vouchers),
            'pagination' => [
                'current_page' => $vouchers->currentPage(),
                'last_page' => $vouchers->lastPage(),
                'per_page' => $vouchers->perPage(),
                'total' => $vouchers->total(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|string|in:receipt,payment',
            'date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'safe_id' => 'required|exists:safes,id',
            'description' => 'required|string|max:255',
            'payer' => 'nullable|string|max:255',
            'beneficiary' => 'nullable|string|max:255',
            'linked_ref' => 'nullable|string',
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

            $voucher = Voucher::create($request->all());

            // Update safe balance
            $safe = Safe::find($request->safe_id);
            if ($safe) {
                $operation = $request->type === 'receipt' ? 'add' : 'subtract';
                $safe->updateBalance($request->amount, $operation);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Voucher created successfully',
                'data' => new VoucherResource($voucher->load(['safe', 'unit']))
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create voucher',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Voucher $voucher): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new VoucherResource($voucher->load(['safe', 'unit']))
        ]);
    }

    public function update(Request $request, Voucher $voucher): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|string|in:receipt,payment',
            'date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'safe_id' => 'required|exists:safes,id',
            'description' => 'required|string|max:255',
            'payer' => 'nullable|string|max:255',
            'beneficiary' => 'nullable|string|max:255',
            'linked_ref' => 'nullable|string',
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

            // Revert old safe balance
            $oldSafe = $voucher->safe;
            if ($oldSafe) {
                $oldOperation = $voucher->type === 'receipt' ? 'subtract' : 'add';
                $oldSafe->updateBalance($voucher->amount, $oldOperation);
            }

            $voucher->update($request->all());

            // Update new safe balance
            $newSafe = Safe::find($request->safe_id);
            if ($newSafe) {
                $newOperation = $request->type === 'receipt' ? 'add' : 'subtract';
                $newSafe->updateBalance($request->amount, $newOperation);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Voucher updated successfully',
                'data' => new VoucherResource($voucher->load(['safe', 'unit']))
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update voucher',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Voucher $voucher): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Revert safe balance
            $safe = $voucher->safe;
            if ($safe) {
                $operation = $voucher->type === 'receipt' ? 'subtract' : 'add';
                $safe->updateBalance($voucher->amount, $operation);
            }

            $voucher->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Voucher deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete voucher',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getStats(): JsonResponse
    {
        $totalReceipts = Voucher::where('type', 'receipt')->sum('amount');
        $totalPayments = Voucher::where('type', 'payment')->sum('amount');
        $totalVouchers = Voucher::count();
        $receiptsCount = Voucher::where('type', 'receipt')->count();
        $paymentsCount = Voucher::where('type', 'payment')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_receipts' => $totalReceipts,
                'total_payments' => $totalPayments,
                'total_vouchers' => $totalVouchers,
                'receipts_count' => $receiptsCount,
                'payments_count' => $paymentsCount,
                'net_balance' => $totalReceipts - $totalPayments,
            ]
        ]);
    }
}