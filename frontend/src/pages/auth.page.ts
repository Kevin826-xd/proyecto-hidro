import { attachAuthEvents, type AuthCallbacks, renderAuthState } from "../components/auth";
import type { AppElements } from "../elements";

export function createAuthPage(elements: AppElements, callbacks: AuthCallbacks) {
  attachAuthEvents(elements, callbacks);

  return {
    render: (onLoggedIn: () => void) => renderAuthState(elements, onLoggedIn),
  };
}
