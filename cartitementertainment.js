'use strict';

import React from 'react';
import moment from 'moment';
import { plainDateFormat } from '../commons/CUK/dateFormat';
import CurrencyFormat from '../commons/CUK/currencyFormat';
import analytics from '../commons/CUK/analytics';
import SessionStorage from '../commons/CUK/session-storage';
import { calculateAge, calculateDiffDays } from '../commons/CUK/dateFormat';
import { log } from 'debug';
import { capitalizeString } from '../commons/CUK/utilities';

class cartitementertainment extends React.Component {
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
        const { title, firstName, lastName } = p;
        const passengerName = `${title} ${firstName} ${lastName}`;
        return (
            <span
                key={i}
                className="productRow__userName"
                tabIndex={0}
            >{capitalizeString(passengerName)}</span>
        );
    };
    renderPaxSeatNo = (p, i) => {
        const allocatedSpace = p.allocatedSpace ? p.allocatedSpace : '';
        return (
            <span key={i} className="productRow__userName">
                {allocatedSpace}
            </span>
        );
    };

    checkPaxSeatNo = (p, i) => {
        const { allocatedSpace } = p;
        if (allocatedSpace) {
            return true;
        } else {
            return false;
        }
    };

    findPassengersName = (data) => {
        const { passengers } = SessionStorage.getItem('orderedList');
        data.map((p) => {
            const pn = p.paxNo;
            passengers.forEach((passenger) => {
                if (+passenger.paxNumber === +pn) {
                    p.title = passenger.title;
                    p.firstName = passenger.firstName;
                    p.lastName = passenger.lastName;
                }
            });
        });
        return data;
    };
    render() {
        const { labels, data, removed, accesibilityLabels } = this.props;
        let passengerList = Array.isArray(data[0].passenger)
            ? data[0].passenger
            : [data[0].passenger];
        if (
            data[0].additionalPassengers &&
            data[0].additionalPassengers.length
        ) {
            passengerList = [...passengerList, ...data[0].additionalPassengers];
        }

        // data[0].passenger = this.findPassengersName(passengerList);
        data[0]['allpassenger'] = [];
        // data[0].passenger = this.findPassengersName(passengerList);
        data[0]['allpassenger'] = this.findPassengersName(passengerList);

        const {
            subtotalPrice,
            loyalityDiscount,
            totalPrice,
            promotionDiscount
        } = data.pricing;
        const { groupID, product, basePrice, status } = data[0];
        const {
            url,
            code,
            thumbnail,
            primaryImageUrl, // CK
            duration,
            attributes,
            name
        } = product;
        const header = SessionStorage.getItem('header');
        const { embarkationDate, disembarkationDate } = header;

        const dayOfCruiseEmbark = new Date(
            moment(embarkationDate, 'YYYY-MM-DD').format('ll')
        );
        const dayOfCruiseDeparture = new Date(
            moment(disembarkationDate, 'YYYY-MM-DD').format('ll')
        );
        const diffDays = calculateDiffDays(
            dayOfCruiseEmbark,
            dayOfCruiseDeparture
        );
        const { startDateTime } = attributes;
        const { currencyIso } = basePrice;
        const thumbnail_logo = thumbnail || primaryImageUrl; // CK
        const notification = {
            __html: `${labels.removeNotificationLabel.replace(
                '{item}',
                `<a href='#'>${name}</a>`
            )}`
        };

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
                    <div>
                        <div
                        // className={
                        //     status && status != 'ACTIVE'
                        //         ? 'expired-main'
                        //         : ''
                        // }
                        >
                            <div className="productRow__header">
                                <span className="productRow__personalInfo bodyText">
                                    {labels.entertainmentLabel}
                                </span>
                                <a
                                    className="productRow__title"
                                    href={url.replace(/\\/g, '')}
                                >
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
                                {/* {status && status == 'ACTIVE' ? (
                                    <a
                                        href="#"
                                        className="productRow__cta"
                                        onClick={this.handleRemove}
                                        aria-label={`${labels.removeLabel} ${name}`}
                                    >
                                        <span>{labels.removeLabel}</span>
                                    </a>
                                ) : (
                                    ''
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
                                    href={url.replace(/\\/g, '')}
                                    title={
                                        accesibilityLabels.imageAlt
                                            ? `${accesibilityLabels.imageAlt} ${name}`
                                            : ''
                                    }
                                >
                                    <img
                                        src={thumbnail_logo.replace(/\\/g, '')}
                                    />
                                </a>

                                <div className="productRow__col entertainment">
                                    <h5
                                        role="heading"
                                        aria-level="2"
                                        aria-label={labels.guestsLabel}
                                        tabIndex={0}
                                    >
                                        {labels.guestsLabel}
                                    </h5>
                                    <ul className="productRow__ul">
                                        {data[0].allpassenger.map((p, i) => (
                                            <li>
                                                <span className="productRow__userName">
                                                    {this.renderPaxName(p, i)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {/* <div className="productRow__col entertainment">
                                    <h5>{labels.seatLabel}</h5>
                                    <ul className="productRow__ul">
                                        {data[0].allpassenger.map((p, i) => (
                                            <li>
                                                <span className="productRow__value">
                                                    {this.renderPaxSeatNo(p, i)}
                                                </span>
                                                {this.checkPaxSeatNo(p, i) ? (
                                                    <span className="productRow__value holidaylabel">
                                                        <span className="productRow__holidaylabel">
                                                            {`${
                                                                labels.includedholidayLabel
                                                            }`}
                                                        </span>
                                                    </span>
                                                ) : (
                                                    ''
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div> */}
                                <div className="productRow__col entertainment pricing">
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
                                                {`${
                                                    labels.loyaltyDiscountLabel
                                                }:`}
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
                                    <p key="cruiseduration">
                                        <span className="label__col" tabIndex={0}>
                                            {`${labels.cruisedurationLabel}:`}
                                        </span>
                                        <span className="value__col" tabIndex={0}>
                                            {`${diffDays} ${labels.daysLabel}`}
                                        </span>
                                    </p>
                                    <p
                                        className="total-price"
                                        key="shoppingcart-item-pricing-total"
                                    >
                                        <span className="label__col" tabIndex={0}>
                                            {`${labels.totalLabel}`}
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
                            </div>
                        </div>
                        {/* {status && status != 'ACTIVE' ? (
                            <span className="productRow__cta nounderline expired_inactive">
                                <a
                                    href="#"
                                    className="expired"
                                    onClick={(e) => e.preventDefault()}
                                >
                                    {' '}
                                    <span>{labels.expiredLabel}</span>
                                </a>
                                <a
                                    href={url.replace(/\\/g, '')}
                                    className="rebook"
                                >
                                    <span>{labels.rebookLabel}</span>
                                </a>
                            </span>
                        ) : (
                            ''
                        )} */}
                    </div>
                )}
            </li>
        );
    }
}
export default cartitementertainment;
