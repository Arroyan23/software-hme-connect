import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import LandingPage from "./pages/LandingPage";
import TensiPage from "./pages/TensiPage";
import KegiatanPage from "./pages/KegiatanPage";
import AlumniPage from "./pages/AlumniPage";
import Dashboard from "./pages/Dashboard";
import RequireAdmin from "./components/RequireAdmin";
import AuthPage from "./pages/AuthPage";
import MemberRegisterPage from "./pages/MemberRegisterPage";
import MemberLoginPage from "./pages/MemberLoginPage";
import SubmissionPage from "./pages/SubmissionPage";
import ImeConnectPage from "./pages/ImeConnectPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LandingPage },
      { path: "tensi", Component: TensiPage },
      { path: "kegiatan", Component: KegiatanPage },
      { path: "alumni", Component: AlumniPage },
      { path: "dashboard", element: <RequireAdmin><Dashboard /></RequireAdmin> },
      { path: "login", element: <AuthPage key="login" /> },
      { path: "sign-in", element: <AuthPage key="signin" /> },
      { path: "member/login", Component: MemberLoginPage },
      { path: "member/sign-in", Component: MemberLoginPage },
      { path: "register", Component: MemberRegisterPage },
      { path: "sign-up", Component: MemberRegisterPage },
      { path: "admin/register", element: <AuthPage key="admin-register" register adminRegister /> },
      { path: "alumni/kirim", element: <SubmissionPage key="alumni" kind="submit-alumni" /> },
      { path: "daftar-anggota", element: <SubmissionPage key="anggota" kind="anggota" /> },
      { path: "ime-connect", Component: ImeConnectPage },
      { path: "ime-connect/tensi", Component: ImeConnectPage },
      { path: "ime-connect/alumni", Component: ImeConnectPage },
      { path: "ime-connect/network", Component: ImeConnectPage },
      { path: "ime-connect/profil", Component: ImeConnectPage },
    ],
  },
]);
