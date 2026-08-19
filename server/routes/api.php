<?php
// routes/api.php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ItemController;
use Illuminate\Support\Facades\Route;

// Public routes — no authentication required
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');;
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1'); // Rate limit: max 5 login attempts per minute per IP

// Protected routes — JWT required (will return 401 if no valid token)
Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::apiResource('items', ItemController::class);
});
