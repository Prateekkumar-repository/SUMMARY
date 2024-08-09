'use strict';

import React from 'react';
import CurrencyFormat from '../commons/CUK/currencyFormat';
import SessionStorage from '../commons/CUK/session-storage';
import { getPriceSymbolForCurrencyCode } from '../commons/CUK/currencyFormat';
import CouponDiscount from './couponDiscount';
import { getConfig, priceConvInDecimal } from '../commons/CUK/utilities';

class pricingInfoMycruise extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            noError: true,
            appliedVouchers: this.props.appliedVouchers,
            couponDiscounts: this.props.couponDiscounts
        };
       
    }

    couponConfig = getConfig('enableCouponCode');

    handleUpdate = (e) => {
        const { update } = this.props;
        update && update(e);
    };

    updateCart = (flag) => {
        this.props.updateCart(flag);
    };

    getTotalDiscount = (value) => {
        if (
            (this.couponConfig == 'true' || this.couponConfig == true) &&
            this.props.couponDiscounts &&
            this.props.couponDiscounts.value
        ) {
            const amountReturn =
                parseFloat(value) + this.props.couponDiscounts.value;
            return amountReturn.toFixed(2);
        } else {
            return value;
        }
    };

    render() {
        const {
            labels,
            totalLoyaltyDiscount,
            totalChildDiscount,
            subTotal,
            promotionalDiscount,
            total
        } = this.props;
        const { noError } = this.state;

        const header = SessionStorage.getItem('header');

        const { loyaltyTier } = header.customer;
        let currSymbol = getPriceSymbolForCurrencyCode(total.currencyIso);
        let subtotalPrice = subTotal.value;
        // total.value + totalLoyaltyDiscount.value + totalChildDiscount.value;
        return (
            <div className="payment-summary">
                <div className="payment-summary-subtotal">
                    <span className="label">{labels.subtotalLabel}</span>
                    <span className="value">
                        {`${currSymbol}${subtotalPrice.toFixed(2)}`}
                    </span>
                </div>
                {promotionalDiscount > 0 && (
                    <div className="payment-summary-child-discount">
                        <span className="label">
                            {labels.productPromotionDiscountLabel
                                ? labels.productPromotionDiscountLabel
                                : ''}
                        </span>
                        <span className="value">
                            {`-${currSymbol}${promotionalDiscount.toFixed(2)}`}
                        </span>
                    </div>
                )}
                {totalLoyaltyDiscount.value > 0 && (
                    <div className="payment-summary-loyality-discount">
                        <span className="label">
                            {labels.loyaltyDiscountTotalLabel}
                            <span className="loyaltyName">{loyaltyTier}</span>
                        </span>
                        <span className="label-subtitle">
                            {labels.discountSubtitle}
                        </span>
                        <span className="value">
                            {`-${currSymbol}${totalLoyaltyDiscount.value.toFixed(
                                2
                            )}`}
                        </span>
                    </div>
                )}
                {/* {totalChildDiscount.value > 0 && (
                    <div className="payment-summary-child-discount">
                        <span className="label">
                            {labels.childDiscountTotalLabel}
                        </span>
                        <span className="value">
                            {`-${currSymbol}${totalChildDiscount.value.toFixed(
                                2
                            )}`}
                        </span>
                    </div>
                )} */}
                <div className="payment-summary-total">
                    <span className="label">{labels.totalLabel}</span>
                    <span className="value">
                        {`${currSymbol}${this.getTotalDiscount(
                            total.value.toFixed(2)
                        )}`}
                    </span>
                </div>
                {this.couponConfig == 'true' ||
                    (this.couponConfig == true && (
                        <CouponDiscount
                            total={this.props.total}
                            labels={labels}
                            updateCart={this.updateCart}
                            encryptedCartCode={this.props.encryptedCartCode}
                            appliedVouchers={this.props.appliedVouchers}
                            couponDiscounts={this.props.couponDiscounts}
                            servicesUrl={this.props.servicesUrl}
                            amountPayble={total}
                            removeCouponApi={this.props.removeCouponApi}
                            lacale={this.props.lacale}
                            couponList={this.props.couponList}
                            currSymbol={currSymbol}
                            maxCoupon={this.props.maxCoupon}
                        />
                    ))}
                <div className="payment-summary-checkout">
                    <button
                        type="button"
                        className={`checkout-button ${
                            noError ? '' : 'cta-disabled'
                        }  `}
                        data-clicktype={`general`}
                        data-linktext={`${labels.checkoutCtaLabel}`}
                        onClick={this.handleUpdate}
                    >
                        {labels.checkoutCtaLabel}
                    </button>
                </div>
            </div>
        );
    }
}

export default pricingInfoMycruise;
