import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { d as studentTotals, f as useStore, s as inr, t as Button } from "./store-EDF2LSFL.mjs";
import { D as GraduationCap, G as BookOpen, c as TrendingUp, n as Wallet, q as ArrowRight, r as Users, s as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as CardTitle, i as CardHeader, n as CardContent, t as Card } from "./card-NxxrVLv_.mjs";
import { t as Badge } from "./badge-CgHxRd3k.mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D_e7DqTN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Dashboard() {
	const students = useStore((s) => s.students);
	const programs = useStore((s) => s.programs);
	const faculty = useStore((s) => s.faculty);
	const courses = useStore((s) => s.courses);
	const charges = useStore((s) => s.charges);
	const adjustments = useStore((s) => s.adjustments);
	const payments = useStore((s) => s.payments);
	const totals = (0, import_react.useMemo)(() => {
		let netPayable = 0, totalPaid = 0, balance = 0;
		let studentsWithDues = 0;
		students.forEach((st) => {
			const t = studentTotals(st.id, st.currentSemester, {
				charges,
				adjustments,
				payments
			});
			netPayable += t.netPayable;
			totalPaid += t.totalPaid;
			balance += t.balance;
			if (t.balance > 0) studentsWithDues++;
		});
		return {
			netPayable,
			totalPaid,
			balance,
			studentsWithDues
		};
	}, [
		students,
		charges,
		adjustments,
		payments
	]);
	const collectionRate = totals.netPayable ? Math.round(totals.totalPaid / totals.netPayable * 100) : 0;
	const recentPayments = [...payments].sort((a, b) => a.paidAt < b.paidAt ? 1 : -1).slice(0, 6);
	const pending = (0, import_react.useMemo)(() => {
		return students.map((st) => ({
			st,
			totals: studentTotals(st.id, st.currentSemester, {
				charges,
				adjustments,
				payments
			})
		})).filter((r) => r.totals.balance > 0).sort((a, b) => b.totals.balance - a.totals.balance).slice(0, 5);
	}, [
		students,
		charges,
		adjustments,
		payments
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-7xl space-y-8 px-6 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-widest text-muted-foreground",
						children: "Dashboard"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-3xl font-semibold text-foreground",
						children: "Welcome back, Registrar's Office"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: "A snapshot of enrolment, collections and pending dues across all programs."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "outline",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/students",
							children: "Manage students"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/fees",
							children: "Collect fees"
						})
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GraduationCap, { className: "h-4 w-4" }),
						label: "Active students",
						value: students.filter((s) => s.status === "active").length.toString(),
						hint: `${programs.length} programs`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "h-4 w-4" }),
						label: "Fees received",
						value: inr(totals.totalPaid),
						hint: `${collectionRate}% collection rate`,
						tone: "success"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-4 w-4" }),
						label: "Outstanding dues",
						value: inr(totals.balance),
						hint: `${totals.studentsWithDues} students pending`,
						tone: totals.balance > 0 ? "warning" : "default"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-4 w-4" }),
						label: "Net billed",
						value: inr(totals.netPayable),
						hint: "After concessions & scholarships"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "lg:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "flex flex-row items-center justify-between space-y-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "font-display text-lg",
							children: "Top pending dues"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Students with the highest outstanding balance"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							variant: "ghost",
							size: "sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/reports",
								className: "gap-1",
								children: ["See all ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-3.5 w-3.5" })]
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "p-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "divide-y divide-border",
							children: [pending.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "p-6 text-sm text-muted-foreground",
								children: "All students are fully paid."
							}), pending.map(({ st, totals: t }) => {
								const program = programs.find((p) => p.id === st.programId);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/students/$studentId",
									params: { studentId: st.id },
									className: "flex items-center justify-between gap-3 p-4 transition-colors hover:bg-accent/40",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary",
											children: st.name.split(" ").map((p) => p[0]).slice(0, 2).join("")
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-medium text-foreground",
											children: st.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-muted-foreground",
											children: [
												program?.name,
												" · Sem ",
												st.currentSemester,
												" · Roll ",
												st.rolls[st.currentSemester] || "—"
											]
										})] })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-right",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-display text-lg font-semibold text-destructive",
											children: inr(t.balance)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-muted-foreground",
											children: ["Paid ", inr(t.totalPaid)]
										})]
									})]
								}, st.id);
							})]
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "font-display text-lg",
					children: "Recent payments"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: "Last transactions recorded"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "p-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "divide-y divide-border",
						children: [recentPayments.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "p-6 text-sm text-muted-foreground",
							children: "No payments yet."
						}), recentPayments.map((p) => {
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium text-foreground",
									children: students.find((s) => s.id === p.studentId)?.name ?? "Unknown"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[11px] uppercase tracking-wider text-muted-foreground",
									children: [
										"Sem ",
										p.semester,
										" · ",
										p.method
									]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-right",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-semibold text-success",
										children: inr(p.amount)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted-foreground",
										children: new Date(p.paidAt).toLocaleDateString()
									})]
								})]
							}, p.id);
						})]
					})
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniCard, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-4 w-4" }),
						label: "Faculty",
						value: faculty.length,
						to: "/faculty"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniCard, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "h-4 w-4" }),
						label: "Courses",
						value: courses.length,
						to: "/courses"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniCard, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GraduationCap, { className: "h-4 w-4" }),
						label: "Programs offered",
						value: programs.length,
						to: "/students"
					})
				]
			})
		]
	});
}
function StatCard({ icon, label, value, hint, tone = "default" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs uppercase tracking-widest",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-md bg-secondary p-1.5 text-secondary-foreground",
					children: icon
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: `mt-3 font-display text-2xl font-semibold ${tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground"}`,
				children: value
			}),
			hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: hint
			})
		]
	}) });
}
function MiniCard({ icon, label, value, to }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		className: "group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rounded-md bg-primary/10 p-2 text-primary",
				children: icon
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs uppercase tracking-widest text-muted-foreground",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-xl font-semibold text-foreground",
				children: value
			})] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
			variant: "secondary",
			className: "opacity-0 transition-opacity group-hover:opacity-100",
			children: "Open"
		})]
	});
}
//#endregion
export { Dashboard as component };
