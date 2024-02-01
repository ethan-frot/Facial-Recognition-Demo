import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Step1 from "./pages/Step1";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Step1 />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
