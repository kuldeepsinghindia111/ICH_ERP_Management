import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime, a as Overlay2, c as Title2, i as Description2, l as Trigger2, n as Cancel, o as Portal2, r as Content2, s as Root2, t as Action } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as buttonVariants, r as cn, t as Button } from "./button-PwNqyxv_.mjs";
import { t as Input } from "./input-uzm9g8Y7.mjs";
import { t as supabase } from "./supabase-DbG7U5zh.mjs";
import { n as useAuth } from "./use-auth-VzLo166S.mjs";
import { A as FileSpreadsheet, V as Check, f as ShieldAlert, h as ScrollText, l as Trash2, t as X } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DamjaduW.mjs";
import { t as Label } from "./label-BeT0bXvu.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, t as Card } from "./card-C5Nmk_bj.mjs";
import { t as Badge } from "./badge-B3f60TId.mjs";
import { t as StudentAutosuggest } from "./student-autosuggest-B8luhh8O.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/audit-CN6cH0HB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AlertDialog = Root2;
var AlertDialogTrigger = Trigger2;
var AlertDialogPortal = Portal2;
var AlertDialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay2, {
	className: cn("fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
AlertDialogOverlay.displayName = Overlay2.displayName;
var AlertDialogContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props
})] }));
AlertDialogContent.displayName = Content2.displayName;
var AlertDialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
AlertDialogHeader.displayName = "AlertDialogHeader";
var AlertDialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
AlertDialogFooter.displayName = "AlertDialogFooter";
var AlertDialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Title2, {
	ref,
	className: cn("text-lg font-semibold", className),
	...props
}));
AlertDialogTitle.displayName = Title2.displayName;
var AlertDialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Description2, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
AlertDialogDescription.displayName = Description2.displayName;
var AlertDialogAction = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Action, {
	ref,
	className: cn(buttonVariants(), className),
	...props
}));
AlertDialogAction.displayName = Action.displayName;
var AlertDialogCancel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cancel, {
	ref,
	className: cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className),
	...props
}));
AlertDialogCancel.displayName = Cancel.displayName;
var EVENT_LABEL = {
	"payment.collected": "Payment collected",
	"payment.voided": "Payment voided",
	"payment.unvoided": "Payment reinstated",
	"settings.updated": "Settings updated",
	"user.created": "User created",
	"user.updated": "User updated",
	"user.removed": "User removed",
	"permissions.updated": "Permissions updated"
};
var EVENT_TONE = {
	"payment.collected": "bg-success/15 text-success",
	"payment.voided": "bg-destructive/15 text-destructive",
	"payment.unvoided": "bg-warning/15 text-warning",
	"settings.updated": "bg-primary/15 text-primary",
	"user.created": "bg-success/15 text-success",
	"user.updated": "bg-primary/15 text-primary",
	"user.removed": "bg-destructive/15 text-destructive",
	"permissions.updated": "bg-warning/15 text-warning"
};
function AuditPage() {
	const { can, profile } = useAuth();
	const isAdmin = profile?.role === "admin";
	const canView = can("audit", "view");
	const queryClient = useQueryClient();
	const [event, setEvent] = (0, import_react.useState)("all");
	const [q, setQ] = (0, import_react.useState)("");
	const [debouncedQ, setDebouncedQ] = (0, import_react.useState)("");
	const [studentId, setStudentId] = (0, import_react.useState)(null);
	const [userId, setUserId] = (0, import_react.useState)("all");
	const [page, setPage] = (0, import_react.useState)(1);
	const { data: users = [] } = useQuery({
		queryKey: ["users"],
		queryFn: async () => {
			const { data } = await supabase.from("user_roles").select("*");
			return data || [];
		}
	});
	const PAGE_SIZE = 25;
	(0, import_react.useEffect)(() => {
		const t = setTimeout(() => setDebouncedQ(q), 180);
		return () => clearTimeout(t);
	}, [q]);
	(0, import_react.useEffect)(() => {
		setPage(1);
	}, [
		debouncedQ,
		event,
		userId,
		studentId
	]);
	const { data: { logs = [], total = 0 } = {}, isLoading } = useQuery({
		queryKey: [
			"auditLogs",
			page,
			debouncedQ,
			event,
			userId,
			studentId
		],
		queryFn: async () => {
			let query = supabase.from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false });
			if (event !== "all") query = query.eq("event", event);
			if (userId !== "all") query = query.eq("actor_user_id", userId);
			if (studentId) query = query.eq("student_id", studentId);
			if (debouncedQ) query = query.or(`summary.ilike.%${debouncedQ}%,actor_name.ilike.%${debouncedQ}%,actor_code.ilike.%${debouncedQ}%`);
			query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
			const { data, error, count } = await query;
			if (error) throw error;
			return {
				logs: data,
				total: count || 0
			};
		},
		enabled: canView
	});
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const rows = logs;
	const exportCsv = () => {
		if (rows.length === 0) return toast.error("No audit entries to export");
		const escape = (v) => /[",\n]/.test(v) ? `"${v.replace(/"/g, "\"\"")}"` : v;
		const header = [
			"Timestamp",
			"User ID",
			"User",
			"Role",
			"Event",
			"Summary"
		];
		const lines = rows.map((l) => [
			new Date(l.created_at).toISOString(),
			l.actor_code ?? "",
			l.actor_name ?? l.actor_role,
			l.actor_role,
			EVENT_LABEL[l.event],
			l.summary
		].map(escape).join(","));
		const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `audit-log-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
		toast.success(`Exported ${rows.length} entries`);
	};
	if (!canView) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl px-6 py-16 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "mx-auto h-8 w-8 text-warning" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-3 font-display text-xl",
				children: "You don't have access to the audit log"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Ask an admin to grant \"audit\" view permission for your account."
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl space-y-6 px-6 py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex flex-wrap items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollText, { className: "h-5 w-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-widest text-muted-foreground",
					children: "Compliance"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-semibold text-foreground",
					children: "Audit Log"
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "outline",
					onClick: exportCsv,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "mr-1 h-4 w-4" }), " Export CSV"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialog, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTrigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "ghost",
						disabled: !isAdmin || total === 0,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-1 h-4 w-4" }), " Clear"]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogTitle, { children: "Clear audit log?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogDescription, { children: "This removes all audit entries. Payment records themselves are not affected." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AlertDialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogCancel, { children: "Cancel" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDialogAction, {
					onClick: async (e) => {
						e.preventDefault();
						const { error } = await supabase.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
						if (error) toast.error(error.message);
						else {
							queryClient.invalidateQueries({ queryKey: ["auditLogs"] });
							toast.success("Audit log cleared");
							setPage(1);
						}
					},
					children: "Clear log"
				})] })] })] })]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
			className: "font-display text-lg",
			children: "Activity trail"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: "Every action is logged with the user ID and timestamp. Newest first, kept in-browser (up to 500 events)."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs",
							children: "Search"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: q,
							onChange: (e) => setQ(e.target.value),
							placeholder: "Search summary or user…"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs",
							children: "Student"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudentAutosuggest, {
							value: studentId,
							onChange: setStudentId,
							placeholder: "All students"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs",
							children: "User"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: userId,
							onValueChange: setUserId,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "all",
								children: "All users"
							}), users.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
								value: u.id,
								children: [
									u.name,
									" · ",
									u.userCode
								]
							}, u.id))] })]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs",
							children: "Event"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: event,
							onValueChange: setEvent,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "all",
								children: "All events"
							}), Object.keys(EVENT_LABEL).map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: k,
								children: EVENT_LABEL[k]
							}, k))] })]
						})] })
					]
				}),
				(studentId || userId !== "all" || event !== "all" || q) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [total, " matching entries"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "ghost",
						className: "h-6 px-2",
						onClick: () => {
							setStudentId(null);
							setUserId("all");
							setEvent("all");
							setQ("");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "mr-1 h-3 w-3" }), " Clear filters"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-hidden rounded-md border border-border",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "bg-muted/50 text-xs uppercase tracking-widest text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 text-left",
									children: "When"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 text-left",
									children: "User"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 text-left",
									children: "Role"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 text-left",
									children: "Event"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 text-left",
									children: "Details"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
							className: "divide-y divide-border",
							children: [rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								colSpan: 5,
								className: "px-3 py-8 text-center text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mx-auto mb-2 h-5 w-5 opacity-60" }), "No audit entries match these filters."]
							}) }), rows.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 align-top whitespace-nowrap text-muted-foreground",
									children: new Date(l.created_at).toLocaleString([], {
										dateStyle: "short",
										timeStyle: "short"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 align-top",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary uppercase",
											children: (l.actor_name || l.actor_role).substring(0, 2)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-medium text-foreground",
											children: l.actor_name || "Unknown"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-[10px] text-muted-foreground uppercase",
											children: [
												l.actor_code,
												" · ",
												l.actor_role
											]
										})] })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 align-top",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										className: `border-0 ${EVENT_TONE[l.event] || ""}`,
										children: EVENT_LABEL[l.event] || l.event
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-sm text-foreground",
									children: l.summary
								})
							] }, l.id))]
						})]
					})
				}),
				total > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between px-1 pt-2 text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"Showing ",
						(page - 1) * PAGE_SIZE + 1,
						"–",
						Math.min(page * PAGE_SIZE, total),
						" of ",
						total
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								disabled: page <= 1,
								onClick: () => setPage((p) => Math.max(1, p - 1)),
								children: "Prev"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								"Page ",
								page,
								" / ",
								totalPages
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								disabled: page >= totalPages,
								onClick: () => setPage((p) => Math.min(totalPages, p + 1)),
								children: "Next"
							})
						]
					})]
				})
			]
		})] })]
	});
}
//#endregion
export { AuditPage as component };
