import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { a as cn, s as inr } from "./store-EDF2LSFL.mjs";
import { t as require_jspdf_node_min } from "../_libs/jspdf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/textarea-B1XRb62j.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_jspdf_node_min = /* @__PURE__ */ __toESM(require_jspdf_node_min());
function generateReceiptPdf(data) {
	const doc = new import_jspdf_node_min.default({
		unit: "pt",
		format: "a5",
		orientation: "portrait"
	});
	const W = doc.internal.pageSize.getWidth();
	let y = 40;
	doc.setFont("helvetica", "bold");
	doc.setFontSize(16);
	doc.text(data.college.collegeName, W / 2, y, { align: "center" });
	y += 18;
	doc.setFont("helvetica", "normal");
	doc.setFontSize(9);
	doc.text("Official Fee Payment Receipt", W / 2, y, { align: "center" });
	y += 8;
	doc.setDrawColor(180);
	doc.line(30, y, W - 30, y);
	y += 20;
	doc.setFontSize(9);
	const ref = data.payment.reference || data.payment.id || "—";
	const dt = new Date(data.payment.paidAt).toLocaleString();
	doc.text(`Receipt No: ${ref}`, 30, y);
	doc.text(`Date: ${dt}`, W - 30, y, { align: "right" });
	y += 20;
	doc.setFont("helvetica", "bold");
	doc.text("Student", 30, y);
	doc.setFont("helvetica", "normal");
	y += 14;
	[
		["Name", data.student.name],
		["Admission No.", data.student.admissionNo],
		...data.student.rollNo ? [["Roll No.", data.student.rollNo]] : [],
		...data.program ? [["Program", `${data.program.name} (${data.program.code})`]] : [],
		["Semester", `Semester ${data.semester}`]
	].forEach(([k, v]) => {
		doc.setTextColor(120);
		doc.text(k, 30, y);
		doc.setTextColor(20);
		doc.text(String(v), 130, y);
		y += 14;
	});
	y += 8;
	doc.setDrawColor(220);
	doc.line(30, y, W - 30, y);
	y += 18;
	doc.setFont("helvetica", "bold");
	doc.text("Payment", 30, y);
	doc.setFont("helvetica", "normal");
	y += 14;
	[
		["Method", data.payment.method.toUpperCase()],
		["Reference", ref],
		...data.payment.note ? [["Note", data.payment.note]] : []
	].forEach(([k, v]) => {
		doc.setTextColor(120);
		doc.text(k, 30, y);
		doc.setTextColor(20);
		const wrapped = doc.splitTextToSize(String(v), W - 160);
		doc.text(wrapped, 130, y);
		y += 14 * wrapped.length;
	});
	y += 6;
	doc.setFillColor(15, 33, 71);
	doc.rect(30, y, W - 60, 46, "F");
	doc.setTextColor(255);
	doc.setFont("helvetica", "normal");
	doc.setFontSize(9);
	doc.text("Amount received", 44, y + 18);
	doc.setFont("helvetica", "bold");
	doc.setFontSize(18);
	doc.text(inr(data.payment.amount), W - 44, y + 30, { align: "right" });
	y += 66;
	doc.setTextColor(20);
	doc.setFont("helvetica", "normal");
	doc.setFontSize(8);
	doc.text(`Credited to: ${data.college.accountName} · ${data.college.bankName} · A/c ${data.college.accountNumber} · IFSC ${data.college.ifsc}`, 30, y, { maxWidth: W - 60 });
	y += 24;
	doc.setTextColor(120);
	doc.setFontSize(7);
	doc.text(`Support: ${data.college.supportEmail} · ${data.college.supportPhone}`, 30, y);
	y += 10;
	doc.text("This is a system-generated receipt.", 30, y);
	return doc;
}
function downloadReceiptPdf(data) {
	const doc = generateReceiptPdf(data);
	const safe = data.student.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
	doc.save(`receipt-${safe}-sem${data.semester}-${(data.payment.reference || Date.now()).toString()}.pdf`);
}
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
//#endregion
export { downloadReceiptPdf as n, generateReceiptPdf as r, Textarea as t };
