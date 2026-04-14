# Product Requirements Document

## Objetivo del MVP

Construir una web app que permita vender, diagnosticar y activar el producto AI Growth OS sin depender de una operacion manual desordenada.

## Usuario principal

Founder o responsable de crecimiento/operaciones de una startup pequena o negocio digital validado.

## Jobs to be done

1. Entender rapidamente el estado actual del negocio.
2. Saber que acciones priorizar en 30 dias.
3. Recibir un roadmap util y no generico.
4. Identificar automatizaciones y SOPs aplicables.
5. Hacer seguimiento mensual sin rehacer el trabajo desde cero.

## Modulos MVP

### 1. Marketing site

- Home con posicionamiento.
- Pricing.
- Security page.
- CTA a Snapshot y demo.

### 2. Onboarding intake

- Formulario con:
  - negocio,
  - oferta,
  - ICP,
  - web,
  - canales,
  - competencia,
  - recursos,
  - objetivos,
  - stack,
  - dolores.

### 3. Snapshot engine

- scoring del negocio,
- deteccion de gaps,
- prioridades a 30 dias,
- quick wins,
- lectura de posicionamiento,
- stack sugerido,
- riesgos principales.

### 4. Dashboard

- score general,
- prioridades,
- modulos activables,
- SOPs sugeridos,
- automatizaciones sugeridas,
- seguimiento mensual.

### 5. Admin / Ops light

- trazabilidad de envios,
- seguimiento de cuentas,
- estado de onboarding,
- estado del refresh.

## Requisitos funcionales

- El usuario puede navegar la propuesta comercial sin login.
- El usuario puede completar un onboarding estructurado.
- El sistema devuelve un diagnostico aunque no haya API keys configuradas, usando un motor heuristico local.
- El sistema puede mejorarse con OpenAI si existe `OPENAI_API_KEY`.
- El dashboard debe renderizar prioridades, riesgos, quick wins y modulos recomendados.
- Debe existir una ruta de healthcheck para validar despliegues.

## Requisitos no funcionales

- Web-first.
- Responsive.
- Preparado para Vercel.
- Variables de entorno separadas.
- Base lista para multi-tenant.
- Logs y analitica preparados para PostHog.

## Integraciones previstas

- Supabase para auth y datos.
- Stripe para checkout.
- OpenAI para analisis y generacion.
- PostHog para analitica.
- n8n para automatizaciones.

## Fuera de scope del MVP

- app movil,
- soporte en tiempo real siempre activo,
- automatizacion total desde dia uno,
- custom work profundo dentro del plan base.
