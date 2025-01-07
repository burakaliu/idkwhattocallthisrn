import React from 'react';
import { Link } from 'react-router-dom';

interface NavigationProps {
  isOpen: boolean;
  toggleOpen: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ isOpen, toggleOpen }) => {
  return (
    <>
      {/* Overlay that appears behind the navigation menu */}
      <div 
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleOpen}
      />
      
      {/* Navigation menu */}
      <nav 
        className={`fixed top-0 left-0 h-full w-64 bg-gray-50 shadow-lg transform transition-transform duration-300 z-40 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col gap-6">
          <Link 
            to="/" 
            className="text-lg font-medium hover:text-blue-600 transition-colors"
            onClick={toggleOpen}
          >
            Home
          </Link>
          <Link 
            to="/timer" 
            className="text-lg font-medium hover:text-blue-600 transition-colors"
            onClick={toggleOpen}
          >
            Timer
          </Link>
          <Link 
            to="/settings" 
            className="text-lg font-medium hover:text-blue-600 transition-colors"
            onClick={toggleOpen}
          >
            Settings
          </Link>
        </div>
      </nav>
    </>
  );
};

export default Navigation;