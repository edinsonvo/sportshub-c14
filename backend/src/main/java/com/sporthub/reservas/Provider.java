package com.sporthub.reservas;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "provider")
public class Provider {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "business_name", nullable = false, length = 160)
    private String businessName;

    @Column(name = "document_number", length = 40)
    private String documentNumber;

    @Column(name = "identity_verified", nullable = false)
    private boolean identityVerified;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(nullable = false)
    private boolean active = true;

    protected Provider() {}

    public Provider(UUID userId, String businessName, String documentNumber) {
        this.userId = userId;
        this.businessName = businessName;
        this.documentNumber = documentNumber;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getBusinessName() {
        return businessName;
    }

    public String getDocumentNumber() {
        return documentNumber;
    }

    public boolean isIdentityVerified() {
        return identityVerified;
    }

    public void verifyIdentity() {
        this.identityVerified = true;
        this.verifiedAt = Instant.now();
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
