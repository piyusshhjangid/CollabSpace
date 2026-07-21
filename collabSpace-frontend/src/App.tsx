import Shell from "./components/layout/Shell";
import HomePage from "./pages/HomePage";

const App = () => {
  return (
    <div className="h-screen">
      <Shell>
        <HomePage/>
      </Shell>
    </div>
  );
};

export default App;
