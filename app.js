(function() {

    var my_app = angular.module('generatorApp', []);

    my_app.controller('viewerCtrl', [ '$http', '$scope',
        function($http, $scope) {
            $http.get("overlap.json").then(function(res){
                let data = res.data;
                $scope.network1 = data.network1;
                $scope.network2 = data.network2;
                $scope.overlaps = data.overlaps;
                $scope.ignoredKeys = [
                    "@context",
                    "@id",
                    "@type"
                ];
                $scope.processed_fields = {};

                for (let schema in data.overlaps){
                    if (data.overlaps.hasOwnProperty(schema)){
                        $scope.processed_fields[data.overlaps[schema][0][0]] = [];
                        $scope.processed_fields[data.overlaps[schema][0][1]] = [];

                        for (let field in data.overlaps[schema][1]["overlapping fields"]){
                            if (data.overlaps[schema][1]["overlapping fields"].hasOwnProperty(field)){
                                $scope.processed_fields[data.overlaps[schema][0][0]].push(data.overlaps[schema][1]["overlapping fields"][field][0]);
                                $scope.processed_fields[data.overlaps[schema][0][1]].push(data.overlaps[schema][1]["overlapping fields"][field][1]);
                            }
                        }
                    }
                }
            })
        }]
    );

    my_app.filter('typeOf', function() {
        return function (obj) {
            return typeof obj;
        };
    });

})();