/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: "#template-menu-product",
      cartList: '#template-cart-list'
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      toggleTrigger: '.fa-chevron-down',
      summary: '.cart__order-summary',
    }
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    }
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 0,
      defaultMax: 10,
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartList: Handlebars.compile(document.querySelector(select.templateOf.cartList).innerHTML),
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }
    renderInMenu() {
      const thisProduct = this;
      // generate HTML
      const generatedHTML = templates.menuProduct(thisProduct.data);
      // create DOM element
      thisProduct.dom = {};
      thisProduct.dom.element = utils.createDOMFromHTML(generatedHTML);
      // find menu container
      const menuContainer = document.querySelector(select.containerOf.menu);
      // add element to menu
      menuContainer.appendChild(thisProduct.dom.element);
    }
    getElements() {
      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.dom.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.dom.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.dom.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.dom.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.dom.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.dom.element.querySelector(select.menuProduct.amountWidget);
    }
    initAccordion() {
      const thisProduct = this;
      /* find the clickable trigger (the element that should react to clicking) */
      // [REMOVE] const clickableTrigger = thisProduct.dom.element.querySelector(select.menuProduct.clickable);

      /* START: add event listener to clickable trigger on event click */
      thisProduct.accordionTrigger.addEventListener('click', function (event) {
        /* prevent default action for event */
        event.preventDefault();
        /* find active product (product that has active class) */
        const activeProducts = document.querySelectorAll('.product.active');
        /* if there is active product and it's not thisProduct.dom.element, remove class active from it */
        for (let activeProduct of activeProducts) {
          if (activeProduct != thisProduct.dom.element) {
            activeProduct.classList.remove('active');
          }
        }
        /* toggle active class on thisProduct.dom.element */
        thisProduct.dom.element.classList.toggle('active');
      });
    }
    initOrderForm() {
      const thisProduct = this;
      thisProduct.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }
    processOrder() {
      const thisProduct = this;

      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);

      // set price to default price
      let price = thisProduct.data.price;

      // for every category (param)...
      for (let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];

        // for every option in this category
        for (let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];

          // find all classes for each product image
          const imageClass = thisProduct.imageWrapper.querySelector(`.${paramId}-${optionId}`);

          // change price
          if (formData[paramId].includes(optionId)) {
            // include 
            // - optionId and it is not default
            if (!option.default) {
              price += option.price;
            }
            // - img - if exist then add class active
            if (imageClass) {
              imageClass.classList.add(classNames.menuProduct.imageVisible);
            }
          } else {
            // not include 
            //  - optionId and it is default
            if (option.default) {
              price -= option.price;
            }
            // - image - remove class active
            if (imageClass) {
              imageClass.classList.remove(classNames.menuProduct.imageVisible);
            }
          }

        }
      }
      // multiple price by amount
      thisProduct.priceSingle = price;
      price *= thisProduct.amountWidget.value;
      // update calculated price in the HTML
      thisProduct.price = price;
      thisProduct.priceElem.innerHTML = price;
    }
    initAmountWidget() {
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function () {
        thisProduct.processOrder();
      });
    }
    addToCart() {
      const thisProduct = this;
      // app.cart.add(thisProduct);
      app.cart.add(thisProduct.prepareCartProduct());
    }
    prepareCartProduct() {
      const thisProduct = this;
      // corrected as in version ONE
            // const productSummary = {
            //   id: thisProduct.id,
            //   name: thisProduct.data.name,
            //   amount: thisProduct.amountWidget.input.value,
            //   priceSingle: thisProduct.priceSingle,
            //   price: thisProduct.price,
            //   params: thisProduct.prepareCartProductParams(),
            // };

      // corrected as in version TWO
      const { id, data: { name }, amountWidget: { input }, priceSingle, price, prepareCartProductParams} = thisProduct;
      
      // corrected as in version ONE
            // return productSummary;
      
      // corrected as in version TWO
      return {
        id,
        name,
        amount: input.value,
        priceSingle,
        price,
        params: prepareCartProductParams(),
      }
    }

    prepareCartProductParams() {
      const thisProduct = this;
      const cartProductParams = {};
      /* eslint no-unused-vars: ["error", { "varsIgnorePattern": "price" }]*/
      let price = 0;
      
      // convert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);

      for (let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];

        // create object cartProductParams
        cartProductParams[paramId] = {};

        // add 'label' into cartProductParams
        cartProductParams[paramId].label = param.label;

        // create options
        cartProductParams[paramId].options = {};

        // for every option in this category
        for (let optionId in param.options) {

          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];

          // find all classes for each product image
          const imageClass = thisProduct.imageWrapper.querySelector(`.${paramId}-${optionId}`);

          // change price
          if (formData[paramId].includes(optionId)) {
            // include 
            // - optionId and it is not default
            if (!option.default) {
              price += option.price;
            }
            // - img - if exist then add class 'active'
            if (imageClass) {
              imageClass.classList.add(classNames.menuProduct.imageVisible);
            }
            // add existing options into cartProductParams
            cartProductParams[paramId].options[optionId] = option.label;

          } else {
            // not include 
            //  - optionId and it is default
            if (option.default) {
              price -= option.price;
            }
            // - image - remove class active
            if (imageClass) {
              imageClass.classList.remove(classNames.menuProduct.imageVisible);
            }
          }

        }
      }
      return cartProductParams;
    }
  }

  class AmountWidget {
    constructor(element) {
      const thisWidget = this;
      thisWidget.getElements(element);

      if (thisWidget.input.value) {
        thisWidget.setValue(thisWidget.input.value);
      } else {
        thisWidget.setValue(settings.amountWidget.defaultValue);
      }
      thisWidget.initActions(element);
    }
    getElements(element) {
      const thisWidget = this;
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }
    setValue(value) {
      const thisWidget = this;
      const newValue = parseInt(value);
      if (newValue !== thisWidget.value && !isNaN(newValue) && newValue <= settings.amountWidget.defaultMax && newValue >= settings.amountWidget.defaultMin) {
        thisWidget.value = newValue;
        thisWidget.announce();
      }
      thisWidget.input.value = thisWidget.value;
    }
    initActions() {
      const thisWidget = this;
      thisWidget.input.addEventListener('change', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(--thisWidget.input.value);
      });
      thisWidget.linkIncrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(++thisWidget.input.value);
      });
    }
    announce() {
      const thisWidget = this;
      const event = new Event('updated');
      thisWidget.element.dispatchEvent(event);
    }
  }

  class Cart {
    constructor(element) {
      const thisCart = this;
      thisCart.products = [];
      thisCart.getElements(element);
    }

    getElements(element) {
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.initActions();
      thisCart.dom.productList = document.querySelector(select.cart.summary)
    }

    initActions() {
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function (event) {
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      })
    }

    add(menuProduct) {
      const thisCart = this;

      // generate HTML
      const generatedHTML = templates.cartList(menuProduct);
      // create DOM element
      const generatedDOMHtml = utils.createDOMFromHTML(generatedHTML);
      // add DOM element to cart
      thisCart.dom.productList.appendChild(generatedDOMHtml);
    }
  }

  const app = {
    initMenu: function () {
      const thisApp = this;
      for (let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
      }
    },
    initData: function () {
      const thisApp = this;
      thisApp.data = dataSource;
    },
    init: function () {
      const thisApp = this;
      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },
    initCart: function () {
      const thisApp = this;
      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    }
  };

  app.init();

}
