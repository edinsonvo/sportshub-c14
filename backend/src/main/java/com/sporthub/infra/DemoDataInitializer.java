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
 * Siembra datos demo (HU-99) de forma idempotente al arrancar. La contraseña se codifica con el
 * PasswordEncoder real del backend para que el login de los usuarios demo siempre funcione.
 * Control: app.seed.demo-data=false para desactivar en producción.
 */
@Component
@ConditionalOnProperty(prefix = "app.seed", name = "demo-data", havingValue = "true", matchIfMissing = true)
public class DemoDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    private static final String DEMO_PASSWORD = "password";

    private static final UUID PROVIDER_ID = UUID.fromString("20000000-0000-0000-0000-000000000001");
    private static final UUID STAFF_ID = UUID.fromString("30000000-0000-0000-0000-000000000001");
    private static final UUID SERVICE_ID = UUID.fromString("8f0a1e2d-3b4c-5d6e-7f80-9a1b2c3d4e5f");

    private static final UUID DEPORTES_PROVIDER_ID = UUID.fromString("50000000-0000-0000-0000-000000000001");
    private static final UUID DEPORTES_STAFF_ID = UUID.fromString("60000000-0000-0000-0000-000000000001");
    private static final UUID INSTALACION_A_ID = UUID.fromString("50000000-0000-0000-0000-000000000002");
    private static final UUID INSTALACION_B_ID = UUID.fromString("50000000-0000-0000-0000-000000000003");
    private static final UUID CLASE_ID = UUID.fromString("50000000-0000-0000-0000-000000000004");
    private static final UUID PLAN_ID = UUID.fromString("50000000-0000-0000-0000-000000000005");
    private static final UUID IMPLEMENTO_ID = UUID.fromString("50000000-0000-0000-0000-000000000006");
    private static final UUID TORNEO_ID = UUID.fromString("50000000-0000-0000-0000-000000000007");

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

        Provider provider = providerRepository.findById(PROVIDER_ID).orElseGet(() -> {
            Provider p = new Provider(providerUser.getId(), "Salón Belleza Elite", "CC-901234567");
            p.setId(PROVIDER_ID);
            return p;
        });
        if (!provider.isIdentityVerified()) {
            provider.verifyIdentity();
        }
        provider.setActive(true);
        providerRepository.save(provider);

        ProviderStaff staff = staffRepository.findById(STAFF_ID).orElseGet(() -> {
            ProviderStaff s = new ProviderStaff(provider.getId(), staffUser.getId(), "Estilista");
            s.setId(STAFF_ID);
            return s;
        });
        staff.setActive(true);
        staffRepository.save(staff);

        ProviderService service = serviceRepository.findById(SERVICE_ID).orElseGet(() -> {
            ProviderService s = new ProviderService(
                    provider.getId(),
                    "Corte de cabello",
                    "Corte clásico con lavado y secado",
                    60,
                    new BigDecimal("45000.00"),
                    true);
            s.setId(SERVICE_ID);
            return s;
        });
        service.setActive(true);
        serviceRepository.save(service);

        List<DayOfWeek> days =
                List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY);
        LocalTime start = LocalTime.of(9, 0);
        LocalTime end = LocalTime.of(17, 0);
        for (int i = 0; i < days.size(); i++) {
            UUID scheduleId = UUID.fromString("40000000-0000-0000-0000-00000000000" + (i + 1));
            DayOfWeek day = days.get(i);
            ServiceSchedule schedule = scheduleRepository.findById(scheduleId).orElseGet(() -> {
                ServiceSchedule s =
                        new ServiceSchedule(service.getId(), provider.getId(), staff.getId(), day, start, end);
                s.setId(scheduleId);
                return s;
            });
            schedule.setBlocked(false);
            scheduleRepository.save(schedule);
        }
    }

    private void seedDeportes(String hash) {
        UserAccount deportesUser =
                upsertUser("deportes@sporthub.co", "Centro Deportivo SportHub", "3000000005", Role.PROVIDER, hash);
        UserAccount entrenadorUser =
                upsertUser("entrenador@sporthub.co", "Entrenador Demo", "3000000006", Role.STAFF, hash);

        Provider provider = providerRepository.findById(DEPORTES_PROVIDER_ID).orElseGet(() -> {
            Provider p = new Provider(deportesUser.getId(), "Centro Deportivo SportHub", "CC-987654321");
            p.setId(DEPORTES_PROVIDER_ID);
            return p;
        });
        if (!provider.isIdentityVerified()) {
            provider.verifyIdentity();
        }
        provider.setActive(true);
        providerRepository.save(provider);

        ProviderStaff staff = staffRepository.findById(DEPORTES_STAFF_ID).orElseGet(() -> {
            ProviderStaff s = new ProviderStaff(provider.getId(), entrenadorUser.getId(), "Entrenador");
            s.setId(DEPORTES_STAFF_ID);
            return s;
        });
        staff.setActive(true);
        staffRepository.save(staff);

        seedInstalacion(
                INSTALACION_A_ID,
                provider.getId(),
                TipoInstalacion.CANCHA,
                "Cancha sintética A",
                2,
                "80000.00",
                "06:00",
                "22:00");
        seedInstalacion(
                INSTALACION_B_ID,
                provider.getId(),
                TipoInstalacion.SALA,
                "Sala de spinning",
                6,
                "15000.00",
                "06:00",
                "21:00");

        ClaseGrupal clase = claseRepository.findById(CLASE_ID).orElseGet(() -> {
            ClaseGrupal c = new ClaseGrupal(
                    provider.getId(),
                    INSTALACION_B_ID,
                    staff.getId(),
                    "Entrenamiento funcional",
                    "Intermedio",
                    LocalDate.now().plusDays(1),
                    LocalTime.of(18, 0),
                    60,
                    12);
            c.setId(CLASE_ID);
            return c;
        });
        clase.setActiva(true);
        claseRepository.save(clase);

        PlanMembresia plan = planRepository.findById(PLAN_ID).orElseGet(() -> {
            PlanMembresia p = new PlanMembresia(
                    provider.getId(),
                    "Mensual total",
                    30,
                    15,
                    new BigDecimal("120000.00"),
                    "Acceso a todas las instalaciones con 15% de descuento en tarifas");
            p.setId(PLAN_ID);
            return p;
        });
        plan.setActivo(true);
        planRepository.save(plan);

        Implemento implemento = implementoRepository.findById(IMPLEMENTO_ID).orElseGet(() -> {
            Implemento i =
                    new Implemento(provider.getId(), "Balón de fútbol", "Balones", 10, new BigDecimal("10000.00"));
            i.setId(IMPLEMENTO_ID);
            return i;
        });
        implemento.setActivo(true);
        implementoRepository.save(implemento);

        Torneo torneo = torneoRepository.findById(TORNEO_ID).orElseGet(() -> {
            Torneo t = new Torneo(
                    provider.getId(),
                    "Copa SportHub F5",
                    "Fútbol 5",
                    FormatoTorneo.ELIMINATORIA_DIRECTA,
                    LocalDate.now().plusDays(7),
                    LocalDate.now().plusDays(21),
                    8);
            t.setId(TORNEO_ID);
            return t;
        });
        torneoRepository.save(torneo);
    }

    private void seedInstalacion(
            UUID instalacionId,
            UUID providerId,
            TipoInstalacion tipo,
            String nombre,
            int capacidad,
            String tarifa,
            String apertura,
            String cierre) {
        Instalacion instalacion = instalacionRepository.findById(instalacionId).orElseGet(() -> {
            Instalacion i = new Instalacion(
                    providerId,
                    tipo,
                    nombre,
                    capacidad,
                    new BigDecimal(tarifa),
                    LocalTime.parse(apertura),
                    LocalTime.parse(cierre));
            i.setId(instalacionId);
            return i;
        });
        instalacion.setActiva(true);
        instalacionRepository.save(instalacion);
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
