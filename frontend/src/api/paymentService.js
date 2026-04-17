import instance from './axiosInstance';

// API thanh toán tiền mặt cho đơn hàng
export const payOrderCash = (payload) => {
    return instance.post('/payment/payment-order-cash', payload);
};

// API tạo QR thanh toán phần còn thiếu của đơn
export const createRemainingPaymentQr = (payload) => {
    return instance.post('/payment/payment-order-qr-remaining', payload);
};

// Backward compatibility: tên cũ dùng cho luồng tạo link QR
export const createPaymentLink = (paymentData) => {
    return createRemainingPaymentQr(paymentData);
};
