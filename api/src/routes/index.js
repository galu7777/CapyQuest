const { Router } = require('express');
const authRoutes = require('../routes/auth/auth.routes');
// const userRoutes = require('../routes/user/user.routes');
// const campaignRoutes = require('../routes/campaign/campaign.routes');
// const ticketRoutes = require('../routes/ticket/ticket.routes');

const router = Router();

router.use('/auth', authRoutes);
// router.use('/', userRoutes);
// router.use('/', campaignRoutes);
// router.use('/', ticketRoutes);


module.exports = router;
