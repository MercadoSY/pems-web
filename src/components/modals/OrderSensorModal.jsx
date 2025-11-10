import React, { useState } from 'react';
import styles from './OrderSensorModal.module.css';

export default function OrderSensorModal({ isOpen, onClose, onOrder }) {
    const [quantity, setQuantity] = useState(1);
    const [sensorType, setSensorType] = useState('temperature');
    const [address, setAddress] = useState({
        fullName: '',
        street: '',
        city: '',
        postalCode: '',
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const sensorImage = getSensorImage(); 

        onOrder({
            type: sensorType,
            quantity,
            date: new Date().toLocaleString(),
            address,
            image: sensorImage,
        });
        onClose();

        // reset fields
        setQuantity(1);
        setSensorType('temperature');
        setAddress({ fullName: '', street: '', city: '', postalCode: '' });
    };

    const getSensorImage = () => {
        switch (sensorType) {
            case 'temperature':
                return './assets/temperature-sensor.webp';
            case 'ammonia':
                return './assets/ammonia_sensor.jpg';
            case 'ammonia & temperature':
                return './assets/both.png';
            default:
                return '/images/sensor_placeholder.png';
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalBody}>
                <h2>Order Sensor</h2>

                <div className={styles.modalContent}>
                    <form onSubmit={handleSubmit} className={styles.formSection}>
                        <div className={styles.sensorDetails}>
                            <div className={styles.left}>

                                <label>
                                    Sensor Type:
                                    <select
                                        value={sensorType}
                                        onChange={(e) => setSensorType(e.target.value)}
                                    >
                                        <option value="temperature">Temperature</option>
                                        <option value="ammonia">Ammonia</option>
                                        <option value="ammonia & temperature">
                                            Ammonia & Temperature
                                        </option>
                                    </select>
                                </label>

                                <label>
                                    Quantity:
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                    />
                                </label>
                            </div>
                            <div className={styles.right}>
                                <div className={styles.imageSection}>
                                    <img
                                        src={getSensorImage()}
                                        alt={`${sensorType} sensor`}
                                        className={styles.sensorImage}
                                    />
                                    <p className={styles.imageCaption}>
                                        Preview of {sensorType} sensor
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.addressDetails}>

                            <h3>Shipping Address</h3>

                            <div className={styles.addressGrid}>
                                <label>
                                    Full Name:
                                    <input
                                        type="text"
                                        value={address.fullName}
                                        onChange={(e) =>
                                            setAddress({ ...address, fullName: e.target.value })
                                        }
                                        required
                                    />
                                </label>

                                <label>
                                    Street Address:
                                    <input
                                        type="text"
                                        value={address.street}
                                        onChange={(e) =>
                                            setAddress({ ...address, street: e.target.value })
                                        }
                                        required
                                    />
                                </label>

                                <label>
                                    City:
                                    <input
                                        type="text"
                                        value={address.city}
                                        onChange={(e) =>
                                            setAddress({ ...address, city: e.target.value })
                                        }
                                        required
                                    />
                                </label>

                                <label>
                                    Postal Code:
                                    <input
                                        type="text"
                                        value={address.postalCode}
                                        onChange={(e) =>
                                            setAddress({ ...address, postalCode: e.target.value })
                                        }
                                        required
                                    />
                                </label>
                            </div>
                        </div>

                        <div className={styles.modalButtons}>
                            <button
                                type="button"
                                onClick={onClose}
                                className={styles.cancelButton}
                            >
                                Cancel
                            </button>
                            <button type="submit" className={styles.submitButton}>
                                Next
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
