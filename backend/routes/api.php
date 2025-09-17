<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\UnitController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Dashboard
Route::get('/dashboard', [DashboardController::class, 'index']);

// Customers
Route::apiResource('customers', CustomerController::class);

// Units
Route::apiResource('units', UnitController::class);

// Contracts
Route::apiResource('contracts', ContractController::class);

// Installments
Route::apiResource('installments', InstallmentController::class);
Route::post('installments/{installment}/mark-paid', [InstallmentController::class, 'markAsPaid']);
Route::get('installments/overdue', [InstallmentController::class, 'getOverdue']);

// Vouchers
Route::apiResource('vouchers', VoucherController::class);
Route::get('vouchers/stats', [VoucherController::class, 'getStats']);

// Partners
Route::apiResource('partners', PartnerController::class);
Route::get('partners/stats', [PartnerController::class, 'getStats']);

// Partner Groups
Route::apiResource('partner-groups', PartnerGroupController::class);
Route::post('partner-groups/{group}/add-partner', [PartnerGroupController::class, 'addPartner']);
Route::post('partner-groups/{group}/remove-partner', [PartnerGroupController::class, 'removePartner']);

// Safes
Route::apiResource('safes', SafeController::class);
Route::get('safes/stats', [SafeController::class, 'getStats']);
Route::get('safes/{safe}/transactions', [SafeController::class, 'getTransactions']);
Route::post('safes/transfer', [SafeController::class, 'transfer']);

// Health check
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is running',
        'timestamp' => now()
    ]);
});