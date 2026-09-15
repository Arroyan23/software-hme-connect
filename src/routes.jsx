import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import LandingPage from "./pages/LandingPage";
import TensiPage from "./pages/TensiPage";
import KegiatanPage from "./pages/KegiatanPage";
import AlumniPage from "./pages/AlumniPage";
import Dashboard from "./pages/Dashboard";
import RequireAdmin from "./components/RequireAdmin";
import AuthPage from "./pages/AuthPage";
import SubmissionPage from "./pages/SubmissionPage";

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
      { path: "register", element: <AuthPage key="register" register /> },
      { path: "sign-up", element: <AuthPage key="signup" register /> },
      { path: "alumni/kirim", element: <SubmissionPage key="alumni" kind="submit-alumni" /> },
      { path: "daftar-anggota", element: <SubmissionPage key="anggota" kind="anggota" /> },
    ],
  },
]);
