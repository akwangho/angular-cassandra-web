//'use strict';

angular.module("cassandraWeb", ['angularTreeview', 'jsonFormatter'])
    .controller("webCtrl", function ($scope, $http, $compile) {

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
                            keyspace: ks.name,
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

        $scope.selectKey = function(idx) {
            $scope.selIndex = idx;
            var data = JSON.stringify($scope.columns[$scope.selIndex].colHash).replace(/\'/g,"\\\"");

            // FIXME: Bad idea to operate DOM directly, we should use directive in the long run
            angular.element(document.querySelector("#json-data")).replaceWith(
                $compile('<json-formatter id="json-data" class="dark" open="1" json=\'' + data + '\'></json-formatter>')($scope)
            );
        };

        $scope.$watch('mytree.currentNode', function() {
            if ($scope.mytree.currentNode && $scope.mytree.currentNode.isColumnFamily) {
                var cf = $scope.mytree.currentNode;

                $http({
                    url: '/api/' + cf.keyspace + '/' + cf.label,
                    method: "GET"
                }).success(function (res) {
                    $scope.columns = res;
                }).error(function (error) {
                    $scope.error = error;
                });


            }
        });

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