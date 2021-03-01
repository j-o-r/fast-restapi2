# fast-restapi 2

Fast http api server

module type es6 ready

```
npm install --save fast-restapi2
```

```
import server from 'fast-restapi2';

class TestController {

  /**
   * index
   *
   * @static
   * @param  {import('../node_modules/fast-restapi2/lib/ClientWrapper.js').default} client - Client request, response wrapper.
   * @param {Array} params - url parts as strings
   */
  static index(client,params){
    // http://127.0.0.1:9022/api/index
    client.serve(200,{'joe':['bar']});
  };
  /**
   * visitme
   *
   * @static
   * @param  {import('../node_modules/fast-restapi2/lib/ClientWrapper.js').default} client - Client request, response wrapper.
   * @param {Array} params - url parts as strings
   */
  static visitme(client,params){
    // http://127.0.0.1:9022/api/visitme/param1/param2
    client.serve(200,{params:params});
  };
}

server.create('api',{port:9022,host:'127.0.0.1'},TestController).then((res){
  console.log(res)
}).catch((error) => {
  console.error(error);
});

process.stdin.resume();
```

