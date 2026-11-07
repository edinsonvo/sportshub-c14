package com.sporthub.infra;

import com.sporthub.deportes.ClaseGrupal;
import com.sporthub.deportes.ClaseGrupalRepository;
import com.sporthub.deportes.FormatoTorneo;
import com.sporthub.deportes.Implemento;
import com.sporthub.deportes.ImplementoRepository;
import com.sporthub.deportes.Instalacion;
import com.sporthub.deportes.InstalacionRepository;
import com.sporthub.deportes.PlanMembresia;
import com.sporthub.deportes.PlanMembresiaRepository;
import com.sporthub.deportes.TipoInstalacion;
import com.sporthub.deportes.Torneo;
import com.sporthub.deportes.TorneoRepository;
import com.sporthub.reservas.Provider;
import com.sporthub.reservas.ProviderRepository;
import com.sporthub.reservas.ProviderService;
import com.sporthub.reservas.ProviderServiceRepository;
import com.sporthub.reservas.ProviderStaff;
import com.sporthub.reservas.ProviderStaffRepository;
import com.sporthub.reservas.ServiceSchedule;
import com.sporthub.reservas.ServiceScheduleRepository;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Siembra datos demo (HU-99) de forma idempotente al arrancar.
 * Enlaza entidades utilizando los IDs generados por persistencia para garantizar integridad referencial.
 */
@Component
@ConditionalOnProperty(prefix = "app.seed", name = "demo-data", havingValue = "true", matchIfMissing = true)
public class DemoDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    private static final String DEMO_PASSWORD = "password";

    private final UserRepository userRepository;
    private final ProviderRepository providerRepository;
    private final ProviderStaffRepository staffRepository;
    private final ProviderServiceRepository serviceRepository;
    private final ServiceScheduleRepository scheduleRepository;
    private final InstalacionRepository instalacionRepository;
    private final ClaseGrupalRepository claseRepository;
    private final PlanMembresiaRepository planRepository;
    private final ImplementoRepository implementoRepository;
    private final TorneoRepository torneoRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataInitializer(
            UserRepository userRepository,
            ProviderRepository providerRepository,
            ProviderStaffRepository staffRepository,
            ProviderServiceRepository serviceRepository,
            ServiceScheduleRepository scheduleRepository,
            InstalacionRepository instalacionRepository,
            ClaseGrupalRepository claseRepository,
            PlanMembresiaRepository planRepository,
            ImplementoRepository implementoRepository,
            TorneoRepository torneoRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.providerRepository = providerRepository;
        this.staffRepository = staffRepository;
        this.serviceRepository = serviceRepository;
        this.scheduleRepository = scheduleRepository;
        this.instalacionRepository = instalacionRepository;
        this.claseRepository = claseRepository;
        this.planRepository = planRepository;
        this.implementoRepository = implementoRepository;
        this.torneoRepository = torneoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        String hash = passwordEncoder.encode(DEMO_PASSWORD);
        seedServicios(hash);
        seedDeportes(hash);

        log.info("Datos demo listos. Correos: admin@sporthub.co, cliente@sporthub.co, "
                + "belleza@sporthub.co, laura@sporthub.co, deportes@sporthub.co, "
                + "entrenador@sporthub.co | contraseña: 'password'");
    }

    private void seedServicios(String hash) {
        UserAccount providerUser =
                upsertUser("belleza@sporthub.co", "Salón Belleza Elite", "3000000002", Role.PROVIDER, hash);
        UserAccount staffUser = upsertUser("laura@sporthub.co", "Laura Estilista", "3000000003", Role.STAFF, hash);
        upsertUser("cliente@sporthub.co", "Cliente Demo", "3000000004", Role.CLIENT, hash);
        upsertUser("admin@sporthub.co", "Administrador Plataforma", "3000000001", Role.ADMIN, hash);

        Provider provider = providerRepository
                .findByUserId(providerUser.getId())
                .orElseGet(() -> {
                    Provider p = new Provider(providerUser.getId(), "Salón Belleza Elite", "CC-901234567");
                    return providerRepository.save(p);
                });
        if (!provider.isIdentityVerified()) {
            provider.verifyIdentity();
        }
        provider.setActive(true);
        provider = providerRepository.save(provider);
        final UUID provId = provider.getId();

        ProviderStaff staff = staffRepository.findByUserId(staffUser.getId()).orElseGet(() -> {
            ProviderStaff s = new ProviderStaff(provId, staffUser.getId(), "Estilista");
            return staffRepository.save(s);
        });
        staff.setProviderId(provId);
        staff.setActive(true);
        staff = staffRepository.save(staff);
        final UUID stfId = staff.getId();

        ProviderService service = serviceRepository.findByProviderIdOrderByNameAsc(provId).stream()
                .filter(s -> s.getName().equals("Corte de cabello"))
                .findFirst()
                .orElseGet(() -> {
                    ProviderService s = new ProviderService(
                            provId,
                            "Corte de cabello",
                            "Corte clásico con lavado y secado",
                            60,
                            new BigDecimal("45000.00"),
                            true);
                    return serviceRepository.save(s);
                });
        service.setActive(true);
        service = serviceRepository.save(service);
        final UUID svcId = service.getId();

        List<ServiceSchedule> existingSchedules =
                scheduleRepository.findByProviderIdOrderByDayOfWeekAscStartTimeAsc(provId);
        List<DayOfWeek> days =
                List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY);
        LocalTime start = LocalTime.of(9, 0);
        LocalTime end = LocalTime.of(17, 0);
        for (DayOfWeek day : days) {
            boolean exists = existingSchedules.stream()
                    .anyMatch(s ->
                            s.getDayOfWeek() == day && s.getProviderServiceId().equals(svcId));
            if (!exists) {
                ServiceSchedule s = new ServiceSchedule(svcId, provId, stfId, day, start, end);
                s.setBlocked(false);
                scheduleRepository.save(s);
            }
        }
    }

    private void seedDeportes(String hash) {
        UserAccount deportesUser =
                upsertUser("deportes@sporthub.co", "Centro Deportivo SportHub", "3000000005", Role.PROVIDER, hash);
        UserAccount entrenadorUser =
                upsertUser("entrenador@sporthub.co", "Entrenador Demo", "3000000006", Role.STAFF, hash);

        Provider provider = providerRepository
                .findByUserId(deportesUser.getId())
                .orElseGet(() -> {
                    Provider p = new Provider(deportesUser.getId(), "Centro Deportivo SportHub", "CC-987654321");
                    return providerRepository.save(p);
                });
        if (!provider.isIdentityVerified()) {
            provider.verifyIdentity();
        }
        provider.setActive(true);
        provider = providerRepository.save(provider);
        final UUID depProvId = provider.getId();

        ProviderStaff staff = staffRepository
                .findByUserId(entrenadorUser.getId())
                .orElseGet(() -> {
                    ProviderStaff s = new ProviderStaff(depProvId, entrenadorUser.getId(), "Entrenador");
                    return staffRepository.save(s);
                });
        staff.setProviderId(depProvId);
        staff.setActive(true);
        staff = staffRepository.save(staff);
        final UUID depStaffId = staff.getId();

        Instalacion instA = instalacionRepository.findByProviderIdOrderByNombreAsc(depProvId).stream()
                .filter(i -> i.getNombre().equals("Cancha sintética A"))
                .findFirst()
                .orElseGet(() -> {
                    Instalacion i = new Instalacion(
                            depProvId,
                            TipoInstalacion.CANCHA,
                            "Cancha sintética A",
                            2,
                            new BigDecimal("80000.00"),
                            LocalTime.parse("06:00"),
                            LocalTime.parse("22:00"));
                    i.setActiva(true);
                    return instalacionRepository.save(i);
                });

        Instalacion instB = instalacionRepository.findByProviderIdOrderByNombreAsc(depProvId).stream()
                .filter(i -> i.getNombre().equals("Sala de spinning"))
                .findFirst()
                .orElseGet(() -> {
                    Instalacion i = new Instalacion(
                            depProvId,
                            TipoInstalacion.SALA,
                            "Sala de spinning",
                            6,
                            new BigDecimal("15000.00"),
                            LocalTime.parse("06:00"),
                            LocalTime.parse("21:00"));
                    i.setActiva(true);
                    return instalacionRepository.save(i);
                });
        final UUID instBId = instB.getId();

        claseRepository.findByProviderIdOrderByFechaDesc(depProvId).stream()
                .filter(c -> c.getNombre().equals("Entrenamiento funcional"))
                .findFirst()
                .orElseGet(() -> {
                    ClaseGrupal c = new ClaseGrupal(
                            depProvId,
                            instBId,
                            depStaffId,
                            "Entrenamiento funcional",
                            "Intermedio",
                            LocalDate.now().plusDays(1),
                            LocalTime.of(18, 0),
                            60,
                            12);
                    c.setActiva(true);
                    return claseRepository.save(c);
                });

        planRepository.findByProviderIdOrderByNombreAsc(depProvId).stream()
                .filter(p -> p.getNombre().equals("Mensual total"))
                .findFirst()
                .orElseGet(() -> {
                    PlanMembresia p = new PlanMembresia(
                            depProvId,
                            "Mensual total",
                            30,
                            15,
                            new BigDecimal("120000.00"),
                            "Acceso a todas las instalaciones con 15% de descuento en tarifas");
                    p.setActivo(true);
                    return planRepository.save(p);
                });

        implementoRepository.findByProviderIdOrderByNombreAsc(depProvId).stream()
                .filter(imp -> imp.getNombre().equals("Balón de fútbol"))
                .findFirst()
                .orElseGet(() -> {
                    Implemento imp =
                            new Implemento(depProvId, "Balón de fútbol", "Balones", 10, new BigDecimal("10000.00"));
                    imp.setActivo(true);
                    return implementoRepository.save(imp);
                });

        torneoRepository.findAllByOrderByFechaInicioDesc().stream()
                .filter(t -> t.getNombre().equals("Copa SportHub F5"))
                .findFirst()
                .orElseGet(() -> {
                    Torneo t = new Torneo(
                            depProvId,
                            "Copa SportHub F5",
                            "Fútbol 5",
                            FormatoTorneo.ELIMINATORIA_DIRECTA,
                            LocalDate.now().plusDays(7),
                            LocalDate.now().plusDays(21),
                            8);
                    return torneoRepository.save(t);
                });
    }

    private UserAccount upsertUser(String email, String fullName, String phone, Role role, String hash) {
        return userRepository
                .findByEmail(email)
                .map(user -> {
                    user.setActive(true);
                    user.setFullName(fullName);
                    user.setPhone(phone);
                    user.setPasswordHash(hash);
                    return userRepository.save(user);
                })
                .orElseGet(() -> userRepository.save(new UserAccount(email, hash, fullName, phone, role)));
    }
}
