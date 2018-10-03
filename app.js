(function() {

    var my_app = angular.module('generatorApp', []);

    my_app.controller('viewerCtrl', [ '$http', '$scope',
        function($http, $scope) {

            let viewer = this;

            $http.get("overlap.json").then(function(res){
                let data = res.data;
                $scope.output = viewer.process_data(data);
                $scope.network1 = data.network1;
                $scope.network2 = data.network2;
                $scope.overlaps = data.overlaps;
                $scope.ignoredKeys = [
                    "@context",
                    "@id",
                    "@type",
                    "$schema"
                ];
                $scope.processed_fields = {};
                $scope.map = {};
                $scope.processed_schemas = {
                    'network1': [],
                    'network2': []
                };

                /* For each overlap */
                for (let schema in data.overlaps){
                    if (data.overlaps.hasOwnProperty(schema)){

                        /* for each schema in overlap[0] */
                        let i = 0;
                        for (let schemaName in data.overlaps[schema][0]) {
                            if (data.overlaps[schema][0].hasOwnProperty(schemaName)){
                                if (data.overlaps[schema][0][schemaName] !== false){
                                    let schema_name = data.overlaps[schema][0][schemaName].toLowerCase() + '_schema.json';
                                    if (i===0){
                                        $scope.processed_schemas['network1'].push(schema_name)
                                    }
                                    else if (i===1){
                                        $scope.processed_schemas['network2'].push(schema_name)
                                    }
                                    i++;
                                    $scope.map[schema_name] = data.overlaps[schema[0]][0][schemaName];
                                    data.overlaps[schema[0]][0][schemaName] = schema_name
                                }
                            }
                        }

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

            });

            viewer.process_data = function(data){
                let output = {
                    "header": ["", data.network1.name, data.network2.name],
                    "content": {
                        "overlapped_schemas": {},
                        "isolated_schemas": {}
                    }
                };
                let processed_schemas = {
                    "network1": [],
                    "network2": []
                };
                let ignoredKeys = [
                    "@context",
                    "@id",
                    "@type",
                    "$schema"
                ];

                for (let i in data.overlaps){
                    if (data.overlaps.hasOwnProperty(i)){

                        /* INITIATE NEEDED VAR */
                        let overlap = data.overlaps[i];
                        let iterator = "overlap" + i.toString();
                        let schema_1_name = overlap[0][0].toLowerCase() + '_schema.json';
                        let schema_2_name = overlap[0][1].toLowerCase() + '_schema.json';
                        let schema_1 = data.network1["schemas"][schema_1_name];
                        let schema_2 = data.network2["schemas"][schema_2_name];

                        let base_type = data.network1["contexts"][schema_1_name][overlap[0][0]];
                        let title_1 = data.network1["schemas"][schema_1_name].title;
                        let title_2 = data.network2["schemas"][schema_2_name].title;
                        let local_output = [base_type, title_1, title_2];

                        processed_schemas["network1"].push(schema_1_name);
                        processed_schemas["network2"].push(schema_2_name);

                        output.content.overlapped_schemas[iterator] = {};
                        output.content.overlapped_schemas[iterator]["schemas"] = local_output;
                        output.content.overlapped_schemas[iterator]["fields"] = [];

                        /* Pre-process the overlaps */
                        let overlapped_fields = {};
                        for (let fields in overlap[1]['overlapping fields']){
                            if (overlap[1]['overlapping fields'].hasOwnProperty(fields)){
                                overlapped_fields[overlap[1]['overlapping fields'][fields][0]] = overlap[1]['overlapping fields'][fields][1];
                                overlapped_fields[overlap[1]['overlapping fields'][fields][1]] = overlap[1]['overlapping fields'][fields][0];
                            }

                        }

                        for (let field in schema_1["properties"]){
                            if (schema_1["properties"].hasOwnProperty(field)){
                                if (Object.keys(overlapped_fields).indexOf(field) !==-1){
                                    let local_output = [
                                        viewer.process_name(data.network1['contexts'][schema_1_name][field]),
                                        field,
                                        overlapped_fields[field]

                                    ];
                                    output.content.overlapped_schemas[iterator]["fields"].push(local_output)
                                }
                                else if (ignoredKeys.indexOf(field) === -1){
                                    if (data.network1['contexts'][schema_1_name].hasOwnProperty(field)){
                                        let local_output = [
                                            viewer.process_name(data.network1['contexts'][schema_1_name][field]),
                                            field,
                                            false
                                        ];
                                        output.content.overlapped_schemas[iterator]["fields"].push(local_output)
                                    }

                                }
                            }

                        }

                        for (let field in schema_2["properties"]){
                            if (schema_2["properties"].hasOwnProperty(field)){
                                if (ignoredKeys.indexOf(field) === -1 && Object.keys(overlapped_fields).indexOf(field) ===-1){
                                    if (data.network2['contexts'][schema_2_name].hasOwnProperty(field)){
                                        let local_output = [
                                            viewer.process_name(data.network2['contexts'][schema_2_name][field]),
                                            false,
                                            field
                                        ];
                                        output.content.overlapped_schemas[iterator]["fields"].push(local_output)
                                    }

                                }
                            }

                        }


                    }
                }

                let it = 0;
                for (let schemaName in data.network1.schemas){
                    if (data.network1.schemas.hasOwnProperty(schemaName) && processed_schemas.network1.indexOf(schemaName) === -1){
                        let iterator = "schema" + it.toString();
                        let schemaValue = data.network1.schemas[schemaName];
                        let attribute = schemaName.replace(/^\w/, c => c.toUpperCase()).replace("_schema.json", "");
                        let schema_base_type = data.network1["contexts"][schemaName][attribute];
                        output.content.isolated_schemas[iterator] = {};
                        output.content.isolated_schemas[iterator]["schemas"] = [schema_base_type, schemaValue.title, false];
                        output.content.isolated_schemas[iterator]["fields"] = [];

                        for (let field in schemaValue['properties']){
                            if (schemaValue['properties'].hasOwnProperty(field)
                                && ignoredKeys.indexOf(field) === -1
                                && data.network1["contexts"][schemaName].hasOwnProperty(field)){
                                let field_base_type = viewer.process_name(data.network1["contexts"][schemaName][field]);
                                if (field_base_type !== false){
                                    output.content.isolated_schemas[iterator]["fields"].push([
                                        field_base_type,
                                        field,
                                        false
                                    ])
                                }

                            }
                        }


                    }
                    it++;
                }
                for (let schemaName in data.network2.schemas){
                    if (data.network2.schemas.hasOwnProperty(schemaName) && processed_schemas.network2.indexOf(schemaName) === -1){
                        let iterator = "schema" + it.toString();
                        let schemaValue = data.network2.schemas[schemaName];
                        let attribute = schemaName.replace(/^\w/, c => c.toUpperCase()).replace("_schema.json", "");
                        let schema_base_type = data.network2["contexts"][schemaName][attribute];
                        output.content.isolated_schemas[iterator] = {};
                        output.content.isolated_schemas[iterator]["schemas"] = [schema_base_type, false, schemaValue.title];
                        output.content.isolated_schemas[iterator]["fields"] = [];

                        for (let field in schemaValue['properties']){
                            if (schemaValue['properties'].hasOwnProperty(field)
                                && ignoredKeys.indexOf(field) === -1
                                && data.network2["contexts"][schemaName].hasOwnProperty(field)){
                                let field_base_type = viewer.process_name(data.network2["contexts"][schemaName][field]);
                                if (field_base_type !== false){
                                    output.content.isolated_schemas[iterator]["fields"].push([
                                        field_base_type,
                                        false,
                                        field
                                    ])
                                }

                            }
                        }


                    }
                    it++;
                }

                return output;
            };

            viewer.process_name = function(field){
                if (typeof field === 'string') {
                    return field
                }
                else if (field.hasOwnProperty('@id') && field["@id"]!==""){
                    return field["@id"]
                }
                else {
                    return false;
                }
            }
        }]
    );

    my_app.filter('typeOf', function() {
        return function (obj) {
            return typeof obj;
        };
    });

})();