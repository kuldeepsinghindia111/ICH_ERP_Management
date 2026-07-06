import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as FEE_HEADS, t as Button } from "./store-EDF2LSFL.mjs";
import { t as Input } from "./input-BU0X6Ms0.mjs";
import { t as supabase } from "./supabase-DbG7U5zh.mjs";
import { C as Lock, F as CloudUpload, U as CalendarRange, V as Check, b as Plus, g as Save, k as FileText, l as Trash2, p as Settings } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DRkx8pOP.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, r as CardDescription, t as Card } from "./card-NxxrVLv_.mjs";
import { t as Label } from "./label-CkcRkRu6.mjs";
import { t as Badge } from "./badge-CgHxRd3k.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as useAuth } from "./use-auth-VzLo166S.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-C9ycR2KB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FIELDS = [
	{
		key: "college_name",
		label: "College name"
	},
	{
		key: "account_name",
		label: "Beneficiary account name"
	},
	{
		key: "account_number",
		label: "Account number",
		mono: true
	},
	{
		key: "ifsc",
		label: "IFSC code",
		mono: true
	},
	{
		key: "bank_name",
		label: "Bank name"
	},
	{
		key: "branch",
		label: "Branch"
	},
	{
		key: "upi_id",
		label: "UPI ID",
		mono: true
	},
	{
		key: "upi_name",
		label: "UPI display name"
	},
	{
		key: "support_email",
		label: "Support email"
	},
	{
		key: "support_phone",
		label: "Support phone"
	}
];
function SettingsPage() {
	const { user } = useAuth();
	const { data: canEdit } = useQuery({
		queryKey: ["canEditSettings", user?.id],
		queryFn: async () => {
			if (!user) return false;
			const { data, error } = await supabase.from("user_roles").select("role, permissions").eq("id", user.id).single();
			if (error || !data) return false;
			if (data.role === "admin") return true;
			return !!data.permissions?.settings?.edit;
		},
		enabled: !!user
	});
	const canEditBool = canEdit ?? false;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl space-y-6 px-6 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "h-5 w-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs uppercase tracking-widest text-muted-foreground",
							children: "Configuration"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-2xl font-semibold text-foreground",
							children: "College Payment Settings"
						})]
					}),
					!canEditBool && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						variant: "secondary",
						className: "gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-3.5 w-3.5" }), " Read-only"]
					})
				]
			}),
			!canEditBool && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground",
				children: "You don't have permission to edit settings. Ask an admin to grant \"settings\" edit access."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeeStructuresCard, { canEdit: canEditBool }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionsCard, { canEdit: canEditBool }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollegeSettingsCard, { canEdit: canEditBool })
		]
	});
}
function CollegeSettingsCard({ canEdit }) {
	const queryClient = useQueryClient();
	const { data: settings, isLoading } = useQuery({
		queryKey: ["college_settings"],
		queryFn: async () => {
			const { data, error } = await supabase.from("college_settings").select("*").limit(1).single();
			if (error && error.code !== "PGRST116") throw error;
			return data;
		}
	});
	const [draft, setDraft] = (0, import_react.useState)({});
	(0, import_react.useEffect)(() => {
		if (settings) setDraft(settings);
	}, [settings]);
	const updateSettings = useMutation({
		mutationFn: async (newSettings) => {
			if (settings?.id) {
				const { error } = await supabase.from("college_settings").update(newSettings).eq("id", settings.id);
				if (error) throw error;
			} else {
				const { error } = await supabase.from("college_settings").insert([newSettings]);
				if (error) throw error;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["college_settings"] });
			toast.success("Settings updated");
		},
		onError: (e) => toast.error(e.message)
	});
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "animate-pulse h-64 bg-muted/50 rounded-lg" });
	const dirty = JSON.stringify(draft) !== JSON.stringify(settings || {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
		className: "font-display text-lg",
		children: "Beneficiary details & Receipt Format"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs text-muted-foreground",
		children: "These details appear on the online payment page and every downloaded receipt."
	})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-4 sm:grid-cols-2",
				children: FIELDS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: f.key === "college_name" || f.key === "account_name" ? "sm:col-span-2" : "",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: f.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: f.mono ? "font-mono" : "",
						value: draft[f.key] || "",
						disabled: !canEdit,
						onChange: (e) => setDraft((d) => ({
							...d,
							[f.key]: e.target.value
						}))
					})]
				}, f.key))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-t pt-6 grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "sm:col-span-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "font-medium text-sm",
							children: "Receipt number format"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Prefix" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft.receipt_prefix || "",
						disabled: !canEdit,
						onChange: (e) => setDraft((d) => ({
							...d,
							receipt_prefix: e.target.value
						}))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Date pattern" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "font-mono",
						value: draft.receipt_date_pattern || "",
						disabled: !canEdit,
						onChange: (e) => setDraft((d) => ({
							...d,
							receipt_date_pattern: e.target.value
						}))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Daily counter starts at" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						min: 1,
						value: draft.receipt_counter_start || 1,
						disabled: !canEdit,
						onChange: (e) => setDraft((d) => ({
							...d,
							receipt_counter_start: Number(e.target.value)
						}))
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-end gap-2 pt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => setDraft(settings || {}),
					disabled: !dirty || !canEdit,
					children: "Discard changes"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => {
						updateSettings.mutate(draft);
					},
					disabled: !dirty || !canEdit || updateSettings.isPending,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "mr-1 h-4 w-4" }), " Save changes"]
				})]
			})
		]
	})] });
}
function SessionsCard({ canEdit }) {
	const queryClient = useQueryClient();
	const { data: settings } = useQuery({
		queryKey: ["college_settings"],
		queryFn: async () => {
			const { data } = await supabase.from("college_settings").select("*").limit(1).single();
			return data;
		}
	});
	const { data: sessions, isLoading } = useQuery({
		queryKey: ["sessions"],
		queryFn: async () => {
			const { data, error } = await supabase.from("sessions").select("*").order("start_date", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const addSession = useMutation({
		mutationFn: async (session) => {
			const { error } = await supabase.from("sessions").insert([session]);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
			toast.success("Session added");
		},
		onError: (e) => toast.error(e.message)
	});
	const removeSession = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("sessions").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
			toast.success("Session removed");
		},
		onError: (e) => toast.error(e.message)
	});
	const setActiveSession = useMutation({
		mutationFn: async (sessionId) => {
			if (!settings?.id) throw new Error("No settings record found to update");
			const { error } = await supabase.from("college_settings").update({ active_session_id: sessionId }).eq("id", settings.id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["college_settings"] });
			toast.success("Active session updated");
		},
		onError: (e) => toast.error(e.message)
	});
	const [name, setName] = (0, import_react.useState)("");
	const [start, setStart] = (0, import_react.useState)("");
	const [end, setEnd] = (0, import_react.useState)("");
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "animate-pulse h-32 bg-muted/50 rounded-lg" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
		className: "font-display text-lg flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarRange, { className: "h-4 w-4" }), " Academic sessions / years"]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs text-muted-foreground",
		children: "Define academic years to filter payments and receipts by session in reports."
	})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Session name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: name,
					disabled: !canEdit,
					onChange: (e) => setName(e.target.value),
					placeholder: "e.g. 2026-27"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Start date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "date",
					value: start,
					disabled: !canEdit,
					onChange: (e) => setStart(e.target.value)
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "End date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "date",
					value: end,
					disabled: !canEdit,
					onChange: (e) => setEnd(e.target.value)
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-end",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "w-full",
						disabled: !canEdit || addSession.isPending,
						onClick: () => {
							if (!name.trim() || !start || !end) return toast.error("Name, start and end date are required");
							if (start > end) return toast.error("End date must be after start date");
							addSession.mutate({
								name: name.trim(),
								start_date: start,
								end_date: end
							});
							setName("");
							setStart("");
							setEnd("");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " Add session"]
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-hidden rounded-md border border-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "bg-muted/50 text-xs uppercase tracking-widest text-muted-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-left",
							children: "Session"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-3 py-2 text-left",
							children: "Range"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-3 py-2" })
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
					className: "divide-y divide-border",
					children: [sessions?.map((s) => {
						const isActive = s.id === settings?.active_session_id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: s.name
								}), isActive && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
									className: "ml-2 bg-success text-success-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mr-1 h-3 w-3" }), " Active"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-3 py-2 text-xs text-muted-foreground",
								children: [
									s.start_date,
									" → ",
									s.end_date
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-3 py-2 text-right",
								children: [!isActive && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									disabled: !canEdit || setActiveSession.isPending,
									onClick: () => setActiveSession.mutate(s.id),
									children: "Set active"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "ghost",
									disabled: !canEdit || isActive || removeSession.isPending,
									onClick: () => removeSession.mutate(s.id),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4 text-destructive" })
								})]
							})
						] }, s.id);
					}), sessions?.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 3,
						className: "px-3 py-4 text-center text-muted-foreground text-xs",
						children: "No sessions configured."
					}) })]
				})]
			})
		})]
	})] });
}
function FeeStructuresCard({ canEdit }) {
	const queryClient = useQueryClient();
	const [selectedProgram, setSelectedProgram] = (0, import_react.useState)("");
	const [selectedSemester, setSelectedSemester] = (0, import_react.useState)("");
	const [head, setHead] = (0, import_react.useState)("tuition");
	const [amount, setAmount] = (0, import_react.useState)("");
	const { data: programs } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { data, error } = await supabase.from("programs").select("*").order("name");
			if (error) throw error;
			return data;
		}
	});
	const { data: structures, isLoading } = useQuery({
		queryKey: [
			"fee_structures",
			selectedProgram,
			selectedSemester
		],
		queryFn: async () => {
			if (!selectedProgram || !selectedSemester) return [];
			const { data, error } = await supabase.from("fee_structures").select("*, program:programs(name)").eq("program_id", selectedProgram).eq("semester", parseInt(selectedSemester));
			if (error) throw error;
			return data;
		},
		enabled: !!selectedProgram && !!selectedSemester
	});
	const addStructure = useMutation({
		mutationFn: async (struct) => {
			const { error } = await supabase.from("fee_structures").insert([struct]);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["fee_structures"] });
			toast.success("Fee structure added");
			setAmount("");
		},
		onError: (e) => toast.error(e.message)
	});
	const removeStructure = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("fee_structures").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["fee_structures"] });
			toast.success("Fee structure removed");
		},
		onError: (e) => toast.error(e.message)
	});
	const generateBills = useMutation({
		mutationFn: async () => {
			if (!selectedProgram || !selectedSemester || !structures || structures.length === 0) throw new Error("No fee structures found for this program and semester.");
			const sem = parseInt(selectedSemester);
			const { data: students, error: studErr } = await supabase.from("students").select("id").eq("program_id", selectedProgram).eq("current_semester", sem).eq("status", "active");
			if (studErr) throw studErr;
			if (!students || students.length === 0) throw new Error("No active students found in this program and semester.");
			const { data: existingCharges, error: charErr } = await supabase.from("fee_charges").select("student_id, head").in("student_id", students.map((s) => s.id)).eq("semester", sem);
			if (charErr) throw charErr;
			const toInsert = [];
			for (const student of students) for (const struct of structures) if (!existingCharges.some((c) => c.student_id === student.id && c.head === struct.fee_head)) toInsert.push({
				student_id: student.id,
				semester: sem,
				head: struct.fee_head,
				label: "Standard Fee",
				amount: struct.amount
			});
			if (toInsert.length === 0) throw new Error("All students have already been billed for these heads.");
			const { error: insErr } = await supabase.from("fee_charges").insert(toInsert);
			if (insErr) throw insErr;
			return toInsert.length;
		},
		onSuccess: (count) => {
			toast.success(`Generated ${count} new fee charges successfully!`);
		},
		onError: (e) => toast.error(e.message)
	});
	const p = programs?.find((p) => p.id === selectedProgram);
	const semOptions = p ? Array.from({ length: p.total_semesters }, (_, i) => i + 1) : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
		className: "font-display text-lg flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4" }), " Fee Structures (Billing)"]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Define standard fees for programs and automatically generate bills for enrolled students." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 sm:grid-cols-2 bg-muted/40 p-4 rounded-md border border-border",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Select Program" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
				value: selectedProgram,
				onValueChange: (v) => {
					setSelectedProgram(v);
					setSelectedSemester("");
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Choose program" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: programs?.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
					value: p.id,
					children: p.name === p.code ? p.name : `${p.name} (${p.code})`
				}, p.id)) })]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Select Semester" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
				value: selectedSemester,
				onValueChange: setSelectedSemester,
				disabled: !selectedProgram,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Choose semester" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: semOptions.map((sem) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
					value: String(sem),
					children: ["Semester ", sem]
				}, sem)) })]
			})] })]
		}), selectedProgram && selectedSemester && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 border rounded-md p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
					className: "font-medium text-sm flex justify-between items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Standard Fees for Semester ", selectedSemester] }), structures && structures.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						disabled: !canEdit || generateBills.isPending,
						onClick: () => generateBills.mutate(),
						children: generateBills.isPending ? "Generating..." : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudUpload, { className: "w-4 h-4 mr-1" }), " Generate Bills"] })
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
									children: "Fee Head"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-3 py-2 text-right",
									children: "Amount (₹)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-3 py-2" })
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
							className: "divide-y divide-border",
							children: [structures?.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium capitalize",
										children: s.fee_head
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right font-mono",
									children: Number(s.amount).toFixed(2)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										disabled: !canEdit || removeStructure.isPending,
										onClick: () => removeStructure.mutate(s.id),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4 text-destructive" })
									})
								})
							] }, s.id)), structures?.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 3,
								className: "px-3 py-4 text-center text-muted-foreground text-xs",
								children: "No fees defined for this semester."
							}) })]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 items-end pt-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Fee Head" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: head,
								onValueChange: setHead,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: FEE_HEADS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: f.key,
									children: f.label
								}, f.key)) })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Amount (₹)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								min: 0,
								value: amount,
								onChange: (e) => setAmount(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							disabled: !canEdit || !amount || addStructure.isPending,
							onClick: () => {
								addStructure.mutate({
									program_id: selectedProgram,
									semester: parseInt(selectedSemester),
									fee_head: head,
									amount: parseFloat(amount)
								});
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4 mr-1" }), " Add Fee"]
						})
					]
				})
			]
		})]
	})] });
}
//#endregion
export { SettingsPage as component };
