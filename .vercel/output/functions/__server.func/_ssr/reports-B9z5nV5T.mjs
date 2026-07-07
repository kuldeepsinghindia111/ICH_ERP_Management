import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Button } from "./button-PwNqyxv_.mjs";
import { t as Input } from "./input-uzm9g8Y7.mjs";
import { t as supabase } from "./supabase-DbG7U5zh.mjs";
import { U as CalendarRange, y as Printer } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DamjaduW.mjs";
import { t as Label } from "./label-BeT0bXvu.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, t as Card } from "./card-C5Nmk_bj.mjs";
import { t as Badge } from "./badge-B3f60TId.mjs";
import { c as studentTotals, i as inr, l as useStore, s as semesterSummary, t as FEE_HEADS } from "./store-C_QBvN_m.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reports-B9z5nV5T.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Reports() {
	const { can } = useAuth();
	const canExport = can("reports", "edit");
	const paymentInfo = useStore((s) => s.paymentInfo);
	const { data: students = [] } = useQuery({
		queryKey: ["students"],
		queryFn: async () => {
			const { data } = await supabase.from("students").select("*");
			return (data || []).map((s) => ({
				...s,
				programId: s.program_id,
				currentSemester: s.current_semester,
				joinedYear: s.joined_year,
				bloodGroup: s.blood_group
			}));
		}
	});
	const { data: programs = [] } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { data } = await supabase.from("programs").select("*");
			return (data || []).map((p) => ({
				...p,
				totalSemesters: p.total_semesters
			}));
		}
	});
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
	const { data: sessions = [] } = useQuery({
		queryKey: ["sessions"],
		queryFn: async () => {
			const { data } = await supabase.from("sessions").select("*");
			return (data || []).map((s) => ({
				...s,
				startDate: s.start_date,
				endDate: s.end_date
			}));
		}
	});
	const { data: collegeSettings } = useQuery({
		queryKey: ["collegeSettings"],
		queryFn: async () => {
			const { data } = await supabase.from("college_settings").select("*").single();
			return data;
		}
	});
	const activeSessionId = collegeSettings?.active_session_id || "all";
	const [program, setProgram] = (0, import_react.useState)("all");
	const [sem, setSem] = (0, import_react.useState)("all");
	const [selectedSessionId, setSessionId] = (0, import_react.useState)(null);
	const sessionId = selectedSessionId !== null ? selectedSessionId : activeSessionId;
	const [month, setMonth] = (0, import_react.useState)("all");
	const [year, setYear] = (0, import_react.useState)("all");
	const [from, setFrom] = (0, import_react.useState)("");
	const [to, setTo] = (0, import_react.useState)("");
	const years = (0, import_react.useMemo)(() => {
		const s = /* @__PURE__ */ new Set();
		payments.forEach((p) => s.add(String(new Date(p.paidAt).getFullYear())));
		return Array.from(s).sort((a, b) => Number(b) - Number(a));
	}, [payments]);
	const filteredReceipts = (0, import_react.useMemo)(() => {
		const session = sessions.find((s) => s.id === sessionId);
		return payments.filter((p) => !p.voided).filter((p) => {
			const st = students.find((s) => s.id === p.studentId);
			if (!st) return false;
			if (program !== "all" && st.programId !== program) return false;
			if (sem !== "all" && p.semester !== Number(sem)) return false;
			const d = new Date(p.paidAt);
			if (session) {
				const dISO = d.toISOString().slice(0, 10);
				if (dISO < session.startDate || dISO > session.endDate) return false;
			}
			if (month !== "all" && d.getMonth() + 1 !== Number(month)) return false;
			if (year !== "all" && d.getFullYear() !== Number(year)) return false;
			if (from && d.toISOString().slice(0, 10) < from) return false;
			if (to && d.toISOString().slice(0, 10) > to) return false;
			return true;
		}).sort((a, b) => a.paidAt < b.paidAt ? 1 : -1);
	}, [
		payments,
		students,
		sessions,
		sessionId,
		program,
		sem,
		month,
		year,
		from,
		to
	]);
	const pending = (0, import_react.useMemo)(() => {
		const rows = [];
		students.forEach((st) => {
			if (program !== "all" && st.programId !== program) return;
			for (let s = 1; s <= st.currentSemester; s++) {
				if (sem !== "all" && s !== Number(sem)) continue;
				const sum = semesterSummary(st.id, s, {
					charges,
					adjustments,
					payments
				});
				if (sum.balance > 0) rows.push({
					st,
					semester: s,
					balance: sum.balance
				});
			}
		});
		return rows.sort((a, b) => b.balance - a.balance);
	}, [
		students,
		charges,
		adjustments,
		payments,
		program,
		sem
	]);
	const byHead = (0, import_react.useMemo)(() => {
		const m = {};
		charges.forEach((c) => {
			m[c.head] = (m[c.head] ?? 0) + c.amount;
		});
		return FEE_HEADS.map((h) => ({
			...h,
			total: m[h.key] ?? 0
		})).filter((x) => x.total > 0);
	}, [charges]);
	const totals = (0, import_react.useMemo)(() => {
		let billed = 0, paid = 0, balance = 0;
		students.forEach((st) => {
			const t = studentTotals(st.id, st.currentSemester, {
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
	const receiptsTotal = (0, import_react.useMemo)(() => filteredReceipts.reduce((s, p) => s + p.amount, 0), [filteredReceipts]);
	const exportCsv = () => {
		const rows = ["Date,Receipt No,Student,Admission,Program,Semester,Method,Amount"];
		filteredReceipts.forEach((p) => {
			const st = students.find((s) => s.id === p.studentId);
			const prog = programs.find((pr) => pr.id === st?.programId);
			rows.push([
				new Date(p.paidAt).toLocaleDateString(),
				p.reference ?? "",
				st?.name ?? "",
				st?.admissionNo ?? "",
				prog?.name ?? "",
				p.semester,
				p.method,
				p.amount
			].join(","));
		});
		const blob = new Blob([rows.join("\n")], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `receipts.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};
	const printReceipts = () => {
		const rows = filteredReceipts.map((p) => {
			const st = students.find((s) => s.id === p.studentId);
			const prog = programs.find((pr) => pr.id === st?.programId);
			return `<tr>
        <td>${new Date(p.paidAt).toLocaleDateString()}</td>
        <td style="font-family:monospace">${p.reference ?? ""}</td>
        <td>${st?.name ?? ""}<br/><span style="color:#666;font-size:11px">${st?.admissionNo ?? ""}</span></td>
        <td>${prog?.name ?? ""}</td>
        <td>Sem ${p.semester}</td>
        <td style="text-transform:uppercase">${p.method}</td>
        <td style="text-align:right">₹ ${p.amount.toLocaleString("en-IN")}</td>
      </tr>`;
		}).join("");
		const filterLine = [
			program !== "all" && `Program: ${programs.find((pp) => pp.id === program)?.name}`,
			sem !== "all" && `Semester: ${sem}`,
			sessions.find((s) => s.id === sessionId) && `Session: ${sessions.find((s) => s.id === sessionId)?.name}`,
			month !== "all" && `Month: ${month}`,
			year !== "all" && `Year: ${year}`,
			from && `From: ${from}`,
			to && `To: ${to}`
		].filter(Boolean).join(" · ") || "All receipts";
		const html = `<!doctype html><html><head><title>Receipts report</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:24px;color:#111}
        h1{font-size:20px;margin:0 0 4px}
        .meta{color:#555;font-size:12px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{padding:6px 8px;border-bottom:1px solid #e5e5e5;text-align:left;vertical-align:top}
        th{background:#f5f5f5;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#555}
        tfoot td{font-weight:600;border-top:2px solid #111;border-bottom:none}
      </style></head><body>
      <h1>${paymentInfo.collegeName} — Receipts report</h1>
      <div class="meta">${filterLine} · Generated ${(/* @__PURE__ */ new Date()).toLocaleString()}</div>
      <table>
        <thead><tr>
          <th>Date</th><th>Receipt no</th><th>Student</th><th>Program</th>
          <th>Sem</th><th>Method</th><th style="text-align:right">Amount</th>
        </tr></thead>
        <tbody>${rows || `<tr><td colspan="7" style="text-align:center;color:#888;padding:24px">No receipts for these filters.</td></tr>`}</tbody>
        <tfoot><tr><td colspan="6" style="text-align:right">Total (${filteredReceipts.length} receipts)</td>
          <td style="text-align:right">₹ ${receiptsTotal.toLocaleString("en-IN")}</td></tr></tfoot>
      </table>
      <script>window.onload=()=>{window.print();}<\/script>
      </body></html>`;
		const w = window.open("", "_blank");
		if (!w) return;
		w.document.write(html);
		w.document.close();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-7xl space-y-6 px-6 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-widest text-muted-foreground",
					children: "Reports"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl font-semibold text-foreground",
					children: "Collections & pending dues"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Snapshot of what's been received and what's outstanding. Filter receipts and print."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Total billed",
						value: inr(totals.billed)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Total received",
						value: inr(totals.paid),
						tone: "success"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tile, {
						label: "Total pending",
						value: inr(totals.balance),
						tone: "warning"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
				className: "flex flex-row items-center justify-between space-y-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
					className: "font-display text-lg flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarRange, { className: "h-4 w-4" }), " Receipts — filter by date / class / semester / month / year / session"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [
						filteredReceipts.length,
						" receipts · total ",
						inr(receiptsTotal)
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-end gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							onClick: exportCsv,
							disabled: !canExport || filteredReceipts.length === 0,
							title: !canExport ? "You don't have permission to export reports" : void 0,
							children: "Export CSV"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							onClick: printReceipts,
							disabled: !canExport || filteredReceipts.length === 0,
							title: !canExport ? "You don't have permission to print receipts" : void 0,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "mr-1 h-4 w-4" }), " Print receipts"]
						})]
					}), !canExport && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-muted-foreground",
						children: "Read-only role · export & print disabled"
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "space-y-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs",
							children: "Session"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: sessionId,
							onValueChange: setSessionId,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "__none",
								children: "Any (ignore session)"
							}), sessions.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: s.id,
								children: s.name
							}, s.id))] })]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs",
							children: "Class / program"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: program,
							onValueChange: setProgram,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "all",
								children: "All programs"
							}), programs.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: p.id,
								children: p.name
							}, p.id))] })]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs",
							children: "Semester"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: sem,
							onValueChange: setSem,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
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
								children: ["Sem ", n]
							}, n))] })]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs",
								children: "Month"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: month,
								onValueChange: setMonth,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "all",
									children: "All"
								}), [
									"Jan",
									"Feb",
									"Mar",
									"Apr",
									"May",
									"Jun",
									"Jul",
									"Aug",
									"Sep",
									"Oct",
									"Nov",
									"Dec"
								].map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: String(i + 1),
									children: m
								}, m))] })]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs",
								children: "Year"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: year,
								onValueChange: setYear,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "all",
									children: "All"
								}), years.map((y) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: y,
									children: y
								}, y))] })]
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs",
							children: "From date"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							value: from,
							onChange: (e) => setFrom(e.target.value)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs",
							children: "To date"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							value: to,
							onChange: (e) => setTo(e.target.value)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-end",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "sm",
								onClick: () => {
									setProgram("all");
									setSem("all");
									setSessionId(activeSessionId);
									setMonth("all");
									setYear("all");
									setFrom("");
									setTo("");
								},
								children: "Reset filters"
							})
						})
					]
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "p-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-h-[480px] overflow-y-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "sticky top-0 bg-muted/70 text-left text-xs uppercase tracking-widest text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-2 font-medium",
									children: "Date"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-2 font-medium",
									children: "Receipt no"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-2 font-medium",
									children: "Student"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-2 font-medium",
									children: "Program"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-2 font-medium",
									children: "Sem"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-2 font-medium",
									children: "Method"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-2 text-right font-medium",
									children: "Amount"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
							className: "divide-y divide-border",
							children: [filteredReceipts.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 7,
								className: "p-6 text-center text-muted-foreground",
								children: "No receipts for these filters."
							}) }), filteredReceipts.slice(0, 200).map((p) => {
								const st = students.find((s) => s.id === p.studentId);
								const prog = programs.find((pr) => pr.id === st?.programId);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-2 text-muted-foreground",
										children: new Date(p.paidAt).toLocaleDateString()
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-2 font-mono text-xs",
										children: p.reference ?? "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-4 py-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: st?.name ?? "—" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: st?.admissionNo
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-2",
										children: prog?.name ?? "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-4 py-2",
										children: ["Sem ", p.semester]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-2 uppercase text-xs",
										children: p.method
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-2 text-right text-success",
										children: inr(p.amount)
									})
								] }, p.id);
							})]
						})]
					})
				})
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "font-display text-lg",
				children: "Pending fees"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted-foreground",
				children: [pending.length, " semester entries with dues (respects program / semester filters)."]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "p-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-h-[420px] overflow-y-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "sticky top-0 bg-muted/70 text-left text-xs uppercase tracking-widest text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-2 font-medium",
									children: "Student"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-2 font-medium",
									children: "Sem"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-2 text-right font-medium",
									children: "Balance"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "px-4 py-2" })
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
							className: "divide-y divide-border",
							children: [pending.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 4,
								className: "p-6 text-center text-muted-foreground",
								children: "No pending dues."
							}) }), pending.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-4 py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium",
										children: r.st.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted-foreground",
										children: [
											programs.find((p) => p.id === r.st.programId)?.name,
											" · ",
											r.st.admissionNo
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-4 py-2",
									children: ["Sem ", r.semester]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-2 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "destructive",
										children: inr(r.balance)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-2 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										variant: "ghost",
										size: "sm",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/students/$studentId",
											params: { studentId: r.st.id },
											children: "Open"
										})
									})
								})
							] }, r.st.id + "-" + r.semester))]
						})]
					})
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "font-display text-lg",
				children: "Charges by fee head"
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
				children: byHead.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between rounded-md border border-border bg-card p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm text-muted-foreground",
						children: h.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-lg font-semibold",
						children: inr(h.total)
					})]
				}, h.key))
			}) })] })
		]
	});
}
function Tile({ label, value, tone = "default" }) {
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
export { Reports as component };
