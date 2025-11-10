import React, { useState } from 'react';
import { Outlet, useOutletContext, useLocation } from 'react-router-dom';
import { Header, Footer } from './HeaderFooter';
import styles from '../../styles/RegisterPage.module.css'; // Using for pageContainer style

/**
 * Provides a consistent layout (Header, Footer) for specific public-facing pages.
 * It intelligently manages header properties based on the current route.
 */
export default function HeaderFooterLayout() {
    const [dynamicHeaderProps, setDynamicHeaderProps] = useState({});
    const location = useLocation();

    // Define static props for non-landing pages based on the current path
    let staticHeaderProps = {};
    if (location.pathname === '/register') {
        staticHeaderProps = { activePage: 'register', position: 'absolute', showPattern: true };
    } else {
        // Default props for LandingPage (/home)
        staticHeaderProps = { position: 'sticky', showPattern: true };
    }

    // Combine static props with dynamic props from the child page (e.g., LandingPage)
    const finalHeaderProps = { ...staticHeaderProps, ...dynamicHeaderProps };
    
    // The page container helps maintain consistent structure for pages like Register
    const isSimplePage = location.pathname === '/register';

    return (
        <div className={isSimplePage ? styles.pageContainer : ''}>
            <Header {...finalHeaderProps} />
            <Outlet context={{ setHeaderProps: setDynamicHeaderProps }} />
            <Footer />
        </div>
    );
}

/**
 * A custom hook to access the layout's context, simplifying child component logic.
 * @returns {{setHeaderProps: React.Dispatch<React.SetStateAction<{}>>}}
 */
export const useHeaderFooterLayout = () => useOutletContext();