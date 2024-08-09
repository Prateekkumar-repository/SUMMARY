'use strict';

import React from 'react';
import { plainDateFormat } from '../commons/CUK/dateFormat';
import CurrencyFormat from '../commons/CUK/currencyFormat';
import analytics from '../commons/CUK/analytics';
import { capitalizeString } from '../commons/CUK/utilities';

class cartItemSpa extends React.Component {
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

    handleRemove = (e) => {
        const { data, onRemove } = this.props;
        const { groupID } = data[0];
        onRemove && onRemove(e, groupID);
    };

    renderPaxName = (p, i) => {
        const {
            passenger: { title, firstName, lastName },
            basePrice: { value, currencyIso }
        } = p;
        const passengerName = `${title} ${firstName} ${lastName}`;
        return (
            <li key={i}>
                <span className="productRow__userName" tabIndex={0}>{capitalizeString(passengerName)}</span>
                <span className="productRow__singlePrice" tabIndex={0}>
                    <CurrencyFormat value={value} currencyCode={currencyIso} />
                </span>
            </li>
        );
    };

    render() {
        const {
            labels,
            data,
            removed,
            hairLengthLabels,
            accesibilityLabels
        } = this.props;
        const {
            subtotalPrice,
            loyalityDiscount,
            totalPrice,
            promotionDiscount
        } = data.pricing;
        const { groupID, product, basePrice } = data[0];
        const {
            url,
            code,
            thumbnail,
            primaryImageUrl, // CK
            duration,
            variation,
            attributes,
            name
        } = product;
        const durationTreatment = data[0].attributes.treatmentDuration;
        const treatmentName = data[0].attributes.name;
        const { startDateTime } = attributes;
        const { currencyIso } = basePrice;
        const totalPriceSpa = totalPrice;
        const thumbnail_logo = thumbnail || primaryImageUrl; // CK
        const notification = {
            __html: `${labels.removeNotificationLabel.replace(
                '{item}',
                `<a href='#'>${name}</a>`
            )}`
        };
        const offeringType = data[0].attributes.offeringType;
        return (
            <li className="productRow" data-groupID={groupID}>
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
                            <span className="productRow__personalInfo bodyText">
                                {labels.spaLabel}
                            </span>
                            <a className="productRow__title" href={url}>
                                {name}
                            </a>
                            {offeringType !== 'MULTI_DAY_PASS' && (
                                <span className="bodyText productRow__dateTime">
                                    {offeringType !== 'ONE_DAY_PASS'
                                        ? `${plainDateFormat(
                                              new Date(
                                                  startDateTime.substring(
                                                      0,
                                                      startDateTime.length - 1
                                                  )
                                              ),
                                              'DD MMM YYYY | h.mma'
                                          )} | ${durationTreatment} ${labels.minLabel}`
                                        : `${plainDateFormat(
                                              new Date(
                                                  startDateTime.substring(
                                                      0,
                                                      startDateTime.length - 1
                                                  )
                                              ),
                                              'MMM DD'
                                          )} | ${durationTreatment} ${labels.minLabel}`}
                                </span>
                            )}
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
                                {/* <p className="productDes" tabIndex={0}>{name}</p> */}
                                <ul className="productRow__ul">
                                    {/* <li>
                                        <span tabIndex={0}>{labels.durationLabel} </span>
                                        <span tabIndex={0}>{durationTreatment + ' '}</span>
                                        <span tabIndex={0}>{labels.minLabel} </span>
                                    </li>
                                    {variation && (
                                        <li>
                                            <span tabIndex={0}>{labels.variation} </span>
                                            <span className="productRow__value" tabIndex={0}>
                                                {hairLengthLabels[variation]}
                                            </span>
                                        </li>
                                    )}
                                    <li>
                                        <span tabIndex={0}>{labels.guestLabel} </span>
                                        <span className="productRow__value" tabIndex={0}>
                                            {data.map(this.renderPaxName)}
                                        </span>
                                    </li> */}
                                    {variation && (
                                        <li>
                                            <span tabIndex={0}>{labels.variation} </span>
                                            <span className="productRow__userName" tabIndex={0}>
                                                {hairLengthLabels[variation]}
                                            </span>
                                        </li>
                                    )}
                                    {data.map(this.renderPaxName)}
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
                                        {`${labels.totalLabel}`}
                                    </span>
                                    <span className="value__col" tabIndex={0}>
                                        <CurrencyFormat
                                            value={totalPriceSpa}
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
            </li>
        );
    }
}
export default cartItemSpa;
