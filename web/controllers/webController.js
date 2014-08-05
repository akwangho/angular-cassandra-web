//'use strict';

angular.module("cassandraWeb", ['angularTreeview'])
    .controller("webCtrl", function ($scope, $http) {

        $scope.getKeyspaceInfo = function() {
            $http({
                url: '/api/ks',
                method: "GET"
            }).success(function (keyspaces) {
                genTreeData(keyspaces);
            }).error(function (error) {
                $scope.error = error;
            });
            var genTreeData = function (keyspaces) {
                keyspaces.forEach(function (ks) {
                    var ksInfo = [];
                    ks.cf_defs.forEach(function (cf) {
                        console.log(cf);
                        var cfInfo = [{
                            label: "ColumnType: " + cf.column_type
                        }, {
                            label: "ComparatorType: " + cf.comparator_type
                        }];
//                    for (var c in cf) {
//                        console.log(c);
//                        c == 'ColumnType' && cfInfo.push({
//                            "label": c  + ': ' + JSON.stringify(cf[c])
//                        });
//                    }
                        ksInfo.push({
                            label: cf.name,
                            children: cfInfo,
                            collapsed: true
//                        children: [{
//                            "label": "bb"
//                        }]
                        });
                    });
                    for (var k in ks) {
                        k != 'name' && k != 'cf_defs' && ksInfo.push({
                            "label": k  + ': ' + JSON.stringify(ks[k])
                        });
                    }
                    $scope.treeData.push({
                        label: ks.name,
                        collapsed: true,
                        children: ksInfo
                    })
                })
            };
        };

        $scope.selectKeyspace = function(index) {
            $scope.ksSelectIndex = index;
        };

        $scope.selectColumnFamily = function(index) {
            $scope.cfSelectIndex = index;
        };


        $scope.treeData = [];

    }).directive('resizable', function () {
        return {
            restrict: 'A',
            scope: {
                callback: '&onResize'
            },
            link: function postLink(scope, elem, attrs) {
                elem.resizable();
                elem.on('resizestop', function (evt, ui) {
                    if (scope.callback) { scope.callback(); }
                });
            }
        };
    });