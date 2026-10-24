package com.threadpilot.security;

import java.util.UUID;

public class TenantContext {

    private static final ThreadLocal<UUID> currentOrganizationId = new ThreadLocal<>();
    private static final ThreadLocal<UUID> currentUserId = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void setOrganizationId(UUID organizationId) {
        currentOrganizationId.set(organizationId);
    }

    public static UUID getOrganizationId() {
        return currentOrganizationId.get();
    }

    public static void setUserId(UUID userId) {
        currentUserId.set(userId);
    }

    public static UUID getUserId() {
        return currentUserId.get();
    }

    public static void clear() {
        currentOrganizationId.remove();
        currentUserId.remove();
    }

    public static boolean hasTenant() {
        return currentOrganizationId.get() != null;
    }

    public static void requireTenant() {
        if (!hasTenant()) {
            throw new IllegalStateException("No tenant context available");
        }
    }

    public static UUID requireTenantId() {
        requireTenant();
        return getOrganizationId();
    }
}

