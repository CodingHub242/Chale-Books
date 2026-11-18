<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::where('email', 'test@example.com')->first();
$adminRole = \App\Models\Role::where('name', 'admin')->first();

if ($user && $adminRole) {
    $user->roles()->attach($adminRole);
    echo "Role assigned successfully\n";
} else {
    echo "User or role not found\n";
}
