const axios = require('axios');
const { AppError } = require('../middleware/errorHandler');

const ML_TIMEOUT_MS = 10000; // 10 seconds

const validOption = (option) =>
  option &&
  typeof option.mode === 'string' &&
  Number.isFinite(Number(option.cost)) &&
  Number.isFinite(Number(option.time));

/**
 * Keep the public API stable while accepting results from the currently
 * deployed ML service as well as the documented response shape.
 */
const normalizeRecommendation = (payload) => {
  const recommendedMode = payload?.recommendedMode;
  let options = Array.isArray(payload?.options) ? payload.options : null;

  // The first version of the Python service returned its chosen option
  // separately and put only the other modes under `alternatives`.
  if (!options && payload?.recommendedCost !== undefined && payload?.recommendedTime !== undefined) {
    options = [
      {
        mode: recommendedMode,
        cost: payload.recommendedCost,
        time: payload.recommendedTime,
      },
      ...(Array.isArray(payload.alternatives) ? payload.alternatives : []),
    ];
  }

  if (
    typeof recommendedMode !== 'string' ||
    !Array.isArray(options) ||
    !options.every(validOption) ||
    !options.some((option) => option.mode === recommendedMode)
  ) {
    throw new AppError('ML service returned an invalid recommendation payload', 502);
  }

  return {
    ...payload,
    recommendedMode,
    options: options.map((option) => ({
      mode: option.mode,
      cost: Number(option.cost),
      time: Number(option.time),
    })),
  };
};

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
    return normalizeRecommendation(response.data);
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

module.exports = { getShippingRecommendation, normalizeRecommendation };
