import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Plus, RotateCcw, ShieldAlert, ShieldCheck, Trash2, UserPlus, Clock, Save } from "lucide-react";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
            <h1 className="font-display text-2xl font-semibold text-foreground">Users &amp; Roles</h1>
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
  const isSelf = u.id === user?.id;
  const isAdminRow = u.role === "admin";
  const displayName = u.name || u.email.split('@')[0];
  const displayCode = u.id.split('-')[0].toUpperCase();
  const basePerms = u.permissions || defaultPermissionsFor(u.role);

  const [draftPerms, setDraftPerms] = useState<any>(() => basePerms);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!hasChanges) {
      setDraftPerms(u.permissions || defaultPermissionsFor(u.role));
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
    savePermissionsMutation?.mutate(
      { userId: u.id, permissions: draftPerms },
      {
        onSuccess: () => {
          setHasChanges(false);
        }
      }
    );
  };

  const handleCancelChanges = () => {
    setDraftPerms(u.permissions || defaultPermissionsFor(u.role));
    setHasChanges(false);
  };

  return (
    <div key={u.id} className="rounded-lg border border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary uppercase">
            {displayName.substring(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{displayName}</p>
              {isSelf && <Badge variant="secondary" className="text-[10px]">You</Badge>}
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
              {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Section</th>
                <th className="px-4 py-2.5 text-center align-middle font-semibold w-28">View</th>
                <th className="px-4 py-2.5 text-center align-middle font-semibold w-28">Data Entry</th>
                <th className="px-4 py-2.5 text-center align-middle font-semibold w-28">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SECTIONS.map((s) => {
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
      )}
    </div>
  );
}

function PendingInvitesDialog({ pendingUsers }: { pendingUsers: any[] }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const removeUserMutation = useMutation({
    mutationFn: async (id: string) => {
      // Use the edge function to completely delete them from Supabase auth as well as user_roles
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="mr-1 h-4 w-4 text-orange-500" />
          Pending Invites ({pendingUsers.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" /> Pending Invites
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {pendingUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No pending invites.</p>
          ) : (
            pendingUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg border-dashed bg-muted/30">
                <div>
                  <p className="font-medium text-sm">{u.name || u.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">Pending</Badge>
                  <Button size="icon" variant="ghost" onClick={() => removeUserMutation.mutate(u.id)} disabled={removeUserMutation.isPending} className="h-7 w-7 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
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
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="management">Management</SelectItem>
                <SelectItem value="chief_coordinator">Chief-Coordinator</SelectItem>
                <SelectItem value="academic_coordinator">Academic Coordinator</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
