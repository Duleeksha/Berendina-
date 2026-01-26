import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {currentYear} Berendina Development Services. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
