import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Gamepad2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/bs/PublicLayout";
import { useSession } from "@/components/bs/ui";
import { loginAs, registerCustomer } from "@/lib/actions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk atau Daftar — BotakStore" },
      {
        name: "description",
        content:
          "Masuk ke akun BotakStore untuk melihat dan mengelola pesanan joki Mobile Legends.",
      },
    ],
  }),
  component: LoginPage,
});

type AuthMode = "login" | "register" | "forgot";

function LoginPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (session) navigate({ to: "/profil", replace: true });
  }, [navigate, session]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setMessage("");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const email = form.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setError("Masukkan alamat email yang valid.");
      return;
    }

    if (mode === "forgot") {
      setMessage("Jika email terdaftar, petunjuk pemulihan akun akan dikirim.");
      return;
    }

    if (form.password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }

    setSubmitting(true);
    if (mode === "login") {
      const result = loginAs(email, form.password);
      if (!result.ok) {
        setError(result.error);
        setSubmitting(false);
        return;
      }
      navigate({ to: "/profil" });
      return;
    }

    if (form.name.trim().length < 3) {
      setError("Masukkan nama lengkap minimal 3 karakter.");
      setSubmitting(false);
      return;
    }
    if (!/^08\d{8,13}$/.test(form.phone.replace(/\s/g, ""))) {
      setError("Masukkan nomor WhatsApp Indonesia yang valid.");
      setSubmitting(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Konfirmasi kata sandi belum sama.");
      setSubmitting(false);
      return;
    }

    const result = registerCustomer(
      form.name.trim(),
      email,
      form.phone.replace(/\s/g, ""),
      form.password,
    );
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    navigate({ to: "/profil" });
  };

  const useDemoAccount = () => {
    setForm((current) => ({
      ...current,
      email: "customer@botakstore.demo",
      password: "botak123",
    }));
    setError("");
  };

  return (
    <main className="min-h-screen bg-[#f5f6f8] lg:grid lg:grid-cols-[minmax(420px,.9fr)_1.1fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#0b0f13] p-10 text-white lg:flex lg:flex-col xl:p-14">
        <img
          src="/banner-botak.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f13]/60 via-[#0b0f13]/75 to-[#0b0f13]" />
        <div className="absolute -left-28 bottom-28 h-80 w-80 rounded-full bg-[#ffd84d]/20 blur-3xl" />
        <div className="relative z-10">
          <Logo animated={false} />
        </div>

        <div className="relative z-10 my-auto max-w-lg py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ffd84d]/30 bg-[#ffd84d]/10 px-3 py-1.5 text-xs font-bold text-[#ffd84d]">
            <Sparkles className="h-3.5 w-3.5" /> Akun BotakStore
          </span>
          <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight xl:text-5xl">
            Pantau joki MLBB kamu dalam satu akun.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/65 xl:text-base">
            Simpan pesanan, lihat progres pengerjaan, dan cek riwayat transaksi dengan lebih mudah.
          </p>
          <div className="mt-9 grid gap-3">
            <AuthBenefit icon={<Gamepad2 />} text="Pesanan Mobile Legends tersimpan rapi" />
            <AuthBenefit icon={<ShieldCheck />} text="Status dan progres dapat dipantau" />
            <AuthBenefit icon={<LockKeyhole />} text="Data akun dan transaksi tetap terkendali" />
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/35">© 2026 BotakStore</p>
      </section>

      <section className="flex min-h-screen flex-col">
        <header className="flex h-20 items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="lg:hidden">
            <Logo animated={false} />
          </div>
          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#59616b] transition hover:bg-white hover:text-[#17191d]"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 pb-14 sm:px-8">
          <div className="w-full max-w-[480px]">
            <div className="rounded-[1.75rem] border border-[#e4e7eb] bg-white p-5 shadow-[0_24px_70px_-40px_rgba(15,23,42,.35)] sm:p-8">
              {mode !== "forgot" ? (
                <div className="grid grid-cols-2 rounded-xl bg-[#f1f3f5] p-1">
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${mode === "login" ? "bg-white text-[#17191d] shadow-sm" : "text-[#737b85] hover:text-[#17191d]"}`}
                  >
                    Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${mode === "register" ? "bg-white text-[#17191d] shadow-sm" : "text-[#737b85] hover:text-[#17191d]"}`}
                  >
                    Daftar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#6e7680] hover:text-[#17191d]"
                >
                  <ArrowLeft className="h-4 w-4" /> Kembali ke login
                </button>
              )}

              <div className="mt-7">
                <p className="text-xs font-black uppercase tracking-[.18em] text-[#aa8300]">
                  {mode === "login"
                    ? "Selamat datang kembali"
                    : mode === "register"
                      ? "Buat akun pelanggan"
                      : "Pulihkan akun"}
                </p>
                <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                  {mode === "login"
                    ? "Masuk ke BotakStore"
                    : mode === "register"
                      ? "Daftar akun baru"
                      : "Lupa kata sandi?"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {mode === "login"
                    ? "Gunakan email dan kata sandi akunmu."
                    : mode === "register"
                      ? "Isi data berikut agar pesananmu mudah dipantau."
                      : "Masukkan email akun untuk menerima petunjuk pemulihan."}
                </p>
              </div>

              <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
                {mode === "register" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <AuthField label="Nama lengkap" icon={<UserRound />}>
                      <Input
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        autoComplete="name"
                        placeholder="Nama lengkap"
                        className="h-12 border-[#dce1e6] bg-[#fafbfc] pl-10"
                      />
                    </AuthField>
                    <AuthField label="Nomor WhatsApp" icon={<Gamepad2 />}>
                      <Input
                        value={form.phone}
                        onChange={(event) => setForm({ ...form, phone: event.target.value })}
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="08xxxxxxxxxx"
                        className="h-12 border-[#dce1e6] bg-[#fafbfc] pl-10"
                      />
                    </AuthField>
                  </div>
                )}

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

                {mode !== "forgot" && (
                  <AuthField label="Kata sandi" icon={<LockKeyhole />}>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      placeholder="Minimal 8 karakter"
                      className="h-12 border-[#dce1e6] bg-[#fafbfc] px-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8b939d] hover:text-[#17191d]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </AuthField>
                )}

                {mode === "register" && (
                  <AuthField label="Konfirmasi kata sandi" icon={<LockKeyhole />}>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(event) =>
                        setForm({ ...form, confirmPassword: event.target.value })
                      }
                      autoComplete="new-password"
                      placeholder="Ulangi kata sandi"
                      className="h-12 border-[#dce1e6] bg-[#fafbfc] pl-10"
                    />
                  </AuthField>
                )}

                {mode === "login" && (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <label className="flex items-center gap-2 text-[#68717d]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[#cfd5db] accent-[#e5b900]"
                      />
                      Ingat saya
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="font-bold text-[#9a7600] hover:text-[#17191d]"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>
                )}

                {error && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700"
                  >
                    {error}
                  </p>
                )}
                {message && (
                  <p
                    role="status"
                    className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-700"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0" /> {message}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="h-12 w-full bg-[#ffd84d] font-black text-[#17191d] shadow-[0_10px_25px_rgba(225,177,0,.2)] hover:bg-[#ffca24]"
                >
                  {submitting
                    ? "Memproses..."
                    : mode === "login"
                      ? "Masuk"
                      : mode === "register"
                        ? "Buat akun"
                        : "Kirim petunjuk"}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>

              {mode === "login" && (
                <div className="mt-5 rounded-xl border border-[#f0dc91] bg-[#fff9e5] p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-[#594700]">Coba akun demo pelanggan</p>
                      <p className="mt-1 text-[11px] leading-5 text-[#806b21]">
                        customer@botakstore.demo · botak123
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={useDemoAccount}
                      className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-black text-[#856600] shadow-sm transition hover:bg-[#ffd84d] hover:text-[#17191d]"
                    >
                      Gunakan
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="mt-5 px-4 text-center text-xs leading-5 text-[#858d97]">
              Dengan masuk atau mendaftar, kamu menyetujui ketentuan dan kebijakan layanan
              BotakStore.
            </p>
          </div>
        </div>
      </section>
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

function AuthBenefit({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-white/80">
      <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#ffd84d]/25 bg-[#ffd84d]/10 text-[#ffd84d] [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      {text}
    </div>
  );
}
