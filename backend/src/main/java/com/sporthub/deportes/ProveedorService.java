package com.sporthub.deportes;

import com.sporthub.infra.BusinessException;
import com.sporthub.reservas.Provider;
import com.sporthub.reservas.ProviderRepository;
import com.sporthub.reservas.ProviderStaff;
import com.sporthub.reservas.ProviderStaffRepository;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProveedorService {

    private final ProviderRepository providerRepository;
    private final ProviderStaffRepository staffRepository;
    private final UserRepository userRepository;

    public ProveedorService(
            ProviderRepository providerRepository,
            ProviderStaffRepository staffRepository,
            UserRepository userRepository) {
        this.providerRepository = providerRepository;
        this.staffRepository = staffRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public ProveedorResponse me(UserAccount caller) {
        UUID providerId;
        if (caller.getRole() == Role.PROVIDER) {
            providerId = providerRepository
                    .findByUserId(caller.getId())
                    .map(Provider::getId)
                    .orElseThrow(() -> new BusinessException(
                            "PROVEEDOR_NO_ENCONTRADO", "Perfil de proveedor no encontrado", HttpStatus.NOT_FOUND));
        } else if (caller.getRole() == Role.STAFF) {
            providerId = staffRepository
                    .findByUserId(caller.getId())
                    .map(ProviderStaff::getProviderId)
                    .orElseThrow(() -> new BusinessException(
                            "PROVEEDOR_NO_ENCONTRADO",
                            "No está asignado a un proveedor",
                            HttpStatus.NOT_FOUND));
        } else {
            throw new BusinessException(
                    "ROL_INVALIDO", "Este rol no posee un perfil de proveedor", HttpStatus.BAD_REQUEST);
        }
        Provider provider = providerRepository
                .findById(providerId)
                .orElseThrow(() -> new BusinessException(
                        "PROVEEDOR_NO_ENCONTRADO", "Perfil de proveedor no encontrado", HttpStatus.NOT_FOUND));
        List<StaffOption> staff = staffRepository.findByProviderId(providerId).stream()
                .map(s -> new StaffOption(
                        s.getId(),
                        userRepository.findById(s.getUserId()).map(UserAccount::getFullName).orElse(""),
                        s.getPosition()))
                .toList();
        return new ProveedorResponse(
                provider.getId(), provider.getBusinessName(), provider.getLogoUrl(), provider.isActive(), staff);
    }
}