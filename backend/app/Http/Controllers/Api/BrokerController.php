<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BrokerResource;
use App\Models\Broker;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BrokerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Broker::query();

            // Apply filters
            if ($request->has('search')) {
                $search = $request->get('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($request->has('status')) {
                $query->where('status', $request->get('status'));
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $brokers = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => BrokerResource::collection($brokers->items()),
                'pagination' => [
                    'current_page' => $brokers->currentPage(),
                    'last_page' => $brokers->lastPage(),
                    'per_page' => $brokers->perPage(),
                    'total' => $brokers->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch brokers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'address' => 'nullable|string|max:500',
                'commission_rate' => 'required|numeric|min:0|max:100',
                'status' => 'required|in:active,inactive',
                'notes' => 'nullable|string|max:1000'
            ]);

            $validated['id'] = Str::uuid();

            $broker = Broker::create($validated);

            return response()->json([
                'success' => true,
                'data' => new BrokerResource($broker),
                'message' => 'Broker created successfully'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create broker',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        try {
            $broker = Broker::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => new BrokerResource($broker)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Broker not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $broker = Broker::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'address' => 'nullable|string|max:500',
                'commission_rate' => 'required|numeric|min:0|max:100',
                'status' => 'required|in:active,inactive',
                'notes' => 'nullable|string|max:1000'
            ]);

            $broker->update($validated);

            return response()->json([
                'success' => true,
                'data' => new BrokerResource($broker),
                'message' => 'Broker updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update broker',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(string $id): JsonResponse
    {
        try {
            $broker = Broker::findOrFail($id);
            $broker->delete();

            return response()->json([
                'success' => true,
                'message' => 'Broker deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete broker',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getStats(): JsonResponse
    {
        try {
            $stats = [
                'total' => Broker::count(),
                'active' => Broker::where('status', 'active')->count(),
                'inactive' => Broker::where('status', 'inactive')->count(),
                'total_commission' => Broker::sum('commission_rate'),
                'average_commission' => Broker::avg('commission_rate')
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch broker statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}