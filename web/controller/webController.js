angular.module("cassandraWeb")
    .controller("webCtrl", function ($scope, $http) {
        $scope.getKeyspaceInfo = function() {
            $http({
                url: '/api/ks',
                method: "GET"
            }).success(function (data) {
                $scope.keyspaces = data;
            }).error(function (error) {
                $scope.error = error;
            });
        }
    });