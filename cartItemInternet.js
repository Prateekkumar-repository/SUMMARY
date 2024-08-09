'use strict';

import React from 'react';
import SessionStorage from '../commons/CUK/session-storage';
import CurrencyFormat from '../commons/CUK/currencyFormat';
import analytics from '../commons/CUK/analytics';
import { capitalizeString } from '../commons/CUK/utilities';

class CartItemInternet extends React.Component {
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
        const { data, labels } = this.props;
        const {
            product: { numberOfDevices }
        } = data[i];
        const cruiseData = SessionStorage.getItem('cruiseData') || {};
        const { durationCruise = 0 } = cruiseData;

        const cruiseLength = durationCruise;
        const { deviceInternetLabel, devicesInternetLabel, daysLabel } = labels;
        let devicelabel =
            numberOfDevices && numberOfDevices == 1
                ? deviceInternetLabel
                : devicesInternetLabel;
        const totalBaseprice = value * cruiseLength;
        const passengerName = `${title} ${firstName} ${lastName}`;
        return (
            <li key={i}>
                <span className="productRow__userName list_item" tabIndex={0}>{capitalizeString(passengerName)}</span>
                <span className="productRow__singlePrice list_item singlePrice" tabIndex={0}>
                    <CurrencyFormat
                        value={totalBaseprice}
                        currencyCode={currencyIso}
                        decimalSup={true}
                        decimal={true}
                    />
                </span>
                <h6 className="productRow__nameDetail devices list_item device" tabIndex={0}>
                    {`${numberOfDevices} ${devicelabel} - ${cruiseLength} ${daysLabel}`}
                </h6>
            </li>
        );
    };

    render() {
        const { labels, data, removed, accesibilityLabels } = this.props;
        const {
            subtotalPrice,
            loyalityDiscount,
            totalPrice,
            promotionDiscount
        } = data.pricing;
        const {
            groupID,
            product: { thumbnail, primaryImageUrl, name, url },
            basePrice
        } = data[0];
        const { currencyIso } = basePrice;
        const thumbnail_logo = thumbnail || primaryImageUrl;

        const notification = {
            __html: `${labels.removeNotificationLabel.replace(
                '{item}',
                `<a href='#'>${name}</a>`
            )}`
        };

        return (
            <li className="productRow internet" data-groupID={groupID}>
                {removed && (
                    <div className="productRow__removeNotification">
                        <span dangerouslySetInnerHTML={notification} />
                        <a
                            href="#"
                            className="close removenotification"
                            tabIndex={0}
                            role={'button'}
                            aria-Label={
                                accesibilityLabels &&
                                accesibilityLabels.ariaRemoveLabel
                                    ? accesibilityLabels.ariaRemoveLabel
                                    : ''
                            }
                            onClick={this.removeNotification}
                        />
                    </div>
                )}
                {!removed && (
                    <div>
                        <div className="productRow__header i_header">
                            <span className="productRow__personalInfo bodyText i_text">
                                {labels.internetLabel}
                            </span>
                            <a className="productRow__title i_title" href={url}>
                                {name}
                            </a>
                            <a
                                href="#"
                                className="productRow__cta"
                                onClick={this.handleRemove}
                                aria-label={`${labels.removeLabel} ${name}`}
                            >
                                <span>{labels.removeLabel}</span>
                            </a>
                        </div>
                        <div className="productRow__body i_body">
                            <a
                                className="productRow__img internet_img"
                                href={url}
                                title={
                                    accesibilityLabels.imageAlt
                                        ? `${accesibilityLabels.imageAlt} ${name}`
                                        : ''
                                }
                            >
                                <img src={thumbnail_logo} />
                            </a>

                            <div className="productRow__col guest_list">
                                <h5
                                    role="heading"
                                    aria-level="2"
                                    aria-label={labels.guestsLabel}
                                    tabIndex={0}
                                >
                                    {labels.guestsLabel}
                                </h5>
                                <ul className="productRow__ul i_list">
                                    {data.map(this.renderDataItem)}
                                </ul>
                            </div>
                            <div className="productRow__col pricing i_pricing">
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
                                            value={subtotalPrice}
                                            currencyCode={currencyIso}
                                            decimalSup={true}
                                            decimal={true}
                                        />
                                    </span>
                                </p>
                                {/* <p>
                                    <span className="label__col" tabIndex={0}>
                                        {labels.cruiseLengthLabel}
                                    </span>
                                    <span className="value__col" tabIndex={0}>
                                        {cruiseLength} days
                                    </span>
                                </p> */}
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
export default CartItemInternet;
