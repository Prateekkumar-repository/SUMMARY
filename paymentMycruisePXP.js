'use strict';

import React from 'react';
// import jsencrypt from 'jsencrypt';
import InputField from '../commons/CUK/inputField';
import { regex } from '../../library/js/config/regex';
import SelectField from '../commons/CUK/selectField';
import CurrencyFormat from '../commons/CUK/currencyFormat';
import fetchData from '../commons/CUK/fetch-data';
import { plainDateFormat } from '../commons/CUK/dateFormat';
import Modal from '../commons/CUK/modal';
import Loader from '../commons/CUK/loader';
import SessionStorage from '../commons/CUK/session-storage';
import ReadMoreOrLess from '../commons/CUK/readMoreOrLess';
import analytics from '../commons/CUK/analytics';
import { getConfig, capitalizeString } from '../commons/CUK/utilities';
import DuplicateEventModal from './duplicateEventModal';

const CARDTYPES = [
    {
        name: 'amex',
        pattern: regex.amex,
        cvvPattern: regex.fourDigitCvv,
        validLength: 15,
        code: 'AMX'
    },
    {
        name: 'discover',
        pattern: regex.discover,
        cvvPattern: regex.threeDigitCvv,
        validLength: 16,
        code: 'DSC'
    },
    {
        name: 'master',
        pattern: regex.master,
        cvvPattern: regex.threeDigitCvv,
        validLength: 16,
        code: 'MSC'
    },
    {
        name: 'visa',
        pattern: regex.visa,
        cvvPattern: regex.threeDigitCvv,
        validLength: 16,
        code: 'VIS'
    },
    {
        name: 'diners',
        pattern: regex.diners,
        cvvPattern: regex.threeDigitCvv,
        validLength: 14,
        code: 'DIN'
    }
];
class paymentMycruisePXP extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            totalPriceWithTax: this.props.total,
            totalLoyaltyDiscount: this.props.totalLoyaltyDiscount,
            firstNameError: '',
            lastNameError: '',
            cityError: '',
            countyError: '',
            numberError: '',
            billingAddressError: '',
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
            creditCardType: '',
            creditCardCode: '',
            showModalTerms: false,
            showThrobber: false,
            monthIsNotValid: false,
            hasReadMore: true,
            active: false,
            showContentForTerm: '',
            capturedAmountLabel: false,
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
                number: '',
                billingAddress2: '',
                zipCode: '',
                email: '',
                county: ''
            },
            creditCardInfo: {
                creditCardNumber: '',
                creditCardSecurityCode: '',
                creditCardExpirationDate: {
                    month: {
                        value: '',
                        title: ''
                    },
                    year: {
                        value: '',
                        title: ''
                    }
                }
            },
            showDuplicateEvent: false,
            newProductBooking: [],
            existingProduct: []
        };

        let acceptedCards = this.props.acceptedCards;

        this.cardTypes = [];
        acceptedCards.map((acceptedCard, index) => {
            let acceptedCardInfo = CARDTYPES.filter((card) => {
                return card.name === acceptedCard;
            });

            this.cardTypes.push(acceptedCardInfo[0]);
        });
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
        this.node.scrollIntoView({ block: 'start', behavior: 'smooth' });
        window.scrollTo(0, 0);
        // pre populate the field if possible
        const { formFields: { country } } = this.props.attributes
        this.fetchCruiseSummary()
            .then((cruiseSummary) => {
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
                            helpers.zipCode = postCode.$ ? postCode.$ : '';
                            helpers.city = cityNameText ? cityNameText : '';
                            helpers.email = passenger.individual.contactPoints[0].emailAddress.fullAddressText;
                            helpers.number = buildingNameText ? buildingNameText : '';
                            countryCode.$ && country && country.options.forEach((singleCountry) => {
                                if (singleCountry.hasOwnProperty(countryCode.$)) {
                                    helpers.country.value = countryCode.$;
                                    helpers.country.title = singleCountry[countryCode.$].value;
                                }
                            })
                            if (countyNameText.trim() !== '') {
                                countyVisible = true;
                            }
                        }
                    })
                }

                this.setState({
                    billingInfo: helpers,
                    countyVisible
                });
            })
            .catch((err) => { });

    }

    fetchCruiseSummary = () => {
        let { mycruiseSummaryApiV1 = `${window.location.origin}/api-mc/mc-getCruiseSummary/v1` } = this.props;
        const apikeyMycruise = getConfig('apikeyMycruise', '');
        const userData = SessionStorage.getItem('userData');
        const {
            bookingRef,
            companyCode,
            customer: { firstName, lastName },
            countryCode
        } = userData;
        const url = `${mycruiseSummaryApiV1}?bookingRef=${bookingRef}&firstName=${firstName}&lastName=${lastName}&shipCode=${companyCode}&countryCode=${countryCode}`;
        return fetchData(url, {
            headers: {
                'X-Source-Identity-Token-0': apikeyMycruise
            }
        });
    };

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
            countryError = {},
            titleError = {},
            zipCodeError = {},
            emailAddressError = {},
            creditCardNumberError = {},
            creditCardSecurityCodeError = {},
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

        titleError.empty = formFields.title.error.empty;

        countryError.empty = formFields.country.error.empty;
        countryError.invalid = formFields.country.error.invalid;

        zipCodeError.empty = formFields.zip.error.empty;
        zipCodeError.invalid = formFields.zip.error.invalid;

        emailAddressError.empty = formFields.email.error.empty;
        emailAddressError.invalid = formFields.email.error.invalid;

        creditCardNumberError.empty = formFields.creditCard.error.empty;
        creditCardNumberError.invalid = formFields.creditCard.error.invalid;

        yearsError.empty = formFields.year.error.empty;

        monthError.empty = formFields.month.error.empty;
        monthError.invalid = formFields.month.error.invalid;

        creditCardSecurityCodeError.empty = formFields.securityCode.error.empty;
        creditCardSecurityCodeError.invalid =
            formFields.securityCode.error.invalid;

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
            countryError: countryError,
            titleError: titleError,
            zipCodeError: zipCodeError,
            emailAddressError: emailAddressError,
            creditCardNumberError: creditCardNumberError,
            creditCardSecurityCodeError: creditCardSecurityCodeError
        });
    };

    renderYearDropdown() {
        const selectFieldYears = (
            <SelectField
                selectClassName="select-year"
                name="year"
                label={this.state.yearsRef.label}
                defaultValue={this.state.yearsRef.label}
                value={
                    this.state.creditCardInfo.creditCardExpirationDate.year
                        .value
                }
                title={
                    this.state.creditCardInfo.creditCardExpirationDate.year
                        .title
                }
                options={this.state.yearsRef.options}
                showLabel={false}
                additionalError={false}
                errorMsg={this.state.yearsError}
                blurCallBack={this.enableSubmitButton}
                changeCallback={(name, value, title, event) =>
                    this.handleSelectBoxCreditChange(name, value, title, event)
                }
                errorCallback={(errorState, errorMsg) =>
                    this.handleError('selectBox', errorState, errorMsg)
                }
            />
        );

        return selectFieldYears;
    }
    renderMonthDropdown() {
        const selectFieldMonths = (
            <SelectField
                selectClassName="select-month"
                name="month"
                label={this.state.monthsRef.label}
                defaultValue={this.state.monthsRef.label}
                value={
                    this.state.creditCardInfo.creditCardExpirationDate.month
                        .value
                }
                title={
                    this.state.creditCardInfo.creditCardExpirationDate.month
                        .title
                }
                options={this.state.monthsRef.options}
                showLabel={false}
                additionalError={this.state.monthIsNotValid}
                errorMsg={this.state.monthError}
                changeCallback={(name, value, title, event) =>
                    this.handleSelectBoxCreditChange(name, value, title, event)
                }
                errorCallback={(errorState, errorMsg) =>
                    this.handleError('selectBox', errorState, errorMsg)
                }
            />
        );

        return selectFieldMonths;
    }
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
                blurCallBack={this.enableSubmitButton}
                changeCallback={(name, value, title, event) =>
                    this.handleSelectBoxChange(name, value, title, event)
                }
                errorCallback={(errorState, errorMsg) =>
                    this.handleError('selectBox', errorState, errorMsg)
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
                blurCallBack={this.enableSubmitButton}
                changeCallback={(name, value, title, event) =>
                    this.handleSelectBoxChange(name, value, title, event)
                }
                errorCallback={(errorState, errorMsg) =>
                    this.handleError('selectBox', errorState, errorMsg)
                }
            />
        );

        return selectFieldCountry;
    }
    handleEnterKeyPress = (e) => {
        if (e.key === 'Enter') {
            this.handleSubmit();
        }
    };
    handleError = (stateKey, errorState, errorMsg) => {
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
    };
    handleTextChange = (evt) => {
        let newSelected = evt.target.value;
        let copyOfState = Object.assign({}, this.state.billingInfo);

        copyOfState[evt.target.name] = newSelected;
        this.setState({ billingInfo: copyOfState });

    };
    handleCreditChange = (evt) => {
        // check if billiongInfo have been completed
        let newArray = Object.keys(this.state.billingInfo).filter(
            (field, index) => {
                if (field === 'billingAddress2' || field === 'county') {
                    return false;
                }
                if (typeof this.state.billingInfo[field] === 'string') {
                    return this.state.billingInfo[field] === '';
                } else {
                    return this.state.billingInfo[field].value === '';
                }
            }
        );

        if (newArray.length > 0) {
            evt.preventDefault();
            evt.stopPropagation();
            evt.nativeEvent.stopImmediatePropagation();
            // let id = newArray[0];

            newArray.map((element, index) => {
                window.setTimeout(function () {
                    typeof document !== 'undefined' && document.getElementById(element).focus();
                    typeof document !== 'undefined' && document.getElementById(element).blur();
                }, 0);
            });

            // document.getElementById(id).focus();
            // window.setTimeout(function () {
            //     document.getElementById(id).focus();
            //     document.getElementById(id).blur();
            // }, 0);
            this.node.scrollIntoView({ block: 'start', behavior: 'smooth' });

            return false;
        } else {
            let newSelected = evt.target.value;
            let copyOfState = Object.assign({}, this.state.creditCardInfo);

            copyOfState[evt.target.name] = newSelected;
            this.setState({
                creditCardInfo: copyOfState
            });

            return true;
        }
    };
    handleSelectBoxChange = (name, value, title, event) => {
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
    handleSelectBoxCreditChange = (name, value, title, event) => {
        let currentDate = new Date();
        let currentYear = currentDate.getFullYear();
        let currentMonth = currentDate.getMonth();
        let monthVal = this.state.creditCardInfo.creditCardExpirationDate.month
            .value;

        // verify if the date is valid
        if (name === 'month') {
            if (
                String(
                    this.state.creditCardInfo.creditCardExpirationDate.year
                        .value
                ) === String(currentYear)
            ) {
                if (Math.floor(value) < currentMonth + 1) {
                    // show error
                    this.setState(
                        {
                            monthIsNotValid: true
                        },
                        () => {
                            let select = typeof document !== 'undefined' && document.getElementsByClassName(
                                'select-month'
                            )[0];
                            let error = select.getElementsByClassName(
                                'error-msg'
                            )[0];

                            error.innerHTML = this.state.monthError.invalid;
                        }
                    );
                } else {
                    this.setState({
                        monthIsNotValid: false
                    });
                }
            } else {
                this.setState({
                    monthIsNotValid: false
                });
            }
        }

        if (name === 'year') {
            if (String(value) === String(currentYear)) {
                if (monthVal !== '' && monthVal < currentMonth) {
                    // show error

                    this.setState(
                        {
                            monthIsNotValid: true
                        },
                        () => {
                            let select = typeof document !== 'undefined' && document.getElementsByClassName(
                                'select-month'
                            )[0];
                            let error = select.getElementsByClassName(
                                'error-msg'
                            )[0];

                            error.innerHTML = this.state.monthError.invalid;
                        }
                    );
                } else {
                    this.setState({
                        monthIsNotValid: false
                    });
                }
            } else {
                this.setState({
                    monthIsNotValid: false
                });
            }
        }

        let newSelected = {
            value: value,
            title: title
        };

        let copyOfState = Object.assign({}, this.state.creditCardInfo);

        copyOfState.creditCardExpirationDate[name] = newSelected;

        this.setState(
            {
                creditCardInfo: copyOfState
            },
            () => this.enableSubmitButton()
        );
    };
    /**
     * If the country has states parameters, show the county/state input field
     * @param {object} value option selected in country
     */
    changeCountyLabel = (value) => {
        let selectedCountry = this.state.countryRef.options.filter(
            (x, index) => x[value] !== undefined
        );

        let selected = selectedCountry[0][value];
        let states = selected.states;

        if (states !== undefined && states !== null) {
            this.setState({
                countyVisible: true,
                countyLabel: selected.regionLabel
            });
        } else {
            this.setState({
                countyVisible: false
            });
        }
    };
    getCardType = (cardNumber) => {
        const regex = {
            visa: /^4/,
            master: /^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/,
            amex: /^(34)|^(37)/,
            discover: /^(6011)|^(622(1(2[6-9]|[3-9][0-9])|[2-8][0-9]{2}|9([01][0-9]|2[0-5])))|^(64[4-9])|^65/,
            diners: /^3[0689]/
        };
        if (regex.visa.test(cardNumber)) {
            return 'visa';
        } else if (regex.master.test(cardNumber)) {
            return 'master';
        } else if (regex.amex.test(cardNumber)) {
            return 'amex';
        } else if (regex.discover.test(cardNumber)) {
            return 'discover';
        } else if (regex.diners.test(cardNumber)) {
            return 'diners';
        } else {
            return 'invalid';
        }
    };

    /**
     * 3 parameters for card validation:
     * - to be one of the accepted card type
     * - to have the right length
     * - to respect the Luhn algorithm
     * @param {object} evt input compilation event
     * @returns {boolean} if the card is valid
     */
    validateCard = (evt) => {
        let newSelected = evt.target.value;
        var string = newSelected.toString();
        //let sumOfDigits = 0;
        let { acceptedCards } = this.props;

        if (string.length % 5 === 0) {
            string = string.replace(/\s/g, '');
            evt.target.value = string.replace(/(.{4})/g, '$1 ');
        }
        if (this.handleCreditChange(evt)) {
            // regex carte supportate
            string = string.replace(/\s/g, '');
            // for (let l = 0; l < this.cardTypes.length; l++) {
            //     let card = this.cardTypes[l];
            let cardType = this.getCardType(newSelected);
            // if (card.pattern.test(newSelected)) {
            let cardArray = CARDTYPES.filter((cardItem, index) => {
                return cardItem.name === cardType;
            });

            let card = cardArray[0];
            let isAccepted = acceptedCards.filter((cardItem, index) => {
                return cardItem === cardType;
            });
            if (isAccepted.length === 0) {
                let parent = typeof document !== 'undefined' && document.getElementById('creditCardNumber')
                    .parentNode.parentNode;
                parent.classList.add('show-error');
                parent
                    .getElementsByClassisFormSubmittedName('error-msg')[0]
                    .classList.add('show-msg');
                parent.getElementsByClassName(
                    'error-msg'
                )[0].innerHTML = this.state.creditCardNumberError.invalid;
            }
            if (cardType) {
                this.setState({
                    creditCardType: cardType,
                    creditCardCode: card.code
                });
                let parent = typeof document !== 'undefined' && document.getElementById('creditCardNumber')
                    .parentNode.parentNode;

                // verify the length
                if (
                    string.length < card.validLength ||
                    string.length > card.validLength
                ) {
                    // show error card
                    parent.classList.add('show-error');
                    parent
                        .getElementsByClassName('error-msg')[0]
                        .classList.add('show-msg');
                    parent.getElementsByClassName(
                        'error-msg'
                    )[0].innerHTML = this.state.creditCardNumberError.invalid;

                    return false;
                } else {
                    parent.classList.remove('show-error');
                    parent
                        .getElementsByClassName('error-msg')[0]
                        .classList.remove('show-msg');
                    parent.getElementsByClassName('error-msg')[0].innerHTML =
                        '';
                }
                /* Luhn Algorithm
                for (let i = 1; i < string.length; i++) {
                    let digitToSum = Math.floor(
                        (parseInt(string) / Math.pow(10, i - 1)) % 10
                    );

                    sumOfDigits = Math.floor(sumOfDigits + digitToSum);
                    i++;

                    // double the value of every second digit
                    let doubleDigit =
                        Math.floor(
                            (parseInt(string) / Math.pow(10, i - 1)) % 10
                        ) * 2;

                    if (doubleDigit > 9) {
                        doubleDigit = Math.floor(doubleDigit - 9);
                    }
                    // Take the sum of all the digits.
                    sumOfDigits = Math.floor(sumOfDigits + doubleDigit);
                }
                */

                let nCheck = 0, nDigit = 0, bEven = false;
                string = string.replace(/\D/g, "");

                for (let n = string.length - 1; n >= 0; n--) {
                    let cDigit = string.charAt(n),
                        nDigit = parseInt(cDigit, 10);

                    if (bEven) {
                        if ((nDigit *= 2) > 9) nDigit -= 9;
                    }

                    nCheck += nDigit;
                    bEven = !bEven;
                }

                let isValid = (nCheck % 10) == 0;


                // If the total modulo 10 is equal to 0 (if the total ends in zero) then the number is valid
                if (isValid) {
                    parent.classList.remove('show-error');
                    parent
                        .getElementsByClassName('error-msg')[0]
                        .classList.remove('show-msg');
                    parent.getElementsByClassName('error-msg')[0].innerHTML =
                        '';
                } else {
                    // show error card
                    parent.classList.add('show-error');
                    parent
                        .getElementsByClassName('error-msg')[0]
                        .classList.add('show-msg');
                    parent.getElementsByClassName(
                        'error-msg'
                    )[0].innerHTML = this.state.creditCardNumberError.invalid;
                }
            }
            // else {
            //     this.setState({
            //         creditCardType: 'visa'
            //     });
            // }
            // }
        } else {
            evt.preventDefault();
            evt.stopPropagation();
            evt.nativeEvent.stopImmediatePropagation();
        }
    };
    /**
     * Payment process first step: check with stock reservation API to check if products still availables
     */
    handleSubmit = () => {
        // verify if all products in the cart are still available
        // /{baseSiteId}/users/<encryptId>/carts/<cartId>/reserveStock
        // POST
        // Query Params fields = level of detail (OOTB for OCC calls, all data will be returned regardless for this interface).
        // {
        //     "reservationMode": "RESERVE"
        // }
        const analyticsParam = {
            "event": "event310"
        }
        analytics.customClicks(analyticsParam);
        const { urls } = this.props.attributes.services;
        const errors = this.props.errorLabels.reserveHybris;
        const errors400 = this.props.errorLabels.errors400;
        let url = urls.reserveStockApi;
        let header = SessionStorage.getItem('header');
        let apikey =
            typeof window !== 'undefined' ? window.configs.apikeyMycruise : '';
        const obj = JSON.stringify({
            reservationMode: 'RESERVE'
        });
        if (typeof document !== 'undefined' && document.getElementsByClassName('show-msg').length === 0) {
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
                if (res.status) {
                    let error =
                        parseInt(res.status) === 400
                            ? errors400[res.message]
                            : errors[res.status];
                    this.setState({
                        showThrobber: false,
                        showModalError: true,
                        genericErrorLabel: error
                    });
                } else if (res.errors && res.errors.length > 0) {
                    const { labels } = this.props;
                    const result = res.errors.every(
                        (e) =>
                            (e.reason === 'R10037' ||
                                e.reason === 'R10026') &&
                            e.startDateTime != undefined &&
                            e.reason != undefined
                    );

                    let cartEntries = [];
                    res.cart.entries &&
                        res.cart.entries.map((item) => {
                            if (
                                (item.product.productType === 'XDINING' ||
                                    item.product.productType ===
                                        'ENTERTAINMENT') &&
                                item.status === 'INACTIVE'
                            ) {
                                cartEntries.push(item);
                            }
                        });
                    this.setState({
                        newCart: res,
                        newCartEnteries: cartEntries,
                        checkNoMoreCart:
                            res.cart.entries.length === cartEntries.length
                                ? true
                                : false
                    });

                    if (!result) {
                        this.setState({
                            showModalExpired: true
                        });
                    } else {
                        const listOfNewProduct = [];
                        const listOfExistingProduct = [];
                        res.errors.map((item) => {
                            res.cart.entries.map((e) => {
                                if (item.entryIndex === e.entryNumber) {
                                    const existingProduct = {
                                        name: item.productName,
                                        dateTime: `${moment(
                                            item.startDateTime,
                                            'YYYYMMDDhhmmss'
                                        ).format(
                                            'HH:mm | ddd Do MMM YYYY'
                                        )} | ${item.noOfGuest} ${
                                            labels.guestsLabel
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
                                        )} | ${e.noOfGuests} ${
                                            labels.guestsLabel
                                        }`
                                    };

                                    listOfNewProduct.push(newProduct);
                                    listOfExistingProduct.push(
                                        existingProduct
                                    );
                                }
                            });
                        });
                        this.setState({
                            showDuplicateEvent: true,
                            newProductBooking: listOfNewProduct,
                            existingProduct: listOfExistingProduct
                        });
                    }
                } else {
                    // no errors, continue to acceptance of terms and condition
                    const clientTransactionId = res.cart.clientTransactionId;
                    SessionStorage.setItem('clientTransactionId', clientTransactionId);
                    
                    this.setState({
                        showModalTerms: true,
                        disabled: false
                    });
                    this.gettermsAndConditionsText();
                }
            });
            // noErrors = true;
        }
    };

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
            this.requestCancellation(i, newCartEnteries[i].groupID, value);
        }
    };

    requestCancellation = (v, groupID, value) => {
        const { services } = this.props;
        const { newCartEnteries, newCart } = this.state;
        const { updateCartApi } = services.urls;

        const header = SessionStorage.getItem('header');
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
                    showModalExpired: false
                });
            } else if (
                v == newCartEnteries.length - 1 &&
                value === 'checkout'
            ) {
                this.requestKeys();
            }
        });
    }

    handleModalError() {
        analytics.clickTracking(this);
        this.setState({
            showModalError: false,
            capturedAmountLabel: false
        });
        // this.props.handleReserveStockError(this.state.newCart.cart);
    }

    handleModal(status) {
        analytics.clickTracking(this)
        this.setState({
            showModalTerms: status
        });
    }

    requestKeys = (pubKey) => {
        const analyticsParam = {
            event: "event311"
        }
        analytics.customClicks(analyticsParam)
        const { keysServlet } = this.props.attributes;
        // let url = urls.encryptionKeyApi;
        const header = SessionStorage.getItem('header');

        this.setState({
            showThrobber: true,
            disabled: true
        });

        fetchData(keysServlet, {
            method: 'GET'
        }).then((res) => {
            let expirationDayApi = res.api.expiresAt;
            let expirationEncryptApi = res.encryption.expiresAt;
            let todaysDate = new Date();

            if (
                expirationDayApi <= plainDateFormat(todaysDate) &&
                expirationEncryptApi <= plainDateFormat(todaysDate)
            ) {
                // redo the request
                // TODO: check if works
                this.requestKeys();
            } else {
                let apiKey = res.api.publicKey;
                let pubKey = res.encryption.publicKey;
                let encryptId = res.encryption.id;
                this.encryptData(pubKey, apiKey, encryptId);
                this.setState({
                    encryptId: encryptId
                });
            }
        });
    };

    /**
     * Payment process second step: encrypt card number and cvv
     * @param {String} pubKey public key for encrypting
     */
    encryptData = (pubKey, apiKey, encryptId) => {
        let cardNumber = this.state.creditCardInfo.creditCardNumber.toString();
        let cvv = this.state.creditCardInfo.creditCardSecurityCode;

        var crypt = new JSEncrypt();

        cardNumber = cardNumber.replace(/\s/g, '');
        crypt.setPublicKey(pubKey);
        crypt.default_key_size = 2048;

        // encrypt card number
        var cryptedCardNumber = crypt.encrypt(cardNumber);
        var cryptedCvv = crypt.encrypt(cvv);

        this.setState({
            cryptedCardNumber: cryptedCardNumber,
            cryptedCvv: cryptedCvv
        });

        this.createClientSystemTokenId(apiKey, encryptId);
    };
    /**
     * Payment process third step: create transaction ID
     */
    createClientSystemTokenId = (apiKey, encryptId) => {
        // [booking_reference_id]-[booking_user_sequenceNumber]-[YYYYMMddHHmmSSsss]
        const userData = SessionStorage.getItem('userData');
        let bookingReference = userData.bookingRef;
        // let sequenceNumber = userData.customer.paxNumber;
        let sequenceNumber = '1';
        let date = plainDateFormat(new Date(), 'YYYYMMDDHHMMSS');
        // let clientSystemTokenId = `${bookingReference}-${sequenceNumber}-${date}`;
		let clientSystemTokenId = SessionStorage.getItem('clientTransactionId');                

        this.requestSUT(clientSystemTokenId, apiKey, encryptId);
    };
    /**
     * Payment process fourth step: request SUT to pxp
     */
    requestSUT = (clientSystemTokenId, apiKey, encryptId) => {//YD calling token api
        let { urls } = this.props.attributes.services;
        let { requestSUTApi } = urls;
        let obj = {};
        let encryptionType = 'rsaTwoZeroFourEight';
        let { merchantId, storeId, userId } = this.props.attributes;
        let cardNumber = this.state.creditCardInfo.creditCardNumber.toString();
        const errors = this.props.errorLabels.pxp;

        cardNumber = cardNumber.replace(/\s/g, '');
        obj.merchantId = merchantId;
        obj.clientSystemTokenId = clientSystemTokenId;
        obj.details = {};
        obj.details['cardNumber'] = this.state.cryptedCardNumber;
        // obj.details['cardNumber'] = cardNumber;
        obj.details['cardExpiryMonth'] = parseInt(
            this.state.creditCardInfo.creditCardExpirationDate.month.value
        );
        obj.details['cardExpiryYear'] = parseInt(
            this.state.creditCardInfo.creditCardExpirationDate.year.value
        );
        obj.encryptionDetails = {};
        let helper = {};
        helper.encryptionType = encryptionType;
        helper.encryptionId = encryptId;
        obj.encryptionDetails = helper;
        // fetchData(requestSUTApi, {
        //     method: 'POST',
        //     body: JSON.stringify(obj),
        //     headers: {
        //         'Content-Type': 'application/json',
        //         Authorization: 'PublicApiKey ' + apiKey
        //     }
        //     // mode: 'cors'
        // })
        fetch(requestSUTApi, {
            method: 'POST',
            body: JSON.stringify(obj),
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'PublicApiKey ' + apiKey
            }
        })
            .then((res) => res.json())
            .then((res) => {
                this.setState({
                    SUTId: res.Id
                });
                this.createTransactionId();
            })
            .catch((error) => {
                this.setState({
                    showThrobber: false,
                    showModalError: true,
                    genericErrorLabel: errors[error]
                });
            });
    };
    /**
     * Payment process  step: create transaction ID
     */
    createTransactionId = () => {
        // [booking_reference_id]-[booking_user_sequenceNumber]-[YYYYMMddHHmmSSsss]
        const userData = SessionStorage.getItem('userData');
        let bookingReference = userData.bookingRef;
        // let sequenceNumber = userData.customer.paxNumber;
        let sequenceNumber = '1';
        let date = plainDateFormat(new Date(), 'YYYYMMDDHHMMSS');
        // let transactionId = `${bookingReference}-${sequenceNumber}-${date}`;
		let transactionId = SessionStorage.getItem('clientTransactionId');                

        this.createTransaction(transactionId);
        // return transactionId;
    };
    /**
     * Payment process fourth step: create 'post' transaction to pxp
     * @param {String} transactionId transaction id created fe side
     */
    createTransaction = (transactionId) => {
        const { urls } = this.props.attributes.services;
        const errorsTransaction = this.props.errorLabels.transaction;
        const errorsPxp = this.props.errorLabels.pxp;
        let url = this.props.attributes.servletTransaction;
        let { merchantId, storeId, userId } = this.props.attributes;
        let obj = {};
        obj.merchantId = merchantId;
        obj.storeId = storeId;
        obj.clientSystemTransactionId = transactionId;

        const header = SessionStorage.getItem('header');
        const { agent } = header;
        if (typeof agent !== 'undefined') {
            if ((agent.agentType && agent.agentType === 'customerServiceAgent') || (agent.agentType && agent.agentType === 'travelAgencyAgent')) {
                obj.type = 'mailorder.sale';
            }
        }
        else {
            obj.type = 'ecom.sale';
        }


        obj.amount = this.props.total.value;

        if (this.props.total.value === 0) {
            obj.type = 'ecom.accountVerification';
            delete obj.amount;
        }

        obj.currencyCode = this.props.total.currencyIso;
        obj.encryptionDetails = {};
        let helper = {};
        let encryptionType = 'rsaTwoZeroFourEight';

        helper.encryptionType = encryptionType;
        helper.encryptionId = this.state.encryptId;
        obj.encryptionDetails = helper;
        obj.accountDetails = {};
        obj.accountDetails['tokenId'] = this.state.SUTId;
        obj.userId = userId;
        obj.cardVerificationDetails = {};
        obj.cardVerificationDetails[
            'cardVerificationValue'
        ] = this.state.cryptedCvv;
        obj.addressVerificationDetails = {};
        obj.addressVerificationDetails['zipPostalCode'] = parseInt(
            this.state.billingInfo.zipCode
        );
        obj.addressVerificationDetails['address'] = this.state.billingInfo.number;
        fetchData(url, {
            method: 'POST',
            body: JSON.stringify(obj),
            headers: {
                'Content-Type': 'application/json'
            }
            // mode: 'cors'
        })
            .then((res) => {

                let cvvValidation = res.cardSecurityResponseCode === '1' ? true : false;
                if (res.status) {
                    let errorStatus = res.status;
                    this.setState({
                        showThrobber: false,
                        showModalError: true,
                        genericErrorLabel: errorsPxp[error]
                    });
                } else if (!cvvValidation) {
                    this.reversalTransaction(res.accountDetails.tokenizedCardNumber, transactionId);
                } else if (cvvValidation) {
                    this.props.total.value === 0 ? res.stateDetails.approvalCode = "AC-" + header.bookingRef : '';
                    this.finaliseOrder(res, transactionId);
                }
            })
            .catch((error) => {
                this.setState({
                    showThrobber: false,
                    showModalError: true,
                    genericErrorLabel: errorsTransaction[error]
                });
            });
    };
    /**
     * Payment process last step: call Hybris API
     * @param {object} res pxp response
     * @param {String} transactionId transaction id created fe side
     */
    finaliseOrder = (res, transactionId) => {
        const { urls } = this.props.attributes.services;
        let url = urls.finaliseOrderApi;
        let apikey =
            typeof window !== 'undefined' ? window.configs.apikeyMycruise : '';
        let header = SessionStorage.getItem('header');
        const headers = {
            'X-CommonData': JSON.stringify(header),
            'Content-Type': 'application/json',
            'X-Source-Identity-Token-0': apikey
        };
        let obj = {};

        let value = this.state.billingInfo.country.value;

        let selectedCountry = this.state.countryRef.options.find(
            (x) => Object.keys(x)[0] === value
        );

        obj.billingAddress = {};
        obj.billingAddress['title'] = this.state.billingInfo.title.value;
        obj.billingAddress['firstName'] = this.state.billingInfo.firstName;
        obj.billingAddress['lastName'] = this.state.billingInfo.lastName;
        obj.billingAddress['houseNumber'] = this.state.billingInfo.number;
        obj.billingAddress['streetNumber'] = this.state.billingInfo.number;
        obj.billingAddress['line1'] = this.state.billingInfo.billingAddress;
        obj.billingAddress['line2'] = this.state.billingInfo.billingAddress2;
        obj.billingAddress['town'] = this.state.billingInfo.city;
        obj.billingAddress['postalCode'] = this.state.billingInfo.zipCode;
        obj.billingAddress['email'] = this.state.billingInfo.email;

        let country = {};

        //mock purpose
        country['isocode'] = Object.keys(selectedCountry)[0];

        obj.billingAddress['country'] = country;
        obj.paymentInfo = {};
        obj.paymentInfo['approvalCode'] = res.stateDetails.approvalCode;
        obj.paymentInfo['tokenizedCardNumber'] = res.accountDetails.tokenizedCardNumber;
        let tokenizedcardnumber = res.accountDetails.tokenizedCardNumber;

        obj.paymentInfo['transactionId'] = res.id;
        obj.paymentInfo['clientTransactionId'] = transactionId;
        obj.paymentInfo['cardType'] = this.state.creditCardCode;
        obj.paymentInfo['merchantId'] = this.props.attributes.merchantId;
        obj.paymentInfo['storeId'] = this.props.attributes.storeId;
        obj.paymentInfo['capturedAmount'] = this.props.total.value;
        fetchData(url, {
            method: 'POST',
            body: JSON.stringify(obj),
            headers: headers
        }).then((res) => {
            if (res.errors) {
                // authorization reversal transaction
                if (res.status !== 409) {
                    this.reversalTransaction(tokenizedcardnumber, transactionId, res);
                }
            } else {
                // if no errors --> redirect to confirmation page (hash with order number)
                let redirectLink = window.configs.confirmationPageUrl;
                let code = res.code;
                window.location.href = `${redirectLink}#${code}`;
            }
        }).catch((error) => {
            this.reversalTransaction(tokenizedcardnumber, transactionId);
        });

    };

    /**
     * If Hybris return an error at the finalize call,, we have to reverse the already approved transaction.
     * @param {String} transactionId transaction id created fe side
     */

    reversalTransaction(tokenizedCardNumber, origTransactionId, response = []) {
        const userData = SessionStorage.getItem('userData');
        let bookingReference = userData.bookingRef;
        // let sequenceNumber = userData.customer.paxNumber;
        let sequenceNumber = '1';
        let date = plainDateFormat(new Date(), 'YYYYMMDDHHMMSS');
        // let transactionId = `${bookingReference}-${sequenceNumber}-${date}`;
		let transactionId = SessionStorage.getItem('clientTransactionId');                
        // Resource: POST /api/v5/transactions/[transactionId]/operations
        //TODONICO: la reverse la faccio lato fe o deve farla aem? perchè la transaction la facciamo lato AEM
        let url = this.props.attributes.servletTransaction;
        url = `${url}?transactionId=${transactionId}`;
        let obj = {};
        const errorsFinalise = this.props.errorLabels.finaliseHybris;

        obj.merchantId = this.props.attributes.merchantId;
        obj.userId = this.props.attributes.userId;
        obj.storeId = this.props.attributes.storeId;
        obj.clientSystemTransactionId = transactionId;
        obj.clientSystemInvoiceId = origTransactionId;
        obj.type = 'reversalsale';
        obj.currencyCode = this.props.total.currencyIso;
        obj.amount = this.props.total.value;
        obj.accountDetails = {};
        obj.accountDetails['cardTokenizedNumber'] = tokenizedCardNumber;
        fetchData(url, {
            method: 'POST',
            body: JSON.stringify(obj),
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        }).then((res) => {
            if (res.status && res.status.length > 0) {
                this.setState({
                    showThrobber: false,
                    showModalError: true,
                    capturedAmountLabel: false,
                    genericErrorLabel: errorsFinalise.reversalFailed
                });
            } else {
                let capturedAmountLabelData = false;
                if (response.errors && response.errors.length && response.errors[0].hasOwnProperty('subject') && response.errors[0].subject === 'capturedAmount') {
                    capturedAmountLabelData = true;
                }
                this.setState({
                    showThrobber: false,
                    showModalError: true,
                    capturedAmountLabel: capturedAmountLabelData,
                    genericErrorLabel: errorsFinalise.reversalSuccess
                });
            }
        });
    }
    /**
     * Terms and condition text will be aquired from the fe with a call to AEM
     */
    gettermsAndConditionsText = () => {
        const { disclaimerUrl } = this.props.attributes;
        let url = `${disclaimerUrl}.content`; //YD .html after .content is missing.

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
        // CKS - disabling complete payment button on blur of any field
        this.setState({
            formCompleted: false
        });
        setTimeout(() => {
            let empty = 0;
            let noEmpty = false;
            let noErrors = false;

            Object.keys(this.state.creditCardInfo).map((field, index) => {
                if (
                    typeof this.state.creditCardInfo[field] === 'string' &&
                    this.state.creditCardInfo[field] === ''
                ) {

                    empty++;

                } else if (typeof this.state.creditCardInfo[field] === 'object') {
                    let item = this.state.creditCardInfo[field];

                    Object.keys(item).map((internalObject, index) => {
                        if (item[internalObject].value === '') {

                            empty++;
                        }
                    });
                }
            });
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
                if (typeof document !== 'undefined' && document.getElementsByClassName('show-msg').length === 0) {
                    noErrors = true;
                }
            }

            // if both true, set state to show btn
            if (noErrors && noEmpty) {
                this.setState({
                    formCompleted: true
                }
                );
                if (typeof document !== 'undefined' && document.activeElement.textContent === 'Continue') {
                    this.handleSubmit();
                }
            } else {
                this.setState({
                    formCompleted: false
                });
            }

        }, 2000)

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
            newCartEnteries,
            checkNoMoreCart,
            showDuplicateEvent,
            newProductBooking,
            existingProduct
        } = this.state;
        const { formFields, labels } = this.props.attributes;
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
        let localeString = getConfig('locale', 'en_GB')
                .toLowerCase()
                .split('_')['1'];
        const { total } = this.props;
        return (
            <div className="checkoutForm" ref={(node) => (this.node = node)}>
                <div className="checkoutForm-wrap">
                    <div className="checkoutForm-header">
                        <h2 className="checkoutForm-title">
                            {labels.checkoutFormTitleLabel}
                        </h2>
                    </div>
                    <div className="checkoutForm-price">
                        <div>
                            <h4>{capitalizeString(labels.payingTotalLabel)}</h4>
                            <CurrencyFormat
                                value={total.value}
                                currencyCode={
                                    this.state.totalPriceWithTax.currencyIso
                                }
                                className="currency"
                                decimal={true}
                            />
                        </div>
                        <div className="checkoutForm-img" tabIndex={0} aria-label={labels.securedCheckoutLabel ? labels.securedCheckoutLabel : ''}/>
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
                                    <h5>{labels.billingInfoLabel}</h5>
                                    <div className="input-formFields">
                                        <div className="inputSelect-group">
                                            <div className="select-small">
                                                <div className="select-label">
                                                    {formFields.title.label}
                                                </div>
                                                {this.renderTitleDropdown()}
                                            </div>
                                            <InputField
                                                type="text"
                                                blurCallBack={
                                                    this.enableSubmitButton
                                                }
                                                required={true}
                                                id="firstName"
                                                name="firstName"
                                                changeCallback={
                                                    this.handleTextChange
                                                }
                                                placeholder={
                                                    formFields.firstName.label
                                                }
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
                                            />
                                        </div>
                                        <div className="country">
                                            <div className="select-label">
                                                {formFields.country.label}
                                            </div>
                                            {this.renderCountryDropdown()}
                                        </div>
                                        <InputField
                                            type="text"
                                            required={true}
                                            blurCallBack={
                                                this.enableSubmitButton
                                            }
                                            id="lastName"
                                            name="lastName"
                                            changeCallback={
                                                this.handleTextChange
                                            }
                                            placeholder={
                                                formFields.lastName.label
                                            }
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
                                        />
                                        <InputField
                                            type="text"
                                            required={true}
                                            id="city"
                                            blurCallBack={
                                                this.enableSubmitButton
                                            }
                                            name="city"
                                            changeCallback={
                                                this.handleTextChange
                                            }
                                            placeholder={formFields.city.label}
                                            value={this.state.billingInfo.city}
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
                                        />
                                        <InputField
                                            type="text"
                                            required={true}
                                            id="number"
                                            blurCallBack={
                                                this.enableSubmitButton
                                            }
                                            name="number"
                                            changeCallback={
                                                this.handleTextChange
                                            }
                                            placeholder={
                                                formFields.houseNumber.label
                                            }
                                            value={
                                                this.state.billingInfo.number
                                            }
                                            regex={regex.house_num}
                                            validate={this.state.validate}
                                            errorMsg={this.state.numberError}
                                            errorCallback={(
                                                errorState,
                                                errorMsg
                                            ) =>
                                                this.handleError(
                                                    'number',
                                                    errorState,
                                                    errorMsg
                                                )
                                            }
                                            showAstrick={true}
                                        />
                                        {this.state.countyVisible && (
                                            <InputField
                                                type="text"
                                                required={localeString === 'au' || localeString === 'us' ? true : false}
                                                id="county"
                                                blurCallBack={
                                                    this.enableSubmitButton
                                                }
                                                name="county"
                                                changeCallback={
                                                    this.handleTextChange
                                                }
                                                placeholder={ localeString === 'au' || localeString === 'us' ? 
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
                                            />
                                        )}
                                        <InputField
                                            type="text"
                                            required={true}
                                            id="billingAddress"
                                            name="billingAddress"
                                            blurCallBack={
                                                this.enableSubmitButton
                                            }
                                            changeCallback={
                                                this.handleTextChange
                                            }
                                            placeholder={
                                                formFields.billingAddress.label
                                            }
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
                                        />
                                        <InputField
                                            type="text"
                                            required={true}
                                            id="zipCode"
                                            blurCallBack={
                                                this.enableSubmitButton
                                            }
                                            name="zipCode"
                                            changeCallback={
                                                this.handleTextChange
                                            }
                                            placeholder={formFields.zip.label}
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
                                            // regex={regex.address}
                                            // validate={this.state.validate}
                                            //errorMsg={
                                            //    this.state.billingAddressError
                                            // }
                                            blurCallBack={
                                                this.enableSubmitButton
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
                                            showAstrick={false}
                                        />
                                        <InputField
                                            type="text"
                                            required={true}
                                            id="email"
                                            name="email"
                                            blurCallBack={
                                                this.enableSubmitButton
                                            }
                                            changeCallback={
                                                this.handleTextChange
                                            }
                                            placeholder={formFields.email.label}
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
                                        />
                                        <h5>{labels.paymentLabel}</h5>
                                        <div className="checkoutForm-column">
                                            <div className="checkoutForm-cards">
                                                <div className="img-cards">
                                                    {this.cardTypes.map(
                                                        (card, index) => {
                                                            return (
                                                                <span
                                                                    key={
                                                                        card.name
                                                                    }
                                                                    className={`img-card ${
                                                                        card.name
                                                                        } `}
                                                                />
                                                            );
                                                        }
                                                    )}
                                                </div>
                                                <InputField
                                                    type="text"
                                                    required={true}
                                                    id="creditCardNumber"
                                                    blurCallBack={
                                                        this.enableSubmitButton
                                                    }
                                                    name="creditCardNumber"
                                                    changeCallback={
                                                        this.validateCard
                                                    }
                                                    placeholder={
                                                        formFields.creditCard
                                                            .label
                                                    }
                                                    value={
                                                        this.state
                                                            .creditCardInfo
                                                            .creditCardNumber
                                                    }
                                                    regex={
                                                        regex[
                                                        this.state
                                                            .creditCardType
                                                        ]
                                                    }
                                                    validate={
                                                        this.state.validate
                                                    }
                                                    errorMsg={
                                                        this.state
                                                            .creditCardNumberError
                                                    }
                                                    errorCallback={(
                                                        errorState,
                                                        errorMsg
                                                    ) =>
                                                        this.handleError(
                                                            'creditCardNumber',
                                                            errorState,
                                                            errorMsg
                                                        )
                                                    }
                                                    showAstrick={true}
                                                />
                                            </div>
                                            <div className="inputSelect-group">
                                                <div className="select-label">
                                                    {labels.expiresLabel}
                                                </div>
                                                {this.renderMonthDropdown()}
                                                {this.renderYearDropdown()}
                                            </div>
                                            <InputField
                                                inputClass="small-input"
                                                type="text"
                                                required={true}
                                                id="creditCardSecurityCode"
                                                blurCallBack={
                                                    this.enableSubmitButton
                                                }
                                                name="creditCardSecurityCode"
                                                changeCallback={
                                                    this.handleCreditChange
                                                }
                                                placeholder={
                                                    formFields.securityCode
                                                        .label
                                                }
                                                value={
                                                    this.state.creditCardInfo
                                                        .creditCardSecurityCode
                                                }
                                                regex={regex.genericCvv}
                                                validate={this.state.validate}
                                                errorMsg={
                                                    this.state
                                                        .creditCardSecurityCodeError
                                                }
                                                errorCallback={(
                                                    errorState,
                                                    errorMsg
                                                ) =>
                                                    this.handleError(
                                                        'creditCardSecurityCode',
                                                        errorState,
                                                        errorMsg
                                                    )
                                                }
                                                showAstrick={true}
                                            />
                                        </div>
                                    </div>
                                    <div className="submit-wrap cf input-formFields">
                                        <button data-toggle="modal" data-target="#react-aria-modal-dialog"
                                            type="button"
                                            className={`cta-primary ${
                                                this.state.formCompleted
                                                    ? ''
                                                    : 'cta-disabled'
                                                }  `}
                                            data-clicktype={`general`}
                                            data-linktext={`${
                                                labels.completePaymentButtonLabel
                                                }`}
                                            onClick={this.handleSubmit}
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

                                className={`cta-primary ${
                                    this.state.disabled
                                        ? 'cta-disabled'
                                        : ''
                                    }  `}
                                onClick={() => this.requestKeys()}
                            >

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
                        handleContinueCheckout={this.requestKeys}
                        checkNoMoreCart={checkNoMoreCart}
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
                                                {item.product.name}
                                            </div>
                                            <div className="item_details">
                                                {`${moment(
                                                    item.product.attributes
                                                        .startDateTime, "YYYYMMDDhhmmss"
                                                ).format('HH:mm')} | ${moment(
                                                    item.product.attributes
                                                        .startDateTime,"YYYYMMDDhhmmss"
                                                ).format(
                                                    'ddd Do MMM YYYY'
                                                )} | ${item.noOfGuests} guests`}
                                            </div>
                                        </div>
                                    );
                                })}
                            <div className="lower_desc">
                                {checkNoMoreCart
                                    ? shoppingCartModelShortDescLabel
                                    : shoppingCartModelShortTitleLabel}
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
                                {labels.tryAgainLabel}
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
            </div>
        );
    };
}

paymentMycruisePXP.propTypes = {};

export default paymentMycruisePXP;
