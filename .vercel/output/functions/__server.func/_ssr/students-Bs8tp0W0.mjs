import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { d as studentTotals, s as inr, t as Button } from "./store-EDF2LSFL.mjs";
import { t as Input } from "./input-BU0X6Ms0.mjs";
import { t as supabase } from "./supabase-DbG7U5zh.mjs";
import { b as Plus, l as Trash2, m as Search, p as Settings, w as LoaderCircle, x as Pencil } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DRkx8pOP.mjs";
import { t as Label } from "./label-CkcRkRu6.mjs";
import { n as CardContent, t as Card } from "./card-NxxrVLv_.mjs";
import { t as Badge } from "./badge-CgHxRd3k.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, s as DialogTrigger, t as Dialog } from "./dialog-Dr92FT6G.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as useAuth } from "./use-auth-VzLo166S.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/students-Bs8tp0W0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StudentsPage() {
	const { user } = useAuth();
	const { data: charges = [] } = useQuery({
		queryKey: ["fee_charges"],
		queryFn: async () => {
			const { data } = await supabase.from("fee_charges").select("*");
			return (data || []).map((c) => ({
				...c,
				studentId: c.student_id,
				createdAt: c.created_at
			}));
		}
	});
	const { data: adjustments = [] } = useQuery({
		queryKey: ["fee_adjustments"],
		queryFn: async () => {
			const { data } = await supabase.from("fee_adjustments").select("*");
			return (data || []).map((a) => ({
				...a,
				studentId: a.student_id,
				createdAt: a.created_at
			}));
		}
	});
	const { data: payments = [] } = useQuery({
		queryKey: ["fee_payments"],
		queryFn: async () => {
			const { data } = await supabase.from("fee_payments").select("*");
			return (data || []).map((p) => ({
				...p,
				studentId: p.student_id,
				paidAt: p.paid_at,
				voidReason: p.void_reason,
				voidedAt: p.voided_at
			}));
		}
	});
	const { data: canEdit } = useQuery({
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
	const { data: programs = [], isLoading: loadingPrograms } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { data, error } = await supabase.from("programs").select("*").order("created_at", { ascending: true });
			if (error) throw error;
			return data;
		}
	});
	const [q, setQ] = (0, import_react.useState)("");
	const [programFilter, setProgramFilter] = (0, import_react.useState)("all");
	const [sem, setSem] = (0, import_react.useState)("all");
	const [page, setPage] = (0, import_react.useState)(1);
	const pageSize = 25;
	const { data: { students = [], total = 0 } = {}, isLoading: loadingStudents } = useQuery({
		queryKey: [
			"students",
			page,
			q,
			programFilter,
			sem
		],
		queryFn: async () => {
			let query = supabase.from("students").select("*", { count: "exact" }).order("created_at", { ascending: false });
			if (programFilter !== "all") query = query.eq("program_id", programFilter);
			if (sem !== "all") query = query.eq("current_semester", Number(sem));
			if (q) query = query.or(`name.ilike.%${q}%,admission_no.ilike.%${q}%,roll_number.ilike.%${q}%`);
			query = query.range((page - 1) * pageSize, page * pageSize - 1);
			const { data, error, count } = await query;
			if (error) throw error;
			return {
				students: data,
				total: count || 0
			};
		}
	});
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	(0, import_react.useEffect)(() => {
		setPage(1);
	}, [
		q,
		programFilter,
		sem
	]);
	if (loadingPrograms || loadingStudents) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
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
						children: "Registry"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-3xl font-semibold text-foreground",
						children: "Student's Management"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: [total, " enrolled · Permanent roll numbers tracked per student."]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "outline",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/settings",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "mr-1 h-4 w-4" }), " Settings"]
						})
					}), canEdit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudentFormDialog, { programs })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "flex flex-wrap items-center gap-3 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative min-w-[240px] flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "pl-9",
							placeholder: "Search by name, admission or roll no.",
							value: q,
							onChange: (e) => setQ(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: programFilter,
						onValueChange: setProgramFilter,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "w-[180px]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Program" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "All programs"
						}), programs.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: p.id,
							children: p.name
						}, p.id))] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: sem,
						onValueChange: setSem,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "w-[160px]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Semester" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "All semesters"
						}), [
							1,
							2,
							3,
							4,
							5,
							6
						].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
							value: String(n),
							children: ["Semester ", n]
						}, n))] })]
					})
				]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "p-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
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
									children: "Admission No"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 font-medium",
									children: "Program"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 font-medium",
									children: "Semester"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 font-medium",
									children: "Current roll"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 text-right font-medium",
									children: "Balance"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-4 py-3" })
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
							className: "divide-y divide-border",
							children: [students.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 7,
								className: "p-6 text-center text-muted-foreground",
								children: "No students match your filters."
							}) }), students.map((s) => {
								const program = programs.find((p) => p.id === s.program_id);
								const t = studentTotals(s.id, s.current_semester, {
									charges,
									adjustments,
									payments
								});
								const parts = s.name.split(" ");
								const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : s.name.substring(0, 2);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "hover:bg-accent/40",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 py-3",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
												to: "/students/$studentId",
												params: { studentId: s.id },
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary uppercase",
													children: initials
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-medium text-foreground",
													children: s.name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-muted-foreground",
													children: s.email || "—"
												})] })]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 py-3 font-mono text-xs text-muted-foreground",
											children: s.admission_no
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 py-3",
											children: program?.name ?? "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "px-4 py-3",
											children: ["Sem ", s.current_semester]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 py-3 font-mono text-xs",
											children: s.roll_number || "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 py-3 text-right",
											children: t.balance > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "destructive",
												children: inr(t.balance)
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												className: "bg-success text-success-foreground hover:bg-success/90",
												children: "Cleared"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 py-3 text-right",
											children: canEdit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudentFormDialog, {
												programs,
												student: s
											})
										})
									]
								}, s.id);
							})]
						})]
					})
				})
			}) }),
			totalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [
						"Showing ",
						(page - 1) * pageSize + 1,
						" to ",
						Math.min(page * pageSize, total),
						" of ",
						total,
						" students"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => setPage((p) => Math.max(1, p - 1)),
							disabled: page === 1,
							children: "Previous"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm font-medium",
							children: [
								"Page ",
								page,
								" of ",
								totalPages
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => setPage((p) => Math.min(totalPages, p + 1)),
							disabled: page === totalPages,
							children: "Next"
						})
					]
				})]
			})
		]
	});
}
function StudentFormDialog({ programs, student }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [errors, setErrors] = (0, import_react.useState)({});
	const isEditing = !!student;
	const [form, setForm] = (0, import_react.useState)({
		admissionNo: "",
		name: "",
		programId: programs[0]?.id ?? "",
		currentSemester: 1,
		rollNumber: "",
		joinedYear: (/* @__PURE__ */ new Date()).getFullYear(),
		email: "",
		phone: "",
		guardian: "",
		guardianPhone: "",
		gender: "male",
		dob: "",
		category: "General",
		bloodGroup: "",
		address: "",
		city: "",
		state: "",
		pincode: ""
	});
	(0, import_react.useEffect)(() => {
		setErrors({});
		if (isEditing && open) setForm({
			admissionNo: student.admission_no || "",
			name: student.name || "",
			programId: student.program_id || programs[0]?.id || "",
			currentSemester: student.current_semester || 1,
			rollNumber: student.roll_number || "",
			joinedYear: student.joined_year || (/* @__PURE__ */ new Date()).getFullYear(),
			email: student.email || "",
			phone: student.phone || "",
			guardian: student.guardian || "",
			guardianPhone: student.guardian_phone || "",
			gender: student.gender || "male",
			dob: student.dob || "",
			category: student.category || "General",
			bloodGroup: student.blood_group || "",
			address: student.address || "",
			city: student.city || "",
			state: student.state || "",
			pincode: student.pincode || ""
		});
		else if (!isEditing && open) setForm({
			admissionNo: "",
			name: "",
			programId: programs[0]?.id ?? "",
			currentSemester: 1,
			rollNumber: "",
			joinedYear: (/* @__PURE__ */ new Date()).getFullYear(),
			email: "",
			phone: "",
			guardian: "",
			guardianPhone: "",
			gender: "male",
			dob: "",
			category: "General",
			bloodGroup: "",
			address: "",
			city: "",
			state: "",
			pincode: ""
		});
	}, [
		isEditing,
		student,
		open,
		programs
	]);
	(0, import_react.useEffect)(() => {
		if (isEditing || !open) return;
		async function fetchMaxAdmission() {
			const { data } = await supabase.from("students").select("admission_no").order("created_at", { ascending: false }).limit(1);
			if (data && data.length > 0) {
				const lastAd = data[0].admission_no;
				const match = lastAd.match(/\d+$/);
				if (match) {
					const next = (parseInt(match[0], 10) + 1).toString().padStart(match[0].length, "0");
					setForm((f) => ({
						...f,
						admissionNo: lastAd.replace(/\d+$/, next)
					}));
				}
			}
		}
		fetchMaxAdmission();
	}, [isEditing, open]);
	(0, import_react.useEffect)(() => {
		if (isEditing || !open || !form.programId) return;
		async function fetchMaxRoll() {
			const { data } = await supabase.from("students").select("roll_number").eq("program_id", form.programId).order("created_at", { ascending: false }).limit(1);
			if (data && data.length > 0) {
				const lastRoll = data[0].roll_number;
				const match = lastRoll.match(/\d+$/);
				if (match) {
					const next = (parseInt(match[0], 10) + 1).toString().padStart(match[0].length, "0");
					setForm((f) => ({
						...f,
						rollNumber: lastRoll.replace(/\d+$/, next)
					}));
				}
			} else setForm((f) => ({
				...f,
				rollNumber: ""
			}));
		}
		fetchMaxRoll();
	}, [
		isEditing,
		open,
		form.programId
	]);
	const saveStudentMutation = useMutation({
		mutationFn: async (data) => {
			if (isEditing) {
				const { error } = await supabase.from("students").update(data).eq("id", student.id);
				if (error) throw error;
			} else {
				const { error } = await supabase.from("students").insert([data]);
				if (error) throw error;
			}
		},
		onSuccess: () => {
			toast.success(isEditing ? "Student updated successfully" : "Student added successfully");
			setOpen(false);
			queryClient.invalidateQueries({ queryKey: ["students"] });
		},
		onError: (err) => toast.error(err.message)
	});
	const removeStudentMutation = useMutation({
		mutationFn: async () => {
			if (!isEditing) return;
			const { error } = await supabase.from("students").delete().eq("id", student.id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Student removed");
			setOpen(false);
			queryClient.invalidateQueries({ queryKey: ["students"] });
		},
		onError: (err) => toast.error(err.message)
	});
	const submit = () => {
		const newErrors = {};
		const alphaRegex = /^[A-Za-z\s]+$/;
		const phoneRegex = /^\d{10}$/;
		if (!form.name.trim()) newErrors.name = "Full name is required.";
		else if (!alphaRegex.test(form.name.trim())) newErrors.name = "Only alphabets allowed.";
		if (!form.admissionNo.trim()) newErrors.admissionNo = "Admission no. is required.";
		if (!form.programId) newErrors.programId = "Program is required.";
		if (form.phone && !phoneRegex.test(form.phone.trim())) newErrors.phone = "Must be exactly 10 digits.";
		if (form.guardian && !alphaRegex.test(form.guardian.trim())) newErrors.guardian = "Only alphabets allowed.";
		if (form.guardianPhone && !phoneRegex.test(form.guardianPhone.trim())) newErrors.guardianPhone = "Must be exactly 10 digits.";
		if (form.city && !alphaRegex.test(form.city.trim())) newErrors.city = "Only alphabets allowed.";
		if (form.state && !alphaRegex.test(form.state.trim())) newErrors.state = "Only alphabets allowed.";
		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}
		setErrors({});
		const dataToSave = {
			admission_no: form.admissionNo.trim(),
			name: form.name.trim(),
			program_id: form.programId,
			current_semester: form.currentSemester,
			joined_year: form.joinedYear,
			email: form.email || null,
			phone: form.phone || null,
			guardian: form.guardian || null,
			guardian_phone: form.guardianPhone || null,
			gender: form.gender,
			dob: form.dob || null,
			category: form.category || null,
			blood_group: form.bloodGroup || null,
			address: form.address || null,
			city: form.city || null,
			state: form.state || null,
			pincode: form.pincode || null,
			status: "active",
			roll_number: form.rollNumber.trim()
		};
		if (isEditing && form.rollNumber.trim() !== student.roll_number) dataToSave.past_roll_numbers = [...student.past_roll_numbers || [], student.roll_number];
		saveStudentMutation.mutate(dataToSave);
	};
	const handleDelete = () => {
		if (confirm(`Delete ${student?.name}? This removes all fee records.`)) removeStudentMutation.mutate();
	};
	const setField = (field, value) => {
		setForm((f) => ({
			...f,
			[field]: value
		}));
		if (errors[field]) setErrors((e) => ({
			...e,
			[field]: ""
		}));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon",
				title: "Edit student",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " New student"] })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-2xl max-h-[90vh] overflow-y-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "font-display",
					children: isEditing ? "Edit student" : "Add student"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: isEditing ? "Update student details." : "Register a new admission with personal details and current semester roll." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-semibold uppercase tracking-widest text-muted-foreground",
					children: "Academic"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sm:col-span-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									className: errors.name ? "text-destructive" : "",
									children: "Full name"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									className: errors.name ? "border-destructive focus-visible:ring-destructive" : "",
									value: form.name,
									onChange: (e) => setField("name", e.target.value.replace(/[^A-Za-z\s]/g, ""))
								}),
								errors.name && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-[10px] text-destructive",
									children: errors.name
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: errors.admissionNo ? "text-destructive" : "",
								children: "Admission no."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: errors.admissionNo ? "border-destructive focus-visible:ring-destructive" : "",
								value: form.admissionNo,
								onChange: (e) => setField("admissionNo", e.target.value)
							}),
							errors.admissionNo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-[10px] text-destructive",
								children: errors.admissionNo
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Joined year" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							value: form.joinedYear,
							onChange: (e) => setField("joinedYear", Number(e.target.value))
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: errors.programId ? "text-destructive" : "",
								children: "Program"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: form.programId,
								onValueChange: (v) => setField("programId", v),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: errors.programId ? "border-destructive focus-visible:ring-destructive" : "",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: programs.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: p.id,
									children: p.name
								}, p.id)) })]
							}),
							errors.programId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-[10px] text-destructive",
								children: errors.programId
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Current semester" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: String(form.currentSemester),
							onValueChange: (v) => setField("currentSemester", Number(v)),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
								1,
								2,
								3,
								4,
								5,
								6
							].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
								value: String(n),
								children: ["Semester ", n]
							}, n)) })]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sm:col-span-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Roll Number" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.rollNumber,
								onChange: (e) => setField("rollNumber", e.target.value),
								placeholder: "e.g. 260bca001"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground",
					children: "Personal"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Gender" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: form.gender,
							onValueChange: (v) => setField("gender", v),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "male",
									children: "Male"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "female",
									children: "Female"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "other",
									children: "Other"
								})
							] })]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Date of birth" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							value: form.dob,
							onChange: (e) => setField("dob", e.target.value)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Category" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: form.category,
							onValueChange: (v) => setField("category", v),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
								"General",
								"OBC",
								"SC",
								"ST",
								"EWS"
							].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: c,
								children: c
							}, c)) })]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Blood group" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: form.bloodGroup,
							onChange: (e) => setField("bloodGroup", e.target.value),
							placeholder: "e.g. O+"
						})] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground",
					children: "Contact"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: errors.phone ? "text-destructive" : "",
								children: "Mobile no."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "text",
								maxLength: 10,
								className: errors.phone ? "border-destructive focus-visible:ring-destructive" : "",
								value: form.phone,
								onChange: (e) => setField("phone", e.target.value.replace(/\D/g, "")),
								placeholder: "10-digit number"
							}),
							errors.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-[10px] text-destructive",
								children: errors.phone
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: form.email,
							onChange: (e) => setField("email", e.target.value)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: errors.guardian ? "text-destructive" : "",
								children: "Guardian name"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: errors.guardian ? "border-destructive focus-visible:ring-destructive" : "",
								value: form.guardian,
								onChange: (e) => setField("guardian", e.target.value.replace(/[^A-Za-z\s]/g, ""))
							}),
							errors.guardian && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-[10px] text-destructive",
								children: errors.guardian
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: errors.guardianPhone ? "text-destructive" : "",
								children: "Guardian mobile"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "text",
								maxLength: 10,
								className: errors.guardianPhone ? "border-destructive focus-visible:ring-destructive" : "",
								value: form.guardianPhone,
								onChange: (e) => setField("guardianPhone", e.target.value.replace(/\D/g, "")),
								placeholder: "10-digit number"
							}),
							errors.guardianPhone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-[10px] text-destructive",
								children: errors.guardianPhone
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "sm:col-span-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Address" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: form.address,
								onChange: (e) => setField("address", e.target.value),
								placeholder: "House, street, area"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: errors.city ? "text-destructive" : "",
								children: "City"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: errors.city ? "border-destructive focus-visible:ring-destructive" : "",
								value: form.city,
								onChange: (e) => setField("city", e.target.value.replace(/[^A-Za-z\s]/g, ""))
							}),
							errors.city && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-[10px] text-destructive",
								children: errors.city
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: errors.state ? "text-destructive" : "",
								children: "State"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: errors.state ? "border-destructive focus-visible:ring-destructive" : "",
								value: form.state,
								onChange: (e) => setField("state", e.target.value.replace(/[^A-Za-z\s]/g, ""))
							}),
							errors.state && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-[10px] text-destructive",
								children: errors.state
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Pincode" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: form.pincode,
							onChange: (e) => setField("pincode", e.target.value)
						})] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-start",
						children: isEditing && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							variant: "ghost",
							className: "text-destructive hover:bg-destructive/10 hover:text-destructive",
							onClick: handleDelete,
							disabled: removeStudentMutation.isPending,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "mr-2 h-4 w-4" }), "Delete"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							onClick: () => setOpen(false),
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							disabled: saveStudentMutation.isPending,
							onClick: submit,
							children: saveStudentMutation.isPending ? "Saving..." : isEditing ? "Save changes" : "Add student"
						})]
					})]
				})
			]
		})]
	});
}
//#endregion
export { StudentsPage as component };
