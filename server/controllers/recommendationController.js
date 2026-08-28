const recommendationService = require('../services/recommendationService');
const auditService = require('../services/auditService');

/** POST /api/recommendation */
const getRecommendation = async (req, res, next) => {
  try {
    const recommendation = await recommendationService.getShippingRecommendation(req.body);
    await auditService.log({
      userId: req.user._id,
      action: 'GET_RECOMMENDATION',
      resource: 'recommendation',
      metadata: { from: req.body.from, to: req.body.to },
    });
    res.json({ success: true, data: recommendation });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRecommendation };
