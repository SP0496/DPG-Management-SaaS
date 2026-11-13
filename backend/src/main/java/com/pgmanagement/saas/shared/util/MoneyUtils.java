package com.pgmanagement.saas.shared.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Utility helpers for integer paise arithmetic and rupee conversions.
 */
public final class MoneyUtils {

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private MoneyUtils() {
    }

    public static long toPaise(BigDecimal rupees) {
        if (rupees == null) {
            return 0L;
        }
        return rupees.multiply(HUNDRED).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    public static BigDecimal toRupees(long paise) {
        BigDecimal bd = BigDecimal.valueOf(paise, 2).stripTrailingZeros();
        return bd.scale() < 0 ? bd.setScale(0, RoundingMode.UNNECESSARY) : bd;
    }

    public static String formatInrFromPaise(long paise) {
        return "INR " + BigDecimal.valueOf(paise, 2).setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
