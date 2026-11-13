package com.pgmanagement.saas.modules.auth.firebase;

import com.pgmanagement.saas.modules.users.entity.Role;

public record FirebaseTokenDetails(
        String uid,
        String phoneNumber,
        String email,
        String name,
        Role verifiedClaimRole
) {
}
