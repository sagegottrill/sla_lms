/**
 * HAPTICS — light taps and success/error buzzes wired through Capacitor Haptics.
 * Falls back silently on devices/plugins without support.
 */
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

export async function hapticTap() {
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { /* unsupported */ }
}

export async function hapticSelect() {
  try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch { /* unsupported */ }
}

export async function hapticSuccess() {
  try { await Haptics.notification({ type: NotificationType.Success }); } catch { /* unsupported */ }
}

export async function hapticError() {
  try { await Haptics.notification({ type: NotificationType.Error }); } catch { /* unsupported */ }
}
