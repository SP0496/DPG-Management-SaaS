package com.pgmanagement.saas.modules.auth.firebase;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.AuthErrorCode;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.pgmanagement.saas.modules.users.entity.Role;
import com.pgmanagement.saas.shared.exception.BadRequestException;
import com.pgmanagement.saas.shared.exception.UnauthorizedException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FirebaseAdminTokenVerifierTest {

    @Mock
    private FirebaseAuth firebaseAuth;

    private ObjectProvider<FirebaseApp> providerWith(FirebaseApp app) {
        return new ObjectProvider<>() {
            @Override
            public FirebaseApp getObject(Object... args) {
                return app;
            }

            @Override
            public FirebaseApp getIfAvailable() {
                return app;
            }

            @Override
            public FirebaseApp getIfUnique() {
                return app;
            }

            @Override
            public FirebaseApp getObject() {
                return app;
            }
        };
    }

    @Test
    void rejectsBlankIdTokenBeforeCallingFirebase() {
        FirebaseAdminTokenVerifier verifier = new FirebaseAdminTokenVerifier(providerWith(null));
        assertThrows(UnauthorizedException.class, () -> verifier.verifyIdToken("   "));
        assertThrows(UnauthorizedException.class, () -> verifier.verifyIdToken(null));
    }

    @Test
    void failsClosedWhenFirebaseAppIsNotConfigured() {
        FirebaseAdminTokenVerifier verifier = new FirebaseAdminTokenVerifier(providerWith(null));
        UnauthorizedException ex = assertThrows(UnauthorizedException.class,
                () -> verifier.verifyIdToken("some.jwt.token"));
        assertEquals("Firebase authentication is not configured on the server", ex.getMessage());
    }

    @Test
    void mapsExpiredFirebaseTokenToUnauthorizedException() throws Exception {
        FirebaseAdminTokenVerifier verifier = new FirebaseAdminTokenVerifier(providerWith(null));
        FirebaseAuthException authEx = mock(FirebaseAuthException.class);
        when(authEx.getAuthErrorCode()).thenReturn(AuthErrorCode.EXPIRED_ID_TOKEN);
        when(firebaseAuth.verifyIdToken("expired-token", true)).thenThrow(authEx);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class,
                () -> verifier.verifyWithFirebaseAuth(firebaseAuth, "expired-token"));
        assertEquals("Firebase ID token has expired. Please request a fresh OTP.", ex.getMessage());
    }

    @Test
    void mapsRevokedFirebaseTokenToUnauthorizedException() throws Exception {
        FirebaseAdminTokenVerifier verifier = new FirebaseAdminTokenVerifier(providerWith(null));
        FirebaseAuthException authEx = mock(FirebaseAuthException.class);
        when(authEx.getAuthErrorCode()).thenReturn(AuthErrorCode.REVOKED_ID_TOKEN);
        when(firebaseAuth.verifyIdToken("revoked-token", true)).thenThrow(authEx);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class,
                () -> verifier.verifyWithFirebaseAuth(firebaseAuth, "revoked-token"));
        assertEquals("Firebase session has been revoked. Please sign in again.", ex.getMessage());
    }

    @Test
    void mapsUserDisabledFirebaseTokenToUnauthorizedException() throws Exception {
        FirebaseAdminTokenVerifier verifier = new FirebaseAdminTokenVerifier(providerWith(null));
        FirebaseAuthException authEx = mock(FirebaseAuthException.class);
        when(authEx.getAuthErrorCode()).thenReturn(AuthErrorCode.USER_DISABLED);
        when(firebaseAuth.verifyIdToken("disabled-user-token", true)).thenThrow(authEx);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class,
                () -> verifier.verifyWithFirebaseAuth(firebaseAuth, "disabled-user-token"));
        assertEquals("Firebase user account is disabled.", ex.getMessage());
    }

    @Test
    void rejectsTokenWithoutVerifiedPhoneClaim() throws Exception {
        FirebaseAdminTokenVerifier verifier = new FirebaseAdminTokenVerifier(providerWith(null));
        FirebaseToken token = mock(FirebaseToken.class);
        when(token.getClaims()).thenReturn(Map.of("sub", "uid-123"));
        when(firebaseAuth.verifyIdToken("no-phone-token", true)).thenReturn(token);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class,
                () -> verifier.verifyWithFirebaseAuth(firebaseAuth, "no-phone-token"));
        assertEquals("Firebase token must include a verified +91 mobile number", ex.getMessage());
    }

    @Test
    void rejectsNonIndianPhoneNumberInTokenClaims() throws Exception {
        FirebaseAdminTokenVerifier verifier = new FirebaseAdminTokenVerifier(providerWith(null));
        FirebaseToken token = mock(FirebaseToken.class);
        when(token.getClaims()).thenReturn(Map.of("phone_number", "+14155550199"));
        when(firebaseAuth.verifyIdToken("us-phone-token", true)).thenReturn(token);

        assertThrows(BadRequestException.class, () -> verifier.verifyWithFirebaseAuth(firebaseAuth, "us-phone-token"));
    }

    @Test
    void extractsNormalizedIndianPhoneAndTrustedCustomRole() throws Exception {
        FirebaseAdminTokenVerifier verifier = new FirebaseAdminTokenVerifier(providerWith(null));
        FirebaseToken token = mock(FirebaseToken.class);
        when(token.getUid()).thenReturn("firebase-uid-99");
        when(token.getEmail()).thenReturn("owner@pg.in");
        when(token.getName()).thenReturn("Rohan Mehta");
        when(token.getClaims()).thenReturn(Map.of(
                "phone_number", "+919876543210",
                "role", "OWNER"
        ));
        when(firebaseAuth.verifyIdToken("valid-owner-token", true)).thenReturn(token);

        FirebaseTokenDetails details = verifier.verifyWithFirebaseAuth(firebaseAuth, "valid-owner-token");
        assertEquals("firebase-uid-99", details.uid());
        assertEquals("+919876543210", details.phoneNumber());
        assertEquals("owner@pg.in", details.email());
        assertEquals("Rohan Mehta", details.name());
        assertEquals(Role.OWNER, details.verifiedClaimRole());
    }

    @Test
    void extractsResidentCustomRoleSuccessfully() throws Exception {
        FirebaseAdminTokenVerifier verifier = new FirebaseAdminTokenVerifier(providerWith(null));
        FirebaseToken token = mock(FirebaseToken.class);
        when(token.getUid()).thenReturn("firebase-uid-100");
        when(token.getEmail()).thenReturn("resident@pg.in");
        when(token.getName()).thenReturn("Aarav Sharma");
        when(token.getClaims()).thenReturn(Map.of(
                "phone_number", "+919811112222",
                "role", "RESIDENT"
        ));
        when(firebaseAuth.verifyIdToken("valid-resident-token", true)).thenReturn(token);

        FirebaseTokenDetails details = verifier.verifyWithFirebaseAuth(firebaseAuth, "valid-resident-token");
        assertEquals("firebase-uid-100", details.uid());
        assertEquals("+919811112222", details.phoneNumber());
        assertEquals(Role.RESIDENT, details.verifiedClaimRole());
    }

    @Test
    void leavesCustomRoleNullWhenUnknownRoleClaimPresent() throws Exception {
        FirebaseAdminTokenVerifier verifier = new FirebaseAdminTokenVerifier(providerWith(null));
        FirebaseToken token = mock(FirebaseToken.class);
        when(token.getUid()).thenReturn("firebase-uid-12");
        when(token.getClaims()).thenReturn(Map.of(
                "phone_number", "+919811112222",
                "role", "SUPERADMIN"
        ));
        when(firebaseAuth.verifyIdToken("valid-resident-token", true)).thenReturn(token);

        FirebaseTokenDetails details = verifier.verifyWithFirebaseAuth(firebaseAuth, "valid-resident-token");
        assertEquals("+919811112222", details.phoneNumber());
        assertNull(details.verifiedClaimRole());
    }
}
