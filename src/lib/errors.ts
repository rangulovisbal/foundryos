export class ConfigurationError extends Error {
  readonly status = 503;

  constructor(
    message: string,
    public readonly code = "configuration_error"
  ) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export function isConfigurationError(error: unknown): error is ConfigurationError {
  return error instanceof ConfigurationError;
}

export function getErrorStatus(error: unknown, fallbackStatus = 400) {
  if (isConfigurationError(error)) {
    return error.status;
  }

  return fallbackStatus;
}

export function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

const safePublicMessages = new Set([
  "An account already exists for this email.",
  "Ya existe una cuenta con este correo.",
  "Invalid email or password.",
  "Correo o contraseña no válidos.",
  "This verification link is invalid or expired.",
  "This reset link is invalid or expired.",
  "Este enlace para restablecer la contraseña no es válido o ha caducado.",
  "This invitation is invalid or expired.",
  "Esta invitación no es válida o ha caducado.",
  "This invitation belongs to a different email address.",
  "Esta invitación pertenece a otra dirección de correo.",
  "This workspace could not be found.",
  "No se pudo encontrar este espacio.",
  "This invitation has already been accepted.",
  "Esta invitación ya fue aceptada.",
  "This preview currently supports one workspace per user.",
  "Esta versión piloto solo admite un espacio por usuario.",
  "You do not have permission to invite members in this workspace.",
  "No tienes permisos para invitar miembros en este espacio.",
  "Team invites are not available on this plan.",
  "Las invitaciones de equipo no están disponibles en este plan.",
  "This user is already a member of the workspace.",
  "Esta persona ya forma parte del espacio."
]);

export function getPublicErrorMessage(
  error: unknown,
  fallbackMessage: string,
  additionalSafeMessages: readonly string[] = []
) {
  if (!(error instanceof Error) || isConfigurationError(error)) {
    return fallbackMessage;
  }

  if (
    safePublicMessages.has(error.message) ||
    additionalSafeMessages.includes(error.message)
  ) {
    return error.message;
  }

  return fallbackMessage;
}
