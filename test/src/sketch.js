// <script language="javascript"  type="text/javascript" src="lib/othertree.min.js"></script>

requirejs(["../lib/othertree.min.js"], function(otherTree) {
    
    var guid=function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + "-" + s4() + '-' + s4() + '-' +
        s4() + "-" + s4() + s4() + s4();
    };
    
   window.client=new otherTree.OtherTreeClient("http://othertree-dev-cloudservice.cloudapp.net:8080",guid(),true);        
   var s = function( p ) {

        var x = 100; 
        var y = 100;
        
        p.setup = function() {
            p.createCanvas(p.windowWidth,p.windowHeight);            
            otherTree.OtherTreeType.createTypesFromProtoFileAsync("wimt.routethink",["AlertSubscription","Alert","EntitySelector","AlertMessage","BoundingBox","Point"],"src/proto/Alert.proto",
                function(type){
                    window.client.addOnThudListener(type.Alert,function(alert){
                        console.log("Received alert");
                        console.log(alert.messages[0].message);
                    });
                    var charge=new type.AlertSubscription();
                    var selector=new type.EntitySelector();
                    selector.set_agency_id("Jammie");                    
                    charge.entitySelectors.push(selector);                    
                    window.client.connect(function(){
                        console.log("connected");
                        window.client.charge(charge,function(c){                                                    
                            console.log("Charged");
                        },function(e){
                            console.log("Charge failed");
                            console.log(e);
                        });
                    }, function(){
                        console.log("failed to connect");
                    });

                    
                },function(e){
                    console.log("failed creating proto type");
                    console.log(e);
                });
        };


        p.draw = function() {
            p.background(0, 100, 200);
            p.fill(255);
            p.rect(x,y,50,50);
        };
        
        p.windowResized=function(){
              p.resizeCanvas(p.windowWidth, p.windowHeight);
        };
    };

    var myp5 = new p5(s);    
});



