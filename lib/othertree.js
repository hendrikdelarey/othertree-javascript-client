import * as signalr from "signalr";
import * as byteBuffer from "bytebuffer";
 // let byteBuffer=require("bytebuffer");

export class OtherTreeClient {
    constructor(url, token) {
        this.token = token;
        this.url=url;
        this.tempBuffer = byteBuffer.ByteBuffer.allocate(1024);
    }
    connect(){
        signalr.connect()
    }
}
