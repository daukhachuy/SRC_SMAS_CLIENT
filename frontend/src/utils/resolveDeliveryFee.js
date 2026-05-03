import { getDeliveryFeeEstimateFromApi } from '../api/orderApi';
import { estimateDeliveryFeeFromAddressClient } from './deliveryFeeEstimate';

/**
 * Phí giao: ưu tiên API backend (nếu có route ước tính), không thì Haversine + bậc 15k/25k/40k.
 */
export async function resolveDeliveryFeeVnd(normalizedAddress) {
  const addr = String(normalizedAddress || '').trim();
  if (!addr) return 0;
  const fromApi = await getDeliveryFeeEstimateFromApi(addr);
  if (fromApi != null) return fromApi;
  return estimateDeliveryFeeFromAddressClient(addr);
}
