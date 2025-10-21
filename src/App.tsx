import AuthModal from "./modals/AuthModal"
import { Route, Routes } from "react-router"
import Dashboard from "./pages/Dashboard"

function App() {

  return (
    <main>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
      {/* Auth modal overlays the current page until user logs in */}
      <AuthModal />
    </main>
  )
}

export default App
