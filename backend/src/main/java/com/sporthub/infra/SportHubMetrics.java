package com.sporthub.infra;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class SportHubMetrics {

    private final Counter appointmentsCreated;
    private final Counter appointmentsCancelled;
    private final Counter instalacionesReservadas;
    private final Counter clasesInscritas;
    private final Counter membresiasActivas;
    private final Counter implementosReservados;
    private final Counter torneosCreados;
    private final Counter torneosInscritos;

    public SportHubMetrics(MeterRegistry registry) {
        this.appointmentsCreated = Counter.builder("sporthub.appointments.created")
                .description("Citas creadas (SOLICITADA)")
                .register(registry);
        this.appointmentsCancelled = Counter.builder("sporthub.appointments.cancelled")
                .description("Citas canceladas (CANCELADA / CANCELADA_POR_IMPREVISTO)")
                .register(registry);
        this.instalacionesReservadas = Counter.builder("sporthub.deportes.instalaciones.reservadas")
                .description("Reservas de instalaciones deportivas (E9)")
                .register(registry);
        this.clasesInscritas = Counter.builder("sporthub.deportes.clases.inscripciones")
                .description("Inscripciones a clases grupales (E9)")
                .register(registry);
        this.membresiasActivas = Counter.builder("sporthub.deportes.membresias.activas")
                .description("Compras o renovaciones de membresías (E9)")
                .register(registry);
        this.implementosReservados = Counter.builder("sporthub.deportes.implementos.reservados")
                .description("Reservas de implementos deportivos (E9)")
                .register(registry);
        this.torneosCreados = Counter.builder("sporthub.deportes.torneos.creados")
                .description("Torneos creados (E9)")
                .register(registry);
        this.torneosInscritos = Counter.builder("sporthub.deportes.torneos.inscripciones")
                .description("Inscripciones a torneos (E9)")
                .register(registry);
    }

    public void appointmentCreated() {
        appointmentsCreated.increment();
    }

    public void appointmentCancelled() {
        appointmentsCancelled.increment();
    }

    public void instalacionReservada() {
        instalacionesReservadas.increment();
    }

    public void claseInscrita() {
        clasesInscritas.increment();
    }

    public void membresiaComprada() {
        membresiasActivas.increment();
    }

    public void implementoReservado() {
        implementosReservados.increment();
    }

    public void torneoCreado() {
        torneosCreados.increment();
    }

    public void torneoInscrito() {
        torneosInscritos.increment();
    }
}
