export function getFriendlyErrorMessage(error: any): string {
  const reason =
    error?.reason ||
    error?.shortMessage ||
    error?.error?.message ||
    error?.message ||
    "";
  const normalized = reason.toLowerCase();

  if (normalized.includes("daoispaused") || normalized.includes("panic")) {
    return "La DAO está en modo pánico. Esperá a que el owner la reactive.";
  }

  if (normalized.includes("insufficientstake")) {
    return "No tenés suficiente staking para completar esta acción.";
  }

  if (normalized.includes("locktimenotreached")) {
    return "Tus tokens siguen bloqueados. Esperá a que termine el período de lock.";
  }

  if (normalized.includes("alreadyvoted")) {
    return "Ya votaste esta propuesta.";
  }

  if (normalized.includes("votingnotallowed")) {
    return "Esta propuesta ya no acepta votos.";
  }

  if (normalized.includes("invalidproposal")) {
    return "La propuesta no existe o ya fue cerrada.";
  }

  if (normalized.includes("proposalnotexecutable")) {
    return "La propuesta todavía no se puede ejecutar.";
  }

  if (normalized.includes("invalidtreasuryproposal")) {
    return "Datos inválidos para la propuesta de tesorería o la DAO no tiene fondos suficientes.";
  }

  if (normalized.includes("missing revert data")) {
    return "La red no pudo estimar la transacción. Revisá los requisitos o intentá de nuevo en unos segundos.";
  }

  if (error?.code === "ACTION_REJECTED") {
    return "La transacción fue cancelada desde la wallet.";
  }

  return (
    reason ||
    "La transacción falló. Revisá los datos o intentá nuevamente en unos segundos."
  );
}
