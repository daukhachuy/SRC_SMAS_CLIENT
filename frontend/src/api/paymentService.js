import instance from './axiosInstance';

// API tạo link thanh toán
export const createPaymentLink = (paymentData) => {
    return instance.post('/payment/create-link', paymentData);
};
