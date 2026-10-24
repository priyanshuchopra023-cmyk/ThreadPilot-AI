package com.threadpilot.organization;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

    Optional<Organization> findByGstNumber(String gstNumber);

    Optional<Organization> findByCode(String code);

    @Query("SELECT o FROM Organization o WHERE o.isActive = true AND LOWER(o.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<Organization> searchByName(@Param("name") String name, Pageable pageable);

    boolean existsByGstNumberAndIdNot(String gstNumber, UUID id);

    boolean existsByCodeAndIdNot(String code, UUID id);

    boolean existsByCode(String code);
}

