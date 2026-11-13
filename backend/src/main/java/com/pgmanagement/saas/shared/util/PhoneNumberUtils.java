package com.pgmanagement.saas.shared.util;

import com.pgmanagement.saas.shared.exception.BadRequestException;

import java.util.regex.Pattern;

/**
 * Normalizes and validates Indian (+91) mobile numbers to strict E.164 format.
 */
public final class PhoneNumberUtils {

    private static final Pattern STRICT_INDIAN_E164 = Pattern.compile("^\\+91[6-9]\\d{9}$");

    private PhoneNumberUtils() {
    }

    public static String normalizeIndianE164(String rawPhone) {
        if (rawPhone == null || rawPhone.isBlank()) {
            throw new BadRequestException("Mobile number is required");
        }

        String compact = rawPhone.replaceAll("[\\s\\-()]", "").trim();
        if (compact.startsWith("+91")) {
            // Keep +91 prefix intact
        } else if (compact.startsWith("91") && compact.length() == 12) {
            compact = "+" + compact;
        } else if (compact.startsWith("0") && compact.length() == 11) {
            compact = "+91" + compact.substring(1);
        } else if (compact.length() == 10) {
            compact = "+91" + compact;
        }

        if (!STRICT_INDIAN_E164.matcher(compact).matches()) {
            throw new BadRequestException("Mobile number must be a valid +91 10-digit Indian mobile number");
        }
        return compact;
    }
}
