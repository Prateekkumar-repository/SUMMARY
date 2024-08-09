'use strict';

import React from 'react';
import SessionStorage from '../commons/CUK/session-storage';
import FetchData from '../commons/CUK/fetch-data';
import PricingInfoMycruise from './pricingInfoMycruise';
import PaymentMycruise from './paymentMycruise';
import PaymentMycruisePXP from './paymentMycruisePXP';
import PaymentMycruiseZero from './paymentmycruisezero';
// import ShoppingCartItem from './shoppingcartItem';
import CartItemShorex from './cartItemShorex';
import CartItemGeneric from './cartItemGeneric';
import CartItemAllInclusive from './cartItemAllInclusive';
import CartItemDining from './cartItemDining';
import EmptyState from '../commons/CUK/emptyState';
import TitleH1Mycruise from '../titleH1Mycruise';
import extractChildComponent from '../commons/CUK/extractChildComponent';
import animatedScroll from '../commons/CUK/animatedScroll';
import CartItemSpa from './cartItemSpa';
import CartItemEntertainment from './cartitementertainment';
import {
    getConfig,
    convertValueToVaildDecimalPoint
} from '../commons/CUK/utilities';
import analytics from '../commons/CUK/analytics';
import Modal from '../commons/CUK/modal';
import CartItemInternet from './cartItemInternet';

class summaryDetailsModuleMycruise extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            shoppingCartItems: [],
            totalItemsNum: 0,
            orderCanProceed: false,
            isPSDEnabled: false,
            errorsInCart: false,
            totalPriceWithTax: {},
            totalLoyaltyDiscount: {},
            totalChildDiscount: {},
            removed: {},
            numbersOfItemMismatched: false,
            hasZeroValueItem: false,
            overridePsdPaymentFromCookie: false,
            expiredEvents: [],
            encryptedCartCode: '',
            appliedVouchers: [],
            couponDiscounts: {},
            couponList: [],
            maxCouponRedemption : 0
        };
    }

    componentDidMount() {
        const overridePsdPaymentFromCookie = getCookie('use_crn_psd_pmt');
        this.setState(
            {
                overridePsdPaymentFromCookie:
                    overridePsdPaymentFromCookie == 'true' ? true : false
            },
            () => {
                this.loadShoppingCart();
            }
        );
    }
    componentWillUnmount() {
        if (this.state.expiredEvents.length) {
        }
    }

    loadShoppingCart() {
        const { services } = this.props;
        const { locale } = services.headers;

        const { retrieveCustomerCartApi } = services.urls;
        const paymentMycruise = extractChildComponent(
            this.props.childComponents,
            'paymentMycruise'
        );

        let {
            psdenableCC,
            psdenableTA,
            isIframeEnableCC
        } = paymentMycruise.attributes;

        const header = SessionStorage.getItem('header');

        const { agent } = header;
        if (typeof agent !== 'undefined') {
            if (agent.agentType && agent.agentType === 'customerServiceAgent') {
                if (psdenableCC === 'true' || isIframeEnableCC == 'true') {
                    this.setState({
                        isPSDEnabled: true
                    });
                }

                if (
                    getCookie('isSyntecEnabledForCCA') &&
                    getCookie('isSyntecEnabledForCCA') == 'true'
                ) {
                    this.setState({
                        isPSDEnabled: true
                    });
                } else if (
                    getCookie('isSyntecEnabledForCCA') &&
                    getCookie('isSyntecEnabledForCCA') == 'false'
                ) {
                    this.setState({
                        isPSDEnabled: false
                    });
                }
            } else {
                this.setState({
                    isPSDEnabled: psdenableTA === 'true' ? true : false
                });
            }
        } else {
            this.setState({
                isPSDEnabled: psdenableTA === 'true' ? true : false
            });
        }

        const url = `${retrieveCustomerCartApi}?lang=${locale}&fields=FULL`;
        const apikey = getConfig('apikeyMycruise', '');
        FetchData(url, {
            method: 'GET',
            headers: {
                'X-CommonData': JSON.stringify(header),
                'X-Source-Identity-Token-0': apikey
            }
        }).then(this.arrangeData);
    }

    arrangeData = (data) => {
        let temp = data.entries;
        let appliedDiscount = [];

        // data.entries.[index].product.productType

        let result = temp.reduce(function(r, a) {
            r[a.groupID] = r[a.groupID] || [];
            r[a.groupID].push(a);

            return r;
        }, Object.create(null));

        let shoppingCartData = Object.values(result);
        this.findLimitedStock(shoppingCartData);
        this.findPassengersName(shoppingCartData);
        this.orderPassengers(shoppingCartData);
        this.calculatePricingPerProduct(shoppingCartData, data);
        let couponList = [];
        if(data.appliedProductPromotions && data.appliedProductPromotions.length) {
            data.appliedProductPromotions.forEach((cp) =>{
                if(cp.isCoupon) {
                    couponList.push(cp);
                }
            })
        }
        if(data.appliedCoupons && data.appliedCoupons.length) {
            let zeroPriceCoupon = [], priceCoupon = [];
            data.appliedCoupons.forEach((d) => {
                if(d.value) {
                    priceCoupon.push(d);
                } else {
                    zeroPriceCoupon.push(d);
                }
            })
            data.appliedCoupons = [...zeroPriceCoupon, ...priceCoupon];
        }
        this.setState({
            ...this.state,
            encryptedCartCode: data.encryptedCartCode,
            appliedVouchers: data.appliedCoupons ? data.appliedCoupons : [],
            couponDiscounts: data.couponDiscounts,
            maxCouponRedemption : data.maxCouponRedemption
        });
        let tempObj = {};
        let entertainmentExpEvents = [];
        
        shoppingCartData.map((item, index) => {
            let groupId = item[0].groupID;

            // if (
            //     (item[0].product.productType === 'ENTERTAINMENT' ||
            //         item[0].product.productType === 'XDINING') &&
            //     item[0].status != 'ACTIVE'
            // ) {
            //     entertainmentExpEvents = [
            //         ...entertainmentExpEvents,
            //         item[0].groupID
            //     ];
            // }
            tempObj[groupId] = false;
        });
        let promotionalDiscount = 0;
        if (data.productDiscounts && data.productDiscounts.value) {
            promotionalDiscount += data.productDiscounts.value;
            if (data.totalLoyaltyDiscount && data.totalLoyaltyDiscount.value) {
                promotionalDiscount -= data.totalLoyaltyDiscount.value;
            }
        }
        
        const paymentFailRedirect =
            SessionStorage.getItem('paymentFailRedirect') || false;
        if (paymentFailRedirect) {
            this.setState({
                orderCanProceed: true,
                numbersOfItemMismatched: false
            });
        }

        this.setState(() => ({
            ...this.state,
            removed: tempObj,
            shoppingCartItems: shoppingCartData,
            totalLoyaltyDiscount: data.totalLoyaltyDiscount,
            subTotal: data.totalPriceWithoutDiscount,
            totalChildDiscount: data.totalChildDiscount,
            totalPriceWithTax: data.totalPriceWithTax,
            totalItemsNum: shoppingCartData.length,
            expiredEvents: entertainmentExpEvents,
            promotionalDiscount: promotionalDiscount,
            couponList: couponList
        }));

        const header = SessionStorage.getItem('header');
        const cruiseData = SessionStorage.getItem('cruiseData');
        const config = typeof window !== 'undefined' ? window.configs : '';
        const customCurrencyCode =
            config.brand.toLowerCase() === 'po' ? 'gbp' : 'usd';
        const userData = SessionStorage.getItem('userData');
        const currencyLocale =
            typeof window !== 'undefined' ? window.configs.currencyLocale : '';
        let dobArray = [];
        header.passengers.forEach((passenger) => {
            dobArray.push(passenger.birthDate);
        });

        const lineItemsData = [];

        data.entries.forEach((resData) => {
            let diningCategory = '';
            if (resData.product.productType === 'XDINING') {
                if (
                    resData.attributes &&
                    resData.attributes.name &&
                    resData.attributes.name.toLowerCase().includes('cookery')
                ) {
                    diningCategory = 'CookeryClub';
                } else if (
                    resData.attributes &&
                    resData.attributes.name &&
                    resData.attributes.name.toLowerCase().includes('limelight')
                ) {
                    diningCategory = 'EventDining';
                } else if (resData.attributes && resData.attributes.name) {
                    diningCategory = 'SelectDining';
                }
            }
            let skuID = resData.product.baseProduct;
            let productID = '';
            if (resData.product.productType === 'XDINING') {
                let currentProductSkusID = resData.product.baseProduct;
                if (currentProductSkusID) {
                    currentProductSkusID = currentProductSkusID.split('_');
                    if (currentProductSkusID.length >= 4) {
                        skuID = currentProductSkusID[3];
                        productID = `${currentProductSkusID[1]}_${
                            currentProductSkusID[2]
                        }`;
                    }
                }
            }

            const product = {
                groupID: resData.groupID,
                status: resData.product.stock.stockLevelStatus,
                skuID:
                    resData.product.productType === 'SHOREX' ||
                    resData.product.productType === 'XDINING'
                        ? diningCategory !== 'SelectDining'
                            ? resData.product.productType === 'SHOREX'
                                ? skuID
                                : ''
                            : skuID
                        : resData.product.code,
                productID:
                    resData.product.productType === 'SHOREX' ||
                    resData.product.productType === 'SPA'
                        ? resData.product.baseProduct
                        : resData.product.productType === 'XDINING'
                            ? productID
                            : resData.product.code,
                productName:
                    resData.product.productType === 'SPA'
                        ? resData.product.attributes.name
                        : resData.product.productType === 'INTERNET'
                            ? resData.product.name
                            : resData.attributes.name,
                skuName:
                    diningCategory !== 'SelectDining'
                        ? resData.product.productType === 'SPA'
                            ? resData.product.name
                            : resData.product.productType === 'INTERNET'
                                ? resData.product.name
                                : resData.attributes.name
                        : '',
                productType: resData.product.productType,
                startDateTime: resData.attributes.startDateTime
                    ? resData.attributes.startDateTime
                    : resData.product.productType === 'SPA'
                        ? resData.attributes.startDateTime
                        : '',
                shorexAttributes: {
                    portName:
                        resData.product.productType === 'SHOREX'
                            ? resData.attributes.port.shortName
                            : '',
                    activityLevel: '',
                    language:
                        resData.product.productType === 'SHOREX'
                            ? resData.attributes.language
                            : '',
                    duration: '',
                    transport: '',
                    minAge: '',
                    maxAge: '',
                    tourType: '',
                    tourCategory: '',
                    tourFeatures: ''
                },
                diningMealPeriod:
                    resData.product.productType === 'XDINING'
                        ? resData.attributes.mealPeriod
                        : '',
                diningCategory:
                    resData.product.productType === 'XDINING'
                        ? diningCategory
                        : '',
                spaTreatmentType:
                    resData.product.productType === 'SPA'
                        ? resData.attributes.name
                        : '', /// yet to validated
                spaDuration:
                    resData.product.productType === 'SPA'
                        ? resData.attributes.treatmentDuration
                        : '',
                quantity:
                    resData.product.productType === 'XDINING'
                        ? resData.noOfGuests
                        : resData.quantity
                            ? parseInt(resData.quantity)
                            : '',
                unitPrice_GBP: convertValueToVaildDecimalPoint(
                    resData.basePrice.value
                ),
                unitSalePrice_GBP: convertValueToVaildDecimalPoint(
                    resData.totalPrice.value
                ),
                unitPrice_local: convertValueToVaildDecimalPoint(
                    resData.basePrice.value
                ),
                unitSalePrice_local: convertValueToVaildDecimalPoint(
                    resData.totalPrice.value
                )
            };

            lineItemsData.push(product);
        });

        const psd2 =
            (isCookieExists('use_crn_psd_pmt') &&
                this.state.overridePsdPaymentFromCookie) ||
            (!isCookieExists('use_crn_psd_pmt') && this.state.isPSDEnabled)
                ? true
                : false;

        analytics.setAdditionalPageTrackAttributes({
            myCruiseDetails: {
                bookingNumber: header.bookingRef,
                voyageID: header.cruiseCode,
                voyageName: cruiseData.cruiseName,
                shipName: cruiseData.shipName,
                depDate: header.embarkationDate,
                destName: '',
                durationDays: header.physicalCruiseDuration,
                depPortName: cruiseData.embarkPort,
                destPortName: cruiseData.disembarkPort,
                stateroomType: '',
                numGuests: header.passengers.length,
                dob: dobArray
            },
            event: 'event309',
            loginStatus: 'logged in',
            loginType: header.agent ? header.agent.agentType : 'customer',
            AgentID: header.agent ? header.agent.id : '',
            crmID: '',
            country: header.market,
            languageSelected: header.language.substring(0, 2),
            customCurrencyCode: customCurrencyCode,
            memberLoyaltyLevel: header.customer.loyaltyTier,
            server: '',
            localDayTime: new Date().toString(),
            timePartingCodes: '',
            pageType: 'checkout/basket',
            //Please refer Page and Content Hierarchy Tabs for below values
            sectionLevelOne: '',
            sectionLevelTwo: '',
            sectionLevelThree: '',
            sectionLevelFour: '',
            pageName: config.pageName,
            pageChannel: '',
            pageHier: '',
            // //Please refer Page and Content Hierarchy Tabs for above values
            ecomStep: '',

            psd2: psd2,
            paymentFailRedirect: paymentFailRedirect
                ? paymentFailRedirect
                : false,

            myCruiseBasket: {
                orderSubtotal_GBP: data.subTotal
                    ? convertValueToVaildDecimalPoint(data.subTotal.value)
                    : '',
                orderTotal_GBP: data.totalPrice
                    ? convertValueToVaildDecimalPoint(data.totalPrice.value)
                    : '',
                loyaltyDiscount_GBP: data.totalLoyaltyDiscount
                    ? convertValueToVaildDecimalPoint(
                          data.totalLoyaltyDiscount.value
                      )
                    : '',
                orderSubtotal_local: data.subTotal
                    ? convertValueToVaildDecimalPoint(data.subTotal.value)
                    : '',
                orderTotal_local: data.totalPrice
                    ? convertValueToVaildDecimalPoint(data.totalPrice.value)
                    : '',
                loyaltyDiscount_local: data.totalLoyaltyDiscount
                    ? convertValueToVaildDecimalPoint(
                          data.totalLoyaltyDiscount.value
                      )
                    : '',
                lineItems: lineItemsData
            },
            orderTotal_GBP: data.totalPriceWithTax
                ? convertValueToVaildDecimalPoint(data.totalPriceWithTax.value)
                : '',
            orderTotal_local: data.totalPriceWithTax
                ? convertValueToVaildDecimalPoint(data.totalPriceWithTax.value)
                : ''
        });
    };

    orderPassengers = (data) => {};

    findLimitedStock = (data) => {
        data.forEach((item) => {
            item.forEach((passenger, index, item) => {
                const stockAvailable = passenger.product.stock.stockLevel;
                item.limitedStock = item.length > stockAvailable;
                item.stockLevel = stockAvailable;
            });
        });
    };

    findPassengersName = (data) => {
        const { passengers } = SessionStorage.getItem('orderedList');
        data.forEach((item) => {
            item.map((p) => {
                const pn = p.passenger.paxNo;
                passengers.forEach((passenger) => {
                    if (+passenger.paxNumber === +pn) {
                        p.passenger.title = passenger.title;
                        p.passenger.firstName = passenger.firstName;
                        p.passenger.lastName = passenger.lastName;
                    }
                });
            });
        });

        data.map((entry, index) => {
            let helpers = [];
            let counter = 0;

            passengers.map((singlePax) => {
                entry.map((p, i) => {
                    if (+p.passenger.paxNo === +singlePax.paxNumber) {
                        helpers[counter] = entry[i];
                        counter++;
                    }
                });
            });
            const { limitedStock, stockLevel } = entry;
            entry = { ...helpers, limitedStock, stockLevel };
            return entry;
        });
    };

    calculatePricingPerProduct = (data, allData) => {
        data.forEach((item, index) => {
            let productSubtotalPrice = 0;
            let productTotalPrice = 0;
            let productPromotionalDiscount = 0;
            let productLoyaltyDiscount = 0;
            let productCouponDiscount = 0;
            // let baseTotalPrice = 0;
            //VIP added baseTotalPrice for drinks product
            
            item.forEach((passenger) => {
                const {
                    basePrice,
                    quantity,
                    totalPrice,
                    noOfGuests,
                    product,
                    entryNumber
                } = passenger;
                let subtotalmultiply = noOfGuests ? noOfGuests : quantity;
                productSubtotalPrice += basePrice.value * subtotalmultiply;

                productTotalPrice += totalPrice.value;

                // if (product.productType === 'AIBEVERAGE') {
                //     baseTotalPrice += basePrice.value;
                // }

                if (allData.appliedProductPromotions) {
                    allData.appliedProductPromotions.forEach((ce) => {
                        let consumedEntries =
                            ce.consumedEntries && ce.consumedEntries.length
                                ? ce.consumedEntries
                                : [];

                        let couponCode =
                            ce.isCoupon && ce.isCoupon == true ? false : true;
                        
                        let promotionCode =
                            ce.promotion && ce.promotion.isLoyaltyType
                                ? true
                                : false;
                        consumedEntries.forEach((c) => {
                            if (
                                c.appliedTotalDiscount &&
                                c.orderEntryNumber == entryNumber
                            ) {
                                if (!couponCode) {
                                    productCouponDiscount += c.appliedTotalDiscount
                                    productTotalPrice =
                                        productTotalPrice +
                                        c.appliedTotalDiscount;
                                } else if (promotionCode) {
                                    productLoyaltyDiscount +=
                                        c.appliedTotalDiscount;
                                } else if (!promotionCode) {
                                    productPromotionalDiscount +=
                                        c.appliedTotalDiscount;
                                }
                            }
                        });
                    });
                }
            });

            let productLoyalityDiscountAmount =
                parseFloat(productSubtotalPrice.toFixed(2)) - productTotalPrice;

            item.pricing = {
                couponDiscount : productCouponDiscount,
                subtotalPrice: productSubtotalPrice,
                totalPrice: productTotalPrice,
                loyalityDiscount: productLoyaltyDiscount,
                promotionDiscount: productPromotionalDiscount
            };
        });
    };

    removeItemFromShoppingCart = (e, groupID) => {
        e && e.preventDefault();
        const { removed } = this.state;
        removed[groupID] = true;

        // this.setState({
        //     hasZeroValueItem : false
        // });

        this.requestCancellation(removed, groupID);
    };

    onZeroValProductFound = () => {
        this.setState({
            hasZeroValueItem: true
        });
    };

    requestCancellation(removed, groupID) {
        const { services } = this.props;
        const { removeProductformCart } = services.urls;

        const header = SessionStorage.getItem('header');
        const apiKey = getConfig('apikeyMycruise', '');
        FetchData(removeProductformCart, {
            method: 'PUT', //YD DELETE
            body: JSON.stringify({
                groupID: groupID
            }),
            headers: {
                'Content-Type': 'application/json',
                'X-CommonData': JSON.stringify(header),
                'X-Source-Identity-Token-0': apiKey
            }
        }).then((res) => {
            if (res.errors && res.errors.length > 0) {
                this.showError(res);
                // {
                //     "errors": [{
                //         "message": "Either Field groupID or orderEntryNumber cannot both be empty or blank",
                //         "reason": "invalid",
                //         "subject": "body",
                //         "subjectType": "parameter",
                //         "type": "ValidationError"
                //     }]
                // }
            } else {
                this.updateState(res, removed);
            }

            const cruiseData = SessionStorage.getItem('cruiseData');
            const userData = SessionStorage.getItem('userData');

            let dobArray = [];
            header.passengers.forEach((passenger) => {
                dobArray.push(passenger.birthDate);
            });

            analytics.setAdditionalPageTrackAttributes({
                myCruiseDetails: {
                    bookingNumber: header.bookingRef,
                    voyageID: header.cruiseCode,
                    voyageName: cruiseData.cruiseName,
                    shipName: cruiseData.shipName,
                    depDate: header.embarkationDate,
                    destName: '',
                    durationDays: header.physicalCruiseDuration,
                    depPortName: cruiseData.embarkPort,
                    destPortName: cruiseData.disembarkPort,
                    stateroomType: '',
                    numGuests: header.passengers.length,
                    dob: dobArray
                },
                loginStatus: 'Logged In',
                loginType: header.agent ? header.agent.agentType : 'Customer',
                AgentID: header.agent ? header.agent.id : '',
                crmID: '',
                country: header.market,
                languageSelected: header.language.substring(0, 2),
                customCurrencyCode: '',
                memberLoyaltyLevel: userData.customer.loyaltyTier,
                server: '',
                localDayTime: new Date().toString(),
                timePartingCodes: '',
                pageType: 'Checkout/Basket',
                //Please refer Page and Content Hierarchy Tabs for below values
                sectionLevelOne: '',
                sectionLevelTwo: '',
                sectionLevelThree: '',
                sectionLevelFour: '',
                pageName: '',
                pageChannel: '',
                pageHier: '',
                //Please refer Page and Content Hierarchy Tabs for above values
                ecomStep: '',
                event: 'scRemove',
                status: '',
                groupID: groupID,
                remove_aib: [
                    {
                        productName: '',
                        productType: '',
                        skuID: '',
                        skuName: '',
                        unitPrice_GBP: '',
                        unitPrice_local: '',
                        Quantity: ''
                    }
                ],
                remove_other: {
                    productID: '',
                    productName: '',
                    skuID: '',
                    skuName: '',
                    productType: '',
                    startDateTime: '',
                    shorexAttributes: {
                        portName: '',
                        activityLevel: '',
                        language: '',
                        duration: '',
                        transport: '',
                        minAge: '',
                        maxAge: '',
                        tourType: [''],
                        tourCategory: '',
                        tourFeatures: ''
                    },
                    diningMealPeriod: '',
                    diningCategory: '',
                    spaTreatmentType: '',
                    spaDuration: '',
                    unitPrice_GBP: '',
                    unitPrice_local: '',
                    quantity: ''
                },
                subtotal_GBP: '',
                subtotal_Local: ''
            });
        });
    }
    updateState(res, removed) {
        let couponList = [];
        res.appliedProductPromotions.map((item) => {
            if (item.isCoupon == true) {
                couponList.push(item);
            }
        });

        let promotionalDiscount = 0;
        if (res.productDiscounts && res.productDiscounts.value) {
            promotionalDiscount += res.productDiscounts.value;
            if (res.totalLoyaltyDiscount && res.totalLoyaltyDiscount.value) {
                promotionalDiscount -= res.totalLoyaltyDiscount.value;
            }
        }
        if(res.appliedCoupons && res.appliedCoupons.length) {
            let zeroPriceCoupon = [], priceCoupon = [];
            res.appliedCoupons.forEach((d) => {
                if(d.value) {
                    priceCoupon.push(d);
                } else {
                    zeroPriceCoupon.push(d);
                }
            })
            res.appliedCoupons = [...zeroPriceCoupon, ...priceCoupon];
        }
        this.setState((prevState) => ({
            totalItemsNum: prevState.totalItemsNum - 1,
            removed: removed,
            subTotal: res.totalPriceWithoutDiscount,
            promotionalDiscount: promotionalDiscount,
            totalLoyaltyDiscount: res.totalLoyaltyDiscount,
            totalChildDiscount: res.totalChildDiscount,
            totalPriceWithTax: res.totalPriceWithTax,
            hasZeroValueItem: false,
            appliedVouchers: res.appliedCoupons ? res.appliedCoupons : [],
            couponDiscounts: res.couponDiscounts
        }));
    }

    shoppingList() {
        const { shoppingCartItems } = this.state;

        return <ul>{shoppingCartItems.map(this.renderShoppingCartItem)}</ul>;
    }

    renderShoppingCartItem = (item, index) => {
        const { labels, hairLengthLabels, childComponents } = this.props;
        const accesibilityLabels = this.props.accesibilityLabels
            ? this.props.accesibilityLabels
            : {};

        const { removed } = this.state;
        const {
            0: {
                groupID,
                product: { productType }
            },
            limitedStock
        } = item;

        const propsCartItem = {
            limitedStock,
            removed: removed[groupID],
            key: index,
            labels: labels,
            accesibilityLabels: accesibilityLabels,
            data: item,
            index: index
        };

        // get type of item and switch child component based on it
        if (productType === 'ENTERTAINMENT') {
            const paymentProps = extractChildComponent(
                childComponents,
                'paymentMycruise'
            );

            // propsCartItem.labels = {
            //     ...paymentProps.attributes.labels,
            //     ...propsCartItem.labels
            // };

            propsCartItem.labels['entertainmentLabel'] =
                paymentProps.attributes.labels &&
                paymentProps.attributes.labels.entertainmentLabel
                    ? paymentProps.attributes.labels.entertainmentLabel
                    : '';
            propsCartItem.labels['seatLabel'] =
                paymentProps.attributes.labels &&
                paymentProps.attributes.labels.seatLabel
                    ? paymentProps.attributes.labels.seatLabel
                    : '';
            propsCartItem.labels['includedholidayLabel'] =
                paymentProps.attributes.labels &&
                paymentProps.attributes.labels.includedholidayLabel
                    ? paymentProps.attributes.labels.includedholidayLabel
                    : '';
            propsCartItem.labels['cruisedurationLabel'] =
                paymentProps.attributes.labels &&
                paymentProps.attributes.labels.cruisedurationLabel
                    ? paymentProps.attributes.labels.cruisedurationLabel
                    : '';
            propsCartItem.labels['daysLabel'] =
                paymentProps.attributes.labels &&
                paymentProps.attributes.labels.daysLabel
                    ? paymentProps.attributes.labels.daysLabel
                    : '';
            propsCartItem.labels['expiredLabel'] =
                paymentProps.attributes.labels &&
                paymentProps.attributes.labels.expiredLabel
                    ? paymentProps.attributes.labels.expiredLabel
                    : '';
            propsCartItem.labels['rebookLabel'] =
                paymentProps.attributes.labels &&
                paymentProps.attributes.labels.rebookLabel
                    ? paymentProps.attributes.labels.rebookLabel
                    : '';
            propsCartItem.labels['termsAndConditionsMessageLabel'] =
                paymentProps.attributes.labels &&
                paymentProps.attributes.labels.termsAndConditionsMessageLabel
                    ? paymentProps.attributes.labels
                          .termsAndConditionsMessageLabel
                    : '';
            propsCartItem.labels['termsAndConditionsErrorLabel'] =
                paymentProps.attributes.labels &&
                paymentProps.attributes.labels.termsAndConditionsErrorLabel
                    ? paymentProps.attributes.labels
                          .termsAndConditionsErrorLabel
                    : '';
            propsCartItem.labels['termsAndConditionsLinkLabel'] =
                paymentProps.attributes.labels &&
                paymentProps.attributes.labels.termsAndConditionsLinkLabel
                    ? paymentProps.attributes.labels.termsAndConditionsLinkLabel
                    : '';
            propsCartItem.labels['continueLabel'] =
                paymentProps.attributes.labels &&
                paymentProps.attributes.labels.continueLabel
                    ? paymentProps.attributes.labels.continueLabel
                    : '';
        }
        if (productType === 'XDINING') {
            const paymentProps = extractChildComponent(
                childComponents,
                'paymentMycruise'
            );
            propsCartItem.labels['expiredLabel'] =
                paymentProps.attributes.labels &&
                paymentProps.attributes.labels.expiredLabel
                    ? paymentProps.attributes.labels.expiredLabel
                    : '';
        }
        //  debugger;
        switch (productType) {
            case 'SHOREX': {
                return (
                    <CartItemShorex
                        {...propsCartItem}
                        // onHasError={(e) => this.errorsInItems()}
                        onRemove={this.removeItemFromShoppingCart}
                    />
                );
            }
            case 'AIBEVERAGE': {
                return (
                    <CartItemAllInclusive
                        {...propsCartItem}
                        onRemove={this.removeItemFromShoppingCart}
                    />
                );
            }
            case 'XDINING': {
                return (
                    <CartItemDining
                        {...propsCartItem}
                        onRemove={this.removeItemFromShoppingCart}
                        hasZeroValueItem={this.state.hasZeroValueItem}
                        onZeroValFound={this.onZeroValProductFound}
                    />
                );
            }
            case 'SPA': {
                return (
                    <CartItemSpa
                        {...propsCartItem}
                        hairLengthLabels={hairLengthLabels}
                        onRemove={this.removeItemFromShoppingCart}
                    />
                );
            }
            case 'ENTERTAINMENT': {
                return (
                    <CartItemEntertainment
                        {...propsCartItem}
                        hairLengthLabels={hairLengthLabels}
                        onRemove={this.removeItemFromShoppingCart}
                    />
                );
            }
            case 'INTERNET': {
                return (
                    <CartItemInternet
                        {...propsCartItem}
                        onRemove={this.removeItemFromShoppingCart}
                    />
                );
            }
            default:
                return (
                    <CartItemGeneric
                        {...propsCartItem}
                        onRemove={this.removeItemFromShoppingCart}
                        genericLabels={this.props.genericLabelsMap}
                    />
                );
        }
    };

    handleSubmit = () => {};
    // errorsInItems = () => {
    //     this.setState({
    //         errorsInItems: true
    //     });
    // };

    checkCartItemMismatch = (res) => {
        if (res.totalUnitCount !== this.state.totalItemsNum) {
            return true;
        } else {
            return false;
        }
    };

    checkForExpire = () => {
        if (this.state.expiredEvents.length) {
            this.removeWithIteration();
        } else {
            this.updateDetails();
        }
    };

    removeWithIteration = (e) => {
        for (let i = 0; i < this.state.expiredEvents.length; i++) {
            this.removeItemFromShoppingCart(e, this.state.expiredEvents[i]);
            if (i == this.state.expiredEvents.length - 1) {
                this.setState(
                    () => ({
                        expiredEvents: []
                    }),
                    () => {
                        this.updateDetails();
                    }
                );
            }
        }
    };

    updateDetails = () => {
        const { services, childComponents } = this.props;
        const { minicartApi } = services.urls;
        const configs = typeof window !== 'undefined' ? window.configs : {};
        const { locale } = configs;
        const url = `${minicartApi}?lang=${locale}&fields=BASIC`;
        const header = SessionStorage.getItem('header');
        const apikey = getConfig('apikeyMycruise', '');
        const payment = extractChildComponent(
            childComponents,
            'paymentMycruise'
        );
        const { labels, accesibilityLabels } = payment.attributes;
        FetchData(minicartApi, {
            method: 'GET',
            headers: {
                'X-CommonData': JSON.stringify(header),
                'X-Source-Identity-Token-0': apikey
            }
        }).then((res) => {
            if (this.checkCartItemMismatch(res)) {
                this.setState(
                    () => ({
                        orderCanProceed: true,
                        numbersOfItemMismatched: false
                    }),
                    () => {
                        //Added for shifting focus to checkout title after clicking checkout
                        let checkout_title = document.querySelectorAll(
                            '.title-component .title'
                        );
                        checkout_title &&
                            Array.from(checkout_title).map((item) => {
                                if (
                                    item &&
                                    item.innerHTML &&
                                    item.innerHTML ==
                                        labels.checkoutFormTitleLabel
                                        ? labels.checkoutFormTitleLabel
                                        : ''
                                ) {
                                    item.setAttribute(
                                        'aria-label',
                                        accesibilityLabels.checkoutTitleArialabel
                                    );
                                    item.focus();
                                }
                            });
                    }
                );
            } else {
                this.setState(
                    () => ({
                        orderCanProceed: true,
                        numbersOfItemMismatched: false
                    }),
                    () => {
                        typeof document !== 'undefined' &&
                            document
                                .getElementsByClassName('continueShopping')[0]
                                .classList.add('hide');
                    }
                );
                // hide continue shopping
                let titleElement = document.getElementsByClassName(
                    'checkoutForm'
                );
                let netOffset = titleElement[0].offsetTop - 100;
                window.scrollTo(0, netOffset);
                //Added for shifting focus to checkout title after clicking checkout
                let checkout_title = document.querySelectorAll(
                    '.title-component .title'
                );
                checkout_title &&
                    Array.from(checkout_title).map((item) => {
                        if (
                            item &&
                            item.innerHTML &&
                            item.innerHTML == labels.checkoutFormTitleLabel
                                ? labels.checkoutFormTitleLabel
                                : ''
                        ) {
                            item.setAttribute(
                                'aria-label',
                                accesibilityLabels.checkoutTitleArialabel
                            );
                            item.focus();
                        }
                    });

                const customClick = {
                    event: 'scCheckout,event104,event107'
                };
                analytics.customClicks(customClick);
            }
        });
    };

    handleReserveStockError = (value) => {
        typeof document !== 'undefined' &&
            document
                .getElementsByClassName('continueShopping')[0]
                .classList.remove('hide');
        // update cart with errors
        if (value === 'close') {
            let pageUrl = window.location.href.split('/shoppingcart');
            window.location.href = pageUrl[0] + '/homepage';
        }
        this.loadShoppingCart();
        // scroll top to show error
        this.setState(
            () => ({
                errorsInCart: true,
                orderCanProceed: false
            }),
            () => {
                animatedScroll(0, 300);
            }
        );
    };

    cancelPayment = () => {
        this.setState({
            orderCanProceed: false
        });
        let continueShopping =
            typeof document !== 'undefined' &&
            document.getElementsByClassName('continueShopping');

        continueShopping[0].classList.remove('hide');
    };
    hideError = (e) => {
        analytics.clickTracking(this);
        e.preventDefault();
        this.setState({
            errorsInCart: false
        });
    };

    render() {
        const {
            title,
            childComponents,
            errorLabels,
            labels,
            acceptedCreditCards
        } = this.props;
        const {
            totalItemsNum,
            errorsInCart,
            totalLoyaltyDiscount,
            subTotal,
            promotionalDiscount,
            totalChildDiscount,
            totalPriceWithTax,
            errorsInItems,
            orderCanProceed,
            shoppingCartItems,
            numbersOfItemMismatched,
            hasZeroValueItem
        } = this.state;
        const titleH1Props = {
            title: title,
            description: '',
            type: 'h1'
        };

        const emptyState = extractChildComponent(childComponents, 'emptyState');
        const pricingInfo = extractChildComponent(
            childComponents,
            'pricingInfoMycruise'
        );
        const payment = extractChildComponent(
            childComponents,
            'paymentMycruise'
        );

        return (
            <div>
                {totalItemsNum > 0 && (
                    <div>
                        {errorsInCart && (
                            <div className="shoppingCart__error">
                                {labels.summaryDetailsGenericErrorLabel}
                                <a
                                    href="#"
                                    className="close"
                                    onClick={this.hideError}
                                    data-linktext="link:close"
                                    data-componentname={this.props.type}
                                />
                            </div>
                        )}

                        {numbersOfItemMismatched && (
                            <Modal
                                mounted={true}
                                contentLabel="Cart Items Mismatched"
                                ctaType=""
                                underlayClass="termsAndCondition-modal"
                            >
                                <div className="modal-alert">
                                    {labels.summaryDetailsGenericErrorLabel}
                                </div>
                                <div className="modal-btns">
                                    <button
                                        className="cta-primary"
                                        onClick={() => window.location.reload()}
                                    >
                                        OK
                                    </button>
                                </div>
                            </Modal>
                        )}

                        <TitleH1Mycruise {...titleH1Props} />
                        {shoppingCartItems.length > 0 && (
                            <div className="summary-details">
                                <ul>
                                    {shoppingCartItems.map(
                                        this.renderShoppingCartItem
                                    )}
                                </ul>
                            </div>
                        )}
                        {totalLoyaltyDiscount &&
                            totalPriceWithTax && (
                                <PricingInfoMycruise
                                    {...pricingInfo.attributes}
                                    total={totalPriceWithTax}
                                    subTotal={subTotal}
                                    promotionalDiscount={promotionalDiscount}
                                    totalLoyaltyDiscount={totalLoyaltyDiscount}
                                    totalChildDiscount={totalChildDiscount}
                                    noError={errorsInItems}
                                    update={this.checkForExpire}
                                    updateCart={this.loadShoppingCart.bind(
                                        this
                                    )}
                                    encryptedCartCode={
                                        this.state.encryptedCartCode
                                    }
                                    appliedVouchers={
                                        this.state.appliedVouchers.length > 0
                                            ? this.state.appliedVouchers
                                            : []
                                    }
                                    couponDiscounts={this.state.couponDiscounts}
                                    servicesUrl={this.props.applyDiscount}
                                    removeCouponApi={this.props.removeCouponApi}
                                    lacale={this.props.services.headers}
                                    couponList={this.state.couponList}
                                    maxCoupon={this.state.maxCouponRedemption}
                                />
                            )}

                        {orderCanProceed &&
                            totalPriceWithTax.hasOwnProperty('value') &&
                            totalPriceWithTax.value > 0 &&
                            ((isCookieExists('use_crn_psd_pmt') &&
                                this.state.overridePsdPaymentFromCookie) ||
                                (!isCookieExists('use_crn_psd_pmt') &&
                                    this.state.isPSDEnabled)) && (
                                <PaymentMycruise
                                    {...payment}
                                    {...this.props}
                                    errorLabels={errorLabels}
                                    acceptedCards={acceptedCreditCards}
                                    total={totalPriceWithTax}
                                    zeroValueLabel={
                                        labels.zeroValueProductInCartLabel
                                    }
                                    showZeroValueLabel={hasZeroValueItem}
                                    totalLoyaltyDiscount={totalLoyaltyDiscount}
                                    childDiscount={totalChildDiscount}
                                    cancel={this.cancelPayment}
                                    handleReserveStockError={
                                        this.handleReserveStockError
                                    }
                                    labels={labels}
                                />
                            )}
                        {orderCanProceed &&
                            totalPriceWithTax.hasOwnProperty('value') &&
                            totalPriceWithTax.value > 0 &&
                            ((isCookieExists('use_crn_psd_pmt') &&
                                !this.state.overridePsdPaymentFromCookie) ||
                                (!isCookieExists('use_crn_psd_pmt') &&
                                    !this.state.isPSDEnabled)) && (
                                <PaymentMycruisePXP
                                    {...payment}
                                    {...this.props}
                                    errorLabels={errorLabels}
                                    acceptedCards={acceptedCreditCards}
                                    total={totalPriceWithTax}
                                    zeroValueLabel={
                                        labels.zeroValueProductInCartLabel
                                    }
                                    showZeroValueLabel={hasZeroValueItem}
                                    totalLoyaltyDiscount={totalLoyaltyDiscount}
                                    childDiscount={totalChildDiscount}
                                    cancel={this.cancelPayment}
                                    handleReserveStockError={
                                        this.handleReserveStockError
                                    }
                                    labels={labels}
                                />
                            )}
                        {orderCanProceed &&
                            (!totalPriceWithTax.hasOwnProperty('value') ||
                                totalPriceWithTax.value <= 0) && (
                                <PaymentMycruiseZero
                                    {...payment}
                                    {...this.props}
                                    errorLabels={errorLabels}
                                    acceptedCards={acceptedCreditCards}
                                    total={totalPriceWithTax}
                                    zeroValueLabel={
                                        labels.zeroValueProductInCartLabel
                                    }
                                    showZeroValueLabel={hasZeroValueItem}
                                    totalLoyaltyDiscount={totalLoyaltyDiscount}
                                    childDiscount={totalChildDiscount}
                                    cancel={this.cancelPayment}
                                    handleReserveStockError={
                                        this.handleReserveStockError
                                    }
                                    labels={labels}
                                />
                            )}
                    </div>
                )}
                {totalItemsNum === 0 && (
                    <EmptyState {...emptyState.attributes} />
                )}
            </div>
        );
    }
}

function getCookie(name) {
    var value = '; ' + (typeof document !== 'undefined' && document.cookie);
    var parts = value.split('; ' + name + '=');
    if (parts.length == 2) {
        return parts
            .pop()
            .split(';')
            .shift();
    } else {
        return null;
    }
}

function isCookieExists(name) {
    var value = '; ' + (typeof document !== 'undefined' && document.cookie);
    var parts = value.split('; ' + name + '=');
    return parts.length == 2;
}

export default summaryDetailsModuleMycruise;
