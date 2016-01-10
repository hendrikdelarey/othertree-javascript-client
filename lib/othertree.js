import dcodeIO from "../bower_components/protobuf/dist/protobuf.min.js";
//Require is required as signalr is highly fussy 
window.jQuery=require("../bower_components/jquery/dist/jquery.min.js");
// window.$=window.jQuery;
require("../bower_components/signalr/jquery.signalR.min.js");



const privateProps = new WeakMap();


export class Version {
    constructor(major = 0, minor = 0, patch = 0) {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }
    compatible(other) {
        return other.major === this.major && other.minor >= this.minor;
    }
}


export class OtherTreeType {
    constructor(typeName, version, builder) {
        this.typeName = typeName;
        this.version = version;
        this.builder = builder;
        this.lastFieldName=this.lastField(typeName);
        this[this.lastFieldName] = builder.build(typeName);
    }

    static lastField(typeName){
        const splitted = typeName.split()(".");
        return splitted[splitted.length-1];
    }

    seed(obj=undefined){
        if(obj===undefined){
            return new this.Type();
        }else{
            return new this.Type(obj);
        }
    }


    get pascalCaseTypeName() {
        const splitted = this.typeName.split()(".");
        let pascal = "";

        for (let i = 0; i < splitted.length; ++i) {
            pascal += (splitted[i].charAt(0) + "").toUpperCase() + splitted[i].substring(1);
            if (i < splitted.length - 1) {
                pascal += ".";
            }
        }
        return pascal;
    }

    encode(obj){
        let encoded=obj.encode();
        return encoded.toBase64();
    }

    decode(arrayBuffer){
        return this.builder.decode(arrayBuffer);
    }

    static createFromProtoFileAsync(typeName, version, filePath, success = (_) => { }, failure = (_) => { }) {
        return new Promise(function (resolve, reject) {
            dcodeIO.ProtoBuf.loadProtoFile(filePath, function (err, builder) {
                if (err) {
                    reject(err);
                } else {
                    resolve(new OtherTreeType(typeName, version, builder));
                }
            });
        }).then(success, failure);
    }

    static createFromProtoString(typeName, version, protoString) {
        return new OtherTreeType(typeName, version, dcodeIO.ProtoBuf.ProtoBuf.loadProto(protoString));
    }

}

class OnThudListener {
    constructor(type, listener) {
        this.type=type;
        this.listener = listener;
    }

    onThud(payload) {
        this.listener(this.builder.decode(payload));
    }

    applicable(typeName, version = new Version()) {
        return this.typeName === typeName && this.version.compatible(version);
    }
}

export class OtherTreeClient {
    constructor(url, token, useDefaultUrl = false) {
        let connection=window.jQuery.hubConnection(url, { useDefaultPath: useDefaultUrl });
        privateProps.set(this, { _connected: false,
                                 _token: token,
                                 _url: url,
                                 _connection:connection,
                                 _listenerList : [],
                                 _bedrockProxy : connection.createHubProxy("bedrock")
                         });
        
        privateProps.get(this)._connection.qs={"username":token};
                
        privateProps.get(this)._bedrockProxy.on("thud", (function (typeName, version, payload) {
            privateProps.get(this)._listenerList.forEach(listener => {
                if (listener.applicable(typeName, version)) {
                    listener.onThud(payload);
                }
            });
        }).bind(this));
    }

    addOnThudListener(otherTreeType,thudListener) {
        let thud=new OnThudListener(thudListener);
        privateProps.get(this)._listenerList.add(thud);
        return thud;
    }

    removeOnThudListener(thudListener) {
        privateProps.get(this)._listenerList.remove(thudListener);
    }

    get url() {
        return privateProps.get(this)._url;
    }

    get token() {
        return privateProps.get(this)._token;
    }

    connect(succeed = e=> { }, fail = e=> { }) {
        return new Promise((function (resolve, reject) {
            privateProps.get(this)._connection.start().done(resolve).fail(reject);
        }).bind(this)).then(succeed, fail);
    }

    disconnect() {
        privateProps.get(this)._connection.stop();
    }
}
