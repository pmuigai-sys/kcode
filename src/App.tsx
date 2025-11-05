import { Navigate, Route, Routes } from "react-router-dom";

import RootLayout from "./components/layout/RootLayout";
import BuilderPage from "./pages/Builder";
import DashboardPage from "./pages/Dashboard";
import SettingsPage from "./pages/Settings";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="builder">
          <Route index element={<BuilderPage />} />
          <Route path=":projectId" element={<BuilderPage />} />
        </Route>
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
