<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BrokerDueResource;
use App\Models\BrokerDue;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BrokerDueController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = BrokerDue::with(['broker', 'contract']);

            // Apply filters
            if ($request->has('broker_id')) {
                $query->where('broker_id', $request->get('broker_id'));
            }

            if ($request->has('contract_id')) {
                $query->where('contract_id', $request->get('contract_id'));
            }

            if ($request->has('status')) {
                $query->where('status', $request->get('status'));
            }

            if ($request->has('due_date_from')) {
                $query->where('due_date', '>=', $request->get('due_date_from'));
            }

            if ($request->has('due_date_to')) {
                $query->where('due_date', '<=', $request->get('due_date_to'));
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $brokerDues = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => BrokerDueResource::collection($brokerDues->items()),
                'pagination' => [
                    'current_page' => $brokerDues->currentPage(),
                    'last_page' => $brokerDues->lastPage(),
                    'per_page' => $brokerDues->perPage(),
                    'total' => $brokerDues->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch broker dues',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'broker_id' => 'required|exists:brokers,id',
                'contract_id' => 'required|exists:contracts,id',
                'amount' => 'required|numeric|min:0',
                'due_date' => 'required|date',
                'status' => 'required|in:pending,paid,overdue',
                'notes' => 'nullable|string|max:1000'
            ]);

            $validated['id'] = Str::uuid();

            $brokerDue = BrokerDue::create($validated);

            return response()->json([
                'success' => true,
                'data' => new BrokerDueResource($brokerDue),
                'message' => 'Broker due created successfully'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create broker due',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        try {
            $brokerDue = BrokerDue::with(['broker', 'contract'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => new BrokerDueResource($brokerDue)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Broker due not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $brokerDue = BrokerDue::findOrFail($id);

            $validated = $request->validate([
                'broker_id' => 'required|exists:brokers,id',
                'contract_id' => 'required|exists:contracts,id',
                'amount' => 'required|numeric|min:0',
                'due_date' => 'required|date',
                'status' => 'required|in:pending,paid,overdue',
                'notes' => 'nullable|string|max:1000'
            ]);

            $brokerDue->update($validated);

            return response()->json([
                'success' => true,
                'data' => new BrokerDueResource($brokerDue),
                'message' => 'Broker due updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update broker due',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(string $id): JsonResponse
    {
        try {
            $brokerDue = BrokerDue::findOrFail($id);
            $brokerDue->delete();

            return response()->json([
                'success' => true,
                'message' => 'Broker due deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete broker due',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function markAsPaid(Request $request, string $id): JsonResponse
    {
        try {
            $brokerDue = BrokerDue::findOrFail($id);

            $validated = $request->validate([
                'payment_date' => 'required|date',
                'notes' => 'nullable|string|max:1000'
            ]);

            $brokerDue->update([
                'status' => 'paid',
                'paid_date' => $validated['payment_date'],
                'notes' => $validated['notes'] ?? $brokerDue->notes
            ]);

            return response()->json([
                'success' => true,
                'data' => new BrokerDueResource($brokerDue),
                'message' => 'Broker due marked as paid'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark broker due as paid',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getOverdue(): JsonResponse
    {
        try {
            $overdueDues = BrokerDue::with(['broker', 'contract'])
                ->where('status', 'overdue')
                ->orWhere(function ($query) {
                    $query->where('status', 'pending')
                          ->where('due_date', '<', now());
                })
                ->get();

            return response()->json([
                'success' => true,
                'data' => BrokerDueResource::collection($overdueDues)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch overdue broker dues',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}