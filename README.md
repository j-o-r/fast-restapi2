# fast-restapi 2

Fast http api server

module type es6 ready

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

import server from 'fast-restapi2';
server.create('api',{port:9022,host:'127.0.0.1'},TestController, function(res){
  // console.log(res)
});
```
