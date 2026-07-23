import SideBar from "./SideBar";
import TopBar from "./TopBar";
import { fakeWorkspaces } from "../../data/workspaces";
import { useState } from "react";
import ProjectPage from "../../pages/ProjectPage";
// import HomePage from "../../pages/HomePage";
// import ProjectCard from "../ProjectCard";


export default function Shell() {
  const [currentWorkspace, setCurrentWorkspace] = useState(fakeWorkspaces[0]);
  return (
    <div className="flex h-screen overflow-hidden">
      <SideBar />

      <div className="flex flex-1 flex-col">
        <TopBar
          currentWorkspace={currentWorkspace}
          setCurrentWorkspace={setCurrentWorkspace}
        />

        <main className="flex-1 overflow-y-auto bg-zinc-100 p-6">
          <ProjectPage/>
        </main>
      </div>
    </div>
  );
}
