import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import OrderSensorModal from '../components/modals/OrderSensorModal';
import PaymentGatewayModal from '../components/modals/PaymentGatewayModal';
import styles from '../styles/OrderPage.module.css';

const SENSOR_PRICES = {
    temperature: 49.99,
    ammonia: 59.99,
    both: 79.99,
};

export default function OrderPage() {
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [orders, setOrders] = useState([]);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState(null); // receipt for payment

    const toggleSidebar = () => setIsSidebarExpanded(!isSidebarExpanded);

    const handleOrderSubmit = (order) => {
        const unitPrice = SENSOR_PRICES[order.type] ?? 49.99;

        const receipt = {
            items: [{ name: `${order.type} Sensor`, amount: unitPrice * order.quantity }],
            total: unitPrice * order.quantity,
            orderDetails: order
        };

        setCurrentReceipt(receipt);
        setIsOrderModalOpen(false);
        setIsPaymentModalOpen(true);
    };

    // Triggered after successful payment
    const handlePaymentSuccess = () => {
        if (currentReceipt) {
            const order = currentReceipt.orderDetails;
            const newOrder = {
                id: orders.length + 1,
                name: `${order.type} Sensor`,
                quantity: order.quantity,
                date: order.date,
                image: order.image, // ✅ Include sensor image
            };
            setOrders([...orders, newOrder]);
            setCurrentReceipt(null);
        }
    };

    return (
        <div className="d-flex">
            <Sidebar isExpanded={isSidebarExpanded} toggleSidebar={toggleSidebar} />

            <main
                className={styles.mainContent}
                style={{
                    marginLeft: isSidebarExpanded ? '260px' : '70px',
                    transition: 'margin-left 0.3s ease',
                }}
            >
                <div className="container-fluid py-3">
                    <div className={styles.pageHeader}>
                        <h1 className={styles.title}>
                            <span className={`input-group-text ${styles.iconSpan}`}>
                                <i className="bi bi-truck fs-2"></i>
                            </span>
                            Order Page
                        </h1>
                        <p>Order sensor for your poultry houses</p>
                    </div> 
                    <div className={styles.buttonContainer}>
                        <button className={styles.orderButton} onClick={() => setIsOrderModalOpen(true)}>
                            Order Sensor
                        </button>
                    </div>

                    <div className={styles.orderContainer}>
                        {orders.length === 0 ? (
                            <p className={styles.emptyMessage}>No orders made yet</p>
                        ) : (
                            <div className={styles.orderList}>
                                {orders.map((order) => (
                                    <div key={order.id} className={styles.orderCard}>
                                        <div className={styles.orderInfo}>
                                            <h3>{order.name}</h3>
                                            <p>Status: Packing</p>
                                            <p>Ordered at: {order.date}</p>
                                        </div>
                                        {order.image && (
                                            <img
                                                src={order.image}
                                                alt={order.name}
                                                className={styles.orderImage}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Modals */}
                    <OrderSensorModal
                        isOpen={isOrderModalOpen}
                        onClose={() => setIsOrderModalOpen(false)}
                        onOrder={handleOrderSubmit}
                    />

                    {isPaymentModalOpen && currentReceipt && (
                        <PaymentGatewayModal
                            receiptData={currentReceipt}
                            onClose={() => {
                                setIsPaymentModalOpen(false); // hide modal
                                setCurrentReceipt(null);       // clear receipt
                            }}
                            onPaymentSuccess={() => {
                                handlePaymentSuccess();
                                setIsPaymentModalOpen(false);
                            }}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
