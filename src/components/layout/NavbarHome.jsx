import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './NavbarHome.module.css';
import { FaBars, FaTimes } from 'react-icons/fa';

/**
 * Renders a responsive, reusable navigation bar for the application.
 */
function Navbar_home({ 
    navLinks, 
    activeSection, 
    scrollToSection, 
    activePage, 
    position = 'sticky', 
    showPattern = true 
}) {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const closeMenu = () => setMenuOpen(false);

    /**
     * Handles clicks on section links, scrolling to the section and closing the mobile menu.
     * @param {string} id - The ID of the target section.
     */
    const handleSectionClick = (id) => {
        if (scrollToSection) {
            scrollToSection(id);
        }
        closeMenu();
    };

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

    // The register button is active on the register page or on the homepage (as a CTA)
    const registerIsActive = !activePage || activePage === 'register';
    const hasNavLinks = navLinks && navLinks.length > 0;

    return (
        <header className={`${styles.navbar} ${styles[position]} ${showPattern ? styles.withPattern : ''}`}>
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

                <nav className={`${styles.navMenu} ${menuOpen ? styles.active : ''} ${!hasNavLinks ? styles.authOnly : ''}`}>
                    <ul className={styles.navMenuItems}>
                        {hasNavLinks && navLinks.map((link) => (
                            <li key={link.id} className={styles.navItem}>
                                <button
                                    onClick={() => handleSectionClick(link.id)}
                                    className={styles.navLink}
                                >
                                    <span className={activeSection === link.id ? styles.activeLink : ''}>
                                        {link.label}
                                    </span>
                                </button>
                            </li>
                        ))}

                        {/* Auth buttons for desktop (in-line) */}
                        <li className={`${styles.navItem} ${styles.navButtonsDesktop}`}>
                            <Link to="/login">
                                <button className={`${styles.button} ${styles.loginButton} ${activePage === 'login' ? styles.active : ''}`}>Login</button>
                            </Link>
                        </li>
                        <li className={`${styles.navItem} ${styles.navButtonsDesktop}`}>
                            <Link to="/register">
                                <button className={`${styles.button} ${styles.registerButton} ${registerIsActive ? styles.active : ''}`}>Register</button>
                            </Link>
                        </li>
                    </ul>

                     {/* Auth buttons for mobile (stacked in menu) */}
                    <div className={styles.navButtonsMobile}>
                        <Link to="/login" className={styles.fullWidthLink} onClick={closeMenu}>
                            <button className={`${styles.button} ${styles.loginButton} ${activePage === 'login' ? styles.active : ''}`}>Login</button>
                        </Link>
                        <Link to="/register" className={styles.fullWidthLink} onClick={closeMenu}>
                            <button className={`${styles.button} ${styles.registerButton} ${registerIsActive ? styles.active : ''}`}>Register</button>
                        </Link>
                    </div>
                </nav>
            </div>
        </header>
    );
}

export default Navbar_home;