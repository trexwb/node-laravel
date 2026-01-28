import { Router } from 'express';
import { decryptRequest } from '#app/Http/Middleware/DecryptRequest';
import { authenticateToken } from '#app/Http/Middleware/AuthenticateToken';
import { can } from '#app/Http/Middleware/Authorize';
import { UsersController } from '#app/Http/Controllers/UsersController';

const router = Router();

router.post('/list', [authenticateToken, decryptRequest, can('accountsUsers:read')], UsersController.list);

router.post('/detail', [authenticateToken, decryptRequest, can('accountsUsers:read')], UsersController.detail);

router.post('/create', [authenticateToken, decryptRequest, can('accountsUsers:write')], UsersController.create);

router.post('/update', [authenticateToken, decryptRequest, can('accountsUsers:write')], UsersController.update);

router.post('/enable', [authenticateToken, decryptRequest, can('accountsUsers:write')], UsersController.enable);

router.post('/disable', [authenticateToken, decryptRequest, can('accountsUsers:write')], UsersController.disable);

router.post('/sort', [authenticateToken, decryptRequest, can('accountsUsers:write')], UsersController.sort);

router.post('/delete', [authenticateToken, decryptRequest, can('accountsUsers:delete')], UsersController.delete);

router.post('/trashList', [authenticateToken, decryptRequest, can('accountsTrash:read')], UsersController.trashList);

router.post('/restore', [authenticateToken, decryptRequest, can('accountsTrash:restore')], UsersController.restore);

router.post('/forceDelete', [authenticateToken, decryptRequest, can('accountsTrash:delete')], UsersController.forceDelete);

export default router;