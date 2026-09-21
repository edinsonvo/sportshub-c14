package com.sporthub.security;

import com.sporthub.user.UserAccount;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static UserAccount currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserAccount user)) {
            throw new IllegalStateException("No se encontró un usuario autenticado");
        }
        return user;
    }
}
