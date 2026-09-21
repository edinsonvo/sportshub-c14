package com.sporthub.reservas;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "provider_staff")
public class ProviderStaff {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "provider_id", nullable = false)
    private UUID providerId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(length = 80)
    private String position;

    @Column(nullable = false)
    private boolean active = true;

    protected ProviderStaff() {}

    public ProviderStaff(UUID providerId, UUID userId, String position) {
        this.providerId = providerId;
        this.userId = userId;
        this.position = position;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getProviderId() {
        return providerId;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getPosition() {
        return position;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
