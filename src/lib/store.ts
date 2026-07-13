import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Program = {
  id: string;
  name: string;
  code: string;
  totalSemesters: number;
};

export type Course = {
  id: string;
  programId: string;
  semester: number;
  code: string;
  title: string;
  credits: number;
};

export type Faculty = {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  phone?: string;
};

export type Gender = "male" | "female" | "other";

export type Student = {
  id: string;
  admissionNo: string;
  name: string;
  programId: string;
  currentSemester: number;
  rollNumber: string;
  pastRollNumbers?: string[];
  email?: string;
  phone?: string;
  guardian?: string;
  guardianPhone?: string;
  joinedYear: number;
  status: "active" | "graduated" | "dropped";
  photoUrl?: string;
  gender?: Gender;
  dob?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  category?: string;
  bloodGroup?: string;
};

export type CollegePaymentInfo = {
  collegeName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branch: string;
  upiId: string;
  upiName: string;
  supportEmail: string;
  supportPhone: string;
};

export const COLLEGE_PAYMENT_INFO: CollegePaymentInfo = {
  collegeName: "Imperial College Hisar",
  accountName: "Principal, Imperial College Hisar",
  accountNumber: "50100 2345 67890",
  ifsc: "HDFC0001234",
  bankName: "HDFC Bank — Hisar Branch",
  branch: "Hisar, Haryana, India",
  upiId: "imperial.principal@hdfcbank",
  upiName: "Imperial College Hisar",
  supportEmail: "accounts@imperialcollegehisar.edu",
  supportPhone: "+91 98100 00000",
};

export type FeeHead =
  | "tuition" | "exam" | "library" | "lab" | "sports"
  | "hostel" | "transport" | "fine" | "other";

export const FEE_HEADS: { key: FeeHead; label: string }[] = [
  { key: "tuition", label: "Tuition" },
  { key: "exam", label: "Exam" },
  { key: "library", label: "Library" },
  { key: "lab", label: "Lab" },
  { key: "sports", label: "Sports" },
  { key: "hostel", label: "Hostel" },
  { key: "transport", label: "Transport" },
  { key: "fine", label: "Fine" },
  { key: "other", label: "Other" },
];

export type FeeCharge = {
  id: string;
  studentId: string;
  semester: number;
  head: FeeHead;
  label?: string;
  amount: number;
  createdAt: string;
};

export type FeeAdjustment = {
  id: string;
  studentId: string;
  semester: number;
  type: "concession" | "scholarship";
  label?: string;
  amount: number;
  createdAt: string;
};

export type PaymentMethod = "cash" | "upi" | "card" | "bank" | "cheque";

export type FeePayment = {
  id: string;
  studentId: string;
  semester: number;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  note?: string;
  paidAt: string;
  voided?: boolean;
  voidedAt?: string;
  voidReason?: string;
};

// ---- Roles / users / permissions ----

export type UserRole = "admin" | "management" | "accountant" | "faculty";

export type Section =
  | "students" | "fees" | "payments" | "reports"
  | "faculty" | "courses" | "settings" | "audit" | "users";

export const SECTIONS: { key: Section; label: string }[] = [
  { key: "students", label: "Students" },
  { key: "fees", label: "Fees ledger" },
  { key: "payments", label: "Payments (collect / void)" },
  { key: "reports", label: "Reports" },
  { key: "faculty", label: "Faculty" },
  { key: "courses", label: "Courses" },
  { key: "settings", label: "Payment settings" },
  { key: "audit", label: "Audit log" },
  { key: "users", label: "Users & roles" },
];

export type Permission = { view: boolean; edit: boolean };
export type Permissions = Record<Section, Permission>;

export type AppUser = {
  id: string;
  userCode: string; // e.g. ADM-001, ACC-002, FAC-003
  name: string;
  email?: string;
  role: UserRole;
  permissions: Permissions;
  createdAt: string;
};

const ALL_SECTIONS = SECTIONS.map((s) => s.key);

function makePerms(fn: (s: Section) => Permission): Permissions {
  return Object.fromEntries(ALL_SECTIONS.map((s) => [s, fn(s)])) as Permissions;
}

export function defaultPermissionsFor(role: UserRole): Permissions {
  if (role === "admin") return makePerms(() => ({ view: true, edit: true }));
  if (role === "management") return makePerms(() => ({ view: true, edit: false }));
  if (role === "accountant")
    return makePerms((s) => {
      if (s === "users") return { view: false, edit: false };
      if (s === "settings") return { view: true, edit: false };
      if (s === "audit") return { view: true, edit: false };
      if (s === "fees" || s === "payments" || s === "students")
        return { view: true, edit: true };
      return { view: true, edit: false };
    });
  // faculty
  return makePerms((s) => {
    if (s === "users" || s === "settings" || s === "audit") return { view: false, edit: false };
    if (s === "courses" || s === "faculty") return { view: true, edit: true };
    if (s === "payments") return { view: true, edit: false };
    return { view: true, edit: false };
  });
}

export type AuditEvent =
  | "payment.collected"
  | "payment.voided"
  | "payment.unvoided"
  | "settings.updated"
  | "user.created"
  | "user.updated"
  | "user.removed"
  | "permissions.updated";

export type AuditLog = {
  id: string;
  at: string;
  actor: UserRole; // legacy — kept for existing UI
  actorUserId?: string;
  actorName?: string;
  actorCode?: string;
  event: AuditEvent;
  summary: string;
  studentId?: string;
  meta?: Record<string, string | number | undefined>;
};

// ---------- Validation ----------

const REF_RULES: Record<PaymentMethod, { required: boolean; regex?: RegExp; hint: string }> = {
  cash: { required: false, hint: "Optional — auto-generated receipt no. is used if left blank." },
  upi: { required: true, regex: /^[A-Za-z0-9]{6,}$/, hint: "UPI transaction ID (min 6 alphanumeric characters)." },
  card: { required: true, regex: /^[A-Za-z0-9]{4,}$/, hint: "Last 4 digits or authorization code (min 4)." },
  bank: { required: true, regex: /^[A-Za-z0-9\-]{6,22}$/, hint: "NEFT / IMPS / RTGS UTR (6–22 alphanumeric)." },
  cheque: { required: true, regex: /^\d{6,}$/, hint: "Cheque / DD number (6 or more digits)." },
};

export function referenceHint(method: PaymentMethod): string {
  return REF_RULES[method].hint;
}

export type PaymentFieldErrors = {
  amount?: string;
  reference?: string;
  method?: string;
};

export function validatePaymentFields(
  input: { amount: number; method: PaymentMethod; reference?: string; paidAt?: string },
  existing: FeePayment[],
): PaymentFieldErrors {
  const errors: PaymentFieldErrors = {};
  if (!Number.isFinite(input.amount)) errors.amount = "Enter a valid amount";
  else if (input.amount <= 0) errors.amount = "Amount must be greater than zero";

  const rule = REF_RULES[input.method];
  const ref = input.reference?.trim() ?? "";
  if (rule.required && !ref) {
    errors.reference = `Reference is required for ${input.method.toUpperCase()} payments`;
  } else if (ref && rule.regex && !rule.regex.test(ref)) {
    errors.reference = `Invalid format for ${input.method.toUpperCase()}. ${rule.hint}`;
  }
  if (!errors.reference && ref) {
    const day = (input.paidAt ? new Date(input.paidAt) : new Date()).toISOString().slice(0, 10);
    const dup = existing.some(
      (p) =>
        !p.voided &&
        (p.reference ?? "").trim().toLowerCase() === ref.toLowerCase() &&
        new Date(p.paidAt).toISOString().slice(0, 10) === day,
    );
    if (dup) errors.reference = `Receipt / reference "${ref}" already exists for ${day}`;
  }
  return errors;
}

export function validatePaymentInput(
  input: { amount: number; method: PaymentMethod; reference?: string; paidAt?: string },
  existing: FeePayment[],
): string | null {
  const e = validatePaymentFields(input, existing);
  return e.amount ?? e.reference ?? e.method ?? null;
}

// ---------- Receipt number format ----------

export type ReceiptFormat = {
  prefix: string;
  /** Date pattern using YYYY / YY / MM / DD tokens. */
  datePattern: string;
  /** Starting number for the continuous counter (defaults to 1). */
  counterStart: number;
};

export const DEFAULT_RECEIPT_FORMAT: ReceiptFormat = {
  prefix: "RCPT",
  datePattern: "",
  counterStart: 101,
};

export function formatReceiptDate(pattern: string, d: Date): string {
  const yyyy = String(d.getFullYear());
  const yy = yyyy.slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return pattern.replace(/YYYY/g, yyyy).replace(/YY/g, yy).replace(/MM/g, mm).replace(/DD/g, dd);
}

/** Auto-generate a receipt number using the configured format. */
export function nextReceiptNo(
  dateISO: string,
  existing: FeePayment[],
  cfg: ReceiptFormat = DEFAULT_RECEIPT_FORMAT,
): string {
  const d = new Date(dateISO);
  const prefix = `${cfg.prefix}-`;
  
  const basePrefix = `${cfg.prefix}-`;
  let max = Math.max(0, cfg.counterStart - 1);
  
  existing.forEach((p) => {
    const r = p.reference ?? "";
    if (r.startsWith(basePrefix)) {
      const parts = r.split('-');
      const lastPart = parts[parts.length - 1];
      const n = Number(lastPart);
      if (Number.isFinite(n) && n > max) max = n;
    }
  });
  return prefix + String(max + 1).padStart(4, "0");
}

// ---------- Sessions / academic years ----------

export type Session = {
  id: string;
  name: string;
  startDate: string; // yyyy-mm-dd
  endDate: string;
};

// ---------- State ----------

type State = {
  programs: Program[];
  courses: Course[];
  faculty: Faculty[];
  students: Student[];
  charges: FeeCharge[];
  adjustments: FeeAdjustment[];
  payments: FeePayment[];
  paymentInfo: CollegePaymentInfo;
  receiptFormat: ReceiptFormat;
  sessions: Session[];
  activeSessionId: string;
  users: AppUser[];
  currentUserId: string;
  /** Convenience mirror of currentUser.role — always synced. */
  role: UserRole;
  auditLog: AuditLog[];

  addProgram: (p: Omit<Program, "id">) => void;
  addCourse: (c: Omit<Course, "id">) => void;
  updateCourse: (id: string, patch: Partial<Course>) => void;
  removeCourse: (id: string) => void;

  addFaculty: (f: Omit<Faculty, "id">) => void;
  updateFaculty: (id: string, patch: Partial<Faculty>) => void;
  removeFaculty: (id: string) => void;

  addStudent: (s: Omit<Student, "id" | "rolls"> & { rolls?: Record<number, string> }) => string;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  setRoll: (studentId: string, semester: number, roll: string) => void;
  removeStudent: (id: string) => void;

  addCharge: (c: Omit<FeeCharge, "id" | "createdAt">) => void;
  removeCharge: (id: string) => void;
  addAdjustment: (a: Omit<FeeAdjustment, "id" | "createdAt">) => void;
  removeAdjustment: (id: string) => void;
  addPayment: (p: Omit<FeePayment, "id" | "paidAt"> & { paidAt?: string }) =>
    { ok: true; id: string; reference: string } | { ok: false; error: string };
  removePayment: (id: string) => void;
  voidPayment: (id: string, reason?: string) => { ok: boolean; error?: string };
  unvoidPayment: (id: string) => void;

  updatePaymentInfo: (patch: Partial<CollegePaymentInfo>) => { ok: boolean; error?: string };
  resetPaymentInfo: () => void;
  updateReceiptFormat: (patch: Partial<ReceiptFormat>) => { ok: boolean; error?: string };
  resetReceiptFormat: () => void;

  addSession: (s: Omit<Session, "id">) => string;
  updateSession: (id: string, patch: Partial<Omit<Session, "id">>) => void;
  removeSession: (id: string) => { ok: boolean; error?: string };
  setActiveSession: (id: string) => void;

  setRole: (r: UserRole) => void;
  setCurrentUserId: (id: string) => void;
  addUser: (u: { name: string; email?: string; role: UserRole }) => string;
  updateUser: (id: string, patch: Partial<Pick<AppUser, "name" | "email" | "role">>) => void;
  removeUser: (id: string) => { ok: boolean; error?: string };
  setPermission: (userId: string, section: Section, key: keyof Permission, value: boolean) => void;
  resetUserPermissions: (userId: string) => void;

  can: (section: Section, action?: "view" | "edit") => boolean;

  addAuditLog: (e: Omit<AuditLog, "id" | "at" | "actor" | "actorUserId" | "actorName" | "actorCode">) => void;
  clearAuditLog: () => void;

  resetDemo: () => void;
};

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

// ---------- Seed ----------
const seedPrograms: Program[] = [];

const seedCourses: Course[] = [];

const seedFaculty: Faculty[] = [];

function makeStudent(admissionNo: string, name: string, programId: string, currentSemester: number, joinedYear: number, rollPrefix: string): Student {
  const rollNumber = `${rollPrefix}${String(currentSemester).padStart(2, "0")}`;
  return {
    id: uid(),
    admissionNo, name, programId, currentSemester, rollNumber, joinedYear,
    status: "active",
    email: `${name.toLowerCase().replace(/[^a-z]/g, ".")}@student.college.edu`,
    guardian: "—",
  };
}

const seedStudents: Student[] = [];

function seedFees() {
  const charges: FeeCharge[] = [];
  const adjustments: FeeAdjustment[] = [];
  const payments: FeePayment[] = [];
  seedStudents.forEach((st, idx) => {
    for (let sem = 1; sem <= st.currentSemester; sem++) {
      charges.push(
        { id: uid(), studentId: st.id, semester: sem, head: "tuition", amount: 25000, createdAt: now() },
        { id: uid(), studentId: st.id, semester: sem, head: "exam", amount: 2500, createdAt: now() },
        { id: uid(), studentId: st.id, semester: sem, head: "library", amount: 800, createdAt: now() },
        { id: uid(), studentId: st.id, semester: sem, head: "lab", amount: 1500, createdAt: now() },
      );
      if (idx % 3 === 0 && sem === 1) adjustments.push({ id: uid(), studentId: st.id, semester: sem, type: "scholarship", label: "Merit", amount: 5000, createdAt: now() });
      if (idx % 4 === 1) adjustments.push({ id: uid(), studentId: st.id, semester: sem, type: "concession", label: "Sibling", amount: 1500, createdAt: now() });
      const totalCharge = 25000 + 2500 + 800 + 1500;
      const adj = adjustments.filter(a => a.studentId === st.id && a.semester === sem).reduce((s, a) => s + a.amount, 0);
      const due = totalCharge - adj;
      const isLastSem = sem === st.currentSemester;
      const payAmt = isLastSem ? Math.floor(due * (idx % 2 === 0 ? 0.5 : 0.8)) : due;
      if (payAmt > 0) {
        payments.push({
          id: uid(), studentId: st.id, semester: sem, amount: payAmt,
          method: "upi", reference: `TXN${Math.floor(Math.random() * 900000 + 100000)}`,
          paidAt: new Date(Date.now() - (st.currentSemester - sem) * 90 * 86400000).toISOString(),
        });
      }
    }
  });
  return { charges, adjustments, payments };
}

const initialFees = seedFees();

function seedUsers(): AppUser[] { return []; }
const initialUsers = seedUsers();

function nextCode(role: UserRole, users: AppUser[]): string {
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

function seedSessions(): Session[] {
  const y = new Date().getFullYear();
  return [
    { id: "sess-current", name: `${y}-${String((y + 1) % 100).padStart(2, "0")}`, startDate: `${y}-06-01`, endDate: `${y + 1}-05-31` },
    { id: "sess-prev", name: `${y - 1}-${String(y % 100).padStart(2, "0")}`, startDate: `${y - 1}-06-01`, endDate: `${y}-05-31` },
  ];
}


export const useStore = create<State>()(
  persist(
    (set, get) => ({
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

      addAuditLog: (e) =>
        set((s) => {
          const cu = s.users.find((u) => u.id === s.currentUserId);
          return {
            auditLog: [
              {
                id: uid(), at: now(),
                actor: cu?.role ?? s.role,
                actorUserId: cu?.id, actorName: cu?.name, actorCode: cu?.userCode,
                ...e,
              },
              ...s.auditLog,
            ].slice(0, 500),
          };
        }),
      clearAuditLog: () => set(() => ({ auditLog: [] })),

      setRole: (r) => {
        // Legacy path: switch to first user matching role.
        const match = get().users.find((u) => u.role === r);
        if (match) set(() => ({ currentUserId: match.id, role: r }));
        else set(() => ({ role: r }));
      },
      setCurrentUserId: (id) => {
        const u = get().users.find((x) => x.id === id);
        if (!u) return;
        set(() => ({ currentUserId: id, role: u.role }));
      },
      addUser: ({ name, email, role }) => {
        if (get().role !== "admin") return "";
        const id = uid();
        const user: AppUser = {
          id, name, email, role,
          userCode: nextCode(role, get().users),
          permissions: defaultPermissionsFor(role),
          createdAt: now(),
        };
        set((s) => ({ users: [...s.users, user] }));
        get().addAuditLog({ event: "user.created", summary: `Created ${role} user ${user.name} (${user.userCode})`, meta: { userId: id } });
        return id;
      },
      updateUser: (id, patch) => {
        if (get().role !== "admin") return;
        const before = get().users.find((u) => u.id === id);
        if (!before) return;
        set((s) => ({
          users: s.users.map((u) => {
            if (u.id !== id) return u;
            const next = { ...u, ...patch };
            // If role changed, reset permissions to that role's default preset.
            if (patch.role && patch.role !== u.role) {
              next.permissions = defaultPermissionsFor(patch.role);
            }
            return next;
          }),
        }));
        get().addAuditLog({
          event: "user.updated",
          summary: `Updated user ${before.name} (${before.userCode})`,
          meta: { userId: id, ...(patch.role && patch.role !== before.role ? { role: patch.role } : {}) },
        });
      },
      removeUser: (id) => {
        if (get().role !== "admin") return { ok: false, error: "Admin only" };
        const target = get().users.find((u) => u.id === id);
        if (!target) return { ok: false, error: "User not found" };
        const admins = get().users.filter((u) => u.role === "admin");
        if (target.role === "admin" && admins.length <= 1) {
          return { ok: false, error: "Cannot remove the last admin" };
        }
        if (id === get().currentUserId) {
          return { ok: false, error: "Cannot remove the currently signed-in user" };
        }
        set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
        get().addAuditLog({
          event: "user.removed",
          summary: `Removed ${target.role} user ${target.name} (${target.userCode})`,
          meta: { userId: id },
        });
        return { ok: true };
      },
      setPermission: (userId, section, key, value) => {
        if (get().role !== "admin") return;
        const target = get().users.find((u) => u.id === userId);
        if (!target || target.role === "admin") return; // admin is always full
        set((s) => ({
          users: s.users.map((u) =>
            u.id !== userId
              ? u
              : {
                  ...u,
                  permissions: {
                    ...u.permissions,
                    [section]: { ...u.permissions[section], [key]: value },
                  },
                },
          ),
        }));
        get().addAuditLog({
          event: "permissions.updated",
          summary: `${target.name} (${target.userCode}): ${section} ${key} → ${value ? "granted" : "revoked"}`,
          meta: { userId, section, key, value: value ? 1 : 0 },
        });
      },
      resetUserPermissions: (userId) => {
        if (get().role !== "admin") return;
        const target = get().users.find((u) => u.id === userId);
        if (!target) return;
        set((s) => ({
          users: s.users.map((u) => (u.id === userId ? { ...u, permissions: defaultPermissionsFor(u.role) } : u)),
        }));
        get().addAuditLog({
          event: "permissions.updated",
          summary: `${target.name} (${target.userCode}): permissions reset to ${target.role} defaults`,
          meta: { userId },
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

      addProgram: (p) => set((s) => ({ programs: [...s.programs, { ...p, id: uid() }] })),

      addCourse: (c) => set((s) => ({ courses: [...s.courses, { ...c, id: uid() }] })),
      updateCourse: (id, patch) =>
        set((s) => ({ courses: s.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeCourse: (id) => set((s) => ({ courses: s.courses.filter((c) => c.id !== id) })),

      addFaculty: (f) => set((s) => ({ faculty: [...s.faculty, { ...f, id: uid() }] })),
      updateFaculty: (id, patch) =>
        set((s) => ({ faculty: s.faculty.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
      removeFaculty: (id) => set((s) => ({ faculty: s.faculty.filter((f) => f.id !== id) })),

      addStudent: (s) => {
        const id = uid();
        set((st) => ({ students: [...st.students, { ...s, id }] }));
        return id;
      },
      updateStudent: (id, patch) =>
        set((s) => ({ students: s.students.map((st) => (st.id === id ? { ...st, ...patch } : st)) })),
      setRoll: (studentId, semester, roll) =>
        set((s) => ({
          students: s.students.map((st) =>
            st.id === studentId ? { ...st, rollNumber: roll } : st,
          ),
        })),
      removeStudent: (id) =>
        set((s) => ({
          students: s.students.filter((st) => st.id !== id),
          charges: s.charges.filter((c) => c.studentId !== id),
          adjustments: s.adjustments.filter((a) => a.studentId !== id),
          payments: s.payments.filter((p) => p.studentId !== id),
        })),

      addCharge: (c) =>
        set((s) => ({ charges: [...s.charges, { ...c, id: uid(), createdAt: now() }] })),
      removeCharge: (id) => set((s) => ({ charges: s.charges.filter((c) => c.id !== id) })),

      addAdjustment: (a) =>
        set((s) => ({ adjustments: [...s.adjustments, { ...a, id: uid(), createdAt: now() }] })),
      removeAdjustment: (id) =>
        set((s) => ({ adjustments: s.adjustments.filter((a) => a.id !== id) })),

      addPayment: (p) => {
        const paidAt = p.paidAt ?? now();
        // Auto-generate reference if none provided.
        const ref = (p.reference?.trim() || nextReceiptNo(paidAt, get().payments, get().receiptFormat));
        const err = validatePaymentInput(
          { amount: p.amount, method: p.method, reference: ref, paidAt },
          get().payments,
        );
        if (err) return { ok: false, error: err };
        const id = uid();
        set((s) => ({
          payments: [...s.payments, { ...p, id, paidAt, reference: ref }],
        }));
        const student = get().students.find((st) => st.id === p.studentId);
        get().addAuditLog({
          event: "payment.collected",
          summary: `Collected ${inr(p.amount)} · ${p.method.toUpperCase()} · ${student?.name ?? p.studentId} (Sem ${p.semester})`,
          studentId: p.studentId,
          meta: { paymentId: id, reference: ref },
        });
        return { ok: true, id, reference: ref };
      },
      removePayment: (id) => set((s) => ({ payments: s.payments.filter((p) => p.id !== id) })),
      voidPayment: (id, reason) => {
        if (!get().can("payments", "edit") || get().role !== "admin")
          return { ok: false, error: "Only admins can void payments" };
        const target = get().payments.find((p) => p.id === id);
        if (!target) return { ok: false, error: "Payment not found" };
        set((s) => ({
          payments: s.payments.map((p) =>
            p.id === id ? { ...p, voided: true, voidedAt: now(), voidReason: reason } : p,
          ),
        }));
        const student = get().students.find((st) => st.id === target.studentId);
        get().addAuditLog({
          event: "payment.voided",
          summary: `Voided ${inr(target.amount)} · ${target.method.toUpperCase()} · ${student?.name ?? target.studentId}${reason ? ` — ${reason}` : ""}`,
          studentId: target.studentId,
          meta: { paymentId: id, reference: target.reference },
        });
        return { ok: true };
      },
      unvoidPayment: (id) => {
        if (get().role !== "admin") return;
        const target = get().payments.find((p) => p.id === id);
        set((s) => ({
          payments: s.payments.map((p) =>
            p.id === id ? { ...p, voided: false, voidedAt: undefined, voidReason: undefined } : p,
          ),
        }));
        if (target) {
          const student = get().students.find((st) => st.id === target.studentId);
          get().addAuditLog({
            event: "payment.unvoided",
            summary: `Reinstated ${inr(target.amount)} · ${target.method.toUpperCase()} · ${student?.name ?? target.studentId}`,
            studentId: target.studentId,
            meta: { paymentId: id, reference: target.reference },
          });
        }
      },

      updatePaymentInfo: (patch) => {
        if (!get().can("settings", "edit")) return { ok: false, error: "You don't have permission to edit payment settings" };
        const before = get().paymentInfo;
        set((s) => ({ paymentInfo: { ...s.paymentInfo, ...patch } }));
        const changed = Object.keys(patch).filter(
          (k) => (patch as Record<string, unknown>)[k] !== (before as Record<string, unknown>)[k],
        );
        get().addAuditLog({
          event: "settings.updated",
          summary: `Payment settings updated (${changed.length} field${changed.length === 1 ? "" : "s"}: ${changed.join(", ") || "no changes"})`,
        });
        return { ok: true };
      },
      resetPaymentInfo: () => {
        if (!get().can("settings", "edit")) return;
        set(() => ({ paymentInfo: COLLEGE_PAYMENT_INFO }));
        get().addAuditLog({ event: "settings.updated", summary: "Payment settings reset to defaults" });
      },

      updateReceiptFormat: (patch) => {
        if (!get().can("settings", "edit")) return { ok: false, error: "You don't have permission" };
        const before = get().receiptFormat;
        const next = { ...before, ...patch };
        if (!next.prefix.trim()) return { ok: false, error: "Prefix is required" };
        if (!next.datePattern.trim()) return { ok: false, error: "Date pattern is required" };
        if (!Number.isFinite(next.counterStart) || next.counterStart < 1) return { ok: false, error: "Counter start must be ≥ 1" };
        set(() => ({ receiptFormat: next }));
        get().addAuditLog({
          event: "settings.updated",
          summary: `Receipt format updated: ${next.prefix}-${next.datePattern}-#### (start ${next.counterStart})`,
        });
        return { ok: true };
      },
      resetReceiptFormat: () => {
        if (!get().can("settings", "edit")) return;
        set(() => ({ receiptFormat: DEFAULT_RECEIPT_FORMAT }));
        get().addAuditLog({ event: "settings.updated", summary: "Receipt format reset to default" });
      },

      addSession: (s) => {
        if (!get().can("settings", "edit")) return "";
        const id = uid();
        set((st) => ({ sessions: [{ ...s, id }, ...st.sessions] }));
        get().addAuditLog({ event: "settings.updated", summary: `Session added: ${s.name} (${s.startDate} → ${s.endDate})` });
        return id;
      },
      updateSession: (id, patch) => {
        if (!get().can("settings", "edit")) return;
        set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
        get().addAuditLog({ event: "settings.updated", summary: `Session ${id} updated` });
      },
      removeSession: (id) => {
        if (!get().can("settings", "edit")) return { ok: false, error: "No permission" };
        if (get().sessions.length <= 1) return { ok: false, error: "At least one session is required" };
        if (get().activeSessionId === id) return { ok: false, error: "Cannot remove the active session" };
        const s = get().sessions.find((x) => x.id === id);
        set((st) => ({ sessions: st.sessions.filter((x) => x.id !== id) }));
        get().addAuditLog({ event: "settings.updated", summary: `Session removed: ${s?.name ?? id}` });
        return { ok: true };
      },
      setActiveSession: (id) => {
        const s = get().sessions.find((x) => x.id === id);
        if (!s) return;
        set(() => ({ activeSessionId: id }));
        get().addAuditLog({ event: "settings.updated", summary: `Active session set to ${s.name}` });
      },

      resetDemo: () =>
        set(() => {
          const fees = seedFees();
          const users = seedUsers();
          const sessions = seedSessions();
          return {
            programs: seedPrograms, courses: seedCourses, faculty: seedFaculty,
            students: seedStudents, paymentInfo: COLLEGE_PAYMENT_INFO,
            receiptFormat: DEFAULT_RECEIPT_FORMAT,
            sessions, activeSessionId: sessions[0].id,
            users, currentUserId: users[0].id, role: "admin",
            ...fees,
          };
        }),
    }),
    { name: "cms-store-v5" },
  ),
);

// ---------- Selectors / helpers ----------
export function semesterSummary(
  studentId: string, semester: number,
  data: Pick<State, "charges" | "adjustments" | "payments"> & { structures?: any[], student?: any },
) {
  const charges = data.charges.filter((c) => c.studentId === studentId && c.semester === semester);
  const adjustments = data.adjustments.filter((a) => a.studentId === studentId && a.semester === semester);
  const payments = data.payments.filter((p) => p.studentId === studentId && p.semester === semester);
  
  // Calculate prescribed base fees from fee_structures for this student's program and semester
  let prescribedFee = 0;
  if (data.structures && data.student) {
    const structs = data.structures.filter(s => s.program_id === data.student.program_id && s.semester === semester);
    prescribedFee = structs.reduce((sum, s) => sum + Number(s.amount), 0);
  }

  const manualCharges = charges.reduce((s, c) => s + c.amount, 0);
  const totalCharged = prescribedFee + manualCharges;

  const totalConcession = adjustments.filter((a) => a.type === "concession").reduce((s, a) => s + a.amount, 0);
  const totalScholarship = adjustments.filter((a) => a.type === "scholarship").reduce((s, a) => s + a.amount, 0);
  const totalAdjustment = totalConcession + totalScholarship;
  const netPayable = totalCharged - totalAdjustment;
  const totalPaid = payments.filter((p) => !p.voided).reduce((s, p) => s + p.amount, 0);
  const balance = netPayable - totalPaid;
  return { charges, adjustments, payments, prescribedFee, manualCharges, totalCharged, totalConcession, totalScholarship, totalAdjustment, netPayable, totalPaid, balance };
}

export function studentTotals(
  studentId: string, currentSemester: number,
  data: Pick<State, "charges" | "adjustments" | "payments"> & { structures?: any[], student?: any },
) {
  let netPayable = 0, totalPaid = 0, balance = 0, totalCharged = 0, totalConcession = 0, totalScholarship = 0;
  const allCharges: any[] = [];
  const allAdjustments: any[] = [];
  const allPayments: any[] = [];
  
  for (let s = 1; s <= currentSemester; s++) {
    const sum = semesterSummary(studentId, s, data);
    netPayable += sum.netPayable; totalPaid += sum.totalPaid; balance += sum.balance;
    totalCharged += sum.totalCharged; totalConcession += sum.totalConcession; totalScholarship += sum.totalScholarship;
    allCharges.push(...sum.charges);
    allAdjustments.push(...sum.adjustments);
    allPayments.push(...sum.payments);
  }
  return { 
    netPayable, totalPaid, balance, totalCharged, totalConcession, totalScholarship,
    charges: allCharges,
    adjustments: allAdjustments,
    payments: allPayments
  };
}

export function formatYear(n: number): string {
  if (n === 1) return "1st Year";
  if (n === 2) return "2nd Year";
  if (n === 3) return "3rd Year";
  return `${n}th Year`;
}

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
