'use strict';

import React from 'react';
import Modal from '../commons/CUK/modal';
import SessionStorage from '../commons/CUK/session-storage';

class duplicateEventModal extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {
            labels,
            showDuplicateEvent,
            newProductBooking,
            existingProduct,
            handleModalExpired,
            checkNoMoreCart,
            handleContinueCheckout,
            isONHOLD
        } = this.props;
        const newOnHoldMesssage = labels.duplicateEventDescriptionLabel ? labels.duplicateEventDescriptionLabel : labels.cantBookTitleLabel;
        return (
            <Modal
                mounted={showDuplicateEvent}
                onExit={() =>
                    handleModalExpired(checkNoMoreCart ? 'close' : 'continue')
                }
                contentLabel="Duplicate Error"
                sessionClass="cart_modal"
            >
                <div className="overlay-text">
                    <div className="cart_title">
                        <h5>{labels.duplicateEventTileLabel}</h5>
                    </div>
                    {!isONHOLD &&
                        <div className="main_container duplicate_item">
                            <div className="title_notAdded">
                                {labels.alreadyBookedTitleLabel}
                            </div>
                            {existingProduct.length > 0 &&
                                existingProduct.map((e, index) => {
                                    return (
                                        <div key={index} className="item_container">
                                            <div className="item_title">
                                                {e.name}
                                            </div>
                                            <div className="item_details">
                                                {`${e.dateTime}`}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    }
                    <div className="main_container">
                        <div className="title_notAdded">
                            {isONHOLD ? newOnHoldMesssage : labels.cantBookTitleLabel}
                        </div>
                        {newProductBooking.length > 0 &&
                            newProductBooking.map((m, index) => {
                                return (
                                    <div key={index} className="item_container">
                                        <div className="item_title">
                                            {m.name}
                                        </div>
                                        <div className="item_details">
                                            {`${m.dateTime}`}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                    {!checkNoMoreCart && (
                        <div className={`popup__cta duplicate_cta`}>
                            <a
                                href="JavaScript:void(0)"
                                onClick={() =>
                                    handleContinueCheckout('checkout')
                                }
                                data-linktext={'popup-close'}
                                className={`cta-primary-light-blue`}
                            >
                                {labels.continueCheckoutLabel}
                            </a>
                            <a
                                href="JavaScript:void(0)"
                                onClick={() => handleModalExpired('continue')}
                                data-linktext={'popup-close'}
                                className={`cta-primary`}
                            >
                                {labels.checkoutLaterLabel}
                            </a>
                        </div>
                    )}
                    {checkNoMoreCart && (
                        <div className={`popup__cta_nomore duplicate_cta`}>
                            <a
                                href="JavaScript:void(0)"
                                onClick={() => handleModalExpired('close')}
                                data-linktext={'popup-close'}
                                className={`cta-primary nomore_cta`}
                            >
                                {labels.closeLabel}
                            </a>
                        </div>
                    )}
                </div>
            </Modal>
        );
    }
}
export default duplicateEventModal;
