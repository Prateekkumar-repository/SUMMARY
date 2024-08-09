import React, { useEffect, useRef, useState } from 'react';
import InputField from '../commons/CUK/inputField';
import FetchData from '../commons/CUK/fetch-data';
import { getConfig, priceConvInDecimal } from '../commons/CUK/utilities';
import SessionStorage from '../commons/CUK/session-storage';
import { getPriceSymbolForCurrencyCode } from '../commons/CUK/currencyFormat';
import Loader from '../commons/CUK/loader';

const CouponDiscount = (props) => {
    const [couponSubmit, setCouponSubmit] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [previousCoupon, setPreviousCoupon] = useState([]);
    const [showError, setShowError] = useState(false);
    const labels = props.labels ? props.labels : {};
    const apikeyMycruise = getConfig('apikeyMycruise', '');
    const header = SessionStorage.getItem('header');
    const encryptedCartCode = props.encryptedCartCode;
    const [errMsg, setErrorMsg] = useState('');
    const [showLoader, setShowLoader] = useState(false);
    const couponRef = useRef(null);

    const errormsg = {
        COUPON_ALREADY_EXITS: 'couponAlreadyAppliedLabel',
        INVALID_COUPON_CODE: 'invalidcouponLabel',
        COUPON_GENERAL_ERROR: 'couponGeneralLabel',
        COUPON_REDEEM_ERROR: 'couponRedeemLabel',
        CART_NOT_FOUND: 'cartNotFound',
        COUPON_MAX_REDEMPTION_REACHED : "maxCouponRedemption"
    };
    useEffect(
        () => {
            setPreviousCoupon(
                props.appliedVouchers.length > 0 ? props.appliedVouchers : []
            );
            setCouponSubmit(props.appliedVouchers.length > 0 ? true : false);
            setShowLoader(false);
        },
        [props.appliedVouchers, props.couponDiscounts]
    );

    const getLabels = (key) => {
        return labels[key] ? labels[key] : '';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowLoader(true);
        if (couponCode == '') {
            setShowError(true);
            setShowLoader(false);
        } else {
            applyDiscount();
        }
    };

    const removeCoupon = (coupCode,e) => {
        e.preventDefault()
        setShowLoader(true);
        const removeApiUrl = props.removeCouponApi;
        let param = {
            couponCode: coupCode,
            cartId: encryptedCartCode,
            locale: props.lacale.locale
        };
        FetchData(removeApiUrl, {
            method: 'PUT',
            body: JSON.stringify(param),
            headers: {
                'Content-Type': 'application/json',
                'X-CommonData': JSON.stringify(header),
                'X-Source-Identity-Token-0': apikeyMycruise
            }
        })
            .then((res) => {
                if (res && res.errors && Object.keys(res.errors).length !== 0) {
                    setShowError(true);
                    setShowLoader(false);
                } else {
                    document.getElementsByClassName(
                        'input-field'
                    )[0].placeholder =
                        previousCoupon.length - 1 < res.cart.maxCouponRedemption
                            ? getLabels('couponPlaceHolder')
                            : '';
                    props.updateCart();
                }
            })
            .catch((err) => {
                setShowError(true);
                console.log('====>>>>', err);
                setShowLoader(false);
            });
    };

    const applyDiscount = () => {
        const url = props.servicesUrl;
        let params = {
            couponCode: couponCode,
            cartId: encryptedCartCode,
            locale: props.lacale.locale
        };
        FetchData(url, {
            method: 'POST',
            body: JSON.stringify(params),
            headers: {
                'X-Source-Identity-Token-0': apikeyMycruise,
                'Content-Type': 'application/json',
                'X-CommonData': JSON.stringify(header)
            }
        })
            .then((response) => {
                if (
                    response &&
                    response.errors &&
                    Object.keys(response.errors).length !== 0
                ) {
                    if (response.errors.errorCode in errormsg) {
                        setShowError(true);
                        let errorMessage = errormsg[response.errors.errorCode];
                        setErrorMsg(getLabels(errorMessage));
                        setShowLoader(false);
                    } else {
                        setShowError(true);
                        setErrorMsg(response.errors.errorMessage);
                        setShowLoader(false);
                    }
                } else {
                    if(showError){
                        setShowError(false)
                    }
                    setCouponCode('');
                    setCouponSubmit(true);
                    document.getElementsByClassName(
                        'input-field'
                    )[0].placeholder =
                        previousCoupon.length + 1 <
                        response.cart.maxCouponRedemption
                            ? getLabels('couponPlaceHolder')
                            : '';
                    props.updateCart(couponCode);

                    setTimeout(() => {
                        let currentEle = couponRef.current && couponRef.current.getElementsByClassName(`couponCode ${couponCode}`);
                        // console.log('currentEle===>', currentEle);
                        if(currentEle && currentEle[0]) {
                            currentEle[0].tabIndex = '0';
                            currentEle[0].focus();
                            currentEle[0].tabIndex= '-1';
                        }
                        // couponRef.current.childNodes[
                        //     couponRef.current.childNodes.length - 1
                        // ].childNodes[0].childNodes[0].childNodes[0].tabIndex =
                        //     '0';
                        // couponRef.current.childNodes[
                        //     couponRef.current.childNodes.length - 1
                        // ].childNodes[0].childNodes[0].childNodes[0].focus();
                        // couponRef.current.childNodes[
                        //     couponRef.current.childNodes.length - 1
                        // ].childNodes[0].childNodes[0].childNodes[0].tabIndex =
                        //     '-1';
                    }, 800);
                }
            })
            .catch((err) => {
                setShowError(true);
                console.log('====>>>>', err);
                setShowLoader(false);
            });
    };

    return (
        <React.Fragment>
            {showLoader && (
                <div className="throbberOverlay">
                    <Loader show={true} />
                </div>
            )}
            <div className="couponContainer">
                <div
                    className={`primarryInputContainer ${
                        !couponSubmit ? 'brBottom' : 'topBorder'
                    }`}
                >
                    <form
                        className={`couponInputContainer ${
                            props.maxCoupon === previousCoupon.length
                                ? 'disable'
                                : ''
                        }`}
                    onSubmit={(e)=> {e.preventDefault()}}
                    >
                        <InputField
                            placeholder={
                                previousCoupon.length >= props.maxCoupon
                                    ? ''
                                    : getLabels('couponPlaceHolder')
                            }
                            type={'text'}
                            showCustomError={showError}
                            customErrorMsg={
                                errMsg !== ''
                                    ? errMsg
                                    : getLabels('invalidcouponLabel')
                            }
                            showError={showError}
                            showBorderError={showError}
                            changeCallback={(e) => {
                                setCouponCode(e.target.value);
                                setErrorMsg('');
                                setShowError(false);
                            }}
                            onBlur={(e) => {e && e.preventDefault(); return false;}}
                            showClearInput={showError}
                            value={couponCode}
                            inputClass={'couponInputWrapper'}
                            inputDisable={previousCoupon.length < props.maxCoupon ? false : true}
                        />

                        <div className="cta-block">
                            <button
                                className={`primary-cta-Coupon`}
                                type="button"
                                onClick={(e) => {
                                    previousCoupon.length < props.maxCoupon
                                        ? handleSubmit(e)
                                        : e.preventDefault();
                                }}
                                disabled={previousCoupon.length < props.maxCoupon ? false : true}
                            >
                                {getLabels('couponCtcLabel')}
                            </button>
                        </div>
                    </form>
                </div>
                {previousCoupon.length > 0 && (
                    <div key={'couponlist-wrapper'} className="borderAround" ref={couponRef}>
                        {previousCoupon.map((item, index) => (
                            <div className="applideCouponCOntainer">
                                <div className="submitCodeContainer">
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        <h6
                                            className={`couponCode ${item.code}`}
                                            id="applyText"
                                            aria-label={`${item.code +
                                                ' ' +
                                                getLabels(
                                                    'couponAppliedLabel'
                                                )}`}
                                        >
                                            {item.code}
                                        </h6>
                                        
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                    >
                                        {item.value && (
                                            <span className="value">
                                                -{`${
                                                    props.currSymbol
                                                }${item.value.toFixed(
                                                    2
                                                )}`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex' }}>
                                    <p
                                        className="couponSubtitle"
                                        tabIndex={-1}
                                        aria-hidden={true}
                                    >
                                        {getLabels(
                                            'couponAppliedLabel'
                                        )}
                                    </p>
                                    <a
                                        tabIndex={0}
                                        className="removeLink"
                                        role="button"
                                        onClick={(e) => {
                                            removeCoupon(
                                                item.code,
                                                e
                                            );
                                        }}
                                        onKeyDown={(e)=> {e.key=="Enter" ? removeCoupon(
                                            item.code,
                                            e
                                        ) : "" }}
                                        aria-label={`${item.code +
                                            ' ' +
                                            getLabels(
                                                'ariaLabelCoupon'
                                            ) +
                                            ' ' +
                                            getLabels(
                                                'removeCouponLabel'
                                            )}`}
                                    >
                                        {getLabels('removeCouponLabel')}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="amountContainer">
                    <p className="amountLabel">
                        {getLabels('paidAmountLabel')}
                    </p>
                    <p className="amountValue">{`${
                        props.currSymbol
                    }${props.amountPayble.value.toFixed(2)}`}</p>
                </div>
            </div>
        </React.Fragment>
    );
};

export default CouponDiscount;
