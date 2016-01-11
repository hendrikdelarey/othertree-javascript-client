// import ByteBuffer from "../bower_components/bytebuffer/dist/ByteBufferAB.min.js";
import ProtoBuf from "../bower_components/protobuf/dist/protobuf.min.js";
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
        return other===null ||(other.major === this.major && other.minor >= this.minor);
    }
}

let toWeakTypeArray=function(arr){
    let typeArr=new Array();
    let currentInstance=null;
    for(let i=0; i<arr.length; ++i){
        if(arr[i] instanceof Version){
            if(currentInstance!==null){
                throw "Ensure that all version types are preceeded by a type name in the proto type descriptor array";
            }else{
                currentInstance.version=arr[i];
            }
            currentInstance=null;                        
        }else if(typeof(arr[i])==="string" || arr[i] instanceof String) {
            currentInstance=new OtherTreeWeakType(arr[i]);
            typeArr.push(currentInstance);            
        }else{
            throw "The type descriptor array can only contain versions and strings";
        }
    }
    return typeArr;
    
};

let extend = function(cls,type) {

    //which returns a constructor
    function otherTreeTypeWrapperProto() {

        //that calls the parent constructor with itself as scope
        cls.apply(this, arguments);

        //the additional field
        this._type = type;
    }

    //make the prototype an instance of the old class
    otherTreeTypeWrapperProto.prototype = Object.create(cls.prototype);
    
    return otherTreeTypeWrapperProto;
};

export class OtherTreeWeakType {
    constructor(typeName, version=new Version()){
        this.name=typeName;
        this.version=version;
    }
}

// let tempBuffer = ByteBuffer.allocate(1024);


export class OtherTreeType {
        
    constructor(typeName, version, builder) {
        this.typeName = typeName;
        this.version = version;        
        this.lastFieldName=OtherTreeType.lastField(typeName);
        let built=builder.build(typeName);
        let type=extend(built,this);
        this.decode=built.decode;
        this[this.lastFieldName] = type;                                
    }

    static lastField(typeName){
        let splitted = (typeName+"").split(".");
        return splitted[splitted.length-1];
    }


    get pascalCaseTypeName() {
        let splitted = (this.typeName+"").split(".");
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
        return obj.encode().toBase64();
    }    

    static createTypeFromProtoFileAsync(typeName, version, filePath, success = (_) => { }, failure = (_) => { }) {
        if(version===undefined || version===null){
            version=new Version();
        }
        return new Promise(function (resolve, reject) {
            ProtoBuf.loadProtoFile(filePath, function (err, builder) {
                if (err) {
                    reject(err);
                } else {
                    resolve(new OtherTreeType(typeName, version, builder)[OtherTreeType.lastField(typeName)]);
                }
            });
        }).then(success, failure);
    }
    
    static createTypesFromProtoFileAsync(namespace, typeDefs, filePath, success = (_) => { }, failure = (_) => { }) {
        typeDefs=toWeakTypeArray(typeDefs);
        return new Promise(function (resolve, reject) {
            ProtoBuf.loadProtoFile(filePath, function (err, builder) {
                if (err) {
                    reject(err);
                } else {
                    let types=new Object();
                    let namespaceDefined=(namespace!==undefined || namespace!=="" || namespace!==null);
                    typeDefs.forEach( typeDef =>{
                        let name=typeDef.name;                        
                        if(namespaceDefined){
                            name=namespace+"."+name;
                        }
                        types[typeDef.name]=new OtherTreeType(name, typeDef.version, builder)[OtherTreeType.lastField(name)];
                    });
                    resolve(types);
                }
            });
        }).then(success, failure);
    }

    static createTypeFromProtoString(typeName, version, protoString) {        
        return new OtherTreeType(typeName, version, ProtoBuf.loadProto(protoString))[OtherTreeType.lastField(typeName)];
    }
    
    static createTypesFromProtoString(namespace, typeDefs, version, protoString) {
        typeDefs=toWeakTypeArray(typeDefs);
        let builder=ProtoBuf.loadProto(protoString);                        
        let namespaceDefined=(namespace!==undefined || namespace!=="" || namespace!==null);
        let types=new Object();
        typeDefs.forEach( typeDef =>{
                    let name=typeDef.name;                        
                    if(namespaceDefined){
                        name=namespace+"."+name;
                    }
                    types[typeDef.name]=new OtherTreeType(name, typeDef.version, builder)[OtherTreeType.lastField(name)];
        });
        return types;
    }
}

class OnThudListener {
    constructor(type, listener) {
        this.type=type;
        this.listener = listener;
    }

    onThud(payload) {
        this.listener(this.type.decode(payload));
    }

    applicable(typeName, version = new Version()) {
        return typeName === this.type.pascalCaseTypeName && this.type.version.compatible(version);        
    }
}

export class OtherTreeClient {
    constructor(url, token, useDefaultUrl = true) {
        let connection=window.jQuery.hubConnection(url, { useDefaultPath: useDefaultUrl });
        privateProps.set(this, { _connected: false,
                                 _token: token,
                                 _url: url,
                                 _connection:connection,
                                 _listenerList : [],
                                 _bedrockProxy : connection.createHubProxy("Bedrock")
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
        let thud=new OnThudListener(new otherTreeType()._type,thudListener);        
        privateProps.get(this)._listenerList.push(thud);
        return thud;
    }

    removeOnThudListener(thudListener) {
        let index=privateProps.get(this)._listenerList.indexOf(thudListener);
        privateProps.get(this)._listenerList.splice(index,1);
    }
    get url() {
        return privateProps.get(this)._url;
    }

    get token() {
        return privateProps.get(this)._token;
    }

    connect(succeed = r=> { }, fail = e=> { }) {
        return new Promise((resolve, reject) =>{
            privateProps.get(this)._connection.start().done(resolve).fail(reject);
        }).then(succeed, fail);
    }
    
    charge(obj,succeed = r=> { }, fail = e=> { }){
        return new Promise((resolve, reject) =>{
            privateProps.get(this)._bedrockProxy.invoke("Charge", obj._type.pascalCaseTypeName,obj._type.version,obj._type.encode(obj)).done(resolve).fail(reject);
        }).then(succeed,fail);                
    }
    
    discharge(chargeHandle,succeed = r=> { }, fail = e=> { }){
        return new Promise((resolve, reject) =>{
            privateProps.get(this)._bedrockProxy.invoke("Discharge", chargeHandle).done(resolve).fail(reject);
        }).then(succeed,fail);           
    }
    
    water(obj,succeed = r=> { }, fail = e=> { }){
        return new Promise((resolve, reject) =>{
            privateProps.get(this)._bedrockProxy.invoke("Water", obj._type.pascalCaseTypeName,obj._type.version,obj._type.encode(obj)).done(resolve).fail(reject);
        }).then(succeed,fail);                
    }

    disconnect() {
        privateProps.get(this)._connection.stop();
    }
}
