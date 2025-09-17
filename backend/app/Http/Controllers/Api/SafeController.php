<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SafeResource;
use App\Models\Safe;
use App\Models\Voucher;
use App\Models\Transfer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SafeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Safe::query();

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $safes = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => SafeResource::collection($safes),
            'pagination' => [
                'current_page' => $safes->currentPage(),
                'last_page' => $safes->lastPage(),
                'per_page' => $safes->perPage(),
                'total' => $safes->total(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'initial_balance' => 'nullable|numeric|min:0',
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

            $safe = Safe::create([
                'name' => $request->name,
                'description' => $request->description,
                'balance' => $request->initial_balance ?? 0,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Safe created successfully',
                'data' => new SafeResource($safe)
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create safe',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Safe $safe): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new SafeResource($safe)
        ]);
    }

    public function update(Request $request, Safe $safe): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
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

            $safe->update($request->only(['name', 'description']));

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Safe updated successfully',
                'data' => new SafeResource($safe)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update safe',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Safe $safe): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Check if safe has transactions
            $hasTransactions = Voucher::where('safe_id', $safe->id)->exists() ||
                              Transfer::where('from_safe_id', $safe->id)->exists() ||
                              Transfer::where('to_safe_id', $safe->id)->exists();

            if ($hasTransactions) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete safe with existing transactions'
                ], 422);
            }

            $safe->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Safe deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete safe',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getTransactions(Request $request, Safe $safe): JsonResponse
    {
        $query = Voucher::where('safe_id', $safe->id)
            ->orderBy('date', 'desc');

        // Date range filter
        if ($request->has('start_date')) {
            $query->where('date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('date', '<=', $request->end_date);
        }

        // Type filter
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $transactions = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $transactions->items(),
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ]
        ]);
    }

    public function getStats(): JsonResponse
    {
        $totalSafes = Safe::count();
        $totalBalance = Safe::sum('balance');
        $totalReceipts = Voucher::where('type', 'receipt')->sum('amount');
        $totalPayments = Voucher::where('type', 'payment')->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'total_safes' => $totalSafes,
                'total_balance' => $totalBalance,
                'total_receipts' => $totalReceipts,
                'total_payments' => $totalPayments,
                'net_balance' => $totalReceipts - $totalPayments,
            ]
        ]);
    }

    public function transfer(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'from_safe_id' => 'required|exists:safes,id',
            'to_safe_id' => 'required|exists:safes,id|different:from_safe_id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string',
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

            $fromSafe = Safe::find($request->from_safe_id);
            $toSafe = Safe::find($request->to_safe_id);

            // Check if from safe has sufficient balance
            if ($fromSafe->balance < $request->amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient balance in source safe'
                ], 422);
            }

            // Update balances
            $fromSafe->updateBalance($request->amount, 'subtract');
            $toSafe->updateBalance($request->amount, 'add');

            // Create transfer record
            Transfer::create([
                'from_safe_id' => $request->from_safe_id,
                'to_safe_id' => $request->to_safe_id,
                'amount' => $request->amount,
                'description' => $request->description,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transfer completed successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete transfer',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}