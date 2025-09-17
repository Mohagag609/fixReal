<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = AuditLog::with('user');

            // Apply filters
            if ($request->has('user_id')) {
                $query->where('user_id', $request->get('user_id'));
            }

            if ($request->has('action')) {
                $query->where('action', $request->get('action'));
            }

            if ($request->has('table_name')) {
                $query->where('table_name', $request->get('table_name'));
            }

            if ($request->has('date_from')) {
                $query->where('created_at', '>=', $request->get('date_from'));
            }

            if ($request->has('date_to')) {
                $query->where('created_at', '<=', $request->get('date_to'));
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $auditLogs = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => AuditLogResource::collection($auditLogs->items()),
                'pagination' => [
                    'current_page' => $auditLogs->currentPage(),
                    'last_page' => $auditLogs->lastPage(),
                    'per_page' => $auditLogs->perPage(),
                    'total' => $auditLogs->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch audit logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        try {
            $auditLog = AuditLog::with('user')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => new AuditLogResource($auditLog)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Audit log not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function getStats(): JsonResponse
    {
        try {
            $stats = [
                'total' => AuditLog::count(),
                'today' => AuditLog::whereDate('created_at', today())->count(),
                'this_week' => AuditLog::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
                'this_month' => AuditLog::whereMonth('created_at', now()->month)->count(),
                'actions' => AuditLog::selectRaw('action, COUNT(*) as count')
                    ->groupBy('action')
                    ->orderBy('count', 'desc')
                    ->get(),
                'tables' => AuditLog::selectRaw('table_name, COUNT(*) as count')
                    ->groupBy('table_name')
                    ->orderBy('count', 'desc')
                    ->get()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch audit log statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}