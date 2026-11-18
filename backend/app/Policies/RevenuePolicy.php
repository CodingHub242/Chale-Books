<?php

namespace App\Policies;

use App\Models\Revenue;
use App\Models\User;

class RevenuePolicy
{
    public function view(User $user, Revenue $revenue): bool
    {
        return $user->id === $revenue->user_id;
    }

    public function update(User $user, Revenue $revenue): bool
    {
        return $user->id === $revenue->user_id;
    }

    public function delete(User $user, Revenue $revenue): bool
    {
        return $user->id === $revenue->user_id;
    }
}
