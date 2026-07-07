import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { r as cn, t as Button } from "./button-PwNqyxv_.mjs";
import { R as ChevronsUpDown, V as Check, m as Search, t as X } from "../_libs/lucide-react.mjs";
import { i as Trigger, n as Portal, r as Root2, t as Content2 } from "../_libs/@radix-ui/react-popover+[...].mjs";
import { l as useStore } from "./store-C_QBvN_m.mjs";
import { t as _e } from "../_libs/cmdk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/student-autosuggest-B8luhh8O.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Command$1 = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e, {
	ref,
	className: cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className),
	...props
}));
Command$1.displayName = _e.displayName;
var CommandInput = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
	className: "flex items-center border-b px-3",
	"cmdk-input-wrapper": "",
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "mr-2 h-4 w-4 shrink-0 opacity-50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Input, {
		ref,
		className: cn("flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50", className),
		...props
	})]
}));
CommandInput.displayName = _e.Input.displayName;
var CommandList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.List, {
	ref,
	className: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className),
	...props
}));
CommandList.displayName = _e.List.displayName;
var CommandEmpty = import_react.forwardRef((props, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Empty, {
	ref,
	className: "py-6 text-center text-sm",
	...props
}));
CommandEmpty.displayName = _e.Empty.displayName;
var CommandGroup = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Group, {
	ref,
	className: cn("overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground", className),
	...props
}));
CommandGroup.displayName = _e.Group.displayName;
var CommandSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Separator, {
	ref,
	className: cn("-mx-1 h-px bg-border", className),
	...props
}));
CommandSeparator.displayName = _e.Separator.displayName;
var CommandItem = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Item, {
	ref,
	className: cn("relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", className),
	...props
}));
CommandItem.displayName = _e.Item.displayName;
var CommandShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("ml-auto text-xs tracking-widest text-muted-foreground", className),
		...props
	});
};
CommandShortcut.displayName = "CommandShortcut";
var Popover = Root2;
var PopoverTrigger = Trigger;
var PopoverContent = import_react.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	align,
	sideOffset,
	className: cn("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)", className),
	...props
}) }));
PopoverContent.displayName = Content2.displayName;
/**
* Auto-suggest combobox for picking a student by name, admission no. or roll.
* `value` is a studentId or null (= "all students").
*/
function StudentAutosuggest({ value, onChange, placeholder = "All students", className }) {
	const students = useStore((s) => s.students);
	const programs = useStore((s) => s.programs);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [query, setQuery] = (0, import_react.useState)("");
	const [debouncedQuery, setDebouncedQuery] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		const t = setTimeout(() => setDebouncedQuery(query), 180);
		return () => clearTimeout(t);
	}, [query]);
	const selected = value ? students.find((s) => s.id === value) ?? null : null;
	const matches = (0, import_react.useMemo)(() => {
		const t = debouncedQuery.trim().toLowerCase();
		return (t ? students.filter((s) => s.name.toLowerCase().includes(t) || s.admissionNo.toLowerCase().includes(t) || Object.values(s.rolls).some((r) => r.toLowerCase().includes(t))) : students).slice(0, 8);
	}, [students, debouncedQuery]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: "outline",
				role: "combobox",
				"aria-expanded": open,
				className: cn("w-full justify-between font-normal", className),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: cn("flex min-w-0 items-center gap-2 truncate", !selected && "text-muted-foreground"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-3.5 w-3.5 shrink-0" }), selected ? `${selected.name} · ${selected.admissionNo}` : placeholder]
				}), selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
					className: "h-3.5 w-3.5 opacity-60 hover:opacity-100",
					onClick: (e) => {
						e.stopPropagation();
						onChange(null);
					}
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronsUpDown, { className: "h-3.5 w-3.5 opacity-60" })]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverContent, {
			className: "w-[320px] p-0",
			align: "start",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Command$1, {
				shouldFilter: false,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandInput, {
					placeholder: "Search by name, admission no. or roll…",
					value: query,
					onValueChange: setQuery
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandList, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandEmpty, { children: "No students found." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandGroup, { children: matches.map((s) => {
					const prog = programs.find((p) => p.id === s.programId);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CommandItem, {
						value: s.id,
						onSelect: () => {
							onChange(s.id);
							setOpen(false);
							setQuery("");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: cn("mr-2 h-4 w-4", value === s.id ? "opacity-100" : "opacity-0") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 flex-col",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate text-sm",
								children: s.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "truncate text-xs text-muted-foreground",
								children: [
									s.admissionNo,
									" · ",
									prog?.code,
									" · Sem ",
									s.currentSemester
								]
							})]
						})]
					}, s.id);
				}) })] })]
			})
		})]
	});
}
//#endregion
export { StudentAutosuggest as t };
