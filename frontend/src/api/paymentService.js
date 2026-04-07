import instance from './axiosInstance';

// API tạo link thanh toán
export const createPaymentLink = (paymentData) => {
    return instance.post('/payment/create-link', paymentData);
};

// API thanh toán tiền mặt cho đơn hàng
export const payOrderCash = (payload) => {
    return instance.post('/payment/payment-order-cash', payload);
};
