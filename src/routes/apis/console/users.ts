import { Router } from 'express';
import { decryptRequest } from '#app/Http/Middleware/DecryptRequest';
import { authenticateToken } from '#app/Http/Middleware/AuthenticateToken';
import { refreshToken } from '#app/Http/Middleware/RefreshToken';
import { can } from '#app/Http/Middleware/Authorize';
import { UsersController } from '#app/Http/Controllers/UsersController';

const router = Router();

const base = [authenticateToken, refreshToken, decryptRequest];

export const usersRoutes = [
  ['/list', 'list', 'accountsUsers:read'],
  ['/detail', 'detail', 'accountsUsers:read'],
  ['/create', 'create', 'accountsUsers:write'],
  ['/update', 'update', 'accountsUsers:write'],
  ['/enable', 'enable', 'accountsUsers:write'],
  ['/disable', 'disable', 'accountsUsers:write'],

  ['/delete', 'delete', 'accountsUsers:delete'],

  ['/trashList', 'trashList', 'systemsTrash:read'],
  ['/restore', 'restore', 'systemsTrash:restore'],
  ['/forceDelete', 'forceDelete', 'systemsTrash:delete'],
] as const;

usersRoutes.forEach(([path, action, permission]) => {
  router.post(path, [...base, can(permission)], UsersController[action]);
});


export default router;