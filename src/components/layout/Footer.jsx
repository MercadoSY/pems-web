import React from 'react';
import styles from './Footer.module.css';
import { FaGithub } from 'react-icons/fa';

/**
 * Renders the footer section for the website.
 */
export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContainer}>
                <div className={styles.footerInfo}>
                    <div className={styles.logoContainer}>
                        <img src="/logo.webp" alt="PEMS Logo" className={styles.logo} />
                        <h2 className={styles.title}>PEMS<span className={styles.dotcolor}>.</span></h2>
                    </div>
                    <p>Revolutionizing poultry farm management through smart IoT solutions.</p>
                    <p className={styles.contact}>Contact us: <a href="mailto:PEMSSupport@gmail.com">PEMSSupport@gmail.com</a></p>
                    <div className={styles.socialLinks}>
                        <a 
                            href="https://github.com/PEMS-project/PEMS" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={styles.socialLink}
                            aria-label="GitHub Repository"
                        >
                            <FaGithub />
                        </a>
                    </div>
                </div>
                <div className={styles.footerCopyright}>
                    <p>&copy; {new Date().getFullYear()} PEMS. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
}