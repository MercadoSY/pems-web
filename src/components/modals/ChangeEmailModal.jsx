// src/components/modals/ChangeEmailModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './ChangeEmailModal.module.css';
import NotificationModal from './NotificationModal';
import { sendEmailChangeVerification } from '../../firebase/authentication';

/**
 * A modal dialog for users to change their account email address via a two-step verification process.
 */
const ChangeEmailModal = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState('enterEmail'); // 'enterEmail' or 'enterCode'
  const [newEmail, setNewEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'info', title: '' });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal is opened
      setStep('enterEmail');
      setNewEmail('');
      setVerificationCode('');
      setCurrentPassword('');
      setIsSubmitting(false);
      setIsPasswordVisible(false);
    }
  }, [isOpen]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      setNotification({ isOpen: true, title: "Validation Error", message: "Please enter a valid email address.", type: "error" });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await sendEmailChangeVerification(newEmail);
      setNotification({ isOpen: true, title: "Code Sent", message: result.message, type: "success" });
      setStep('enterCode');
    } catch (error) {
      setNotification({ isOpen: true, title: "Error", message: error.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode || !currentPassword) {
      setNotification({ isOpen: true, title: "Validation Error", message: "Please enter the verification code and your current password.", type: "error" });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(currentPassword, newEmail, verificationCode);
      // Success is handled by the parent component, which will close the modal.
    } catch (error) {
      setNotification({ isOpen: true, title: "Update Failed", message: error.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ isOpen: false, message: '', type: 'info', title: '' });
  };
  
  const handleBack = () => {
    setStep('enterEmail');
    setVerificationCode('');
    setCurrentPassword('');
  };

  if (!isOpen) return null;

  const renderEnterEmailStep = () => (
    <form onSubmit={handleSendCode} autoComplete="off">
      <div className={styles.modalHeader}>
        <h5 className={styles.modalTitle}>Change Email Address (Step 1 of 2)</h5>
        <button type="button" className={styles.closeButton} onClick={onClose} disabled={isSubmitting} aria-label="Close">×</button>
      </div>
      <div className={styles.modalBody}>
        <p className="text-muted small mb-3">Enter your new email address. We will send a verification code to confirm you have access to it.</p>
        <div className="mb-3">
          <label htmlFor="newEmail" className="form-label">New Email Address</label>
          <div className="input-group">
            <span className="input-group-text"><i className="bi bi-envelope-at"></i></span>
            <input
              type="email"
              className="form-control"
              id="newEmail"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="name@example.com"
            />
          </div>
        </div>
        {isSubmitting && <div className="text-center my-3"><div className="spinner-border text-primary spinner-border-sm" role="status"></div><span className="ms-2">Sending code...</span></div>}
      </div>
      <div className={styles.modalActions}>
        <button type="button" className={`${styles.btn} ${styles.btnCancel}`} onClick={onClose} disabled={isSubmitting}>Cancel</button>
        <button type="submit" className={`${styles.btn} ${styles.btnConfirm}`} disabled={isSubmitting || !newEmail}>
          {isSubmitting ? 'Sending...' : 'Send Verification Code'}
        </button>
      </div>
    </form>
  );

  const renderEnterCodeStep = () => (
    <form onSubmit={handleSubmit} autoComplete="off">
        <div className={styles.modalHeader}>
          <h5 className={styles.modalTitle}>Verify New Email (Step 2 of 2)</h5>
          <button type="button" className={styles.closeButton} onClick={onClose} disabled={isSubmitting} aria-label="Close">×</button>
        </div>
        <div className={styles.modalBody}>
          <p className="text-muted small mb-3">A verification code was sent to <strong>{newEmail}</strong>. Enter the code below and your current password to complete the change.</p>
           <div className="mb-3">
            <label htmlFor="verificationCode" className="form-label">Verification Code</label>
            <input
              type="text"
              className="form-control"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="6-digit code"
              autoComplete="one-time-code"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="currentPasswordForEmail" className="form-label">Current Password</label>
            <div className="input-group">
                <input
                type={isPasswordVisible ? 'text' : 'password'}
                className="form-control"
                id="currentPasswordForEmail"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              <button className="btn btn-outline-secondary" type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
                <i className={`bi ${isPasswordVisible ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>
          {isSubmitting && <div className="text-center my-3"><div className="spinner-border text-primary spinner-border-sm" role="status"></div><span className="ms-2">Processing...</span></div>}
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleBack} disabled={isSubmitting}>Back</button>
          <button type="submit" className={`${styles.btn} ${styles.btnConfirm}`} disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Email'}
          </button>
        </div>
      </form>
  );

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          {step === 'enterEmail' ? renderEnterEmailStep() : renderEnterCodeStep()}
        </div>
      </div>
      <NotificationModal {...notification} onClose={handleCloseNotification} />
    </>
  );
};

export default ChangeEmailModal;