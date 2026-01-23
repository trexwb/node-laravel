import { Router } from 'express';
import { SendWelcomeEmail } from '#app/Jobs/SendWelcomeEmail';
import { nowInTz } from '#app/Helpers/Format';

const router = Router();

router.get('/', async (req, res) => {
  if (req.query.action === 'create') {
    await SendWelcomeEmail.dispatch({ task: 'hello', timestamp: nowInTz() });
  }
  res.success();
});

export default router;