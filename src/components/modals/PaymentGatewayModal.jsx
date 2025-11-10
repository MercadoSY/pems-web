import React, { Component } from 'react';
import styles from './PaymentGatewayModal.module.css';

export class PaymentGatewayModal extends Component {
    state = {
        currentPage: 1,
        paymentMethod: '',
        name: '',
        cardNumber: '',
        expiry: '',
        cvc: '',
        isLoading: false,
        isPaid: false,
    };

    resetModal = () => {
        this.setState({
            currentPage: 1,
            paymentMethod: '',
            name: '',
            cardNumber: '',
            expiry: '',
            cvc: '',
            isLoading: false,
            isPaid: false,
        });
    };
    goNext = () => {
        this.setState({ currentPage: 2 });
    };

    goBack = () => {
        this.setState({ currentPage: 1 });
    };

    handleChange = (e) => {
        const { name, value } = e.target;
        this.setState({ [name]: value });
    };

    handlePaymentMethodChange = (method) => {
        this.setState({ paymentMethod: method });
    };

    handleSubmit = () => {
        const { paymentMethod, name, cardNumber, expiry, cvc } = this.state;

        if (!paymentMethod) {
            alert('Please select a payment method.');
            return;
        }

        if (paymentMethod === 'credit' && (!name || !cardNumber || !expiry || !cvc)) {
            alert('Please fill in all card details.');
            return;
        }

        // Start loading
        this.setState({ isLoading: true });

        setTimeout(() => {
            // Stop loading, show success
            this.setState({ isLoading: false, isPaid: true });

            // Auto-close modal & redirect after 5 seconds
            setTimeout(() => {
                this.setState({ isLoading: false, isPaid: true });
                this.props.onClose();
                this.props.onPaymentSuccess();

            }, 2000);
        }, 2000);
    };

    render() {
        const { currentPage, paymentMethod, name, cardNumber, expiry, cvc } = this.state;
        const { receiptData } = this.props;

        return (

            <>
                {/* Loading overlay */}
                {this.state.isLoading && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.loadingBox}>
                            <p>Processing Payment...</p>
                            <div className={styles.loader}></div>
                        </div>
                    </div>
                )}

                {/* Payment success */}
                {this.state.isPaid && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.loadingBox}>
                            <p>Payment Successful!</p>
                        </div>
                    </div>
                )}
                <div className={styles.modalContainer} onClick={this.props.onClose}>
                    <div className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalTitle}>Payment</div>

                        <div className={styles.modalContent}>
                            {/* Page 1: Receipt */}
                            {currentPage === 1 && (
                                <div className={styles.receiptPage}>
                                    <h3 className={styles.receiptTitle}>Receipt</h3>
                                    <div className={styles.receiptItem}>
                                        {receiptData.items.map((item, index) => (
                                            <div key={index} className={styles.receiptRow}>
                                                <span className={styles.itemName}>{item.name}</span>
                                                <span className={styles.itemPrice}>${item.amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                        <div className={styles.receiptRowTotal}>
                                            <span>Total:</span>
                                            <span>${receiptData.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className={styles.modalActions}>
                                        {/* Cancel Button */}
                                        <button
                                            className={styles.cancelButton}
                                            onClick={() => {
                                                this.resetModal();    // reset modal state
                                                this.props.onClose(); // close modal
                                            }}
                                        >
                                            Cancel
                                        </button>

                                        {/* Next Button */}
                                        <button
                                            className={styles.nextButton}
                                            onClick={this.goNext}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Page 2: Payment Details */}
                            {currentPage === 2 && (
                                <>

                                    <div className={styles.row}
                                        onClick={() => this.handlePaymentMethodChange('cash')}>
                                        <div className={styles.left}>
                                            <input
                                                id="cash"
                                                type="radio"
                                                name="payment"
                                                checked={paymentMethod === 'cash'}
                                                readOnly
                                            />
                                            <span className={styles.radio}></span>
                                            Cash on Delivery
                                        </div>
                                    </div>
                                    <div className={styles.row}
                                        onClick={() => this.handlePaymentMethodChange('paypal')} >
                                        <div className={styles.left}>
                                            <input
                                                id="paypal"
                                                type="radio"
                                                name="payment"
                                                checked={paymentMethod === 'paypal'}
                                                readOnly
                                            />
                                            <span className={styles.radio}></span>
                                            Paypal
                                        </div>
                                        <div className={styles.right}>
                                            <img src={'/assets/paypal.webp'} alt="paypal" className={styles.cardIcon} />
                                        </div>
                                    </div>

                                    <div className={styles.row}
                                        onClick={() => this.handlePaymentMethodChange('credit')}>
                                        <div className={styles.left}>
                                            <input
                                                id="credit"
                                                type="radio"
                                                name="payment"
                                                checked={paymentMethod === 'credit'}
                                                readOnly
                                            />
                                            <span className={styles.radio}></span>
                                            Credit/Debit
                                        </div>
                                        <div className={styles.right}>
                                            <img src={'/assets/credit-card-1.png'} alt="visa" className={styles.cardIcon} />
                                            <img src={'/assets/credit-card-2.png'} alt="mastercard" className={styles.cardIcon} />
                                        </div>
                                    </div>

                                    {paymentMethod === 'credit' && (
                                        <>
                                            <div className={styles.rowInput}>
                                                <label>Name</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={name}
                                                    onChange={this.handleChange}
                                                    required
                                                />
                                            </div>

                                            <div className={styles.rowInput}>
                                                <label>Card Number</label>
                                                <input
                                                    type="text"
                                                    name="cardNumber"
                                                    value={cardNumber}
                                                    onChange={this.handleChange}
                                                    required
                                                />
                                            </div>

                                            <div className={`${styles.rowInput} ${styles.multiple}`}>
                                                <div>
                                                    <label>Expiry</label>
                                                    <input
                                                        type="text"
                                                        name="expiry"
                                                        placeholder="MM/YY"
                                                        value={expiry}
                                                        onChange={this.handleChange}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label>CVC/CVV</label>
                                                    <input
                                                        type="text"
                                                        name="cvc"
                                                        placeholder="123"
                                                        value={cvc}
                                                        onChange={this.handleChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className={styles.modalActions}>
                                        <button className={styles.backButton} onClick={this.goBack}>
                                            Back
                                        </button>
                                        <button className={styles.payButton} onClick={this.handleSubmit}>
                                            Pay
                                        </button>
                                    </div>
                                </>
                            )}

                        </div>
                    </div>
                </div>
            </>
        );
    }
}

export default PaymentGatewayModal;