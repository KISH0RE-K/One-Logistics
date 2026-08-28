const axios = require('axios');
const { AppError } = require('../middleware/errorHandler');

const ML_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Proxy a recommendation request to the Python/FastAPI ML service.
 * LLM function signature: getShippingRecommendation(shipmentData)
 *
 * Expected ML response:
 * {
 *   recommendedMode: 'Air',
 *   options: [
 *     { mode: 'Road', cost: 480, time: 60 },
 *     { mode: 'Rail', cost: 350, time: 96 },
 *     { mode: 'Air',  cost: 820, time: 24 }
 *   ]
 * }
 */
const getShippingRecommendation = async (shipmentData) => {
  const mlServiceUrl = process.env.ML_SERVICE_URL;
  if (!mlServiceUrl) {
    throw new AppError('ML service URL not configured (ML_SERVICE_URL)', 503);
  }

  try {
    const response = await axios.post(`${mlServiceUrl}/recommend`, shipmentData, {
      timeout: ML_TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      throw new AppError('ML recommendation service is currently unavailable', 503);
    }
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
      throw new AppError('ML recommendation service timed out', 504);
    }
    if (err.response) {
      throw new AppError(
        `ML service error: ${err.response.data?.detail || err.response.statusText}`,
        err.response.status
      );
    }
    throw new AppError(`Failed to contact ML recommendation service: ${err.message}`, 503);
  }
};

module.exports = { getShippingRecommendation };
