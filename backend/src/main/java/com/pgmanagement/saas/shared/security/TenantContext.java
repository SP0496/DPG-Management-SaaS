package com.pgmanagement.saas.shared.security;

import com.pgmanagement.saas.modules.users.entity.Role;
import com.pgmanagement.saas.shared.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

/**
 * Convenience accessor for resolving the authenticated principal from SecurityContextHolder.
 */
public final class TenantContext {

    private TenantContext() {
    }

    public static UserPrincipal currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new UnauthorizedException("Authentication is required");
        }
        return principal;
    }

    public static UUID currentUserId() {
        return currentUser().getId();
    }

    public static Role currentRole() {
        return currentUser().getRole();
    }

    public static boolean isOwner() {
        return currentRole() == Role.OWNER;
    }

    public static boolean isResident() {
        return currentRole() == Role.RESIDENT;
    }
}
