/* Created by Francisco Benedict - 21/05/2015 */

var App = angular.module('App', []);

App.controller('dataCtrl', function($scope, $http) {
	// Products
	$http.get('data-source/products.json')
	.then(function(res){
		$scope.products = res.data.products;
		$scope.predicate = '-name';
	});
});