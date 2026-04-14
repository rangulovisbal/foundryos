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
