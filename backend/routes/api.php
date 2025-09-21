<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\InstallmentController;
use App\Http\Controllers\Api\VoucherController;
use App\Http\Controllers\Api\PartnerController;
use App\Http\Controllers\Api\PartnerGroupController;
use App\Http\Controllers\Api\SafeController;
use App\Http\Controllers\Api\BrokerController;
use App\Http\Controllers\Api\BrokerDueController;
use App\Http\Controllers\Api\PartnerDebtController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\NotificationController;

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

// Partner Debts
Route::apiResource('partner-debts', PartnerDebtController::class);
Route::post('partner-debts/{debt}/mark-paid', [PartnerDebtController::class, 'markAsPaid']);
Route::get('partner-debts/overdue', [PartnerDebtController::class, 'getOverdue']);
Route::get('partner-debts/stats', [PartnerDebtController::class, 'getStats']);

// Brokers
Route::apiResource('brokers', BrokerController::class);
Route::get('brokers/stats', [BrokerController::class, 'getStats']);

// Broker Dues
Route::apiResource('broker-dues', BrokerDueController::class);
Route::post('broker-dues/{due}/mark-paid', [BrokerDueController::class, 'markAsPaid']);
Route::get('broker-dues/overdue', [BrokerDueController::class, 'getOverdue']);

// Audit Logs
Route::apiResource('audit-logs', AuditLogController::class);
Route::get('audit-logs/stats', [AuditLogController::class, 'getStats']);

// Settings
Route::apiResource('settings', SettingsController::class);
Route::get('settings/key/{key}', [SettingsController::class, 'getByKey']);
Route::put('settings/key/{key}', [SettingsController::class, 'updateByKey']);

// Notifications
Route::apiResource('notifications', NotificationController::class);
Route::post('notifications/{notification}/mark-read', [NotificationController::class, 'markAsRead']);
Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
Route::get('notifications/unread-count', [NotificationController::class, 'getUnreadCount']);

// Health check
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is running',
        'timestamp' => now()
    ]);
});