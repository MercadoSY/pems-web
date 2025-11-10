import React, { useState, useEffect } from 'react';
import styles from './DeleteKeyModal.module.css';

/**
 * A modal to securely request the master delete key for admin deletion.
 */
const DeleteKeyModal = ({ isOpen, onClose, onSubmit, userName, isProcessing }) => {
    const [deleteKey, setDeleteKey] = useState('');

    useEffect(() => {
        if (isOpen) {
            setDeleteKey(''); // Reset key on modal open for security
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (deleteKey.trim()) {
            onSubmit(deleteKey);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h5 className={styles.modalTitle}>Delete Admin Confirmation</h5>
                    <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                        <p>To delete the admin "<strong>{userName}</strong>", please enter the master delete key.</p>
                        <div className={styles.formGroup}>
                            <label htmlFor="deleteKey" className={styles.label}>Master Delete Key</label>
                            <input
                                type="password"
                                id="deleteKey"
                                className={styles.input}
                                value={deleteKey}
                                onChange={(e) => setDeleteKey(e.target.value)}
                                autoComplete="off"
                                required
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose} disabled={isProcessing}>
                            Cancel
                        </button>
                        <button type="submit" className={`${styles.btn} ${styles.btnDanger}`} disabled={isProcessing || !deleteKey.trim()}>
                            {isProcessing ? (
                                <>
                                    <span className={styles.spinner} role="status" aria-hidden="true"></span> Verifying...
                                </>
                            ) : (
                                'Verify & Continue'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeleteKeyModal;