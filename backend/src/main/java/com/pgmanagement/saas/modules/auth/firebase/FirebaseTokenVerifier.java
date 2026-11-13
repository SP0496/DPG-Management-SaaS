package com.pgmanagement.saas.modules.auth.firebase;

/**
 * Verifies cryptographic Firebase ID tokens issued after client Phone OTP verification.
 */
public interface FirebaseTokenVerifier {

    FirebaseTokenDetails verifyIdToken(String idToken);
}
