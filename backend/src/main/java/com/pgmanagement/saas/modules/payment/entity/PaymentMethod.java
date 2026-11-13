package com.pgmanagement.saas.modules.payment.entity;

/**
 * Supported direct PG owner collection and desk payment methods (no payment gateway).
 */
public enum PaymentMethod {
    UPI_INTENT,
    UPI_QR,
    NEFT,
    IMPS,
    CASH,
    UPI_MANUAL,
    BANK_TRANSFER,
    CHEQUE
}
