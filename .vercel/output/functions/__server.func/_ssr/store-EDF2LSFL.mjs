import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime, j as Slot } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/store-EDF2LSFL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-10 rounded-md px-8",
			icon: "h-9 w-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var COLLEGE_PAYMENT_INFO = {
	collegeName: "Imperial College Hisar",
	accountName: "Principal, Imperial College Hisar",
	accountNumber: "50100 2345 67890",
	ifsc: "HDFC0001234",
	bankName: "HDFC Bank — Hisar Branch",
	branch: "Hisar, Haryana, India",
	upiId: "imperial.principal@hdfcbank",
	upiName: "Imperial College Hisar",
	supportEmail: "accounts@imperialcollegehisar.edu",
	supportPhone: "+91 98100 00000"
};
var FEE_HEADS = [
	{
		key: "tuition",
		label: "Tuition"
	},
	{
		key: "exam",
		label: "Exam"
	},
	{
		key: "library",
		label: "Library"
	},
	{
		key: "lab",
		label: "Lab"
	},
	{
		key: "sports",
		label: "Sports"
	},
	{
		key: "hostel",
		label: "Hostel"
	},
	{
		key: "transport",
		label: "Transport"
	},
	{
		key: "fine",
		label: "Fine"
	},
	{
		key: "other",
		label: "Other"
	}
];
var SECTIONS = [
	{
		key: "students",
		label: "Students"
	},
	{
		key: "fees",
		label: "Fees ledger"
	},
	{
		key: "payments",
		label: "Payments (collect / void)"
	},
	{
		key: "reports",
		label: "Reports"
	},
	{
		key: "faculty",
		label: "Faculty"
	},
	{
		key: "courses",
		label: "Courses"
	},
	{
		key: "settings",
		label: "Payment settings"
	},
	{
		key: "audit",
		label: "Audit log"
	},
	{
		key: "users",
		label: "Users & roles"
	}
];
var ALL_SECTIONS = SECTIONS.map((s) => s.key);
function makePerms(fn) {
	return Object.fromEntries(ALL_SECTIONS.map((s) => [s, fn(s)]));
}
function defaultPermissionsFor(role) {
	if (role === "admin") return makePerms(() => ({
		view: true,
		edit: true
	}));
	if (role === "management") return makePerms(() => ({
		view: true,
		edit: false
	}));
	if (role === "accountant") return makePerms((s) => {
		if (s === "users") return {
			view: false,
			edit: false
		};
		if (s === "settings") return {
			view: true,
			edit: false
		};
		if (s === "audit") return {
			view: true,
			edit: false
		};
		if (s === "fees" || s === "payments" || s === "students") return {
			view: true,
			edit: true
		};
		return {
			view: true,
			edit: false
		};
	});
	return makePerms((s) => {
		if (s === "users" || s === "settings" || s === "audit") return {
			view: false,
			edit: false
		};
		if (s === "courses" || s === "faculty") return {
			view: true,
			edit: true
		};
		if (s === "payments") return {
			view: true,
			edit: false
		};
		return {
			view: true,
			edit: false
		};
	});
}
var REF_RULES = {
	cash: {
		required: false,
		hint: "Optional — auto-generated receipt no. is used if left blank."
	},
	upi: {
		required: true,
		regex: /^[A-Za-z0-9]{6,}$/,
		hint: "UPI transaction ID (min 6 alphanumeric characters)."
	},
	card: {
		required: true,
		regex: /^[A-Za-z0-9]{4,}$/,
		hint: "Last 4 digits or authorization code (min 4)."
	},
	bank: {
		required: true,
		regex: /^[A-Za-z0-9\-]{6,22}$/,
		hint: "NEFT / IMPS / RTGS UTR (6–22 alphanumeric)."
	},
	cheque: {
		required: true,
		regex: /^\d{6,}$/,
		hint: "Cheque / DD number (6 or more digits)."
	}
};
function referenceHint(method) {
	return REF_RULES[method].hint;
}
function validatePaymentFields(input, existing) {
	const errors = {};
	if (!Number.isFinite(input.amount)) errors.amount = "Enter a valid amount";
	else if (input.amount <= 0) errors.amount = "Amount must be greater than zero";
	const rule = REF_RULES[input.method];
	const ref = input.reference?.trim() ?? "";
	if (rule.required && !ref) errors.reference = `Reference is required for ${input.method.toUpperCase()} payments`;
	else if (ref && rule.regex && !rule.regex.test(ref)) errors.reference = `Invalid format for ${input.method.toUpperCase()}. ${rule.hint}`;
	if (!errors.reference && ref) {
		const day = (input.paidAt ? new Date(input.paidAt) : /* @__PURE__ */ new Date()).toISOString().slice(0, 10);
		if (existing.some((p) => !p.voided && (p.reference ?? "").trim().toLowerCase() === ref.toLowerCase() && new Date(p.paidAt).toISOString().slice(0, 10) === day)) errors.reference = `Receipt / reference "${ref}" already exists for ${day}`;
	}
	return errors;
}
function validatePaymentInput(input, existing) {
	const e = validatePaymentFields(input, existing);
	return e.amount ?? e.reference ?? e.method ?? null;
}
var DEFAULT_RECEIPT_FORMAT = {
	prefix: "RCPT",
	datePattern: "YYYYMMDD",
	counterStart: 1
};
function formatReceiptDate(pattern, d) {
	const yyyy = String(d.getFullYear());
	const yy = yyyy.slice(-2);
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return pattern.replace(/YYYY/g, yyyy).replace(/YY/g, yy).replace(/MM/g, mm).replace(/DD/g, dd);
}
/** Auto-generate a receipt number using the configured format. */
function nextReceiptNo(dateISO, existing, cfg = DEFAULT_RECEIPT_FORMAT) {
	const d = new Date(dateISO);
	const dateStr = formatReceiptDate(cfg.datePattern, d);
	const prefix = `${cfg.prefix}-${dateStr}-`;
	let max = Math.max(0, cfg.counterStart - 1);
	existing.forEach((p) => {
		const r = p.reference ?? "";
		if (r.startsWith(prefix)) {
			const n = Number(r.slice(prefix.length));
			if (Number.isFinite(n) && n > max) max = n;
		}
	});
	return prefix + String(max + 1).padStart(4, "0");
}
var uid = () => Math.random().toString(36).slice(2, 10);
var now = () => (/* @__PURE__ */ new Date()).toISOString();
var seedPrograms = [];
var seedCourses = [];
var seedFaculty = [];
var seedStudents = [];
function seedFees() {
	const charges = [];
	const adjustments = [];
	const payments = [];
	seedStudents.forEach((st, idx) => {
		for (let sem = 1; sem <= st.currentSemester; sem++) {
			charges.push({
				id: uid(),
				studentId: st.id,
				semester: sem,
				head: "tuition",
				amount: 25e3,
				createdAt: now()
			}, {
				id: uid(),
				studentId: st.id,
				semester: sem,
				head: "exam",
				amount: 2500,
				createdAt: now()
			}, {
				id: uid(),
				studentId: st.id,
				semester: sem,
				head: "library",
				amount: 800,
				createdAt: now()
			}, {
				id: uid(),
				studentId: st.id,
				semester: sem,
				head: "lab",
				amount: 1500,
				createdAt: now()
			});
			if (idx % 3 === 0 && sem === 1) adjustments.push({
				id: uid(),
				studentId: st.id,
				semester: sem,
				type: "scholarship",
				label: "Merit",
				amount: 5e3,
				createdAt: now()
			});
			if (idx % 4 === 1) adjustments.push({
				id: uid(),
				studentId: st.id,
				semester: sem,
				type: "concession",
				label: "Sibling",
				amount: 1500,
				createdAt: now()
			});
			const due = 29800 - adjustments.filter((a) => a.studentId === st.id && a.semester === sem).reduce((s, a) => s + a.amount, 0);
			const payAmt = sem === st.currentSemester ? Math.floor(due * (idx % 2 === 0 ? .5 : .8)) : due;
			if (payAmt > 0) payments.push({
				id: uid(),
				studentId: st.id,
				semester: sem,
				amount: payAmt,
				method: "upi",
				reference: `TXN${Math.floor(Math.random() * 9e5 + 1e5)}`,
				paidAt: (/* @__PURE__ */ new Date(Date.now() - (st.currentSemester - sem) * 90 * 864e5)).toISOString()
			});
		}
	});
	return {
		charges,
		adjustments,
		payments
	};
}
var initialFees = seedFees();
function seedUsers() {
	return [];
}
function nextCode(role, users) {
	const prefix = role === "admin" ? "ADM" : role === "accountant" ? "ACC" : "FAC";
	let max = 0;
	users.forEach((u) => {
		if (u.userCode.startsWith(prefix + "-")) {
			const n = Number(u.userCode.slice(prefix.length + 1));
			if (Number.isFinite(n) && n > max) max = n;
		}
	});
	return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}
function seedSessions() {
	const y = (/* @__PURE__ */ new Date()).getFullYear();
	return [{
		id: "sess-current",
		name: `${y}-${String((y + 1) % 100).padStart(2, "0")}`,
		startDate: `${y}-06-01`,
		endDate: `${y + 1}-05-31`
	}, {
		id: "sess-prev",
		name: `${y - 1}-${String(y % 100).padStart(2, "0")}`,
		startDate: `${y - 1}-06-01`,
		endDate: `${y}-05-31`
	}];
}
var useStore = create()(persist((set, get) => ({
	programs: seedPrograms,
	courses: seedCourses,
	faculty: seedFaculty,
	students: seedStudents,
	charges: initialFees.charges,
	adjustments: initialFees.adjustments,
	payments: initialFees.payments,
	paymentInfo: COLLEGE_PAYMENT_INFO,
	receiptFormat: DEFAULT_RECEIPT_FORMAT,
	sessions: seedSessions(),
	activeSessionId: seedSessions()[0].id,
	users: [],
	currentUserId: "",
	role: "admin",
	auditLog: [],
	addAuditLog: (e) => set((s) => {
		const cu = s.users.find((u) => u.id === s.currentUserId);
		return { auditLog: [{
			id: uid(),
			at: now(),
			actor: cu?.role ?? s.role,
			actorUserId: cu?.id,
			actorName: cu?.name,
			actorCode: cu?.userCode,
			...e
		}, ...s.auditLog].slice(0, 500) };
	}),
	clearAuditLog: () => set(() => ({ auditLog: [] })),
	setRole: (r) => {
		const match = get().users.find((u) => u.role === r);
		if (match) set(() => ({
			currentUserId: match.id,
			role: r
		}));
		else set(() => ({ role: r }));
	},
	setCurrentUserId: (id) => {
		const u = get().users.find((x) => x.id === id);
		if (!u) return;
		set(() => ({
			currentUserId: id,
			role: u.role
		}));
	},
	addUser: ({ name, email, role }) => {
		if (get().role !== "admin") return "";
		const id = uid();
		const user = {
			id,
			name,
			email,
			role,
			userCode: nextCode(role, get().users),
			permissions: defaultPermissionsFor(role),
			createdAt: now()
		};
		set((s) => ({ users: [...s.users, user] }));
		get().addAuditLog({
			event: "user.created",
			summary: `Created ${role} user ${user.name} (${user.userCode})`,
			meta: { userId: id }
		});
		return id;
	},
	updateUser: (id, patch) => {
		if (get().role !== "admin") return;
		const before = get().users.find((u) => u.id === id);
		if (!before) return;
		set((s) => ({ users: s.users.map((u) => {
			if (u.id !== id) return u;
			const next = {
				...u,
				...patch
			};
			if (patch.role && patch.role !== u.role) next.permissions = defaultPermissionsFor(patch.role);
			return next;
		}) }));
		get().addAuditLog({
			event: "user.updated",
			summary: `Updated user ${before.name} (${before.userCode})`,
			meta: {
				userId: id,
				...patch.role && patch.role !== before.role ? { role: patch.role } : {}
			}
		});
	},
	removeUser: (id) => {
		if (get().role !== "admin") return {
			ok: false,
			error: "Admin only"
		};
		const target = get().users.find((u) => u.id === id);
		if (!target) return {
			ok: false,
			error: "User not found"
		};
		const admins = get().users.filter((u) => u.role === "admin");
		if (target.role === "admin" && admins.length <= 1) return {
			ok: false,
			error: "Cannot remove the last admin"
		};
		if (id === get().currentUserId) return {
			ok: false,
			error: "Cannot remove the currently signed-in user"
		};
		set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
		get().addAuditLog({
			event: "user.removed",
			summary: `Removed ${target.role} user ${target.name} (${target.userCode})`,
			meta: { userId: id }
		});
		return { ok: true };
	},
	setPermission: (userId, section, key, value) => {
		if (get().role !== "admin") return;
		const target = get().users.find((u) => u.id === userId);
		if (!target || target.role === "admin") return;
		set((s) => ({ users: s.users.map((u) => u.id !== userId ? u : {
			...u,
			permissions: {
				...u.permissions,
				[section]: {
					...u.permissions[section],
					[key]: value
				}
			}
		}) }));
		get().addAuditLog({
			event: "permissions.updated",
			summary: `${target.name} (${target.userCode}): ${section} ${key} → ${value ? "granted" : "revoked"}`,
			meta: {
				userId,
				section,
				key,
				value: value ? 1 : 0
			}
		});
	},
	resetUserPermissions: (userId) => {
		if (get().role !== "admin") return;
		const target = get().users.find((u) => u.id === userId);
		if (!target) return;
		set((s) => ({ users: s.users.map((u) => u.id === userId ? {
			...u,
			permissions: defaultPermissionsFor(u.role)
		} : u) }));
		get().addAuditLog({
			event: "permissions.updated",
			summary: `${target.name} (${target.userCode}): permissions reset to ${target.role} defaults`,
			meta: { userId }
		});
	},
	can: (section, action = "view") => {
		const s = get();
		const u = s.users.find((x) => x.id === s.currentUserId);
		if (!u) return false;
		if (u.role === "admin") return true;
		const p = u.permissions[section];
		if (!p) return false;
		return action === "edit" ? p.edit : p.view;
	},
	addProgram: (p) => set((s) => ({ programs: [...s.programs, {
		...p,
		id: uid()
	}] })),
	addCourse: (c) => set((s) => ({ courses: [...s.courses, {
		...c,
		id: uid()
	}] })),
	updateCourse: (id, patch) => set((s) => ({ courses: s.courses.map((c) => c.id === id ? {
		...c,
		...patch
	} : c) })),
	removeCourse: (id) => set((s) => ({ courses: s.courses.filter((c) => c.id !== id) })),
	addFaculty: (f) => set((s) => ({ faculty: [...s.faculty, {
		...f,
		id: uid()
	}] })),
	updateFaculty: (id, patch) => set((s) => ({ faculty: s.faculty.map((f) => f.id === id ? {
		...f,
		...patch
	} : f) })),
	removeFaculty: (id) => set((s) => ({ faculty: s.faculty.filter((f) => f.id !== id) })),
	addStudent: (s) => {
		const id = uid();
		const rolls = s.rolls ?? { [s.currentSemester]: "" };
		set((st) => ({ students: [...st.students, {
			...s,
			id,
			rolls
		}] }));
		return id;
	},
	updateStudent: (id, patch) => set((s) => ({ students: s.students.map((st) => st.id === id ? {
		...st,
		...patch
	} : st) })),
	setRoll: (studentId, semester, roll) => set((s) => ({ students: s.students.map((st) => st.id === studentId ? {
		...st,
		rolls: {
			...st.rolls,
			[semester]: roll
		}
	} : st) })),
	removeStudent: (id) => set((s) => ({
		students: s.students.filter((st) => st.id !== id),
		charges: s.charges.filter((c) => c.studentId !== id),
		adjustments: s.adjustments.filter((a) => a.studentId !== id),
		payments: s.payments.filter((p) => p.studentId !== id)
	})),
	addCharge: (c) => set((s) => ({ charges: [...s.charges, {
		...c,
		id: uid(),
		createdAt: now()
	}] })),
	removeCharge: (id) => set((s) => ({ charges: s.charges.filter((c) => c.id !== id) })),
	addAdjustment: (a) => set((s) => ({ adjustments: [...s.adjustments, {
		...a,
		id: uid(),
		createdAt: now()
	}] })),
	removeAdjustment: (id) => set((s) => ({ adjustments: s.adjustments.filter((a) => a.id !== id) })),
	addPayment: (p) => {
		const paidAt = p.paidAt ?? now();
		const ref = p.reference?.trim() || nextReceiptNo(paidAt, get().payments, get().receiptFormat);
		const err = validatePaymentInput({
			amount: p.amount,
			method: p.method,
			reference: ref,
			paidAt
		}, get().payments);
		if (err) return {
			ok: false,
			error: err
		};
		const id = uid();
		set((s) => ({ payments: [...s.payments, {
			...p,
			id,
			paidAt,
			reference: ref
		}] }));
		const student = get().students.find((st) => st.id === p.studentId);
		get().addAuditLog({
			event: "payment.collected",
			summary: `Collected ${inr(p.amount)} · ${p.method.toUpperCase()} · ${student?.name ?? p.studentId} (Sem ${p.semester})`,
			studentId: p.studentId,
			meta: {
				paymentId: id,
				reference: ref
			}
		});
		return {
			ok: true,
			id,
			reference: ref
		};
	},
	removePayment: (id) => set((s) => ({ payments: s.payments.filter((p) => p.id !== id) })),
	voidPayment: (id, reason) => {
		if (!get().can("payments", "edit") || get().role !== "admin") return {
			ok: false,
			error: "Only admins can void payments"
		};
		const target = get().payments.find((p) => p.id === id);
		if (!target) return {
			ok: false,
			error: "Payment not found"
		};
		set((s) => ({ payments: s.payments.map((p) => p.id === id ? {
			...p,
			voided: true,
			voidedAt: now(),
			voidReason: reason
		} : p) }));
		const student = get().students.find((st) => st.id === target.studentId);
		get().addAuditLog({
			event: "payment.voided",
			summary: `Voided ${inr(target.amount)} · ${target.method.toUpperCase()} · ${student?.name ?? target.studentId}${reason ? ` — ${reason}` : ""}`,
			studentId: target.studentId,
			meta: {
				paymentId: id,
				reference: target.reference
			}
		});
		return { ok: true };
	},
	unvoidPayment: (id) => {
		if (get().role !== "admin") return;
		const target = get().payments.find((p) => p.id === id);
		set((s) => ({ payments: s.payments.map((p) => p.id === id ? {
			...p,
			voided: false,
			voidedAt: void 0,
			voidReason: void 0
		} : p) }));
		if (target) {
			const student = get().students.find((st) => st.id === target.studentId);
			get().addAuditLog({
				event: "payment.unvoided",
				summary: `Reinstated ${inr(target.amount)} · ${target.method.toUpperCase()} · ${student?.name ?? target.studentId}`,
				studentId: target.studentId,
				meta: {
					paymentId: id,
					reference: target.reference
				}
			});
		}
	},
	updatePaymentInfo: (patch) => {
		if (!get().can("settings", "edit")) return {
			ok: false,
			error: "You don't have permission to edit payment settings"
		};
		const before = get().paymentInfo;
		set((s) => ({ paymentInfo: {
			...s.paymentInfo,
			...patch
		} }));
		const changed = Object.keys(patch).filter((k) => patch[k] !== before[k]);
		get().addAuditLog({
			event: "settings.updated",
			summary: `Payment settings updated (${changed.length} field${changed.length === 1 ? "" : "s"}: ${changed.join(", ") || "no changes"})`
		});
		return { ok: true };
	},
	resetPaymentInfo: () => {
		if (!get().can("settings", "edit")) return;
		set(() => ({ paymentInfo: COLLEGE_PAYMENT_INFO }));
		get().addAuditLog({
			event: "settings.updated",
			summary: "Payment settings reset to defaults"
		});
	},
	updateReceiptFormat: (patch) => {
		if (!get().can("settings", "edit")) return {
			ok: false,
			error: "You don't have permission"
		};
		const next = {
			...get().receiptFormat,
			...patch
		};
		if (!next.prefix.trim()) return {
			ok: false,
			error: "Prefix is required"
		};
		if (!next.datePattern.trim()) return {
			ok: false,
			error: "Date pattern is required"
		};
		if (!Number.isFinite(next.counterStart) || next.counterStart < 1) return {
			ok: false,
			error: "Counter start must be ≥ 1"
		};
		set(() => ({ receiptFormat: next }));
		get().addAuditLog({
			event: "settings.updated",
			summary: `Receipt format updated: ${next.prefix}-${next.datePattern}-#### (start ${next.counterStart})`
		});
		return { ok: true };
	},
	resetReceiptFormat: () => {
		if (!get().can("settings", "edit")) return;
		set(() => ({ receiptFormat: DEFAULT_RECEIPT_FORMAT }));
		get().addAuditLog({
			event: "settings.updated",
			summary: "Receipt format reset to default"
		});
	},
	addSession: (s) => {
		if (!get().can("settings", "edit")) return "";
		const id = uid();
		set((st) => ({ sessions: [{
			...s,
			id
		}, ...st.sessions] }));
		get().addAuditLog({
			event: "settings.updated",
			summary: `Session added: ${s.name} (${s.startDate} → ${s.endDate})`
		});
		return id;
	},
	updateSession: (id, patch) => {
		if (!get().can("settings", "edit")) return;
		set((s) => ({ sessions: s.sessions.map((x) => x.id === id ? {
			...x,
			...patch
		} : x) }));
		get().addAuditLog({
			event: "settings.updated",
			summary: `Session ${id} updated`
		});
	},
	removeSession: (id) => {
		if (!get().can("settings", "edit")) return {
			ok: false,
			error: "No permission"
		};
		if (get().sessions.length <= 1) return {
			ok: false,
			error: "At least one session is required"
		};
		if (get().activeSessionId === id) return {
			ok: false,
			error: "Cannot remove the active session"
		};
		const s = get().sessions.find((x) => x.id === id);
		set((st) => ({ sessions: st.sessions.filter((x) => x.id !== id) }));
		get().addAuditLog({
			event: "settings.updated",
			summary: `Session removed: ${s?.name ?? id}`
		});
		return { ok: true };
	},
	setActiveSession: (id) => {
		const s = get().sessions.find((x) => x.id === id);
		if (!s) return;
		set(() => ({ activeSessionId: id }));
		get().addAuditLog({
			event: "settings.updated",
			summary: `Active session set to ${s.name}`
		});
	},
	resetDemo: () => set(() => {
		const fees = seedFees();
		const users = seedUsers();
		const sessions = seedSessions();
		return {
			programs: seedPrograms,
			courses: seedCourses,
			faculty: seedFaculty,
			students: seedStudents,
			paymentInfo: COLLEGE_PAYMENT_INFO,
			receiptFormat: DEFAULT_RECEIPT_FORMAT,
			sessions,
			activeSessionId: sessions[0].id,
			users,
			currentUserId: users[0].id,
			role: "admin",
			...fees
		};
	})
}), { name: "cms-store-v5" }));
function semesterSummary(studentId, semester, data) {
	const charges = data.charges.filter((c) => c.studentId === studentId && c.semester === semester);
	const adjustments = data.adjustments.filter((a) => a.studentId === studentId && a.semester === semester);
	const payments = data.payments.filter((p) => p.studentId === studentId && p.semester === semester);
	const totalCharged = charges.reduce((s, c) => s + c.amount, 0);
	const totalConcession = adjustments.filter((a) => a.type === "concession").reduce((s, a) => s + a.amount, 0);
	const totalScholarship = adjustments.filter((a) => a.type === "scholarship").reduce((s, a) => s + a.amount, 0);
	const totalAdjustment = totalConcession + totalScholarship;
	const netPayable = totalCharged - totalAdjustment;
	const totalPaid = payments.filter((p) => !p.voided).reduce((s, p) => s + p.amount, 0);
	return {
		charges,
		adjustments,
		payments,
		totalCharged,
		totalConcession,
		totalScholarship,
		totalAdjustment,
		netPayable,
		totalPaid,
		balance: netPayable - totalPaid
	};
}
function studentTotals(studentId, currentSemester, data) {
	let netPayable = 0, totalPaid = 0, balance = 0;
	for (let s = 1; s <= currentSemester; s++) {
		const sum = semesterSummary(studentId, s, data);
		netPayable += sum.netPayable;
		totalPaid += sum.totalPaid;
		balance += sum.balance;
	}
	return {
		netPayable,
		totalPaid,
		balance
	};
}
var inr = (n) => new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 0
}).format(n);
//#endregion
export { cn as a, nextReceiptNo as c, studentTotals as d, useStore as f, buttonVariants as i, referenceHint as l, FEE_HEADS as n, defaultPermissionsFor as o, validatePaymentFields as p, SECTIONS as r, inr as s, Button as t, semesterSummary as u };
