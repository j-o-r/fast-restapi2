# fast-restapi 2

Fast http api server

```
class TestController {

  static index(client,params){
    // http://127.0.0.1:9022/api/index
    client.serve(200,{'joe':['bar']});
  };

  static visitme(client,params){
    // http://127.0.0.1:9022/api/visitme/param1/param2
    client.serve(200,{params:params});
  };
}

var server = require('fast-restapi');
server.create('api',{port:9022,host:'127.0.0.1'},TestController, function(res){
  // console.log(res)
});
```
