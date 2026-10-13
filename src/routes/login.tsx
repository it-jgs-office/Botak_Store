import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/bs/PublicLayout";
import { useSession } from "@/components/bs/ui";
import { loginAs } from "@/lib/actions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk — BotakStore" },
      {
        name: "description",
        content:
          "Masuk ke akun BotakStore untuk melihat dan mengelola pesanan joki Mobile Legends.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    if (session) navigate({ to: "/profil", replace: true });
  }, [navigate, session]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const email = form.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    if (form.password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }

    setSubmitting(true);
    const result = loginAs(email, form.password);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    navigate({ to: "/profil" });
  };

  const loginDemo = () => {
    setError("");
    setSubmitting(true);
    const result = loginAs("customer@botakstore.demo", "botak123");
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    navigate({ to: "/profil" });
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#f5f6f8]">
      <header className="flex h-14 items-center justify-between px-3 sm:h-20 sm:px-8">
        <Logo animated={false} />
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#59616b] transition hover:bg-white hover:text-[#17191d] sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-3 pb-8 sm:px-4 sm:pb-14">
        <div className="w-full max-w-[420px]">
          <div className="rounded-2xl border border-[#e4e7eb] bg-white p-5 shadow-[0_24px_70px_-40px_rgba(15,23,42,.35)] sm:rounded-[1.75rem] sm:p-8">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#aa8300]">
              Selamat datang kembali
            </p>
            <h1 className="mt-2 text-xl font-black sm:text-3xl">Masuk ke BotakStore</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Gunakan email dan kata sandi akunmu.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-3.5 sm:mt-7 sm:space-y-4" noValidate>
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

              <AuthField label="Kata sandi" icon={<LockKeyhole />}>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  autoComplete="current-password"
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

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="h-12 w-full bg-[#ffd84d] font-black text-[#17191d] shadow-[0_10px_25px_rgba(225,177,0,.2)] hover:bg-[#ffca24]"
              >
                {submitting ? "Memproses..." : "Masuk"}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </Button>

              <div className="flex items-center gap-3 text-xs font-semibold text-[#9aa2ab]">
                <span className="h-px flex-1 bg-[#e4e7eb]" />
                atau
                <span className="h-px flex-1 bg-[#e4e7eb]" />
              </div>

              <Button
                type="button"
                size="lg"
                variant="outline"
                disabled={submitting}
                onClick={loginDemo}
                className="h-12 w-full border-[#f0dc91] bg-[#fff9e5] font-black text-[#856600] hover:bg-[#ffd84d] hover:text-[#17191d]"
              >
                <UserRound className="h-4 w-4" /> Masuk sebagai Demo
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-[#6f7781]">
              Belum punya akun?{" "}
              <Link to="/daftar" className="font-black text-[#8a6800] hover:text-[#17191d]">
                Daftar sekarang
              </Link>
            </p>
          </div>

          <p className="mt-5 px-4 text-center text-xs leading-5 text-[#858d97]">
            Dengan masuk, kamu menyetujui ketentuan dan kebijakan layanan BotakStore.
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
