package com.threadpilot.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailAndOrganizationId(String email, UUID organizationId);

    @Query("SELECT u FROM User u WHERE u.organization.id = :orgId AND u.status = 'ACTIVE'")
    Page<User> findActiveByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.organization.id = :orgId AND LOWER(u.firstName) LIKE LOWER(CONCAT('%', :name, '%')) OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :name, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<User> searchByName(@Param("orgId") UUID organizationId, @Param("name") String name, Pageable pageable);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.organization.id = :orgId")
    List<User> findByRoleNameAndOrganizationId(@Param("roleName") String roleName, @Param("orgId") UUID organizationId);

    boolean existsByEmailAndOrganizationId(String email, UUID organizationId);

boolean existsByEmailAndOrganizationIdAndIdNot(String email, UUID organizationId, UUID id);

    boolean existsByEmail(String email);
}

