// src/components/modals/AlertAnalysisModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Spinner } from 'react-bootstrap';
import styles from './AlertAnalysisModal.module.css';
import { generateDiagnosticAnalysis } from '../../utils/diagnosticAnalysis';
import { generatePrescriptiveAnalysis } from '../../utils/prescriptiveAnalysis';

/**
 * A modal to display diagnostic and prescriptive analysis for an alert.
 */
const AlertAnalysisModal = ({ show, onHide, alert, allUserAlerts, channelConfig }) => {
  const [diagnostic, setDiagnostic] = useState(null);
  const [prescriptive, setPrescriptive] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const performAnalysis = async () => {
      if (!show || !alert || !channelConfig) return;

      setIsLoading(true);
      setDiagnostic(null);
      setPrescriptive(null);

      try {
        // Run diagnostic analysis (synchronous)
        const diagnosticResult = generateDiagnosticAnalysis(alert, allUserAlerts);
        setDiagnostic(diagnosticResult);

        // Run prescriptive analysis (asynchronous, needs prediction data)
        const prescriptiveResult = await generatePrescriptiveAnalysis(alert, channelConfig, diagnosticResult);
        setPrescriptive(prescriptiveResult);
      } catch (error)
      {
        console.error("Failed to perform alert analysis:", error);
        setDiagnostic({ title: 'Analysis Error', insights: ['Could not generate analysis.'] });
      } finally {
        setIsLoading(false);
      }
    };

    performAnalysis();
  }, [show, alert, allUserAlerts, channelConfig]);

  // Converts markdown-style bold text (**text**) to HTML (<strong>text</strong>).
  const formatInsight = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className={styles.modalHeader}>
        <Modal.Title>
          <i className="bi bi-clipboard2-data-fill me-3"></i>Alert Analysis
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.modalBody}>
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Analyzing...</span>
            </Spinner>
            <p className="mt-3">Performing analysis, please wait...</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-4">
            {/* Diagnostic Section */}
            {diagnostic && (
              <div className={`${styles.analysisCard} ${styles.diagnosticCard}`}>
                <h5 className={styles.cardTitle}>
                  <i className="bi bi-search me-2"></i>Why did this happen?
                </h5>
                <p className="fw-bold">{diagnostic.title}</p>
                <ul className={styles.insightList}>
                  {diagnostic.insights.map((insight, index) => (
                    <li key={index} dangerouslySetInnerHTML={{ __html: formatInsight(insight) }}></li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prescriptive Section */}
            {prescriptive && (
              <div className={`${styles.analysisCard} ${styles.prescriptiveCard}`}>
                <h5 className={styles.cardTitle}>
                  <i className="bi bi-prescription2 me-2"></i>Recommended Actions
                </h5>
                <ul className={styles.recommendationList}>
                  {prescriptive.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default AlertAnalysisModal;