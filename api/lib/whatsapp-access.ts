export type WhatsAppAccess = {
  mode: "none" | "direct" | "group" | "direct_and_group";
  directNumber?: string | null;
  groupInviteUrl?: string | null;
  groupAccessPolicy?: string | null;
  isEligible: boolean;
};

export function getWhatsAppAccessForBooking(
  booking: { status: string },
  order: { status: string } | null | undefined,
  service: {
    communicationMode?: string | null;
    whatsappDirectNumber?: string | null;
    whatsappGroupInviteUrl?: string | null;
    whatsappGroupAccessPolicy?: string | null;
    requiresPayment?: boolean | null;
  },
): WhatsAppAccess {
  const mode = service.communicationMode ?? "none";

  if (mode === "none") {
    return { mode: "none", isEligible: false };
  }

  const access: WhatsAppAccess = {
    mode: "none",
    directNumber: undefined,
    groupInviteUrl: undefined,
    groupAccessPolicy: undefined,
    isEligible: false,
  };

  if (mode === "whatsapp_direct") access.mode = "direct";
  else if (mode === "whatsapp_group") access.mode = "group";
  else if (mode === "whatsapp_direct_and_group") access.mode = "direct_and_group";

  if (mode.includes("direct")) {
    access.directNumber = service.whatsappDirectNumber ?? null;
  }

  if (mode.includes("group")) {
    access.groupInviteUrl = service.whatsappGroupInviteUrl ?? null;
    access.groupAccessPolicy = service.whatsappGroupAccessPolicy ?? "after_payment";
  }

  const policy = service.whatsappGroupAccessPolicy ?? "after_payment";
  const requiresPayment = service.requiresPayment !== false;
  const bookingConfirmedOrCompleted =
    booking.status === "confirmed" || booking.status === "completed";

  switch (policy) {
    case "after_booking":
      access.isEligible = bookingConfirmedOrCompleted;
      break;
    case "after_payment":
      if (requiresPayment) {
        access.isEligible = bookingConfirmedOrCompleted && order?.status === "paid";
      } else {
        access.isEligible = bookingConfirmedOrCompleted;
      }
      break;
    case "after_completion":
      access.isEligible = booking.status === "completed";
      break;
    case "manual":
      access.isEligible = false;
      break;
  }

  return access;
}
