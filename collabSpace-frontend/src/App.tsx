import Shell from "./components/layout/Shell";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProjectsPage from "./pages/ProjectPage";


const App = () => {
  return (
    <div className="h-screen">
      <Shell>
        <Routes>
          <Route path="/" element={<HomePage  />} />
          <Route path="/projects" element={<ProjectsPage />} />
        </Routes>
      </Shell>
    </div>
  );
};

export default App;
