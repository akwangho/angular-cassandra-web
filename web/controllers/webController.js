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
            function bin2String(array) {
                var result = "";
                for (var i = 0; i < array.length; i++) {
                    result += String.fromCharCode(parseInt(array[i], 10));
                }
                return result;
            }
            function labelSort(obj1, obj2) {
                return obj1.label > obj2.label? 1: -1;
            }
            var genTreeData = function (keyspaces) {
                keyspaces.forEach(function (ks) {
                    var ksInfo = [];
                    ks.cf_defs.forEach(function (cf) {
                        var cfInfo = [{
                            label: "ColumnType: " + cf.column_type
                        }, {
                            label: "ComparatorType: " + cf.comparator_type
                        }, {
                            label: "MaxCompactionThreshold: " + cf.max_compaction_threshold
                        }, {
                            label: "MinCompactionThreshold: " + cf.min_compaction_threshold
                        }, {
                            label: "RowCacheSize: " + cf.row_cache_size
                        }, {
                            label: "DefaultValidationClass: " + cf.default_validation_class
                        }];
                        var cfdInfo = [];
                        cf.column_metadata.forEach(function (cfd) {
                            cfdInfo.push({
                                label: bin2String(cfd.name)
                            })
                        });
                        cf.column_metadata && cf.column_metadata.length > 0 &&
                            cfInfo.push({
                                label: "Column Definitions",
                                children: cfdInfo.sort(labelSort),
                                collapsed: true
                            });
                        ksInfo.push({
                            label: cf.name,
                            children: cfInfo,
                            isColumnFamily: true,
                            collapsed: true
                        });
                        ksInfo.sort(labelSort);
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

    }).directive('resizer', function($document) {

        return function($scope, $element, $attrs) {

            $element.on('mousedown', function(event) {
                event.preventDefault();

                $document.on('mousemove', mousemove);
                $document.on('mouseup', mouseup);
            });

            function mousemove(event) {

                if ($attrs.resizer == 'vertical') {
                    // Handle vertical resizer
                    var x = event.pageX;

                    if ($attrs.resizerMax && x > $attrs.resizerMax) {
                        x = parseInt($attrs.resizerMax);
                    }

                    $element.css({
                        left: x + 'px'
                    });

                    angular.element(document.querySelector($attrs.resizerLeft)).css({
                        width: x + 'px'
                    });
                    angular.element(document.querySelector($attrs.resizerRight)).css({
                        left: (x + parseInt($attrs.resizerWidth)) + 'px'
                    });

                } else {
                    // Handle horizontal resizer
                    var y = window.innerHeight - event.pageY;

                    $element.css({
                        bottom: y + 'px'
                    });

                    angular.element(document.querySelector($attrs.resizerTop)).css({
                        bottom: (y + parseInt($attrs.resizerHeight)) + 'px'
                    });
                    angular.element(document.querySelector($attrs.resizerBottom)).css({
                        height: y + 'px'
                    });
                }
            }

            function mouseup() {
                $document.unbind('mousemove', mousemove);
                $document.unbind('mouseup', mouseup);
            }
        };
    });