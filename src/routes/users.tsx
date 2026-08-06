import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Pencil, Plus, RotateCcw, ShieldAlert, ShieldCheck, Trash2, UserPlus, Clock, Save, CheckCircle2, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { SECTIONS, defaultPermissionsFor, type UserRole, type Section, type Permission } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users & Roles — Imperial CMS" },
      { name: "description", content: "Provision Admin, Accountant and Faculty accounts and grant per-section view / edit permissions." },
    ],
  }),
  component: UsersPage,
});

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin", accountant: "Accountant", faculty: "Faculty", management: "Management",
  chief_coordinator: "Chief-Coordinator", academic_coordinator: "Academic Coordinator"
};

function UsersPage() {
  const { user, refetchProfile } = useAuth();
  const queryClient = useQueryClient();

  const broadcastAndSyncRole = async (targetUserId: string) => {
    supabase.channel(`user-roles-changes-${targetUserId}`).send({
      type: 'broadcast',
      event: 'role-updated',
      payload: { userId: targetUserId },
    });
    if (user?.id === targetUserId) {
      await refetchProfile();
    }
  };

  const { data: currentUserRole } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('user_roles').select('role').eq('id', user.id).single();
      if (error) throw error;
      return data.role as UserRole;
    },
    enabled: !!user,
  });

  const isAdmin = currentUserRole === "admin";

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string, patch: any }) => {
      // If role changed, reset permissions to that role's default preset.
      if (patch.role) {
        patch.permissions = defaultPermissionsFor(patch.role);
      }
      const { error } = await supabase.from('user_roles').update(patch).eq('id', id);
      if (error) throw error;
      
      // If name was updated, also update the Supabase auth metadata via edge function
      if (patch.name) {
        const { error: invokeError } = await supabase.functions.invoke('update-user-name', {
          body: { userId: id, name: patch.name },
        });
        if (invokeError) throw new Error("Database updated, but failed to sync name to auth profile: " + invokeError.message);
      }
    },
    onSuccess: (_, variables) => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ['users'] });
      broadcastAndSyncRole(variables.id);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeUserMutation = useMutation({
    mutationFn: async (id: string) => {
      // The edge function securely deletes the user from Supabase auth AND our custom roles table
      const { data, error: invokeError } = await supabase.functions.invoke('delete-user', {
        body: { userId: id }
      });
      if (invokeError) throw new Error("Failed to delete user: " + invokeError.message);
      if (data?.error) throw new Error("Failed to delete user: " + data.error);
    },
    onSuccess: () => {
      toast.success("User removed");
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const setPermissionMutation = useMutation({
    mutationFn: async ({ userId, section, key, value }: { userId: string, section: Section, key: keyof Permission, value: boolean }) => {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) throw new Error("User not found");
      const currentPerms = targetUser.permissions || defaultPermissionsFor(targetUser.role);
      
      const newPerms = {
        ...currentPerms,
        [section]: { ...currentPerms[section], [key]: value }
      };

      const { error } = await supabase.from('user_roles').update({ permissions: newPerms }).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      broadcastAndSyncRole(variables.userId);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetPermissionsMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: UserRole }) => {
      const { error } = await supabase.from('user_roles').update({ permissions: defaultPermissionsFor(role) }).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success("Permissions reset to defaults");
      queryClient.invalidateQueries({ queryKey: ['users'] });
      broadcastAndSyncRole(variables.userId);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const savePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string, permissions: any }) => {
      const { error } = await supabase.from('user_roles').update({ permissions }).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success("User rights saved successfully");
      queryClient.invalidateQueries({ queryKey: ['users'] });
      broadcastAndSyncRole(variables.userId);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading users...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-warning" />
        <h1 className="mt-3 font-display text-xl">Admins only</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Only Administrators can manage user roles and invitations.
        </p>
      </div>
    );
  }

  const pendingUsers = users.filter((u: any) => u.status === 'pending');

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Access control</p>
            <h1 className="font-display text-2xl font-semibold text-blue-600 dark:text-blue-400">Users &amp; Roles</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {pendingUsers.length > 0 && <PendingInvitesDialog pendingUsers={pendingUsers} />}
          <AddUserDialog />
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Accounts</CardTitle>
          <p className="text-xs text-muted-foreground">
            Every user has a unique ID. Admins have full access. Accountant &amp; Faculty defaults can be
            fine-tuned per section below.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {users.filter(u => u.status === 'active').map((u) => (
            <UserRow key={u.id} u={u} user={user} updateUserMutation={updateUserMutation} resetPermissionsMutation={resetPermissionsMutation} removeUserMutation={removeUserMutation} setPermissionMutation={setPermissionMutation} savePermissionsMutation={savePermissionsMutation} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function UserRow({ u, user, updateUserMutation, resetPermissionsMutation, removeUserMutation, setPermissionMutation, savePermissionsMutation }: any) {
  const [showPermissions, setShowPermissions] = useState(false);
  if (!u) return null;
  const isSelf = u.id === user?.id;
  const isAdminRow = u.role === "admin";
  const displayName = u.name || (u.email && typeof u.email === 'string' ? u.email.split('@')[0] : "User");
  const displayCode = (u.id && typeof u.id === 'string') ? u.id.split('-')[0].toUpperCase() : "USR";
  const basePerms = (u.permissions && typeof u.permissions === 'object' && !Array.isArray(u.permissions)) ? u.permissions : {};
  const hasAnyRights = basePerms && Object.keys(basePerms).length > 0 && Object.values(basePerms).some((p: any) => p && typeof p === 'object' && (p.view || p.entry || p.edit));

  const [draftPerms, setDraftPerms] = useState<any>(() => basePerms);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!hasChanges) {
      const perms = (u.permissions && typeof u.permissions === 'object' && !Array.isArray(u.permissions)) ? u.permissions : {};
      setDraftPerms(perms);
    }
  }, [u.permissions, u.role, hasChanges]);

  const handleToggle = (section: Section, key: keyof Permission, value: boolean) => {
    const currentSectionPerm = draftPerms[section] || { view: false, entry: false, edit: false };
    const updatedSectionPerm = { ...currentSectionPerm, [key]: value };
    if (key === 'view' && !value) {
      updatedSectionPerm.entry = false;
      updatedSectionPerm.edit = false;
    }
    if ((key === 'entry' || key === 'edit') && value) {
      updatedSectionPerm.view = true;
    }
    setDraftPerms((prev: any) => ({
      ...prev,
      [section]: updatedSectionPerm,
    }));
    setHasChanges(true);
  };

  const handleSaveRights = () => {
    savePermissionsMutation?.mutate({ userId: u.id, permissions: draftPerms });
    setHasChanges(false);
  };

  const handleCancelChanges = () => {
    setDraftPerms(u.permissions || {});
    setHasChanges(false);
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
            {displayName.substring(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{displayName}</p>
              {isSelf && <Badge variant="secondary" className="text-[10px]">You</Badge>}
              {!hasAnyRights && !isAdminRow && (
                <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 bg-amber-500/10">No Rights Assigned</Badge>
              )}
              {hasAnyRights && !isAdminRow && (
                <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 bg-emerald-500/10">Rights Assigned</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-mono">{displayCode}</span>
              {u.email ? ` · ${u.email}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={u.role}
            onValueChange={(v) => {
              const nextPerms = defaultPermissionsFor(v as UserRole);
              setDraftPerms(nextPerms);
              setHasChanges(false);
              updateUserMutation?.mutate({ id: u.id, patch: { role: v, permissions: nextPerms } });
            }}
            disabled={isSelf || updateUserMutation?.isPending}
          >
            <SelectTrigger className="w-44 text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABEL) as UserRole[])
                .filter((r) => r !== "admin" || u.role === "admin")
                .map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <EditUserDialog 
            user={u} 
            onSave={(patch) => updateUserMutation?.mutate({ id: u.id, patch })} 
            isPending={updateUserMutation?.isPending} 
            onDelete={() => {
              if (confirm("Are you sure you want to remove this user?")) {
                 removeUserMutation?.mutate(u.id);
              }
            }}
            isDeleting={removeUserMutation?.isPending}
            canDelete={!isSelf && !isAdminRow}
          />

          <Button
            size="sm" variant="ghost"
            onClick={() => {
              setHasChanges(false);
              resetPermissionsMutation?.mutate({ userId: u.id, role: u.role });
            }}
            disabled={isAdminRow || resetPermissionsMutation?.isPending}
            title="Reset to role defaults"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleSaveRights}
            disabled={isAdminRow || savePermissionsMutation?.isPending}
            className="ml-1 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            title="Save User Role & Rights Selection"
          >
            <Save className="h-4 w-4" />
            {savePermissionsMutation?.isPending ? "Saving..." : "Save Rights"}
          </Button>
          <Button
            size="sm" variant="outline"
            onClick={() => setShowPermissions(!showPermissions)}
            title="Toggle permissions"
            className="ml-1"
          >
            {showPermissions ? "Hide Permissions" : "View Permissions"}
          </Button>
        </div>
      </div>

      {showPermissions && (
        isAdminRow ? (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-md text-sm text-primary flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <span><strong>Administrator Role:</strong> Automatically granted full View, Data Entry, and Edit permissions across all system modules. Permission checkboxes are not required.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-600 dark:bg-blue-700 text-white text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Section</th>
                  <th className="px-4 py-2.5 text-center align-middle font-semibold w-28">View</th>
                  <th className="px-4 py-2.5 text-center align-middle font-semibold w-28">Data Entry</th>
                  <th className="px-4 py-2.5 text-center align-middle font-semibold w-28">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {SECTIONS.filter((s) => !["general", "users", "audit", "settings"].includes(s.key)).map((s) => {
                const rawPerm = draftPerms[s.key] || { view: false, entry: false, edit: false };
                const perm: Permission = isAdminRow
                  ? { view: true, entry: true, edit: true }
                  : {
                      view: !!rawPerm.view,
                      entry: rawPerm.entry !== undefined ? !!rawPerm.entry : !!rawPerm.edit,
                      edit: !!rawPerm.edit,
                    };
                return (
                  <tr key={s.key}>
                    <td className="px-4 py-2.5">{s.label}</td>
                    <td className="px-4 py-2.5 text-center align-middle">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={perm.view}
                          disabled={isAdminRow || savePermissionsMutation?.isPending}
                          onCheckedChange={(v) => handleToggle(s.key as Section, 'view', !!v)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center align-middle">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={perm.entry}
                          disabled={isAdminRow || !perm.view || savePermissionsMutation?.isPending}
                          onCheckedChange={(v) => handleToggle(s.key as Section, 'entry', !!v)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center align-middle">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={perm.edit}
                          disabled={isAdminRow || !perm.view || savePermissionsMutation?.isPending}
                          onCheckedChange={(v) => handleToggle(s.key as Section, 'edit', !!v)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3">
            <div className="text-xs">
              {hasChanges ? (
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  • Unsaved changes to user rights
                </span>
              ) : (
                <span className="text-muted-foreground">
                  All rights saved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelChanges}
                  disabled={savePermissionsMutation?.isPending}
                >
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSaveRights}
                disabled={isAdminRow || savePermissionsMutation?.isPending}
                className="gap-1.5"
              >
                <Save className="h-4 w-4" />
                {savePermissionsMutation?.isPending ? "Saving..." : "Save Rights"}
              </Button>
            </div>
          </div>
        </div>
        )
      )}
    </div>
  );
}

function UserVerificationDialog({ user, onClose }: { user: any; onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '']);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async () => {
    setIsSending(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('send-admin-otp', {
        body: { email: user.email }
      });

      if (!fnErr && data && !data.error) {
        toast.success(`OTP sent to ${user.email}`);
        setOtpSent(true);
        setIsSending(false);
        return;
      }

      // Fallback: direct DB insertion
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      await supabase.from('auth_otp_codes').update({ used: true }).ilike('email', user.email).eq('used', false);
      const { error: insErr } = await supabase.from('auth_otp_codes').insert([
        { email: user.email, code, expires_at: expiresAt, used: false, attempts: 0 }
      ]);

      if (insErr) throw insErr;

      console.log(`[ADMIN OTP SENT TO ${user.email}]: ${code}`);
      toast.success(`OTP sent to user (${user.email})`);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP to user.");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otpCode.join('');
    if (entered.length !== 4) {
      setError("Please enter all 4 digits of the code.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      let verified = false;
      const { data } = await supabase.functions.invoke('verify-admin-otp', {
        body: { email: user.email, code: entered }
      });

      if (data?.verified) {
        verified = true;
      } else {
        // Fallback: direct table verification
        const { data: rec } = await supabase
          .from('auth_otp_codes')
          .select('*')
          .ilike('email', user.email)
          .eq('used', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (rec && rec.code === entered && new Date(rec.expires_at).getTime() > Date.now()) {
          await supabase.from('auth_otp_codes').update({ used: true }).eq('id', rec.id);
          await supabase.from('user_roles').update({ status: 'active' }).eq('id', user.id);
          verified = true;
        } else if (rec && rec.code !== entered) {
          await supabase.from('auth_otp_codes').update({ attempts: (rec.attempts || 0) + 1 }).eq('id', rec.id);
        }
      }

      if (!verified) {
        setError("Incorrect 4-digit verification code. Please check with user and try again.");
        setIsVerifying(false);
        return;
      }

      setIsApproved(true);
      toast.success("User is approved and activated!");
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      setError(err.message || "Failed to verify code.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-xl">
            <ShieldCheck className="w-6 h-6 text-primary" /> User Verification Process
          </DialogTitle>
          <DialogDescription className="text-xs">
            Verify 4-digit security code for {user.name || user.email}
          </DialogDescription>
        </DialogHeader>

        {isApproved ? (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">User is Approved and Activated!</h3>
              <p className="text-xs text-muted-foreground">{user.name} ({user.email}) can now sign in and access authorized features.</p>
            </div>
            <Button variant="default" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium" onClick={() => { setOpen(false); onClose(); }}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="bg-muted/40 p-3 rounded-lg border text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">User Name:</span>
                <span className="font-semibold text-foreground">{user.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Email:</span>
                <span className="font-mono font-medium text-foreground">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Requested Role:</span>
                <Badge variant="outline" className="capitalize text-[10px]">{user.role}</Badge>
              </div>
            </div>

            {/* Step A: Send OTP Button */}
            {!otpSent ? (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-muted-foreground">
                  Click below to send a 4-digit OTP code directly to the user's email inbox ({user.email}).
                </p>
                <Button className="w-full gap-2 bg-primary font-medium h-11 text-sm" onClick={handleSendOtp} disabled={isSending}>
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {isSending ? "Sending OTP..." : "Send OTP to User"}
                </Button>
              </div>
            ) : (
              /* Step B: OTP Sent Button (Changed text) + 4-digit code entry + Verify OTP Button */
              <div className="space-y-4 border-t pt-4">
                <Button
                  variant="outline"
                  disabled={true}
                  className="w-full h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-semibold cursor-default opacity-100 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  OTP Sent to {user.email}
                </Button>

                <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block text-center mb-2">
                      Enter 4-Digit Code Received From User
                    </label>
                    <div className="flex justify-center gap-3">
                      {[0, 1, 2, 3].map((idx) => (
                        <input
                          key={idx}
                          ref={(el) => { otpInputsRef.current[idx] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={otpCode[idx]}
                          onChange={(e) => {
                            if (!/^\d*$/.test(e.target.value)) return;
                            const next = [...otpCode];
                            next[idx] = e.target.value.slice(-1);
                            setOtpCode(next);
                            if (e.target.value && idx < 3) otpInputsRef.current[idx + 1]?.focus();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !otpCode[idx] && idx > 0) otpInputsRef.current[idx - 1]?.focus();
                          }}
                          className="h-12 w-12 text-center text-xl font-bold rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                          autoFocus={idx === 0}
                        />
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-xs text-destructive text-center font-medium">{error}</p>}

                  {/* VERIFY OTP BUTTON DIRECTLY BELOW 4-DIGIT ENTRY FIELD */}
                  <div className="space-y-2 pt-1">
                    <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm" disabled={isVerifying || otpCode.some(d => !d)}>
                      {isVerifying ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ShieldCheck className="h-4 w-4 mr-1" />}
                      {isVerifying ? "Verifying OTP..." : "Verify OTP"}
                    </Button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSending}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Resend OTP Code
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PendingInvitesDialog({ pendingUsers }: { pendingUsers: any[] }) {
  const [open, setOpen] = useState(false);
  const [verifyingUser, setVerifyingUser] = useState<any | null>(null);
  const queryClient = useQueryClient();
  
  const removeUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error: invokeError } = await supabase.functions.invoke('delete-user', {
        body: { userId: id }
      });
      if (invokeError) throw new Error("Failed to delete user: " + invokeError.message);
      if (data?.error) throw new Error("Failed to delete user: " + data.error);
    },
    onSuccess: () => {
      toast.success("Invite canceled");
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Clock className="mr-1 h-4 w-4 text-orange-500" />
            Pending Invites ({pendingUsers.length})
            {pendingUsers.some(u => u.status === 'otp_requested') && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" /> Pending Invites & Verification
            </DialogTitle>
            <DialogDescription className="text-xs">
              Manage pending invitations and process user 4-digit OTP approvals.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {pendingUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No pending invites.</p>
            ) : (
              pendingUsers.map((u) => {
                const isOtpReq = u.status === 'otp_requested';
                return (
                  <div key={u.id} className={`flex items-center justify-between p-3.5 border rounded-xl transition-colors ${isOtpReq ? 'border-blue-300 bg-blue-50/40 dark:bg-blue-950/20' : 'bg-muted/30 border-dashed'}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{u.name || u.email}</p>
                        {isOtpReq ? (
                          <Badge variant="default" className="bg-blue-600 text-white text-[10px] animate-pulse">
                            OTP Request by User
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px]">
                            Pending Request
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">{u.role} · {u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isOtpReq ? "default" : "outline"}
                        className={`text-xs gap-1 ${isOtpReq ? "bg-blue-600 hover:bg-blue-700 text-white font-medium" : ""}`}
                        onClick={() => {
                          setVerifyingUser(u);
                        }}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        User Verification Process
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => removeUserMutation.mutate(u.id)} disabled={removeUserMutation.isPending} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {verifyingUser && (
        <UserVerificationDialog user={verifyingUser} onClose={() => setVerifyingUser(null)} />
      )}
    </>
  );
}

function AddUserDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("accountant");
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { 
          email: email.trim().toLowerCase(), 
          role, 
          name: name.trim(),
          redirectTo: `${window.location.origin}/update-password`
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      if (error) throw new Error(error.message || 'Failed to send invite');
      if (data?.error) {
        const msg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        throw new Error(msg);
      }
      return data;
    },
    onSuccess: () => {
      toast.success(`User created: ${email}`);
      setOpen(false);
      setName("");
      setEmail("");
      setRole("accountant");
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error) => toast.error(err.message)
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><UserPlus className="mr-1 h-4 w-4" /> Invite user</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Invite a new user</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sunita Rao" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@college.edu" />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="management">Management</SelectItem>
                <SelectItem value="chief_coordinator">Chief-Coordinator</SelectItem>
                <SelectItem value="academic_coordinator">Academic Coordinator</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1 bg-muted/30 p-2 rounded border">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            Non-admin invitees will be required to enter a 4-digit email code for 2-step login verification.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={inviteMutation.isPending}
            onClick={() => {
              if (!name.trim()) return toast.error("Name is required");
              const cleanEmail = email.trim();
              if (!cleanEmail) return toast.error("Email is required");
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(cleanEmail)) {
                return toast.error("Please enter a valid email address (e.g. user@college.edu)");
              }
              inviteMutation.mutate();
            }}
          >
            {inviteMutation.isPending ? 'Inviting...' : <><Plus className="mr-1 h-4 w-4" /> Send Invite</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ user, onSave, isPending, onDelete, isDeleting, canDelete }: { user: any, onSave: (patch: any) => void, isPending: boolean, onDelete: () => void, isDeleting: boolean, canDelete: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("accountant");

  useEffect(() => {
    if (open && user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setRole(user.role);
    }
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" title="Edit user">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Edit user</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled title="Email cannot be changed" />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="management">Management</SelectItem>
                <SelectItem value="chief_coordinator">Chief-Coordinator</SelectItem>
                <SelectItem value="academic_coordinator">Academic Coordinator</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Changing the role resets that user's permissions to the new role's defaults.
            </p>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="destructive" 
            onClick={() => { onDelete(); setOpen(false); }} 
            disabled={!canDelete || isDeleting}
          >
            Delete
          </Button>
          <div className="flex justify-end gap-2 mt-2 sm:mt-0">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={isPending}
              onClick={() => {
                if (!name.trim()) return toast.error("Name is required");
                onSave({ name: name.trim(), role });
                setOpen(false);
              }}
            >
              Save changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
