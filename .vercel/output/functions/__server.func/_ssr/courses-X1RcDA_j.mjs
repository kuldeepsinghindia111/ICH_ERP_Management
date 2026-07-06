import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { f as useStore, t as Button } from "./store-EDF2LSFL.mjs";
import { t as Input } from "./input-BU0X6Ms0.mjs";
import { t as supabase } from "./supabase-DbG7U5zh.mjs";
import { b as Plus, x as Pencil } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DRkx8pOP.mjs";
import { n as CardContent, t as Card } from "./card-NxxrVLv_.mjs";
import { t as Label } from "./label-CkcRkRu6.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, s as DialogTrigger, t as Dialog } from "./dialog-Dr92FT6G.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/courses-X1RcDA_j.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CoursesPage() {
	const [programFilter, setProgramFilter] = (0, import_react.useState)("all");
	const canEdit = useStore((s) => s.can("courses", "edit"));
	const queryClient = useQueryClient();
	const { data: programs = [] } = useQuery({
		queryKey: ["programs"],
		queryFn: async () => {
			const { data, error } = await supabase.from("programs").select("*").order("name");
			if (error) throw error;
			return data;
		}
	});
	const { data: courses = [], isLoading } = useQuery({
		queryKey: ["courses"],
		queryFn: async () => {
			const { data, error } = await supabase.from("courses").select("*");
			if (error) throw error;
			return data;
		}
	});
	const removeCourse = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("courses").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["courses"] });
			toast.success("Removed");
		},
		onError: (e) => toast.error(e.message)
	});
	const grouped = (0, import_react.useMemo)(() => {
		const filtered = programFilter === "all" ? courses : courses.filter((c) => c.program_id === programFilter);
		const map = {};
		filtered.forEach((c) => {
			const key = `${c.program_id}::${c.semester}`;
			(map[key] = map[key] ?? []).push(c);
		});
		return map;
	}, [courses, programFilter]);
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-8 animate-pulse text-muted-foreground",
		children: "Loading courses..."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-7xl space-y-6 px-6 py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-end justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-widest text-muted-foreground",
					children: "Academics"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl font-semibold text-foreground",
					children: "Courses"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Program & semester-wise course catalog."
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
					value: programFilter,
					onValueChange: setProgramFilter,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
						className: "w-[180px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: "all",
						children: "All programs"
					}), programs.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
						value: p.id,
						children: p.name
					}, p.id))] })]
				}), canEdit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddCourseDialog, { programs })]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [Object.entries(grouped).length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "No courses yet."
			}), Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([key, list]) => {
				const [pid, sem] = key.split("::");
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "p-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between border-b border-border px-5 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs uppercase tracking-widest text-muted-foreground",
							children: programs.find((p) => p.id === pid)?.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "font-display text-lg font-semibold",
							children: ["Semester ", sem]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [list.length, " courses"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
						className: "w-full text-sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "divide-y divide-border",
							children: list.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-5 py-3 font-mono text-xs text-muted-foreground",
									children: c.code
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-5 py-3 font-medium",
									children: c.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "px-5 py-3 text-right text-muted-foreground",
									children: [c.credits, " cr."]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-5 py-3 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex justify-end gap-1",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditCourseDialog, {
											course: c,
											programs,
											canEdit,
											onRemove: () => removeCourse.mutate(c.id),
											isRemoving: removeCourse.isPending
										})
									})
								})
							] }, c.id))
						})
					})]
				}) }, key);
			})]
		})]
	});
}
function AddCourseDialog({ programs }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [c, setC] = (0, import_react.useState)({
		program_id: programs[0]?.id ?? "",
		semester: 1,
		code: "",
		title: "",
		credits: 4
	});
	const addCourse = useMutation({
		mutationFn: async (course) => {
			const { error } = await supabase.from("courses").insert([course]);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["courses"] });
			toast.success("Course added");
			setOpen(false);
			setC({
				...c,
				code: "",
				title: ""
			});
		},
		onError: (e) => toast.error(e.message)
	});
	const p = programs.find((prog) => prog.id === c.program_id);
	const maxSemesters = p ? p.total_semesters : 8;
	const semOptions = Array.from({ length: maxSemesters }, (_, i) => i + 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " Add course"] })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "font-display",
				children: "Add course"
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Program" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: c.program_id,
						onValueChange: (v) => {
							setC({
								...c,
								program_id: v,
								semester: 1
							});
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: programs.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: p.id,
							children: p.name
						}, p.id)) })]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Semester" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: String(c.semester),
						onValueChange: (v) => setC({
							...c,
							semester: Number(v)
						}),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: semOptions.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
							value: String(n),
							children: ["Semester ", n]
						}, n)) })]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Course code" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: c.code,
						onChange: (e) => setC({
							...c,
							code: e.target.value
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Credits" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						min: 1,
						value: c.credits,
						onChange: (e) => setC({
							...c,
							credits: Number(e.target.value)
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sm:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Title" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: c.title,
							onChange: (e) => setC({
								...c,
								title: e.target.value
							})
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				onClick: () => setOpen(false),
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				disabled: addCourse.isPending,
				onClick: () => {
					if (!c.title.trim() || !c.code.trim()) return toast.error("Code and title required");
					addCourse.mutate(c);
				},
				children: "Save"
			})] })
		] })]
	});
}
function EditCourseDialog({ course, programs, canEdit, onRemove, isRemoving }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [c, setC] = (0, import_react.useState)({ ...course });
	const editCourse = useMutation({
		mutationFn: async (updatedCourse) => {
			const { id, ...updates } = updatedCourse;
			const { error } = await supabase.from("courses").update(updates).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["courses"] });
			toast.success("Course updated");
			setOpen(false);
		},
		onError: (e) => toast.error(e.message)
	});
	const p = programs.find((prog) => prog.id === c.program_id);
	const maxSemesters = p ? p.total_semesters : 8;
	const semOptions = Array.from({ length: maxSemesters }, (_, i) => i + 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: (o) => {
			setOpen(o);
			if (o) setC({ ...course });
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon",
				disabled: !canEdit,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-4 w-4" })
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "font-display",
				children: "Edit course"
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Program" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: c.program_id,
						onValueChange: (v) => {
							setC({
								...c,
								program_id: v,
								semester: 1
							});
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: programs.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: p.id,
							children: p.name
						}, p.id)) })]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Semester" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: String(c.semester),
						onValueChange: (v) => setC({
							...c,
							semester: Number(v)
						}),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: semOptions.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
							value: String(n),
							children: ["Semester ", n]
						}, n)) })]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Course code" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: c.code,
						onChange: (e) => setC({
							...c,
							code: e.target.value
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Credits" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						min: 1,
						value: c.credits,
						onChange: (e) => setC({
							...c,
							credits: Number(e.target.value)
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sm:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Title" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: c.title,
							onChange: (e) => setC({
								...c,
								title: e.target.value
							})
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
				className: "sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "destructive",
					disabled: !canEdit || isRemoving,
					onClick: onRemove,
					children: "Delete"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-end gap-2 mt-2 sm:mt-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => setOpen(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						disabled: editCourse.isPending,
						onClick: () => {
							if (!c.title.trim() || !c.code.trim()) return toast.error("Code and title required");
							editCourse.mutate(c);
						},
						children: "Save changes"
					})]
				})]
			})
		] })]
	});
}
//#endregion
export { CoursesPage as component };
