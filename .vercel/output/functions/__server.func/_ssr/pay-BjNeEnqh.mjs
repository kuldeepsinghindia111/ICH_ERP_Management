import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { c as nextReceiptNo, f as useStore, l as referenceHint, p as validatePaymentFields, s as inr, t as Button, u as semesterSummary } from "./store-EDF2LSFL.mjs";
import { t as Input } from "./input-BU0X6Ms0.mjs";
import { t as supabase } from "./supabase-DbG7U5zh.mjs";
import { E as Landmark, J as ArrowLeft, K as Banknote, L as CircleCheck, M as Download, N as CreditCard, O as Globe, P as Copy, W as Building2, d as ShieldCheck, m as Search, u as Smartphone, w as LoaderCircle } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DRkx8pOP.mjs";
import { t as Label } from "./label-CkcRkRu6.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, t as Card } from "./card-NxxrVLv_.mjs";
import { t as Badge } from "./badge-CgHxRd3k.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as useAuth } from "./use-auth-VzLo166S.mjs";
import { r as generateReceiptPdf, t as Textarea } from "./textarea-B1XRb62j.mjs";
import { i as TabsTrigger, r as TabsList, t as Tabs } from "./tabs-DhAiKYpn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pay-BjNeEnqh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var METHOD_LABEL = {
	cash: "Cash",
	upi: "UPI",
	card: "Debit / Credit card",
	bank: "Bank transfer / NEFT",
	cheque: "Cheque / DD"
};
function PayPage() {
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
	const { data: programs = [] } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { data, error } = await supabase.from("programs").select("*");
			if (error) throw error;
			return data;
		}
	});
	const { data: students = [], isLoading: loadingStudents } = useQuery({
		queryKey: ["students"],
		queryFn: async () => {
			const { data, error } = await supabase.from("students").select("*");
			if (error) throw error;
			return data;
		}
	});
	const [q, setQ] = (0, import_react.useState)("");
	const [studentId, setStudentId] = (0, import_react.useState)(null);
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
		queryKey: ["fee_payments"],
		queryFn: async () => {
			const { data, error } = await supabase.from("fee_payments").select("*");
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
		}
	});
	const paymentInfo = useStore((s) => s.paymentInfo);
	const receiptFormat = useStore((s) => s.receiptFormat);
	const [mode, setMode] = (0, import_react.useState)("online");
	const [semester, setSemester] = (0, import_react.useState)("1");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [payerName, setPayerName] = (0, import_react.useState)("");
	const [payerPhone, setPayerPhone] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [reference, setReference] = (0, import_react.useState)("");
	const [onlineMethod, setOnlineMethod] = (0, import_react.useState)("upi");
	const [offlineMethod, setOfflineMethod] = (0, import_react.useState)("cash");
	const [step, setStep] = (0, import_react.useState)("choose");
	const [receipt, setReceipt] = (0, import_react.useState)(null);
	const method = mode === "online" ? onlineMethod : offlineMethod;
	const student = (0, import_react.useMemo)(() => students.find((s) => s.id === studentId) ?? null, [students, studentId]);
	student && programs.find((p) => p.id === student.program_id);
	const matches = (0, import_react.useMemo)(() => {
		const t = q.trim().toLowerCase();
		if (!t) return [];
		return students.filter((s) => (s.admission_no || "").toLowerCase().includes(t) || (s.name || "").toLowerCase().includes(t) || Object.values(s.rolls || {}).some((r) => String(r).toLowerCase().includes(t))).slice(0, 6);
	}, [q, students]);
	const sum = (0, import_react.useMemo)(() => {
		if (!student) return null;
		return semesterSummary(student.id, Number(semester), {
			charges,
			adjustments,
			payments
		});
	}, [
		student,
		semester,
		charges,
		adjustments,
		payments
	]);
	const pickStudent = (id) => {
		const s = students.find((x) => x.id === id);
		if (!s) return;
		setStudentId(id);
		setSemester(String(s.current_semester));
		const bal = semesterSummary(id, s.current_semester, {
			charges,
			adjustments,
			payments
		}).balance;
		setAmount(String(Math.max(bal, 0)));
		setPayerName(s.guardian || s.name);
		setPayerPhone(s.guardian_phone || s.phone || "");
		setReference("");
		setStep("pay");
	};
	const copy = (text, label) => {
		navigator.clipboard.writeText(text);
		toast.success(`${label} copied`);
	};
	const [touched, setTouched] = (0, import_react.useState)({});
	const paidAtISO = (/* @__PURE__ */ new Date()).toISOString();
	const offlineErrors = (0, import_react.useMemo)(() => validatePaymentFields({
		amount: Number(amount),
		method,
		reference,
		paidAt: paidAtISO
	}, payments), [
		amount,
		method,
		reference,
		payments,
		paidAtISO
	]);
	const savePaymentMutation = useMutation({
		mutationFn: async (data) => {
			const { error } = await supabase.from("fee_payments").insert([{
				student_id: data.studentId,
				semester: data.semester,
				amount: data.amount,
				method: data.method,
				reference: data.reference,
				note: data.note,
				paid_at: data.paidAt
			}]);
			if (error) throw error;
			if (userRole && student) await supabase.from("audit_logs").insert([{
				actor_user_id: userRole.id,
				actor_name: userRole.name,
				actor_code: userRole.user_code,
				actor_role: userRole.role,
				event: "payment.collected",
				summary: `Collected ₹${data.amount} via ${data.method.toUpperCase()} for ${student.name} (Sem ${data.semester})`,
				student_id: data.studentId
			}]);
		},
		onSuccess: (data, variables) => {
			toast.success("Payment successful!");
			queryClient.invalidateQueries({ queryKey: ["fee_payments"] });
			setReceipt({
				ref: variables.reference,
				amount: variables.amount,
				method: variables.method,
				studentName: student.name,
				semester: variables.semester,
				paidAt: variables.paidAt
			});
			setStep("done");
		},
		onError: (err) => toast.error(err.message)
	});
	const submitPayment = () => {
		if (!student) return;
		setTouched({
			amount: true,
			reference: true,
			payer: true
		});
		if (!payerName.trim()) return toast.error("Payer name is required");
		const amt = Number(amount);
		const ref = mode === "online" ? nextReceiptNo(paidAtISO, payments, receiptFormat) : reference.trim();
		if (mode === "offline" && (offlineErrors.amount || offlineErrors.reference)) return toast.error(offlineErrors.amount ?? offlineErrors.reference ?? "Fix the highlighted fields");
		savePaymentMutation.mutate({
			studentId: student.id,
			semester: Number(semester),
			amount: amt,
			method,
			reference: ref,
			note: `${mode === "online" ? "Online" : "Offline"} (${method.toUpperCase()}) by ${payerName}${payerPhone ? ` · ${payerPhone}` : ""}${note ? ` — ${note}` : ""}`,
			paidAt: paidAtISO
		});
	};
	const reset = () => {
		setStep("choose");
		setStudentId(null);
		setQ("");
		setAmount("");
		setNote("");
		setReference("");
		setReceipt(null);
	};
	const [previewUrl, setPreviewUrl] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (step !== "done" || !receipt || !student) {
			setPreviewUrl((u) => {
				if (u) URL.revokeObjectURL(u);
				return null;
			});
			return;
		}
		const program = programs.find((p) => p.id === student.program_id);
		const url = generateReceiptPdf({
			college: paymentInfo,
			payment: {
				amount: receipt.amount,
				method: receipt.method,
				reference: receipt.ref,
				paidAt: receipt.paidAt
			},
			student: {
				name: student.name,
				admissionNo: student.admission_no,
				rollNo: student.rolls && student.rolls[receipt.semester] || ""
			},
			program: program ? {
				name: program.name,
				code: program.code
			} : void 0,
			semester: receipt.semester
		}).output("bloburl").toString();
		setPreviewUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [
		step,
		receipt,
		student,
		programs,
		paymentInfo
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl space-y-6 px-6 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-6 w-6" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-widest text-muted-foreground",
						children: "Fee collection"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "font-display text-2xl font-semibold text-foreground",
						children: [paymentInfo.collegeName, " — Make Payment"]
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					variant: "secondary",
					className: "gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-3.5 w-3.5" }), " Credits to Principal's a/c"]
				})]
			}),
			step === "choose" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "font-display text-lg",
				children: "How would you like to pay?"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Choose the payment channel — you can pay online via UPI, card or netbanking, or record an offline payment (cash, cheque or DD) at the office counter."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "grid gap-4 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeCard, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "h-6 w-6" }),
					title: "Pay Online",
					desc: "UPI / QR, debit or credit card, or netbanking / NEFT — direct to the Principal's account.",
					onClick: () => {
						setMode("online");
						setStep("lookup");
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeCard, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Banknote, { className: "h-6 w-6" }),
					title: "Pay Offline",
					desc: "Cash, cheque or demand draft received at the office. Reference / receipt no. is mandatory.",
					onClick: () => {
						setMode("offline");
						setStep("lookup");
					}
				})]
			})] }),
			step === "lookup" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "font-display text-lg",
					children: "Find student record"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [mode === "online" ? "Online payment" : "Offline payment", " — search by admission no., roll no. or name."]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: () => setStep("choose"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-1 h-4 w-4" }), " Change mode"]
				})]
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "pl-9",
						autoFocus: true,
						placeholder: "e.g. ADM-2024-011 or Aarav Sharma",
						value: q,
						onChange: (e) => setQ(e.target.value)
					})]
				}), loadingStudents ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-4 text-center text-sm text-muted-foreground",
					children: "Loading..."
				}) : matches.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "divide-y divide-border rounded-md border border-border",
					children: matches.map((s) => {
						const p = programs.find((x) => x.id === s.program_id);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => pickStudent(s.id),
							className: "flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-accent/40",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: s.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									s.admission_no,
									" · ",
									p?.name,
									" · Sem ",
									s.current_semester
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-primary font-medium",
								children: "Select →"
							})]
						}, s.id);
					})
				})]
			})] }),
			step === "pay" && student && sum && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 md:grid-cols-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-6 md:col-span-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
						className: "pb-3 border-b",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "font-display text-lg",
								children: "Payment details"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "ghost",
								size: "sm",
								onClick: reset,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-1 h-4 w-4" }), " Switch student"]
							})]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "grid gap-6 p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs uppercase tracking-widest text-muted-foreground",
										children: "Student"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 font-medium",
										children: student.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: student.admission_no
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: "text-xs uppercase tracking-widest text-muted-foreground",
									children: "Semester"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: semester,
									onValueChange: (v) => {
										setSemester(v);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "mt-1",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: Array.from({ length: student.current_semester }, (_, i) => i + 1).map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
										value: String(n),
										children: ["Sem ", n]
									}, n)) })]
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: touched.amount && (!amount || Number(amount) <= 0) ? "text-destructive" : "",
										children: "Paying Amount (₹)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										className: `mt-1 font-mono text-lg ${touched.amount && (!amount || Number(amount) <= 0) ? "border-destructive focus-visible:ring-destructive" : ""}`,
										type: "number",
										placeholder: "0.00",
										value: amount,
										onChange: (e) => {
											setAmount(e.target.value);
											setTouched({
												...touched,
												amount: true
											});
										}
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 text-xs text-muted-foreground",
										children: ["Current outstanding: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: inr(sum.balance) })]
									})
								] }), mode === "offline" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: touched.reference && offlineErrors.reference ? "text-destructive" : "",
										children: "Reference / Cheque No."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										className: `mt-1 ${touched.reference && offlineErrors.reference ? "border-destructive focus-visible:ring-destructive" : ""}`,
										placeholder: referenceHint(method),
										value: reference,
										onChange: (e) => {
											setReference(e.target.value);
											setTouched({
												...touched,
												reference: true
											});
										}
									}),
									touched.reference && offlineErrors.reference ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs text-destructive",
										children: offlineErrors.reference
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs text-muted-foreground",
										children: "Mandatory for cash, cheque or DD."
									})
								] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 sm:grid-cols-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: touched.payer && !payerName.trim() ? "text-destructive" : "",
									children: "Payer Name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									className: `mt-1 ${touched.payer && !payerName.trim() ? "border-destructive" : ""}`,
									placeholder: "e.g. Ramesh Kumar",
									value: payerName,
									onChange: (e) => {
										setPayerName(e.target.value);
										setTouched({
											...touched,
											payer: true
										});
									}
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Payer Phone (Optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									className: "mt-1",
									placeholder: "e.g. 9876543210",
									value: payerPhone,
									onChange: (e) => setPayerPhone(e.target.value)
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Additional Note (Optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								className: "mt-1 h-16 resize-none",
								placeholder: "E.g. Paid in cash at counter 2...",
								value: note,
								onChange: (e) => setNote(e.target.value)
							})] })
						]
					})] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "md:col-span-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "sticky top-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
							className: "bg-muted/50 pb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "font-display text-lg",
								children: "Checkout"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: ["Amount: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									className: "text-foreground",
									children: inr(Number(amount) || 0)
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "p-0",
							children: [mode === "online" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
								value: onlineMethod,
								onValueChange: (v) => setOnlineMethod(v),
								className: "w-full",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
									className: "w-full rounded-none border-b border-border bg-transparent p-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "upi",
											className: "flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
											children: "UPI"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "card",
											className: "flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
											children: "Card"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "bank",
											className: "flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
											children: "Netbanking"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-5 text-center",
									children: [
										onlineMethod === "upi" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mx-auto flex h-40 w-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, { className: "h-12 w-12 text-muted-foreground/50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "sr-only",
													children: "QR Code Placeholder"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono text-sm",
													children: paymentInfo.upiId
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													className: "h-6 w-6",
													onClick: () => copy(paymentInfo.upiId, "UPI ID"),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-3 w-3" })
												})]
											})]
										}),
										onlineMethod === "card" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "mx-auto h-12 w-12 text-muted-foreground/50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm text-muted-foreground",
												children: "In a real app, a secure card input or payment gateway iframe (like Razorpay or Stripe) would appear here."
											})]
										}),
										onlineMethod === "bank" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-4 text-left",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landmark, { className: "mx-auto h-12 w-12 text-muted-foreground/50 mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2 text-sm",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex justify-between border-b border-border pb-1",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-muted-foreground",
															children: "Account"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-medium",
															children: paymentInfo.accountNumber
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex justify-between border-b border-border pb-1",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-muted-foreground",
															children: "IFSC"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-medium",
															children: paymentInfo.ifsc
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex justify-between pb-1",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-muted-foreground",
															children: "Name"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-medium",
															children: paymentInfo.accountName
														})]
													})
												]
											})]
										})
									]
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
								value: offlineMethod,
								onValueChange: (v) => setOfflineMethod(v),
								className: "w-full",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
									className: "w-full rounded-none border-b border-border bg-transparent p-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "cash",
											className: "flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
											children: "Cash"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "cheque",
											className: "flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
											children: "Cheque/DD"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "bank",
											className: "flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
											children: "NEFT/RTGS"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "p-5 text-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm text-muted-foreground",
										children: [
											"Ensure you have physically collected the ",
											offlineMethod,
											" and provided a valid reference number before confirming."
										]
									})
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "border-t border-border p-5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									className: "w-full",
									size: "lg",
									onClick: submitPayment,
									disabled: savePaymentMutation.isPending || !amount || Number(amount) <= 0,
									children: [savePaymentMutation.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Confirm & Generate Receipt"]
								})
							})]
						})]
					})
				})]
			}),
			step === "done" && receipt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "mx-auto max-w-xl text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "flex flex-col items-center py-12",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-8 w-8" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl font-semibold",
							children: "Payment Successful!"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-muted-foreground",
							children: [
								inr(receipt.amount),
								" collected via ",
								METHOD_LABEL[receipt.method],
								"."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 w-full max-w-sm space-y-3 rounded-md bg-muted/40 p-4 text-left text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between border-b border-border pb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Receipt No."
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium font-mono",
										children: receipt.ref
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between border-b border-border pb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Student"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: receipt.studentName
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between pb-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Semester"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: receipt.semester
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 flex flex-wrap justify-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: () => window.open(previewUrl || "", "_blank"),
								variant: "default",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-2 h-4 w-4" }), " Download PDF Receipt"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: reset,
								children: "Record another payment"
							})]
						})
					]
				})
			})
		]
	});
}
function ModeCard({ icon, title, desc, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: "flex flex-col items-start rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-4 rounded-full bg-primary/10 p-3 text-primary",
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-display text-lg font-semibold",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: desc
			})
		]
	});
}
//#endregion
export { PayPage as component };
