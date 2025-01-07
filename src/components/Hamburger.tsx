import React from 'react';

interface HamburgerProps {
    isOpen: boolean;
    toggleOpen: () => void;
}

const Hamburger: React.FC<HamburgerProps> = ({ isOpen, toggleOpen }) => {
    return (
        <button 
            onClick={toggleOpen} 
            className="relative h-10 w-10 focus:outline-none group"
            aria-label={isOpen ? "Close menu" : "Open menu"}
        >
            <div className="absolute top-1/2 left-1/2 w-6 -translate-x-3/4 -translate-y-1/2">
                {/* Top line */}
                <span 
                    className={`absolute h-0.5 w-6 bg-gray-600 transform transition-all duration-300 ease-in-out
                        ${isOpen ? 'rotate-45 translate-y-0' : '-translate-y-2'}`}
                />
                
                {/* Middle line */}
                <span 
                    className={`absolute h-0.5 w-6 bg-gray-600 transform transition-all duration-300 ease-in-out
                        ${isOpen ? 'opacity-0' : 'opacity-100'}`}
                />
                
                {/* Bottom line */}
                <span 
                    className={`absolute h-0.5 w-6 bg-gray-600 transform transition-all duration-300 ease-in-out
                        ${isOpen ? '-rotate-45 translate-y-0' : 'translate-y-2'}`}
                />
            </div>
        </button>
    );
};

export default Hamburger;