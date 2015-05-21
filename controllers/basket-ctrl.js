/* Created by Francisco Benedict - 21/05/2015 */

// A Basket Case App

var debug = true;


/* ***************************************** */
// GLOBAL
/* ***************************************** */

// Variables
var tr = $('table tbody tr'),
	trProduct = $('table#products tbody tr.item');


/* ***************************************** */
// FUNCTIONS
/* ***************************************** */

// Currency symbol setup
function currencySymbolSetup(){
	var	htmlEntityPound		=	'&pound;',
		htmlDecimalDollar	=	'&#36',
		htmlEntityYen		=	'&yen;';

	tr.each(function(){
		var currencySymbol = $(this).find('td .currency-symbol');
		currencySymbol.html(htmlEntityPound);
	});
	$('.sum-section').find('.currency-symbol').html(htmlEntityPound);
}

// VAT setup & VAT Calculation
function vatSetup() {
	var vatAmount = 20;
	$('.vat-at').html(vatAmount);

	var subtotalAmount = $('#subtotal-amount').text(),
		vat = parseFloat(subtotalAmount) / 100*vatAmount,
		subTotalWithVAT = +parseFloat(subtotalAmount).toFixed(2) + +parseFloat(vat).toFixed(2),
		grandTotal = parseFloat(subTotalWithVAT).toFixed(2);

	$('#vatAmount').text(parseFloat(vat).toFixed(2));
	totalCost(grandTotal);
}

// Convert prices to true floats 2 decimal places
function trueFloat() {
	$('table#products tbody tr.item').each(function(){
		var itemPrice = $(this).find('td.item-price span.price-amount');
		var itemPriceAmount = itemPrice.text();
		itemPrice.text(parseFloat(itemPriceAmount).toFixed(2));
	});
}

// Calculate item cost
function calculateItemCost() {
	$('table#products tbody tr.item').each(function(){
		var unitPrice = $(this).find('td.item-price span.price-amount').text(),
			qty = $(this).find('td.item-qty label input').val(),
			itemCost = $(this).find('td.item-cost span.cost-amount'),
			cost = unitPrice*qty;
		itemCost.text(parseFloat(cost).toFixed(2));
	});
}

// Calculate subtotal
function calculateSubtotal() {
	var subtotal = 0;
	$('table#products tbody tr.item').each(function(){
		var totalItemCost = $(this).find('td.item-cost span.cost-amount').text();
		subtotal = parseFloat(subtotal) + parseFloat(totalItemCost);
	});
	$('#subtotal-amount').text(parseFloat(subtotal).toFixed(2));
	vatSetup();
}

// Calculate grand total
function totalCost(grandTotal) {
	$('#grandTotal').text(grandTotal);
}

// Recalculate when quantity changes
function recalculateQtyChange() {
	calculateItemCost();
	calculateSubtotal();
}

// Check if there are any items in the basket
function checkBasketItems() {
	var itemsLeft = $('table#products tbody tr.item').length;
	if (itemsLeft > 0) {
		$('#btnBuyNow').removeClass('disabled');
	}
}

//Get all order data
function getAllOrderData() {
	var jsonOrderObj = {},
		orderedItemArr = [],
		orderedItems = '';

	delete localStorage.orderedItems;

	$('table#products tbody tr.item').each(function(){
		var productName = $(this).find('.product-name').text(),
			quantityOrdered = $(this).find('.item-qty label input').val(),
			costOfItems = $(this).find('.item-cost .cost-amount').text();

		var item = {};
		item['name'] = productName;
		item['qty'] = quantityOrdered;
		item['cost'] = costOfItems;

		orderedItemArr.push(item);
	});

	jsonOrderObj['orderItems'] = orderedItemArr;
	jsonOrderObj['subtotal'] = $('#subtotal-amount').text();
	jsonOrderObj['vat'] = $('#vatAmount').text();
	jsonOrderObj['grandTotal'] = $('#grandTotal').text();

	JSON.stringify(jsonOrderObj, null, "\t")

	$.ajax({
		url : 'index.html',
		type: 'POST',
		dataType : 'text',
		data : {jsonOrderObj:jsonOrderObj},
		success : function(data) {
			if (data) {
				alert('sucessfully sent');
				$('#results').html(JSON.stringify(jsonOrderObj, null, '\t'));

				// store the order in localStorage
				orderedItems = JSON.stringify(jsonOrderObj);

				localStorage.setItem('orderedItems', orderedItems);

				//locaStorage.orderObject = orderedItems;
				//console.log('orderedItems: ' + orderedItems);

				//console.log(JSON.parse(localStorage.getItem(orderedItems)));
			}
		},
		error : function() {
			alert('failed');
		}
	});
}

// Remove Sort
function removeSort() {
	$('table#products thead tr#columnHeads th.sortable').each(function(){
		$(this).removeClass('sorted ascending descending');
	});
}


/* ***************************************** */
// FUNCTIONS ONLOAD
/* ***************************************** */

//Run functions on load
$(window).load(function(){
	currencySymbolSetup();
	vatSetup();

	setTimeout(function(){
		trueFloat();
		calculateItemCost();
		calculateSubtotal();
		checkBasketItems();

		// Increment / Decrement item quantity
		$('.button').on('click', function() {
			var button = $(this);
			var oldValue = button.parent().find('input').val();

			if (button.hasClass('increment')) {
				var newVal = parseFloat(oldValue) + 1;
			} else {
				// Prevent decrement below 1
				if (oldValue > 1) {
					var newVal = parseFloat(oldValue) - 1;
				} else {
					newVal = 1;
				}
			}
			button.parent().find('input').val(newVal);
			recalculateQtyChange();
		});

		// Allow only numbers into the Quantity box
		$('table#products tbody tr.item td.item-qty label input').on('keypress', function(e){
			var keyCode = window.event ? e.keyCode : e.which;
			//codes for 0-9
			if (keyCode < 48 || keyCode > 57) {
				//codes for backspace, delete, enter
				if (keyCode !== 0 && keyCode !== 8 && keyCode !== 13 && !e.ctrlKey) {
					e.preventDefault();
				}

				// Pressing the Enter key when manually entering a quantity
				if (keyCode === 13) {
					recalculateQtyChange();
				}
			}
		});

		// input quantity manually
		$('table#products tbody tr.item td.item-qty label input').blur(function(){
			recalculateQtyChange();
		});

		// Delete item
		$('table#products tbody tr.item td.item-delete .delete').click(function(){
			$(this).closest('tr.item').remove();
			$('#results').text('');
			recalculateQtyChange();
			var itemsLeft = $('table#products tbody tr.item').length;
			if (itemsLeft < 1) {
				$('#btnBuyNow').addClass('disabled');
			}
		});

		// Sorting
		$('table#products thead tr#columnHeads th.sortable a').click(function(e){
			var sortedBy = $(this).parent();
			var sortOrder = $('#sortRule span.reverse').text();
			e.preventDefault();
			removeSort();
			sortedBy.addClass('sorted');

			if (sortOrder === 'false') {
				sortedBy.addClass('ascending');
			} else {
				sortedBy.addClass('descending');
			}
		});

		// Unsorted
		$('#unsorted').click(function(e){
			e.preventDefault();
			removeSort();
		});

	}, 500);
});

$(function(){});


/* ***************************************** */
// EVENT LISTENERS
/* ***************************************** */

$('#test').click(function(e){
	e.preventDefault();
	recalculateQtyChange();
});

//Buy now
$('#btnBuyNow').click(function(e){
	e.preventDefault();
	if ($(this).hasClass('disabled')) {
		$('#results').text('');
		alert('basket empty');
		return false;
	} else {
		getAllOrderData();
	}
});

//