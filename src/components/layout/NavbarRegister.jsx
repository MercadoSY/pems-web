import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './NavbarRegister.module.css';
import { FaBars, FaTimes } from 'react-icons/fa';

/**
 * Renders the navigation bar for the registration page.
 */
function Navbar_register() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // Prevent body scroll when the mobile menu is open
  useEffect(() => {
      if (menuOpen) {
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = 'auto';
      }
      // Cleanup function to restore scrolling when component unmounts
      return () => {
          document.body.style.overflow = 'auto';
      };
  }, [menuOpen]);

  return (
    <header className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <Link to="/" className={styles.logoContainer} onClick={closeMenu}>
          <img src="/logo.webp" alt="PEMS Logo" className={styles.logo} />
          <h1 className={styles.title}>
            PEMS<span className={styles.dotcolor}>.</span>
          </h1>
        </Link>

        <div className={styles.menuIcon} onClick={toggleMenu}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </div>
        
        <nav className={`${styles.navMenu} ${menuOpen ? styles.active : ''}`}>
          <div className={styles.navButtons}>
            <Link to="/login" className={styles.fullWidthLink} onClick={closeMenu}>
              <button className={`${styles.button} ${styles.loginButton}`}>Login</button>
            </Link>
            <Link to="/register" className={styles.fullWidthLink} onClick={closeMenu}>
              <button className={`${styles.button} ${styles.registerButton} ${styles.active}`}>Register</button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar_register;