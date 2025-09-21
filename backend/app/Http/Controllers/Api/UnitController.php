<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UnitResource;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class UnitController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Unit::query();

        // Search
        if ($request->has('search')) {
            $query->search($request->search);
        }

        // Status filter
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Unit type filter
        if ($request->has('unit_type')) {
            $query->where('unit_type', $request->unit_type);
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
        $units = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => UnitResource::collection($units),
            'pagination' => [
                'current_page' => $units->currentPage(),
                'last_page' => $units->lastPage(),
                'per_page' => $units->perPage(),
                'total' => $units->total(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|unique:units,code',
            'name' => 'nullable|string|max:255',
            'unit_type' => 'required|string|in:سكني,تجاري,إداري',
            'area' => 'nullable|string',
            'floor' => 'nullable|string',
            'building' => 'nullable|string',
            'total_price' => 'required|numeric|min:0',
            'status' => 'nullable|string|in:متاحة,مباعة,محجوزة',
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

            $unit = Unit::create($request->all());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Unit created successfully',
                'data' => new UnitResource($unit)
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create unit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Unit $unit): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new UnitResource($unit)
        ]);
    }

    public function update(Request $request, Unit $unit): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|unique:units,code,' . $unit->id,
            'name' => 'nullable|string|max:255',
            'unit_type' => 'required|string|in:سكني,تجاري,إداري',
            'area' => 'nullable|string',
            'floor' => 'nullable|string',
            'building' => 'nullable|string',
            'total_price' => 'required|numeric|min:0',
            'status' => 'nullable|string|in:متاحة,مباعة,محجوزة',
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

            $unit->update($request->all());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Unit updated successfully',
                'data' => new UnitResource($unit)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update unit',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Unit $unit): JsonResponse
    {
        try {
            DB::beginTransaction();

            $unit->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Unit deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete unit',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}