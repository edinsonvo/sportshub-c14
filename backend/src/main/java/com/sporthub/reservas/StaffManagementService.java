package com.sporthub.reservas;

import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StaffManagementService {

    private final ProviderStaffRepository staffRepository;
    private final ProviderRepository providerRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogger auditLogger;

    public StaffManagementService(
            ProviderStaffRepository staffRepository,
            ProviderRepository providerRepository,
            UserRepository userRepository,
            AppointmentRepository appointmentRepository,
            PasswordEncoder passwordEncoder,
            AuditLogger auditLogger) {
        this.staffRepository = staffRepository;
        this.providerRepository = providerRepository;
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogger = auditLogger;
    }

    @Transactional(readOnly = true)
    public List<StaffMemberResponse> listStaff(UserAccount caller) {
        UUID providerId = resolveProviderId(caller);
        return staffRepository.findByProviderId(providerId).stream()
                .map(s -> {
                    UserAccount user = userRepository.findById(s.getUserId()).orElse(null);
                    return StaffMemberResponse.of(s, user);
                })
                .toList();
    }

    @Transactional
    public StaffMemberResponse createStaff(UserAccount caller, CreateStaffRequest request) {
        UUID providerId = resolveProviderId(caller);

        UserAccount staffUser = userRepository.findByEmail(request.email()).orElseGet(() -> {
            String pwd = request.password() != null && !request.password().isBlank() ? request.password() : "password";
            UserAccount newUser = new UserAccount(
                    request.email(), passwordEncoder.encode(pwd), request.fullName(), request.phone(), Role.STAFF);
            return userRepository.save(newUser);
        });

        if (staffRepository.existsByProviderIdAndUserId(providerId, staffUser.getId())) {
            throw new BusinessException(
                    "STAFF_DUPLICADO", "Este empleado ya se encuentra asignado a tu negocio", HttpStatus.CONFLICT);
        }

        ProviderStaff staff = new ProviderStaff(providerId, staffUser.getId(), request.position());
        staff.setActive(true);
        ProviderStaff saved = staffRepository.save(staff);
        String entityId = saved.getId() != null ? saved.getId().toString() : "";

        auditLogger.record(
                "ProviderStaff",
                entityId,
                "CREADO",
                caller.getEmail(),
                "Personal asignado al proveedor: " + staffUser.getEmail());

        return StaffMemberResponse.of(saved, staffUser);
    }

    @Transactional
    public StaffMemberResponse toggleStaffActive(UserAccount caller, UUID staffId) {
        UUID providerId = resolveProviderId(caller);
        ProviderStaff staff = staffRepository
                .findById(staffId)
                .orElseThrow(() ->
                        new BusinessException("STAFF_NO_ENCONTRADO", "Personal no encontrado", HttpStatus.NOT_FOUND));

        if (!staff.getProviderId().equals(providerId) && caller.getRole() != Role.ADMIN) {
            throw new BusinessException("FORBIDDEN", "No tienes permisos sobre este empleado", HttpStatus.FORBIDDEN);
        }

        staff.setActive(!staff.isActive());
        staffRepository.save(staff);

        auditLogger.record(
                "ProviderStaff",
                staffId.toString(),
                staff.isActive() ? "ACTIVADO" : "DESACTIVADO",
                caller.getEmail(),
                null);

        UserAccount user = userRepository.findById(staff.getUserId()).orElse(null);
        return StaffMemberResponse.of(staff, user);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getStaffAppointments(UserAccount caller) {
        ProviderStaff staff = staffRepository
                .findFirstByUserId(caller.getId())
                .orElseThrow(() -> new BusinessException(
                        "STAFF_NO_ASIGNADO",
                        "El usuario actual no tiene perfil de personal operativo",
                        HttpStatus.NOT_FOUND));

        return appointmentRepository.findByStaffIdOrderByDateDesc(staff.getId()).stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    private UUID resolveProviderId(UserAccount caller) {
        if (caller.getRole() == Role.PROVIDER) {
            return providerRepository
                    .findFirstByUserId(caller.getId())
                    .map(Provider::getId)
                    .orElseThrow(() -> new BusinessException(
                            "PROVEEDOR_NO_ENCONTRADO",
                            "No tienes un perfil de proveedor asociado",
                            HttpStatus.NOT_FOUND));
        }
        if (caller.getRole() == Role.STAFF) {
            return staffRepository
                    .findFirstByUserId(caller.getId())
                    .map(ProviderStaff::getProviderId)
                    .orElseThrow(() -> new BusinessException(
                            "STAFF_NO_ASIGNADO", "No estás asignado a ningún proveedor", HttpStatus.FORBIDDEN));
        }
        if (caller.getRole() == Role.ADMIN) {
            return providerRepository.findAll().stream()
                    .findFirst()
                    .map(Provider::getId)
                    .orElseThrow(() -> new BusinessException(
                            "NO_PROVEEDORES", "No hay proveedores en el sistema", HttpStatus.BAD_REQUEST));
        }
        throw new BusinessException("FORBIDDEN", "No tienes permisos de proveedor", HttpStatus.FORBIDDEN);
    }
}
