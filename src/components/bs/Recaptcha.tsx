import { forwardRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";

export const RECAPTCHA_SITE_KEY = import.meta.env["VITE_RECAPTCHA_SITE_KEY"] as string | undefined;

interface CaptchaCheckboxProps {
  theme?: "light" | "dark";
  onVerify: (token: string | null) => void;
}

export const CaptchaCheckbox = forwardRef<ReCAPTCHA, CaptchaCheckboxProps>(
  function CaptchaCheckbox({ theme = "light", onVerify }, ref) {
    if (!RECAPTCHA_SITE_KEY) {
      return (
        <p
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm font-medium text-amber-800"
        >
          VITE_RECAPTCHA_SITE_KEY belum dikonfigurasi.
        </p>
      );
    }
    return (
      <div className="flex justify-start">
        <ReCAPTCHA
          ref={ref}
          sitekey={RECAPTCHA_SITE_KEY}
          theme={theme}
          size="compact"
          onChange={onVerify}
        />
      </div>
    );
  },
);
