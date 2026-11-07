package com.sporthub.admin;

import java.math.BigDecimal;
import java.util.Map;

public record SystemStatsResponse(
        long totalUsers,
        long totalClients,
        long totalProviders,
        long totalStaff,
        long totalAppointments,
        long completedAppointments,
        long cancelledAppointments,
        long totalFacilities,
        long totalClasses,
        long totalTournaments,
        BigDecimal estimatedRevenue,
        Map<String, Long> appointmentsByStatus) {}
