import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { c as nextReceiptNo, d as studentTotals, f as useStore, l as referenceHint, p as validatePaymentFields, s as inr, t as Button, u as semesterSummary } from "./store-EDF2LSFL.mjs";
import { t as Input } from "./input-BU0X6Ms0.mjs";
import { t as supabase } from "./supabase-DbG7U5zh.mjs";
import { M as Download, j as ExternalLink, k as FileText, m as Search, n as Wallet, s as TriangleAlert, v as RefreshCcw, w as LoaderCircle } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DRkx8pOP.mjs";
import { n as CardContent, t as Card } from "./card-NxxrVLv_.mjs";
import { t as Label } from "./label-CkcRkRu6.mjs";
import { t as Badge } from "./badge-CgHxRd3k.mjs";
import { t as StudentAutosuggest } from "./student-autosuggest-UQTQcsg6.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, s as DialogTrigger, t as Dialog } from "./dialog-Dr92FT6G.mjs";
import { n as useAuth } from "./use-auth-VzLo166S.mjs";
import { r as generateReceiptPdf, t as Textarea } from "./textarea-B1XRb62j.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fees-6w6O2aYc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var METHOD_LABEL = {
	cash: "Cash",
	upi: "UPI",
	card: "Debit / Credit card",
	bank: "Bank transfer / NEFT",
	cheque: "Cheque / DD"
};
function CollectPaymentDialog({ studentId, semester, trigger, variant = "primary" }) {
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
	const { data: student } = useQuery({
		queryKey: ["student", studentId],
		queryFn: async () => {
			const { data, error } = await supabase.from("students").select("*").eq("id", studentId).single();
			if (error) throw error;
			return data;
		},
		enabled: !!studentId
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
	const [open, setOpen] = (0, import_react.useState)(false);
	const [sem, setSem] = (0, import_react.useState)(String(semester ?? student?.current_semester ?? 1));
	const [method, setMethod] = (0, import_react.useState)("cash");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [reference, setReference] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [paidAt, setPaidAt] = (0, import_react.useState)((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [touched, setTouched] = (0, import_react.useState)({});
	const [preview, setPreview] = (0, import_react.useState)(null);
	const semList = (0, import_react.useMemo)(() => Array.from({ length: student?.current_semester ?? 1 }, (_, i) => i + 1), [student?.current_semester]);
	const sum = (0, import_react.useMemo)(() => student ? semesterSummary(student.id, Number(sem), {
		charges,
		adjustments,
		payments
	}) : null, [
		student,
		sem,
		charges,
		adjustments,
		payments
	]);
	const regenReceipt = () => setReference(nextReceiptNo(new Date(paidAt).toISOString(), payments, receiptFormat));
	(0, import_react.useEffect)(() => {
		if (open && sum) setAmount(String(Math.max(sum.balance, 0)));
	}, [open, sem]);
	(0, import_react.useEffect)(() => {
		if (open && (method === "cash" || !reference)) setReference(nextReceiptNo(new Date(paidAt).toISOString(), payments, receiptFormat));
	}, [
		open,
		method,
		paidAt,
		payments
	]);
	const previewUrl = preview?.status === "ready" ? preview.url : void 0;
	(0, import_react.useEffect)(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);
	const genTokenRef = (0, import_react.useRef)(0);
	const generatePreview = async (data) => {
		const token = ++genTokenRef.current;
		setPreview({
			status: "loading",
			data
		});
		try {
			await new Promise((r) => setTimeout(r, 20));
			const blob = generateReceiptPdf(data).output("blob");
			if (token !== genTokenRef.current) return;
			const url = URL.createObjectURL(blob);
			const filename = `receipt-${data.student.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-sem${data.semester}-${data.payment.reference}.pdf`;
			setPreview({
				status: "ready",
				url,
				filename,
				data
			});
		} catch (e) {
			if (token !== genTokenRef.current) return;
			const msg = e instanceof Error ? e.message : "Failed to generate receipt PDF";
			setPreview({
				status: "error",
				error: msg,
				data
			});
		}
	};
	const errors = (0, import_react.useMemo)(() => validatePaymentFields({
		amount: Number(amount),
		method,
		reference,
		paidAt: new Date(paidAt).toISOString()
	}, payments), [
		amount,
		method,
		reference,
		paidAt,
		payments
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
		onSuccess: () => {
			toast.success("Payment recorded successfully");
			queryClient.invalidateQueries({ queryKey: ["fee_payments"] });
			const amt = Number(amount);
			const ref = reference.trim() || nextReceiptNo(new Date(paidAt).toISOString(), payments, receiptFormat);
			const program = programs.find((p) => p.id === student.program_id);
			generatePreview({
				college: paymentInfo,
				payment: {
					amount: amt,
					method,
					reference: ref,
					paidAt: new Date(paidAt).toISOString()
				},
				student: {
					name: student.name,
					admissionNo: student.admission_no,
					rollNo: student.rolls && student.rolls[Number(sem)] || ""
				},
				program: program ? {
					name: program.name,
					code: program.code
				} : void 0,
				semester: Number(sem)
			});
		},
		onError: (err) => toast.error(err.message)
	});
	if (!student) return null;
	if (!canEditPayments) return null;
	const resetForm = () => {
		setReference("");
		setNote("");
		setAmount("");
		setTouched({});
	};
	const closeAll = () => {
		setOpen(false);
		setPreview(null);
		resetForm();
	};
	const submit = async () => {
		setTouched({
			amount: true,
			reference: true
		});
		if (errors.amount || errors.reference) return toast.error(errors.amount ?? errors.reference ?? "Please fix the errors");
		const amt = Number(amount);
		const ref = reference.trim() || nextReceiptNo(new Date(paidAt).toISOString(), payments, receiptFormat);
		const iso = new Date(paidAt).toISOString();
		savePaymentMutation.mutate({
			studentId: student.id,
			semester: Number(sem),
			amount: amt,
			method,
			reference: ref,
			note: note || void 0,
			paidAt: iso
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: trigger ? trigger : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				size: variant === "sm" ? "sm" : "default",
				variant: variant === "outline" ? "outline" : "default",
				className: variant === "outline" ? "bg-white" : "",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: `${variant === "sm" ? "mr-1 h-3.5 w-3.5" : "mr-2 h-4 w-4"}` }), "Collect"]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
			className: "max-w-md sm:max-w-lg overflow-y-auto max-h-[90vh]",
			children: !preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "font-display",
					children: "Collect Payment"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
					"Record a fee payment for ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: student.name }),
					"."
				] })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 py-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Semester" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: sem,
								onValueChange: setSem,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: semList.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
									value: String(n),
									children: ["Sem ", n]
								}, n)) })]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: paidAt,
								onChange: (e) => setPaidAt(e.target.value),
								max: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Payment Method" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: method,
							onValueChange: (v) => {
								setMethod(v);
								setTouched({
									...touched,
									reference: false
								});
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: Object.keys(METHOD_LABEL).map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: k,
								children: METHOD_LABEL[k]
							}, k)) })]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-1 flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: touched.amount && errors.amount ? "text-destructive" : "",
										children: "Amount paid"
									}), sum && sum.balance > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[10px] uppercase text-muted-foreground",
										children: ["Due: ", inr(sum.balance)]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									min: 0,
									step: "0.01",
									className: touched.amount && errors.amount ? "border-destructive focus-visible:ring-destructive" : "",
									value: amount,
									onChange: (e) => {
										setAmount(e.target.value);
										setTouched({
											...touched,
											amount: true
										});
									},
									placeholder: "0.00"
								}),
								touched.amount && errors.amount && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-[10px] text-destructive",
									children: errors.amount
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-1 flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: touched.reference && errors.reference ? "text-destructive" : "",
										children: "Reference / Receipt No."
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: regenReceipt,
										className: "text-muted-foreground hover:text-primary",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCcw, { className: "h-3 w-3" })
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									className: touched.reference && errors.reference ? "border-destructive focus-visible:ring-destructive" : "",
									value: reference,
									onChange: (e) => {
										setReference(e.target.value);
										setTouched({
											...touched,
											reference: true
										});
									},
									placeholder: referenceHint(method)
								}),
								touched.reference && errors.reference ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-[10px] text-destructive",
									children: errors.reference
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-[10px] text-muted-foreground",
									children: referenceHint(method)
								})
							] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Notes (Optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							value: note,
							onChange: (e) => setNote(e.target.value),
							placeholder: "Any additional details...",
							className: "h-16 resize-none"
						})] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "outline",
					onClick: () => setOpen(false),
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: submit,
					disabled: savePaymentMutation.isPending,
					children: [savePaymentMutation.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Confirm Payment"]
				})] })
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center justify-center space-y-4 py-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckCircleIcon, { className: "h-6 w-6" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
						className: "text-center font-display text-xl",
						children: "Payment successful!"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-center text-sm text-muted-foreground",
						children: [
							"A receipt has been generated for ",
							student.name,
							"."
						]
					}),
					preview.status === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex items-center text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), " Generating PDF..."]
					}) : preview.status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex items-center rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mr-2 h-4 w-4" }),
							" ",
							preview.error
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-col gap-2 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: preview.url,
								download: preview.filename,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "mr-2 h-4 w-4" }), " Download PDF"]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: preview.url,
								target: "_blank",
								rel: "noreferrer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "mr-2 h-4 w-4" }), " View receipt"]
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						className: "mt-2 text-xs",
						onClick: closeAll,
						children: "Close"
					})
				]
			})
		})]
	});
}
function CheckCircleIcon(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		xmlns: "http://www.w3.org/2000/svg",
		width: "24",
		height: "24",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", { points: "22 4 12 14.01 9 11.01" })]
	});
}
function FeesPage() {
	const { user } = useAuth();
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
	const { data: programs = [], isLoading: loadingPrograms } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { data, error } = await supabase.from("programs").select("*").order("created_at", { ascending: true });
			if (error) throw error;
			return data;
		}
	});
	const { data: students = [], isLoading: loadingStudents } = useQuery({
		queryKey: ["students"],
		queryFn: async () => {
			const { data, error } = await supabase.from("students").select("*").order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const { data: charges = [], isLoading: loadingCharges } = useQuery({
		queryKey: ["fee_charges"],
		queryFn: async () => {
			const { data, error } = await supabase.from("fee_charges").select("*");
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
		}
	});
	const { data: adjustments = [], isLoading: loadingAdjustments } = useQuery({
		queryKey: ["fee_adjustments"],
		queryFn: async () => {
			const { data, error } = await supabase.from("fee_adjustments").select("*");
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
		}
	});
	const { data: payments = [], isLoading: loadingPayments } = useQuery({
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
	const isLoading = loadingPrograms || loadingStudents || loadingCharges || loadingAdjustments || loadingPayments;
	const [q, setQ] = (0, import_react.useState)("");
	const [debouncedQ, setDebouncedQ] = (0, import_react.useState)("");
	const [program, setProgram] = (0, import_react.useState)("all");
	const [sem, setSem] = (0, import_react.useState)("all");
	const [status, setStatus] = (0, import_react.useState)("all");
	const [pickStudentId, setPickStudentId] = (0, import_react.useState)(null);
	const [page, setPage] = (0, import_react.useState)(1);
	const PAGE_SIZE = 15;
	(0, import_react.useEffect)(() => {
		const t = setTimeout(() => setDebouncedQ(q), 180);
		return () => clearTimeout(t);
	}, [q]);
	(0, import_react.useEffect)(() => {
		setPage(1);
	}, [
		debouncedQ,
		program,
		sem,
		status,
		pickStudentId
	]);
	const rows = (0, import_react.useMemo)(() => {
		const items = [];
		if (!students.length) return items;
		students.forEach((st) => {
			if (pickStudentId && st.id !== pickStudentId) return;
			if (program !== "all" && st.program_id !== program) return;
			if (debouncedQ) {
				const t = debouncedQ.toLowerCase();
				if (!((st.name || "").toLowerCase().includes(t) || (st.admission_no || "").toLowerCase().includes(t))) return;
			}
			(sem === "all" ? Array.from({ length: st.current_semester }, (_, i) => i + 1) : [Number(sem)]).forEach((s) => {
				if (s > st.current_semester) return;
				const sum = semesterSummary(st.id, s, {
					charges,
					adjustments,
					payments
				});
				if (status === "pending" && sum.balance <= 0) return;
				if (status === "cleared" && sum.balance > 0) return;
				items.push({
					st,
					semester: s,
					sum
				});
			});
		});
		return items;
	}, [
		students,
		debouncedQ,
		program,
		sem,
		status,
		pickStudentId,
		charges,
		adjustments,
		payments
	]);
	const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
	const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
	const totals = (0, import_react.useMemo)(() => {
		let paid = 0, balance = 0, billed = 0;
		students.forEach((st) => {
			const t = studentTotals(st.id, st.current_semester, {
				charges,
				adjustments,
				payments
			});
			billed += t.netPayable;
			paid += t.totalPaid;
			balance += t.balance;
		});
		return {
			billed,
			paid,
			balance
		};
	}, [
		students,
		charges,
		adjustments,
		payments
	]);
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-[50vh] items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-muted-foreground" })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-7xl space-y-6 px-6 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-widest text-muted-foreground",
						children: "Finance"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-3xl font-semibold text-foreground",
						children: "Fees management"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "Collect payments and track semester-wise dues across concessions, scholarships and fines."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "outline",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/pay",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "mr-1 h-4 w-4" }), " Open online payment page"]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryTile, {
						label: "Total billed",
						value: inr(totals.billed)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryTile, {
						label: "Collected",
						value: inr(totals.paid),
						tone: "success"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryTile, {
						label: "Pending",
						value: inr(totals.balance),
						tone: totals.balance > 0 ? "warning" : "default"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative sm:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "pl-9",
							placeholder: "Search student…",
							value: q,
							onChange: (e) => setQ(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudentAutosuggest, {
						value: pickStudentId,
						onChange: setPickStudentId,
						placeholder: "Pick a student…"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: program,
						onValueChange: setProgram,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "All programs"
						}), programs.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: p.id,
							children: p.name
						}, p.id))] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: sem,
							onValueChange: setSem,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "all",
								children: "All sem"
							}), [
								1,
								2,
								3,
								4,
								5,
								6
							].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
								value: String(n),
								children: ["Sem ", n]
							}, n))] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: status,
							onValueChange: (v) => setStatus(v),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "all",
									children: "All"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "pending",
									children: "Pending"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "cleared",
									children: "Cleared"
								})
							] })]
						})]
					})
				]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "p-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border bg-muted/50 text-left text-xs uppercase tracking-widest text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 font-medium",
									children: "Student"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 font-medium",
									children: "Sem"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 text-right font-medium",
									children: "Charged"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 text-right font-medium",
									children: "Concession"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 text-right font-medium",
									children: "Scholarship"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 text-right font-medium",
									children: "Net"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 text-right font-medium",
									children: "Paid"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 text-right font-medium",
									children: "Balance"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-4 py-3" })
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
							className: "divide-y divide-border",
							children: [rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 9,
								className: "p-8 text-center text-muted-foreground",
								children: "Nothing to show for these filters."
							}) }), pageRows.map(({ st, semester, sum }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "hover:bg-accent/40",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-4 py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-medium text-foreground",
											children: st.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-muted-foreground",
											children: [
												programs.find((p) => p.id === st.program_id)?.name,
												" · Roll ",
												st.rolls && st.rolls[semester] || "—"
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-4 py-3",
										children: ["Sem ", semester]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3 text-right",
										children: inr(sum.totalCharged)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3 text-right text-warning",
										children: sum.totalConcession ? `− ${inr(sum.totalConcession)}` : "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3 text-right text-warning",
										children: sum.totalScholarship ? `− ${inr(sum.totalScholarship)}` : "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3 text-right font-medium",
										children: inr(sum.netPayable)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3 text-right text-success",
										children: inr(sum.totalPaid)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3 text-right",
										children: sum.balance > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "destructive",
											children: inr(sum.balance)
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											className: "bg-success text-success-foreground hover:bg-success/90",
											children: "Cleared"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3 text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-end gap-2",
											children: [sum.balance > 0 && canEditPayments && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollectPaymentDialog, {
												studentId: st.id,
												semester,
												variant: "sm"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												asChild: true,
												variant: "outline",
												size: "sm",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
													to: "/students/$studentId",
													params: { studentId: st.id },
													children: "Ledger"
												})
											})]
										})
									})
								]
							}, st.id + "-" + semester))]
						})]
					})
				}), rows.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between px-4 py-3 text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"Showing ",
						(page - 1) * PAGE_SIZE + 1,
						"–",
						Math.min(page * PAGE_SIZE, rows.length),
						" of ",
						rows.length
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
				})]
			}) })
		]
	});
}
function SummaryTile({ label, value, tone = "default" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs uppercase tracking-widest text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: `mt-2 font-display text-2xl font-semibold ${tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground"}`,
			children: value
		})]
	}) });
}
//#endregion
export { FeesPage as component };
