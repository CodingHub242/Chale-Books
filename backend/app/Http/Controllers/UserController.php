<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index()
    {
         //if user email is test@example.com assign admin role to the user
        // if (auth()->user()->email === 'test@example.com') {
        //     auth()->user()->assignRole('admin');
        //     dd('Admin role assigned to user');
        // }
        // Only admins can view users
        if (!auth()->user()->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

       // dd(auth()->user());
       

        return User::with('roles')->get();
    }

    public function store(Request $request)
    {
        // Only admins can create users
        if (!auth()->user()->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string|exists:roles,name'
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            //get user's currency from user's ip location
            'currency'=> 'GHS',
        ]);

        $user->assignRole($request->role);

        return response()->json($user->load('roles'), 201);
    }

    public function update(Request $request, User $user)
    {
        // Only admins can update users
        if (!auth()->user()->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'role' => 'required|string|exists:roles,name'
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        if ($request->password) {
            $user->update(['password' => Hash::make($request->password)]);
        }

        // Update role
       $user->roles()->detach();
        // Assign new role without ->assignrole call - do differently
        $user->roles()->attach(Role::where('name', $request->role)->first());
       // $user->syncRoles([$request->role]);

        return response()->json(['user' => $user->load('roles'), 'success' => true]);
    }

    public function destroy(User $user)
    {
        // Only admins can delete users
        if (!auth()->user()->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Cannot delete yourself'], 400);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }

    public function getAllRoles()
    {
        return Role::all();
    }
}
