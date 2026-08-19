<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use Notifiable;

    // $fillable = columns that are safe to mass-assign (e.g. User::create([...]))
    // Without this, Laravel blocks mass assignment as a security measure
    protected $fillable = ['username', 'email', 'password'];

    // $hidden = columns NEVER included in JSON responses (protects sensitive data)
    protected $hidden = ['password', 'remember_token'];

    // Casts automatically transform data when reading/writing
    // 'hashed' means: whenever you set $user->password = 'abc', Laravel
    // automatically bcrypt-hashes it — you never store plain text passwords
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    // REQUIRED by JWTSubject — returns the unique identifier for the JWT payload
    // This becomes the "sub" (subject) claim in the token: { sub: 1, iat: ..., exp: ... }
    public function getJWTIdentifier()
    {
        return $this->getKey(); // returns the user's primary key (id)
    }

    // REQUIRED by JWTSubject — lets you add extra data to the JWT payload
    // Return an empty array if you don't need custom claims
    public function getJWTCustomClaims(): array
    {
        return [];
    }
}
