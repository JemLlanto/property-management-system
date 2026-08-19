<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\JWTGuard;

class AuthController extends Controller
{
    // Helper to get the JWT guard with correct type hints
    // This is the fix — casting auth('api') to JWTGuard so PHP knows
    // it has attempt(), invalidate(), etc.
    private function jwtGuard(): JWTGuard
    {
        /** @var JWTGuard $guard */
        $guard = auth('api');
        return $guard;
    }
    // ─── HELPER: Build the httpOnly cookie ───────────────────────────────────
    // We extract this into a helper so all methods (login, register) use it consistently

    private function makeTokenCookie(string $token)
    {
        return cookie(
            'jwt_token',        // cookie name (read by your frontend via fetch credentials)
            $token,             // the JWT string
            config('jwt.ttl'), // expiry in minutes — matches JWT_TTL in .env
            '/',                // path: accessible on all routes
            null,               // domain: null = current domain
            true,               // secure: HTTPS only (set false in local dev if needed)
            true,               // httpOnly: JS CANNOT read this cookie — prevents XSS theft
            false,              // raw: don't URL-encode
            'Strict'            // sameSite: blocks cross-site requests — prevents CSRF
        );
    }

    // ─── REGISTER ─────────────────────────────────────────────────────────────
    // POST /api/register
    public function register(Request $request)
    {
        // validate() automatically returns a 422 error with messages if rules fail
        $validated = $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:255'],
            'email' => ['required', 'string', 'min:3', 'max:255', 'unique:users,email'],
            // Password::min(8) enforces at least 8 chars, mixed case, and a number
            'password' => ['required', Password::min(8)->mixedCase()->numbers()],
        ]);

        // User::create() mass-assigns the validated fields
        // The 'hashed' cast on the model auto-bcrypts the password
        $user = User::create($validated);

        // auth('api') uses our JWT guard; attempt() verifies credentials and returns a token
        // We re-use the validated data to log the user in right after registering
        $token = $this->jwtGuard()->attempt([
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);

        // withCookie() attaches the httpOnly cookie to the response
        // The token is NOT in the response body — only in the cookie
        return response()->json([
            'success' => true,
            'message' => 'Registered successfully.',
            'user' => $user,
        ], 201)->withCookie($this->makeTokenCookie($token));
    }

    // ─── LOGIN ────────────────────────────────────────────────────────────────
    // POST /api/login
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // auth()->attempt() checks credentials against the DB
        // It uses Hash::check() internally — safe against timing attacks
        $token = $this->jwtGuard()->attempt([
            'email' => $request->email,
            'password' => $request->password,
        ]);

        // If credentials don't match, attempt() returns false
        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials.',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged in successfully.',
        ], 200)->withCookie($this->makeTokenCookie($token));
    }

    // ─── LOGOUT ───────────────────────────────────────────────────────────────
    // POST /api/logout  (protected route — must be authenticated)
    public function logout()
    {
        // invalidate() blacklists the current JWT so it can't be reused
        $this->jwtGuard()->invalidate(true);

        // Also clear the cookie on the client by returning an expired one
        $expiredCookie = cookie()->forget('jwt_token');

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ])->withCookie($expiredCookie);
    }

    // ─── ME ───────────────────────────────────────────────────────────────────
    // GET /api/me  (protected route — returns the currently authenticated user)
    public function me()
    {
        // auth()->user() reads the JWT from the cookie, validates it,
        // then loads and returns the matching User model
        return response()->json([
            'success' => true,
            'user' => auth('api')->user()
        ]);
    }

}
