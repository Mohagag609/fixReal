<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PartnerDebtResource;
use App\Models\PartnerDebt;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PartnerDebtController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = PartnerDebt::with(['partner', 'unit']);

            // Apply filters
            if ($request->has('partner_id')) {
                $query->where('partner_id', $request->get('partner_id'));
            }

            if ($request->has('unit_id')) {
                $query->where('unit_id', $request->get('unit_id'));
            }

            if ($request->has('status')) {
                $query->where('status', $request->get('status'));
            }

            if ($request->has('amount_from')) {
                $query->where('amount', '>=', $request->get('amount_from'));
            }

            if ($request->has('amount_to')) {
                $query->where('amount', '<=', $request->get('amount_to'));
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $partnerDebts = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => PartnerDebtResource::collection($partnerDebts->items()),
                'pagination' => [
                    'current_page' => $partnerDebts->currentPage(),
                    'last_page' => $partnerDebts->lastPage(),
                    'per_page' => $partnerDebts->perPage(),
                    'total' => $partnerDebts->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch partner debts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'partner_id' => 'required|exists:partners,id',
                'unit_id' => 'required|exists:units,id',
                'amount' => 'required|numeric|min:0',
                'due_date' => 'required|date',
                'status' => 'required|in:pending,paid,overdue',
                'notes' => 'nullable|string|max:1000'
            ]);

            $validated['id'] = Str::uuid();

            $partnerDebt = PartnerDebt::create($validated);

            return response()->json([
                'success' => true,
                'data' => new PartnerDebtResource($partnerDebt),
                'message' => 'Partner debt created successfully'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create partner debt',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        try {
            $partnerDebt = PartnerDebt::with(['partner', 'unit'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => new PartnerDebtResource($partnerDebt)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Partner debt not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $partnerDebt = PartnerDebt::findOrFail($id);

            $validated = $request->validate([
                'partner_id' => 'required|exists:partners,id',
                'unit_id' => 'required|exists:units,id',
                'amount' => 'required|numeric|min:0',
                'due_date' => 'required|date',
                'status' => 'required|in:pending,paid,overdue',
                'notes' => 'nullable|string|max:1000'
            ]);

            $partnerDebt->update($validated);

            return response()->json([
                'success' => true,
                'data' => new PartnerDebtResource($partnerDebt),
                'message' => 'Partner debt updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update partner debt',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(string $id): JsonResponse
    {
        try {
            $partnerDebt = PartnerDebt::findOrFail($id);
            $partnerDebt->delete();

            return response()->json([
                'success' => true,
                'message' => 'Partner debt deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete partner debt',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function markAsPaid(Request $request, string $id): JsonResponse
    {
        try {
            $partnerDebt = PartnerDebt::findOrFail($id);

            $validated = $request->validate([
                'payment_date' => 'required|date',
                'notes' => 'nullable|string|max:1000'
            ]);

            $partnerDebt->update([
                'status' => 'paid',
                'paid_date' => $validated['payment_date'],
                'notes' => $validated['notes'] ?? $partnerDebt->notes
            ]);

            return response()->json([
                'success' => true,
                'data' => new PartnerDebtResource($partnerDebt),
                'message' => 'Partner debt marked as paid'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark partner debt as paid',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getOverdue(): JsonResponse
    {
        try {
            $overdueDebts = PartnerDebt::with(['partner', 'unit'])
                ->where('status', 'overdue')
                ->orWhere(function ($query) {
                    $query->where('status', 'pending')
                          ->where('due_date', '<', now());
                })
                ->get();

            return response()->json([
                'success' => true,
                'data' => PartnerDebtResource::collection($overdueDebts)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch overdue partner debts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getStats(): JsonResponse
    {
        try {
            $stats = [
                'total' => PartnerDebt::count(),
                'pending' => PartnerDebt::where('status', 'pending')->count(),
                'paid' => PartnerDebt::where('status', 'paid')->count(),
                'overdue' => PartnerDebt::where('status', 'overdue')->count(),
                'total_amount' => PartnerDebt::sum('amount'),
                'pending_amount' => PartnerDebt::where('status', 'pending')->sum('amount'),
                'paid_amount' => PartnerDebt::where('status', 'paid')->sum('amount'),
                'overdue_amount' => PartnerDebt::where('status', 'overdue')->sum('amount')
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch partner debt statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}