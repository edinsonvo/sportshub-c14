package com.sporthub.admin;

import com.sporthub.deportes.ClaseGrupalRepository;
import com.sporthub.deportes.InstalacionRepository;
import com.sporthub.deportes.TorneoRepository;
import com.sporthub.infra.AuditLog;
import com.sporthub.infra.AuditLogRepository;
import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.reservas.Appointment;
import com.sporthub.reservas.AppointmentRepository;
import com.sporthub.reservas.AppointmentStatus;
import com.sporthub.reservas.Provider;
import com.sporthub.reservas.ProviderRepository;
import com.sporthub.reservas.ProviderServiceRepository;
import com.sporthub.reservas.ProviderStaffRepository;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final ProviderRepository providerRepository;
    private final ProviderStaffRepository staffRepository;
    private final ProviderServiceRepository serviceRepository;
    private final AppointmentRepository appointmentRepository;
    private final InstalacionRepository instalacionRepository;
    private final ClaseGrupalRepository claseRepository;
    private final TorneoRepository torneoRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogger auditLogger;

    public AdminService(
            UserRepository userRepository,
            ProviderRepository providerRepository,
            ProviderStaffRepository staffRepository,
            ProviderServiceRepository serviceRepository,
            AppointmentRepository appointmentRepository,
            InstalacionRepository instalacionRepository,
            ClaseGrupalRepository claseRepository,
            TorneoRepository torneoRepository,
            AuditLogRepository auditLogRepository,
            AuditLogger auditLogger) {
        this.userRepository = userRepository;
        this.providerRepository = providerRepository;
        this.staffRepository = staffRepository;
        this.serviceRepository = serviceRepository;
        this.appointmentRepository = appointmentRepository;
        this.instalacionRepository = instalacionRepository;
        this.claseRepository = claseRepository;
        this.torneoRepository = torneoRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditLogger = auditLogger;
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> listUsers(Role role, Boolean active) {
        return userRepository.findAll().stream()
                .filter(u -> role == null || u.getRole() == role)
                .filter(u -> active == null || u.isActive() == active)
                .map(AdminUserResponse::from)
                .toList();
    }

    @Transactional
    public AdminUserResponse toggleUserActive(UserAccount admin, UUID userId) {
        if (admin.getId().equals(userId)) {
            throw new BusinessException(
                    "ACCION_INVALIDA",
                    "No puedes desactivar tu propia cuenta de administrador",
                    HttpStatus.BAD_REQUEST);
        }
        UserAccount user = userRepository
                .findById(userId)
                .orElseThrow(() ->
                        new BusinessException("USUARIO_NO_ENCONTRADO", "Usuario no encontrado", HttpStatus.NOT_FOUND));

        user.setActive(!user.isActive());
        userRepository.save(user);

        auditLogger.record(
                "UserAccount",
                userId.toString(),
                user.isActive() ? "ACTIVADO" : "DESACTIVADO",
                admin.getEmail(),
                "Estado de usuario modificado por administrador");

        return AdminUserResponse.from(user);
    }

    @Transactional
    public void deleteUser(UserAccount admin, UUID userId) {
        if (admin.getId().equals(userId)) {
            throw new BusinessException(
                    "ACCION_INVALIDA", "No puedes eliminar tu propia cuenta de administrador", HttpStatus.BAD_REQUEST);
        }
        UserAccount user = userRepository
                .findById(userId)
                .orElseThrow(() ->
                        new BusinessException("USUARIO_NO_ENCONTRADO", "Usuario no encontrado", HttpStatus.NOT_FOUND));

        user.setActive(false);
        userRepository.save(user);

        auditLogger.record(
                "UserAccount",
                userId.toString(),
                "ELIMINADO_LOGICO",
                admin.getEmail(),
                "Usuario dado de baja por administrador");
    }

    @Transactional(readOnly = true)
    public List<AdminProviderResponse> listProviders() {
        return providerRepository.findAll().stream()
                .map(p -> {
                    UserAccount owner = userRepository.findById(p.getUserId()).orElse(null);
                    String email = owner != null ? owner.getEmail() : "";
                    String name = owner != null ? owner.getFullName() : "";
                    long staffCount =
                            staffRepository.findByProviderId(p.getId()).size();
                    long servicesCount = serviceRepository
                            .findByProviderIdOrderByNameAsc(p.getId())
                            .size();
                    return AdminProviderResponse.of(p, email, name, staffCount, servicesCount);
                })
                .toList();
    }

    @Transactional
    public AdminProviderResponse verifyProvider(UserAccount admin, UUID providerId, boolean verify) {
        Provider provider = providerRepository
                .findById(providerId)
                .orElseThrow(() -> new BusinessException(
                        "PROVEEDOR_NO_ENCONTRADO", "Proveedor no encontrado", HttpStatus.NOT_FOUND));

        if (verify) {
            provider.verifyIdentity();
        } else {
            // Desverificar
            try {
                var field = Provider.class.getDeclaredField("identityVerified");
                field.setAccessible(true);
                field.set(provider, false);
            } catch (Exception ignored) {
            }
        }
        providerRepository.save(provider);

        auditLogger.record(
                "Provider",
                providerId.toString(),
                verify ? "IDENTIDAD_VERIFICADA" : "VERIFICACION_REVOCADA",
                admin.getEmail(),
                "Verificación de proveedor gestionada por admin");

        UserAccount owner = userRepository.findById(provider.getUserId()).orElse(null);
        String email = owner != null ? owner.getEmail() : "";
        String name = owner != null ? owner.getFullName() : "";
        long staffCount = staffRepository.findByProviderId(provider.getId()).size();
        long servicesCount = serviceRepository
                .findByProviderIdOrderByNameAsc(provider.getId())
                .size();
        return AdminProviderResponse.of(provider, email, name, staffCount, servicesCount);
    }

    @Transactional
    public AdminProviderResponse toggleProviderActive(UserAccount admin, UUID providerId) {
        Provider provider = providerRepository
                .findById(providerId)
                .orElseThrow(() -> new BusinessException(
                        "PROVEEDOR_NO_ENCONTRADO", "Proveedor no encontrado", HttpStatus.NOT_FOUND));

        provider.setActive(!provider.isActive());
        providerRepository.save(provider);

        auditLogger.record(
                "Provider",
                providerId.toString(),
                provider.isActive() ? "ACTIVADO" : "DESACTIVADO",
                admin.getEmail(),
                "Estado del proveedor modificado por administrador");

        UserAccount owner = userRepository.findById(provider.getUserId()).orElse(null);
        String email = owner != null ? owner.getEmail() : "";
        String name = owner != null ? owner.getFullName() : "";
        long staffCount = staffRepository.findByProviderId(provider.getId()).size();
        long servicesCount = serviceRepository
                .findByProviderIdOrderByNameAsc(provider.getId())
                .size();
        return AdminProviderResponse.of(provider, email, name, staffCount, servicesCount);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> listAuditLogs() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public SystemStatsResponse getStats() {
        List<UserAccount> users = userRepository.findAll();
        long totalUsers = users.size();
        long totalClients =
                users.stream().filter(u -> u.getRole() == Role.CLIENT).count();
        long totalProviders = providerRepository.count();
        long totalStaff = staffRepository.count();

        List<Appointment> appointments = appointmentRepository.findAll();
        long totalAppointments = appointments.size();
        long completed = appointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.COMPLETADA)
                .count();
        long cancelled = appointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CANCELADA
                        || a.getStatus() == AppointmentStatus.CANCELADA_POR_IMPREVISTO)
                .count();

        Map<String, Long> byStatus = new HashMap<>();
        for (AppointmentStatus status : AppointmentStatus.values()) {
            long count =
                    appointments.stream().filter(a -> a.getStatus() == status).count();
            byStatus.put(status.name(), count);
        }

        long totalFacilities = instalacionRepository.count();
        long totalClasses = claseRepository.count();
        long totalTournaments = torneoRepository.count();

        // Estimación de facturación basada en servicios completados
        BigDecimal estimatedRevenue = BigDecimal.valueOf(completed * 45000L);

        return new SystemStatsResponse(
                totalUsers,
                totalClients,
                totalProviders,
                totalStaff,
                totalAppointments,
                completed,
                cancelled,
                totalFacilities,
                totalClasses,
                totalTournaments,
                estimatedRevenue,
                byStatus);
    }
}
