package com.threadpilot.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByNameAndOrganizationId(String name, UUID organizationId);

    List<Role> findByOrganizationId(UUID organizationId);

    List<Role> findByIsSystemRoleTrue();

    boolean existsByNameAndOrganizationId(String name, UUID organizationId);
}

