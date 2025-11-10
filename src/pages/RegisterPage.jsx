import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar_home from '../components/layout/NavbarHome';
import Footer from '../components/layout/Footer';
import PaymentGatewayModal from '../components/modals/PaymentGatewayModal';
import styles from '../styles/RegisterPage.module.css';

const receipt = {
    items: [
        { name: 'PEMS Platform Subscription', amount: 49.99 },
    ],
    total: 49.99,
};

/**
 * Renders the user registration page with a multi-step payment modal.
 */
export default function RegisterPage() {
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const navigate = useNavigate();

    useEffect(() => {
        // Manually control scroll restoration to ensure page loads at the top.
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);

        // Restore default browser behavior on component unmount.
        return () => {
            if ('scrollRestoration' in window.history) {
                window.history.scrollRestoration = 'auto';
            }
        };
    }, []);

    /**
     * Handles changes in form input fields.
     * @param {React.ChangeEvent<HTMLInputElement>} e - The event object.
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    /**
     * Handles form submission, validates passwords, and opens the payment modal.
     * @param {React.FormEvent<HTMLFormElement>} e - The event object.
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        // In a real app, you would submit registration data to a server here.
        console.log("Form data submitted:", formData);
        setShowModal(true);
    };

    /**
     * Closes the payment modal.
     */
    const closeModal = () => {
        setShowModal(false);
    };

    /**
     * Finalizes the process after successful payment and navigates to the login page.
     */
    const handlePaymentSuccess = () => {
        setShowModal(false);
        // In a real app, you might show a success message before redirecting.
        navigate('/login');
    };

    return (
        <div className={styles.pageContainer}>
            <Navbar_home activePage="register" position="absolute" showPattern={true} />
            <main className={styles.content}>
                <form className={styles.registerForm} onSubmit={handleSubmit}>
                    <h2>Create Your PEMS Account</h2>
                    <p>Start managing your poultry farm with smart technology today.</p>

                    <div className={styles.inputGroup}>
                        <label htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            name="name"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            placeholder="Enter a strong password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength="8"
                        />
                    </div>
                    
                    <div className={styles.inputGroup}>
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            name="confirmPassword"
                            placeholder="Re-enter your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit">Create Account & Proceed to Payment</button>
                </form>
            </main>

            {showModal && (
                <PaymentGatewayModal
                    receiptData={receipt}
                    closeModal={closeModal}
                    onClose={() => setShowModal(false)}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}
            <Footer />
        </div>
    )
}