"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError?: () => void;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) {
        initializeGoogle();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;

      script.onload = initializeGoogle;

      document.head.appendChild(script);
    };

    const initializeGoogle = () => {
      if (!window.google || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          if (response?.credential) {
            onSuccess(response.credential);
          } else {
            onError?.();
          }
        },
      });

      buttonRef.current.innerHTML = "";

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "filled_black",
        size: "large",
        width: 360,
        text: "continue_with",
        shape: "rectangular",
      });
    };

    loadGoogleScript();
  }, [onSuccess, onError]);

  return (
    <div
      ref={buttonRef}
      className="flex min-h-[44px] w-full justify-center"
    />
  );
}