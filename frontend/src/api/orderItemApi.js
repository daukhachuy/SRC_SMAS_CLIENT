import instance from './axiosInstance';

export const patchOrderItemServed = async (orderItemId) => {
  // PATCH /api/order-items/{orderItemId}/Served
  const response = await instance.patch(`/order-items/${orderItemId}/Served`);
  return response.data;
};
