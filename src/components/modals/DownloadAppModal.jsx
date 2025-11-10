// src/components/modals/DownloadAppModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import styles from './DownloadAppModal.module.css';
import { getBranches } from '../../firebase/channelService';
import { fetchRegisterKey } from '../../firebase/userManagement';

/**
 * A copy-to-clipboard utility hook.
 */
const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState(null);

  const copy = async (text) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard API not supported.');
      return false;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000); // Reset after 2 seconds
      return true;
    } catch (error) {
      console.error("Copy to clipboard failed", error);
      setCopiedText(null);
      return false;
    }
  };

  return [copiedText, copy];
};

/**
 * Renders a modal with instructions and links for downloading the PEMS mobile app.
 */
const DownloadAppModal = ({ isOpen, onClose }) => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [registerKey, setRegisterKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [, copy] = useCopyToClipboard();
  const [showCopySuccessPopup, setShowCopySuccessPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const IOS_LINK = "https://pems-mobile.vercel.app/";
  const ANDROID_LINK = "https://github.com/Seb-2003/pems-mobile/releases/latest/download/PEMS.apk";

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        setError('');
        console.log("DownloadAppModal: Fetching branches and register key.");
        try {
          const [fetchedBranches, fetchedKey] = await Promise.all([
            getBranches(),
            fetchRegisterKey(),
          ]);
          setBranches(fetchedBranches);
          if (fetchedBranches.length > 0) {
            setSelectedBranch(fetchedBranches[0]);
          }
          setRegisterKey(fetchedKey);
          console.log("DownloadAppModal: Data fetched successfully.", { branchesCount: fetchedBranches.length });
        } catch (err) {
          console.error("Failed to fetch app download data:", err);
          setError("Could not load required data. Please try again.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const handleBranchChange = (e) => {
    const selectedBranchName = e.target.value;
    const branch = branches.find(b => b.name === selectedBranchName);
    setSelectedBranch(branch);
  };
  
  const premadeMessage = useMemo(() => {
    return `🐔 PEMS Mobile Link
(${selectedBranch?.name || 'Select a branch'})

🍎 IOS/IPHONE
${IOS_LINK}

🤖 ANDROID (Download)
${ANDROID_LINK}

========

🔑 REGISTER KEY
= ${registerKey || 'N/A'}

🔓 BRANCH PASSWORD
= ${selectedBranch?.key || 'Select a branch'}

========

⚠️ DON'T SHARE THIS TO ANYONE! ⚠️`;

  }, [registerKey, selectedBranch]);

  const handleCopy = async (text, message) => {
    if (!text) {
        console.warn("Attempted to copy empty or undefined text.");
        return;
    }
    const success = await copy(text);
    if (success) {
        console.log(`DownloadAppModal: Copy successful. Displaying popup: "${message}"`);
        setPopupMessage(message);
        setShowCopySuccessPopup(true);
        setTimeout(() => {
            setShowCopySuccessPopup(false);
        }, 2000); // Popup visible for 2 seconds
    }
  };

  if (!isOpen) {
    return null;
  }

  const copySuccessPopupStyles = {
    position: 'fixed',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(40, 167, 69, 0.95)',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    zIndex: 1060, // Ensure it's above the modal
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1rem',
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      {showCopySuccessPopup && (
        <div style={copySuccessPopupStyles}>
          <i className="bi bi-check-circle-fill"></i>
          <span>{popupMessage}</span>
        </div>
      )}
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Download PEMS Mobile App</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : (
            <>
              <div className={styles.guidelines}>
                <strong>Guidelines:</strong>
                <ul>
                  <li>Copy all and send the message to the new worker according to their branch.</li>
                </ul>
              </div>

              <div className={styles.warningNotice}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span><strong>Do not share this information with anyone other than your workers.</strong> </span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="branch-select">Select Branch</label>
                <select id="branch-select" value={selectedBranch?.name || ''} onChange={handleBranchChange}>
                  {branches.map(branch => (
                    <option key={branch.name} value={branch.name}>{branch.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.premadeMessageHeader}>
                    <label>Message</label>
                    <button className={styles.copyAllButton} onClick={() => handleCopy(premadeMessage, 'Message copied to clipboard!')}>
                        <i className="bi bi-clipboard-check-fill"></i> Copy All
                    </button>
                </div>
                <div className={styles.premadeMessage}>
                  {premadeMessage}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="ios-link">iOS Link</label>
                <div className={styles.inputWrapper}>
                  <input id="ios-link" type="text" value={IOS_LINK} readOnly />
                  <button className={styles.actionButton} onClick={() => handleCopy(IOS_LINK, 'iOS link copied!')}>
                    <i className="bi bi-copy"></i> Copy
                  </button>
                  <button className={styles.actionButton} disabled>
                    <i className="bi bi-box-arrow-up-right"></i> Open
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="android-link">Android Link</label>
                <div className={styles.inputWrapper}>
                  <input id="android-link" type="text" value={ANDROID_LINK} readOnly />
                  <button className={styles.actionButton} onClick={() => handleCopy(ANDROID_LINK, 'Android link copied!')}>
                    <i className="bi bi-copy"></i> Copy
                  </button>
                  <button className={styles.actionButton} onClick={() => window.open(ANDROID_LINK, '_blank', 'noopener,noreferrer')}>
                    <i className="bi bi-box-arrow-up-right"></i> Open
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="register-key">Register Key</label>
                <div className={styles.inputWrapper}>
                  <input id="register-key" type="text" value={registerKey || 'N/A'} readOnly />
                  <button className={styles.actionButton} onClick={() => handleCopy(registerKey, 'Register key copied!')}>
                    <i className="bi bi-copy"></i> Copy
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="branch-password">Branch Password</label>
                <div className={styles.inputWrapper}>
                  <input id="branch-password" type="text" value={selectedBranch?.key || ''} readOnly placeholder="Select a branch to see its password" />
                  <button className={styles.actionButton} onClick={() => handleCopy(selectedBranch?.key, 'Branch password copied!')} disabled={!selectedBranch?.key}>
                    <i className="bi bi-copy"></i> Copy
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.closeModalButton}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default DownloadAppModal;