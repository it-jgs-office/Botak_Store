import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/bs/PublicLayout";
import { useSession } from "@/components/bs/ui";
import { loginAs, logout } from "@/lib/actions";

export const Route = createFileRoute("/botakstore-admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Login — BotakStore" },
      { name: "description", content: "Login khusus pengelola BotakStore." },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    if (session?.role === "admin") navigate({ to: "/botakstore-admin", replace: true });
  }, [navigate, session]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const result = loginAs(form.email.trim().toLowerCase(), form.password);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    if (result.data !== "admin") {
      logout();
      setError("Akun ini tidak memiliki akses admin.");
      setSubmitting(false);
      return;
    }
    navigate({ to: "/botakstore-admin" });
  };

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#080b12] text-white">
      <div className="pointer-events-none absolute -left-24 top-[-8rem] h-80 w-80 rounded-full bg-[#ffd84d]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-[-5rem] h-96 w-96 rounded-full bg-[#3759d7]/15 blur-3xl" />

      <div className="relative z-10 flex w-full flex-col">
        <header className="flex h-16 items-center justify-between px-4 sm:h-20 sm:px-8">
          <Logo animated={false} />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold text-white/60 transition hover:bg-white/5 hover:text-white sm:px-3 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Beranda
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-3 pb-10 sm:px-5">
          <div className="w-full max-w-[430px]">
            <div className="rounded-[1.5rem] border border-white/10 bg-[#111722]/95 p-5 shadow-[0_30px_100px_-35px_rgba(0,0,0,.85)] backdrop-blur sm:rounded-[2rem] sm:p-8">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#ffd84d]/25 bg-[#ffd84d]/10 text-[#ffd84d] sm:h-12 sm:w-12">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <p className="mt-5 text-[11px] font-black uppercase tracking-[.22em] text-[#ffd84d]">
                Portal pengelola
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Masuk Admin</h1>
              <p className="mt-2 text-sm leading-6 text-white/55">
                Kelola operasional, katalog, pesanan, dan pelanggan BotakStore.
              </p>

              <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-white/75">Email admin</span>
                  <span className="relative block">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      autoComplete="email"
                      placeholder="admin@botakstore.id"
                      className="h-12 border-white/10 bg-white/[.06] pl-10 text-white placeholder:text-white/25 focus-visible:ring-[#ffd84d]"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-white/75">Kata sandi</span>
                  <span className="relative block">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      autoComplete="current-password"
                      placeholder="Masukkan kata sandi"
                      className="h-12 border-white/10 bg-white/[.06] px-10 text-white placeholder:text-white/25 focus-visible:ring-[#ffd84d]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/40 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>

                {error && (
                  <p role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 px-3.5 py-3 text-sm font-semibold text-red-300">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="h-12 w-full bg-[#ffd84d] font-black text-[#101419] hover:bg-[#ffca24]"
                >
                  {submitting ? "Memeriksa akun..." : "Masuk ke dashboard"}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>

              <div className="mt-5 rounded-xl border border-white/[.07] bg-white/[.035] px-3.5 py-3 text-xs leading-5 text-white/45">
                <p className="font-bold text-white/70">Akun admin prototype</p>
                <p>admin@botakstore.id · botakstore26!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
