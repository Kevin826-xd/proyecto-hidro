import { attachAuthEvents, renderAuthState } from "../components/auth.js";

export function createAuthPage(elements, callbacks) {
  attachAuthEvents(elements, callbacks);

  return {
    render: (onLoggedIn) => renderAuthState(elements, onLoggedIn),
  };
}