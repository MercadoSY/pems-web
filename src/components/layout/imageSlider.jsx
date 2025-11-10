import React, { useState, useEffect, useCallback } from 'react';
import styles from './imageSlider.module.css';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';


const ImageSlider = () => {
  const images = [
    '/assets/demo_1.jpg',
    '/assets/demo_2.jpg',
    '/assets/demo_3.jpg',
  ];

  const [current, setCurrent] = useState(0);
  const itemCount = images.length;

  // Function to go to next slide
  const showNextItem = useCallback(() => {
    setCurrent((prev) => (prev + 1) % itemCount);
  }, [itemCount]);

  // Function to go to previous slide
  const showPreviousItem = useCallback(() => {
    setCurrent((prev) => (prev - 1 + itemCount) % itemCount);
  }, [itemCount]);

  // Keyboard navigation (left/right arrows)
  useEffect(() => {
    const keyPress = (e) => {
      if (e.key === 'ArrowLeft') showPreviousItem();
      if (e.key === 'ArrowRight') showNextItem();
    };

    document.addEventListener('keydown', keyPress);
    return () => document.removeEventListener('keydown', keyPress);
  }, [showNextItem, showPreviousItem]);

  return (
    <div className={styles.container}>
      <div className={styles.slider}>
        {images.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Slide ${index + 1}`}
            className={index === current ? styles.active : ''}
          />
        ))}
      </div>

      <nav className={styles['slider-nav']}>
        <ul>
          <li className={styles.arrow}>
            <button onClick={showPreviousItem} className={styles.previous}>
              <span>
                <span><IoIosArrowBack /></span>
              </span>
            </button>
          </li>
          <li className={styles.arrow}>
            <button onClick={showNextItem} className={styles.next}>
              <span>
                <span><IoIosArrowForward /></span>
              </span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default ImageSlider;
