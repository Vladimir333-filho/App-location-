import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const SITE_KEY = '54b81ea0-5bbe-451c-bdee-5490e364c1b0';
const SCRIPT_URL = 'https://js.hcaptcha.com/1/api.js?render=explicit';

const HCaptcha = forwardRef(function HCaptcha({ onVerify, onExpire, onError }, ref) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const callbacksRef = useRef({ onVerify, onExpire, onError });

  callbacksRef.current = { onVerify, onExpire, onError };

  useImperativeHandle(ref, () => ({
    resetCaptcha() {
      if (window.hcaptcha && widgetIdRef.current !== null) {
        window.hcaptcha.reset(widgetIdRef.current);
      }
    },
  }), []);

  useEffect(() => {
    let cancelled = false;
    let script = document.querySelector('script[data-quotamob-hcaptcha]');

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.hcaptcha || widgetIdRef.current !== null) return;
      widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => callbacksRef.current.onVerify?.(token),
        'expired-callback': () => callbacksRef.current.onExpire?.(),
        'error-callback': () => callbacksRef.current.onError?.(),
        'theme': 'light',
      });
    };

    if (window.hcaptcha) {
      renderWidget();
    } else {
      if (!script) {
        script = document.createElement('script');
        script.src = SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.dataset.quotamobHcaptcha = 'true';
        document.head.appendChild(script);
      }
      script.addEventListener('load', renderWidget);
      script.addEventListener('error', () => callbacksRef.current.onError?.());
    }

    return () => {
      cancelled = true;
      if (script) script.removeEventListener('load', renderWidget);
      if (window.hcaptcha && widgetIdRef.current !== null) {
        try { window.hcaptcha.remove(widgetIdRef.current); } catch { /* widget já removido */ }
      }
      widgetIdRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="flex min-h-[78px] justify-center" aria-label="Verificação hCaptcha" />;
});

export default HCaptcha;
