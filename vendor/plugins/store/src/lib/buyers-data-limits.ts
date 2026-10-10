// Limits of buyers' messages, shared by the server and the shop's forms (ADR 0058).
export const MESSAGE_LIMITS = { subject: 120, body: 4000, threadsPerBuyer: 50 } as const;
