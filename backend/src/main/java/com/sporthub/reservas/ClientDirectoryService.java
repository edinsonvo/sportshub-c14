package com.sporthub.reservas;

import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Directorio de clientes derivado de las citas visibles para el usuario autenticado. */
@Service
public class ClientDirectoryService {

    private final AppointmentRepository appointmentRepository;
    private final ProviderRepository providerRepository;
    private final ProviderStaffRepository staffRepository;
    private final UserRepository userRepository;

    public ClientDirectoryService(
            AppointmentRepository appointmentRepository,
            ProviderRepository providerRepository,
            ProviderStaffRepository staffRepository,
            UserRepository userRepository) {
        this.appointmentRepository = appointmentRepository;
        this.providerRepository = providerRepository;
        this.staffRepository = staffRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ClientSummaryResponse> listClients(UserAccount caller) {
        List<Appointment> appointments = visibleAppointments(caller);
        Map<UUID, ClientSummaryResponse> clients = new LinkedHashMap<>();
        for (Appointment appointment : appointments) {
            UUID clientId = appointment.getClientId();
            if (!clients.containsKey(clientId)) {
                userRepository
                        .findById(clientId)
                        .map(ClientSummaryResponse::from)
                        .ifPresent(client -> clients.put(clientId, client));
            }
        }
        return new ArrayList<>(clients.values());
    }

    private List<Appointment> visibleAppointments(UserAccount caller) {
        return switch (caller.getRole()) {
            case CLIENT -> appointmentRepository.findByClientIdOrderByDateDesc(caller.getId());
            case STAFF -> staffRepository
                    .findFirstByUserId(caller.getId())
                    .map(staff -> appointmentRepository.findByStaffIdOrderByDateDesc(staff.getId()))
                    .orElse(List.of());
            case PROVIDER -> providerRepository
                    .findFirstByUserId(caller.getId())
                    .map(provider -> appointmentRepository.findByProviderIdOrderByDateDesc(provider.getId()))
                    .orElse(List.of());
            case ADMIN -> appointmentRepository.findAll();
        };
    }
}
