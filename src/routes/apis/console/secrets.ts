import { Router } from 'express';
import { decryptRequest } from '#app/Http/Middleware/DecryptRequest';
import { authenticateToken } from '#app/Http/Middleware/AuthenticateToken';
import { can } from '#app/Http/Middleware/Authorize';
import { SecretsController } from '#app/Http/Controllers/SecretsController';

const router = Router();

router.post('/list', [authenticateToken, decryptRequest, can('systemsSecrets:read')], SecretsController.list);

router.post('/detail', [authenticateToken, decryptRequest, can('systemsSecrets:read')], SecretsController.detail);

router.post('/create', [authenticateToken, decryptRequest, can('systemsSecrets:write')], SecretsController.create);

router.post('/update', [authenticateToken, decryptRequest, can('systemsSecrets:write')], SecretsController.update);

router.post('/enable', [authenticateToken, decryptRequest, can('systemsSecrets:write')], SecretsController.enable);

router.post('/disable', [authenticateToken, decryptRequest, can('systemsSecrets:write')], SecretsController.disable);

// router.post('/sort', [authenticateToken, decryptRequest, can('systemsSecrets:write')], SecretsController.sort);

router.post('/delete', [authenticateToken, decryptRequest, can('systemsSecrets:delete')], SecretsController.delete);

router.post('/trashList', [authenticateToken, decryptRequest, can('systemsTrash:read')], SecretsController.trashList);

router.post('/restore', [authenticateToken, decryptRequest, can('systemsTrash:restore')], SecretsController.restore);

router.post('/forceDelete', [authenticateToken, decryptRequest, can('systemsTrash:delete')], SecretsController.forceDelete);

export default router;