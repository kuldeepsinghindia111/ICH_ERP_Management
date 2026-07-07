import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as cn, o as defaultPermissionsFor, r as SECTIONS, t as Button } from "./store-EDF2LSFL.mjs";
import { t as Input } from "./input-BU0X6Ms0.mjs";
import { t as supabase } from "./supabase-DbG7U5zh.mjs";
import { I as Clock, V as Check, _ as RotateCcw, a as UserPlus, b as Plus, d as ShieldCheck, f as ShieldAlert, l as Trash2, x as Pencil } from "../_libs/lucide-react.mjs";
import { n as CheckboxIndicator, t as Checkbox$1 } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DRkx8pOP.mjs";
import { t as Label } from "./label-CkcRkRu6.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, t as Card } from "./card-NxxrVLv_.mjs";
import { t as Badge } from "./badge-CgHxRd3k.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, s as DialogTrigger, t as Dialog } from "./dialog-Dr92FT6G.mjs";
import { n as useAuth } from "./use-auth-VzLo166S.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/users-3-dcBFTP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Checkbox = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox$1, {
	ref,
	className: cn("grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckboxIndicator, {
		className: cn("grid place-content-center text-current"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" })
	})
}));
Checkbox.displayName = Checkbox$1.displayName;
var ROLE_LABEL = {
	admin: "Admin",
	accountant: "Accountant",
	faculty: "Faculty",
	management: "Management"
};
function UsersPage() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const { data: currentUserRole } = useQuery({
		queryKey: ["userRole", user?.id],
		queryFn: async () => {
			if (!user) return null;
			const { data, error } = await supabase.from("user_roles").select("role").eq("id", user.id).single();
			if (error) throw error;
			return data.role;
		},
		enabled: !!user
	});
	const isAdmin = currentUserRole === "admin";
	const { data: users = [], isLoading } = useQuery({
		queryKey: ["users"],
		queryFn: async () => {
			const { data, error } = await supabase.from("user_roles").select("*").order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const updateUserMutation = useMutation({
		mutationFn: async ({ id, patch }) => {
			if (patch.role) patch.permissions = defaultPermissionsFor(patch.role);
			const { error } = await supabase.from("user_roles").update(patch).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("User updated successfully");
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
		onError: (err) => toast.error(err.message)
	});
	const removeUserMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("user_roles").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("User removed");
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
		onError: (err) => toast.error(err.message)
	});
	const setPermissionMutation = useMutation({
		mutationFn: async ({ userId, section, key, value }) => {
			const targetUser = users.find((u) => u.id === userId);
			if (!targetUser) throw new Error("User not found");
			const currentPerms = targetUser.permissions || defaultPermissionsFor(targetUser.role);
			const newPerms = {
				...currentPerms,
				[section]: {
					...currentPerms[section],
					[key]: value
				}
			};
			const { error } = await supabase.from("user_roles").update({ permissions: newPerms }).eq("id", userId);
			if (error) throw error;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
		onError: (err) => toast.error(err.message)
	});
	const resetPermissionsMutation = useMutation({
		mutationFn: async ({ userId, role }) => {
			const { error } = await supabase.from("user_roles").update({ permissions: defaultPermissionsFor(role) }).eq("id", userId);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Permissions reset to defaults");
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
		onError: (err) => toast.error(err.message)
	});
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-8 text-center",
		children: "Loading users..."
	});
	if (!isAdmin) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl px-6 py-16 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "mx-auto h-8 w-8 text-warning" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-3 font-display text-xl",
				children: "Admins only"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Only Administrators can manage user roles and invitations."
			})
		]
	});
	const pendingUsers = users.filter((u) => u.status === "pending");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl space-y-6 px-6 py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex flex-wrap items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-5 w-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-widest text-muted-foreground",
					children: "Access control"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-semibold text-foreground",
					children: "Users & Roles"
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [pendingUsers.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PendingInvitesDialog, { pendingUsers }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddUserDialog, {})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
			className: "font-display text-lg",
			children: "Accounts"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: "Every user has a unique ID. Admins have full access. Accountant & Faculty defaults can be fine-tuned per section below."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
			className: "space-y-6",
			children: users.filter((u) => u.status === "active").map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRow, {
				u,
				user,
				updateUserMutation,
				resetPermissionsMutation,
				removeUserMutation,
				setPermissionMutation
			}, u.id))
		})] })]
	});
}
function UserRow({ u, user, updateUserMutation, resetPermissionsMutation, removeUserMutation, setPermissionMutation }) {
	const [showPermissions, setShowPermissions] = (0, import_react.useState)(false);
	const isSelf = u.id === user?.id;
	const isAdminRow = u.role === "admin";
	const displayName = u.name || u.email.split("@")[0];
	const displayCode = u.id.split("-")[0].toUpperCase();
	const userPerms = u.permissions || defaultPermissionsFor(u.role);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center justify-between gap-3 border-b border-border p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary uppercase",
					children: displayName.substring(0, 2)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: displayName
					}), isSelf && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "secondary",
						className: "text-[10px]",
						children: "You"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono",
						children: displayCode
					}), u.email ? ` · ${u.email}` : ""]
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: u.role,
						onValueChange: (v) => updateUserMutation.mutate({
							id: u.id,
							patch: { role: v }
						}),
						disabled: isSelf || updateUserMutation.isPending,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "w-[130px] text-xs h-8",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: Object.keys(ROLE_LABEL).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: r,
							children: ROLE_LABEL[r]
						}, r)) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditUserDialog, {
						user: u,
						onSave: (patch) => updateUserMutation.mutate({
							id: u.id,
							patch
						}),
						isPending: updateUserMutation.isPending,
						onDelete: () => {
							if (confirm("Are you sure you want to remove this user?")) removeUserMutation.mutate(u.id);
						},
						isDeleting: removeUserMutation.isPending,
						canDelete: !isSelf && !isAdminRow
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: () => resetPermissionsMutation.mutate({
							userId: u.id,
							role: u.role
						}),
						disabled: isAdminRow || resetPermissionsMutation.isPending,
						title: "Reset to role defaults",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "h-4 w-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						onClick: () => setShowPermissions(!showPermissions),
						title: "Toggle permissions",
						className: "ml-2",
						children: showPermissions ? "Hide Permissions" : "View Permissions"
					})
				]
			})]
		}), showPermissions && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-x-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-left",
							children: "Section"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-center w-24",
							children: "View"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-center w-24",
							children: "Edit / Data Entry"
						})
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
					className: "divide-y divide-border",
					children: SECTIONS.map((s) => {
						const perm = isAdminRow ? {
							view: true,
							edit: true
						} : userPerms[s.key] || {
							view: false,
							edit: false
						};
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: s.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 text-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
									checked: perm.view,
									disabled: isAdminRow || setPermissionMutation.isPending,
									onCheckedChange: (v) => setPermissionMutation.mutate({
										userId: u.id,
										section: s.key,
										key: "view",
										value: !!v
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 text-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
									checked: perm.edit,
									disabled: isAdminRow || !perm.view || setPermissionMutation.isPending,
									onCheckedChange: (v) => setPermissionMutation.mutate({
										userId: u.id,
										section: s.key,
										key: "edit",
										value: !!v
									})
								})
							})
						] }, s.key);
					})
				})]
			})
		})]
	}, u.id);
}
function PendingInvitesDialog({ pendingUsers }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const queryClient = useQueryClient();
	const removeUserMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("user_roles").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Invite canceled");
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
		onError: (err) => toast.error(err.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				size: "sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "mr-1 h-4 w-4 text-orange-500" }),
					"Pending Invites (",
					pendingUsers.length,
					")"
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
				className: "font-display flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "w-5 h-5 text-orange-500" }), " Pending Invites"]
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-4 max-h-[60vh] overflow-y-auto pr-2",
				children: pendingUsers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground text-center py-4",
					children: "No pending invites."
				}) : pendingUsers.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between p-3 border rounded-lg border-dashed bg-muted/30",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium text-sm",
						children: u.name || u.email
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground capitalize",
						children: u.role
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: "bg-orange-500/10 text-orange-500 border-orange-500/20",
							children: "Pending"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "icon",
							variant: "ghost",
							onClick: () => removeUserMutation.mutate(u.id),
							disabled: removeUserMutation.isPending,
							className: "h-7 w-7 text-destructive",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-4 h-4" })
						})]
					})]
				}, u.id))
			})]
		})]
	});
}
function AddUserDialog() {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [role, setRole] = (0, import_react.useState)("accountant");
	const { session } = useAuth();
	const queryClient = useQueryClient();
	const inviteMutation = useMutation({
		mutationFn: async () => {
			const { data, error } = await supabase.functions.invoke("invite-user", {
				body: {
					email: email.trim(),
					role,
					name: name.trim(),
					password
				},
				headers: { Authorization: `Bearer ${session?.access_token}` }
			});
			if (error) throw new Error(error.message || "Failed to send invite");
			if (data?.error) throw new Error(data.error);
			return data;
		},
		onSuccess: () => {
			toast.success(`User created: ${email}`);
			setOpen(false);
			setName("");
			setEmail("");
			setPassword("");
			setRole("accountant");
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
		onError: (err) => toast.error(err.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "mr-1 h-4 w-4" }), " Invite user"]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "font-display",
				children: "Invite a new user"
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Full name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: name,
						onChange: (e) => setName(e.target.value),
						placeholder: "e.g. Sunita Rao"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "email",
						value: email,
						onChange: (e) => setEmail(e.target.value),
						placeholder: "user@college.edu"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Role" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: role,
						onValueChange: (v) => setRole(v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "admin",
								children: "Admin"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "management",
								children: "Management"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "accountant",
								children: "Accountant"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "faculty",
								children: "Faculty"
							})
						] })]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Initial Password" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "text",
							value: password,
							onChange: (e) => setPassword(e.target.value),
							placeholder: "Minimum 6 characters"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[11px] text-muted-foreground",
							children: "Share this password with the user so they can log in."
						})
					] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				onClick: () => setOpen(false),
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				disabled: inviteMutation.isPending,
				onClick: () => {
					if (!name.trim()) return toast.error("Name is required");
					if (!email.trim()) return toast.error("Email is required");
					if (password.length < 6) return toast.error("Password must be at least 6 characters");
					inviteMutation.mutate();
				},
				children: inviteMutation.isPending ? "Creating..." : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " Create User"] })
			})] })
		] })]
	});
}
function EditUserDialog({ user, onSave, isPending, onDelete, isDeleting, canDelete }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [role, setRole] = (0, import_react.useState)("accountant");
	(0, import_react.useEffect)(() => {
		if (open && user) {
			setName(user.name || "");
			setEmail(user.email || "");
			setRole(user.role);
		}
	}, [open, user]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				title: "Edit user",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "font-display",
				children: "Edit user"
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Full name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: name,
						onChange: (e) => setName(e.target.value)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: email,
						onChange: (e) => setEmail(e.target.value),
						disabled: true,
						title: "Email cannot be changed"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Role" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: role,
							onValueChange: (v) => setRole(v),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "admin",
									children: "Admin"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "management",
									children: "Management"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "accountant",
									children: "Accountant"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "faculty",
									children: "Faculty"
								})
							] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[11px] text-muted-foreground",
							children: "Changing the role resets that user's permissions to the new role's defaults."
						})
					] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
				className: "sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "destructive",
					onClick: () => {
						onDelete();
						setOpen(false);
					},
					disabled: !canDelete || isDeleting,
					children: "Delete"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-end gap-2 mt-2 sm:mt-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => setOpen(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						disabled: isPending,
						onClick: () => {
							if (!name.trim()) return toast.error("Name is required");
							onSave({
								name: name.trim(),
								role
							});
							setOpen(false);
						},
						children: "Save changes"
					})]
				})]
			})
		] })]
	});
}
//#endregion
export { UsersPage as component };
