'use strict';

import React from 'react';
import SessionStorage from '../commons/CUK/session-storage';
import CurrencyFormat from '../commons/CUK/currencyFormat';
import { calculateDiffDays } from '../commons/CUK/dateFormat';
import analytics from '../commons/CUK/analytics';
import { capitalizeString } from '../commons/CUK/utilities';

class cartItemAllInclusive extends React.Component {
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

    closeTooltip(e) {
        analytics.clickTracking(this);
        e.preventDefault();
        this.setState({ hover: false });
    }
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

    renderDataItem = (p, i) => {
        const {
            passenger: { title, firstName, lastName },
            basePrice: { value, currencyIso }
        } = p;
        const { data } = this.props;
        const {
            product: {
                attributes: { name }
            }
        } = data[i];
        const cruiseData = SessionStorage.getItem('cruiseData') || {};
        const { durationCruise = 0 } = cruiseData;
        let pvalue = value * durationCruise;
        pvalue = pvalue.toFixed(2);
        const passengerName = `${title} ${firstName} ${lastName}`;
        return (
            <li key={i}>
                <span className="productRow__userName" tabIndex={0}>{capitalizeString(passengerName)}</span>
                <span className="productRow__singlePrice" tabIndex={0}>
                    <CurrencyFormat
                        value={pvalue}
                        currencyCode={currencyIso}
                        decimalSup={true}
                        decimal={true}
                    />
                </span>
                <h6 className="productRow__nameDetail" tabIndex={0}>{name}</h6>
            </li>
        );
    };

    renderLoyaltyDiscount() {
        const { labels, data } = this.props;
        return (
            <p key="shoppingcart-item-pricing-loyalitydiscount">
                <span className="label__col" tabIndex={0}>
                    {`${labels.loyaltyDiscountLabel}:`}
                </span>
                <span className="value__col" tabIndex={0}>
                    -<CurrencyFormat
                        value={data.pricing.loyalityDiscount}
                        currencyCode={data[0].basePrice.currencyIso}
                        decimal={true}
                        decimalSup={true}
                    />
                </span>
            </p>
        );
    }
    renderProductPromotionDiscount() {
        const { labels, data } = this.props;
        return (
            <p key="shoppingcart-item-pricing-loyalitydiscount">
                <span className="label__col" tabIndex={0}>{`${
                    labels.productPromotionDiscountLabel
                        ? labels.productPromotionDiscountLabel
                        : ''
                }:`}</span>
                <span className="value__col" tabIndex={0}>
                    -<CurrencyFormat
                        value={data.pricing.promotionDiscount}
                        currencyCode={data[0].basePrice.currencyIso}
                        decimal={true}
                        decimalSup={true}
                    />
                </span>
            </p>
        );
    }
    render() {
        const { labels, data, removed, accesibilityLabels } = this.props;

        const {
            groupID,
            product: {
                attributes: { name },
                stock: { stockLevel },
                thumbnail,
                primaryImageUrl,
                code,
                url
            },
            basePrice
        } = data[0];

        const thumbnail_logo = thumbnail || primaryImageUrl;

        const stockLevelNotification = labels.limitedStockNotificationLabel.replace(
            '{stock}',
            stockLevel
        );

        const notification = {
            __html: `${labels.removeNotificationLabel.replace(
                '{item}',
                `<a href='#'>${name}</a>`
            )}`
        };

        //const userData = SessionStorage.getItem('userData');
        const cruiseData = SessionStorage.getItem('cruiseData') || {};
        const { durationCruise = 0 } = cruiseData;
        // const { embarkationDate, disembarkationDate } = userData;
        // let parts;

        // parts = embarkationDate.split('-');
        // const embarkationDay = new Date(parts[0], parts[1] - 1, parts[2]);
        // parts = disembarkationDate.split('-');
        // const disembarkationDay = new Date(parts[0], parts[1] - 1, parts[2]);

        // const cruiseLength =
        //     calculateDiffDays(
        //         embarkationDay.getTime(),
        //         disembarkationDay.getTime()
        //     ) - 1;

        // const cruiseLength = Math.round(
        //     (disembarkationDay.getTime() - embarkationDay.getTime()) / oneDay
        // );
        const cruiseLength = durationCruise;
        const subtotal = data.reduce(
            (subtotal, dataItem) => (subtotal += dataItem.basePrice.value),
            0
        );
        let total = subtotal * cruiseLength - data.pricing.loyalityDiscount;

        return (
            <li className="productRow" data-groupID={groupID}>
                {removed && (
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
                )}
                {!removed && (
                    <div>
                        <div className="productRow__header">
                            <span className="productRow__personalInfo bodyText">
                                {labels.drinksLabel}
                            </span>
                            <a className="productRow__title" href={url}>
                                {labels.allInclusiveLabel}
                            </a>
                            <a
                                href="#"
                                className="productRow__cta"
                                onClick={this.handleRemove}
                                aria-label={`${labels.removeLabel} ${
                                    labels.allInclusiveLabel
                                }`}
                            >
                                <span>{labels.removeLabel}</span>
                            </a>
                        </div>
                        <div className="productRow__body">
                            <a
                                className="productRow__img primary__img"
                                href={url}
                                title={
                                    accesibilityLabels.imageAlt
                                        ? `${accesibilityLabels.imageAlt} ${name}`
                                        : ''
                                }
                            >
                                <img src={thumbnail_logo} />
                            </a>

                            <div className="productRow__col">
                                <h5
                                    role="heading"
                                    aria-level="2"
                                    aria-label={labels.guestsLabel}
                                    tabIndex={0}
                                >
                                    {labels.guestsLabel}
                                </h5>
                                <ul className="productRow__ul">
                                    {data.map(this.renderDataItem)}
                                </ul>
                            </div>
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
                                        {labels.subtotalLabel}:
                                    </span>
                                    <span className="value__col" tabIndex={0}>
                                        <CurrencyFormat
                                            value={data.pricing.subtotalPrice.toFixed(
                                                2
                                            )}
                                            currencyCode={basePrice.currencyIso}
                                            decimalSup={true}
                                            decimal={true}
                                        />
                                    </span>
                                </p>
                                {/* <p>
                                    <span className="label__col">
                                        {labels.cruiseLengthLabel}
                                    </span>
                                    <span className="value__col">
                                        {cruiseLength} days
                                    </span>
                                </p> */}
                                {data.pricing.promotionDiscount > 0 &&
                                    this.renderProductPromotionDiscount()}
                                {data.pricing.loyalityDiscount > 0 &&
                                    this.renderLoyaltyDiscount()}
                                <p
                                    className="total-price"
                                    key="shoppingcart-item-pricing-total"
                                >
                                    <span className="label__col" tabIndex={0}>
                                        {labels.totalLabel}
                                    </span>
                                    <span className="value__col" tabIndex={0}>
                                        <CurrencyFormat
                                            value={data.pricing.totalPrice.toFixed(
                                                2
                                            )}
                                            currencyCode={basePrice.currencyIso}
                                            decimalSup={true}
                                            decimal={true}
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
export default cartItemAllInclusive;
