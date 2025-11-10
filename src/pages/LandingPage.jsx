import React, { useEffect, useCallback } from 'react';
import { useHeaderFooterLayout } from '../components/layout/HeaderFooterLayout';
import DataTable from '../components/layout/dataTable';
import cloud from '../../public/assets/icon_cloud.webp';
import sensor from '../../public/assets/icon_sensor.webp';
import analysis from '../../public/assets/icon_analysis.webp';
import styles from '../styles/LandingPage.module.css';

const navLinks = [
  { id: 'AboutSection', label: 'About' },
  { id: 'TechnologySection', label: 'Technologies' },
  { id: 'DemoSection', label: 'Demo' },
  { id: 'GallerySection', label: 'Gallery' },
  { id: 'FeaturesSection', label: 'Features' },
];

/**
 * The main landing page component for the PEMS application.
 */
function LandingPage() {
  const { setHeaderProps } = useHeaderFooterLayout();

  const galleryImages = [
    '/assets/gallery001.webp',
    '/assets/gallery002.webp',
    '/assets/gallery003.webp',
  ];
  
  /**
   * Smoothly scrolls to a specific section on the page.
   */
  const scrollToSection = useCallback((id) => {
    const section = document.getElementById(id);
    if (section) {
      const yOffset = -90; // Adjust for sticky nav height
      const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    // Manually control scroll restoration to ensure page loads at the top.
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // Set the initial state for the header in the parent layout
    setHeaderProps({
      navLinks,
      activeSection: navLinks.length > 0 ? navLinks[0].id : '',
      scrollToSection,
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const intersectingEntry = entries.find(entry => entry.isIntersecting);
        if (intersectingEntry) {
          setHeaderProps(prevProps => ({ ...prevProps, activeSection: intersectingEntry.target.id }));
        }
      },
      { rootMargin: '-40% 0px -60% 0px' }
    );

    navLinks.forEach((link) => {
      const el = document.getElementById(link.id);
      if (el) observer.observe(el);
    });

    return () => {
      navLinks.forEach((link) => {
        const el = document.getElementById(link.id);
        if (el) observer.unobserve(el);
      });
      // Restore default browser behavior and clear header props on unmount.
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
      setHeaderProps({});
    };
  }, [setHeaderProps, scrollToSection]);


  return (
    <div className={styles.landingPage}>
      <main>
        <section id='AboutSection' className={`${styles.section} ${styles.aboutSection}`}>
          <div className={styles.aboutContent}>
            <h1 className={styles.sectionTitle}>About Us</h1>
            <p><strong>Poultry Environment Monitoring System (PEMS)</strong> is an IoT-based mobile and web system designed to monitor conditions inside poultry houses, providing poultry workers with an easy and cost-effective way to track and manage their environment.</p>
          </div>
          <div className={styles.aboutImageContainer}>
            <img src="/assets/devices.webp" alt="Poultry Farm Monitoring" className={styles.aboutImage} />
          </div>
        </section>

        <div className={styles.sectionDivider} />

        <section id='TechnologySection' className={styles.section}>
          <h1 className={styles.sectionTitle}>Technologies Used</h1>
          <div className={styles.cardContainer}>
            <div className={styles.card}>
              <div className={styles.cardIconWrapper}>
                <img src={sensor} alt="Smart Sensors" className={styles.cardIcon} />
              </div>
              <h2>Smart Sensors</h2>
              <p>Advanced IoT sensors continuously monitor temperature and ammonia levels, ensuring accurate, real-time environmental insights.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIconWrapper}>
                <img src={analysis} alt="Data Analysis" className={styles.cardIcon} />
              </div>
              <h2>Data Processing & Analysis</h2>
              <p>Intelligent analytics transform raw readings into actionable insights, helping farmers make smarter, faster management decisions.</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIconWrapper}>
                <img src={cloud} alt="Cloud Integration" className={styles.cardIcon} />
              </div>
              <h2>Cloud Integration</h2>
              <p>Secure cloud storage enables seamless data access anytime, anywhere, keeping your poultry operations connected and efficient.</p>
            </div>
          </div>
        </section>

        <div className={styles.sectionDivider} />

        <section id='DemoSection' className={styles.section}>
          <h1 className={styles.sectionTitle}>System Demo</h1>
          <div className={styles.videoContainer}>
            <div className={styles.videoWrapper}>
              <h2>Web Platform</h2>
              <iframe
                src="https://www.youtube.com/embed/-IyyBvk-3sw?si=5XTgcnyL4mQUPtjR"
                title="Web System Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className={styles.videoWrapper}>
              <h2>Mobile App</h2>
              <iframe
                src="https://www.youtube.com/embed/W3YVnVzDs2w?si=lyZn2FZOKg7uFxXh"
                title="Mobile System Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </section>

        <div className={styles.sectionDivider} />

        <section id='GallerySection' className={styles.section}>
          <h1 className={styles.sectionTitle}>Gallery</h1>
          <div className={styles.galleryGrid}>
            {galleryImages.map((src, index) => (
              <div key={index} className={styles.galleryItem}>
                <img src={src} alt={`Gallery image ${index + 1}`} />
              </div>
            ))}
          </div>
        </section>

        <div className={styles.sectionDivider} />

        <section id='FeaturesSection' className={`${styles.section} ${styles.featuresSection}`}>
          <div className={styles.descriptionColumn}>
            <h1 className={styles.sectionTitle}>Features</h1>
            <p>Stay in control with real-time monitoring, smart insights, and instant alerts all in one platform designed to make your business smarter and faster.</p>
          </div>
          <DataTable />
        </section>
      </main>
    </div>
  );
}

export default LandingPage;