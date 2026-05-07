# Roadmap y Gantt

## Principio de orden

FoundryOS esta en modo piloto asistido. La prioridad no es un lanzamiento publico ni checkout abierto, sino validar utilidad real con 3-5 pilotos comparables.

## Fase 1 - Pilot-safe fixes

- cerrar copy publica alrededor de FoundryOS;
- cambiar CTAs publicos a request access / join pilot;
- mantener signup solo para usuarios invitados o acceso manual;
- marcar Snapshot publico como draft inicial, no entrega final revisada;
- quitar preguntas de facturacion privada del intake publico;
- verificar que Stripe y LLM refinement sigan desactivados;
- confirmar build, lint y typecheck.

## Fase 2 - Preparacion del primer piloto asistido

- configurar `DATABASE_URL` de preview/produccion;
- verificar dominio e inbox de Resend;
- ejecutar migraciones;
- probar signup, verificacion, login, workspace, profile, diagnostics, 30-day plan, assets, routines, feedback, support y admin;
- preparar guion de intake y guion de revision;
- seleccionar 1 caso fundador-led con oferta real y sin equipo de marketing.

## Fase 3 - Ejecucion de pilotos comparables

- ejecutar piloto 1 con intake guiado;
- revisar outputs antes de presentarlos;
- capturar feedback por modulo y notas de sesion;
- registrar que partes hubo que corregir manualmente;
- repetir con 2-4 casos comparables antes de elegir la cuna.

## Fase 4 - Preparacion comercial

- decidir wedge despues de evidencia real;
- actualizar mensajes y FAQs para ese segmento;
- definir rangos de setup fee y recurrencia como hipotesis;
- revisar legal, privacidad, cookies, subprocessors, pagos, refunds y DPA basico;
- disenar onboarding manual para primeros pilotos pagados.

## Fase 5 - Automatizacion posterior

- agregar copy/export de entregables revisados;
- formalizar admin interno;
- conectar primera fuente de evidencia externa si los pilotos lo justifican;
- activar Stripe solo cuando billing, provisioning, account states, success/cancel y portal esten probados;
- anadir refinamiento LLM solo como capa controlada sobre la logica determinista.

## Gantt 12 semanas

| Semana | Hito principal | Entregable |
| --- | --- | --- |
| 1 | Pilot-safe fixes | UI, CTAs, Snapshot draft framing, docs y build verificados |
| 2 | Produccion/preproduccion lista | Env, email, migraciones y E2E verificados |
| 3 | Piloto 1 | Intake, outputs revisados, sesion y feedback |
| 4 | Aprendizajes piloto 1 | Ajustes menores y notas de calidad |
| 5 | Piloto 2 | Segundo caso comparable |
| 6 | Piloto 3 | Tercer caso comparable |
| 7 | Decision de cuna | Segmento prioritario y criterios documentados |
| 8 | Oferta especifica | Landing/copy/FAQs para la cuna elegida |
| 9 | Primer piloto pagado manual | Setup fee o senal de pago, sin provisioning automatico |
| 10 | Seguimiento pagado | Feedback, uso y percepcion de valor |
| 11 | Ajuste pricing | Rangos y estructura revisados |
| 12 | Roadmap v2 | Prioridades de datos, conectores, export y refinamiento |

## Fuera de alcance ahora

- lanzamiento publico self-serve;
- checkout abierto;
- 5-10 ventas como objetivo inmediato;
- promesas agentic o de automatizacion autonoma;
- elegir vertical final antes de 3-5 pilotos comparables.
