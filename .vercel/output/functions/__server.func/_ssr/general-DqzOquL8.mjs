import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as cn, f as useStore, t as Button } from "./store-EDF2LSFL.mjs";
import { t as Input } from "./input-BU0X6Ms0.mjs";
import { t as supabase } from "./supabase-DbG7U5zh.mjs";
import { b as Plus, g as Save, l as Trash2, x as Pencil } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DRkx8pOP.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, t as Card } from "./card-NxxrVLv_.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/general-DqzOquL8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Table = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: "relative w-full overflow-auto",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
		ref,
		className: cn("w-full caption-bottom text-sm", className),
		...props
	})
}));
Table.displayName = "Table";
var TableHeader = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
	ref,
	className: cn("[&_tr]:border-b", className),
	...props
}));
TableHeader.displayName = "TableHeader";
var TableBody = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
	ref,
	className: cn("[&_tr:last-child]:border-0", className),
	...props
}));
TableBody.displayName = "TableBody";
var TableFooter = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", {
	ref,
	className: cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className),
	...props
}));
TableFooter.displayName = "TableFooter";
var TableRow = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
	ref,
	className: cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className),
	...props
}));
TableRow.displayName = "TableRow";
var TableHead = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
	ref,
	className: cn("h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className),
	...props
}));
TableHead.displayName = "TableHead";
var TableCell = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
	ref,
	className: cn("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className),
	...props
}));
TableCell.displayName = "TableCell";
var TableCaption = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
	ref,
	className: cn("mt-4 text-sm text-muted-foreground", className),
	...props
}));
TableCaption.displayName = "TableCaption";
var FEE_COLUMNS = [
	"Admission Fee",
	"Tuition Fee",
	"Library Fee",
	"Exam Fee",
	"Other Fees"
];
function GeneralManagementPage() {
	const canEdit = useStore((s) => s.can("settings", "edit"));
	const queryClient = useQueryClient();
	const { data: sessions = [], isLoading: loadingSessions } = useQuery({
		queryKey: ["sessions"],
		queryFn: async () => {
			const { data, error } = await supabase.from("sessions").select("*").order("start_date", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const { data: settings, isLoading: loadingSettings } = useQuery({
		queryKey: ["college_settings"],
		queryFn: async () => {
			const { data, error } = await supabase.from("college_settings").select("*").limit(1).single();
			if (error && error.code !== "PGRST116") throw error;
			return data;
		}
	});
	const { data: programs = [], isLoading: loadingPrograms } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { data, error } = await supabase.from("programs").select("*").order("name");
			if (error) throw error;
			return data;
		}
	});
	const { data: feeStructures = [], isLoading: loadingFees } = useQuery({
		queryKey: ["fee_structures"],
		queryFn: async () => {
			const { data, error } = await supabase.from("fee_structures").select("*");
			if (error) throw error;
			return data;
		}
	});
	const { data: sections = [], isLoading: loadingSections } = useQuery({
		queryKey: ["program_sections"],
		queryFn: async () => {
			const { data, error } = await supabase.from("program_sections").select("*");
			if (error) throw error;
			return data;
		}
	});
	const isLoading = loadingSessions || loadingSettings || loadingPrograms || loadingFees || loadingSections;
	const [activeSessionId, setActiveSessionId] = (0, import_react.useState)("");
	const [admissionSeries, setAdmissionSeries] = (0, import_react.useState)("ADM-2026-0001");
	(0, import_react.useEffect)(() => {
		if (sessions.length) {
			const active = sessions.find((s) => s.is_active);
			if (active) setActiveSessionId(active.id);
		}
	}, [sessions]);
	(0, import_react.useEffect)(() => {
		if (settings?.admission_series) setAdmissionSeries(settings.admission_series);
	}, [settings]);
	const updateSettings = useMutation({
		mutationFn: async () => {
			await supabase.from("sessions").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
			if (activeSessionId) await supabase.from("sessions").update({ is_active: true }).eq("id", activeSessionId);
			if (settings?.id) await supabase.from("college_settings").update({ admission_series: admissionSeries }).eq("id", settings.id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
			queryClient.invalidateQueries({ queryKey: ["college_settings"] });
			toast.success("Settings saved");
		},
		onError: (e) => toast.error(e.message)
	});
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-8 animate-pulse text-muted-foreground",
		children: "Loading configuration..."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-7xl space-y-6 px-6 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "font-display text-3xl font-semibold text-foreground",
				children: [
					"General Management: ",
					sessions.find((s) => s.id === activeSessionId)?.name || "Not Set",
					" Setup"
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Configure essential parameters and academic structures for the active session."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
				className: "pb-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Session & Key Settings" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end gap-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-2 w-[240px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-sm font-medium",
							children: "Current Active Session:"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: activeSessionId,
							onValueChange: setActiveSessionId,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select session" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: sessions.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: s.id,
								children: s.name
							}, s.id)) })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-2 flex-1 max-w-[300px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-sm font-medium",
							children: "Admission Number Series Starting From:"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: admissionSeries,
							onChange: (e) => setAdmissionSeries(e.target.value),
							placeholder: "ADM-2026-0001"
						})]
					}),
					canEdit && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						disabled: updateSettings.isPending,
						onClick: () => updateSettings.mutate(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "mr-2 h-4 w-4" }), " Save Global Settings"]
					})
				]
			}) })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CourseFeeSetup, {
				programs,
				feeStructures,
				canEdit
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RollNumberInitialization, {
				programs,
				sections,
				canEdit
			})
		]
	});
}
function CourseFeeSetup({ programs, feeStructures, canEdit }) {
	const queryClient = useQueryClient();
	const [editingProgramId, setEditingProgramId] = (0, import_react.useState)(null);
	const [localFees, setLocalFees] = (0, import_react.useState)({});
	const startEdit = (pId) => {
		setEditingProgramId(pId);
		const existing = feeStructures.filter((f) => f.program_id === pId && f.semester === 1);
		const m = {};
		FEE_COLUMNS.forEach((col) => {
			const found = existing.find((f) => f.fee_head === col);
			m[col] = found ? found.amount : 0;
		});
		setLocalFees(m);
	};
	const saveFees = useMutation({
		mutationFn: async (pId) => {
			await supabase.from("fee_structures").delete().eq("program_id", pId).eq("semester", 1).in("fee_head", FEE_COLUMNS);
			const inserts = FEE_COLUMNS.map((col) => ({
				program_id: pId,
				semester: 1,
				fee_head: col,
				amount: localFees[col] || 0
			})).filter((f) => f.amount > 0);
			if (inserts.length > 0) {
				const { error } = await supabase.from("fee_structures").insert(inserts);
				if (error) throw error;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["fee_structures"] });
			setEditingProgramId(null);
			toast.success("Fees updated successfully");
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
		className: "flex flex-row items-center justify-between pb-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Course & Fee Setup" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "secondary",
			size: "sm",
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: "/courses",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 h-4 w-4" }), " Add New Course/Class"]
			})
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Course/Class Name" }),
		FEE_COLUMNS.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableHead, { children: [col, " (Rs.)"] }, col)),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Total Fees (Rs.)" }),
		canEdit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
			className: "text-right",
			children: "Actions"
		})
	] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: programs.map((p) => {
		const isEditing = editingProgramId === p.id;
		const feesForProgram = feeStructures.filter((f) => f.program_id === p.id && f.semester === 1);
		let total = 0;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
				className: "font-medium",
				children: p.name
			}),
			FEE_COLUMNS.map((col) => {
				const existingAmt = feesForProgram.find((f) => f.fee_head === col)?.amount || 0;
				total += Number(existingAmt);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "number",
					className: "w-24 h-8",
					value: localFees[col] || "",
					onChange: (e) => setLocalFees({
						...localFees,
						[col]: Number(e.target.value)
					})
				}) : existingAmt || "-" }, col);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
				className: "font-semibold",
				children: isEditing ? Object.values(localFees).reduce((a, b) => a + (Number(b) || 0), 0) : total
			}),
			canEdit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
				className: "text-right",
				children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "ghost",
						onClick: () => saveFees.mutate(p.id),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "ghost",
						onClick: () => setEditingProgramId(null),
						children: "x"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "icon",
					variant: "ghost",
					onClick: () => startEdit(p.id),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
				})
			})
		] }, p.id);
	}) })] }) })] });
}
function RollNumberInitialization({ programs, sections, canEdit }) {
	const queryClient = useQueryClient();
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [localProgramId, setLocalProgramId] = (0, import_react.useState)("");
	const [localSectionName, setLocalSectionName] = (0, import_react.useState)("");
	const [localStartRoll, setLocalStartRoll] = (0, import_react.useState)(0);
	const startAdd = () => {
		setEditingId("new");
		setLocalProgramId(programs[0]?.id || "");
		setLocalSectionName("A");
		setLocalStartRoll(101);
	};
	const startEdit = (s) => {
		setEditingId(s.id);
		setLocalProgramId(s.program_id);
		setLocalSectionName(s.section_name);
		setLocalStartRoll(s.starting_roll_number);
	};
	const saveSection = useMutation({
		mutationFn: async () => {
			if (editingId === "new") {
				const { error } = await supabase.from("program_sections").insert({
					program_id: localProgramId,
					section_name: localSectionName,
					starting_roll_number: localStartRoll
				});
				if (error) throw error;
			} else {
				const { error } = await supabase.from("program_sections").update({
					program_id: localProgramId,
					section_name: localSectionName,
					starting_roll_number: localStartRoll
				}).eq("id", editingId);
				if (error) throw error;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["program_sections"] });
			setEditingId(null);
			toast.success("Section mapped successfully");
		},
		onError: (e) => toast.error(e.message)
	});
	const deleteSection = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("program_sections").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["program_sections"] }),
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
		className: "flex flex-row items-center justify-between pb-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Roll Number Initialization" }), canEdit && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "secondary",
			size: "sm",
			onClick: startAdd,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 h-4 w-4" }), " Add Section"]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Class Name" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Section" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Starting Roll Number" }),
		canEdit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
			className: "text-right",
			children: "Actions"
		})
	] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [sections.map((s) => {
		const p = programs.find((p) => p.id === s.program_id);
		const isEditing = editingId === s.id;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
				value: localProgramId,
				onValueChange: setLocalProgramId,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: programs.map((pr) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
					value: pr.id,
					children: pr.name
				}, pr.id)) })]
			}) : p?.name || "Unknown" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: localSectionName,
				onChange: (e) => setLocalSectionName(e.target.value),
				className: "w-20"
			}) : s.section_name }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				type: "number",
				value: localStartRoll,
				onChange: (e) => setLocalStartRoll(Number(e.target.value)),
				className: "w-24"
			}) : s.starting_roll_number }),
			canEdit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
				className: "text-right",
				children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "ghost",
						onClick: () => saveSection.mutate(),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "ghost",
						onClick: () => setEditingId(null),
						children: "x"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "ghost",
						onClick: () => startEdit(s),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon",
						variant: "ghost",
						onClick: () => {
							if (confirm("Delete?")) deleteSection.mutate(s.id);
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4 text-destructive" })
					})]
				})
			})
		] }, s.id);
	}), editingId === "new" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
			value: localProgramId,
			onValueChange: setLocalProgramId,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: programs.map((pr) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
				value: pr.id,
				children: pr.name
			}, pr.id)) })]
		}) }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			value: localSectionName,
			onChange: (e) => setLocalSectionName(e.target.value),
			className: "w-20"
		}) }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			type: "number",
			value: localStartRoll,
			onChange: (e) => setLocalStartRoll(Number(e.target.value)),
			className: "w-24"
		}) }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
			className: "text-right",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex justify-end gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "icon",
					variant: "ghost",
					onClick: () => saveSection.mutate(),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "icon",
					variant: "ghost",
					onClick: () => setEditingId(null),
					children: "x"
				})]
			})
		})
	] })] })] }) })] });
}
//#endregion
export { GeneralManagementPage as component };
