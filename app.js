(function() {

    var my_app = angular.module('generatorApp', []);

    my_app.controller('viewerCtrl', [ '$http', '$scope',
        function($http, $scope) {
            $http.get("overlap.json").then(function(res){
                console.log(res.data);
                let data = res.data;
                $scope.network1 = data.network1;
                $scope.network2 = data.network2;
                $scope.overlaps = data.overlaps;

                $scope.processed_fields = {};

                for (let schema in data.overlaps){
                    console.log(data.overlaps[schema])
                }
            })
        }]
    )

})();