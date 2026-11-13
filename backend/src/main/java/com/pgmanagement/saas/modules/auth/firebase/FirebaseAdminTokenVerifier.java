package com.pgmanagement.saas.modules.auth.firebase;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.AuthErrorCode;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.pgmanagement.saas.modules.users.entity.Role;
import com.pgmanagement.saas.shared.exception.UnauthorizedException;
import com.pgmanagement.saas.shared.util.PhoneNumberUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FirebaseAdminTokenVerifier implements FirebaseTokenVerifier {

    private final ObjectProvider<FirebaseApp> firebaseAppProvider;

    @Override
    public FirebaseTokenDetails verifyIdToken(String idToken) {
        if (!StringUtils.hasText(idToken)) {
            throw new UnauthorizedException("Firebase ID token is required");
        }

        FirebaseApp app = firebaseAppProvider.getIfAvailable();
        if (app == null) {
            throw new UnauthorizedException("Firebase authentication is not configured on the server");
        }

        return verifyWithFirebaseAuth(FirebaseAuth.getInstance(app), idToken.trim());
    }

    FirebaseTokenDetails verifyWithFirebaseAuth(FirebaseAuth firebaseAuth, String idToken) {
        try {
            FirebaseToken decoded = firebaseAuth.verifyIdToken(idToken, true);
            return extractDetails(decoded);
        } catch (FirebaseAuthException ex) {
            throw mapAuthException(ex);
        }
    }

    FirebaseTokenDetails extractDetails(FirebaseToken decoded) {
        Map<String, Object> claims = decoded.getClaims();
        Object phoneObj = claims != null ? claims.get("phone_number") : null;
        String rawPhone = phoneObj != null ? String.valueOf(phoneObj).trim() : null;

        if (!StringUtils.hasText(rawPhone)) {
            throw new UnauthorizedException("Firebase token must include a verified +91 mobile number");
        }

        String normalizedPhone = PhoneNumberUtils.normalizeIndianE164(rawPhone);
        Role claimRole = parseVerifiedCustomRole(claims != null ? claims.get("role") : null);

        return new FirebaseTokenDetails(
                decoded.getUid(),
                normalizedPhone,
                decoded.getEmail(),
                decoded.getName(),
                claimRole
        );
    }

    private Role parseVerifiedCustomRole(Object rawClaimRole) {
        if (rawClaimRole == null) {
            return null;
        }
        String value = String.valueOf(rawClaimRole).trim().toUpperCase();
        if ("OWNER".equals(value)) {
            return Role.OWNER;
        }
        if ("RESIDENT".equals(value)) {
            return Role.RESIDENT;
        }
        return null;
    }

    private UnauthorizedException mapAuthException(FirebaseAuthException ex) {
        AuthErrorCode code = ex.getAuthErrorCode();
        log.warn("Firebase ID token verification rejected: code={}", code);
        if (code == AuthErrorCode.EXPIRED_ID_TOKEN) {
            return new UnauthorizedException("Firebase ID token has expired. Please request a fresh OTP.");
        }
        if (code == AuthErrorCode.REVOKED_ID_TOKEN) {
            return new UnauthorizedException("Firebase session has been revoked. Please sign in again.");
        }
        if (code == AuthErrorCode.USER_DISABLED) {
            return new UnauthorizedException("Firebase user account is disabled.");
        }
        return new UnauthorizedException("Invalid Firebase authentication token");
    }
}
