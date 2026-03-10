import axios from 'axios';

const BASE_URL = "https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net/api";

const getAuthHeader = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

// API tạo link thanh toán
export const createPaymentLink = (paymentData) => {
    return axios.post(`${BASE_URL}/payment/create-link`, paymentData, {
        headers: getAuthHeader()
    });
};