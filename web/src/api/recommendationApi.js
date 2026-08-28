import api, { unwrap } from './axios';

/**
 * ML shipping recommendation.
 *
 * Express proxies this to the Python/FastAPI service (ML_SERVICE_URL). React
 * never contacts the ML service directly, and no prediction is ever computed
 * or faked in the frontend - if the service is down the backend answers 503
 * and the UI says so.
 *
 * POST /api/recommendation
 *   { from, to, weight, height, width, length, deliveryOption, packageType }
 * ->
 *   { recommendedMode, options: [{ mode, cost, time }] }
 */
export async function getRecommendation({
  from,
  to,
  weight,
  height,
  width,
  length,
  deliveryOption,
  packageType,
}) {
  const res = await api.post('/recommendation', {
    from,
    to,
    weight: Number(weight),
    height: Number(height),
    width: Number(width),
    length: Number(length),
    deliveryOption,
    packageType,
  });
  return unwrap(res); // { recommendedMode, options }
}
