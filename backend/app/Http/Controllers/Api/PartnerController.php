<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PartnerResource;
use App\Models\Partner;
use App\Models\PartnerGroup;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PartnerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Partner::with(['groups']);

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('national_id', 'like', "%{$search}%");
        }

        // Group filter
        if ($request->has('group_id')) {
            $query->whereHas('groups', function($q) use ($request) {
                $q->where('partner_groups.id', $request->group_id);
            });
        }

        // Status filter
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $partners = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => PartnerResource::collection($partners),
            'pagination' => [
                'current_page' => $partners->currentPage(),
                'last_page' => $partners->lastPage(),
                'per_page' => $partners->perPage(),
                'total' => $partners->total(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'national_id' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive',
            'notes' => 'nullable|string',
            'groups' => 'nullable|array',
            'groups.*' => 'exists:partner_groups,id',
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

            $partner = Partner::create($request->except('groups'));

            // Attach groups
            if ($request->has('groups')) {
                $partner->groups()->attach($request->groups);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Partner created successfully',
                'data' => new PartnerResource($partner->load(['groups']))
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create partner',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Partner $partner): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new PartnerResource($partner->load(['groups']))
        ]);
    }

    public function update(Request $request, Partner $partner): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'national_id' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive',
            'notes' => 'nullable|string',
            'groups' => 'nullable|array',
            'groups.*' => 'exists:partner_groups,id',
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

            $partner->update($request->except('groups'));

            // Sync groups
            if ($request->has('groups')) {
                $partner->groups()->sync($request->groups);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Partner updated successfully',
                'data' => new PartnerResource($partner->load(['groups']))
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update partner',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Partner $partner): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Detach all groups
            $partner->groups()->detach();

            $partner->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Partner deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete partner',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getStats(): JsonResponse
    {
        $totalPartners = Partner::count();
        $activePartners = Partner::where('status', 'active')->count();
        $inactivePartners = Partner::where('status', 'inactive')->count();
        $totalGroups = PartnerGroup::count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_partners' => $totalPartners,
                'active_partners' => $activePartners,
                'inactive_partners' => $inactivePartners,
                'total_groups' => $totalGroups,
            ]
        ]);
    }
}