package com.sporthub.deportes;

import java.util.List;
import java.util.UUID;

public record ProveedorResponse(
        UUID providerId, String businessName, String logoUrl, boolean activo, List<StaffOption> staff) {}