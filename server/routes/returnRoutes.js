const express = require('express');
const r = express.Router();
const { protect, admin } = require('../middleware/auth');
const c = require('../controllers/returnController');

r.post('/',              protect,       c.createReturn);
r.get('/my',             protect,       c.getMyReturns);
r.get('/:id',            protect,       c.getReturn);
r.get('/',               protect, admin, c.getAllReturns);
r.put('/:id/status',     protect, admin, c.updateReturnStatus);

module.exports = r;