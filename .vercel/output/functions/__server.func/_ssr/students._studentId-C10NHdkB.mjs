import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-PwNqyxv_.mjs";
import { t as Input } from "./input-uzm9g8Y7.mjs";
import { t as supabase } from "./supabase-DbG7U5zh.mjs";
import { n as useAuth } from "./use-auth-VzLo166S.mjs";
import { A as FileSpreadsheet, C as Lock, J as ArrowLeft, _ as RotateCcw, b as Plus, l as Trash2, o as Undo2, w as LoaderCircle, y as Printer } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DamjaduW.mjs";
import { t as Label } from "./label-BeT0bXvu.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, t as Card } from "./card-C5Nmk_bj.mjs";
import { t as Badge } from "./badge-B3f60TId.mjs";
import { c as studentTotals, i as inr, l as useStore, s as semesterSummary, t as FEE_HEADS } from "./store-C_QBvN_m.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, s as DialogTrigger, t as Dialog } from "./dialog-BvYONHWJ.mjs";
import { M as notFound, _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as downloadReceiptPdf, t as Textarea } from "./textarea-DyU3EGqf.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-CA_Ke5Cp.mjs";
import { t as Route } from "./students._studentId-C-sECRVo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/students._studentId-C10NHdkB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StudentDetail() {
	const { studentId } = Route.useParams();
	const queryClient = useQueryClient();
	const { user } = useAuth();
	const { data: userRole } = useQuery({
		queryKey: ["userRole", user?.id],
		queryFn: async () => {
			if (!user) return null;
			const { data } = await supabase.from("user_roles").select("*").eq("id", user.id).single();
			return data;
		},
		enabled: !!user
	});
	const { data: canEditPayments } = useQuery({
		queryKey: ["canEditPayments", user?.id],
		queryFn: async () => {
			if (!user) return false;
			const { data, error } = await supabase.from("user_roles").select("role, permissions").eq("id", user.id).single();
			if (error || !data) return false;
			if (data.role === "admin") return true;
			return !!data.permissions?.payments?.edit;
		},
		enabled: !!user
	});
	const { data: canEditStudents } = useQuery({
		queryKey: ["canEditStudents", user?.id],
		queryFn: async () => {
			if (!user) return false;
			const { data, error } = await supabase.from("user_roles").select("role, permissions").eq("id", user.id).single();
			if (error || !data) return false;
			if (data.role === "admin") return true;
			return !!data.permissions?.students?.edit;
		},
		enabled: !!user
	});
	const { data: student, isLoading: loadingStudent } = useQuery({
		queryKey: ["student", studentId],
		queryFn: async () => {
			const { data, error } = await supabase.from("students").select("*").eq("id", studentId).single();
			if (error) throw error;
			return data;
		}
	});
	const { data: programs = [] } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { data, error } = await supabase.from("programs").select("*");
			if (error) throw error;
			return data;
		}
	});
	const { data: charges = [] } = useQuery({
		queryKey: ["fee_charges", studentId],
		queryFn: async () => {
			const { data, error } = await supabase.from("fee_charges").select("*").eq("student_id", studentId);
			if (error) throw error;
			return data.map((d) => ({
				id: d.id,
				studentId: d.student_id,
				semester: d.semester,
				head: d.head,
				label: d.label,
				amount: d.amount,
				createdAt: d.created_at
			}));
		},
		enabled: !!studentId
	});
	const { data: adjustments = [] } = useQuery({
		queryKey: ["fee_adjustments", studentId],
		queryFn: async () => {
			const { data, error } = await supabase.from("fee_adjustments").select("*").eq("student_id", studentId);
			if (error) throw error;
			return data.map((d) => ({
				id: d.id,
				studentId: d.student_id,
				semester: d.semester,
				type: d.type,
				label: d.label,
				amount: d.amount,
				createdAt: d.created_at
			}));
		},
		enabled: !!studentId
	});
	const { data: payments = [] } = useQuery({
		queryKey: ["fee_payments", studentId],
		queryFn: async () => {
			const { data, error } = await supabase.from("fee_payments").select("*").eq("student_id", studentId);
			if (error) throw error;
			return data.map((d) => ({
				id: d.id,
				studentId: d.student_id,
				semester: d.semester,
				amount: d.amount,
				method: d.method,
				reference: d.reference,
				note: d.note,
				paidAt: d.paid_at,
				voided: d.voided,
				voidedAt: d.voided_at,
				voidReason: d.void_reason
			}));
		},
		enabled: !!studentId
	});
	const updateStudentMutation = useMutation({
		mutationFn: async (updates) => {
			const { error } = await supabase.from("students").update(updates).eq("id", studentId);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["student", studentId] });
			toast.success("Student updated");
		},
		onError: (err) => toast.error(err.message)
	});
	const [activeSem, setActiveSem] = (0, import_react.useState)(null);
	if (loadingStudent) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-[50vh] items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-muted-foreground" })
	});
	if (!student) throw notFound();
	const program = programs.find((p) => p.id === student.program_id);
	const currentSemester = student.current_semester;
	const totals = studentTotals(student.id, currentSemester, {
		charges,
		adjustments,
		payments
	});
	const activeSemValue = activeSem ?? String(currentSemester);
	const semesters = Array.from({ length: program?.total_semesters ?? 6 }, (_, i) => i + 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-7xl space-y-6 px-6 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				variant: "ghost",
				size: "sm",
				className: "-ml-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/students",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-1 h-4 w-4" }), " Back to students"]
				})
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "lg:col-span-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "flex flex-wrap items-start justify-between gap-6 p-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-display text-xl font-semibold text-primary",
								children: student.name.split(" ").map((p) => p[0]).slice(0, 2).join("")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs uppercase tracking-widest text-muted-foreground",
									children: [
										program?.name,
										" · Joined ",
										student.joined_year
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "font-display text-2xl font-semibold text-foreground",
									children: student.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 font-mono text-xs text-muted-foreground",
									children: student.admission_no
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground",
									children: [
										student.gender && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "capitalize",
											children: student.gender
										}),
										student.dob && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["· DOB ", new Date(student.dob).toLocaleDateString()] }),
										student.category && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["· ", student.category] }),
										student.blood_group && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["· Blood ", student.blood_group] })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground",
									children: [
										student.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["📱 ", student.phone] }),
										student.email && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["· ✉ ", student.email] }),
										student.guardian && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
											"· Guardian: ",
											student.guardian,
											student.guardian_phone ? ` (${student.guardian_phone})` : ""
										] })
									]
								}),
								(student.address || student.city || student.state || student.pincode) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-xs text-muted-foreground",
									children: ["🏠 ", [
										student.address,
										student.city,
										student.state,
										student.pincode
									].filter(Boolean).join(", ")]
								})
							] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col items-end gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: student.status === "active" ? "default" : "secondary",
								children: student.status
							}), canEditStudents ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: String(currentSemester),
								onValueChange: (v) => {
									updateStudentMutation.mutate({ current_semester: Number(v) });
									setActiveSem(v);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "w-[160px]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: semesters.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
									value: String(n),
									children: ["Current: Sem ", n]
								}, n)) })]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-sm font-medium",
								children: ["Current: Sem ", currentSemester]
							})]
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "grid grid-cols-3 gap-2 p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TotalPill, {
							label: "Billed",
							value: inr(totals.netPayable)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TotalPill, {
							label: "Paid",
							value: inr(totals.totalPaid),
							tone: "success"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TotalPill, {
							label: "Balance",
							value: inr(totals.balance),
							tone: totals.balance > 0 ? "warning" : "default"
						})
					]
				}) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "font-display text-lg",
				children: "Roll Number"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Current and past roll numbers."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-widest text-muted-foreground",
					children: "Current Roll No."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 font-mono text-xl font-medium",
					children: student.roll_number
				})] }), student.past_roll_numbers && student.past_roll_numbers.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-widest text-muted-foreground",
					children: "Past Roll Numbers"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex flex-wrap gap-2",
					children: student.past_roll_numbers.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "secondary",
						className: "font-mono text-xs",
						children: r
					}, i))
				})] })]
			}) })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "font-display text-lg",
				children: "Semester fee ledger"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Charges, concessions / scholarships and payments per semester."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				value: activeSemValue,
				onValueChange: setActiveSem,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsList, {
					className: "flex flex-wrap",
					children: semesters.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
						value: String(n),
						children: ["Sem ", n]
					}, n))
				}), semesters.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: String(n),
					className: "pt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SemesterLedger, {
						student,
						semester: n,
						charges,
						adjustments,
						payments,
						canEditPayments: canEditPayments ?? false,
						userRole
					})
				}, n))]
			}) })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentHistory, {
				student,
				program,
				payments,
				canEditPayments: canEditPayments ?? false,
				userRole
			})
		]
	});
}
function TotalPill({ label, value, tone = "default" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md bg-muted/60 p-3 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] uppercase tracking-widest text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: `mt-1 font-display text-lg font-semibold ${tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground"}`,
			children: value
		})]
	});
}
function SemesterLedger({ student, semester, charges, adjustments, payments, canEditPayments, userRole }) {
	const studentId = student.id;
	const queryClient = useQueryClient();
	const removeChargeMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("fee_charges").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["fee_charges", studentId] });
			toast.success("Charge removed");
		},
		onError: (err) => toast.error(err.message)
	});
	const removeAdjustmentMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("fee_adjustments").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["fee_adjustments", studentId] });
			toast.success("Adjustment removed");
		},
		onError: (err) => toast.error(err.message)
	});
	const removePaymentMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("fee_payments").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["fee_payments", studentId] });
			queryClient.invalidateQueries({ queryKey: ["fee_payments"] });
			toast.success("Payment removed");
		},
		onError: (err) => toast.error(err.message)
	});
	const sum = (0, import_react.useMemo)(() => semesterSummary(studentId, semester, {
		charges,
		adjustments,
		payments
	}), [
		studentId,
		semester,
		charges,
		adjustments,
		payments
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4 lg:grid-cols-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryPanel, { sum }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "lg:col-span-2 space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LedgerBlock, {
					title: "Charges",
					addBtn: canEditPayments ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddChargeDialog, {
						studentId,
						semester
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, {}),
					rows: sum.charges.map((c) => ({
						id: c.id,
						main: FEE_HEADS.find((h) => h.key === c.head)?.label ?? c.head,
						sub: c.label,
						right: inr(c.amount),
						onDelete: canEditPayments ? () => removeChargeMutation.mutate(c.id) : void 0
					})),
					empty: "No charges added for this semester yet."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LedgerBlock, {
					title: "Concessions & scholarships",
					addBtn: canEditPayments ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddAdjustmentDialog, {
						studentId,
						semester
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, {}),
					rows: sum.adjustments.map((a) => ({
						id: a.id,
						main: a.type === "concession" ? "Concession" : "Scholarship",
						sub: a.label,
						right: `− ${inr(a.amount)}`,
						rightClass: "text-warning",
						onDelete: canEditPayments ? () => removeAdjustmentMutation.mutate(a.id) : void 0
					})),
					empty: "No concessions or scholarships applied."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LedgerBlock, {
					title: "Payments",
					addBtn: canEditPayments ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddPaymentDialog, {
						student,
						semester,
						defaultAmount: Math.max(sum.balance, 0),
						userRole
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, {}),
					rows: sum.payments.map((p) => ({
						id: p.id,
						main: `${p.method.toUpperCase()}${p.voided ? " · VOID" : ""}`,
						sub: `${new Date(p.paidAt).toLocaleDateString()} · ${p.reference ?? "—"}${p.voided && p.voidReason ? ` — ${p.voidReason}` : ""}`,
						right: inr(p.amount),
						rightClass: p.voided ? "text-muted-foreground line-through" : "text-success",
						onDelete: canEditPayments ? () => removePaymentMutation.mutate(p.id) : void 0
					})),
					empty: "No payments recorded."
				})
			]
		})]
	});
}
function SummaryPanel({ sum }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-2 p-5",
		children: [[
			["Total charged", inr(sum.totalCharged)],
			[
				"Concessions",
				`− ${inr(sum.totalConcession)}`,
				"text-warning"
			],
			[
				"Scholarships",
				`− ${inr(sum.totalScholarship)}`,
				"text-warning"
			],
			[
				"Net payable",
				inr(sum.netPayable),
				"font-semibold text-foreground"
			],
			[
				"Paid",
				inr(sum.totalPaid),
				"text-success"
			]
		].map(([l, v, cls]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-muted-foreground",
				children: l
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cls ?? "text-foreground",
				children: v
			})]
		}, l)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 border-t border-border pt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs uppercase tracking-widest text-muted-foreground",
					children: "Balance"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `font-display text-2xl font-semibold ${sum.balance > 0 ? "text-destructive" : "text-success"}`,
					children: inr(sum.balance)
				})]
			})
		})]
	}) });
}
function LedgerBlock({ title, addBtn, rows, empty }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between border-b border-border px-4 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-sm font-semibold text-foreground",
				children: title
			}), addBtn]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "divide-y divide-border",
			children: [rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "p-4 text-sm text-muted-foreground",
				children: empty
			}), rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between px-4 py-3 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium text-foreground",
					children: r.main
				}), r.sub && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: r.sub
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: r.rightClass ?? "text-foreground",
						children: r.right
					}), r.onDelete && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						onClick: r.onDelete,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4 text-destructive" })
					})]
				})]
			}, r.id))]
		})]
	});
}
function AddChargeDialog({ studentId, semester }) {
	const queryClient = useQueryClient();
	const addChargeMutation = useMutation({
		mutationFn: async (data) => {
			const { error } = await supabase.from("fee_charges").insert([{
				student_id: data.studentId,
				semester: data.semester,
				head: data.head,
				amount: data.amount,
				label: data.label
			}]);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["fee_charges", studentId] });
			toast.success("Charge added");
			setOpen(false);
			setAmount("");
			setLabel("");
		},
		onError: (err) => toast.error(err.message)
	});
	const [open, setOpen] = (0, import_react.useState)(false);
	const [head, setHead] = (0, import_react.useState)("tuition");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [label, setLabel] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				size: "sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-3.5 w-3.5" }), " Add charge"]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "font-display",
				children: "Add fee charge"
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Fee head" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: head,
						onValueChange: (v) => setHead(v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: FEE_HEADS.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: h.key,
							children: h.label
						}, h.key)) })]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Amount (INR)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						value: amount,
						onChange: (e) => setAmount(e.target.value)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Note (optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: label,
						onChange: (e) => setLabel(e.target.value),
						placeholder: "e.g. Practical exam"
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				onClick: () => setOpen(false),
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				disabled: addChargeMutation.isPending,
				onClick: () => {
					const amt = Number(amount);
					if (!amt || amt <= 0) return toast.error("Enter a valid amount");
					addChargeMutation.mutate({
						studentId,
						semester,
						head,
						amount: amt,
						label: label || void 0
					});
				},
				children: [addChargeMutation.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Add"]
			})] })
		] })]
	});
}
function AddAdjustmentDialog({ studentId, semester }) {
	const queryClient = useQueryClient();
	const addAdjustmentMutation = useMutation({
		mutationFn: async (data) => {
			const { error } = await supabase.from("fee_adjustments").insert([{
				student_id: data.studentId,
				semester: data.semester,
				type: data.type,
				amount: data.amount,
				label: data.label
			}]);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["fee_adjustments", studentId] });
			toast.success("Adjustment added");
			setOpen(false);
			setAmount("");
			setLabel("");
		},
		onError: (err) => toast.error(err.message)
	});
	const [open, setOpen] = (0, import_react.useState)(false);
	const [type, setType] = (0, import_react.useState)("concession");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [label, setLabel] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				size: "sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-3.5 w-3.5" }), " Add adjustment"]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "font-display",
				children: "Add concession / scholarship"
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: type,
						onValueChange: (v) => setType(v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "concession",
							children: "Concession"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "scholarship",
							children: "Scholarship"
						})] })]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Amount (INR)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						value: amount,
						onChange: (e) => setAmount(e.target.value)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Reason / label" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: label,
						onChange: (e) => setLabel(e.target.value),
						placeholder: "e.g. Merit, Sibling, State scheme"
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				onClick: () => setOpen(false),
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				disabled: addAdjustmentMutation.isPending,
				onClick: () => {
					const amt = Number(amount);
					if (!amt || amt <= 0) return toast.error("Enter a valid amount");
					addAdjustmentMutation.mutate({
						studentId,
						semester,
						type,
						amount: amt,
						label: label || void 0
					});
				},
				children: [addAdjustmentMutation.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Add"]
			})] })
		] })]
	});
}
function AddPaymentDialog({ student, semester, defaultAmount, userRole }) {
	const queryClient = useQueryClient();
	const addPaymentMutation = useMutation({
		mutationFn: async (data) => {
			const { error } = await supabase.from("fee_payments").insert([{
				student_id: data.studentId,
				semester: data.semester,
				amount: data.amount,
				method: data.method,
				reference: data.reference,
				paid_at: (/* @__PURE__ */ new Date()).toISOString()
			}]);
			if (error) throw error;
			if (userRole) await supabase.from("audit_logs").insert([{
				actor_user_id: userRole.id,
				actor_name: userRole.name,
				actor_code: userRole.user_code,
				actor_role: userRole.role,
				event: "payment.collected",
				summary: `Collected ₹${data.amount} via ${data.method.toUpperCase()} for ${student.name} (Sem ${data.semester})`,
				student_id: data.studentId
			}]);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["fee_payments", student.id] });
			queryClient.invalidateQueries({ queryKey: ["fee_payments"] });
			toast.success("Payment recorded");
			setOpen(false);
			setReference("");
		},
		onError: (err) => toast.error(err.message)
	});
	const [open, setOpen] = (0, import_react.useState)(false);
	const [amount, setAmount] = (0, import_react.useState)(String(defaultAmount || ""));
	const [method, setMethod] = (0, import_react.useState)("upi");
	const [reference, setReference] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: (o) => {
			setOpen(o);
			if (o) setAmount(String(defaultAmount || ""));
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: "sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-3.5 w-3.5" }), " Record payment"]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "font-display",
				children: "Record payment"
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Amount (INR)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						value: amount,
						onChange: (e) => setAmount(e.target.value)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Method" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: method,
						onValueChange: (v) => setMethod(v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
							"cash",
							"upi",
							"card",
							"bank",
							"cheque"
						].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: m,
							children: m.toUpperCase()
						}, m)) })]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Reference / receipt no." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: reference,
						onChange: (e) => setReference(e.target.value)
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				onClick: () => setOpen(false),
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				disabled: addPaymentMutation.isPending,
				onClick: () => {
					const amt = Number(amount);
					if (!amt || amt <= 0) return toast.error("Enter a valid amount");
					addPaymentMutation.mutate({
						studentId: student.id,
						semester,
						amount: amt,
						method,
						reference: reference.trim() || void 0
					});
				},
				children: [addPaymentMutation.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Save"]
			})] })
		] })]
	});
}
function PaymentHistory({ student, program, payments, canEditPayments, userRole }) {
	const queryClient = useQueryClient();
	const paymentInfo = useStore((s) => s.paymentInfo);
	const isAdmin = canEditPayments;
	const [semFilter, setSemFilter] = (0, import_react.useState)("all");
	const [methodFilter, setMethodFilter] = (0, import_react.useState)("all");
	const [statusFilter, setStatusFilter] = (0, import_react.useState)("all");
	const rows = (0, import_react.useMemo)(() => {
		return payments.filter((p) => semFilter === "all" ? true : p.semester === Number(semFilter)).filter((p) => methodFilter === "all" ? true : p.method === methodFilter).filter((p) => statusFilter === "all" ? true : statusFilter === "voided" ? p.voided : !p.voided).sort((a, b) => +new Date(b.paidAt) - +new Date(a.paidAt));
	}, [
		payments,
		semFilter,
		methodFilter,
		statusFilter
	]);
	const totalReceived = rows.filter((p) => !p.voided).reduce((s, p) => s + p.amount, 0);
	const totalVoided = rows.filter((p) => p.voided).reduce((s, p) => s + p.amount, 0);
	const semList = Array.from({ length: student.current_semester }, (_, i) => i + 1);
	const downloadReceipt = (p) => {
		const rolls = student.rolls || {};
		downloadReceiptPdf({
			college: paymentInfo,
			payment: p,
			student: {
				name: student.name,
				admissionNo: student.admission_no,
				rollNo: rolls[p.semester] || ""
			},
			program: program ? {
				name: program.name,
				code: program.code
			} : void 0,
			semester: p.semester
		});
	};
	const exportCsv = () => {
		if (rows.length === 0) return toast.error("Nothing to export for these filters");
		const escape = (v) => {
			const s = v == null ? "" : String(v);
			return /[",\n]/.test(s) ? `"${s.replace(/"/g, "\"\"")}"` : s;
		};
		const header = [
			"Date",
			"Semester",
			"Roll",
			"Method",
			"Reference",
			"Amount",
			"Status",
			"Voided at",
			"Void reason",
			"Note"
		];
		const rolls = student.rolls || {};
		const lines = rows.map((p) => [
			new Date(p.paidAt).toISOString(),
			`Sem ${p.semester}`,
			rolls[p.semester] ?? "",
			p.method.toUpperCase(),
			p.reference ?? "",
			p.amount,
			p.voided ? "VOIDED" : "RECEIVED",
			p.voidedAt ? new Date(p.voidedAt).toISOString() : "",
			p.voidReason ?? "",
			p.note ?? ""
		].map(escape).join(","));
		const csv = [header.join(","), ...lines].join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		const parts = [
			student.admission_no,
			semFilter !== "all" ? `sem${semFilter}` : "all-sem",
			methodFilter !== "all" ? methodFilter : "all-methods",
			statusFilter !== "all" ? statusFilter : "all-status"
		];
		a.href = url;
		a.download = `payments-${parts.join("-")}.csv`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
		toast.success(`Exported ${rows.length} row(s)`);
	};
	const voidPaymentMutation = useMutation({
		mutationFn: async ({ id, reason, payment }) => {
			const { error } = await supabase.from("fee_payments").update({
				voided: true,
				voided_at: (/* @__PURE__ */ new Date()).toISOString(),
				void_reason: reason
			}).eq("id", id);
			if (error) throw error;
			if (userRole) await supabase.from("audit_logs").insert([{
				actor_user_id: userRole.id,
				actor_name: userRole.name,
				actor_code: userRole.user_code,
				actor_role: userRole.role,
				event: "payment.voided",
				summary: `Voided payment of ₹${payment.amount} for ${student.name} (Sem ${payment.semester}). Reason: ${reason || "None"}`,
				student_id: student.id
			}]);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["fee_payments", student.id] });
			queryClient.invalidateQueries({ queryKey: ["fee_payments"] });
			toast.success("Payment voided");
		},
		onError: (err) => toast.error(err.message)
	});
	const unvoidPaymentMutation = useMutation({
		mutationFn: async (payment) => {
			const { error } = await supabase.from("fee_payments").update({
				voided: false,
				voided_at: null,
				void_reason: null
			}).eq("id", payment.id);
			if (error) throw error;
			if (userRole) await supabase.from("audit_logs").insert([{
				actor_user_id: userRole.id,
				actor_name: userRole.name,
				actor_code: userRole.user_code,
				actor_role: userRole.role,
				event: "payment.unvoided",
				summary: `Reversed void for payment of ₹${payment.amount} for ${student.name} (Sem ${payment.semester})`,
				student_id: student.id
			}]);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["fee_payments", student.id] });
			queryClient.invalidateQueries({ queryKey: ["fee_payments"] });
			toast.success("Payment reinstated");
		},
		onError: (err) => toast.error(err.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-start justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
			className: "font-display text-lg",
			children: "Payment history"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: "Itemized ledger of every recorded receipt. Filter by semester, method or status."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center gap-2 text-xs",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "rounded-md bg-success/10 px-2 py-1 text-success",
					children: ["Received: ", inr(totalReceived)]
				}),
				totalVoided > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "rounded-md bg-muted px-2 py-1 text-muted-foreground",
					children: ["Voided: ", inr(totalVoided)]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "outline",
					onClick: exportCsv,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "mr-1 h-3.5 w-3.5" }), " Export CSV"]
				})
			]
		})]
	}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						className: "text-xs",
						children: "Semester"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: semFilter,
						onValueChange: setSemFilter,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "All semesters"
						}), semList.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
							value: String(n),
							children: ["Semester ", n]
						}, n))] })]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						className: "text-xs",
						children: "Method"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: methodFilter,
						onValueChange: setMethodFilter,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "All methods"
						}), [
							"cash",
							"upi",
							"card",
							"bank",
							"cheque"
						].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: m,
							children: m.toUpperCase()
						}, m))] })]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						className: "text-xs",
						children: "Status"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: statusFilter,
						onValueChange: setStatusFilter,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "all",
								children: "All"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "active",
								children: "Active only"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "voided",
								children: "Voided / refunded"
							})
						] })]
					})] })
				]
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
								children: "Date"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-left",
								children: "Sem"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-left",
								children: "Method"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-left",
								children: "Reference"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-right",
								children: "Amount"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-left",
								children: "Status"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 text-right",
								children: "Actions"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
						className: "divide-y divide-border",
						children: [rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 7,
							className: "px-3 py-6 text-center text-muted-foreground",
							children: "No payments match these filters."
						}) }), rows.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: p.voided ? "bg-muted/30" : "",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2",
									children: new Date(p.paidAt).toLocaleDateString()
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-3 py-2",
									children: ["Sem ", p.semester]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2",
									children: p.method.toUpperCase()
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 font-mono text-xs",
									children: p.reference ?? "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: `px-3 py-2 text-right font-medium ${p.voided ? "text-muted-foreground line-through" : ""}`,
									children: inr(p.amount)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2",
									children: p.voided ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "secondary",
										children: "Voided"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "default",
										children: "Received"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-3 py-2 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-end gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "icon",
											variant: "ghost",
											title: "Re-print receipt (PDF)",
											onClick: () => downloadReceipt(p),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "h-4 w-4" })
										}), p.voided ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "icon",
											variant: "ghost",
											title: isAdmin ? "Un-void" : "Admin only",
											disabled: !isAdmin || unvoidPaymentMutation.isPending,
											onClick: () => {
												unvoidPaymentMutation.mutate(p);
											},
											children: isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4 w-4" })
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VoidPaymentDialog, {
											paymentId: p.id,
											voidPayment: (id, reason) => voidPaymentMutation.mutate({
												id,
												reason,
												payment: p
											}),
											isAdmin,
											isPending: voidPaymentMutation.isPending
										})]
									})
								})
							]
						}, p.id))]
					})]
				})
			}),
			!isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[11px] text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "mr-1 inline h-3 w-3" }), " Void / un-void requires admin role."]
			}),
			rows.some((p) => p.voided) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] text-muted-foreground",
				children: "Voided/refunded payments are excluded from the student's paid total and outstanding balance."
			})
		]
	})] });
}
function VoidPaymentDialog({ paymentId, voidPayment, isAdmin, isPending }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [reason, setReason] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "icon",
				variant: "ghost",
				title: isAdmin ? "Void / refund" : "Admin only",
				disabled: !isAdmin,
				children: isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "h-4 w-4 text-destructive" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-4 w-4" })
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "font-display",
				children: "Void / refund payment"
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground",
					children: "The payment amount will be reversed from the student's paid total and the outstanding balance will be updated automatically. The record is kept for audit."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Reason (optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					rows: 2,
					value: reason,
					onChange: (e) => setReason(e.target.value),
					placeholder: "e.g. Refunded via UPI, wrong entry"
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				onClick: () => setOpen(false),
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "destructive",
				disabled: isPending,
				onClick: () => {
					voidPayment(paymentId, reason || void 0);
					setOpen(false);
					setReason("");
				},
				children: [isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Void payment"]
			})] })
		] })]
	});
}
//#endregion
export { StudentDetail as component };
