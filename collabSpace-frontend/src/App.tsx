import Shell from "./components/layout/Shell";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProjectsPage from "./pages/ProjectPage";
import TasksPage from "./pages/TasksPage";


const App = () => {
  return (
    <div className="h-screen">
      <Shell>
        <Routes>
          <Route path="/" element={<HomePage  />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/tasks" element={<TasksPage />}/>
        </Routes>
      </Shell>
    </div>
  );
};

export default App;
