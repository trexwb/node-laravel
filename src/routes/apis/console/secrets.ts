import { Router } from 'express';
import { decryptRequest } from '#app/Http/Middleware/DecryptRequest';
import { authenticateToken } from '#app/Http/Middleware/AuthenticateToken';
import { refreshToken } from '#app/Http/Middleware/RefreshToken';
import { can } from '#app/Http/Middleware/Authorize';
import { SecretsController } from '#app/Http/Controllers/SecretsController';

const router = Router();

const base = [authenticateToken, refreshToken, decryptRequest];

export const secretsRoutes = [
  ['/list', 'list', 'systemsSecrets:read'],
  ['/detail', 'detail', 'systemsSecrets:read'],
  ['/create', 'create', 'systemsSecrets:write'],
  ['/modify', 'modify', 'systemsSecrets:write'],
  ['/enable', 'enable', 'systemsSecrets:write'],
  ['/disable', 'disable', 'systemsSecrets:write'],

  ['/delete', 'delete', 'systemsSecrets:delete'],

  ['/trashList', 'trashList', 'systemsTrash:read'],
  ['/restore', 'restore', 'systemsTrash:restore'],
  ['/forceDelete', 'forceDelete', 'systemsTrash:delete'],
] as const;

secretsRoutes.forEach(([path, action, permission]) => {
  router.post(path, [...base, can(permission)], SecretsController[action]);
});


export default router;