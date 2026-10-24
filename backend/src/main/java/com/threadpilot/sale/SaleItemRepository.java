package com.threadpilot.sale;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SaleItemRepository extends JpaRepository<SaleItem, UUID> {

    @Query("SELECT i FROM SaleItem i WHERE i.sale.id = :saleId")
    List<SaleItem> findBySaleId(@Param("saleId") UUID saleId);
}

