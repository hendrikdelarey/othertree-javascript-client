// <script language="javascript"  type="text/javascript" src="lib/othertree.min.js"></script>

requirejs(["../lib/othertree.min.js"], function(util) {
    window.clientA=new util.OtherTreeClient("","");
    
   var s = function( p ) {

        var x = 100; 
        var y = 100;

        p.setup = function() {
            p.createCanvas(700, 410);
        };

        p.draw = function() {
            p.background(0);
            p.fill(255);
            p.rect(x,y,50,50);
        };
    };

    var myp5 = new p5(s);

    // console.log("hello world"); 
});


