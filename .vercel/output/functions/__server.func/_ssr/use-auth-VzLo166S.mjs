import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { I as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as supabase } from "./supabase-DbG7U5zh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-auth-VzLo166S.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AuthContext = (0, import_react.createContext)({
	user: null,
	session: null,
	profile: null,
	isLoading: true,
	signOut: async () => {},
	can: () => false
});
function AuthProvider({ children }) {
	const [user, setUser] = (0, import_react.useState)(null);
	const [session, setSession] = (0, import_react.useState)(null);
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [isLoading, setIsLoading] = (0, import_react.useState)(true);
	const fetchProfile = async (userId) => {
		const { data, error } = await supabase.from("user_roles").select("*").eq("id", userId).single();
		if (!error && data) setProfile(data);
	};
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setUser(session?.user ?? null);
			if (session?.user) fetchProfile(session.user.id).finally(() => setIsLoading(false));
			else setIsLoading(false);
		});
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setUser(session?.user ?? null);
			if (session?.user) {
				setIsLoading(true);
				fetchProfile(session.user.id).finally(() => setIsLoading(false));
			} else {
				setProfile(null);
				setIsLoading(false);
			}
		});
		return () => subscription.unsubscribe();
	}, []);
	const signOut = async () => {
		await supabase.auth.signOut();
	};
	const can = (section, action = "view") => {
		if (!profile) return false;
		if (profile.role === "admin") return true;
		const p = profile.permissions?.[section];
		if (!p) return false;
		return action === "edit" ? p.edit : p.view;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthContext.Provider, {
		value: {
			user,
			session,
			profile,
			isLoading,
			signOut,
			can
		},
		children
	});
}
var useAuth = () => {
	const context = (0, import_react.useContext)(AuthContext);
	if (context === void 0) throw new Error("useAuth must be used within an AuthProvider");
	return context;
};
//#endregion
export { useAuth as n, AuthProvider as t };
