const REDIRECT_KEY = 'servicoja_redirect_after_login';

export function setRedirectUrl(url: string) {
  sessionStorage.setItem(REDIRECT_KEY, url);
}

export function getRedirectUrl(): string | null {
  return sessionStorage.getItem(REDIRECT_KEY);
}

export function clearRedirectUrl() {
  sessionStorage.removeItem(REDIRECT_KEY);
}

export function useRedirectAfterLogin() {
  return {
    setRedirectUrl,
    getRedirectUrl,
    clearRedirectUrl,
  };
}
