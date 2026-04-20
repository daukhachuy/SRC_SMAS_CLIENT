/** VAT 10% áp dụng thống nhất cho đơn hàng / giỏ (hàng hóa). */
export const ORDER_VAT_RATE = 0.1;

export function roundOrderMoney(n) {
  return Math.round(Number(n) || 0);
}

/**
 * VAT 10% trên tạm tính (subtotal) — không trừ giảm giá trước khi tính thuế. Phí ship không tính thuế.
 * Tổng: grand ≈ subtotal + VAT + deliveryFee − discountAmount.
 * @param {{
 *   subtotal?: number,
 *   deliveryFee?: number,
 *   discountAmount?: number,
 *   apiTotalAmount?: unknown,
 *   apiTaxAmount?: unknown,
 * }} p
 */
export function resolveOrderVatAndGrandTotal(p = {}) {
  const sub = Math.max(0, Number(p.subtotal) || 0);
  const delivery = Math.max(0, Number(p.deliveryFee) || 0);
  const discount = Math.max(0, Number(p.discountAmount) || 0);
  const afterDiscount = Math.max(0, sub - discount);
  const legacyNoVat = afterDiscount + delivery;

  const apiTotalRaw = p.apiTotalAmount;
  const apiTotal =
    apiTotalRaw != null && apiTotalRaw !== '' && Number.isFinite(Number(apiTotalRaw))
      ? Number(apiTotalRaw)
      : NaN;

  const apiTaxRaw = p.apiTaxAmount;
  const apiTaxParsed =
    apiTaxRaw != null && apiTaxRaw !== '' && Number.isFinite(Number(apiTaxRaw))
      ? Number(apiTaxRaw)
      : NaN;

  /** VAT luôn theo tạm tính (tiền hàng trước giảm), không theo (subtotal − discount). */
  const vatOnGoods = roundOrderMoney(sub * ORDER_VAT_RATE);
  const computedGrandWithVat = roundOrderMoney(legacyNoVat + vatOnGoods);

  if (Number.isFinite(apiTaxParsed) && apiTaxParsed > 0) {
    const grand =
      Number.isFinite(apiTotal) && apiTotal > 0
        ? Math.abs(apiTotal - computedGrandWithVat) <= 2
          ? apiTotal
          : computedGrandWithVat
        : computedGrandWithVat;
    return {
      subtotal: sub,
      afterDiscount,
      delivery,
      discount,
      vat: vatOnGoods,
      grand: roundOrderMoney(grand),
    };
  }

  const hasApiTotal = Number.isFinite(apiTotal) && apiTotal > 0;

  if (hasApiTotal) {
    if (Math.abs(apiTotal - legacyNoVat) <= 2) {
      return {
        subtotal: sub,
        afterDiscount,
        delivery,
        discount,
        vat: vatOnGoods,
        grand: roundOrderMoney(legacyNoVat + vatOnGoods),
      };
    }
    const impliedVat = apiTotal - legacyNoVat;
    if (impliedVat >= 0 && Math.abs(impliedVat - vatOnGoods) <= 2) {
      return {
        subtotal: sub,
        afterDiscount,
        delivery,
        discount,
        vat: roundOrderMoney(impliedVat),
        grand: roundOrderMoney(apiTotal),
      };
    }
    return {
      subtotal: sub,
      afterDiscount,
      delivery,
      discount,
      vat: 0,
      grand: roundOrderMoney(apiTotal),
    };
  }

  return {
    subtotal: sub,
    afterDiscount,
    delivery,
    discount,
    vat: vatOnGoods,
    grand: roundOrderMoney(legacyNoVat + vatOnGoods),
  };
}
