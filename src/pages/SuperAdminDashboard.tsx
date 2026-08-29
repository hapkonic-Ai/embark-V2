import { BadgeCheck, Loader2, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import DashboardShell from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatINR } from "@/lib/format";

export default function SuperAdminDashboard() {
  return (
    <DashboardShell
      title="Superadmin control room 👑"
      subtitle="Validate mentors, manage roles, keep the site honest."
      roles={["superadmin"]}
      tabs={[
        { id: "mentors", label: "Verify Mentors", icon: BadgeCheck },
        { id: "users", label: "All Users", icon: Users },
      ]}
    >
      {(tab) => (tab === "mentors" ? <MentorsTab /> : <UsersTab />)}
    </DashboardShell>
  );
}

function MentorsTab() {
  const { data, isLoading } = trpc.admin.listMentorProfiles.useQuery();
  const utils = trpc.useUtils();
  const verify = trpc.admin.verifyMentor.useMutation({
    onSuccess: () => {
      toast.success("Updated");
      utils.admin.listMentorProfiles.invalidate();
      // The affected expert's dashboard reads verification from expert.me/myProfile.
      utils.expert.me.invalidate();
      utils.expert.myProfile.invalidate();
      utils.expertPage.myPage.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;
  return (
    <div className="space-y-4">
      {data?.map(({ profile: p, name, email }) => (
        <div key={p.id} className="rounded-3xl border bg-card p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-semibold flex items-center gap-2">
              {name}
              {p.isVerified && <ShieldCheck className="h-4 w-4 text-green-600" />}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {email} · {p.bschool ?? "no school"} · {p.company ?? "no company"} · {formatINR(p.price)} · {p.mockGds} GD / {p.mockPis} PI
            </p>
            <p className="text-xs text-muted-foreground">{p.headline ?? "—"}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={p.isVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
              {p.isVerified ? "Verified" : "Pending"}
            </Badge>
            <Switch
              checked={p.isVerified}
              disabled={verify.isPending}
              onCheckedChange={(v) => verify.mutate({ profileId: p.id, verified: v })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const { data, isLoading } = trpc.admin.listUsers.useQuery();
  const utils = trpc.useUtils();
  const setRole = trpc.admin.setUserRole.useMutation({
    onSuccess: () => { toast.success("Role updated"); utils.admin.listUsers.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const toggle = trpc.admin.toggleUserActive.useMutation({
    onSuccess: () => { toast.success("Updated"); utils.admin.listUsers.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;
  return (
    <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
      {(setRole.isPending || toggle.isPending) && (
        <div className="px-5 py-2 text-xs text-muted-foreground flex items-center gap-2 border-b">
          <Loader2 className="h-3 w-3 animate-spin" /> Saving…
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-3.5">User</th>
            <th className="px-4 py-3.5">Role</th>
            <th className="px-4 py-3.5">Active</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((u) => (
            <tr key={u.id} className="border-b last:border-0">
              <td className="px-5 py-3">
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </td>
              <td className="px-4 py-3">
                <Select value={u.role} onValueChange={(v) => setRole.mutate({ userId: u.id, role: v as never })}>
                  <SelectTrigger className="h-8 w-36 rounded-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="candidate">candidate</SelectItem>
                    <SelectItem value="mentor">mentor</SelectItem>
                    <SelectItem value="admin">admin</SelectItem>
                    <SelectItem value="superadmin">superadmin</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="px-4 py-3">
                <Switch
                  checked={u.isActive}
                  onCheckedChange={(v) => toggle.mutate({ userId: u.id, isActive: v })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
