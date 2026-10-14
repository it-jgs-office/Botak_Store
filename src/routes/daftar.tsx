import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type ReCAPTCHA from "react-google-recaptcha";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/bs/PublicLayout";
import { useSession } from "@/components/bs/ui";
import { CaptchaCheckbox } from "@/components/bs/Recaptcha";
import { registerCustomer } from "@/lib/actions";
import { routeSeo } from "@/lib/site";

export const Route = createFileRoute("/daftar")({
  head: () => ({
    meta: [
      { title: "Daftar — BotakStore" },
      {
        name: "description",
        content: "Buat akun BotakStore untuk menyimpan dan memantau riwayat pesanan.",
      },
      ...routeSeo("/daftar", "Daftar — BotakStore", "Buat akun BotakStore untuk menyimpan dan memantau riwayat pesanan."),
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<ReCAPTCHA>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmation: "",
  });

  useEffect(() => {
    if (session) navigate({ to: "/profil", replace: true });
  }, [navigate, session]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.replace(/[^0-9+]/g, "");

    if (name.length < 3) {
      setError("Nama minimal 3 karakter.");
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Masukkan nomor WhatsApp yang valid.");
      return;
    }
    if (form.password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (form.password !== form.confirmation) {
      setError("Konfirmasi kata sandi belum sama.");
      return;
    }
    if (!captchaToken) {
      setError("Mohon centang verifikasi captcha terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    const result = await registerCustomer(name, email, phone, form.password, captchaToken);
    if (!result.ok) {
      setError(result.error);
      captchaRef.current?.reset();
      setCaptchaToken(null);
      setSubmitting(false);
      return;
    }
    navigate({ to: "/profil" });
  };

  return (
    <main className="flex min-h-[100dvh] flex-col bg-[#f5f6f8]">
      <header className="flex h-14 items-center justify-between gap-2 px-3 sm:h-20 sm:px-8">
        <Logo animated={false} />
        <Link
          to="/"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#59616b] transition hover:bg-white hover:text-[#17191d] sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
        </Link>
      </header>

      <div className="flex flex-1 items-start justify-center px-3 pb-8 pt-4 sm:items-center sm:px-4 sm:pb-14 sm:pt-0">
        <div className="w-full max-w-[460px]">
          <div className="rounded-2xl border border-[#e4e7eb] bg-white p-5 shadow-[0_24px_70px_-40px_rgba(15,23,42,.35)] sm:rounded-[1.75rem] sm:p-8">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#aa8300]">
              Mulai lebih mudah
            </p>
            <h1 className="mt-2 text-xl font-black sm:text-3xl">Buat akun BotakStore</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Simpan pesanan dan pantau progresnya dalam satu akun.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-3.5 sm:mt-7 sm:space-y-4" noValidate>
              <AuthField label="Nama lengkap" icon={<UserRound />}>
                <Input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  autoComplete="name"
                  placeholder="Nama lengkap"
                  className="h-12 border-[#dce1e6] bg-[#fafbfc] pl-10"
                />
              </AuthField>

              <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
                <AuthField label="Email" icon={<Mail />}>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    autoComplete="email"
                    placeholder="nama@email.com"
                    className="h-12 border-[#dce1e6] bg-[#fafbfc] pl-10"
                  />
                </AuthField>
                <AuthField label="Nomor WhatsApp" icon={<Phone />}>
                  <Input
                    type="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    autoComplete="tel"
                    placeholder="08xxxxxxxxxx"
                    className="h-12 border-[#dce1e6] bg-[#fafbfc] pl-10"
                  />
                </AuthField>
              </div>

              <AuthField label="Kata sandi" icon={<LockKeyhole />}>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  className="h-12 border-[#dce1e6] bg-[#fafbfc] px-10"
                />
                <PasswordToggle
                  visible={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                />
              </AuthField>

              <AuthField label="Ulangi kata sandi" icon={<LockKeyhole />}>
                <Input
                  type={showConfirmation ? "text" : "password"}
                  value={form.confirmation}
                  onChange={(event) => setForm({ ...form, confirmation: event.target.value })}
                  autoComplete="new-password"
                  placeholder="Ketik ulang kata sandi"
                  className="h-12 border-[#dce1e6] bg-[#fafbfc] px-10"
                />
                <PasswordToggle
                  visible={showConfirmation}
                  onClick={() => setShowConfirmation((visible) => !visible)}
                />
              </AuthField>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700"
                >
                  {error}
                </p>
              )}

              <CaptchaCheckbox ref={captchaRef} onVerify={setCaptchaToken} />

              <Button
                type="submit"
                size="lg"
                disabled={submitting || !captchaToken}
                className="h-12 w-full bg-[#ffd84d] font-black text-[#17191d] shadow-[0_10px_25px_rgba(225,177,0,.2)] hover:bg-[#ffca24]"
              >
                {submitting ? "Membuat akun..." : "Daftar"}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-[#6f7781]">
              Sudah punya akun?{" "}
              <Link to="/login" className="font-black text-[#8a6800] hover:text-[#17191d]">
                Masuk
              </Link>
            </p>
          </div>

          <p className="mt-5 px-4 text-center text-xs leading-5 text-[#858d97]">
            Dengan mendaftar, kamu menyetujui ketentuan dan kebijakan layanan BotakStore.
          </p>
        </div>
      </div>
    </main>
  );
}

function AuthField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-[#454c55]">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#929aa4] [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
        {children}
      </span>
    </label>
  );
}

function PasswordToggle({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
      className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md text-[#8b939d] hover:text-[#17191d]"
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}
