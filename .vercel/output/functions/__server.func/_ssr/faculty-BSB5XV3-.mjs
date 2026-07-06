import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { f as useStore, t as Button } from "./store-EDF2LSFL.mjs";
import { t as Input } from "./input-BU0X6Ms0.mjs";
import { t as supabase } from "./supabase-DbG7U5zh.mjs";
import { b as Plus, x as Pencil } from "../_libs/lucide-react.mjs";
import { n as CardContent, t as Card } from "./card-NxxrVLv_.mjs";
import { t as Label } from "./label-CkcRkRu6.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, s as DialogTrigger, t as Dialog } from "./dialog-Dr92FT6G.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/faculty-BSB5XV3-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function FacultyPage() {
	const queryClient = useQueryClient();
	const canEdit = useStore((s) => s.can("faculty", "edit"));
	const { data: faculty = [], isLoading } = useQuery({
		queryKey: ["faculty"],
		queryFn: async () => {
			const { data, error } = await supabase.from("faculty").select("*").order("name");
			if (error) throw error;
			return data;
		}
	});
	const removeFaculty = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("faculty").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["faculty"] });
			toast.success("Removed");
		},
		onError: (e) => toast.error(e.message)
	});
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-8 animate-pulse text-muted-foreground",
		children: "Loading faculty..."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-7xl space-y-6 px-6 py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-end justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-widest text-muted-foreground",
					children: "Administration"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl font-semibold text-foreground",
					children: "Faculty"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: [faculty.length, " members across departments."]
				})
			] }), canEdit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddFacultyDialog, {})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
			children: [faculty.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary",
							children: f.name.split(" ").map((p) => p[0]).slice(0, 2).join("")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium text-foreground",
							children: f.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: f.designation
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditFacultyDialog, {
						faculty: f,
						canEdit,
						onRemove: () => {
							if (confirm(`Remove ${f.name}?`)) removeFaculty.mutate(f.id);
						},
						isRemoving: removeFaculty.isPending
					}) })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 space-y-1 text-xs text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-foreground",
								children: "Dept:"
							}),
							" ",
							f.department
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-foreground",
								children: "Email:"
							}),
							" ",
							f.email
						] }),
						f.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-foreground",
								children: "Phone:"
							}),
							" ",
							f.phone
						] })
					]
				})]
			}) }, f.id)), faculty.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "col-span-full text-muted-foreground text-sm",
				children: "No faculty members found."
			})]
		})]
	});
}
function AddFacultyDialog() {
	const queryClient = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [f, setF] = (0, import_react.useState)({
		name: "",
		email: "",
		department: "",
		designation: "",
		phone: ""
	});
	const addFaculty = useMutation({
		mutationFn: async (fac) => {
			const { error } = await supabase.from("faculty").insert([fac]);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["faculty"] });
			toast.success("Faculty added");
			setOpen(false);
			setF({
				name: "",
				email: "",
				department: "",
				designation: "",
				phone: ""
			});
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-1 h-4 w-4" }), " Add faculty"] })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "font-display",
				children: "Add faculty"
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sm:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: f.name,
							onChange: (e) => setF({
								...f,
								name: e.target.value
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Department" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: f.department,
						onChange: (e) => setF({
							...f,
							department: e.target.value
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Designation" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: f.designation,
						onChange: (e) => setF({
							...f,
							designation: e.target.value
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: f.email,
						onChange: (e) => setF({
							...f,
							email: e.target.value
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: f.phone,
						onChange: (e) => setF({
							...f,
							phone: e.target.value
						})
					})] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				onClick: () => setOpen(false),
				children: "Cancel"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				disabled: addFaculty.isPending,
				onClick: () => {
					if (!f.name.trim()) return toast.error("Name required");
					addFaculty.mutate(f);
				},
				children: "Save"
			})] })
		] })]
	});
}
function EditFacultyDialog({ faculty, canEdit, onRemove, isRemoving }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [f, setF] = (0, import_react.useState)({ ...faculty });
	const editFaculty = useMutation({
		mutationFn: async (fac) => {
			const { id, ...updates } = fac;
			const { error } = await supabase.from("faculty").update(updates).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["faculty"] });
			toast.success("Faculty updated");
			setOpen(false);
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: (o) => {
			setOpen(o);
			if (o) setF({ ...faculty });
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
				children: "Edit faculty"
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sm:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: f.name,
							onChange: (e) => setF({
								...f,
								name: e.target.value
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Department" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: f.department,
						onChange: (e) => setF({
							...f,
							department: e.target.value
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Designation" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: f.designation,
						onChange: (e) => setF({
							...f,
							designation: e.target.value
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: f.email,
						onChange: (e) => setF({
							...f,
							email: e.target.value
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: f.phone,
						onChange: (e) => setF({
							...f,
							phone: e.target.value
						})
					})] })
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
						disabled: editFaculty.isPending,
						onClick: () => {
							if (!f.name.trim()) return toast.error("Name required");
							editFaculty.mutate(f);
						},
						children: "Save changes"
					})]
				})]
			})
		] })]
	});
}
//#endregion
export { FacultyPage as component };
