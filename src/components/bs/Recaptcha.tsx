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
      <div
        className={`flex w-full max-w-[324px] items-center justify-center rounded-2xl border p-2.5 shadow-[0_8px_24px_-18px_rgba(16,20,25,.6)] transition focus-within:ring-2 focus-within:ring-[#ffd84d]/60 sm:justify-start ${
          theme === "dark"
            ? "border-[#303b4b] bg-[#151d28]"
            : "border-[#e1e6ed] bg-[#f8fafc]"
        }`}
        aria-label="Verifikasi keamanan"
      >
        <ReCAPTCHA
          ref={ref}
          sitekey={RECAPTCHA_SITE_KEY}
          theme={theme}
          size="normal"
          onChange={onVerify}
        />
      </div>
    );
  },
);
