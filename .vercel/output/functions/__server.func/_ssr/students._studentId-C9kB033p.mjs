import { h as createFileRoute, m as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/students._studentId-C9kB033p.js
var $$splitNotFoundComponentImporter = () => import("./students._studentId-CxmqVsva.mjs");
var $$splitComponentImporter = () => import("./students._studentId-CWsOpj2l.mjs");
var Route = createFileRoute("/students/$studentId")({
	head: () => ({ meta: [{ title: "Student profile — Imperial CMS" }] }),
	component: lazyRouteComponent($$splitComponentImporter, "component"),
	notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent")
});
//#endregion
export { Route as t };
