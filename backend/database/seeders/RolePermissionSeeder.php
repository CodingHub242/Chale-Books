<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        // Create roles
        $roles = [
            ['name' => 'admin', 'description' => 'Full access to all features'],
            ['name' => 'manager', 'description' => 'Can manage clients, quotes, invoices, and expenses'],
            ['name' => 'accountant', 'description' => 'Can view and manage invoices and expenses only'],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(
                ['name' => $role['name']],
                $role + ['created_at' => now(), 'updated_at' => now()]
            );
        }

        // Create permissions
        $permissions = [
            // Users
            ['name' => 'users.create', 'description' => 'Create new users'],
            ['name' => 'users.edit', 'description' => 'Edit existing users'],
            ['name' => 'users.delete', 'description' => 'Delete users'],
            ['name' => 'users.view', 'description' => 'View users list'],
            
            // Clients
            ['name' => 'clients.create', 'description' => 'Create new clients'],
            ['name' => 'clients.edit', 'description' => 'Edit existing clients'],
            ['name' => 'clients.delete', 'description' => 'Delete clients'],
            ['name' => 'clients.view', 'description' => 'View clients list'],
            
            // Quotes
            ['name' => 'quotes.create', 'description' => 'Create new quotes'],
            ['name' => 'quotes.edit', 'description' => 'Edit existing quotes'],
            ['name' => 'quotes.delete', 'description' => 'Delete quotes'],
            ['name' => 'quotes.view', 'description' => 'View quotes list'],
            ['name' => 'quotes.send', 'description' => 'Send quotes to clients'],
            ['name' => 'quotes.convert', 'description' => 'Convert quotes to invoices'],
            
            // Invoices
            ['name' => 'invoices.create', 'description' => 'Create new invoices'],
            ['name' => 'invoices.edit', 'description' => 'Edit existing invoices'],
            ['name' => 'invoices.delete', 'description' => 'Delete invoices'],
            ['name' => 'invoices.view', 'description' => 'View invoices list'],
            ['name' => 'invoices.send', 'description' => 'Send invoices to clients'],
            
            // Expenses
            ['name' => 'expenses.create', 'description' => 'Create new expenses'],
            ['name' => 'expenses.edit', 'description' => 'Edit existing expenses'],
            ['name' => 'expenses.delete', 'description' => 'Delete expenses'],
            ['name' => 'expenses.view', 'description' => 'View expenses list'],
            
            // Reports
            ['name' => 'reports.view', 'description' => 'View reports'],
            ['name' => 'reports.export', 'description' => 'Export reports'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['name' => $permission['name']],
                $permission + ['created_at' => now(), 'updated_at' => now()]
            );
        }

        // Assign permissions to admin role (all permissions)
        $adminRole = DB::table('roles')->where('name', 'admin')->first();
        $permissions = DB::table('permissions')->get();
        
        foreach ($permissions as $permission) {
            DB::table('role_has_permissions')->updateOrInsert(
                ['role_id' => $adminRole->id, 'permission_id' => $permission->id],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }

        // Assign permissions to manager role
        $managerRole = DB::table('roles')->where('name', 'manager')->first();
        $managerPermissions = [
            'clients.create', 'clients.edit', 'clients.delete', 'clients.view',
            'quotes.create', 'quotes.edit', 'quotes.delete', 'quotes.view', 'quotes.send', 'quotes.convert',
            'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.view', 'invoices.send',
            'expenses.create', 'expenses.edit', 'expenses.delete', 'expenses.view',
            'reports.view',
        ];
        
        foreach ($managerPermissions as $permName) {
            $perm = DB::table('permissions')->where('name', $permName)->first();
            if ($perm) {
                DB::table('role_has_permissions')->updateOrInsert(
                    ['role_id' => $managerRole->id, 'permission_id' => $perm->id],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }
        }

        // Assign permissions to accountant role
        $accountantRole = DB::table('roles')->where('name', 'accountant')->first();
        $accountantPermissions = [
            'clients.view',
            'invoices.create', 'invoices.edit', 'invoices.view', 'invoices.send',
            'expenses.create', 'expenses.edit', 'expenses.view',
            'reports.view',
        ];
        
        foreach ($accountantPermissions as $permName) {
            $perm = DB::table('permissions')->where('name', $permName)->first();
            if ($perm) {
                DB::table('role_has_permissions')->updateOrInsert(
                    ['role_id' => $accountantRole->id, 'permission_id' => $perm->id],
                    ['created_at' => now(), 'updated_at' => now()]
                );
            }
        }
    }
}
