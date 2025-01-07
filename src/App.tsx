import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import SettingsPage from "./Settings";
import TimerPage from "./Timer";
import Home from "./Home"; 
import "./App.css";
import Hamburger from "./components/Hamburger";
import Navigation from "./components/Navigation";

const App: React.FC = () => {
  const [hamburgerOpen, setHamburgerOpen] = useState<boolean>(false);

  const toggleHamburger = () => {
    setHamburgerOpen(!hamburgerOpen);
  };

  return (
    <Router>
      <div className="app">
        <div className="flex justify-between items-center p-2 absolute w-full">
          <Hamburger isOpen={hamburgerOpen} toggleOpen={toggleHamburger} />
        </div>
        {/* Add the Navigation component here */}
        <Navigation isOpen={hamburgerOpen} toggleOpen={toggleHamburger} />
        <div className="pt-16">
          <Routes>
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/timer" element={<TimerPage />} />
            <Route path="/" element={<Home />} />{" "}
            {/* Added home route */}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
