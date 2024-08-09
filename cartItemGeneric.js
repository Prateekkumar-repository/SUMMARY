'use strict';

import React from 'react';
import CurrencyFormat from '../commons/CUK/currencyFormat';
import analytics from '../commons/CUK/analytics';
import { capitalizeString, convertLabelsToLowerCase } from '../commons/CUK/utilities';
import PersonalisationsModal from '../commons/CUK/personalisationModal';

class cartItemGeneric extends React.Component {
    constructor(props) {
        super(props);
        const { formatedLabels } = convertLabelsToLowerCase(this.props.genericLabels);
        this.state = {
            showModal: false,
            genericLabels: formatedLabels
        };
    }

    removeNotification = (e) => {
        analytics.clickTracking(this);
        e.preventDefault();
        e.currentTarget.parentNode.remove();
    };

    handleRemove = (e) => {
        const { data, onRemove } = this.props;
        const { groupID } = data[0];
        onRemove && onRemove(e, groupID);
    };

    createPassenger = (p, i) => {
        const {
            passenger: { title, firstName, lastName },
            basePrice: { value, currencyIso }
        } = p;
        const passengerName = `${title} ${firstName} ${lastName}`;
        return (
            <li key={i}>
                <span className="productRow__userName" tabIndex={0}>
                    {capitalizeString(passengerName)}
                </span>
                <span className="productRow__singlePrice" tabIndex={0}>
                    <CurrencyFormat value={value} currencyCode={currencyIso} />
                </span>
            </li>
        );
    };

    render() {
        const { labels, data, removed, accesibilityLabels } = this.props;
        const {
            pricing: {
                subtotalPrice,
                loyalityDiscount,
                totalPrice,
                promotionDiscount
            }
        } = data;
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
            loyaltyDiscountLabel,
            productPromotionDiscountLabel,
            removeLabel,
            personalisationsLinkLabel
        } = labels;
        const {
            product: {
                stock: { stockLevel, stockLevelStatus },
                thumbnail,
                primaryImageUrl,
                code,
                url,
                name,
                mycruiseProductType,
                productFamily
            },
            groupID,
            basePrice: { currencyIso },
            instanceStatus,
            error,
            productConfigurations
        } = data[0]; // CK

        const thumbnail_logo = thumbnail || primaryImageUrl; // CK

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
            error !== undefined && error !== null ? true : false;
        const isOutOfStock = stockLevel === 0 ? true : false;
        const isLowStock = stockLevelStatus === 'lowStock' ? true : false;
        const isOnHold =
            instanceStatus && instanceStatus === 'ON_HOLD' ? true : false;
        const notificationLabel =
            !removed &&
            (notAvailableAnymore
                ? notOnSaleAnymoreNotificationLabel
                : isOnHold
                    ? onHoldNotificationLabel.replace('{productCode}', code)
                    : isOutOfStock
                        ? outOfStockNotificationLabel
                        : isLowStock
                            ? stockLevelNotification
                            : false);

        return (
            <li className="productRow genericItem" data-groupid={groupID}>
                {notificationLabel && (
                    <div className="productRow__removeNotification errorNotification">
                        <span>{notificationLabel}</span>
                        <a
                            href="#"
                            className="productRow__cta error_ProductRow__cta"
                            onClick={this.handleRemove}
                        >
                            <span>{removeLabel}</span>
                        </a>
                    </div>
                )}
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
                    <div>
                        <div className="productRow__header">
                            {mycruiseProductType && (
                                <span className="productRow__personalInfo bodyText">
                                    {capitalizeString(mycruiseProductType)}
                                </span>
                            )}
                            <a className="productRow__title" href={url}>
                                {name}
                            </a>
                            {!!productConfigurations &&
                                <div
                                    className="productPersonalisation"
                                    onClick={() => {
                                        this.setState({ showModal: true });
                                    }}
                                >
                                    {personalisationsLinkLabel ||
                                        'View Personalisations'}
                                </div>
                            }
                            {!notAvailableAnymore &&
                                !isOutOfStock &&
                                !isLowStock && (
                                    <a
                                        href="#"
                                        className="productRow__cta"
                                        onClick={this.handleRemove}
                                        aria-label={`${removeLabel} ${name}`}
                                    >
                                        <span>{removeLabel}</span>
                                    </a>
                                )}
                        </div>
                        <div className="productRow__body">
                            <a
                                className="productRow__img"
                                href={url}
                                title={
                                    accesibilityLabels.imageAlt
                                        ? `${accesibilityLabels.imageAlt
                                        } ${name}`
                                        : ''
                                }
                            >
                                <img src={thumbnail_logo} />
                            </a>

                            <div className="productRow__col">
                                <h5
                                    role="heading"
                                    aria-level="2"
                                    aria-label={guestsLabel}
                                    tabIndex={0}
                                >
                                    {guestsLabel}
                                </h5>
                                <ul className="productRow__ul">
                                    {data.map(this.createPassenger)}
                                </ul>
                            </div>
                            <div className="productRow__col pricing">
                                <h5
                                    role="heading"
                                    aria-level="3"
                                    aria-label={pricingLabel}
                                    tabIndex={0}
                                >
                                    {pricingLabel}
                                </h5>
                                <p key="shoppingcart-item-pricing-subtotal">
                                    <span className="label__col" tabIndex={0}>
                                        {`${subtotalLabel}`}:
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
                                        <span
                                            className="label__col"
                                            tabIndex={0}
                                        >{`${productPromotionDiscountLabel}:`}</span>
                                        <span
                                            className="value__col"
                                            tabIndex={0}
                                        >
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
                                        <span
                                            className="label__col"
                                            tabIndex={0}
                                        >{`${loyaltyDiscountLabel}:`}</span>
                                        <span
                                            className="value__col"
                                            tabIndex={0}
                                        >
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
                                    <span
                                        className="label__col"
                                        tabIndex={0}
                                    >{`${totalLabel}`}</span>
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
                        </div>
                    </div>
                )}
                {this.state.showModal && (
                    <PersonalisationsModal
                        showModal={this.state.showModal}
                        hideModal={() =>
                            this.setState({ showModal: false })
                        }
                        productName={name}
                        productConfigurations={productConfigurations}
                        mycruiseProductType={
                            mycruiseProductType
                        }
                        productFamily={
                            productFamily
                        }
                        underlayClass="generic-item"
                        commonLabels={this.props.labels}
                        genericLabels={this.state.genericLabels}
                    />
                )}
            </li>
        );
    }
}
export default cartItemGeneric;
