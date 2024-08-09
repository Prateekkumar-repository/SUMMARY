'use strict';

import React from 'react';
import { plainDateFormat } from '../commons/CUK/dateFormat';
import CurrencyFormat from '../commons/CUK/currencyFormat';
import SessionStorage from '../commons/CUK/session-storage';
import analytics from '../commons/CUK/analytics';

class cartItemDining extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            removed: false
        };
    }
    removeNotification = (e) => {
        analytics.clickTracking(this);
        e.preventDefault();
        e.currentTarget.parentNode.remove();
    };

    closeTooltip = (e) => {
        e.preventDefault();
        this.setState({ hover: false });
    };
    handleMouseIn = () => {
        this.setState({ hover: true });
    };

    handleMouseOut = () => {
        this.setState({ hover: false });
    };
    handleRemove = (e) => {
        const { data, onRemove } = this.props;
        const { groupID } = data[0];
        onRemove && onRemove(e, groupID);
    };

    render() {
        const style = {
            color: '#666',
            textAlign: 'left',
            fontSize: '80%',
            width: '100%',
            fontFamily: 'PraxisCom-Regular'
        };
        const {
            labels,
            data,
            removed,
            diningBasePath,
            accesibilityLabels
        } = this.props;
        const {
            subtotalPrice,
            loyalityDiscount,
            totalPrice,
            promotionDiscount
        } = data.pricing;
        const {
            groupID,
            product: {
                attributes: {
                    name,
                    startDateTime,
                    mealPeriod,
                    event,
                    baseProduct
                },
                code,
                thumbnail,
                url,
                primaryImageUrl // CK
            },
            quantity,
            noOfGuests,
            basePrice: { currencyIso },
            basePrice: { formattedValue },
            status
        } = data[0];

        const thumbnail_logo = thumbnail || primaryImageUrl; // CK

        const notification = {
            __html: `${labels.removeNotificationLabel.replace(
                '{item}',
                `<a href='#'>${name}</a>`
            )}`
        };
        const userData = SessionStorage.getItem('userData');
        const { shipCode } = userData;

        if (
            !this.props.hasZeroValueItem &&
            !removed &&
            subtotalPrice - loyalityDiscount < 1
        ) {
            const { onZeroValFound } = this.props;
            onZeroValFound && onZeroValFound();
        }

        return (
            <li
                // className={
                //     status && status != 'ACTIVE'
                //         ? 'expired-wrapper productRow'
                //         : 'productRow'
                // }
                className={'productRow'}
                data-groupID={groupID}
            >
                {removed ? (
                    <div className="productRow__removeNotification">
                        <span dangerouslySetInnerHTML={notification} />
                        <a
                            href="#"
                            className="close removenotification"
                            onClick={this.removeNotification}
                            tabIndex={0}
                            role={'button'}
                            aria-Label={
                                accesibilityLabels &&
                                accesibilityLabels.ariaRemoveLabel
                                    ? accesibilityLabels.ariaRemoveLabel
                                    : ''
                            }
                        />
                    </div>
                ) : (
                    <div
                    // className={
                    //     status && status != 'ACTIVE' ? 'expired-main' : ''
                    // }
                    >
                        <div className="productRow__header">
                            <span className="productRow__personalInfo bodyText">
                                {labels.diningLabel}
                            </span>
                            <a className="productRow__title" href={`${url}`}>
                                {name}
                            </a>
                            <span className="bodyText productRow__dateTime">
                                {plainDateFormat(
                                    new Date(
                                        startDateTime.substring(
                                            0,
                                            startDateTime.length - 1
                                        )
                                    ),
                                    'DD MMM YYYY | h.mma'
                                )}
                            </span>
                            {/* {status && status != 'ACTIVE' ? (
                                <a
                                    href="#"
                                    style={{ cursor: 'default' }}
                                    className="productRow__cta"
                                    aria-label={`${name} ${labels.expiredLabel}`}
                                >
                                    <span>{labels.expiredLabel}</span>
                                </a>
                            ) : (
                                <a
                                    href="#"
                                    className="productRow__cta"
                                    onClick={this.handleRemove}
                                    aria-label={`${labels.removeLabel} ${name}`}
                                >
                                    <span>{labels.removeLabel}</span>
                                </a>
                            )} */}
                            <a
                                href="#"
                                className="productRow__cta"
                                onClick={this.handleRemove}
                                aria-label={`${labels.removeLabel} ${name}`}
                            >
                                <span>{labels.removeLabel}</span>
                            </a>
                        </div>
                        <div className="productRow__body">
                            <a
                                className="productRow__img"
                                href={`${url}`}
                                title={
                                    accesibilityLabels.imageAlt
                                        ? `${accesibilityLabels.imageAlt} ${name}`
                                        : ''
                                }
                            >
                                <img src={thumbnail_logo} />
                            </a>

                            <div className="productRow__col">
                                <h5 tabIndex={0}>
                                    {labels.guestsLabel}
                                </h5>
                                {/* <ul className="productRow__ul">
                                    {mealPeriod && (
                                        <li>
                                            <span>
                                                {labels.mealPeriodLabel}
                                            </span>
                                            <span className="productRow__value">
                                                {' ' + mealPeriod}
                                            </span>
                                        </li>
                                    )}
                                    {event && (
                                        <li>
                                            <span>
                                                {event.eventType === 'COOKERY'
                                                    ? labels.eventLabel
                                                    : labels.entertainerTitle}
                                            </span>
                                            <span className="productRow__value">
                                                {' ' + event.name}
                                            </span>
                                        </li>
                                    )}
                                    <li>
                                        <span>{labels.guestNumberLabel} </span>
                                        <span className="productRow__value">
                                            {noOfGuests}
                                        </span>
                                    </li>
                                </ul> */}
                                <ul className="productRow__ul">
                                    <li>
                                        <span className="productRow__userName" tabIndex={0}>{`${noOfGuests} ${labels.guestsLabel}`}</span>
                                        <span className="productRow__singlePrice" tabIndex={0}>
                                        {formattedValue} {'X'} {noOfGuests}
                                        </span>
                                    </li>
                                </ul>
                            </div>   
                            {/* <div className="productRow__col dining">
                                <h5
                                    role="heading"
                                    aria-level="2"
                                    aria-label={noOfGuests}
                                    tabIndex={0}
                                >
                                    {formattedValue} {'X'} {noOfGuests}
                                </h5>
                            </div> */}
                            <div className="productRow__col pricing">
                                <h5
                                    role="heading"
                                    aria-level="3"
                                    aria-label={labels.pricingLabel}
                                    tabIndex={0}
                                >
                                    {labels.pricingLabel}
                                </h5>
                                <p key="shoppingcart-item-pricing-subtotal">
                                    <span className="label__col" tabIndex={0}>
                                        {`${labels.subtotalLabel}:`}
                                    </span>
                                    <span className="value__col" tabIndex={0}>
                                        <CurrencyFormat
                                            value={subtotalPrice}
                                            currencyCode={currencyIso}
                                            decimal={true}
                                            decimalSup={true}
                                        />
                                    </span>
                                </p>
                                {promotionDiscount > 0 && (
                                    <p key="shoppingcart-item-pricing-loyalitydiscount">
                                        <span className="label__col" tabIndex={0}>
                                            {`${
                                                labels.productPromotionDiscountLabel
                                                    ? labels.productPromotionDiscountLabel
                                                    : ''
                                            }:`}
                                        </span>
                                        <span className="value__col" tabIndex={0}>
                                            -<CurrencyFormat
                                                value={promotionDiscount}
                                                currencyCode={currencyIso}
                                                decimal={true}
                                                decimalSup={true}
                                            />
                                        </span>
                                    </p>
                                )}
                                {loyalityDiscount > 0 && (
                                    <p key="shoppingcart-item-pricing-loyalitydiscount">
                                        <span className="label__col" tabIndex={0}>
                                            {`${labels.loyaltyDiscountLabel}:`}
                                        </span>
                                        <span className="value__col" tabIndex={0}>
                                            -<CurrencyFormat
                                                value={loyalityDiscount}
                                                currencyCode={currencyIso}
                                                decimal={true}
                                                decimalSup={true}
                                            />
                                        </span>
                                    </p>
                                )}
                                <p
                                    className="total-price"
                                    key="shoppingcart-item-pricing-total"
                                >
                                    <span className="label__col" tabIndex={0}>
                                        {labels.totalLabel}
                                    </span>
                                    <span className="value__col" tabIndex={0}>
                                        <CurrencyFormat
                                            value={totalPrice}
                                            currencyCode={currencyIso}
                                            decimal={true}
                                            decimalSup={true}
                                        />
                                    </span>
                                </p>
                            </div>
                            {totalPrice < 1 && (
                                <p style={style} tabIndex={0}>
                                    {' '}
                                    {labels.zeroValueProductInCartLabelone}{' '}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </li>
        );
    }
}
export default cartItemDining;
