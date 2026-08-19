<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class JwtFromCookie
{
    public function handle(Request $request, Closure $next)
    {
        // If a jwt_token cookie exists and there's no Authorization header yet,
        // inject it as a Bearer token so the JWT guard can find it automatically
        if ($request->hasCookie('jwt_token') && !$request->bearerToken()) {
            $request->headers->set(
                'Authorization',
                'Bearer ' . $request->cookie('jwt_token')
            );
        }

        // Continue to the next middleware/controller
        return $next($request);
    }
}
