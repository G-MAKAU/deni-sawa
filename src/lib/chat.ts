export function openChat(message?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('denisawa:chat', { detail: { message: message || '' } })
  );
}
