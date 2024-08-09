'use strict';

import React from 'react';
import { plainDateFormat } from '../commons/CUK/dateFormat';
import CurrencyFormat from '../commons/CUK/currencyFormat';
import analytics from '../commons/CUK/analytics';

class shoppingcartItem extends React.Component {
    constructor(props) {
        super(props);
    }

    remove = (e, groupID) => {
        analytics.clickTracking(this);
        e.preventDefault();
        e.currentTarget.parentNode.remove();
    };

    createNotification(notificationLabel, groupID, name) {
        return (
            <div className="productRow__removeNotification errorNotification">
                <span>{notificationLabel}</span>
                {this.createLink(groupID, name)}
            </div>
        );
    }
    createLink(groupID, name) {
        const { labels } = this.props;
        const { removeLabel } = labels;
        return (
            <a
                href="#"
                className="productRow__cta"
                onClick={(e) => onRemove(e, groupID, name)}
            >
                <span>{removeLabel}</span>
            </a>
        );
    }
    createPassenger = (p, i) => {
        const { title, firstName, lastName, basePrice } = p.passenger;
        return (
            <li key={i}>
                <span  className="productRow__userName">{`${title} ${firstName} ${lastName}`}</span>
                <span className="productRow__singlePrice">{basePrice}</span>
            </li>
        );
    };
    render() {
        const { labels, data, onRemove, removed, accesibilityLabels } = this.props;
        const { pricing } = data;
        const {
            limitedStockNotificationLabel,
            removeNotificationLabel,
            notOnSaleAnymoreNotificationLabel,
            outOfStockNotificationLabel,
            onHoldNotificationLabel,
            guestsLabel,
            pricingLabel,
            subtotalLabel,
            totalLabel,
            loyaltyDiscountLabel
        } = labels;
        const { subtotalPrice, loyalityDiscount, totalPrice } = pricing;
        const theData = data[0];
        const { product, groupID, port, basePrice } = theData;
        const { attributes, stock, thumbnail, code } = product;
        const { name, url, startDateTime } = attributes;
        const { stockLevel } = stock;
        const { currencyIso } = basePrice;
        const stockLevelNotification = limitedStockNotificationLabel.replace(
            '{stock}',
            stockLevel
        );

        const notification = {
            __html: `${removeNotificationLabel.replace(
                `{item}`,
                `<a href=${url}>${name}</a>`
            )}`
        };
        const notAvailableAnymore =
            theData.error !== undefined && theData.error !== null
                ? true
                : false;
        const isOutOfStock = stockLevel === 0 ? true : false;
        const isOnHold = instanceStatus === 'ON_HOLD' ? true : false;
        const notificationLabel =
            !removed &&
            (notAvailableAnymore
                ? notOnSaleAnymoreNotificationLabel
                : isOnHold
                    ? onHoldNotificationLabel
                    : isOutOfStock
                        ? outOfStockNotificationLabel
                        : stockLevelNotification);

        return (
            <li className="productRow" data-groupID={groupID}>
                {removed && (
                    <div className="productRow__removeNotification">
                        <span dangerouslySetInnerHTML={notification} />
                        <a
                            href='#'
                            className="close removenotification"
                            tabIndex={0}
                            role={'button'}
                            aria-Label={accesibilityLabels && accesibilityLabels.ariaRemoveLabel ? accesibilityLabels.ariaRemoveLabel : ''}
                            onClick={(e) => this.remove(e, groupID)}
                            
                        />
                    </div>
                )}
                {!removed &&
                    !isOnHold &&
                    notAvailableAnymore &&
                    this.createNotification(
                        notOnSaleAnymoreNotificationLabel,
                        groupID,
                        name
                    )}
                {!removed &&
                    (!isOnHold
                        ? this.createNotification(
                              !isOutOfStock
                                  ? stockLevelNotification
                                  : outOfStockNotificationLabel,
                              groupID,
                              name
                          )
                        : this.createNotification(
                              onHoldNotificationLabel,
                              groupID,
                              name
                          ))}

                {!removed && (
                    <div>
                        <div className="productRow__header">
                            {port !== null &&
                                port !== undefined && (
                                    <span className="productRow__personalInfo bodyText">
                                        {port.longName}
                                    </span>
                                )}
                            <a className="productRow__title" href="#">
                                {name}
                            </a>
                            <span className="bodyText productRow__dateTime">
                                {plainDateFormat(
                                   new Date(startDateTime.substring(0, startDateTime.length - 1)),
                                   'DD MMM YYYY | h.mma'
                                )}
                            </span>
                            {!notAvailableAnymore &&
                                !isOutOfStock &&
                                this.createLink(groupID, name)}
                        </div>
                        <div className="productRow__body">
                            <a className="productRow__img" href="#" >
                                <img src={thumbnail} alt={labels.imageAlt ? labels.imageAlt : ''} />
                            </a>

                            <div className="productRow__col">
                                <h5>{guestsLabel}</h5>
                                <ul className="productRow__ul">
                                    {data.map(this.createPassenger)}
                                </ul>
                            </div>
                            <div className="productRow__col pricing">
                                <h5>{pricingLabel}</h5>
                                <p key="shoppingcart-item-pricing-subtotal">
                                    <span className="label__col">
                                        {`${subtotalLabel}`}:
                                    </span>
                                    <span className="value__col">
                                        <CurrencyFormat
                                            value={subtotalPrice}
                                            currencyCode={currencyIso}
                                        />
                                    </span>
                                </p>
                                {loyalityDiscount > 0 && (
                                    <p key="shoppingcart-item-pricing-loyalitydiscount">
                                        <span className="label__col">{`${loyaltyDiscountLabel}:`}</span>
                                        <span className="value__col">
                                            -<CurrencyFormat
                                                value={loyalityDiscount}
                                                currencyCode={currencyIso}
                                            />
                                        </span>
                                    </p>
                                )}
                                <p
                                    className="total-price"
                                    key="shoppingcart-item-pricing-total"
                                >
                                    <span className="label__col">{`${totalLabel}`}</span>
                                    <span className="value__col">
                                        <CurrencyFormat
                                            value={totalPrice}
                                            currencyCode={currencyIso}
                                        />
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </li>
        );
    }
}
export default shoppingcartItem;
