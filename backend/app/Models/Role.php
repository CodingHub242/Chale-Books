<?php

namespace App\Models;

use Spatie\Permission\Contracts\Role as RoleContract;
use Spatie\Permission\Exceptions\RoleDoesNotExist;
use Spatie\Permission\Guard;
use Spatie\Permission\PermissionRegistrar;
use Spatie\Permission\Traits\RefreshesPermissionCache;
use function Spatie\Permission\getModelForGuard;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model implements RoleContract
{
    use RefreshesPermissionCache;

    protected $guarded = ['id'];

    public function __construct(array $attributes = [])
    {
        $attributes['guard_name'] = $attributes['guard_name'] ?? config('auth.defaults.guard');

        parent::__construct($attributes);

        $this->setTable(config('permission.table_names.roles'));
    }

    public static function create(array $attributes = [])
    {
        $attributes['guard_name'] = $attributes['guard_name'] ?? Guard::getDefaultName(static::class);

        $role = static::getRoles(['name' => $attributes['name'], 'guard_name' => $attributes['guard_name']])->first();

        if ($role) {
            throw RoleDoesNotExist::create($attributes['name'], $attributes['guard_name']);
        }

        return static::query()->create($attributes);
    }

    /**
     * A role may be given various permissions.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(
            config('permission.models.permission'),
            config('permission.table_names.role_has_permissions'),
            'role_id',
            'permission_id'
        );
    }

    /**
     * A role belongs to some users of the model associated with its guard.
     */
    public function users(): BelongsToMany
    {
        return $this->morphedByMany(
            getModelForGuard($this->attributes['guard_name'] ?? config('auth.defaults.guard')),
            'model',
            config('permission.table_names.model_has_roles'),
            config('permission.column_names.model_morph_key'),
            'model_id'
        );
    }

    /**
     * Find a role by its name (and optionally guardName).
     */
    public static function findByName(string $name, $guardName = null): self
    {
        $guardName = $guardName ?? Guard::getDefaultName(static::class);

        $role = static::getRoles(['name' => $name, 'guard_name' => $guardName])->first();

        if (! $role) {
            throw RoleDoesNotExist::create($name, $guardName);
        }

        return $role;
    }

    /**
     * Find a role by its id (and optionally guardName).
     */
    public static function findById(string|int $id, $guardName = null): self
    {
        $guardName = $guardName ?? Guard::getDefaultName(static::class);

        $role = static::getRoles(['id' => $id, 'guard_name' => $guardName])->first();

        if (! $role) {
            throw RoleDoesNotExist::create('', $guardName);
        }

        return $role;
    }

    /**
     * Find or create role by its name (and optionally guardName).
     */
    public static function findOrCreate(string $name, $guardName = null): self
    {
        $guardName = $guardName ?? Guard::getDefaultName(static::class);

        $role = static::getRoles(['name' => $name, 'guard_name' => $guardName])->first();

        if (! $role) {
            return static::query()->create(['name' => $name, 'guard_name' => $guardName]);
        }

        return $role;
    }

    /**
     * Get the current cached roles.
     */
    protected static function getRoles(array $params = []): \Illuminate\Database\Eloquent\Collection
    {
        return app(PermissionRegistrar::class)->getRoles($params);
    }

    /**
     * Determine if the role has a given permission.
     */
    public function hasPermissionTo($permission, $guardName = null): bool
    {
        $permissionClass = $this->getPermissionClass();

        if (is_string($permission)) {
            $permission = $permissionClass->findByName($permission, $guardName);
        }

        if (is_int($permission)) {
            $permission = $permissionClass->findById($permission, $guardName);
        }

        return $this->permissions->contains('id', $permission->id);
    }
}
