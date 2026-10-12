import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Gamepad2, LogOut, PackageCheck, ReceiptText, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { Field, useHydrated, useSession } from "@/components/bs/ui";
import { logout, updateProfile } from "@/lib/actions";
import { useDB } from "@/lib/store";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil Saya — BotakStore" },
      { name: "description", content: "Lihat dan kelola profil akun BotakStore kamu." },
    ],
  }),
  component: ProfilPage,
});

function ProfilPage() {
  const db = useDB();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const { session, user } = useSession();
  const [form, setForm] = useState({ name: "", phone: "" });

  useEffect(() => {
    if (hydrated && !session) navigate({ to: "/login", replace: true });
  }, [hydrated, navigate, session]);

  useEffect(() => {
    if (user) setForm({ name: user.name, phone: user.phone ?? "" });
  }, [user]);

  if (!hydrated || !session || !user) {
    return <div className="min-h-screen bg-background" />;
  }

  const orders = db.orders.filter((order) => order.customerId === session.userId);

  const save = () => {
    if (form.name.trim().length < 3) {
      toast.error("Nama minimal 3 karakter.");
      return;
    }
    if (form.phone && !/^08\d{8,13}$/.test(form.phone.replace(/\s/g, "")))
      {
        toast.error("Nomor WhatsApp tidak valid.");
        return;
      }
    updateProfile(user.id, { name: form.name.trim(), phone: form.phone.replace(/\s/g, "") });
    toast.success("Profil berhasil diperbarui.");
  };

  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:py-12">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#151a20] text-2xl font-black text-[#ffd84d]">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#9a7600]">Profil saya</p>
              <h1 className="mt-1 text-3xl font-black">{user.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
          >
            <LogOut /> Keluar
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <ProfilStat icon={<ReceiptText />} label="Total pesanan" value={String(orders.length)} />
          <ProfilStat
            icon={<Gamepad2 />}
            label="Sedang diproses"
            value={String(orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length)}
          />
          <ProfilStat
            icon={<PackageCheck />}
            label="Pesanan selesai"
            value={String(orders.filter((o) => o.status === "completed").length)}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="h-fit rounded-2xl border border-border bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-xl font-black">Edit profil</h2>
            <p className="mt-1 text-sm text-muted-foreground">Perbarui nama dan nomor WhatsApp kamu.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Nama lengkap">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap" />
              </Field>
              <Field label="Nomor WhatsApp">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
              </Field>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="button" onClick={save} className="text-[#17191d]">
                <Save /> Simpan perubahan
              </Button>
              <Button asChild variant="outline">
                <Link to="/dashboard">
                  Lihat dashboard <ArrowRight />
                </Link>
              </Button>
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-border bg-white p-5 shadow-card sm:p-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff2b8] text-[#8a6900]">
              <UserRound className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-black">Informasi akun</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">Nama</dt>
                <dd className="mt-1 font-bold">{user.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">Email</dt>
                <dd className="mt-1 break-all font-bold">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">WhatsApp</dt>
                <dd className="mt-1 font-bold">{user.phone || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">Peran</dt>
                <dd className="mt-1 font-bold capitalize">{user.role}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
}

function ProfilStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-card">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff4c5] text-[#8b6900] [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>
      <div>
        <p className="text-2xl font-black">{value}</p>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
