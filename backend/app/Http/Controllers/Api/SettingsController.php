<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SettingsResource;
use App\Models\Settings;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class SettingsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Settings::query();

            // Apply filters
            if ($request->has('is_public')) {
                $query->where('is_public', $request->get('is_public'));
            }

            if ($request->has('type')) {
                $query->where('type', $request->get('type'));
            }

            if ($request->has('search')) {
                $search = $request->get('search');
                $query->where(function ($q) use ($search) {
                    $q->where('key', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $settings = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => SettingsResource::collection($settings->items()),
                'pagination' => [
                    'current_page' => $settings->currentPage(),
                    'last_page' => $settings->lastPage(),
                    'per_page' => $settings->perPage(),
                    'total' => $settings->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'key' => 'required|string|max:255|unique:settings,key',
                'value' => 'required|string',
                'description' => 'nullable|string|max:1000',
                'type' => 'required|in:string,number,boolean,json',
                'is_public' => 'boolean'
            ]);

            $validated['id'] = Str::uuid();
            $validated['is_public'] = $validated['is_public'] ?? false;

            $setting = Settings::create($validated);

            return response()->json([
                'success' => true,
                'data' => new SettingsResource($setting),
                'message' => 'Setting created successfully'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create setting',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        try {
            $setting = Settings::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => new SettingsResource($setting)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Setting not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $setting = Settings::findOrFail($id);

            $validated = $request->validate([
                'key' => 'required|string|max:255|unique:settings,key,' . $id,
                'value' => 'required|string',
                'description' => 'nullable|string|max:1000',
                'type' => 'required|in:string,number,boolean,json',
                'is_public' => 'boolean'
            ]);

            $validated['is_public'] = $validated['is_public'] ?? false;

            $setting->update($validated);

            return response()->json([
                'success' => true,
                'data' => new SettingsResource($setting),
                'message' => 'Setting updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update setting',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(string $id): JsonResponse
    {
        try {
            $setting = Settings::findOrFail($id);
            $setting->delete();

            return response()->json([
                'success' => true,
                'message' => 'Setting deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete setting',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getByKey(string $key): JsonResponse
    {
        try {
            $setting = Settings::where('key', $key)->first();

            if (!$setting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Setting not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => new SettingsResource($setting)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch setting',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateByKey(Request $request, string $key): JsonResponse
    {
        try {
            $validated = $request->validate([
                'value' => 'required|string',
                'description' => 'nullable|string|max:1000',
                'type' => 'required|in:string,number,boolean,json',
                'is_public' => 'boolean'
            ]);

            $validated['is_public'] = $validated['is_public'] ?? false;

            $setting = Settings::updateOrCreate(
                ['key' => $key],
                $validated
            );

            return response()->json([
                'success' => true,
                'data' => new SettingsResource($setting),
                'message' => 'Setting updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update setting',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}