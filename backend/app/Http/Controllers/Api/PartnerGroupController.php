<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PartnerGroupResource;
use App\Models\PartnerGroup;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PartnerGroupController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PartnerGroup::withCount('partners');

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $groups = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => PartnerGroupResource::collection($groups),
            'pagination' => [
                'current_page' => $groups->currentPage(),
                'last_page' => $groups->lastPage(),
                'per_page' => $groups->perPage(),
                'total' => $groups->total(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'partners' => 'nullable|array',
            'partners.*' => 'exists:partners,id',
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

            $group = PartnerGroup::create($request->except('partners'));

            // Attach partners
            if ($request->has('partners')) {
                $group->partners()->attach($request->partners);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Partner group created successfully',
                'data' => new PartnerGroupResource($group->loadCount('partners'))
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create partner group',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(PartnerGroup $partnerGroup): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new PartnerGroupResource($partnerGroup->loadCount('partners'))
        ]);
    }

    public function update(Request $request, PartnerGroup $partnerGroup): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'partners' => 'nullable|array',
            'partners.*' => 'exists:partners,id',
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

            $partnerGroup->update($request->except('partners'));

            // Sync partners
            if ($request->has('partners')) {
                $partnerGroup->partners()->sync($request->partners);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Partner group updated successfully',
                'data' => new PartnerGroupResource($partnerGroup->loadCount('partners'))
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update partner group',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(PartnerGroup $partnerGroup): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Detach all partners
            $partnerGroup->partners()->detach();

            $partnerGroup->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Partner group deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete partner group',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function addPartner(Request $request, PartnerGroup $partnerGroup): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'partner_id' => 'required|exists:partners,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $partnerGroup->partners()->syncWithoutDetaching([$request->partner_id]);

            return response()->json([
                'success' => true,
                'message' => 'Partner added to group successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add partner to group',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function removePartner(Request $request, PartnerGroup $partnerGroup): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'partner_id' => 'required|exists:partners,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $partnerGroup->partners()->detach($request->partner_id);

            return response()->json([
                'success' => true,
                'message' => 'Partner removed from group successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove partner from group',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}