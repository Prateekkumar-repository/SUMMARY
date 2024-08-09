'use strict';

import React from 'react';
// import jsencrypt from 'jsencrypt';
import InputField from '../commons/CUK/inputField';
import TitleH1Mycruise from '../titleH1Mycruise';
import { regex } from '../../library/js/config/regex';
import SelectField from '../commons/CUK/selectField';
import CurrencyFormat from '../commons/CUK/currencyFormat';
import fetchData from '../commons/CUK/fetch-data';
import { plainDateFormat } from '../commons/CUK/dateFormat';
import Modal from '../commons/CUK/modal';
import Loader from '../commons/CUK/loader';
import SessionStorage from '../commons/CUK/session-storage';
import analytics from '../commons/CUK/analytics';
import { convertValueToVaildDecimalPoint, getConfig, callForPaymentMonitoring, capitalizeString } from '../commons/CUK/utilities';
import { checkCookie, getCookie } from '../commons/CUK/cookies';
import moment from 'moment';
import DuplicateEventModal from './duplicateEventModal';

class paymentMycruise extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showLoader: false,
            totalPriceWithTax: this.props.total,
            totalLoyaltyDiscount: this.props.totalLoyaltyDiscount,
            firstNameError: '',
            lastNameError: '',
            cityError: '',
            countyError: '',
            numberError: '',
            billingAddressError: '',
            billingAddressError2: '',
            countryError: '',
            titleError: '',
            zipCodeError: '',
            emailAddressError: {},
            errorCount: 0,
            handleErrorModal: '',
            errors: {},
            errorText: '',
            isFormSubmitted: false,
            monthsRef: {},
            yearsRef: {},
            titleRef: {},
            pubKey: '',
            newCart: {},
            newCartEnteries: [],
            encryptId: '',
            checkNoMoreCart: false,
            formCompleted: false,
            disabled: false,
            showModalExpired: false,
            showModalError: false,
            genericErrorLabel: '',
            showModalTerms: false,
            showThrobber: false,
            monthIsNotValid: false,
            hasReadMore: true,
            active: false,
            showContentForTerm: '',
            capturedAmountLabel: false,
            termsAndConditionCheckBoxChecked: false,
            termsAndConditionCheckBoxError: false,
            tooltipHover: {},
            selectBox: {
                titleError: false,
                countryError: false
            },
            billingInfo: {
                title: {
                    value: '',
                    title: ''
                },
                firstName: '',
                lastName: '',
                city: '',
                country: {
                    value: '',
                    title: ''
                },
                billingAddress: '',
                billingAddress2: '',
                zipCode: '',
                email: '',
                county: ''
            },
            selectedAddress: {
                value: '',
                title: ''
            },
            selectAddressOption: [],
            showDuplicateEvent: false,
            newProductBooking: [],
            existingProduct: [],
            selectedCountry: '',
            isONHOLD: false
        };

    }

    componentWillMount() {
        //before render
        this.initLocalData();
    }

    // componentWillUpdate(){

    //     this.setState({
    //         totalPriceWithTax: this.props.total
    //     });
    // }

    componentWillReceiveProps(nextProps) {
        // //console.log('modified outside will receive props',nextProps);
        if (this.state.totalPriceWithTax.value !== nextProps.total.value) {
            // //console.log('modified inside will receive props',this.state.modified);
            this.setState({
                totalPriceWithTax: nextProps.total
            });
        }
    }

    componentDidMount() {
        //after render
        require('../../library/js/vendor/jsencrypt-master/jsencrypt');
        // this.node.scrollIntoView({ block: 'start', behavior: 'smooth' });
        // window.scrollTo(0, 0);
        // pre populate the field if possible

        const element = document.getElementsByClassName('checkout-button');
        element.length > 0 && element[0].scrollIntoView();

        const { formFields: { country } } = this.props.attributes
        
        const cruiseSummary = SessionStorage.getItem('cruiseSummaryData');
        const userData = SessionStorage.getItem('userData');
        const customer = userData.customer;
        let helpers = this.state.billingInfo;
        let salutation = '';
        let countyVisible = false;
        if (customer.title && customer.title.toLowerCase() === 'mr') {
            salutation = 'Mr.'
        } else if (customer.title && customer.title.toLowerCase() === 'mrs') {
            salutation = 'Mrs.'
        } else if (customer.title && customer.title.toLowerCase() === 'ms') {
            salutation = 'Ms.'
        }
        helpers.firstName = customer.firstName ? customer.firstName : '';
        helpers.lastName = customer.lastName ? customer.lastName : '';
        helpers.title.value = customer.title ? customer.title.toLowerCase() : '';
        helpers.title.title = customer.title ? salutation : '';
        if (cruiseSummary && cruiseSummary.passengers && cruiseSummary.passengers.length) {
            cruiseSummary.passengers.forEach((passenger) => {
                if (
                    passenger.individual &&
                    passenger.individual &&
                    passenger.individual.individualName &&
                    passenger.individual.individualName.firstNameText &&
                    passenger.individual.individualName.firstNameText !== '' &&
                    passenger.individual.individualName.familyNameText &&
                    passenger.individual.individualName.familyNameText !== '' &&
                    passenger.individual.contactPoints &&
                    passenger.individual.contactPoints.length &&
                    passenger.individual.contactPoints[0].emailAddress &&
                    passenger.individual.contactPoints[0].emailAddress.fullAddressText &&
                    passenger.individual.individualName.firstNameText.toLowerCase() === customer.firstName.toLowerCase() &&
                    passenger.individual.individualName.familyNameText.toLowerCase() === customer.lastName.toLowerCase()
                ) {
                    const {
                        addressLine1 = '',
                        addressLine2 = '',
                        buildingNameText = '',
                        cityNameText = '',
                        countyNameText = '',
                        countryCode,
                        postCode
                    } = passenger.individual.contactPoints[0].postalAddress[0];
                    helpers.billingAddress = addressLine1 ? addressLine1 : '';
                    helpers.billingAddress2 = addressLine2 ? addressLine2 : '';
                    helpers.county = countyNameText ? countyNameText : '';
                    helpers.zipCode = postCode && postCode.$ ? postCode.$ : '';
                    helpers.city = cityNameText ? cityNameText : '';
                    helpers.email = passenger.individual.contactPoints[0].emailAddress.fullAddressText;
                    // helpers.number = buildingNameText ? buildingNameText : '';
                    countryCode && countryCode.$ && country && country.options && country.options.forEach((singleCountry) => {
                        if (singleCountry.hasOwnProperty(countryCode.$)) {
                            helpers.country.value = countryCode.$;
                            helpers.country.title = singleCountry[countryCode.$].label;
                        }
                    })
                    if (countyNameText && countyNameText.trim() !== '') {
                        countyVisible = true;
                    }
                    // const locale = getConfig('locale') || 'en_GB';
                    // const countryCode = locale.split('_')[1];
                    const locale = getConfig('locale') || 'en_GB';
                    if (locale.toLowerCase() !== 'de_de') {
                        countyVisible && helpers.country && helpers.country.value && this.changeCountyLabel(helpers.country.value);
                    } else {
                        countyVisible = false;
                    }

                } else {
                    const {
                        billingInfoDetails,
                        isCountyVisible
                    } = this.updateCountryAccToLocale(helpers, countyVisible);
                    helpers = billingInfoDetails;
                    countyVisible = isCountyVisible;
                }
            })
        } else {
            const {
                billingInfoDetails,
                isCountyVisible
            } = this.updateCountryAccToLocale(helpers, countyVisible);
            helpers = billingInfoDetails;
            countyVisible = isCountyVisible;
        }
        const billingIfoFromSession = SessionStorage.getItem('billingInfo') || {};
        const paymentFailRedirect = SessionStorage.getItem('paymentFailRedirect') || false;
        let formCompleted = false;
        if (paymentFailRedirect && Object.keys(billingIfoFromSession).length) {
            SessionStorage.setItem('paymentFailRedirect', false);
            const ele = (typeof document !== 'undefined' && document.getElementsByClassName('checkoutForm')) || [];
            if (ele.length) {
                ele[0].scrollIntoView();
            }
            helpers = billingIfoFromSession;
            formCompleted = true;
        }
        this.setState({
            billingInfo: helpers,
            formCompleted: formCompleted,
            countyVisible
        });
            // })
            // .catch((err) => {
            //     const userData = SessionStorage.getItem('userData');
            //     const customer = userData.customer;
            //     let helpers = this.state.billingInfo;
            //     let salutation = '';
            //     let countyVisible = false;
            //     if (customer.title && customer.title.toLowerCase() === 'mr') {
            //         salutation = 'Mr.'
            //     } else if (customer.title && customer.title.toLowerCase() === 'mrs') {
            //         salutation = 'Mrs.'
            //     } else if (customer.title && customer.title.toLowerCase() === 'ms') {
            //         salutation = 'Ms.'
            //     }
            //     helpers.firstName = customer.firstName ? customer.firstName : '';
            //     helpers.lastName = customer.lastName ? customer.lastName : '';
            //     helpers.title.value = customer.title ? customer.title.toLowerCase() : '';
            //     helpers.title.title = customer.title ? salutation : '';
            //     const {
            //         billingInfoDetails,
            //         isCountyVisible
            //     } = this.updateCountryAccToLocale(
            //         helpers,
            //         countyVisible
            //     );
            //     helpers = billingInfoDetails;
            //     countyVisible = isCountyVisible;
            //     this.setState({
            //         billingInfo: helpers,
            //         formCompleted: false,
            //         countyVisible
            //     });
            // });

    }

    updateCountryAccToLocale = (helpers, countyVisible) => {
        const { formFields } = this.props.attributes;
        const locale = getConfig('locale') || 'en_GB';
        const countryCode = locale.split('_')[1];
        if (locale.toLowerCase() !== 'de_de') {
            countyVisible = true;
        } else {
            countyVisible = false;
        }
        formFields.country.options.forEach((singleCountry) => {
            if (singleCountry.hasOwnProperty(countryCode)) {
                helpers.country.value = countryCode;
                helpers.country.title = singleCountry[countryCode].value;
                countyVisible && this.changeCountyLabel(countryCode);
            }
        });

        return { billingInfoDetails: helpers, isCountyVisible: countyVisible };
    };

    // fetchCruiseSummary = () => {
    //     let { mycruiseSummaryApiV1 = `${window.location.origin}/api-mc/mc-getCruiseSummary/v1` } = this.props;
    //     const apikeyMycruise = getConfig('apikeyMycruise', '');
    //     const userData = SessionStorage.getItem('userData');
    //     const {
    //         bookingRef,
    //         companyCode,
    //         customer: { firstName, lastName },
    //         countryCode
    //     } = userData;
    //     const url = `${mycruiseSummaryApiV1}?bookingRef=${bookingRef}&firstName=${firstName}&lastName=${lastName}&shipCode=${companyCode}&countryCode=${countryCode}`;
    //     return fetchData(url, {
    //         headers: {
    //             'X-Source-Identity-Token-0': apikeyMycruise
    //         }
    //     });
    // };

    componentWillUnmount() { }

    initLocalData = () => {
        const { formFields, labels } = this.props.attributes;
        let months = {},
            years = {},
            titles = {},
            countries = {};
        let newOptionsMonth = [],
            newOptionsTitle = [],
            newOptionsCountry = [];
        //const monthOpt = {"label":"Month","options":[{"04":{"label":"April","value":"04"}},{"08":{"label":"August","value":"08"}},{"12":{"label":"December","value":"12"}},{"02":{"label":"February","value":"02"}},{"01":{"label":"January","value":"01"}},{"07":{"label":"July","value":"07"}},{"06":{"label":"June","value":"06"}},{"03":{"label":"March","value":"03"}},{"05":{"label":"May","value":"05"}},{"default":{"label":"Month","value":null}},{"11":{"label":"November","value":"11"}},{"10":{"label":"October","value":"10"}},{"09":{"label":"September","value":"09"}}],"error":{"invalid":"Month Invalid Error","empty":"Month Empty Error"}};

        //let monthField = monthOpt;
        let monthField = formFields.month;
        let titleField = formFields.title;
        let countryField = formFields.country;
        let firstNameError = {},
            lastNameError = {},
            cityError = {},
            countyError = {},
            monthError = {},
            numberError = {},
            billingAddressError = {},
            billingAddressError2 = {},
            countryError = {},
            titleError = {},
            zipCodeError = {},
            emailAddressError = {},
            yearsError = {};

        if (monthField !== null && monthField !== undefined) {
            Array.from(Object.values(monthField.options)).forEach((m) => {
                for (const [key, val] of Object.entries(m)) {
                    let newObj = m;
                    // let newObj = Object.values(val)[0];
                    // newObj.key = Object.keys(val)[0];
                    // newObj.value = Object.keys(val)[0];
                    // newObj.fkey = key;
                    if (Object.values(val)[1] !== null) {
                        newOptionsMonth.push(newObj);
                    }
                }
                newOptionsMonth = newOptionsMonth.sort((a, b) => {
                    // return a.key - b.key;
                    return Object.keys(a)[0] - Object.keys(b)[0];
                });

                monthField.options = newOptionsMonth;
                delete monthField.months;
            });
        }

        if (titleField.title !== undefined && titleField.title !== null) {
            Array.from(Object.values(titleField.title)).forEach((t) => {
                for (const [key, val] of Object.entries(t)) {
                    let newObj = Object.values(val)[0];

                    newObj.key = Object.keys(val)[0];
                    newObj.fkey = key;
                    newObj.value = key;
                    newOptionsTitle.push(newObj);
                }

                newOptionsTitle = newOptionsTitle.sort((a, b) => {
                    return a.key - b.key;
                });

                titleField.options = newOptionsTitle;
                delete titleField.title;
            });
        }

        if (
            countryField.countries !== null &&
            countryField.countries !== undefined
        ) {
            Array.from(Object.values(countryField.countries)).forEach((c) => {
                for (const [key, val] of Object.entries(c)) {
                    let newObj = Object.values(val)[0];

                    newObj.key = Object.keys(val)[0];
                    newObj.fkey = key;
                    newObj.value = key;
                    // //console.log(newObj)
                    if (newObj === 'United States' || newObj === 'United Kingdom' || newObj === 'Germany' || newObj === 'Australia') {
                        newOptionsCountry.shift(newObj);
                    } else {
                        newOptionsCountry.push(newObj);
                    }
                }
                let firstFourCountries = newOptionsCountry.splice(0, 4);

                newOptionsCountry = newOptionsCountry.sort((a, b) => {
                    return a.key - b.key;
                });

                newOptionsCountry = firstFourCountries.concat(newOptionsCountry);

                //newOptionsCountry= [...firstFourCountries , ...newOptionsCountry];

                countryField.options = newOptionsCountry;
                delete countryField.countries;
            });
        }

        months = monthField;
        titles = titleField;
        countries = countryField;

        let currentYear = new Date().getFullYear();
        let startYear = currentYear;
        let finalYear = currentYear + 20;

        years = formFields.year;
        years.options = [];
        for (let i = startYear; i < finalYear; i++) {
            years.options.push({ label: i, value: i });
        }

        firstNameError.empty = formFields.firstName.error.empty;
        firstNameError.invalid = formFields.firstName.error.invalid;

        lastNameError.empty = formFields.lastName.error.empty;
        lastNameError.invalid = formFields.lastName.error.invalid;

        cityError.empty = formFields.city.error.empty;
        cityError.invalid = formFields.city.error.invalid;

        countyError.empty = formFields.county.error.empty;
        countyError.invalid = formFields.county.error.invalid;

        numberError.empty = formFields.houseNumber.error.empty;
        numberError.invalid = formFields.houseNumber.error.invalid;

        billingAddressError.empty = formFields.billingAddress.error.empty;
        billingAddressError.invalid = formFields.billingAddress.error.invalid;

        billingAddressError2.empty = formFields.billingAddress2.error.empty;
        billingAddressError2.invalid = formFields.billingAddress2.error.invalid;

        titleError.empty = formFields.title.error.empty;

        countryError.empty = formFields.country.error.empty;
        countryError.invalid = formFields.country.error.invalid;

        zipCodeError.empty = formFields.zip.error.empty;
        zipCodeError.invalid = formFields.zip.error.invalid;

        emailAddressError.empty = formFields.email.error.empty;
        emailAddressError.invalid = formFields.email.error.invalid;

        this.setState({
            yearsRef: years,
            yearsError: yearsError,
            monthError: monthError,
            monthsRef: months,
            titleRef: titles,
            countryRef: countries,
            firstNameError: firstNameError,
            lastNameError: lastNameError,
            cityError: cityError,
            countyError: countyError,
            numberError: numberError,
            billingAddressError: billingAddressError,
            billingAddressError2: billingAddressError2,
            countryError: countryError,
            titleError: titleError,
            zipCodeError: zipCodeError,
            emailAddressError: emailAddressError
        });
    };

    handleMouseIn = (e) => {
        // debugger;
        const { tooltipHover } = this.state;
        tooltipHover[e] = true;
        this.setState({
            tooltipHover
        });
    };

    handleMouseOut = (e) => {
        const { tooltipHover } = this.state;
        tooltipHover[e] = false;
        this.setState({
            tooltipHover
        });
    };

    hasToolTipLabel = (formFields, tooltipLabel, name) => {
        const { tooltipHover, selectBox } = this.state;
        const display = tooltipHover[formFields.label] ? 'block' : 'none';
        const tooltipStyle = { display };
        const hasTooltip = tooltipLabel !== '' && tooltipLabel != void 0;
        const errorClass = selectBox[`${name}Error`]
            ? 'error-msg show-msg'
            : '';
        return hasTooltip ? (
            <div className="tooltip-wrapper">
                <div className={`select-label ${errorClass}`}>{`${formFields.label
                    }${name !== 'selectAddress' ? '*' : ''}`}</div>
                <div
                    className={`tooltip__icon show-focus-outlines`}
                    onMouseOver={() => this.handleMouseIn(formFields.label)}
                    onMouseOut={() => this.handleMouseOut(formFields.label)}
                    onFocus={() => this.handleMouseIn(formFields.label)}
                    onBlur={() => this.handleMouseOut(formFields.label)}
                    tabIndex="0"
                    aria-label={tooltipLabel}
                >
                    <div className="tooltip__dd" style={tooltipStyle}>
                        <p>{tooltipLabel}</p>
                    </div>
                </div>
            </div>
        ) : (
            <div className={`select-label ${errorClass}`}>{`${formFields.label
                }${name !== 'selectAddress' ? '*' : ''}`}</div>
        );
    };

    renderTitleDropdown() {
        const selectFieldTitle = (
            <SelectField
                selectClassName="select-title"
                name="title"
                // disableValidation={true}
                label={this.state.titleRef.label}
                defaultValue={this.state.titleRef.label}
                value={this.state.billingInfo.title.value}
                title={this.state.billingInfo.title.title}
                options={this.state.titleRef.options}
                showLabel={false}
                errorMsg={this.state.titleError}
                // blurCallBack={this.enableSubmitButton}
                changeCallback={(name, value, title, event) =>
                    this.handleSelectBoxChange(name, value, title, event)
                }
                errorCallback={(errorState, errorMsg) =>
                    this.handleError('selectBox', errorState, errorMsg, 'title')
                }
            />
        );

        return selectFieldTitle;
    }
    renderCountryDropdown() {
        const selectFieldCountry = (
            <SelectField
                selectClassName="select-country"
                name="country"
                label={this.state.countryRef.label}
                defaultValue={this.state.countryRef.label}
                value={this.state.billingInfo.country.value}
                title={this.state.billingInfo.country.title}
                options={this.state.countryRef.options}
                showLabel={false}
                errorMsg={this.state.countryError}
                // blurCallBack={this.enableSubmitButton}
                changeCallback={(name, value, title, event) =>
                    this.handleSelectBoxChange(name, value, title, event)
                }
                errorCallback={(errorState, errorMsg) =>
                    this.handleError(
                        'selectBox',
                        errorState,
                        errorMsg,
                        'country'
                    )
                }
            />
        );

        return selectFieldCountry;
    }

    renderAddressDropdown() {
        const {
            formFields: { selectAddress }
        } = this.props.attributes;
        const selectFieldAddress = (
            <SelectField
                selectClassName="select-address"
                name="selectedAddress"
                label={selectAddress.label}
                defaultValue={selectAddress.label}
                value={this.state.selectedAddress.value}
                title={this.state.selectedAddress.title}
                options={this.state.selectAddressOption}
                showLabel={false}
                errorMsg={this.state.countryError}
                // blurCallBack={this.enableSubmitButton}
                disableValidation={true}
                changeCallback={(name, value, title, event) =>
                    this.handleSelectAddressBoxChange(name, value, title, event)
                }
            />
        );

        return selectFieldAddress;
    }

    handleSelectAddressBoxChange = (name, value, title, event) => {
        let newSelected = {
            value: value,
            title: title
        };
        const { selectAddressOption, billingInfo, validate } = this.state;
        const address = selectAddressOption.filter((singleAddress) => {
            return singleAddress.value == value;
        });
        const { housename, address1, address2, address3, county } = address[0];
        let copyOfState = Object.assign({}, billingInfo);
        copyOfState[`billingAddress`] = `${housename.length !== undefined ? `${housename},` : ''
            } ${address1.length !== undefined ? address1 : ''}`;
        copyOfState[`billingAddress2`] = `${address2.length !== undefined ? address2 : ''
            }`;
        copyOfState[`city`] = `${address3.length !== undefined ? address3 : ''
            }`;
        copyOfState[`county`] = `${county.length !== undefined ? county : ''}`;

        this.setState({
            selectedAddress: newSelected,
            billingInfo: copyOfState
        },
            () => {
                const { validate } = this.state;
                if (validate) {
                    document.getElementById('billingAddress').focus();
                    document.getElementById('billingAddress').blur();
                    document.getElementById('city').focus();
                    document.getElementById('city').blur();
                    document.getElementById('county').focus();
                    document.getElementById('county').blur();
                    document.getElementById('country').focus();
                    document.getElementById('country').blur();
                }
            });
    };

    handleEnterKeyPress = (e) => {
        if (e.key === 'Enter') {
            this.handleSubmit();
        }
    };

    sendAnalyticsData = (errorMsg) => {
        const analyticsObj = {
            componentName: `${this.props.type}`,
            linkType: 'o',
            linkPageName: getConfig('pageName'),
            validationError: `${errorMsg}`,
            event: 'event77'
        };
        analytics.customClicks(analyticsObj, "errorTrack");
    };


    handleError = (stateKey, errorState, errorMsg, name) => {
        const { selectBox } = this.state;
        if (stateKey == 'zipCode' && !errorState) {
            this.disablingPostCodeError();
        }
        selectBox[`${name}Error`] = errorState ? errorState : false;
        this.setState(
            {
                selectBox: selectBox
            },
            () => {
                let errors = this.state.errors;

                if (this.state.isFormSubmitted) {
                    if (errorState) {
                        if (errorMsg) {
                            errors[stateKey] = errorMsg;
                        } else if (errors[stateKey]) {
                            /* selectField returns empty message with error value as false, which needs to be removed from error Sumary */
                            delete errors[stateKey];
                        }
                    } else {
                        if (errors[stateKey]) {
                            delete errors[stateKey];
                        }
                    }
                    this.setState({
                        ...this.state,
                        errors
                    });
                }
            }
        );
    };
    handleTextChange = (evt) => {
        let newSelected = evt.target.value;
        let copyOfState = Object.assign({}, this.state.billingInfo);
        copyOfState[evt.target.name] = newSelected;
        this.setState({ billingInfo: copyOfState });
    };
    handleSelectBoxChange = (name, value = "", title, event) => {
        let newSelected = {
            value: value,
            title: title
        };

        let copyOfState = Object.assign({}, this.state.billingInfo);

        if (name === 'title' || name === 'country') {
            copyOfState[name] = newSelected;
        }

        this.setState({ billingInfo: copyOfState });

        if (name === 'country') {
            this.changeCountyLabel(value);
        }
    };

    /**
     * If the country has states parameters, show the county/state input field
     * @param {object} value option selected in country
     */
    changeCountyLabel = (value) => {
        let selectedCountry = [];
        if (value) {
            selectedCountry = this.state.countryRef.options.filter(
                (x, index) => x[value] !== undefined
            );
        }
        let selected = selectedCountry.length && selectedCountry[0][value] ? selectedCountry[0][value] : '';
        let states = selected.states;

        if (states !== undefined && states !== null) {
            this.setState({
                countyVisible: true,
                countyLabel: selected.regionLabel,
                selectedCountry: value,
            });
        } else {
            this.setState({
                countyVisible: false
            });
        }
    };

    handleCheckoutModalError = (res) => {
        const { reserveStockErrorList, labels } = this.props;
        const resultInActive = res.errors.some(
            (e) => e.reason != undefined && (e.reason === 'R10037' ||
                e.reason === 'R10026') &&
                e.startDateTime != undefined
        )
        const resultONHOLD = res.errors.some(
            (e) => (e.reason != undefined && (e.reason === 'R10037' ||
                e.reason === 'R10026') && e.startDateTime === undefined)
        )

        const errorListAEM = reserveStockErrorList && (Object.entries(reserveStockErrorList).length || reserveStockErrorList.length) ? reserveStockErrorList : [{ "errorCode": 'OutOfStock' }];
        const filteredErrors = res.errors && res.errors.filter((err) => {
            return errorListAEM.some((reason) => (reason.errorCode.trim().toLowerCase() === err.reason.trim().toLowerCase()))
        })
        // console.log('new fildd', filteredErrors)
        let cartEntries = [];
        let newCartEntry = [];
        let isONHOLD = false;
        const listOfNewProduct = [];
        const listOfExistingProduct = [];

        if (res.cart.entries.length > 0 && filteredErrors.length) {
            res.cart.entries.map((item, index) => {
                filteredErrors.map((entry) => {
                    if (entry.entryIndex === index) {
                        cartEntries.push(item)
                    }
                })

            });
        } else {
            if (resultONHOLD) {
                isONHOLD = true;
                res.errors.map((item) => {
                    res.cart.entries.map((e) => {
                        if (item.entryIndex === e.entryNumber && item.startDateTime === undefined) {
                            cartEntries.push(e);
                            const newProduct = {
                                name: e.attributes.name,
                                dateTime: `${plainDateFormat(
                                    new Date(
                                        e.attributes.startDateTime.substring(
                                            0,
                                            e.attributes
                                                .startDateTime
                                                .length - 1
                                        )
                                    ),
                                    'HH:mm | ddd Do MMM YYYY'
                                )} | ${e.noOfGuests} ${labels.guestsLabel
                                    }`
                            };
                            listOfNewProduct.push(newProduct);
                        }
                    });
                });
            } else if (resultInActive && !resultONHOLD) {
                res.errors.map((item) => {
                    res.cart.entries.map((e) => {
                        if (item.entryIndex === e.entryNumber && item.startDateTime) {
                            cartEntries.push(e);
                            const existingProduct = {
                                name: item.productName,
                                dateTime: `${moment(
                                    item.startDateTime,
                                    'YYYYMMDDhhmmss'
                                ).format(
                                    'HH:mm | ddd Do MMM YYYY'
                                )} | ${item.noOfGuest} ${labels.guestsLabel
                                    }`
                            };
                            const newProduct = {
                                name: e.attributes.name,
                                dateTime: `${plainDateFormat(
                                    new Date(
                                        e.attributes.startDateTime.substring(
                                            0,
                                            e.attributes
                                                .startDateTime
                                                .length - 1
                                        )
                                    ),
                                    'HH:mm | ddd Do MMM YYYY'
                                )} | ${e.noOfGuests} ${labels.guestsLabel
                                    }`
                            };

                            listOfNewProduct.push(newProduct);
                            listOfExistingProduct.push(existingProduct);
                        }
                    });
                });
            }
        }

        let temp = cartEntries;
        // Grouping product data with same group ID bcz in other product types we have a seperate entry in cart for each guest eg. SHOREX
        let cartResult = temp.reduce((r, a) => {
            r[a.groupID] = r[a.groupID] || [];
            r[a.groupID].push(a);

            return r;
        }, Object.create(null));
        newCartEntry = Object.values(cartResult);
        // console.log('Grouped Entries', newCartEntry)
        return {
            resultInActive, resultONHOLD, cartEntries, newCartEntry, isONHOLD, listOfNewProduct, listOfExistingProduct, filteredErrors
        }
    }

    reserveStockAPiCall = async () => {
        const { urls } = this.props.attributes.services;
        const errors = this.props.errorLabels.reserveHybris;
        const technicalErrorLabel = this.props.attributes.labels.technicalErrorLabel;
        let url = urls.reserveStockApi;
        let header = SessionStorage.getItem('header');
        const { customer: { loyaltyTier } } = header;
        let apikey =
            typeof window !== 'undefined' ? window.configs.apikeyMycruise : '';
        const obj = JSON.stringify({
            reservationMode: 'RESERVE'
        });

        let errorMsgList = typeof document !== 'undefined' ? document.getElementsByClassName('show-msg') : [];
        let noErrors = false;
        if(errorMsgList && errorMsgList.length) {
            let listIndex = 0;
            for(var i = 0; i < errorMsgList.length; i++) {
                let parentElement = errorMsgList[i].parentElement;
                if(parentElement && parentElement.getElementsByClassName('couponInputWrapper')) {
                    listIndex++;
                }
            }
            if( errorMsgList.length > listIndex ) {
                noErrors = false;
            } else {
                noErrors = true;
            }
        } else {
            noErrors = true;
        }
        if (noErrors) {
            fetchData(url, {
                method: 'POST',
                body: obj,
                headers: {
                    'X-CommonData': JSON.stringify(header),
                    'Content-Type': 'application/json',
                    'X-Source-Identity-Token-0': apikey
                },
                mode: 'cors'
            }).then((res) => {
                // herror handling
                if (res.httpstatus) {
                    let error =
                        (parseInt(res.httpstatus) >= 400 && parseInt(res.httpstatus) < 510)
                            ? technicalErrorLabel
                            : errors[res.httpstatus];
                    this.setState({
                        showThrobber: false,
                        showModalError: true,
                        genericErrorLabel: error,
                        showLoader : false
                    });
                } else if (res.errors && res.errors.length > 0) {
                    const { resultInActive, resultONHOLD, newCartEntry, isONHOLD, listOfNewProduct, listOfExistingProduct, filteredErrors } = this.handleCheckoutModalError(res);

                    if ((!resultInActive || !resultONHOLD) && filteredErrors.length > 0) {
                        this.setState({
                            showDuplicateEvent: false,
                            showModalExpired: true,
                            newCart: res,
                            newCartEnteries: newCartEntry,
                            checkNoMoreCart:
                                res.cart.entries.length === newCartEntry.length
                                    ? true
                                    : false,
                                    showLoader : false
                        });
                    } else {
                        this.setState({
                            showModalExpired: false,
                            showDuplicateEvent: true,
                            newCart: res,
                            newCartEnteries: newCartEntry,
                            newProductBooking: listOfNewProduct,
                            existingProduct: listOfExistingProduct,
                            checkNoMoreCart:
                                res.cart.entries.length === newCartEntry.length
                                    ? true
                                    : false,
                            isONHOLD,
                            showLoader : false
                        });
                    }
                } else {
                    // no errors, continue to acceptance of terms and condition
                    const clientTransactionId = res.cart.clientTransactionId;
                    SessionStorage.setItem('clientTransactionId', clientTransactionId);
                    let productPromotionS =  res.cart.appliedProductPromotions.filter((item)=> item.isCoupon ? item.isCoupon : false)
                    const postPaymentData = {
                        subTotal: res.cart.subTotal,
                        loyaltyTier: loyaltyTier !== '' ? `${loyaltyTier} Tier` : '',
                        totalChildDiscount: res.cart.totalChildDiscount,
                        totalLoyaltyDiscount: res.cart.totalLoyaltyDiscount,
                        totalDiscounts: res.cart.totalDiscounts || {},
                        totalPrice: res.cart.totalPrice,
                        appliedVouchers : res.cart.appliedVouchers,
                        couponDiscounts : res.cart.couponDiscounts,
                        productPromotionS : productPromotionS
                    }
                    SessionStorage.setItem('reserveStockData', postPaymentData);
                    const analyticsDataObj = this.preparingTheAnalyticsDataObject(res.cart);
                    SessionStorage.setItem('analyticsDataObjForHybrisSol', analyticsDataObj);
                    this.setState({
                        showModalTerms: false,
                        disabled: false
                    });
                    this.requestKeys();
                }
            }).catch(()=>{
                this.setState({
                    showLoader : false})
            });
        }
    }
    /**
     * Payment process first step: check with stock reservation API to check if products still availables
     */
    handleSubmit = async () => {
        // verify if all products in the cart are still available
        // /{baseSiteId}/users/<encryptId>/carts/<cartId>/reserveStock
        // POST
        // Query Params fields = level of detail (OOTB for OCC calls, all data will be returned regardless for this interface).
        // {
        //     "reservationMode": "RESERVE"
        // }
        const { termsAndConditionCheckBoxChecked } = this.state;
        if (termsAndConditionCheckBoxChecked) {
            const analyticsParam = {
                "event": "event310"
            }
            analytics.customClicks(analyticsParam);
            await this.reserveStockAPiCall();
        } else {
            const { labels } = this.props.attributes;
            const obj = {
                componentName: this.props.type,
                linkType: 'o',
                linkPageName: getConfig('pageName'),
                validationError: labels.termsAndConditionsErrorLabel,
                event: 'event77'
            };
            analytics.customClicks(obj, "errorTrack");
            this.setState({
                termsAndConditionCheckBoxError: true,
                validate: true,
                showLoader : false
            });
        }
    };

    preparingTheAnalyticsDataObject = (res) => {
        const header = SessionStorage.getItem('header');
        const cruiseData = SessionStorage.getItem('cruiseData');
        const config =
            typeof window !== 'undefined'
                ? window.configs
                : '';
        const customCurrencyCode = config.brand.toLowerCase() === "po" ? "gbp" : "usd";

        const {
            entries
        } = res;
        const subTotal = entries.reduce(
            (subTotal, entry) => subTotal + ((entry.product.productType === 'DINING') ? (entry.basePrice.value * entry.noOfGuests) :
                (entry.product.productType === 'AIBEVERAGE') ? (entry.basePrice.value * entry.quantity) :
                    entry.basePrice.value),
            0
        );

        let dobArray = [];
        header.passengers.forEach((passenger) => {
            dobArray.push(passenger.birthDate);
        })

        const lineItemsData = [];

        res.entries.forEach((resData) => {
            let diningCategory = '';
            if (resData.product.productType === 'DINING') {
                if (resData.attributes && resData.attributes.name && resData.attributes.name.toLowerCase().includes('cookery')) {
                    diningCategory = 'CookeryClub'
                } else if (resData.attributes && resData.attributes.name && resData.attributes.name.toLowerCase().includes('limelight')) {
                    diningCategory = 'EventDining'
                } else if (resData.attributes && resData.attributes.name) {
                    diningCategory = 'SelectDining'
                }
            }

            let skuID = resData.attributes.baseProduct;
            let productID = '';
            if (resData.product.productType === 'DINING') {
                let currentProductSkusID = resData.attributes.baseProduct;
                if (currentProductSkusID) {
                    currentProductSkusID = currentProductSkusID.split('_');
                    if (currentProductSkusID.length >= 4) {
                        skuID = currentProductSkusID[3];
                        productID = `${currentProductSkusID[1]}_${currentProductSkusID[2]}`;
                    }
                }
            }

            const product = {
                skuID:
                    resData.product.productType === 'SHOREX' ||
                        resData.product.productType === 'DINING'
                        ? diningCategory !== 'SelectDining'
                            ? resData.product.productType === 'SHOREX'
                                ? skuID
                                : ''
                            : skuID
                        : resData.product.externalCode,
                productID: (resData.product.productType === 'SHOREX' || resData.product.productType === 'SPA') ? resData.attributes.baseProduct : (resData.product.productType === 'DINING') ? productID : resData.product.externalCode,
                productName: (resData.product.productType === 'SPA') ? '' : resData.attributes.name,
                skuName: diningCategory !== 'SelectDining' ? resData.attributes.name : '',
                productType: (resData.product.productType === 'SHOREX' || resData.product.productType === 'DINING' || resData.product.productType === 'SPA') ? resData.product.productType : "aibeverage",
                startDateTime: (resData.attributes.startDateTime) ? resData.attributes.startDateTime : (resData.product.productType === 'SPA') ? resData.attributes.startDateTime : '',
                shorexAttributes: {
                    portName: (resData.product.productType === 'SHOREX') ? resData.attributes.port.shortName : '',
                    activityLevel: "",
                    language: (resData.product.productType === 'SHOREX') ? resData.attributes.language : '',
                    duration: "",
                    transport: "",
                    minAge: "",
                    maxAge: "",
                    tourType: [""],
                    tourCategory: "",
                    tourFeatures: ""
                },
                diningMealPeriod: resData.attributes.mealPeriod ? resData.attributes.mealPeriod : '',
                diningCategory: diningCategory,
                spaTreatmentType: (resData.product.productType === 'SPA') ? resData.attributes.treatmentType : '',
                spaDuration: (resData.product.productType === 'SPA') ? resData.attributes.treatmentDuration : '',
                quantity: (resData.product.productType === 'DINING') ? resData.noOfGuests : resData.quantity ? parseInt(resData.quantity) : '',
                unitPrice_GBP: resData.basePrice.value ? convertValueToVaildDecimalPoint(resData.basePrice.value) : '',
                unitSalePrice_GBP: resData.totalPrice.value ? convertValueToVaildDecimalPoint(resData.totalPrice.value) : '',
                unitPrice_local: resData.basePrice.value ? convertValueToVaildDecimalPoint(resData.basePrice.value) : '',
                unitSalePrice_local: resData.totalPrice.value ? convertValueToVaildDecimalPoint(resData.totalPrice.value) : ''
            };

            lineItemsData.push(product);
        })

        const analyticsDataObject = {
            myCruiseDetails: {
                bookingNumber: header.bookingRef,
                voyageID: header.cruiseCode,
                voyageName: cruiseData.cruiseName,
                shipName: cruiseData.shipName,
                depDate: header.embarkationDate,
                destName: "",
                durationDays: header.physicalCruiseDuration,
                depPortName: cruiseData.embarkPort,
                destPortName: cruiseData.disembarkPort,
                stateroomType: "",
                numGuests: header.passengers.length,
                dob: dobArray,
            },
            loginStatus: "logged in",
            loginType: (header.agent) ? header.agent.agentType : 'customer',
            AgentID: (header.agent) ? header.agent.id : '',
            crmID: "",
            country: header.market,
            languageSelected: header.language.substring(0, 2),
            customCurrencyCode: customCurrencyCode,
            memberLoyaltyLevel: header.customer.loyaltyTier,
            server: "",
            localDayTime: new Date().toString(),
            timePartingCodes: "",
            pageType: "",
            //Please refer Page and Content Hierarchy Tabs for below values
            sectionLevelOne: "",
            sectionLevelTwo: "",
            sectionLevelThree: "",
            sectionLevelFour: "",
            pageName: "",
            pageChannel: "",
            pageHier: "",
            //Please refer Page and Content Hierarchy Tabs for above values
            ecomStep: "",
            event: "purchase,event44",
            paymentType: "Full",
            paymentMethod: "Credit",
            transactionID: "",
            myCruiseOrder: {
                orderSubtotal_GBP: convertValueToVaildDecimalPoint(subTotal),
                orderTotal_GBP: convertValueToVaildDecimalPoint(subTotal),
                orderSubtotal_local: convertValueToVaildDecimalPoint(subTotal),
                orderTotal_local: convertValueToVaildDecimalPoint(subTotal),
                loyaltyDiscount_GBP: res.totalLoyaltyDiscount.value,
                loyaltyDiscount_local: res.totalLoyaltyDiscount.value,
                lineItems: lineItemsData
            }
        };

        return analyticsDataObject;
    }

    handleModalExpired = (value) => {
        analytics.clickTracking(this);
        this.removeWithIteration(value);
    }

    handleContinueCheckout = (value) => {
        this.removeWithIteration(value);
    };

    removeWithIteration = (value) => {
        const { newCartEnteries } = this.state;
        for (let i = 0; i < newCartEnteries.length; i++) {
            this.requestCancellation(i, newCartEnteries[i][0].groupID, value);
        }
    };

    requestCancellation = (v, groupID, value) => {
        const { services } = this.props;
        const { newCartEnteries, newCart } = this.state;
        const { updateCartApi } = services.urls;
        const header = SessionStorage.getItem('header');
        const { customer: { loyaltyTier } } = header;
        const apiKey = getConfig('apikeyMycruise', '');
        fetchData(updateCartApi, {
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
            } else if (
                v == newCartEnteries.length - 1 &&
                (value === 'close' || value === 'continue')
            ) {
                this.props.handleReserveStockError(value);
                this.setState({
                    showModalExpired: false,
                    showDuplicateEvent: false
                });
            } else if (
                v == newCartEnteries.length - 1 &&
                value === 'checkout'
            ) {

                res.totalPriceWithTax.value <= 0
                    ? this.requestKeysZeroVal()
                    : this.reserveStockAPiCall()
            }
        });
    }

    handleModalError() {
        this.setState({
            showModalError: false,
            capturedAmountLabel: false
        });
        // this.props.handleReserveStockError(this.state.newCart.cart);
    }

    handleModal(status) {
        this.setState({
            showModalTerms: status
        });
    }

    requestKeysZeroVal = () => {
        let copyOfState = Object.assign({}, this.state.billingInfo);
        const { urls } = this.props.attributes.services;
        const errors = this.props.errorLabels.reserveHybris;
        const technicalErrorLabel = this.props.attributes.labels.technicalErrorLabel;
        const errors400 = this.props.errorLabels.errors400;
        let url = urls.placeOrderZeroCartVal;
        let header = SessionStorage.getItem('header');
        const {
            customer: { loyaltyTier }
        } = header;
        let apikey =
            typeof window !== 'undefined' ? window.configs.apikeyMycruise : '';

        let billingAddress = {};

        billingAddress['title'] = this.state.billingInfo.title.value;
        billingAddress['firstName'] = this.state.billingInfo.firstName;
        billingAddress['lastName'] = this.state.billingInfo.lastName;
        billingAddress['streetNumber'] = this.state.billingInfo.number;
        billingAddress['line1'] = this.state.billingInfo.billingAddress;
        billingAddress['line2'] = this.state.billingInfo.billingAddress2;
        billingAddress['town'] = this.state.billingInfo.city;
        billingAddress['postalCode'] = this.state.billingInfo.zipCode;
        billingAddress['email'] = this.state.billingInfo.email;
        billingAddress['amount'] = this.state.totalPriceWithTax.value;
        billingAddress['currency'] = this.state.totalPriceWithTax.currencyIso;

        SessionStorage.setItem('billingAddress', billingAddress);
        let params = { billingAddress: billingAddress };
        const obj = JSON.stringify(params);

        fetchData(url, {
            method: 'POST',
            body: obj,
            headers: {
                'X-CommonData': JSON.stringify(header),
                'Content-Type': 'application/json',
                'X-Source-Identity-Token-0': apikey
            },
            mode: 'cors'
        }).then((res) => {
            if (res.status && res.status.toLowerCase() != 'created') {
                let error =
                    parseInt(res.status) === 400
                        ? errors400[res.message]
                        : errors[res.status];
                this.setState({
                    showThrobber: false,
                    showModalError: true,
                    genericErrorLabel: error,
                    billingInfo: copyOfState
                });
            } else if (res.errors && res.errors.length > 0) {
                const { resultInActive, resultONHOLD, newCartEntry, isONHOLD, listOfNewProduct, listOfExistingProduct, filteredErrors } = this.handleCheckoutModalError(res);

                if ((!resultInActive || !resultONHOLD) && filteredErrors.length > 0) {
                    this.setState({
                        showDuplicateEvent: false,
                        showModalExpired: true,
                        newCart: res,
                        newCartEnteries: newCartEntry,
                        checkNoMoreCart:
                            res.cart.entries.length === newCartEntry.length
                                ? true
                                : false,
                        billingInfo: copyOfState
                    });
                } else {
                    this.setState({
                        showModalExpired: false,
                        showDuplicateEvent: true,
                        newCart: res,
                        newCartEnteries: newCartEntry,
                        newProductBooking: listOfNewProduct,
                        existingProduct: listOfExistingProduct,
                        checkNoMoreCart:
                            res.cart.entries.length === newCartEntry.length
                                ? true
                                : false,
                        isONHOLD,
                        billingInfo: copyOfState
                    });
                }
            } else {
                if (res.order && res.order.code) {
                    const orderId = res.order.code;
                    const zeroPaymentOrder = {
                        orderId: orderId,
                        payment: 0
                    };
                    SessionStorage.setItem('orderId', zeroPaymentOrder);
                    this.setState({
                        showModalTerms: false,
                        disabled: false,
                        billingInfo: copyOfState
                    });
                    const analyticsParam = {
                        event: 'event311'
                    };
                    // analytics.customClicks(analyticsParam);
                    const { configs } = window;
                    let redirectLink =
                        configs.confirmationPageUrl + '?orderId=' + orderId;
                    window.location.href = redirectLink;
                } else {
                    this.setState({
                        showModalError: true,
                        genericErrorLabel: technicalErrorLabel
                    })
                }
            }
        });
    };

    //////// getCheckoutUrl from in this method , getChecoutUrl
    //, shoppingcartid
    requestKeys = (pubKey) => {
        const analyticsParam = {
            event: "event311"
        }
        analytics.customClicks(analyticsParam)
        const userData = SessionStorage.getItem('userData');
        let bookingReference = userData.bookingRef;
        const header = SessionStorage.getItem('header');

        let sequenceNumber = '1';
        let date = plainDateFormat(new Date(), 'YYYYMMDDHHMMSS');
        // let transactionId = `${bookingReference}-${sequenceNumber}-${date}`;
        let transactionId = SessionStorage.getItem('clientTransactionId');
        const errorsTransaction = this.props.errorLabels.transaction;
        const errorsPxp = this.props.errorLabels.pxp;
        let url = this.props.attributes.checkoutServlet;
        let { merchantId, psdStoreId, psdUserId } = this.props.attributes;
        ////console.log(locale);
        let billingAddress = {};
        let value = this.state.billingInfo.country.value;

        let selectedCountry = this.state.countryRef.options.find(
            (x) => Object.keys(x)[0] === value
        );

        billingAddress['title'] = this.state.billingInfo.title.value;
        billingAddress['firstName'] = this.state.billingInfo.firstName;
        billingAddress['lastName'] = this.state.billingInfo.lastName;
        // billingAddress['streetNumber'] = this.state.billingInfo.number;
        billingAddress['line1'] = this.state.billingInfo.billingAddress;
        billingAddress['line2'] = this.state.billingInfo.billingAddress2;
        billingAddress['town'] = this.state.billingInfo.city;
        billingAddress['postalCode'] = this.state.billingInfo.zipCode;
        billingAddress['email'] = this.state.billingInfo.email;
        billingAddress['clientSystemTransactionId'] = transactionId;
        billingAddress['amount'] = this.state.totalPriceWithTax.value;
        billingAddress['currency'] = this.state.totalPriceWithTax.currencyIso;
        billingAddress['storeId'] = psdStoreId;

        let country = {};
        //mock purpose
        country['isoCode'] = Object.keys(selectedCountry)[0];
        billingAddress['country'] = Object.keys(selectedCountry)[0];
        billingAddress['isocode'] = Object.values(selectedCountry)[0].isoCode;
        SessionStorage.setItem('billingAddress', billingAddress);
        this.excuteCallForPaymentMonitoring('', '', '200');
        let redirectLink = 'payment';
        window.location.href = redirectLink;
    };

    excuteCallForPaymentMonitoring = (apiEndPoint, iframePxPUrl, responseCode) => {
        const pageName = getConfig('pageName', '');
        const billingAddress = SessionStorage.getItem('billingAddress');
        const cruiseData = SessionStorage.getItem('cruiseData');
        const isHybrisPaymentSolutionEnabled = getConfig('isHybrisPaymentSolutionEnabled') || 'false';
        const valueOfHybrisPaymentSolutionCookie = getCookie('HybrisPaymentSolution');
        const isHybrisPaymentSolutionActive = ((valueOfHybrisPaymentSolutionCookie == 'true' ? true : false) || (!checkCookie("HybrisPaymentSolution") && (isHybrisPaymentSolutionEnabled == 'true' || isHybrisPaymentSolutionEnabled == 'True')))

        const postData = {
            id: `${pageName.substr(pageName.lastIndexOf(':') + 1, pageName.length)}-${new Date().valueOf()}-${Math.random()}`,
            type: isHybrisPaymentSolutionActive ? "checkout pre auth" : "checkout",
            endPoint: apiEndPoint !== '' ? `${apiEndPoint}` : 'none',
            date: moment().format('YYYY-MM-DD'),
            pageName: `${pageName.substr(pageName.lastIndexOf(':') + 1, pageName.length)}`,
            project: "MyCruise",
            "user-agent": `${navigator.userAgent}`,
            sessionId: getCookie('mbox'),
            transactionId: billingAddress.clientSystemTransactionId ? `${billingAddress.clientSystemTransactionId}` : '',
            locale: getConfig('locale'),
            userCountry: `${(Intl.DateTimeFormat().resolvedOptions().timeZone)}`,
            brand: getConfig('brand'),
            cruiseID: cruiseData && cruiseData.sailingId,
            bookingCompleted: false,
            threeDSConfigured: isHybrisPaymentSolutionActive ? true : false,
            apiName: iframePxPUrl !== '' ? `${iframePxPUrl}` : 'none',
            errorCode: responseCode == "200" ? "200" : `${responseCode}`,
            errorDescription: responseCode == "200" ? "none" : 'iframe non loaded',
            status: responseCode == '200' ? true : false
        }

        callForPaymentMonitoring(postData)
            .then((res) => {
                // do nothing;
            })
            .catch((err) => {
                //console.log('err', err)
            })
    }

    /**
     * Terms and condition text will be aquired from the fe with a call to AEM
     */
    gettermsAndConditionsText = () => {
        const { disclaimerUrl } = this.props.attributes;
        let url = `${disclaimerUrl}.content`; //YD .html after .content is missing.
        const { billingInfo } = this.state;
        SessionStorage.setItem('billingInfo', billingInfo);
        // const url = disclaimerUrl.replace('.html', `.content.html`);

        fetch(url, {
            method: 'GET'
        })
            .then((response) => {
                return response.text();
            })
            .then((html) => {
                this.setState({
                    termsAndConditionsText: html,
                    capturedAmountLabel: false
                });
            });
    };

    /**
     * Every focus out form an input we verify if the form is completed so the complete payment button can be enabled
     */
    enableSubmitButton = () => {
       
        const { labels } = this.props.attributes;
        // CKS - disabling complete payment button on blur of any field
        this.setState({
            formCompleted: false,
            showLoader : true
        }, () => {
            let empty = 0;
            let noEmpty = false;
            let noErrors = false;
            let postCodeHasRegexError = false;
            const { termsAndConditionCheckBoxChecked, billingInfo: { zipCode, country } } = this.state;

            Object.keys(this.state.billingInfo).map((field, index) => {
                if (
                    field === 'billingAddress2' ||
                    field === 'county' ||
                    field === 'title'
                ) {
                    return false;
                }
                if (
                    typeof this.state.billingInfo[field] === 'string' &&
                    this.state.billingInfo[field] === ''
                ) {
                    empty++;
                } else if (typeof this.state.billingInfo[field] === 'object') {
                    let item = this.state.billingInfo[field];

                    Object.keys(item).map((internalObject, index) => {
                        if (item[internalObject].value === '') {
                            empty++;
                        }
                    });
                }
            });
            // check if fields are filled
            if (empty === 0) {
                noEmpty = true;
                // check if there are other errors
                let errorMsgList = typeof document !== 'undefined' ? document.getElementsByClassName('show-msg') : [];
                if(errorMsgList && errorMsgList.length) {
                    let listIndex = 0;
                    for(var i = 0; i < errorMsgList.length; i++) {
                        let parentElement = errorMsgList[i].parentElement;
                        if(parentElement && parentElement.getElementsByClassName('couponInputWrapper')) {
                            listIndex++;
                        }
                    }
                    if( errorMsgList.length > listIndex ) {
                        noErrors = false;
                    } else {
                        noErrors = true;
                    }
                } else {
                    noErrors = true;
                }
            }

            if (country.value && country.value == 'GB') {
                const postCodeRegex = new RegExp(regex.postalCode_gb);
                postCodeHasRegexError = !postCodeRegex.test(zipCode);
                if (postCodeHasRegexError) {
                    this.enablingPostCodeError();
                } else {
                    this.disablingPostCodeError();
                }
            } else {
                postCodeHasRegexError = false;
            }

            // if both true, set state to show btn
            if (noErrors && noEmpty && termsAndConditionCheckBoxChecked && !postCodeHasRegexError) {
                // this.setState({
                // formCompleted: true
                // });
                // if (typeof document !== 'undefined' && document.activeElement.textContent === 'Continue') {
                this.handleSubmit();
                // }
            } else {
                this.setState(
                    {
                        termsAndConditionCheckBoxError: !termsAndConditionCheckBoxChecked,
                        formCompleted: false,
                        validate: true,
                        showLoader : false
                    },
                    () => {
                        const obj = {
                            componentName: this.props.type,
                            linkType: 'o',
                            linkPageName: getConfig('pageName'),
                            validationError:
                                labels.termsAndConditionsErrorLabel,
                            event: 'event77'
                        };
                        termsAndConditionCheckBoxChecked &&
                            analytics.customClicks(obj, 'errorTrack');
                        let errorArray = [];
                        let inputELements = document.getElementsByTagName('input') && Array.from(document.getElementsByTagName('input')).length && Array.from(document.getElementsByTagName('input'));
                        let inputSelectELements = document.getElementsByTagName('select') && Array.from(document.getElementsByTagName('select')).length && Array.from(document.getElementsByTagName('select'));
                        errorArray = [...inputSelectELements, ...inputELements];
                        let errorTrack = [];

                        if (errorArray && errorArray.length > 0) {
                            errorArray.forEach((inputElement) => {
                                // console.log('errorArray===>', errorArray);
                                if (inputElement.hasAttribute('aria-invalid') && inputElement.getAttribute('aria-invalid') === 'true') {
                                    errorTrack.push(inputElement);
                                }
                            })
                        }
                        let focusIndex = 0;
                        if(errorTrack.length) {
                            let parentElement = errorTrack[0].parentElement;
                            if(parentElement && parentElement.getElementsByClassName('couponInputWrapper')) {
                                focusIndex = 1;
                            }
                        }
                        
                        errorTrack.length ? errorTrack[focusIndex].focus() : !termsAndConditionCheckBoxChecked ? document.getElementById('checkbox_term').focus() : null;

                    }
                );
            }
            // this.setState({showLoader : false})
        });
       

    };

    handleTermsAndConditionCheckBox = () => {
        const { termsAndConditionCheckBoxChecked } = this.state;
        this.setState({
            termsAndConditionCheckBoxChecked: !termsAndConditionCheckBoxChecked,
            termsAndConditionCheckBoxError: false
        });
    };

    enablingPostCodeError = (msg = '') => {
        const {
            billingInfo: { zipCode }
        } = this.state;
        const {
            formFields: {
                zip: {
                    error: { invalid, empty }
                }
            }
        } = this.props.attributes;
        let errorMsg = msg !== '' ? msg : empty;
        if (zipCode.trim().length > 0) {
            errorMsg = msg !== '' ? msg : invalid;
        }
        const ele = document.getElementsByClassName('zipCode');
        if (ele.length) {
            ele[0].classList.add('show-error');
            if (ele[0].childElementCount) {
                for (let i = 0; i < ele[0].childElementCount; i++) {
                    const node = ele[0].children[i];
                    const nodeName = ele[0].children[i].nodeName;
                    const targetEle =
                        nodeName !== 'P' &&
                        ele[0].children[i].querySelector('p');
                    if (
                        nodeName == 'P' &&
                        node.classList.contains('error-msg')
                    ) {
                        node.classList.add('show-msg');
                        node.innerHTML = errorMsg;
                    } else if (
                        targetEle &&
                        targetEle.classList.contains('error-msg')
                    ) {
                        ele[0].children[i]
                            .querySelector('p')
                            .classList.add('show-msg');
                        ele[0].children[i].querySelector(
                            'p'
                        ).innerHTML = errorMsg;
                    }
                }
            }
        }
    };

    disablingPostCodeError = () => {
        const ele = document.getElementsByClassName('zipCode');
        if (ele.length) {
            ele[0].classList.remove('show-error');
            if (ele[0].childElementCount) {
                for (let i = 0; i < ele[0].childElementCount; i++) {
                    const node = ele[0].children[i];
                    const nodeName = ele[0].children[i].nodeName;
                    const targetEle =
                        nodeName !== 'P' &&
                        ele[0].children[i].querySelector('p');
                    if (
                        nodeName == 'P' &&
                        node.classList.contains('error-msg')
                    ) {
                        node.classList.remove('show-msg');
                    } else if (
                        targetEle &&
                        targetEle.classList.contains('error-msg')
                    ) {
                        ele[0].children[i]
                            .querySelector('p')
                            .classList.remove('show-msg');
                    }
                }
            }
        }
    };

    validateUkPostCode = () => {
        let flag = true;
        const {
            billingInfo: {
                zipCode,
                country: { value = '' }
            }
        } = this.state;
        const gbPostalCode = regex.postalCode_gb;
        if (value == 'GB') {
            flag = gbPostalCode.test(zipCode);
        }
        return value !== '' ? flag : false;
    };

    handleUKAddressClick = (e) => {
        e.preventDefault();
        const {
            formFields,
            labels: {
                postcodeLookupApiErrorTimeout = '',
                postcodeLookupApiErrorInvalidPostcode = '',
                postcodeLookupApiErrorTechnicalProblem = ''
            }
        } = this.props.attributes;
        const postCodeLookUpApiUrl =
            getConfig('postCodeLookUpAPIURL') ||
            '/api/v2/accounts/postCodeLookUpUK';
        const {
            billingInfo: { zipCode }
        } = this.state;
        if (zipCode.trim().length == 0 || zipCode == void 0) {
            this.enablingPostCodeError();
            this.sendAnalyticsData(formFields.zip.error.empty);
            this.setState({
                isSelectAddressVisible: false
            });
        } else {
            const isPostCodeVaild = this.validateUkPostCode();
            if (isPostCodeVaild) {
                this.setState(
                    {
                        showLoader: true
                    },
                    () => {
                        const url = `${postCodeLookUpApiUrl}?postCode=${zipCode.trim()}`;
                        fetchData(url, {
                            headers: {
                                country: getConfig('locale').substr(3),
                                currencycode: 'GBP',
                                brand: getConfig('brand'),
                                locale: getConfig('locale')
                            }
                        })
                            .then((res) => {
                                if(res == undefined || res.status == '404'){
                                    this.setState(
                                        {
                                            showLoader: false
                                        },
                                        () => {
                                            this.enablingPostCodeError(
                                                postcodeLookupApiErrorTechnicalProblem
                                            );
                                            this.sendAnalyticsData(postcodeLookupApiErrorTechnicalProblem);
                                        }
                                    );

                                }else{
                                let response = res;
                                const isCookieExistForMockResPostCodeLookUpApi = checkCookie(
                                    'mockPostCodeLookUpApi'
                                );
                                const valueOfMockPostCodeLookUpApiAPIcall =
                                    isCookieExistForMockResPostCodeLookUpApi &&
                                    getCookie('mockPostCodeLookUpApi');

                                if (
                                    valueOfMockPostCodeLookUpApiAPIcall ==
                                    'true'
                                ) {
                                    response = JSON.parse(
                                        localStorage.getItem(
                                            'mockDataPostCodeApi'
                                        )
                                    );
                                } else {
                                    response = res;
                                }

                                this.setState(
                                    {
                                        showLoader: false
                                    },
                                    () => {
                                        if (
                                            response.errors &&
                                            response.errors.length
                                        ) {
                                            if (
                                                response.errors[0].code &&
                                                response.errors[0].code ==
                                                '6001'
                                            ) {
                                                this.enablingPostCodeError(
                                                    postcodeLookupApiErrorInvalidPostcode
                                                );
                                                this.sendAnalyticsData(
                                                    postcodeLookupApiErrorInvalidPostcode
                                                );
                                            } else if (
                                                response.httpstatus &&
                                                response.httpstatus == '504'
                                            ) {
                                                this.enablingPostCodeError(
                                                    postcodeLookupApiErrorTimeout
                                                );
                                                this.sendAnalyticsData(
                                                    postcodeLookupApiErrorTimeout
                                                );
                                            } else {
                                                this.enablingPostCodeError(
                                                    postcodeLookupApiErrorTechnicalProblem
                                                );
                                                this.sendAnalyticsData(
                                                    postcodeLookupApiErrorTechnicalProblem
                                                );
                                            }
                                            this.setState({
                                                isSelectAddressVisible: false
                                            });
                                        } else {
                                            const {
                                                ArrayOfPostcode: { Postcode }
                                            } = response;
                                            Postcode.map(
                                                (singleAddress, index) => {
                                                    const {
                                                        search,
                                                        housename,
                                                        address1,
                                                        address2,
                                                        address3,
                                                        county
                                                    } = singleAddress;
                                                    singleAddress[`label`] = `${housename.length !==
                                                        undefined
                                                        ? housename
                                                        : ''
                                                        } ${address1.length !==
                                                            undefined
                                                            ? address1
                                                            : ''
                                                        } ${address2.length !==
                                                            undefined
                                                            ? address2
                                                            : ''
                                                        } ${address3.length !==
                                                            undefined
                                                            ? address3
                                                            : ''
                                                        } ${county.length !==
                                                            undefined
                                                            ? county
                                                            : ''
                                                        }`;
                                                    singleAddress[
                                                        `value`
                                                    ] = `${index}_${search}`;
                                                }
                                            );
                                            //console.log(Postcode);

                                            this.setState({
                                                selectAddressOption: Postcode,
                                                isSelectAddressVisible: true
                                            });
                                        }
                                    
                                    }
                                    
                                );
                            }
                                
                            })
                            .catch((error) => {
                                this.setState(
                                    {
                                        showLoader: false
                                    },
                                    () => {
                                        this.enablingPostCodeError(
                                            postcodeLookupApiErrorTechnicalProblem
                                        );
                                        this.sendAnalyticsData(postcodeLookupApiErrorTechnicalProblem);
                                    }
                                );
                            });
                    }
                );
            } else {
                this.enablingPostCodeError(formFields.zip.error.invalid);
                if (
                    document
                        .getElementsByClassName('zipCode')[0]
                        .classList.contains('show-error')
                ) {
                    this.sendAnalyticsData(formFields.zip.error.invalid);
                }
            }
        }
    };

    render = () => {
        const style = {
            color: '#666',
            textAlign: 'left',
            fontSize: '80%',
            fontFamily: 'PraxisCom-Regular'
        };
        const {
            hasReadMore,
            active,
            termsAndConditionCheckBoxChecked,
            termsAndConditionCheckBoxError,
            isSelectAddressVisible,
            newCartEnteries,
            checkNoMoreCart,
            showDuplicateEvent,
            newProductBooking,
            existingProduct,
            selectedCountry,
            isONHOLD
        } = this.state;
        const {
            formFields,
            accesibilityLabels,
            labels,
            stateValidation
        } = this.props.attributes;
        let termsAndConditionsText = this.state.termsAndConditionsText;
        const {
            shoppingCartModelTitleLabel,
            shoppingCartModelDescLabel,
            shoppingCartModelShortDescLabel,
            shoppingCartModelShortTitleLabel,
            continueCheckoutLabel,
            checkoutLaterLabel,
            closeLabel
        } = this.props.labels;
        const { total } = this.props;
        const titleH2Props = {
            title: labels.checkoutFormTitleLabel,
            description: '',
            type: 'h2',
            showIcon: true
        };
        const isEnGBLocale = getConfig('locale') == 'en_GB' || false;
        let localeString = getConfig('locale', 'en_GB')
            .toLowerCase()
            .split('_')['1'];

        let stateValidationRequired = false;
        let stateValidationList = [];
        let stateList = [];
        // mcsd-1028
        // if (selectedCountry && stateValidation && stateValidation.length) {
        //      stateValidationList = stateValidation.map((item, index) => {
        //         if (Object.keys(item).includes(selectedCountry.toLowerCase()) && Object.values(item)[0]['states']) {
        //             return { selectedindex: index, checkRequired: true };
        //         }
        //         return { selectedindex: index, checkRequired: false };
        //     })
        //     stateValidationList.forEach((entry)=>{
        //         if (entry.checkRequired){
        //             stateValidationRequired = entry.checkRequired;
        //             return stateList = stateValidation[entry.selectedindex][selectedCountry.toLowerCase()].states;
        //         }
        //     })
        // }

        return (
            <div className="checkoutForm" ref={(node) => (this.node = node)}>
                <div className="checkoutForm-wrap">
                    <div className="checkoutForm-header">
                        <TitleH1Mycruise {...titleH2Props} />
                    </div>
                    <div className="checkoutForm-price">
                        <h4>{capitalizeString(labels.payingTotalLabel)}</h4>
                        <CurrencyFormat
                            value={this.state.totalPriceWithTax.value}
                            currencyCode={
                                this.state.totalPriceWithTax.currencyIso
                            }
                            className="currency"
                            decimal={true}
                        />
                        <div className="checkoutForm-img" role="img" aria-label={accesibilityLabels.securedCheckoutLabel ? accesibilityLabels.securedCheckoutLabel : ''} />
                    </div>
                    {this.props.showZeroValueLabel && (<p style={style}> {this.props.zeroValueLabel} </p>)}
                    <div className="checkoutForm-row">
                        <div className="checkoutForm-form-wrap">
                            <div
                                className={
                                    this.state.handleModal === true ||
                                        this.state.handleErrorModal === true
                                        ? 'checkoutForm-wrapper hide'
                                        : 'checkoutForm-wrapper'
                                }
                            >
                                <form
                                    className="checkoutForm-form"
                                    name="checkoutForm"
                                    id="checkoutForm"
                                >
                                    <div className="form-header">
                                        <span className="head">
                                            {labels.billingInfoLabel}
                                        </span>
                                        <span className="desc">
                                            {labels.billingInfoDescLabel}
                                        </span>
                                        <span className="mandatory-label">
                                            {labels.billingInfoMandatoryLabel}
                                        </span>
                                    </div>
                                    <div className="input-formFields">
                                        <div className="inputSelect-group">
                                            <div className="select-small">
                                                {this.hasToolTipLabel(
                                                    formFields.title,
                                                    labels.titleHelpMessageLabel,
                                                    'title'
                                                )}
                                                {this.renderTitleDropdown()}
                                            </div>
                                        </div>
                                        <div className="form-field-row">
                                            <InputField
                                                type="text"
                                                required={true}
                                                id="firstName"
                                                name="firstName"
                                                changeCallback={
                                                    this.handleTextChange
                                                }
                                                placeholder={`${formFields.firstName.label
                                                    }*`}
                                                value={
                                                    this.state.billingInfo
                                                        .firstName
                                                }
                                                regex={regex.name}
                                                validate={this.state.validate}
                                                errorMsg={
                                                    this.state.firstNameError
                                                }
                                                errorCallback={(
                                                    errorState,
                                                    errorMsg
                                                ) =>
                                                    this.handleError(
                                                        'firstName',
                                                        errorState,
                                                        errorMsg
                                                    )
                                                }
                                                showAstrick={true}
                                                errorLabel={accesibilityLabels.clearFeild ? accesibilityLabels.clearFeild : ''}
                                                tooltipLabel={
                                                    labels.firstNameHelpMessageLabel
                                                }
                                            />

                                            <InputField
                                                type="text"
                                                required={true}
                                                id="lastName"
                                                name="lastName"
                                                changeCallback={
                                                    this.handleTextChange
                                                }
                                                placeholder={`${formFields.lastName.label
                                                    }*`}
                                                value={
                                                    this.state.billingInfo.lastName
                                                }
                                                regex={regex.name}
                                                validate={this.state.validate}
                                                errorMsg={this.state.lastNameError}
                                                errorCallback={(
                                                    errorState,
                                                    errorMsg
                                                ) =>
                                                    this.handleError(
                                                        'lastName',
                                                        errorState,
                                                        errorMsg
                                                    )
                                                }
                                                showAstrick={true}
                                                errorLabel={accesibilityLabels.clearFeild ? accesibilityLabels.clearFeild : ''}
                                                tooltipLabel={
                                                    labels.lastNameHelpMessageLabel
                                                }
                                            />
                                        </div>

                                        <div className="form-field-row  zipCode-container">
                                            <InputField
                                                type="text"
                                                required={true}
                                                id="zipCode"
                                                inputClass="zipCode"
                                                name="zipCode"
                                                changeCallback={
                                                    this.handleTextChange
                                                }
                                                placeholder={`${formFields.zip.label
                                                    }*`}
                                                value={
                                                    this.state.billingInfo.zipCode
                                                }
                                                regex={regex.postalCode_generic}
                                                validate={this.state.validate}
                                                errorMsg={this.state.zipCodeError}
                                                errorCallback={(
                                                    errorState,
                                                    errorMsg
                                                ) =>
                                                    this.handleError(
                                                        'zipCode',
                                                        errorState,
                                                        errorMsg
                                                    )
                                                }
                                                showAstrick={true}
                                                errorLabel={accesibilityLabels.clearFeild ? accesibilityLabels.clearFeild : ''}
                                                tooltipLabel={
                                                    labels.zipHelpMessageLabel
                                                }
                                            />
                                            {isEnGBLocale && (
                                                <button
                                                    className="cta-primary button"
                                                    onClick={
                                                        this
                                                            .handleUKAddressClick
                                                    }
                                                >
                                                    {labels.findUkAddressLabel}
                                                </button>
                                            )}
                                        </div>

                                        {isSelectAddressVisible && (
                                            <div className="selectAddress inputSelect-group">
                                                <div className="select-group-container">
                                                    {this.hasToolTipLabel(
                                                        formFields.selectAddress,
                                                        labels.selectAddressHelpMessageLabel,
                                                        'selectAddress'
                                                    )}
                                                    {this.renderAddressDropdown()}
                                                </div>
                                            </div>
                                        )}

                                        <div className="form-field-row">
                                            <InputField
                                                type="text"
                                                required={true}
                                                id="billingAddress"
                                                name="billingAddress"
                                                changeCallback={
                                                    this.handleTextChange
                                                }
                                                placeholder={`${formFields.billingAddress
                                                    .label
                                                    }*`}
                                                validate={this.state.validate}
                                                regex={regex.address}
                                                value={
                                                    this.state.billingInfo
                                                        .billingAddress
                                                }
                                                errorMsg={
                                                    this.state.billingAddressError
                                                }
                                                errorCallback={(
                                                    errorState,
                                                    errorMsg
                                                ) =>
                                                    this.handleError(
                                                        'billingAddress',
                                                        errorState,
                                                        errorMsg
                                                    )
                                                }
                                                showAstrick={true}
                                                errorLabel={accesibilityLabels.clearFeild ? accesibilityLabels.clearFeild : ''}
                                                tooltipLabel={
                                                    labels.billingAddressHelpMessageLabel
                                                }
                                            />

                                            <InputField
                                                type="text"
                                                required={false}
                                                id="billingAddress2"
                                                name="billingAddress2"
                                                changeCallback={
                                                    this.handleTextChange
                                                }
                                                placeholder={
                                                    formFields.billingAddress2.label
                                                }
                                                value={
                                                    this.state.billingInfo
                                                        .billingAddress2
                                                }
                                                validate={this.state.validate}
                                                errorMsg={
                                                    this.state.billingAddressError2
                                                }
                                                regex={regex.address}
                                                errorCallback={(
                                                    errorState,
                                                    errorMsg
                                                ) =>
                                                    this.handleError(
                                                        'billingAddress2',
                                                        errorState,
                                                        errorMsg
                                                    )
                                                }
                                                showAstrick={false}
                                                errorLabel={accesibilityLabels.clearFeild ? accesibilityLabels.clearFeild : ''}
                                                tooltipLabel={
                                                    labels.billingAddress2HelpMessageLabel
                                                }
                                            />
                                        </div>

                                        <div className="form-field-row">
                                            <InputField
                                                type="text"
                                                required={true}
                                                id="city"
                                                name="city"
                                                changeCallback={
                                                    this.handleTextChange
                                                }
                                                placeholder={`${formFields.city.label
                                                    }*`}
                                                value={
                                                    this.state.billingInfo.city
                                                }
                                                regex={regex.city}
                                                validate={this.state.validate}
                                                errorMsg={this.state.cityError}
                                                errorCallback={(
                                                    errorState,
                                                    errorMsg
                                                ) =>
                                                    this.handleError(
                                                        'city',
                                                        errorState,
                                                        errorMsg
                                                    )
                                                }
                                                showAstrick={true}
                                                errorLabel={accesibilityLabels.clearFeild ? accesibilityLabels.clearFeild : ''}
                                                tooltipLabel={
                                                    labels.cityHelpMessageLabel
                                                }
                                            />
                                            {this.state.countyVisible && (
                                                <InputField
                                                    type="text"
                                                    required={localeString === 'au' || localeString === 'us' ? true : false}
                                                    id="county"
                                                    name="county"
                                                    changeCallback={
                                                        this.handleTextChange
                                                    }
                                                    placeholder={localeString === 'au' || localeString === 'us' ?
                                                        `${this.state.countyLabel}*` : `${this.state.countyLabel}`
                                                    }
                                                    value={
                                                        this.state.billingInfo
                                                            .county
                                                    }
                                                    regex={regex.county}
                                                    validate={this.state.validate}
                                                    errorMsg={
                                                        this.state.countyError
                                                    }
                                                    errorCallback={(
                                                        errorState,
                                                        errorMsg
                                                    ) =>
                                                        this.handleError(
                                                            'county',
                                                            errorState,
                                                            errorMsg
                                                        )
                                                    }
                                                    showAstrick={localeString === 'au' || localeString === 'us' ? true : false}
                                                    errorLabel={accesibilityLabels.clearFeild ? accesibilityLabels.clearFeild : ''}
                                                    tooltipLabel={
                                                        labels.countyHelpMessageLabel
                                                    }
                                                    stateListtoCheck={stateList}
                                                    stateValidationRequired={stateValidationRequired}
                                                />
                                            )}
                                        </div>

                                        <div className="country inputSelect-group">
                                            <div className="select-group-container">
                                                {this.hasToolTipLabel(
                                                    formFields.country,
                                                    labels.countryHelpMessageLabel,
                                                    'country'
                                                )}
                                                {this.renderCountryDropdown()}
                                            </div>
                                        </div>

                                        <div className="form-field-row">
                                            <InputField
                                                type="text"
                                                required={true}
                                                id="email"
                                                name="email"
                                                changeCallback={
                                                    this.handleTextChange
                                                }
                                                placeholder={`${formFields.email.label
                                                    }*`}
                                                value={this.state.billingInfo.email}
                                                regex={regex.email}
                                                validate={this.state.validate}
                                                errorMsg={
                                                    this.state.emailAddressError
                                                }
                                                errorCallback={(
                                                    errorState,
                                                    errorMsg
                                                ) =>
                                                    this.handleError(
                                                        'email',
                                                        errorState,
                                                        errorMsg
                                                    )
                                                }
                                                showAstrick={true}
                                                errorLabel={accesibilityLabels.clearFeild ? accesibilityLabels.clearFeild : ''}
                                                tooltipLabel={
                                                    labels.emailAddressHelpMessageLabel
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="checkbox_container">
                                        <li
                                            className="wrap"
                                            key={'pax.paxNumber'}
                                        >
                                            <input
                                                onChange={
                                                    this.handleTermsAndConditionCheckBox
                                                }
                                                type="checkbox"
                                                className={`input-check ${termsAndConditionCheckBoxError
                                                    ? 'error'
                                                    : ''
                                                    }`}
                                                aria-labelledby="variation2-check"
                                                aria-describedby="tandc_err"
                                                name="checkboxPrice"
                                                id="checkbox_term"
                                                checked={
                                                    termsAndConditionCheckBoxChecked
                                                }
                                                onKeyDown={(e) => { e.key == 'space' || e.key == 'Enter' ? this.handleTermsAndConditionCheckBox(e) : null }}
                                            />
                                            <label
                                                htmlFor={`checkbox_term`}
                                                className={`checkbox-label `}
                                            >
                                                <span>
                                                    {`${labels.termsAndConditionsMessageLabel
                                                        } `}
                                                </span>
                                                <span
                                                    onClick={() => {
                                                        const obj = {
                                                            componentName: this.props.type,
                                                            linkType: 'o',
                                                            linkText: labels.termsAndConditionsLinkLabel,
                                                            linkPageName: getConfig(
                                                                'pageName'
                                                            )
                                                        };
                                                        analytics.customClicks(
                                                            obj
                                                        );
                                                        const pdfUrl = getConfig(
                                                            'termsAndConditionsPdfPath'
                                                        );
                                                        window.open(
                                                            pdfUrl,
                                                            '_blank'
                                                        );
                                                    }}
                                                >
                                                    <a href="#checkoutForm">
                                                        {
                                                            labels.termsAndConditionsLinkLabel
                                                        }
                                                    </a>
                                                </span>
                                            </label>
                                            {termsAndConditionCheckBoxError && (
                                                <span
                                                    id="tandc_err"
                                                    className="error-label show-label"
                                                    ref="checkbox 1"
                                                >
                                                    {` ${labels.termsAndConditionsErrorLabel
                                                        } `}
                                                </span>
                                            )}
                                        </li>
                                    </div>
                                    <div className="submit-wrap cf input-formFields">
                                        {/* <button data-toggle="modal" data-target="#react-aria-modal-dialog" */}
                                        <button
                                            type="button"
                                            className="cta-primary"
                                            data-clicktype={`general`}
                                            data-linktext={`${labels.completePaymentButtonLabel
                                                }`}
                                            onClick={this.enableSubmitButton}
                                        >
                                            {labels.completePaymentButtonLabel}
                                        </button>

                                        <button
                                            type="button"
                                            className="cta-secondary"
                                            onClick={(e) => this.props.cancel()}
                                        >
                                            {labels.cancelLabel}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {termsAndConditionsText && (
                    <Modal
                        mounted={this.state.showModalTerms}
                        onExit={() => this.handleModal(false)}
                        contentLabel="Terms and conditions"
                        ctaType={this.props.ctaType}
                        underlayClass="termsAndCondition-modal"
                    >
                        <a href="#"></a>
                        <div
                            dangerouslySetInnerHTML={{
                                __html: termsAndConditionsText
                            }}
                            className="disclaimer-text" />

                        <div className="modal-alert boldText" >
                            By clicking 'Pay now' you are accepting these terms and conditions,and completing your purchase
                        </div>
                        <div className="modal-btns">
                            <button
                                className="cta-secondary"
                                onClick={() => this.handleModal(false)}
                            >
                                {labels.cancelLabel}
                            </button>
                            <button

                                className={`cta-primary ${this.state.disabled
                                    ? 'cta-disabled'
                                    : ''
                                    }  `}
                                onClick={() => this.requestKeys()}
                            >
                                {/* <button
                                className="cta-primary"
                                onClick={() => this.finaliseOrder()}
                            > */}
                                {labels.confirmCtaLabel}
                            </button>
                        </div>
                    </Modal>
                )}
                {showDuplicateEvent && (
                    <DuplicateEventModal
                        labels={this.props.labels}
                        showDuplicateEvent={showDuplicateEvent}
                        newProductBooking={newProductBooking}
                        existingProduct={existingProduct}
                        handleModalExpired={this.handleModalExpired}
                        handleContinueCheckout={this.handleContinueCheckout}
                        checkNoMoreCart={checkNoMoreCart}
                        isONHOLD={isONHOLD}
                    />
                )}
                {this.state.showModalExpired && (
                    <Modal
                        mounted={this.state.showModalExpired}
                        onExit={() =>
                            this.handleModalExpired(
                                checkNoMoreCart ? 'close' : 'continue'
                            )
                        }
                        contentLabel="Expired Error"
                        ctaType={this.props.ctaType}
                        sessionClass="cart_modal"
                    >
                        <div className="overlay-text">
                            <div className="cart_title">
                                <h5>{shoppingCartModelTitleLabel}</h5>
                            </div>
                            <div className="cart_desc">
                                <span>{shoppingCartModelDescLabel}</span>
                            </div>
                            {newCartEnteries &&
                                newCartEnteries.map((item) => {
                                    return (
                                        <div className="item_container">
                                            <div className="item_title">
                                                {item[0].product.name}
                                            </div>
                                            {
                                                item[0].product.attributes.startDateTime
                                                    && <div className="item_details">
                                                        {`${moment(
                                                            item[0].product.attributes
                                                                .startDateTime, "YYYYMMDDhhmmss"
                                                        ).format('HH:mm')} | ${moment(
                                                            item[0].product.attributes
                                                                .startDateTime, "YYYYMMDDhhmmss"
                                                        ).format(
                                                            'ddd Do MMM YYYY'
                                                        )}`}{item[0].product.productType == 'XDINING' ? `| ${item[0].noOfGuests} guests` : null}
                                                    </div>
                                            }
                                            
                                        </div>
                                    );
                                })}
                            <div className="lower_desc">
                                {
                                    checkNoMoreCart
                                            ? shoppingCartModelShortDescLabel
                                            : shoppingCartModelShortTitleLabel
                                }
                            </div>
                            {!checkNoMoreCart && (
                                <div className={`popup__cta`}>
                                    <a
                                        href="JavaScript:void(0)"
                                        onClick={() =>
                                            this.handleContinueCheckout(
                                                'checkout'
                                            )
                                        }
                                        data-linktext={'popup-close'}
                                        className={`cta-primary-light-blue`}
                                    >
                                        {continueCheckoutLabel}
                                    </a>
                                    <a
                                        href="JavaScript:void(0)"
                                        onClick={() =>
                                            this.handleModalExpired('continue')
                                        }
                                        data-linktext={'popup-close'}
                                        className={`cta-primary`}
                                    >
                                        {checkoutLaterLabel}
                                    </a>
                                </div>
                            )}
                            {checkNoMoreCart && (
                                <div className={`popup__cta_nomore`}>
                                    <a
                                        href="JavaScript:void(0)"
                                        onClick={() =>
                                            this.handleModalExpired('close')
                                        }
                                        data-linktext={'popup-close'}
                                        className={`cta-primary`}
                                    >
                                        {closeLabel}
                                    </a>
                                </div>
                            )}
                        </div>
                    </Modal>
                )}
                {this.state.showModalError && (
                    <Modal
                        mounted={this.state.showModalError}
                        onExit={() => this.handleModalError()}
                        contentLabel="Error modal"
                        ctaType={this.props.ctaType}
                        underlayClass="expired-modal"
                    >
                        <div className="">
                            <h4>{this.state.genericErrorLabel}</h4>
                        </div>

                        <div className="modal-btns">
                            <button
                                className="cta-primary"
                                onClick={() => this.handleModalError()}
                            >
                                {this.state.capturedAmountLabel ? labels.capturedAmountMismatchErrorLabel : labels.tryAgainLabel}
                            </button>
                        </div>
                    </Modal>
                )}
                {this.state.showThrobber && (
                    <div className="throbberOverlay">
                        <Loader show={this.state.showThrobber} />
                        <p className="throbberOverlay__text">
                            We are processing your payment. Please do not
                            refresh the page.
                        </p>
                    </div>
                )}
                {this.state.showLoader && (
                    <div className="throbberOverlay">
                        <Loader show={this.state.showLoader} />
                        <p className="throbberOverlay__text" />
                    </div>
                )}
            </div>     
        );
    };
}

paymentMycruise.propTypes = {};

export default paymentMycruise;
