(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';var _typeof=typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"?function(obj){return typeof obj;}:function(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol?"symbol":typeof obj;}; /*
 Copyright 2013-2014 Daniel Wirtz <dcode@dcode.io>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */ /**
 * @license ByteBuffer.js (c) 2013-2014 Daniel Wirtz <dcode@dcode.io>
 * This version of ByteBuffer.js uses an ArrayBuffer as its backing buffer which is accessed through a DataView and is
 * compatible with modern browsers.
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/ByteBuffer.js for details
 */ //
(function(global){"use strict"; /**
     * @param {function(new: Long, number, number, boolean=)=} Long
     * @returns {function(new: ByteBuffer, number=, boolean=, boolean=)}}
     * @inner
     */function loadByteBuffer(Long){ /**
         * Constructs a new ByteBuffer.
         * @class The swiss army knife for binary data in JavaScript.
         * @exports ByteBuffer
         * @constructor
         * @param {number=} capacity Initial capacity. Defaults to {@link ByteBuffer.DEFAULT_CAPACITY}.
         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
         * @expose
         */var ByteBuffer=function ByteBuffer(capacity,littleEndian,noAssert){if(typeof capacity==='undefined')capacity=ByteBuffer.DEFAULT_CAPACITY;if(typeof littleEndian==='undefined')littleEndian=ByteBuffer.DEFAULT_ENDIAN;if(typeof noAssert==='undefined')noAssert=ByteBuffer.DEFAULT_NOASSERT;if(!noAssert){capacity=capacity|0;if(capacity<0)throw RangeError("Illegal capacity");littleEndian=!!littleEndian;noAssert=!!noAssert;} /**
             * Backing buffer.
             * @type {!ArrayBuffer}
             * @expose
             */this.buffer=capacity===0?EMPTY_BUFFER:new ArrayBuffer(capacity); /**
             * Data view to manipulate the backing buffer. Becomes `null` if the backing buffer has a capacity of `0`.
             * @type {?DataView}
             * @expose
             */this.view=capacity===0?null:new DataView(this.buffer); /**
             * Absolute read/write offset.
             * @type {number}
             * @expose
             * @see ByteBuffer#flip
             * @see ByteBuffer#clear
             */this.offset=0; /**
             * Marked offset.
             * @type {number}
             * @expose
             * @see ByteBuffer#mark
             * @see ByteBuffer#reset
             */this.markedOffset=-1; /**
             * Absolute limit of the contained data. Set to the backing buffer's capacity upon allocation.
             * @type {number}
             * @expose
             * @see ByteBuffer#flip
             * @see ByteBuffer#clear
             */this.limit=capacity; /**
             * Whether to use little endian byte order, defaults to `false` for big endian.
             * @type {boolean}
             * @expose
             */this.littleEndian=typeof littleEndian!=='undefined'?!!littleEndian:false; /**
             * Whether to skip assertions of offsets and values, defaults to `false`.
             * @type {boolean}
             * @expose
             */this.noAssert=!!noAssert;}; /**
         * ByteBuffer version.
         * @type {string}
         * @const
         * @expose
         */ByteBuffer.VERSION="3.5.5"; /**
         * Little endian constant that can be used instead of its boolean value. Evaluates to `true`.
         * @type {boolean}
         * @const
         * @expose
         */ByteBuffer.LITTLE_ENDIAN=true; /**
         * Big endian constant that can be used instead of its boolean value. Evaluates to `false`.
         * @type {boolean}
         * @const
         * @expose
         */ByteBuffer.BIG_ENDIAN=false; /**
         * Default initial capacity of `16`.
         * @type {number}
         * @expose
         */ByteBuffer.DEFAULT_CAPACITY=16; /**
         * Default endianess of `false` for big endian.
         * @type {boolean}
         * @expose
         */ByteBuffer.DEFAULT_ENDIAN=ByteBuffer.BIG_ENDIAN; /**
         * Default no assertions flag of `false`.
         * @type {boolean}
         * @expose
         */ByteBuffer.DEFAULT_NOASSERT=false; /**
         * A `Long` class for representing a 64-bit two's-complement integer value. May be `null` if Long.js has not been loaded
         *  and int64 support is not available.
         * @type {?Long}
         * @const
         * @see https://github.com/dcodeIO/Long.js
         * @expose
         */ByteBuffer.Long=Long||null; /**
         * @alias ByteBuffer.prototype
         * @inner
         */var ByteBufferPrototype=ByteBuffer.prototype; // helpers
/**
         * @type {!ArrayBuffer}
         * @inner
         */var EMPTY_BUFFER=new ArrayBuffer(0); /**
         * String.fromCharCode reference for compile-time renaming.
         * @type {function(...number):string}
         * @inner
         */var stringFromCharCode=String.fromCharCode; /**
         * Creates a source function for a string.
         * @param {string} s String to read from
         * @returns {function():number|null} Source function returning the next char code respectively `null` if there are
         *  no more characters left.
         * @throws {TypeError} If the argument is invalid
         * @inner
         */function stringSource(s){var i=0;return function(){return i<s.length?s.charCodeAt(i++):null;};} /**
         * Creates a destination function for a string.
         * @returns {function(number=):undefined|string} Destination function successively called with the next char code.
         *  Returns the final string when called without arguments.
         * @inner
         */function stringDestination(){var cs=[],ps=[];return function(){if(arguments.length===0)return ps.join('')+stringFromCharCode.apply(String,cs);if(cs.length+arguments.length>1024)ps.push(stringFromCharCode.apply(String,cs)),cs.length=0;Array.prototype.push.apply(cs,arguments);};} /**
         * Allocates a new ByteBuffer backed by a buffer of the specified capacity.
         * @param {number=} capacity Initial capacity. Defaults to {@link ByteBuffer.DEFAULT_CAPACITY}.
         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
         * @returns {!ByteBuffer}
         * @expose
         */ByteBuffer.allocate=function(capacity,littleEndian,noAssert){return new ByteBuffer(capacity,littleEndian,noAssert);}; /**
         * Concatenates multiple ByteBuffers into one.
         * @param {!Array.<!ByteBuffer|!ArrayBuffer|!Uint8Array|string>} buffers Buffers to concatenate
         * @param {(string|boolean)=} encoding String encoding if `buffers` contains a string ("base64", "hex", "binary",
         *  defaults to "utf8")
         * @param {boolean=} littleEndian Whether to use little or big endian byte order for the resulting ByteBuffer. Defaults
         *  to {@link ByteBuffer.DEFAULT_ENDIAN}.
         * @param {boolean=} noAssert Whether to skip assertions of offsets and values for the resulting ByteBuffer. Defaults to
         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
         * @returns {!ByteBuffer} Concatenated ByteBuffer
         * @expose
         */ByteBuffer.concat=function(buffers,encoding,littleEndian,noAssert){if(typeof encoding==='boolean'||typeof encoding!=='string'){noAssert=littleEndian;littleEndian=encoding;encoding=undefined;}var capacity=0;for(var i=0,k=buffers.length,length;i<k;++i){if(!ByteBuffer.isByteBuffer(buffers[i]))buffers[i]=ByteBuffer.wrap(buffers[i],encoding);length=buffers[i].limit-buffers[i].offset;if(length>0)capacity+=length;}if(capacity===0)return new ByteBuffer(0,littleEndian,noAssert);var bb=new ByteBuffer(capacity,littleEndian,noAssert),bi;var view=new Uint8Array(bb.buffer);i=0;while(i<k){bi=buffers[i++];length=bi.limit-bi.offset;if(length<=0)continue;view.set(new Uint8Array(bi.buffer).subarray(bi.offset,bi.limit),bb.offset);bb.offset+=length;}bb.limit=bb.offset;bb.offset=0;return bb;}; /**
         * Tests if the specified type is a ByteBuffer.
         * @param {*} bb ByteBuffer to test
         * @returns {boolean} `true` if it is a ByteBuffer, otherwise `false`
         * @expose
         */ByteBuffer.isByteBuffer=function(bb){return (bb&&bb instanceof ByteBuffer)===true;}; /**
         * Gets the backing buffer type.
         * @returns {Function} `Buffer` for NB builds, `ArrayBuffer` for AB builds (classes)
         * @expose
         */ByteBuffer.type=function(){return ArrayBuffer;}; /**
         * Wraps a buffer or a string. Sets the allocated ByteBuffer's {@link ByteBuffer#offset} to `0` and its
         *  {@link ByteBuffer#limit} to the length of the wrapped data.
         * @param {!ByteBuffer|!ArrayBuffer|!Uint8Array|string|!Array.<number>} buffer Anything that can be wrapped
         * @param {(string|boolean)=} encoding String encoding if `buffer` is a string ("base64", "hex", "binary", defaults to
         *  "utf8")
         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
         * @returns {!ByteBuffer} A ByteBuffer wrapping `buffer`
         * @expose
         */ByteBuffer.wrap=function(buffer,encoding,littleEndian,noAssert){if(typeof encoding!=='string'){noAssert=littleEndian;littleEndian=encoding;encoding=undefined;}if(typeof buffer==='string'){if(typeof encoding==='undefined')encoding="utf8";switch(encoding){case "base64":return ByteBuffer.fromBase64(buffer,littleEndian);case "hex":return ByteBuffer.fromHex(buffer,littleEndian);case "binary":return ByteBuffer.fromBinary(buffer,littleEndian);case "utf8":return ByteBuffer.fromUTF8(buffer,littleEndian);case "debug":return ByteBuffer.fromDebug(buffer,littleEndian);default:throw Error("Unsupported encoding: "+encoding);}}if(buffer===null||(typeof buffer==='undefined'?'undefined':_typeof(buffer))!=='object')throw TypeError("Illegal buffer");var bb;if(ByteBuffer.isByteBuffer(buffer)){bb=ByteBufferPrototype.clone.call(buffer);bb.markedOffset=-1;return bb;}if(buffer instanceof Uint8Array){ // Extract ArrayBuffer from Uint8Array
bb=new ByteBuffer(0,littleEndian,noAssert);if(buffer.length>0){ // Avoid references to more than one EMPTY_BUFFER
bb.buffer=buffer.buffer;bb.offset=buffer.byteOffset;bb.limit=buffer.byteOffset+buffer.length;bb.view=buffer.length>0?new DataView(buffer.buffer):null;}}else if(buffer instanceof ArrayBuffer){ // Reuse ArrayBuffer
bb=new ByteBuffer(0,littleEndian,noAssert);if(buffer.byteLength>0){bb.buffer=buffer;bb.offset=0;bb.limit=buffer.byteLength;bb.view=buffer.byteLength>0?new DataView(buffer):null;}}else if(Object.prototype.toString.call(buffer)==="[object Array]"){ // Create from octets
bb=new ByteBuffer(buffer.length,littleEndian,noAssert);bb.limit=buffer.length;for(i=0;i<buffer.length;++i){bb.view.setUint8(i,buffer[i]);}}else throw TypeError("Illegal buffer"); // Otherwise fail
return bb;}; // types/ints/int8
/**
         * Writes an 8bit signed integer.
         * @param {number} value Value to write
         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.writeInt8=function(value,offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof value!=='number'||value%1!==0)throw TypeError("Illegal value: "+value+" (not an integer)");value|=0;if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}offset+=1;var capacity0=this.buffer.byteLength;if(offset>capacity0)this.resize((capacity0*=2)>offset?capacity0:offset);offset-=1;this.view.setInt8(offset,value);if(relative)this.offset+=1;return this;}; /**
         * Writes an 8bit signed integer. This is an alias of {@link ByteBuffer#writeInt8}.
         * @function
         * @param {number} value Value to write
         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.writeByte=ByteBufferPrototype.writeInt8; /**
         * Reads an 8bit signed integer.
         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
         * @returns {number} Value read
         * @expose
         */ByteBufferPrototype.readInt8=function(offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+1>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);}var value=this.view.getInt8(offset);if(relative)this.offset+=1;return value;}; /**
         * Reads an 8bit signed integer. This is an alias of {@link ByteBuffer#readInt8}.
         * @function
         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
         * @returns {number} Value read
         * @expose
         */ByteBufferPrototype.readByte=ByteBufferPrototype.readInt8; /**
         * Writes an 8bit unsigned integer.
         * @param {number} value Value to write
         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.writeUint8=function(value,offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof value!=='number'||value%1!==0)throw TypeError("Illegal value: "+value+" (not an integer)");value>>>=0;if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}offset+=1;var capacity1=this.buffer.byteLength;if(offset>capacity1)this.resize((capacity1*=2)>offset?capacity1:offset);offset-=1;this.view.setUint8(offset,value);if(relative)this.offset+=1;return this;}; /**
         * Reads an 8bit unsigned integer.
         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `1` if omitted.
         * @returns {number} Value read
         * @expose
         */ByteBufferPrototype.readUint8=function(offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+1>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);}var value=this.view.getUint8(offset);if(relative)this.offset+=1;return value;}; // types/ints/int16
/**
         * Writes a 16bit signed integer.
         * @param {number} value Value to write
         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
         * @throws {TypeError} If `offset` or `value` is not a valid number
         * @throws {RangeError} If `offset` is out of bounds
         * @expose
         */ByteBufferPrototype.writeInt16=function(value,offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof value!=='number'||value%1!==0)throw TypeError("Illegal value: "+value+" (not an integer)");value|=0;if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}offset+=2;var capacity2=this.buffer.byteLength;if(offset>capacity2)this.resize((capacity2*=2)>offset?capacity2:offset);offset-=2;this.view.setInt16(offset,value,this.littleEndian);if(relative)this.offset+=2;return this;}; /**
         * Writes a 16bit signed integer. This is an alias of {@link ByteBuffer#writeInt16}.
         * @function
         * @param {number} value Value to write
         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
         * @throws {TypeError} If `offset` or `value` is not a valid number
         * @throws {RangeError} If `offset` is out of bounds
         * @expose
         */ByteBufferPrototype.writeShort=ByteBufferPrototype.writeInt16; /**
         * Reads a 16bit signed integer.
         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
         * @returns {number} Value read
         * @throws {TypeError} If `offset` is not a valid number
         * @throws {RangeError} If `offset` is out of bounds
         * @expose
         */ByteBufferPrototype.readInt16=function(offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+2>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+2+") <= "+this.buffer.byteLength);}var value=this.view.getInt16(offset,this.littleEndian);if(relative)this.offset+=2;return value;}; /**
         * Reads a 16bit signed integer. This is an alias of {@link ByteBuffer#readInt16}.
         * @function
         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
         * @returns {number} Value read
         * @throws {TypeError} If `offset` is not a valid number
         * @throws {RangeError} If `offset` is out of bounds
         * @expose
         */ByteBufferPrototype.readShort=ByteBufferPrototype.readInt16; /**
         * Writes a 16bit unsigned integer.
         * @param {number} value Value to write
         * @param {number=} offset Offset to write to. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
         * @throws {TypeError} If `offset` or `value` is not a valid number
         * @throws {RangeError} If `offset` is out of bounds
         * @expose
         */ByteBufferPrototype.writeUint16=function(value,offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof value!=='number'||value%1!==0)throw TypeError("Illegal value: "+value+" (not an integer)");value>>>=0;if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}offset+=2;var capacity3=this.buffer.byteLength;if(offset>capacity3)this.resize((capacity3*=2)>offset?capacity3:offset);offset-=2;this.view.setUint16(offset,value,this.littleEndian);if(relative)this.offset+=2;return this;}; /**
         * Reads a 16bit unsigned integer.
         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `2` if omitted.
         * @returns {number} Value read
         * @throws {TypeError} If `offset` is not a valid number
         * @throws {RangeError} If `offset` is out of bounds
         * @expose
         */ByteBufferPrototype.readUint16=function(offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+2>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+2+") <= "+this.buffer.byteLength);}var value=this.view.getUint16(offset,this.littleEndian);if(relative)this.offset+=2;return value;}; // types/ints/int32
/**
         * Writes a 32bit signed integer.
         * @param {number} value Value to write
         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
         * @expose
         */ByteBufferPrototype.writeInt32=function(value,offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof value!=='number'||value%1!==0)throw TypeError("Illegal value: "+value+" (not an integer)");value|=0;if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}offset+=4;var capacity4=this.buffer.byteLength;if(offset>capacity4)this.resize((capacity4*=2)>offset?capacity4:offset);offset-=4;this.view.setInt32(offset,value,this.littleEndian);if(relative)this.offset+=4;return this;}; /**
         * Writes a 32bit signed integer. This is an alias of {@link ByteBuffer#writeInt32}.
         * @param {number} value Value to write
         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
         * @expose
         */ByteBufferPrototype.writeInt=ByteBufferPrototype.writeInt32; /**
         * Reads a 32bit signed integer.
         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
         * @returns {number} Value read
         * @expose
         */ByteBufferPrototype.readInt32=function(offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+4>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+4+") <= "+this.buffer.byteLength);}var value=this.view.getInt32(offset,this.littleEndian);if(relative)this.offset+=4;return value;}; /**
         * Reads a 32bit signed integer. This is an alias of {@link ByteBuffer#readInt32}.
         * @param {number=} offset Offset to read from. Will use and advance {@link ByteBuffer#offset} by `4` if omitted.
         * @returns {number} Value read
         * @expose
         */ByteBufferPrototype.readInt=ByteBufferPrototype.readInt32; /**
         * Writes a 32bit unsigned integer.
         * @param {number} value Value to write
         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
         * @expose
         */ByteBufferPrototype.writeUint32=function(value,offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof value!=='number'||value%1!==0)throw TypeError("Illegal value: "+value+" (not an integer)");value>>>=0;if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}offset+=4;var capacity5=this.buffer.byteLength;if(offset>capacity5)this.resize((capacity5*=2)>offset?capacity5:offset);offset-=4;this.view.setUint32(offset,value,this.littleEndian);if(relative)this.offset+=4;return this;}; /**
         * Reads a 32bit unsigned integer.
         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
         * @returns {number} Value read
         * @expose
         */ByteBufferPrototype.readUint32=function(offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+4>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+4+") <= "+this.buffer.byteLength);}var value=this.view.getUint32(offset,this.littleEndian);if(relative)this.offset+=4;return value;}; // types/ints/int64
if(Long){ /**
             * Writes a 64bit signed integer.
             * @param {number|!Long} value Value to write
             * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
             * @returns {!ByteBuffer} this
             * @expose
             */ByteBufferPrototype.writeInt64=function(value,offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof value==='number')value=Long.fromNumber(value);else if(typeof value==='string')value=Long.fromString(value);else if(!(value&&value instanceof Long))throw TypeError("Illegal value: "+value+" (not an integer or Long)");if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}if(typeof value==='number')value=Long.fromNumber(value);else if(typeof value==='string')value=Long.fromString(value);offset+=8;var capacity6=this.buffer.byteLength;if(offset>capacity6)this.resize((capacity6*=2)>offset?capacity6:offset);offset-=8;if(this.littleEndian){this.view.setInt32(offset,value.low,true);this.view.setInt32(offset+4,value.high,true);}else {this.view.setInt32(offset,value.high,false);this.view.setInt32(offset+4,value.low,false);}if(relative)this.offset+=8;return this;}; /**
             * Writes a 64bit signed integer. This is an alias of {@link ByteBuffer#writeInt64}.
             * @param {number|!Long} value Value to write
             * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
             * @returns {!ByteBuffer} this
             * @expose
             */ByteBufferPrototype.writeLong=ByteBufferPrototype.writeInt64; /**
             * Reads a 64bit signed integer.
             * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
             * @returns {!Long}
             * @expose
             */ByteBufferPrototype.readInt64=function(offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+8>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+8+") <= "+this.buffer.byteLength);}var value=this.littleEndian?new Long(this.view.getInt32(offset,true),this.view.getInt32(offset+4,true),false):new Long(this.view.getInt32(offset+4,false),this.view.getInt32(offset,false),false);if(relative)this.offset+=8;return value;}; /**
             * Reads a 64bit signed integer. This is an alias of {@link ByteBuffer#readInt64}.
             * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
             * @returns {!Long}
             * @expose
             */ByteBufferPrototype.readLong=ByteBufferPrototype.readInt64; /**
             * Writes a 64bit unsigned integer.
             * @param {number|!Long} value Value to write
             * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
             * @returns {!ByteBuffer} this
             * @expose
             */ByteBufferPrototype.writeUint64=function(value,offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof value==='number')value=Long.fromNumber(value);else if(typeof value==='string')value=Long.fromString(value);else if(!(value&&value instanceof Long))throw TypeError("Illegal value: "+value+" (not an integer or Long)");if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}if(typeof value==='number')value=Long.fromNumber(value);else if(typeof value==='string')value=Long.fromString(value);offset+=8;var capacity7=this.buffer.byteLength;if(offset>capacity7)this.resize((capacity7*=2)>offset?capacity7:offset);offset-=8;if(this.littleEndian){this.view.setInt32(offset,value.low,true);this.view.setInt32(offset+4,value.high,true);}else {this.view.setInt32(offset,value.high,false);this.view.setInt32(offset+4,value.low,false);}if(relative)this.offset+=8;return this;}; /**
             * Reads a 64bit unsigned integer.
             * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
             * @returns {!Long}
             * @expose
             */ByteBufferPrototype.readUint64=function(offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+8>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+8+") <= "+this.buffer.byteLength);}var value=this.littleEndian?new Long(this.view.getInt32(offset,true),this.view.getInt32(offset+4,true),true):new Long(this.view.getInt32(offset+4,false),this.view.getInt32(offset,false),true);if(relative)this.offset+=8;return value;};} // Long
// types/floats/float32
/**
         * Writes a 32bit float.
         * @param {number} value Value to write
         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.writeFloat32=function(value,offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof value!=='number')throw TypeError("Illegal value: "+value+" (not a number)");if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}offset+=4;var capacity8=this.buffer.byteLength;if(offset>capacity8)this.resize((capacity8*=2)>offset?capacity8:offset);offset-=4;this.view.setFloat32(offset,value,this.littleEndian);if(relative)this.offset+=4;return this;}; /**
         * Writes a 32bit float. This is an alias of {@link ByteBuffer#writeFloat32}.
         * @function
         * @param {number} value Value to write
         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.writeFloat=ByteBufferPrototype.writeFloat32; /**
         * Reads a 32bit float.
         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
         * @returns {number}
         * @expose
         */ByteBufferPrototype.readFloat32=function(offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+4>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+4+") <= "+this.buffer.byteLength);}var value=this.view.getFloat32(offset,this.littleEndian);if(relative)this.offset+=4;return value;}; /**
         * Reads a 32bit float. This is an alias of {@link ByteBuffer#readFloat32}.
         * @function
         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `4` if omitted.
         * @returns {number}
         * @expose
         */ByteBufferPrototype.readFloat=ByteBufferPrototype.readFloat32; // types/floats/float64
/**
         * Writes a 64bit float.
         * @param {number} value Value to write
         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.writeFloat64=function(value,offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof value!=='number')throw TypeError("Illegal value: "+value+" (not a number)");if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}offset+=8;var capacity9=this.buffer.byteLength;if(offset>capacity9)this.resize((capacity9*=2)>offset?capacity9:offset);offset-=8;this.view.setFloat64(offset,value,this.littleEndian);if(relative)this.offset+=8;return this;}; /**
         * Writes a 64bit float. This is an alias of {@link ByteBuffer#writeFloat64}.
         * @function
         * @param {number} value Value to write
         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.writeDouble=ByteBufferPrototype.writeFloat64; /**
         * Reads a 64bit float.
         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
         * @returns {number}
         * @expose
         */ByteBufferPrototype.readFloat64=function(offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+8>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+8+") <= "+this.buffer.byteLength);}var value=this.view.getFloat64(offset,this.littleEndian);if(relative)this.offset+=8;return value;}; /**
         * Reads a 64bit float. This is an alias of {@link ByteBuffer#readFloat64}.
         * @function
         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by `8` if omitted.
         * @returns {number}
         * @expose
         */ByteBufferPrototype.readDouble=ByteBufferPrototype.readFloat64; // types/varints/varint32
/**
         * Maximum number of bytes required to store a 32bit base 128 variable-length integer.
         * @type {number}
         * @const
         * @expose
         */ByteBuffer.MAX_VARINT32_BYTES=5; /**
         * Calculates the actual number of bytes required to store a 32bit base 128 variable-length integer.
         * @param {number} value Value to encode
         * @returns {number} Number of bytes required. Capped to {@link ByteBuffer.MAX_VARINT32_BYTES}
         * @expose
         */ByteBuffer.calculateVarint32=function(value){ // ref: src/google/protobuf/io/coded_stream.cc
value=value>>>0;if(value<1<<7)return 1;else if(value<1<<14)return 2;else if(value<1<<21)return 3;else if(value<1<<28)return 4;else return 5;}; /**
         * Zigzag encodes a signed 32bit integer so that it can be effectively used with varint encoding.
         * @param {number} n Signed 32bit integer
         * @returns {number} Unsigned zigzag encoded 32bit integer
         * @expose
         */ByteBuffer.zigZagEncode32=function(n){return ((n|=0)<<1^n>>31)>>>0; // ref: src/google/protobuf/wire_format_lite.h
}; /**
         * Decodes a zigzag encoded signed 32bit integer.
         * @param {number} n Unsigned zigzag encoded 32bit integer
         * @returns {number} Signed 32bit integer
         * @expose
         */ByteBuffer.zigZagDecode32=function(n){return n>>>1^-(n&1)|0; // // ref: src/google/protobuf/wire_format_lite.h
}; /**
         * Writes a 32bit base 128 variable-length integer.
         * @param {number} value Value to write
         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
         *  written if omitted.
         * @returns {!ByteBuffer|number} this if `offset` is omitted, else the actual number of bytes written
         * @expose
         */ByteBufferPrototype.writeVarint32=function(value,offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof value!=='number'||value%1!==0)throw TypeError("Illegal value: "+value+" (not an integer)");value|=0;if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}var size=ByteBuffer.calculateVarint32(value),b;offset+=size;var capacity10=this.buffer.byteLength;if(offset>capacity10)this.resize((capacity10*=2)>offset?capacity10:offset);offset-=size; // ref: http://code.google.com/searchframe#WTeibokF6gE/trunk/src/google/protobuf/io/coded_stream.cc
this.view.setUint8(offset,b=value|0x80);value>>>=0;if(value>=1<<7){b=value>>7|0x80;this.view.setUint8(offset+1,b);if(value>=1<<14){b=value>>14|0x80;this.view.setUint8(offset+2,b);if(value>=1<<21){b=value>>21|0x80;this.view.setUint8(offset+3,b);if(value>=1<<28){this.view.setUint8(offset+4,value>>28&0x0F);size=5;}else {this.view.setUint8(offset+3,b&0x7F);size=4;}}else {this.view.setUint8(offset+2,b&0x7F);size=3;}}else {this.view.setUint8(offset+1,b&0x7F);size=2;}}else {this.view.setUint8(offset,b&0x7F);size=1;}if(relative){this.offset+=size;return this;}return size;}; /**
         * Writes a zig-zag encoded 32bit base 128 variable-length integer.
         * @param {number} value Value to write
         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
         *  written if omitted.
         * @returns {!ByteBuffer|number} this if `offset` is omitted, else the actual number of bytes written
         * @expose
         */ByteBufferPrototype.writeVarint32ZigZag=function(value,offset){return this.writeVarint32(ByteBuffer.zigZagEncode32(value),offset);}; /**
         * Reads a 32bit base 128 variable-length integer.
         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
         *  written if omitted.
         * @returns {number|!{value: number, length: number}} The value read if offset is omitted, else the value read
         *  and the actual number of bytes read.
         * @throws {Error} If it's not a valid varint. Has a property `truncated = true` if there is not enough data available
         *  to fully decode the varint.
         * @expose
         */ByteBufferPrototype.readVarint32=function(offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+1>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);} // ref: src/google/protobuf/io/coded_stream.cc
var size=0,value=0>>>0,temp,ioffset;do {ioffset=offset+size;if(!this.noAssert&&ioffset>this.limit){var err=Error("Truncated");err['truncated']=true;throw err;}temp=this.view.getUint8(ioffset);if(size<5)value|=(temp&0x7F)<<7*size>>>0;++size;}while((temp&0x80)===0x80);value=value|0; // Make sure to discard the higher order bits
if(relative){this.offset+=size;return value;}return {"value":value,"length":size};}; /**
         * Reads a zig-zag encoded 32bit base 128 variable-length integer.
         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
         *  written if omitted.
         * @returns {number|!{value: number, length: number}} The value read if offset is omitted, else the value read
         *  and the actual number of bytes read.
         * @throws {Error} If it's not a valid varint
         * @expose
         */ByteBufferPrototype.readVarint32ZigZag=function(offset){var val=this.readVarint32(offset);if((typeof val==='undefined'?'undefined':_typeof(val))==='object')val["value"]=ByteBuffer.zigZagDecode32(val["value"]);else val=ByteBuffer.zigZagDecode32(val);return val;}; // types/varints/varint64
if(Long){ /**
             * Maximum number of bytes required to store a 64bit base 128 variable-length integer.
             * @type {number}
             * @const
             * @expose
             */ByteBuffer.MAX_VARINT64_BYTES=10; /**
             * Calculates the actual number of bytes required to store a 64bit base 128 variable-length integer.
             * @param {number|!Long} value Value to encode
             * @returns {number} Number of bytes required. Capped to {@link ByteBuffer.MAX_VARINT64_BYTES}
             * @expose
             */ByteBuffer.calculateVarint64=function(value){if(typeof value==='number')value=Long.fromNumber(value);else if(typeof value==='string')value=Long.fromString(value); // ref: src/google/protobuf/io/coded_stream.cc
var part0=value.toInt()>>>0,part1=value.shiftRightUnsigned(28).toInt()>>>0,part2=value.shiftRightUnsigned(56).toInt()>>>0;if(part2==0){if(part1==0){if(part0<1<<14)return part0<1<<7?1:2;else return part0<1<<21?3:4;}else {if(part1<1<<14)return part1<1<<7?5:6;else return part1<1<<21?7:8;}}else return part2<1<<7?9:10;}; /**
             * Zigzag encodes a signed 64bit integer so that it can be effectively used with varint encoding.
             * @param {number|!Long} value Signed long
             * @returns {!Long} Unsigned zigzag encoded long
             * @expose
             */ByteBuffer.zigZagEncode64=function(value){if(typeof value==='number')value=Long.fromNumber(value,false);else if(typeof value==='string')value=Long.fromString(value,false);else if(value.unsigned!==false)value=value.toSigned(); // ref: src/google/protobuf/wire_format_lite.h
return value.shiftLeft(1).xor(value.shiftRight(63)).toUnsigned();}; /**
             * Decodes a zigzag encoded signed 64bit integer.
             * @param {!Long|number} value Unsigned zigzag encoded long or JavaScript number
             * @returns {!Long} Signed long
             * @expose
             */ByteBuffer.zigZagDecode64=function(value){if(typeof value==='number')value=Long.fromNumber(value,false);else if(typeof value==='string')value=Long.fromString(value,false);else if(value.unsigned!==false)value=value.toSigned(); // ref: src/google/protobuf/wire_format_lite.h
return value.shiftRightUnsigned(1).xor(value.and(Long.ONE).toSigned().negate()).toSigned();}; /**
             * Writes a 64bit base 128 variable-length integer.
             * @param {number|Long} value Value to write
             * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
             *  written if omitted.
             * @returns {!ByteBuffer|number} `this` if offset is omitted, else the actual number of bytes written.
             * @expose
             */ByteBufferPrototype.writeVarint64=function(value,offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof value==='number')value=Long.fromNumber(value);else if(typeof value==='string')value=Long.fromString(value);else if(!(value&&value instanceof Long))throw TypeError("Illegal value: "+value+" (not an integer or Long)");if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}if(typeof value==='number')value=Long.fromNumber(value,false);else if(typeof value==='string')value=Long.fromString(value,false);else if(value.unsigned!==false)value=value.toSigned();var size=ByteBuffer.calculateVarint64(value),part0=value.toInt()>>>0,part1=value.shiftRightUnsigned(28).toInt()>>>0,part2=value.shiftRightUnsigned(56).toInt()>>>0;offset+=size;var capacity11=this.buffer.byteLength;if(offset>capacity11)this.resize((capacity11*=2)>offset?capacity11:offset);offset-=size;switch(size){case 10:this.view.setUint8(offset+9,part2>>>7&0x01);case 9:this.view.setUint8(offset+8,size!==9?part2|0x80:part2&0x7F);case 8:this.view.setUint8(offset+7,size!==8?part1>>>21|0x80:part1>>>21&0x7F);case 7:this.view.setUint8(offset+6,size!==7?part1>>>14|0x80:part1>>>14&0x7F);case 6:this.view.setUint8(offset+5,size!==6?part1>>>7|0x80:part1>>>7&0x7F);case 5:this.view.setUint8(offset+4,size!==5?part1|0x80:part1&0x7F);case 4:this.view.setUint8(offset+3,size!==4?part0>>>21|0x80:part0>>>21&0x7F);case 3:this.view.setUint8(offset+2,size!==3?part0>>>14|0x80:part0>>>14&0x7F);case 2:this.view.setUint8(offset+1,size!==2?part0>>>7|0x80:part0>>>7&0x7F);case 1:this.view.setUint8(offset,size!==1?part0|0x80:part0&0x7F);}if(relative){this.offset+=size;return this;}else {return size;}}; /**
             * Writes a zig-zag encoded 64bit base 128 variable-length integer.
             * @param {number|Long} value Value to write
             * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
             *  written if omitted.
             * @returns {!ByteBuffer|number} `this` if offset is omitted, else the actual number of bytes written.
             * @expose
             */ByteBufferPrototype.writeVarint64ZigZag=function(value,offset){return this.writeVarint64(ByteBuffer.zigZagEncode64(value),offset);}; /**
             * Reads a 64bit base 128 variable-length integer. Requires Long.js.
             * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
             *  read if omitted.
             * @returns {!Long|!{value: Long, length: number}} The value read if offset is omitted, else the value read and
             *  the actual number of bytes read.
             * @throws {Error} If it's not a valid varint
             * @expose
             */ByteBufferPrototype.readVarint64=function(offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+1>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);} // ref: src/google/protobuf/io/coded_stream.cc
var start=offset,part0=0,part1=0,part2=0,b=0;b=this.view.getUint8(offset++);part0=b&0x7F;if(b&0x80){b=this.view.getUint8(offset++);part0|=(b&0x7F)<<7;if(b&0x80){b=this.view.getUint8(offset++);part0|=(b&0x7F)<<14;if(b&0x80){b=this.view.getUint8(offset++);part0|=(b&0x7F)<<21;if(b&0x80){b=this.view.getUint8(offset++);part1=b&0x7F;if(b&0x80){b=this.view.getUint8(offset++);part1|=(b&0x7F)<<7;if(b&0x80){b=this.view.getUint8(offset++);part1|=(b&0x7F)<<14;if(b&0x80){b=this.view.getUint8(offset++);part1|=(b&0x7F)<<21;if(b&0x80){b=this.view.getUint8(offset++);part2=b&0x7F;if(b&0x80){b=this.view.getUint8(offset++);part2|=(b&0x7F)<<7;if(b&0x80){throw Error("Buffer overrun");}}}}}}}}}}var value=Long.fromBits(part0|part1<<28,part1>>>4|part2<<24,false);if(relative){this.offset=offset;return value;}else {return {'value':value,'length':offset-start};}}; /**
             * Reads a zig-zag encoded 64bit base 128 variable-length integer. Requires Long.js.
             * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
             *  read if omitted.
             * @returns {!Long|!{value: Long, length: number}} The value read if offset is omitted, else the value read and
             *  the actual number of bytes read.
             * @throws {Error} If it's not a valid varint
             * @expose
             */ByteBufferPrototype.readVarint64ZigZag=function(offset){var val=this.readVarint64(offset);if(val&&val['value'] instanceof Long)val["value"]=ByteBuffer.zigZagDecode64(val["value"]);else val=ByteBuffer.zigZagDecode64(val);return val;};} // Long
// types/strings/cstring
/**
         * Writes a NULL-terminated UTF8 encoded string. For this to work the specified string must not contain any NULL
         *  characters itself.
         * @param {string} str String to write
         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
         *  contained in `str` + 1 if omitted.
         * @returns {!ByteBuffer|number} this if offset is omitted, else the actual number of bytes written
         * @expose
         */ByteBufferPrototype.writeCString=function(str,offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;var i,k=str.length;if(!this.noAssert){if(typeof str!=='string')throw TypeError("Illegal str: Not a string");for(i=0;i<k;++i){if(str.charCodeAt(i)===0)throw RangeError("Illegal str: Contains NULL-characters");}if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);} // UTF8 strings do not contain zero bytes in between except for the zero character, so:
k=utfx.calculateUTF16asUTF8(stringSource(str))[1];offset+=k+1;var capacity12=this.buffer.byteLength;if(offset>capacity12)this.resize((capacity12*=2)>offset?capacity12:offset);offset-=k+1;utfx.encodeUTF16toUTF8(stringSource(str),function(b){this.view.setUint8(offset++,b);}.bind(this));this.view.setUint8(offset++,0);if(relative){this.offset=offset;return this;}return k;}; /**
         * Reads a NULL-terminated UTF8 encoded string. For this to work the string read must not contain any NULL characters
         *  itself.
         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
         *  read if omitted.
         * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
         *  read and the actual number of bytes read.
         * @expose
         */ByteBufferPrototype.readCString=function(offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+1>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);}var start=offset,temp; // UTF8 strings do not contain zero bytes in between except for the zero character itself, so:
var sd,b=-1;utfx.decodeUTF8toUTF16(function(){if(b===0)return null;if(offset>=this.limit)throw RangeError("Illegal range: Truncated data, "+offset+" < "+this.limit);return (b=this.view.getUint8(offset++))===0?null:b;}.bind(this),sd=stringDestination(),true);if(relative){this.offset=offset;return sd();}else {return {"string":sd(),"length":offset-start};}}; // types/strings/istring
/**
         * Writes a length as uint32 prefixed UTF8 encoded string.
         * @param {string} str String to write
         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
         *  written if omitted.
         * @returns {!ByteBuffer|number} `this` if `offset` is omitted, else the actual number of bytes written
         * @expose
         * @see ByteBuffer#writeVarint32
         */ByteBufferPrototype.writeIString=function(str,offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof str!=='string')throw TypeError("Illegal str: Not a string");if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}var start=offset,k;k=utfx.calculateUTF16asUTF8(stringSource(str),this.noAssert)[1];offset+=4+k;var capacity13=this.buffer.byteLength;if(offset>capacity13)this.resize((capacity13*=2)>offset?capacity13:offset);offset-=4+k;this.view.setUint32(offset,k,this.littleEndian);offset+=4;utfx.encodeUTF16toUTF8(stringSource(str),function(b){this.view.setUint8(offset++,b);}.bind(this));if(offset!==start+4+k)throw RangeError("Illegal range: Truncated data, "+offset+" == "+(offset+4+k));if(relative){this.offset=offset;return this;}return offset-start;}; /**
         * Reads a length as uint32 prefixed UTF8 encoded string.
         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
         *  read if omitted.
         * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
         *  read and the actual number of bytes read.
         * @expose
         * @see ByteBuffer#readVarint32
         */ByteBufferPrototype.readIString=function(offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+4>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+4+") <= "+this.buffer.byteLength);}var temp=0,start=offset,str;temp=this.view.getUint32(offset,this.littleEndian);offset+=4;var k=offset+temp,sd;utfx.decodeUTF8toUTF16(function(){return offset<k?this.view.getUint8(offset++):null;}.bind(this),sd=stringDestination(),this.noAssert);str=sd();if(relative){this.offset=offset;return str;}else {return {'string':str,'length':offset-start};}}; // types/strings/utf8string
/**
         * Metrics representing number of UTF8 characters. Evaluates to `c`.
         * @type {string}
         * @const
         * @expose
         */ByteBuffer.METRICS_CHARS='c'; /**
         * Metrics representing number of bytes. Evaluates to `b`.
         * @type {string}
         * @const
         * @expose
         */ByteBuffer.METRICS_BYTES='b'; /**
         * Writes an UTF8 encoded string.
         * @param {string} str String to write
         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} if omitted.
         * @returns {!ByteBuffer|number} this if offset is omitted, else the actual number of bytes written.
         * @expose
         */ByteBufferPrototype.writeUTF8String=function(str,offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}var k;var start=offset;k=utfx.calculateUTF16asUTF8(stringSource(str))[1];offset+=k;var capacity14=this.buffer.byteLength;if(offset>capacity14)this.resize((capacity14*=2)>offset?capacity14:offset);offset-=k;utfx.encodeUTF16toUTF8(stringSource(str),function(b){this.view.setUint8(offset++,b);}.bind(this));if(relative){this.offset=offset;return this;}return offset-start;}; /**
         * Writes an UTF8 encoded string. This is an alias of {@link ByteBuffer#writeUTF8String}.
         * @function
         * @param {string} str String to write
         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} if omitted.
         * @returns {!ByteBuffer|number} this if offset is omitted, else the actual number of bytes written.
         * @expose
         */ByteBufferPrototype.writeString=ByteBufferPrototype.writeUTF8String; /**
         * Calculates the number of UTF8 characters of a string. JavaScript itself uses UTF-16, so that a string's
         *  `length` property does not reflect its actual UTF8 size if it contains code points larger than 0xFFFF.
         * @function
         * @param {string} str String to calculate
         * @returns {number} Number of UTF8 characters
         * @expose
         */ByteBuffer.calculateUTF8Chars=function(str){return utfx.calculateUTF16asUTF8(stringSource(str))[0];}; /**
         * Calculates the number of UTF8 bytes of a string.
         * @function
         * @param {string} str String to calculate
         * @returns {number} Number of UTF8 bytes
         * @expose
         */ByteBuffer.calculateUTF8Bytes=function(str){return utfx.calculateUTF16asUTF8(stringSource(str))[1];}; /**
         * Reads an UTF8 encoded string.
         * @param {number} length Number of characters or bytes to read.
         * @param {string=} metrics Metrics specifying what `length` is meant to count. Defaults to
         *  {@link ByteBuffer.METRICS_CHARS}.
         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
         *  read if omitted.
         * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
         *  read and the actual number of bytes read.
         * @expose
         */ByteBufferPrototype.readUTF8String=function(length,metrics,offset){if(typeof metrics==='number'){offset=metrics;metrics=undefined;}var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(typeof metrics==='undefined')metrics=ByteBuffer.METRICS_CHARS;if(!this.noAssert){if(typeof length!=='number'||length%1!==0)throw TypeError("Illegal length: "+length+" (not an integer)");length|=0;if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}var i=0,start=offset,sd;if(metrics===ByteBuffer.METRICS_CHARS){ // The same for node and the browser
sd=stringDestination();utfx.decodeUTF8(function(){return i<length&&offset<this.limit?this.view.getUint8(offset++):null;}.bind(this),function(cp){++i;utfx.UTF8toUTF16(cp,sd);}.bind(this));if(i!==length)throw RangeError("Illegal range: Truncated data, "+i+" == "+length);if(relative){this.offset=offset;return sd();}else {return {"string":sd(),"length":offset-start};}}else if(metrics===ByteBuffer.METRICS_BYTES){if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+length>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+length+") <= "+this.buffer.byteLength);}var k=offset+length;utfx.decodeUTF8toUTF16(function(){return offset<k?this.view.getUint8(offset++):null;}.bind(this),sd=stringDestination(),this.noAssert);if(offset!==k)throw RangeError("Illegal range: Truncated data, "+offset+" == "+k);if(relative){this.offset=offset;return sd();}else {return {'string':sd(),'length':offset-start};}}else throw TypeError("Unsupported metrics: "+metrics);}; /**
         * Reads an UTF8 encoded string. This is an alias of {@link ByteBuffer#readUTF8String}.
         * @function
         * @param {number} length Number of characters or bytes to read
         * @param {number=} metrics Metrics specifying what `n` is meant to count. Defaults to
         *  {@link ByteBuffer.METRICS_CHARS}.
         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
         *  read if omitted.
         * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
         *  read and the actual number of bytes read.
         * @expose
         */ByteBufferPrototype.readString=ByteBufferPrototype.readUTF8String; // types/strings/vstring
/**
         * Writes a length as varint32 prefixed UTF8 encoded string.
         * @param {string} str String to write
         * @param {number=} offset Offset to write to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
         *  written if omitted.
         * @returns {!ByteBuffer|number} `this` if `offset` is omitted, else the actual number of bytes written
         * @expose
         * @see ByteBuffer#writeVarint32
         */ByteBufferPrototype.writeVString=function(str,offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof str!=='string')throw TypeError("Illegal str: Not a string");if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}var start=offset,k,l;k=utfx.calculateUTF16asUTF8(stringSource(str),this.noAssert)[1];l=ByteBuffer.calculateVarint32(k);offset+=l+k;var capacity15=this.buffer.byteLength;if(offset>capacity15)this.resize((capacity15*=2)>offset?capacity15:offset);offset-=l+k;offset+=this.writeVarint32(k,offset);utfx.encodeUTF16toUTF8(stringSource(str),function(b){this.view.setUint8(offset++,b);}.bind(this));if(offset!==start+k+l)throw RangeError("Illegal range: Truncated data, "+offset+" == "+(offset+k+l));if(relative){this.offset=offset;return this;}return offset-start;}; /**
         * Reads a length as varint32 prefixed UTF8 encoded string.
         * @param {number=} offset Offset to read from. Will use and increase {@link ByteBuffer#offset} by the number of bytes
         *  read if omitted.
         * @returns {string|!{string: string, length: number}} The string read if offset is omitted, else the string
         *  read and the actual number of bytes read.
         * @expose
         * @see ByteBuffer#readVarint32
         */ByteBufferPrototype.readVString=function(offset){var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+1>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+1+") <= "+this.buffer.byteLength);}var temp=this.readVarint32(offset),start=offset,str;offset+=temp['length'];temp=temp['value'];var k=offset+temp,sd=stringDestination();utfx.decodeUTF8toUTF16(function(){return offset<k?this.view.getUint8(offset++):null;}.bind(this),sd,this.noAssert);str=sd();if(relative){this.offset=offset;return str;}else {return {'string':str,'length':offset-start};}}; /**
         * Appends some data to this ByteBuffer. This will overwrite any contents behind the specified offset up to the appended
         *  data's length.
         * @param {!ByteBuffer|!ArrayBuffer|!Uint8Array|string} source Data to append. If `source` is a ByteBuffer, its offsets
         *  will be modified according to the performed read operation.
         * @param {(string|number)=} encoding Encoding if `data` is a string ("base64", "hex", "binary", defaults to "utf8")
         * @param {number=} offset Offset to append at. Will use and increase {@link ByteBuffer#offset} by the number of bytes
         *  read if omitted.
         * @returns {!ByteBuffer} this
         * @expose
         * @example A relative `<01 02>03.append(<04 05>)` will result in `<01 02 04 05>, 04 05|`
         * @example An absolute `<01 02>03.append(04 05>, 1)` will result in `<01 04>05, 04 05|`
         */ByteBufferPrototype.append=function(source,encoding,offset){if(typeof encoding==='number'||typeof encoding!=='string'){offset=encoding;encoding=undefined;}var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}if(!(source instanceof ByteBuffer))source=ByteBuffer.wrap(source,encoding);var length=source.limit-source.offset;if(length<=0)return this; // Nothing to append
offset+=length;var capacity16=this.buffer.byteLength;if(offset>capacity16)this.resize((capacity16*=2)>offset?capacity16:offset);offset-=length;new Uint8Array(this.buffer,offset).set(new Uint8Array(source.buffer).subarray(source.offset,source.limit));source.offset+=length;if(relative)this.offset+=length;return this;}; /**
         * Appends this ByteBuffer's contents to another ByteBuffer. This will overwrite any contents at and after the
            specified offset up to the length of this ByteBuffer's data.
         * @param {!ByteBuffer} target Target ByteBuffer
         * @param {number=} offset Offset to append to. Will use and increase {@link ByteBuffer#offset} by the number of bytes
         *  read if omitted.
         * @returns {!ByteBuffer} this
         * @expose
         * @see ByteBuffer#append
         */ByteBufferPrototype.appendTo=function(target,offset){target.append(this,offset);return this;}; /**
         * Enables or disables assertions of argument types and offsets. Assertions are enabled by default but you can opt to
         *  disable them if your code already makes sure that everything is valid.
         * @param {boolean} assert `true` to enable assertions, otherwise `false`
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.assert=function(assert){this.noAssert=!assert;return this;}; /**
         * Gets the capacity of this ByteBuffer's backing buffer.
         * @returns {number} Capacity of the backing buffer
         * @expose
         */ByteBufferPrototype.capacity=function(){return this.buffer.byteLength;}; /**
         * Clears this ByteBuffer's offsets by setting {@link ByteBuffer#offset} to `0` and {@link ByteBuffer#limit} to the
         *  backing buffer's capacity. Discards {@link ByteBuffer#markedOffset}.
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.clear=function(){this.offset=0;this.limit=this.buffer.byteLength;this.markedOffset=-1;return this;}; /**
         * Creates a cloned instance of this ByteBuffer, preset with this ByteBuffer's values for {@link ByteBuffer#offset},
         *  {@link ByteBuffer#markedOffset} and {@link ByteBuffer#limit}.
         * @param {boolean=} copy Whether to copy the backing buffer or to return another view on the same, defaults to `false`
         * @returns {!ByteBuffer} Cloned instance
         * @expose
         */ByteBufferPrototype.clone=function(copy){var bb=new ByteBuffer(0,this.littleEndian,this.noAssert);if(copy){var buffer=new ArrayBuffer(this.buffer.byteLength);new Uint8Array(buffer).set(this.buffer);bb.buffer=buffer;bb.view=new DataView(buffer);}else {bb.buffer=this.buffer;bb.view=this.view;}bb.offset=this.offset;bb.markedOffset=this.markedOffset;bb.limit=this.limit;return bb;}; /**
         * Compacts this ByteBuffer to be backed by a {@link ByteBuffer#buffer} of its contents' length. Contents are the bytes
         *  between {@link ByteBuffer#offset} and {@link ByteBuffer#limit}. Will set `offset = 0` and `limit = capacity` and
         *  adapt {@link ByteBuffer#markedOffset} to the same relative position if set.
         * @param {number=} begin Offset to start at, defaults to {@link ByteBuffer#offset}
         * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.compact=function(begin,end){if(typeof begin==='undefined')begin=this.offset;if(typeof end==='undefined')end=this.limit;if(!this.noAssert){if(typeof begin!=='number'||begin%1!==0)throw TypeError("Illegal begin: Not an integer");begin>>>=0;if(typeof end!=='number'||end%1!==0)throw TypeError("Illegal end: Not an integer");end>>>=0;if(begin<0||begin>end||end>this.buffer.byteLength)throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);}if(begin===0&&end===this.buffer.byteLength)return this; // Already compacted
var len=end-begin;if(len===0){this.buffer=EMPTY_BUFFER;this.view=null;if(this.markedOffset>=0)this.markedOffset-=begin;this.offset=0;this.limit=0;return this;}var buffer=new ArrayBuffer(len);new Uint8Array(buffer).set(new Uint8Array(this.buffer).subarray(begin,end));this.buffer=buffer;this.view=new DataView(buffer);if(this.markedOffset>=0)this.markedOffset-=begin;this.offset=0;this.limit=len;return this;}; /**
         * Creates a copy of this ByteBuffer's contents. Contents are the bytes between {@link ByteBuffer#offset} and
         *  {@link ByteBuffer#limit}.
         * @param {number=} begin Begin offset, defaults to {@link ByteBuffer#offset}.
         * @param {number=} end End offset, defaults to {@link ByteBuffer#limit}.
         * @returns {!ByteBuffer} Copy
         * @expose
         */ByteBufferPrototype.copy=function(begin,end){if(typeof begin==='undefined')begin=this.offset;if(typeof end==='undefined')end=this.limit;if(!this.noAssert){if(typeof begin!=='number'||begin%1!==0)throw TypeError("Illegal begin: Not an integer");begin>>>=0;if(typeof end!=='number'||end%1!==0)throw TypeError("Illegal end: Not an integer");end>>>=0;if(begin<0||begin>end||end>this.buffer.byteLength)throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);}if(begin===end)return new ByteBuffer(0,this.littleEndian,this.noAssert);var capacity=end-begin,bb=new ByteBuffer(capacity,this.littleEndian,this.noAssert);bb.offset=0;bb.limit=capacity;if(bb.markedOffset>=0)bb.markedOffset-=begin;this.copyTo(bb,0,begin,end);return bb;}; /**
         * Copies this ByteBuffer's contents to another ByteBuffer. Contents are the bytes between {@link ByteBuffer#offset} and
         *  {@link ByteBuffer#limit}.
         * @param {!ByteBuffer} target Target ByteBuffer
         * @param {number=} targetOffset Offset to copy to. Will use and increase the target's {@link ByteBuffer#offset}
         *  by the number of bytes copied if omitted.
         * @param {number=} sourceOffset Offset to start copying from. Will use and increase {@link ByteBuffer#offset} by the
         *  number of bytes copied if omitted.
         * @param {number=} sourceLimit Offset to end copying from, defaults to {@link ByteBuffer#limit}
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.copyTo=function(target,targetOffset,sourceOffset,sourceLimit){var relative,targetRelative;if(!this.noAssert){if(!ByteBuffer.isByteBuffer(target))throw TypeError("Illegal target: Not a ByteBuffer");}targetOffset=(targetRelative=typeof targetOffset==='undefined')?target.offset:targetOffset|0;sourceOffset=(relative=typeof sourceOffset==='undefined')?this.offset:sourceOffset|0;sourceLimit=typeof sourceLimit==='undefined'?this.limit:sourceLimit|0;if(targetOffset<0||targetOffset>target.buffer.byteLength)throw RangeError("Illegal target range: 0 <= "+targetOffset+" <= "+target.buffer.byteLength);if(sourceOffset<0||sourceLimit>this.buffer.byteLength)throw RangeError("Illegal source range: 0 <= "+sourceOffset+" <= "+this.buffer.byteLength);var len=sourceLimit-sourceOffset;if(len===0)return target; // Nothing to copy
target.ensureCapacity(targetOffset+len);new Uint8Array(target.buffer).set(new Uint8Array(this.buffer).subarray(sourceOffset,sourceLimit),targetOffset);if(relative)this.offset+=len;if(targetRelative)target.offset+=len;return this;}; /**
         * Makes sure that this ByteBuffer is backed by a {@link ByteBuffer#buffer} of at least the specified capacity. If the
         *  current capacity is exceeded, it will be doubled. If double the current capacity is less than the required capacity,
         *  the required capacity will be used instead.
         * @param {number} capacity Required capacity
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.ensureCapacity=function(capacity){var current=this.buffer.byteLength;if(current<capacity)return this.resize((current*=2)>capacity?current:capacity);return this;}; /**
         * Overwrites this ByteBuffer's contents with the specified value. Contents are the bytes between
         *  {@link ByteBuffer#offset} and {@link ByteBuffer#limit}.
         * @param {number|string} value Byte value to fill with. If given as a string, the first character is used.
         * @param {number=} begin Begin offset. Will use and increase {@link ByteBuffer#offset} by the number of bytes
         *  written if omitted. defaults to {@link ByteBuffer#offset}.
         * @param {number=} end End offset, defaults to {@link ByteBuffer#limit}.
         * @returns {!ByteBuffer} this
         * @expose
         * @example `someByteBuffer.clear().fill(0)` fills the entire backing buffer with zeroes
         */ByteBufferPrototype.fill=function(value,begin,end){var relative=typeof begin==='undefined';if(relative)begin=this.offset;if(typeof value==='string'&&value.length>0)value=value.charCodeAt(0);if(typeof begin==='undefined')begin=this.offset;if(typeof end==='undefined')end=this.limit;if(!this.noAssert){if(typeof value!=='number'||value%1!==0)throw TypeError("Illegal value: "+value+" (not an integer)");value|=0;if(typeof begin!=='number'||begin%1!==0)throw TypeError("Illegal begin: Not an integer");begin>>>=0;if(typeof end!=='number'||end%1!==0)throw TypeError("Illegal end: Not an integer");end>>>=0;if(begin<0||begin>end||end>this.buffer.byteLength)throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);}if(begin>=end)return this; // Nothing to fill
while(begin<end){this.view.setUint8(begin++,value);}if(relative)this.offset=begin;return this;}; /**
         * Makes this ByteBuffer ready for a new sequence of write or relative read operations. Sets `limit = offset` and
         *  `offset = 0`. Make sure always to flip a ByteBuffer when all relative read or write operations are complete.
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.flip=function(){this.limit=this.offset;this.offset=0;return this;}; /**
         * Marks an offset on this ByteBuffer to be used later.
         * @param {number=} offset Offset to mark. Defaults to {@link ByteBuffer#offset}.
         * @returns {!ByteBuffer} this
         * @throws {TypeError} If `offset` is not a valid number
         * @throws {RangeError} If `offset` is out of bounds
         * @see ByteBuffer#reset
         * @expose
         */ByteBufferPrototype.mark=function(offset){offset=typeof offset==='undefined'?this.offset:offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}this.markedOffset=offset;return this;}; /**
         * Sets the byte order.
         * @param {boolean} littleEndian `true` for little endian byte order, `false` for big endian
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.order=function(littleEndian){if(!this.noAssert){if(typeof littleEndian!=='boolean')throw TypeError("Illegal littleEndian: Not a boolean");}this.littleEndian=!!littleEndian;return this;}; /**
         * Switches (to) little endian byte order.
         * @param {boolean=} littleEndian Defaults to `true`, otherwise uses big endian
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.LE=function(littleEndian){this.littleEndian=typeof littleEndian!=='undefined'?!!littleEndian:true;return this;}; /**
         * Switches (to) big endian byte order.
         * @param {boolean=} bigEndian Defaults to `true`, otherwise uses little endian
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.BE=function(bigEndian){this.littleEndian=typeof bigEndian!=='undefined'?!bigEndian:false;return this;}; /**
         * Prepends some data to this ByteBuffer. This will overwrite any contents before the specified offset up to the
         *  prepended data's length. If there is not enough space available before the specified `offset`, the backing buffer
         *  will be resized and its contents moved accordingly.
         * @param {!ByteBuffer|string|!ArrayBuffer} source Data to prepend. If `source` is a ByteBuffer, its offset will be
         *  modified according to the performed read operation.
         * @param {(string|number)=} encoding Encoding if `data` is a string ("base64", "hex", "binary", defaults to "utf8")
         * @param {number=} offset Offset to prepend at. Will use and decrease {@link ByteBuffer#offset} by the number of bytes
         *  prepended if omitted.
         * @returns {!ByteBuffer} this
         * @expose
         * @example A relative `00<01 02 03>.prepend(<04 05>)` results in `<04 05 01 02 03>, 04 05|`
         * @example An absolute `00<01 02 03>.prepend(<04 05>, 2)` results in `04<05 02 03>, 04 05|`
         */ByteBufferPrototype.prepend=function(source,encoding,offset){if(typeof encoding==='number'||typeof encoding!=='string'){offset=encoding;encoding=undefined;}var relative=typeof offset==='undefined';if(relative)offset=this.offset;if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: "+offset+" (not an integer)");offset>>>=0;if(offset<0||offset+0>this.buffer.byteLength)throw RangeError("Illegal offset: 0 <= "+offset+" (+"+0+") <= "+this.buffer.byteLength);}if(!(source instanceof ByteBuffer))source=ByteBuffer.wrap(source,encoding);var len=source.limit-source.offset;if(len<=0)return this; // Nothing to prepend
var diff=len-offset;var arrayView;if(diff>0){ // Not enough space before offset, so resize + move
var buffer=new ArrayBuffer(this.buffer.byteLength+diff);arrayView=new Uint8Array(buffer);arrayView.set(new Uint8Array(this.buffer).subarray(offset,this.buffer.byteLength),len);this.buffer=buffer;this.view=new DataView(buffer);this.offset+=diff;if(this.markedOffset>=0)this.markedOffset+=diff;this.limit+=diff;offset+=diff;}else {arrayView=new Uint8Array(this.buffer);}arrayView.set(new Uint8Array(source.buffer).subarray(source.offset,source.limit),offset-len);source.offset=source.limit;if(relative)this.offset-=len;return this;}; /**
         * Prepends this ByteBuffer to another ByteBuffer. This will overwrite any contents before the specified offset up to the
         *  prepended data's length. If there is not enough space available before the specified `offset`, the backing buffer
         *  will be resized and its contents moved accordingly.
         * @param {!ByteBuffer} target Target ByteBuffer
         * @param {number=} offset Offset to prepend at. Will use and decrease {@link ByteBuffer#offset} by the number of bytes
         *  prepended if omitted.
         * @returns {!ByteBuffer} this
         * @expose
         * @see ByteBuffer#prepend
         */ByteBufferPrototype.prependTo=function(target,offset){target.prepend(this,offset);return this;}; /**
         * Prints debug information about this ByteBuffer's contents.
         * @param {function(string)=} out Output function to call, defaults to console.log
         * @expose
         */ByteBufferPrototype.printDebug=function(out){if(typeof out!=='function')out=console.log.bind(console);out(this.toString()+"\n"+"-------------------------------------------------------------------\n"+this.toDebug( /* columns */true));}; /**
         * Gets the number of remaining readable bytes. Contents are the bytes between {@link ByteBuffer#offset} and
         *  {@link ByteBuffer#limit}, so this returns `limit - offset`.
         * @returns {number} Remaining readable bytes. May be negative if `offset > limit`.
         * @expose
         */ByteBufferPrototype.remaining=function(){return this.limit-this.offset;}; /**
         * Resets this ByteBuffer's {@link ByteBuffer#offset}. If an offset has been marked through {@link ByteBuffer#mark}
         *  before, `offset` will be set to {@link ByteBuffer#markedOffset}, which will then be discarded. If no offset has been
         *  marked, sets `offset = 0`.
         * @returns {!ByteBuffer} this
         * @see ByteBuffer#mark
         * @expose
         */ByteBufferPrototype.reset=function(){if(this.markedOffset>=0){this.offset=this.markedOffset;this.markedOffset=-1;}else {this.offset=0;}return this;}; /**
         * Resizes this ByteBuffer to be backed by a buffer of at least the given capacity. Will do nothing if already that
         *  large or larger.
         * @param {number} capacity Capacity required
         * @returns {!ByteBuffer} this
         * @throws {TypeError} If `capacity` is not a number
         * @throws {RangeError} If `capacity < 0`
         * @expose
         */ByteBufferPrototype.resize=function(capacity){if(!this.noAssert){if(typeof capacity!=='number'||capacity%1!==0)throw TypeError("Illegal capacity: "+capacity+" (not an integer)");capacity|=0;if(capacity<0)throw RangeError("Illegal capacity: 0 <= "+capacity);}if(this.buffer.byteLength<capacity){var buffer=new ArrayBuffer(capacity);new Uint8Array(buffer).set(new Uint8Array(this.buffer));this.buffer=buffer;this.view=new DataView(buffer);}return this;}; /**
         * Reverses this ByteBuffer's contents.
         * @param {number=} begin Offset to start at, defaults to {@link ByteBuffer#offset}
         * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.reverse=function(begin,end){if(typeof begin==='undefined')begin=this.offset;if(typeof end==='undefined')end=this.limit;if(!this.noAssert){if(typeof begin!=='number'||begin%1!==0)throw TypeError("Illegal begin: Not an integer");begin>>>=0;if(typeof end!=='number'||end%1!==0)throw TypeError("Illegal end: Not an integer");end>>>=0;if(begin<0||begin>end||end>this.buffer.byteLength)throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);}if(begin===end)return this; // Nothing to reverse
Array.prototype.reverse.call(new Uint8Array(this.buffer).subarray(begin,end));this.view=new DataView(this.buffer); // FIXME: Why exactly is this necessary?
return this;}; /**
         * Skips the next `length` bytes. This will just advance
         * @param {number} length Number of bytes to skip. May also be negative to move the offset back.
         * @returns {!ByteBuffer} this
         * @expose
         */ByteBufferPrototype.skip=function(length){if(!this.noAssert){if(typeof length!=='number'||length%1!==0)throw TypeError("Illegal length: "+length+" (not an integer)");length|=0;}var offset=this.offset+length;if(!this.noAssert){if(offset<0||offset>this.buffer.byteLength)throw RangeError("Illegal length: 0 <= "+this.offset+" + "+length+" <= "+this.buffer.byteLength);}this.offset=offset;return this;}; /**
         * Slices this ByteBuffer by creating a cloned instance with `offset = begin` and `limit = end`.
         * @param {number=} begin Begin offset, defaults to {@link ByteBuffer#offset}.
         * @param {number=} end End offset, defaults to {@link ByteBuffer#limit}.
         * @returns {!ByteBuffer} Clone of this ByteBuffer with slicing applied, backed by the same {@link ByteBuffer#buffer}
         * @expose
         */ByteBufferPrototype.slice=function(begin,end){if(typeof begin==='undefined')begin=this.offset;if(typeof end==='undefined')end=this.limit;if(!this.noAssert){if(typeof begin!=='number'||begin%1!==0)throw TypeError("Illegal begin: Not an integer");begin>>>=0;if(typeof end!=='number'||end%1!==0)throw TypeError("Illegal end: Not an integer");end>>>=0;if(begin<0||begin>end||end>this.buffer.byteLength)throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);}var bb=this.clone();bb.offset=begin;bb.limit=end;return bb;}; /**
         * Returns a copy of the backing buffer that contains this ByteBuffer's contents. Contents are the bytes between
         *  {@link ByteBuffer#offset} and {@link ByteBuffer#limit}. Will transparently {@link ByteBuffer#flip} this
         *  ByteBuffer if `offset > limit` but the actual offsets remain untouched.
         * @param {boolean=} forceCopy If `true` returns a copy, otherwise returns a view referencing the same memory if
         *  possible. Defaults to `false`
         * @returns {!ArrayBuffer} Contents as an ArrayBuffer
         * @expose
         */ByteBufferPrototype.toBuffer=function(forceCopy){var offset=this.offset,limit=this.limit;if(offset>limit){var t=offset;offset=limit;limit=t;}if(!this.noAssert){if(typeof offset!=='number'||offset%1!==0)throw TypeError("Illegal offset: Not an integer");offset>>>=0;if(typeof limit!=='number'||limit%1!==0)throw TypeError("Illegal limit: Not an integer");limit>>>=0;if(offset<0||offset>limit||limit>this.buffer.byteLength)throw RangeError("Illegal range: 0 <= "+offset+" <= "+limit+" <= "+this.buffer.byteLength);} // NOTE: It's not possible to have another ArrayBuffer reference the same memory as the backing buffer. This is
// possible with Uint8Array#subarray only, but we have to return an ArrayBuffer by contract. So:
if(!forceCopy&&offset===0&&limit===this.buffer.byteLength){return this.buffer;}if(offset===limit){return EMPTY_BUFFER;}var buffer=new ArrayBuffer(limit-offset);new Uint8Array(buffer).set(new Uint8Array(this.buffer).subarray(offset,limit),0);return buffer;}; /**
         * Returns a raw buffer compacted to contain this ByteBuffer's contents. Contents are the bytes between
         *  {@link ByteBuffer#offset} and {@link ByteBuffer#limit}. Will transparently {@link ByteBuffer#flip} this
         *  ByteBuffer if `offset > limit` but the actual offsets remain untouched. This is an alias of
         *  {@link ByteBuffer#toBuffer}.
         * @function
         * @param {boolean=} forceCopy If `true` returns a copy, otherwise returns a view referencing the same memory.
         *  Defaults to `false`
         * @returns {!ArrayBuffer} Contents as an ArrayBuffer
         * @expose
         */ByteBufferPrototype.toArrayBuffer=ByteBufferPrototype.toBuffer; /**
         * Converts the ByteBuffer's contents to a string.
         * @param {string=} encoding Output encoding. Returns an informative string representation if omitted but also allows
         *  direct conversion to "utf8", "hex", "base64" and "binary" encoding. "debug" returns a hex representation with
         *  highlighted offsets.
         * @param {number=} begin Offset to begin at, defaults to {@link ByteBuffer#offset}
         * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}
         * @returns {string} String representation
         * @throws {Error} If `encoding` is invalid
         * @expose
         */ByteBufferPrototype.toString=function(encoding,begin,end){if(typeof encoding==='undefined')return "ByteBufferAB(offset="+this.offset+",markedOffset="+this.markedOffset+",limit="+this.limit+",capacity="+this.capacity()+")";if(typeof encoding==='number')encoding="utf8",begin=encoding,end=begin;switch(encoding){case "utf8":return this.toUTF8(begin,end);case "base64":return this.toBase64(begin,end);case "hex":return this.toHex(begin,end);case "binary":return this.toBinary(begin,end);case "debug":return this.toDebug();case "columns":return this.toColumns();default:throw Error("Unsupported encoding: "+encoding);}}; // lxiv-embeddable
/**
         * lxiv-embeddable (c) 2014 Daniel Wirtz <dcode@dcode.io>
         * Released under the Apache License, Version 2.0
         * see: https://github.com/dcodeIO/lxiv for details
         */var lxiv=function(){"use strict"; /**
             * lxiv namespace.
             * @type {!Object.<string,*>}
             * @exports lxiv
             */var lxiv={}; /**
             * Character codes for output.
             * @type {!Array.<number>}
             * @inner
             */var aout=[65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,48,49,50,51,52,53,54,55,56,57,43,47]; /**
             * Character codes for input.
             * @type {!Array.<number>}
             * @inner
             */var ain=[];for(var i=0,k=aout.length;i<k;++i){ain[aout[i]]=i;} /**
             * Encodes bytes to base64 char codes.
             * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if
             *  there are no more bytes left.
             * @param {!function(number)} dst Characters destination as a function successively called with each encoded char
             *  code.
             */lxiv.encode=function(src,dst){var b,t;while((b=src())!==null){dst(aout[b>>2&0x3f]);t=(b&0x3)<<4;if((b=src())!==null){t|=b>>4&0xf;dst(aout[(t|b>>4&0xf)&0x3f]);t=(b&0xf)<<2;if((b=src())!==null)dst(aout[(t|b>>6&0x3)&0x3f]),dst(aout[b&0x3f]);else dst(aout[t&0x3f]),dst(61);}else dst(aout[t&0x3f]),dst(61),dst(61);}}; /**
             * Decodes base64 char codes to bytes.
             * @param {!function():number|null} src Characters source as a function returning the next char code respectively
             *  `null` if there are no more characters left.
             * @param {!function(number)} dst Bytes destination as a function successively called with the next byte.
             * @throws {Error} If a character code is invalid
             */lxiv.decode=function(src,dst){var c,t1,t2;function fail(c){throw Error("Illegal character code: "+c);}while((c=src())!==null){t1=ain[c];if(typeof t1==='undefined')fail(c);if((c=src())!==null){t2=ain[c];if(typeof t2==='undefined')fail(c);dst(t1<<2>>>0|(t2&0x30)>>4);if((c=src())!==null){t1=ain[c];if(typeof t1==='undefined')if(c===61)break;else fail(c);dst((t2&0xf)<<4>>>0|(t1&0x3c)>>2);if((c=src())!==null){t2=ain[c];if(typeof t2==='undefined')if(c===61)break;else fail(c);dst((t1&0x3)<<6>>>0|t2);}}}}}; /**
             * Tests if a string is valid base64.
             * @param {string} str String to test
             * @returns {boolean} `true` if valid, otherwise `false`
             */lxiv.test=function(str){return (/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(str));};return lxiv;}(); // encodings/base64
/**
         * Encodes this ByteBuffer's contents to a base64 encoded string.
         * @param {number=} begin Offset to begin at, defaults to {@link ByteBuffer#offset}.
         * @param {number=} end Offset to end at, defaults to {@link ByteBuffer#limit}.
         * @returns {string} Base64 encoded string
         * @expose
         */ByteBufferPrototype.toBase64=function(begin,end){if(typeof begin==='undefined')begin=this.offset;if(typeof end==='undefined')end=this.limit;if(!this.noAssert){if(typeof begin!=='number'||begin%1!==0)throw TypeError("Illegal begin: Not an integer");begin>>>=0;if(typeof end!=='number'||end%1!==0)throw TypeError("Illegal end: Not an integer");end>>>=0;if(begin<0||begin>end||end>this.buffer.byteLength)throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);}var sd;lxiv.encode(function(){return begin<end?this.view.getUint8(begin++):null;}.bind(this),sd=stringDestination());return sd();}; /**
         * Decodes a base64 encoded string to a ByteBuffer.
         * @param {string} str String to decode
         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
         * @returns {!ByteBuffer} ByteBuffer
         * @expose
         */ByteBuffer.fromBase64=function(str,littleEndian,noAssert){if(!noAssert){if(typeof str!=='string')throw TypeError("Illegal str: Not a string");if(str.length%4!==0)throw TypeError("Illegal str: Length not a multiple of 4");}var bb=new ByteBuffer(str.length/4*3,littleEndian,noAssert),i=0;lxiv.decode(stringSource(str),function(b){bb.view.setUint8(i++,b);});bb.limit=i;return bb;}; /**
         * Encodes a binary string to base64 like `window.btoa` does.
         * @param {string} str Binary string
         * @returns {string} Base64 encoded string
         * @see https://developer.mozilla.org/en-US/docs/Web/API/Window.btoa
         * @expose
         */ByteBuffer.btoa=function(str){return ByteBuffer.fromBinary(str).toBase64();}; /**
         * Decodes a base64 encoded string to binary like `window.atob` does.
         * @param {string} b64 Base64 encoded string
         * @returns {string} Binary string
         * @see https://developer.mozilla.org/en-US/docs/Web/API/Window.atob
         * @expose
         */ByteBuffer.atob=function(b64){return ByteBuffer.fromBase64(b64).toBinary();}; // encodings/binary
/**
         * Encodes this ByteBuffer to a binary encoded string, that is using only characters 0x00-0xFF as bytes.
         * @param {number=} begin Offset to begin at. Defaults to {@link ByteBuffer#offset}.
         * @param {number=} end Offset to end at. Defaults to {@link ByteBuffer#limit}.
         * @returns {string} Binary encoded string
         * @throws {RangeError} If `offset > limit`
         * @expose
         */ByteBufferPrototype.toBinary=function(begin,end){begin=typeof begin==='undefined'?this.offset:begin;end=typeof end==='undefined'?this.limit:end;if(!this.noAssert){if(typeof begin!=='number'||begin%1!==0)throw TypeError("Illegal begin: Not an integer");begin>>>=0;if(typeof end!=='number'||end%1!==0)throw TypeError("Illegal end: Not an integer");end>>>=0;if(begin<0||begin>end||end>this.buffer.byteLength)throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);}if(begin===end)return "";var cc=[],pt=[];while(begin<end){cc.push(this.view.getUint8(begin++));if(cc.length>=1024)pt.push(String.fromCharCode.apply(String,cc)),cc=[];}return pt.join('')+String.fromCharCode.apply(String,cc);}; /**
         * Decodes a binary encoded string, that is using only characters 0x00-0xFF as bytes, to a ByteBuffer.
         * @param {string} str String to decode
         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
         * @returns {!ByteBuffer} ByteBuffer
         * @expose
         */ByteBuffer.fromBinary=function(str,littleEndian,noAssert){if(!noAssert){if(typeof str!=='string')throw TypeError("Illegal str: Not a string");}var i=0,k=str.length,charCode,bb=new ByteBuffer(k,littleEndian,noAssert);while(i<k){charCode=str.charCodeAt(i);if(!noAssert&&charCode>255)throw RangeError("Illegal charCode at "+i+": 0 <= "+charCode+" <= 255");bb.view.setUint8(i++,charCode);}bb.limit=k;return bb;}; // encodings/debug
/**
         * Encodes this ByteBuffer to a hex encoded string with marked offsets. Offset symbols are:
         * * `<` : offset,
         * * `'` : markedOffset,
         * * `>` : limit,
         * * `|` : offset and limit,
         * * `[` : offset and markedOffset,
         * * `]` : markedOffset and limit,
         * * `!` : offset, markedOffset and limit
         * @param {boolean=} columns If `true` returns two columns hex + ascii, defaults to `false`
         * @returns {string|!Array.<string>} Debug string or array of lines if `asArray = true`
         * @expose
         * @example `>00'01 02<03` contains four bytes with `limit=0, markedOffset=1, offset=3`
         * @example `00[01 02 03>` contains four bytes with `offset=markedOffset=1, limit=4`
         * @example `00|01 02 03` contains four bytes with `offset=limit=1, markedOffset=-1`
         * @example `|` contains zero bytes with `offset=limit=0, markedOffset=-1`
         */ByteBufferPrototype.toDebug=function(columns){var i=-1,k=this.buffer.byteLength,b,hex="",asc="",out="";while(i<k){if(i!==-1){b=this.view.getUint8(i);if(b<0x10)hex+="0"+b.toString(16).toUpperCase();else hex+=b.toString(16).toUpperCase();if(columns){asc+=b>32&&b<127?String.fromCharCode(b):'.';}}++i;if(columns){if(i>0&&i%16===0&&i!==k){while(hex.length<3*16+3){hex+=" ";}out+=hex+asc+"\n";hex=asc="";}}if(i===this.offset&&i===this.limit)hex+=i===this.markedOffset?"!":"|";else if(i===this.offset)hex+=i===this.markedOffset?"[":"<";else if(i===this.limit)hex+=i===this.markedOffset?"]":">";else hex+=i===this.markedOffset?"'":columns||i!==0&&i!==k?" ":"";}if(columns&&hex!==" "){while(hex.length<3*16+3){hex+=" ";}out+=hex+asc+"\n";}return columns?out:hex;}; /**
         * Decodes a hex encoded string with marked offsets to a ByteBuffer.
         * @param {string} str Debug string to decode (not be generated with `columns = true`)
         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
         * @returns {!ByteBuffer} ByteBuffer
         * @expose
         * @see ByteBuffer#toDebug
         */ByteBuffer.fromDebug=function(str,littleEndian,noAssert){var k=str.length,bb=new ByteBuffer((k+1)/3|0,littleEndian,noAssert);var i=0,j=0,ch,b,rs=false, // Require symbol next
ho=false,hm=false,hl=false, // Already has offset, markedOffset, limit?
fail=false;while(i<k){switch(ch=str.charAt(i++)){case '!':if(!noAssert){if(ho||hm||hl){fail=true;break;}ho=hm=hl=true;}bb.offset=bb.markedOffset=bb.limit=j;rs=false;break;case '|':if(!noAssert){if(ho||hl){fail=true;break;}ho=hl=true;}bb.offset=bb.limit=j;rs=false;break;case '[':if(!noAssert){if(ho||hm){fail=true;break;}ho=hm=true;}bb.offset=bb.markedOffset=j;rs=false;break;case '<':if(!noAssert){if(ho){fail=true;break;}ho=true;}bb.offset=j;rs=false;break;case ']':if(!noAssert){if(hl||hm){fail=true;break;}hl=hm=true;}bb.limit=bb.markedOffset=j;rs=false;break;case '>':if(!noAssert){if(hl){fail=true;break;}hl=true;}bb.limit=j;rs=false;break;case "'":if(!noAssert){if(hm){fail=true;break;}hm=true;}bb.markedOffset=j;rs=false;break;case ' ':rs=false;break;default:if(!noAssert){if(rs){fail=true;break;}}b=parseInt(ch+str.charAt(i++),16);if(!noAssert){if(isNaN(b)||b<0||b>255)throw TypeError("Illegal str: Not a debug encoded string");}bb.view.setUint8(j++,b);rs=true;}if(fail)throw TypeError("Illegal str: Invalid symbol at "+i);}if(!noAssert){if(!ho||!hl)throw TypeError("Illegal str: Missing offset or limit");if(j<bb.buffer.byteLength)throw TypeError("Illegal str: Not a debug encoded string (is it hex?) "+j+" < "+k);}return bb;}; // encodings/hex
/**
         * Encodes this ByteBuffer's contents to a hex encoded string.
         * @param {number=} begin Offset to begin at. Defaults to {@link ByteBuffer#offset}.
         * @param {number=} end Offset to end at. Defaults to {@link ByteBuffer#limit}.
         * @returns {string} Hex encoded string
         * @expose
         */ByteBufferPrototype.toHex=function(begin,end){begin=typeof begin==='undefined'?this.offset:begin;end=typeof end==='undefined'?this.limit:end;if(!this.noAssert){if(typeof begin!=='number'||begin%1!==0)throw TypeError("Illegal begin: Not an integer");begin>>>=0;if(typeof end!=='number'||end%1!==0)throw TypeError("Illegal end: Not an integer");end>>>=0;if(begin<0||begin>end||end>this.buffer.byteLength)throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);}var out=new Array(end-begin),b;while(begin<end){b=this.view.getUint8(begin++);if(b<0x10)out.push("0",b.toString(16));else out.push(b.toString(16));}return out.join('');}; /**
         * Decodes a hex encoded string to a ByteBuffer.
         * @param {string} str String to decode
         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
         * @returns {!ByteBuffer} ByteBuffer
         * @expose
         */ByteBuffer.fromHex=function(str,littleEndian,noAssert){if(!noAssert){if(typeof str!=='string')throw TypeError("Illegal str: Not a string");if(str.length%2!==0)throw TypeError("Illegal str: Length not a multiple of 2");}var k=str.length,bb=new ByteBuffer(k/2|0,littleEndian),b;for(var i=0,j=0;i<k;i+=2){b=parseInt(str.substring(i,i+2),16);if(!noAssert)if(!isFinite(b)||b<0||b>255)throw TypeError("Illegal str: Contains non-hex characters");bb.view.setUint8(j++,b);}bb.limit=j;return bb;}; // utfx-embeddable
/**
         * utfx-embeddable (c) 2014 Daniel Wirtz <dcode@dcode.io>
         * Released under the Apache License, Version 2.0
         * see: https://github.com/dcodeIO/utfx for details
         */var utfx=function(){"use strict"; /**
             * utfx namespace.
             * @inner
             * @type {!Object.<string,*>}
             */var utfx={}; /**
             * Maximum valid code point.
             * @type {number}
             * @const
             */utfx.MAX_CODEPOINT=0x10FFFF; /**
             * Encodes UTF8 code points to UTF8 bytes.
             * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
             *  respectively `null` if there are no more code points left or a single numeric code point.
             * @param {!function(number)} dst Bytes destination as a function successively called with the next byte
             */utfx.encodeUTF8=function(src,dst){var cp=null;if(typeof src==='number')cp=src,src=function src(){return null;};while(cp!==null||(cp=src())!==null){if(cp<0x80)dst(cp&0x7F);else if(cp<0x800)dst(cp>>6&0x1F|0xC0),dst(cp&0x3F|0x80);else if(cp<0x10000)dst(cp>>12&0x0F|0xE0),dst(cp>>6&0x3F|0x80),dst(cp&0x3F|0x80);else dst(cp>>18&0x07|0xF0),dst(cp>>12&0x3F|0x80),dst(cp>>6&0x3F|0x80),dst(cp&0x3F|0x80);cp=null;}}; /**
             * Decodes UTF8 bytes to UTF8 code points.
             * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
             *  are no more bytes left.
             * @param {!function(number)} dst Code points destination as a function successively called with each decoded code point.
             * @throws {RangeError} If a starting byte is invalid in UTF8
             * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the
             *  remaining bytes.
             */utfx.decodeUTF8=function(src,dst){var a,b,c,d,fail=function fail(b){b=b.slice(0,b.indexOf(null));var err=Error(b.toString());err.name="TruncatedError";err['bytes']=b;throw err;};while((a=src())!==null){if((a&0x80)===0)dst(a);else if((a&0xE0)===0xC0)(b=src())===null&&fail([a,b]),dst((a&0x1F)<<6|b&0x3F);else if((a&0xF0)===0xE0)((b=src())===null||(c=src())===null)&&fail([a,b,c]),dst((a&0x0F)<<12|(b&0x3F)<<6|c&0x3F);else if((a&0xF8)===0xF0)((b=src())===null||(c=src())===null||(d=src())===null)&&fail([a,b,c,d]),dst((a&0x07)<<18|(b&0x3F)<<12|(c&0x3F)<<6|d&0x3F);else throw RangeError("Illegal starting byte: "+a);}}; /**
             * Converts UTF16 characters to UTF8 code points.
             * @param {!function():number|null} src Characters source as a function returning the next char code respectively
             *  `null` if there are no more characters left.
             * @param {!function(number)} dst Code points destination as a function successively called with each converted code
             *  point.
             */utfx.UTF16toUTF8=function(src,dst){var c1,c2=null;while(true){if((c1=c2!==null?c2:src())===null)break;if(c1>=0xD800&&c1<=0xDFFF){if((c2=src())!==null){if(c2>=0xDC00&&c2<=0xDFFF){dst((c1-0xD800)*0x400+c2-0xDC00+0x10000);c2=null;continue;}}}dst(c1);}if(c2!==null)dst(c2);}; /**
             * Converts UTF8 code points to UTF16 characters.
             * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
             *  respectively `null` if there are no more code points left or a single numeric code point.
             * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
             * @throws {RangeError} If a code point is out of range
             */utfx.UTF8toUTF16=function(src,dst){var cp=null;if(typeof src==='number')cp=src,src=function src(){return null;};while(cp!==null||(cp=src())!==null){if(cp<=0xFFFF)dst(cp);else cp-=0x10000,dst((cp>>10)+0xD800),dst(cp%0x400+0xDC00);cp=null;}}; /**
             * Converts and encodes UTF16 characters to UTF8 bytes.
             * @param {!function():number|null} src Characters source as a function returning the next char code respectively `null`
             *  if there are no more characters left.
             * @param {!function(number)} dst Bytes destination as a function successively called with the next byte.
             */utfx.encodeUTF16toUTF8=function(src,dst){utfx.UTF16toUTF8(src,function(cp){utfx.encodeUTF8(cp,dst);});}; /**
             * Decodes and converts UTF8 bytes to UTF16 characters.
             * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
             *  are no more bytes left.
             * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
             * @throws {RangeError} If a starting byte is invalid in UTF8
             * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the remaining bytes.
             */utfx.decodeUTF8toUTF16=function(src,dst){utfx.decodeUTF8(src,function(cp){utfx.UTF8toUTF16(cp,dst);});}; /**
             * Calculates the byte length of an UTF8 code point.
             * @param {number} cp UTF8 code point
             * @returns {number} Byte length
             */utfx.calculateCodePoint=function(cp){return cp<0x80?1:cp<0x800?2:cp<0x10000?3:4;}; /**
             * Calculates the number of UTF8 bytes required to store UTF8 code points.
             * @param {(!function():number|null)} src Code points source as a function returning the next code point respectively
             *  `null` if there are no more code points left.
             * @returns {number} The number of UTF8 bytes required
             */utfx.calculateUTF8=function(src){var cp,l=0;while((cp=src())!==null){l+=utfx.calculateCodePoint(cp);}return l;}; /**
             * Calculates the number of UTF8 code points respectively UTF8 bytes required to store UTF16 char codes.
             * @param {(!function():number|null)} src Characters source as a function returning the next char code respectively
             *  `null` if there are no more characters left.
             * @returns {!Array.<number>} The number of UTF8 code points at index 0 and the number of UTF8 bytes required at index 1.
             */utfx.calculateUTF16asUTF8=function(src){var n=0,l=0;utfx.UTF16toUTF8(src,function(cp){++n;l+=utfx.calculateCodePoint(cp);});return [n,l];};return utfx;}(); // encodings/utf8
/**
         * Encodes this ByteBuffer's contents between {@link ByteBuffer#offset} and {@link ByteBuffer#limit} to an UTF8 encoded
         *  string.
         * @returns {string} Hex encoded string
         * @throws {RangeError} If `offset > limit`
         * @expose
         */ByteBufferPrototype.toUTF8=function(begin,end){if(typeof begin==='undefined')begin=this.offset;if(typeof end==='undefined')end=this.limit;if(!this.noAssert){if(typeof begin!=='number'||begin%1!==0)throw TypeError("Illegal begin: Not an integer");begin>>>=0;if(typeof end!=='number'||end%1!==0)throw TypeError("Illegal end: Not an integer");end>>>=0;if(begin<0||begin>end||end>this.buffer.byteLength)throw RangeError("Illegal range: 0 <= "+begin+" <= "+end+" <= "+this.buffer.byteLength);}var sd;try{utfx.decodeUTF8toUTF16(function(){return begin<end?this.view.getUint8(begin++):null;}.bind(this),sd=stringDestination());}catch(e){if(begin!==end)throw RangeError("Illegal range: Truncated data, "+begin+" != "+end);}return sd();}; /**
         * Decodes an UTF8 encoded string to a ByteBuffer.
         * @param {string} str String to decode
         * @param {boolean=} littleEndian Whether to use little or big endian byte order. Defaults to
         *  {@link ByteBuffer.DEFAULT_ENDIAN}.
         * @param {boolean=} noAssert Whether to skip assertions of offsets and values. Defaults to
         *  {@link ByteBuffer.DEFAULT_NOASSERT}.
         * @returns {!ByteBuffer} ByteBuffer
         * @expose
         */ByteBuffer.fromUTF8=function(str,littleEndian,noAssert){if(!noAssert)if(typeof str!=='string')throw TypeError("Illegal str: Not a string");var bb=new ByteBuffer(utfx.calculateUTF16asUTF8(stringSource(str),true)[1],littleEndian,noAssert),i=0;utfx.encodeUTF16toUTF8(stringSource(str),function(b){bb.view.setUint8(i++,b);});bb.limit=i;return bb;};return ByteBuffer;} /* CommonJS */if(typeof require==='function'&&(typeof module==='undefined'?'undefined':_typeof(module))==='object'&&module&&(typeof exports==='undefined'?'undefined':_typeof(exports))==='object'&&exports)module['exports']=function(){var Long;try{Long=require("./..\\..\\long\\dist\\long.js");}catch(e){}return loadByteBuffer(Long);}(); /* AMD */else if(typeof define==='function'&&define["amd"])define("ByteBuffer",["Long"],function(Long){return loadByteBuffer(Long);}); /* Global */else (global["dcodeIO"]=global["dcodeIO"]||{})["ByteBuffer"]=loadByteBuffer(global["dcodeIO"]["Long"]);})(undefined);

},{"./..\\..\\long\\dist\\long.js":3}],2:[function(require,module,exports){
"use strict";var _typeof=typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"?function(obj){return typeof obj;}:function(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol?"symbol":typeof obj;}; /*!
 * jQuery JavaScript Library v2.1.4
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2015-04-28T16:01Z
 */(function(global,factory){if((typeof module==="undefined"?"undefined":_typeof(module))==="object"&&_typeof(module.exports)==="object"){ // For CommonJS and CommonJS-like environments where a proper `window`
// is present, execute the factory and get jQuery.
// For environments that do not have a `window` with a `document`
// (such as Node.js), expose a factory as module.exports.
// This accentuates the need for the creation of a real `window`.
// e.g. var jQuery = require("jquery")(window);
// See ticket #14549 for more info.
module.exports=global.document?factory(global,true):function(w){if(!w.document){throw new Error("jQuery requires a window with a document");}return factory(w);};}else {factory(global);} // Pass this if window is not defined yet
})(typeof window!=="undefined"?window:undefined,function(window,noGlobal){ // Support: Firefox 18+
// Can't be in strict mode, several libs including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
//
var arr=[];var _slice=arr.slice;var concat=arr.concat;var push=arr.push;var indexOf=arr.indexOf;var class2type={};var toString=class2type.toString;var hasOwn=class2type.hasOwnProperty;var support={};var  // Use the correct document accordingly with window argument (sandbox)
document=window.document,version="2.1.4", // Define a local copy of jQuery
jQuery=function jQuery(selector,context){ // The jQuery object is actually just the init constructor 'enhanced'
// Need init if jQuery is called (just allow error to be thrown if not included)
return new jQuery.fn.init(selector,context);}, // Support: Android<4.1
// Make sure we trim BOM and NBSP
rtrim=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, // Matches dashed string for camelizing
rmsPrefix=/^-ms-/,rdashAlpha=/-([\da-z])/gi, // Used by jQuery.camelCase as callback to replace()
fcamelCase=function fcamelCase(all,letter){return letter.toUpperCase();};jQuery.fn=jQuery.prototype={ // The current version of jQuery being used
jquery:version,constructor:jQuery, // Start with an empty selector
selector:"", // The default length of a jQuery object is 0
length:0,toArray:function toArray(){return _slice.call(this);}, // Get the Nth element in the matched element set OR
// Get the whole matched element set as a clean array
get:function get(num){return num!=null? // Return just the one element from the set
num<0?this[num+this.length]:this[num]: // Return all the elements in a clean array
_slice.call(this);}, // Take an array of elements and push it onto the stack
// (returning the new matched element set)
pushStack:function pushStack(elems){ // Build a new jQuery matched element set
var ret=jQuery.merge(this.constructor(),elems); // Add the old object onto the stack (as a reference)
ret.prevObject=this;ret.context=this.context; // Return the newly-formed element set
return ret;}, // Execute a callback for every element in the matched set.
// (You can seed the arguments with an array of args, but this is
// only used internally.)
each:function each(callback,args){return jQuery.each(this,callback,args);},map:function map(callback){return this.pushStack(jQuery.map(this,function(elem,i){return callback.call(elem,i,elem);}));},slice:function slice(){return this.pushStack(_slice.apply(this,arguments));},first:function first(){return this.eq(0);},last:function last(){return this.eq(-1);},eq:function eq(i){var len=this.length,j=+i+(i<0?len:0);return this.pushStack(j>=0&&j<len?[this[j]]:[]);},end:function end(){return this.prevObject||this.constructor(null);}, // For internal use only.
// Behaves like an Array's method, not like a jQuery method.
push:push,sort:arr.sort,splice:arr.splice};jQuery.extend=jQuery.fn.extend=function(){var options,name,src,copy,copyIsArray,clone,target=arguments[0]||{},i=1,length=arguments.length,deep=false; // Handle a deep copy situation
if(typeof target==="boolean"){deep=target; // Skip the boolean and the target
target=arguments[i]||{};i++;} // Handle case when target is a string or something (possible in deep copy)
if((typeof target==="undefined"?"undefined":_typeof(target))!=="object"&&!jQuery.isFunction(target)){target={};} // Extend jQuery itself if only one argument is passed
if(i===length){target=this;i--;}for(;i<length;i++){ // Only deal with non-null/undefined values
if((options=arguments[i])!=null){ // Extend the base object
for(name in options){src=target[name];copy=options[name]; // Prevent never-ending loop
if(target===copy){continue;} // Recurse if we're merging plain objects or arrays
if(deep&&copy&&(jQuery.isPlainObject(copy)||(copyIsArray=jQuery.isArray(copy)))){if(copyIsArray){copyIsArray=false;clone=src&&jQuery.isArray(src)?src:[];}else {clone=src&&jQuery.isPlainObject(src)?src:{};} // Never move original objects, clone them
target[name]=jQuery.extend(deep,clone,copy); // Don't bring in undefined values
}else if(copy!==undefined){target[name]=copy;}}}} // Return the modified object
return target;};jQuery.extend({ // Unique for each copy of jQuery on the page
expando:"jQuery"+(version+Math.random()).replace(/\D/g,""), // Assume jQuery is ready without the ready module
isReady:true,error:function error(msg){throw new Error(msg);},noop:function noop(){},isFunction:function isFunction(obj){return jQuery.type(obj)==="function";},isArray:Array.isArray,isWindow:function isWindow(obj){return obj!=null&&obj===obj.window;},isNumeric:function isNumeric(obj){ // parseFloat NaNs numeric-cast false positives (null|true|false|"")
// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
// subtraction forces infinities to NaN
// adding 1 corrects loss of precision from parseFloat (#15100)
return !jQuery.isArray(obj)&&obj-parseFloat(obj)+1>=0;},isPlainObject:function isPlainObject(obj){ // Not plain objects:
// - Any object or value whose internal [[Class]] property is not "[object Object]"
// - DOM nodes
// - window
if(jQuery.type(obj)!=="object"||obj.nodeType||jQuery.isWindow(obj)){return false;}if(obj.constructor&&!hasOwn.call(obj.constructor.prototype,"isPrototypeOf")){return false;} // If the function hasn't returned already, we're confident that
// |obj| is a plain object, created by {} or constructed with new Object
return true;},isEmptyObject:function isEmptyObject(obj){var name;for(name in obj){return false;}return true;},type:function type(obj){if(obj==null){return obj+"";} // Support: Android<4.0, iOS<6 (functionish RegExp)
return (typeof obj==="undefined"?"undefined":_typeof(obj))==="object"||typeof obj==="function"?class2type[toString.call(obj)]||"object":typeof obj==="undefined"?"undefined":_typeof(obj);}, // Evaluates a script in a global context
globalEval:function globalEval(code){var script,indirect=eval;code=jQuery.trim(code);if(code){ // If the code includes a valid, prologue position
// strict mode pragma, execute code by injecting a
// script tag into the document.
if(code.indexOf("use strict")===1){script=document.createElement("script");script.text=code;document.head.appendChild(script).parentNode.removeChild(script);}else { // Otherwise, avoid the DOM node creation, insertion
// and removal by using an indirect global eval
indirect(code);}}}, // Convert dashed to camelCase; used by the css and data modules
// Support: IE9-11+
// Microsoft forgot to hump their vendor prefix (#9572)
camelCase:function camelCase(string){return string.replace(rmsPrefix,"ms-").replace(rdashAlpha,fcamelCase);},nodeName:function nodeName(elem,name){return elem.nodeName&&elem.nodeName.toLowerCase()===name.toLowerCase();}, // args is for internal usage only
each:function each(obj,callback,args){var value,i=0,length=obj.length,isArray=isArraylike(obj);if(args){if(isArray){for(;i<length;i++){value=callback.apply(obj[i],args);if(value===false){break;}}}else {for(i in obj){value=callback.apply(obj[i],args);if(value===false){break;}}} // A special, fast, case for the most common use of each
}else {if(isArray){for(;i<length;i++){value=callback.call(obj[i],i,obj[i]);if(value===false){break;}}}else {for(i in obj){value=callback.call(obj[i],i,obj[i]);if(value===false){break;}}}}return obj;}, // Support: Android<4.1
trim:function trim(text){return text==null?"":(text+"").replace(rtrim,"");}, // results is for internal usage only
makeArray:function makeArray(arr,results){var ret=results||[];if(arr!=null){if(isArraylike(Object(arr))){jQuery.merge(ret,typeof arr==="string"?[arr]:arr);}else {push.call(ret,arr);}}return ret;},inArray:function inArray(elem,arr,i){return arr==null?-1:indexOf.call(arr,elem,i);},merge:function merge(first,second){var len=+second.length,j=0,i=first.length;for(;j<len;j++){first[i++]=second[j];}first.length=i;return first;},grep:function grep(elems,callback,invert){var callbackInverse,matches=[],i=0,length=elems.length,callbackExpect=!invert; // Go through the array, only saving the items
// that pass the validator function
for(;i<length;i++){callbackInverse=!callback(elems[i],i);if(callbackInverse!==callbackExpect){matches.push(elems[i]);}}return matches;}, // arg is for internal usage only
map:function map(elems,callback,arg){var value,i=0,length=elems.length,isArray=isArraylike(elems),ret=[]; // Go through the array, translating each of the items to their new values
if(isArray){for(;i<length;i++){value=callback(elems[i],i,arg);if(value!=null){ret.push(value);}} // Go through every key on the object,
}else {for(i in elems){value=callback(elems[i],i,arg);if(value!=null){ret.push(value);}}} // Flatten any nested arrays
return concat.apply([],ret);}, // A global GUID counter for objects
guid:1, // Bind a function to a context, optionally partially applying any
// arguments.
proxy:function proxy(fn,context){var tmp,args,proxy;if(typeof context==="string"){tmp=fn[context];context=fn;fn=tmp;} // Quick check to determine if target is callable, in the spec
// this throws a TypeError, but we will just return undefined.
if(!jQuery.isFunction(fn)){return undefined;} // Simulated bind
args=_slice.call(arguments,2);proxy=function proxy(){return fn.apply(context||this,args.concat(_slice.call(arguments)));}; // Set the guid of unique handler to the same of original handler, so it can be removed
proxy.guid=fn.guid=fn.guid||jQuery.guid++;return proxy;},now:Date.now, // jQuery.support is not used in Core but other projects attach their
// properties to it so it needs to exist.
support:support}); // Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(i,name){class2type["[object "+name+"]"]=name.toLowerCase();});function isArraylike(obj){ // Support: iOS 8.2 (not reproducible in simulator)
// `in` check used to prevent JIT error (gh-2145)
// hasOwn isn't used here due to false negatives
// regarding Nodelist length in IE
var length="length" in obj&&obj.length,type=jQuery.type(obj);if(type==="function"||jQuery.isWindow(obj)){return false;}if(obj.nodeType===1&&length){return true;}return type==="array"||length===0||typeof length==="number"&&length>0&&length-1 in obj;}var Sizzle= /*!
 * Sizzle CSS Selector Engine v2.2.0-pre
 * http://sizzlejs.com/
 *
 * Copyright 2008, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-12-16
 */function(window){var i,support,Expr,getText,isXML,tokenize,compile,select,outermostContext,sortInput,hasDuplicate, // Local document vars
setDocument,document,docElem,documentIsHTML,rbuggyQSA,rbuggyMatches,matches,contains, // Instance-specific data
expando="sizzle"+1*new Date(),preferredDoc=window.document,dirruns=0,done=0,classCache=createCache(),tokenCache=createCache(),compilerCache=createCache(),sortOrder=function sortOrder(a,b){if(a===b){hasDuplicate=true;}return 0;}, // General-purpose constants
MAX_NEGATIVE=1<<31, // Instance methods
hasOwn={}.hasOwnProperty,arr=[],pop=arr.pop,push_native=arr.push,push=arr.push,slice=arr.slice, // Use a stripped-down indexOf as it's faster than native
// http://jsperf.com/thor-indexof-vs-for/5
indexOf=function indexOf(list,elem){var i=0,len=list.length;for(;i<len;i++){if(list[i]===elem){return i;}}return -1;},booleans="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", // Regular expressions
// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
whitespace="[\\x20\\t\\r\\n\\f]", // http://www.w3.org/TR/css3-syntax/#characters
characterEncoding="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+", // Loosely modeled on CSS identifier characters
// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
identifier=characterEncoding.replace("w","w#"), // Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
attributes="\\["+whitespace+"*("+characterEncoding+")(?:"+whitespace+ // Operator (capture 2)
"*([*^$|!~]?=)"+whitespace+ // "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+identifier+"))|)"+whitespace+"*\\]",pseudos=":("+characterEncoding+")(?:\\(("+ // To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
// 1. quoted (capture 3; capture 4 or capture 5)
"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|"+ // 2. simple (capture 6)
"((?:\\\\.|[^\\\\()[\\]]|"+attributes+")*)|"+ // 3. anything else (capture 2)
".*"+")\\)|)", // Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
rwhitespace=new RegExp(whitespace+"+","g"),rtrim=new RegExp("^"+whitespace+"+|((?:^|[^\\\\])(?:\\\\.)*)"+whitespace+"+$","g"),rcomma=new RegExp("^"+whitespace+"*,"+whitespace+"*"),rcombinators=new RegExp("^"+whitespace+"*([>+~]|"+whitespace+")"+whitespace+"*"),rattributeQuotes=new RegExp("="+whitespace+"*([^\\]'\"]*?)"+whitespace+"*\\]","g"),rpseudo=new RegExp(pseudos),ridentifier=new RegExp("^"+identifier+"$"),matchExpr={"ID":new RegExp("^#("+characterEncoding+")"),"CLASS":new RegExp("^\\.("+characterEncoding+")"),"TAG":new RegExp("^("+characterEncoding.replace("w","w*")+")"),"ATTR":new RegExp("^"+attributes),"PSEUDO":new RegExp("^"+pseudos),"CHILD":new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+whitespace+"*(even|odd|(([+-]|)(\\d*)n|)"+whitespace+"*(?:([+-]|)"+whitespace+"*(\\d+)|))"+whitespace+"*\\)|)","i"),"bool":new RegExp("^(?:"+booleans+")$","i"), // For use in libraries implementing .is()
// We use this for POS matching in `select`
"needsContext":new RegExp("^"+whitespace+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+whitespace+"*((?:-\\d)?\\d*)"+whitespace+"*\\)|)(?=[^-]|$)","i")},rinputs=/^(?:input|select|textarea|button)$/i,rheader=/^h\d$/i,rnative=/^[^{]+\{\s*\[native \w/, // Easily-parseable/retrievable ID or TAG or CLASS selectors
rquickExpr=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,rsibling=/[+~]/,rescape=/'|\\/g, // CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
runescape=new RegExp("\\\\([\\da-f]{1,6}"+whitespace+"?|("+whitespace+")|.)","ig"),funescape=function funescape(_,escaped,escapedWhitespace){var high="0x"+escaped-0x10000; // NaN means non-codepoint
// Support: Firefox<24
// Workaround erroneous numeric interpretation of +"0x"
return high!==high||escapedWhitespace?escaped:high<0? // BMP codepoint
String.fromCharCode(high+0x10000): // Supplemental Plane codepoint (surrogate pair)
String.fromCharCode(high>>10|0xD800,high&0x3FF|0xDC00);}, // Used for iframes
// See setDocument()
// Removing the function wrapper causes a "Permission Denied"
// error in IE
unloadHandler=function unloadHandler(){setDocument();}; // Optimize for push.apply( _, NodeList )
try{push.apply(arr=slice.call(preferredDoc.childNodes),preferredDoc.childNodes); // Support: Android<4.0
// Detect silently failing push.apply
arr[preferredDoc.childNodes.length].nodeType;}catch(e){push={apply:arr.length? // Leverage slice if possible
function(target,els){push_native.apply(target,slice.call(els));}: // Support: IE<9
// Otherwise append directly
function(target,els){var j=target.length,i=0; // Can't trust NodeList.length
while(target[j++]=els[i++]){}target.length=j-1;}};}function Sizzle(selector,context,results,seed){var match,elem,m,nodeType, // QSA vars
i,groups,old,nid,newContext,newSelector;if((context?context.ownerDocument||context:preferredDoc)!==document){setDocument(context);}context=context||document;results=results||[];nodeType=context.nodeType;if(typeof selector!=="string"||!selector||nodeType!==1&&nodeType!==9&&nodeType!==11){return results;}if(!seed&&documentIsHTML){ // Try to shortcut find operations when possible (e.g., not under DocumentFragment)
if(nodeType!==11&&(match=rquickExpr.exec(selector))){ // Speed-up: Sizzle("#ID")
if(m=match[1]){if(nodeType===9){elem=context.getElementById(m); // Check parentNode to catch when Blackberry 4.6 returns
// nodes that are no longer in the document (jQuery #6963)
if(elem&&elem.parentNode){ // Handle the case where IE, Opera, and Webkit return items
// by name instead of ID
if(elem.id===m){results.push(elem);return results;}}else {return results;}}else { // Context is not a document
if(context.ownerDocument&&(elem=context.ownerDocument.getElementById(m))&&contains(context,elem)&&elem.id===m){results.push(elem);return results;}} // Speed-up: Sizzle("TAG")
}else if(match[2]){push.apply(results,context.getElementsByTagName(selector));return results; // Speed-up: Sizzle(".CLASS")
}else if((m=match[3])&&support.getElementsByClassName){push.apply(results,context.getElementsByClassName(m));return results;}} // QSA path
if(support.qsa&&(!rbuggyQSA||!rbuggyQSA.test(selector))){nid=old=expando;newContext=context;newSelector=nodeType!==1&&selector; // qSA works strangely on Element-rooted queries
// We can work around this by specifying an extra ID on the root
// and working up from there (Thanks to Andrew Dupont for the technique)
// IE 8 doesn't work on object elements
if(nodeType===1&&context.nodeName.toLowerCase()!=="object"){groups=tokenize(selector);if(old=context.getAttribute("id")){nid=old.replace(rescape,"\\$&");}else {context.setAttribute("id",nid);}nid="[id='"+nid+"'] ";i=groups.length;while(i--){groups[i]=nid+toSelector(groups[i]);}newContext=rsibling.test(selector)&&testContext(context.parentNode)||context;newSelector=groups.join(",");}if(newSelector){try{push.apply(results,newContext.querySelectorAll(newSelector));return results;}catch(qsaError){}finally {if(!old){context.removeAttribute("id");}}}}} // All others
return select(selector.replace(rtrim,"$1"),context,results,seed);} /**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */function createCache(){var keys=[];function cache(key,value){ // Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
if(keys.push(key+" ")>Expr.cacheLength){ // Only keep the most recent entries
delete cache[keys.shift()];}return cache[key+" "]=value;}return cache;} /**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */function markFunction(fn){fn[expando]=true;return fn;} /**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */function assert(fn){var div=document.createElement("div");try{return !!fn(div);}catch(e){return false;}finally { // Remove from its parent by default
if(div.parentNode){div.parentNode.removeChild(div);} // release memory in IE
div=null;}} /**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */function addHandle(attrs,handler){var arr=attrs.split("|"),i=attrs.length;while(i--){Expr.attrHandle[arr[i]]=handler;}} /**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */function siblingCheck(a,b){var cur=b&&a,diff=cur&&a.nodeType===1&&b.nodeType===1&&(~b.sourceIndex||MAX_NEGATIVE)-(~a.sourceIndex||MAX_NEGATIVE); // Use IE sourceIndex if available on both nodes
if(diff){return diff;} // Check if b follows a
if(cur){while(cur=cur.nextSibling){if(cur===b){return -1;}}}return a?1:-1;} /**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */function createInputPseudo(type){return function(elem){var name=elem.nodeName.toLowerCase();return name==="input"&&elem.type===type;};} /**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */function createButtonPseudo(type){return function(elem){var name=elem.nodeName.toLowerCase();return (name==="input"||name==="button")&&elem.type===type;};} /**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */function createPositionalPseudo(fn){return markFunction(function(argument){argument=+argument;return markFunction(function(seed,matches){var j,matchIndexes=fn([],seed.length,argument),i=matchIndexes.length; // Match elements found at the specified indexes
while(i--){if(seed[j=matchIndexes[i]]){seed[j]=!(matches[j]=seed[j]);}}});});} /**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */function testContext(context){return context&&typeof context.getElementsByTagName!=="undefined"&&context;} // Expose support vars for convenience
support=Sizzle.support={}; /**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */isXML=Sizzle.isXML=function(elem){ // documentElement is verified for cases where it doesn't yet exist
// (such as loading iframes in IE - #4833)
var documentElement=elem&&(elem.ownerDocument||elem).documentElement;return documentElement?documentElement.nodeName!=="HTML":false;}; /**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */setDocument=Sizzle.setDocument=function(node){var hasCompare,parent,doc=node?node.ownerDocument||node:preferredDoc; // If no document and documentElement is available, return
if(doc===document||doc.nodeType!==9||!doc.documentElement){return document;} // Set our document
document=doc;docElem=doc.documentElement;parent=doc.defaultView; // Support: IE>8
// If iframe document is assigned to "document" variable and if iframe has been reloaded,
// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
// IE6-8 do not support the defaultView property so parent will be undefined
if(parent&&parent!==parent.top){ // IE11 does not have attachEvent, so all must suffer
if(parent.addEventListener){parent.addEventListener("unload",unloadHandler,false);}else if(parent.attachEvent){parent.attachEvent("onunload",unloadHandler);}} /* Support tests
	---------------------------------------------------------------------- */documentIsHTML=!isXML(doc); /* Attributes
	---------------------------------------------------------------------- */ // Support: IE<8
// Verify that getAttribute really returns attributes and not properties
// (excepting IE8 booleans)
support.attributes=assert(function(div){div.className="i";return !div.getAttribute("className");}); /* getElement(s)By*
	---------------------------------------------------------------------- */ // Check if getElementsByTagName("*") returns only elements
support.getElementsByTagName=assert(function(div){div.appendChild(doc.createComment(""));return !div.getElementsByTagName("*").length;}); // Support: IE<9
support.getElementsByClassName=rnative.test(doc.getElementsByClassName); // Support: IE<10
// Check if getElementById returns elements by name
// The broken getElementById methods don't pick up programatically-set names,
// so use a roundabout getElementsByName test
support.getById=assert(function(div){docElem.appendChild(div).id=expando;return !doc.getElementsByName||!doc.getElementsByName(expando).length;}); // ID find and filter
if(support.getById){Expr.find["ID"]=function(id,context){if(typeof context.getElementById!=="undefined"&&documentIsHTML){var m=context.getElementById(id); // Check parentNode to catch when Blackberry 4.6 returns
// nodes that are no longer in the document #6963
return m&&m.parentNode?[m]:[];}};Expr.filter["ID"]=function(id){var attrId=id.replace(runescape,funescape);return function(elem){return elem.getAttribute("id")===attrId;};};}else { // Support: IE6/7
// getElementById is not reliable as a find shortcut
delete Expr.find["ID"];Expr.filter["ID"]=function(id){var attrId=id.replace(runescape,funescape);return function(elem){var node=typeof elem.getAttributeNode!=="undefined"&&elem.getAttributeNode("id");return node&&node.value===attrId;};};} // Tag
Expr.find["TAG"]=support.getElementsByTagName?function(tag,context){if(typeof context.getElementsByTagName!=="undefined"){return context.getElementsByTagName(tag); // DocumentFragment nodes don't have gEBTN
}else if(support.qsa){return context.querySelectorAll(tag);}}:function(tag,context){var elem,tmp=[],i=0, // By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
results=context.getElementsByTagName(tag); // Filter out possible comments
if(tag==="*"){while(elem=results[i++]){if(elem.nodeType===1){tmp.push(elem);}}return tmp;}return results;}; // Class
Expr.find["CLASS"]=support.getElementsByClassName&&function(className,context){if(documentIsHTML){return context.getElementsByClassName(className);}}; /* QSA/matchesSelector
	---------------------------------------------------------------------- */ // QSA and matchesSelector support
// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
rbuggyMatches=[]; // qSa(:focus) reports false when true (Chrome 21)
// We allow this because of a bug in IE8/9 that throws an error
// whenever `document.activeElement` is accessed on an iframe
// So, we allow :focus to pass through QSA all the time to avoid the IE error
// See http://bugs.jquery.com/ticket/13378
rbuggyQSA=[];if(support.qsa=rnative.test(doc.querySelectorAll)){ // Build QSA regex
// Regex strategy adopted from Diego Perini
assert(function(div){ // Select is set to empty string on purpose
// This is to test IE's treatment of not explicitly
// setting a boolean content attribute,
// since its presence should be enough
// http://bugs.jquery.com/ticket/12359
docElem.appendChild(div).innerHTML="<a id='"+expando+"'></a>"+"<select id='"+expando+"-\f]' msallowcapture=''>"+"<option selected=''></option></select>"; // Support: IE8, Opera 11-12.16
// Nothing should be selected when empty strings follow ^= or $= or *=
// The test attribute must be unknown in Opera but "safe" for WinRT
// http://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
if(div.querySelectorAll("[msallowcapture^='']").length){rbuggyQSA.push("[*^$]="+whitespace+"*(?:''|\"\")");} // Support: IE8
// Boolean attributes and "value" are not treated correctly
if(!div.querySelectorAll("[selected]").length){rbuggyQSA.push("\\["+whitespace+"*(?:value|"+booleans+")");} // Support: Chrome<29, Android<4.2+, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.7+
if(!div.querySelectorAll("[id~="+expando+"-]").length){rbuggyQSA.push("~=");} // Webkit/Opera - :checked should return selected option elements
// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
// IE8 throws error here and will not see later tests
if(!div.querySelectorAll(":checked").length){rbuggyQSA.push(":checked");} // Support: Safari 8+, iOS 8+
// https://bugs.webkit.org/show_bug.cgi?id=136851
// In-page `selector#id sibing-combinator selector` fails
if(!div.querySelectorAll("a#"+expando+"+*").length){rbuggyQSA.push(".#.+[+~]");}});assert(function(div){ // Support: Windows 8 Native Apps
// The type and name attributes are restricted during .innerHTML assignment
var input=doc.createElement("input");input.setAttribute("type","hidden");div.appendChild(input).setAttribute("name","D"); // Support: IE8
// Enforce case-sensitivity of name attribute
if(div.querySelectorAll("[name=d]").length){rbuggyQSA.push("name"+whitespace+"*[*^$|!~]?=");} // FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
// IE8 throws error here and will not see later tests
if(!div.querySelectorAll(":enabled").length){rbuggyQSA.push(":enabled",":disabled");} // Opera 10-11 does not throw on post-comma invalid pseudos
div.querySelectorAll("*,:x");rbuggyQSA.push(",.*:");});}if(support.matchesSelector=rnative.test(matches=docElem.matches||docElem.webkitMatchesSelector||docElem.mozMatchesSelector||docElem.oMatchesSelector||docElem.msMatchesSelector)){assert(function(div){ // Check to see if it's possible to do matchesSelector
// on a disconnected node (IE 9)
support.disconnectedMatch=matches.call(div,"div"); // This should fail with an exception
// Gecko does not error, returns false instead
matches.call(div,"[s!='']:x");rbuggyMatches.push("!=",pseudos);});}rbuggyQSA=rbuggyQSA.length&&new RegExp(rbuggyQSA.join("|"));rbuggyMatches=rbuggyMatches.length&&new RegExp(rbuggyMatches.join("|")); /* Contains
	---------------------------------------------------------------------- */hasCompare=rnative.test(docElem.compareDocumentPosition); // Element contains another
// Purposefully does not implement inclusive descendent
// As in, an element does not contain itself
contains=hasCompare||rnative.test(docElem.contains)?function(a,b){var adown=a.nodeType===9?a.documentElement:a,bup=b&&b.parentNode;return a===bup||!!(bup&&bup.nodeType===1&&(adown.contains?adown.contains(bup):a.compareDocumentPosition&&a.compareDocumentPosition(bup)&16));}:function(a,b){if(b){while(b=b.parentNode){if(b===a){return true;}}}return false;}; /* Sorting
	---------------------------------------------------------------------- */ // Document order sorting
sortOrder=hasCompare?function(a,b){ // Flag for duplicate removal
if(a===b){hasDuplicate=true;return 0;} // Sort on method existence if only one input has compareDocumentPosition
var compare=!a.compareDocumentPosition-!b.compareDocumentPosition;if(compare){return compare;} // Calculate position if both inputs belong to the same document
compare=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b): // Otherwise we know they are disconnected
1; // Disconnected nodes
if(compare&1||!support.sortDetached&&b.compareDocumentPosition(a)===compare){ // Choose the first element that is related to our preferred document
if(a===doc||a.ownerDocument===preferredDoc&&contains(preferredDoc,a)){return -1;}if(b===doc||b.ownerDocument===preferredDoc&&contains(preferredDoc,b)){return 1;} // Maintain original order
return sortInput?indexOf(sortInput,a)-indexOf(sortInput,b):0;}return compare&4?-1:1;}:function(a,b){ // Exit early if the nodes are identical
if(a===b){hasDuplicate=true;return 0;}var cur,i=0,aup=a.parentNode,bup=b.parentNode,ap=[a],bp=[b]; // Parentless nodes are either documents or disconnected
if(!aup||!bup){return a===doc?-1:b===doc?1:aup?-1:bup?1:sortInput?indexOf(sortInput,a)-indexOf(sortInput,b):0; // If the nodes are siblings, we can do a quick check
}else if(aup===bup){return siblingCheck(a,b);} // Otherwise we need full lists of their ancestors for comparison
cur=a;while(cur=cur.parentNode){ap.unshift(cur);}cur=b;while(cur=cur.parentNode){bp.unshift(cur);} // Walk down the tree looking for a discrepancy
while(ap[i]===bp[i]){i++;}return i? // Do a sibling check if the nodes have a common ancestor
siblingCheck(ap[i],bp[i]): // Otherwise nodes in our document sort first
ap[i]===preferredDoc?-1:bp[i]===preferredDoc?1:0;};return doc;};Sizzle.matches=function(expr,elements){return Sizzle(expr,null,null,elements);};Sizzle.matchesSelector=function(elem,expr){ // Set document vars if needed
if((elem.ownerDocument||elem)!==document){setDocument(elem);} // Make sure that attribute selectors are quoted
expr=expr.replace(rattributeQuotes,"='$1']");if(support.matchesSelector&&documentIsHTML&&(!rbuggyMatches||!rbuggyMatches.test(expr))&&(!rbuggyQSA||!rbuggyQSA.test(expr))){try{var ret=matches.call(elem,expr); // IE 9's matchesSelector returns false on disconnected nodes
if(ret||support.disconnectedMatch|| // As well, disconnected nodes are said to be in a document
// fragment in IE 9
elem.document&&elem.document.nodeType!==11){return ret;}}catch(e){}}return Sizzle(expr,document,null,[elem]).length>0;};Sizzle.contains=function(context,elem){ // Set document vars if needed
if((context.ownerDocument||context)!==document){setDocument(context);}return contains(context,elem);};Sizzle.attr=function(elem,name){ // Set document vars if needed
if((elem.ownerDocument||elem)!==document){setDocument(elem);}var fn=Expr.attrHandle[name.toLowerCase()], // Don't get fooled by Object.prototype properties (jQuery #13807)
val=fn&&hasOwn.call(Expr.attrHandle,name.toLowerCase())?fn(elem,name,!documentIsHTML):undefined;return val!==undefined?val:support.attributes||!documentIsHTML?elem.getAttribute(name):(val=elem.getAttributeNode(name))&&val.specified?val.value:null;};Sizzle.error=function(msg){throw new Error("Syntax error, unrecognized expression: "+msg);}; /**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */Sizzle.uniqueSort=function(results){var elem,duplicates=[],j=0,i=0; // Unless we *know* we can detect duplicates, assume their presence
hasDuplicate=!support.detectDuplicates;sortInput=!support.sortStable&&results.slice(0);results.sort(sortOrder);if(hasDuplicate){while(elem=results[i++]){if(elem===results[i]){j=duplicates.push(i);}}while(j--){results.splice(duplicates[j],1);}} // Clear input after sorting to release objects
// See https://github.com/jquery/sizzle/pull/225
sortInput=null;return results;}; /**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */getText=Sizzle.getText=function(elem){var node,ret="",i=0,nodeType=elem.nodeType;if(!nodeType){ // If no nodeType, this is expected to be an array
while(node=elem[i++]){ // Do not traverse comment nodes
ret+=getText(node);}}else if(nodeType===1||nodeType===9||nodeType===11){ // Use textContent for elements
// innerText usage removed for consistency of new lines (jQuery #11153)
if(typeof elem.textContent==="string"){return elem.textContent;}else { // Traverse its children
for(elem=elem.firstChild;elem;elem=elem.nextSibling){ret+=getText(elem);}}}else if(nodeType===3||nodeType===4){return elem.nodeValue;} // Do not include comment or processing instruction nodes
return ret;};Expr=Sizzle.selectors={ // Can be adjusted by the user
cacheLength:50,createPseudo:markFunction,match:matchExpr,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:true}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:true},"~":{dir:"previousSibling"}},preFilter:{"ATTR":function ATTR(match){match[1]=match[1].replace(runescape,funescape); // Move the given value to match[3] whether quoted or unquoted
match[3]=(match[3]||match[4]||match[5]||"").replace(runescape,funescape);if(match[2]==="~="){match[3]=" "+match[3]+" ";}return match.slice(0,4);},"CHILD":function CHILD(match){ /* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/match[1]=match[1].toLowerCase();if(match[1].slice(0,3)==="nth"){ // nth-* requires argument
if(!match[3]){Sizzle.error(match[0]);} // numeric x and y parameters for Expr.filter.CHILD
// remember that false/true cast respectively to 0/1
match[4]=+(match[4]?match[5]+(match[6]||1):2*(match[3]==="even"||match[3]==="odd"));match[5]=+(match[7]+match[8]||match[3]==="odd"); // other types prohibit arguments
}else if(match[3]){Sizzle.error(match[0]);}return match;},"PSEUDO":function PSEUDO(match){var excess,unquoted=!match[6]&&match[2];if(matchExpr["CHILD"].test(match[0])){return null;} // Accept quoted arguments as-is
if(match[3]){match[2]=match[4]||match[5]||""; // Strip excess characters from unquoted arguments
}else if(unquoted&&rpseudo.test(unquoted)&&( // Get excess from tokenize (recursively)
excess=tokenize(unquoted,true))&&( // advance to the next closing parenthesis
excess=unquoted.indexOf(")",unquoted.length-excess)-unquoted.length)){ // excess is a negative index
match[0]=match[0].slice(0,excess);match[2]=unquoted.slice(0,excess);} // Return only captures needed by the pseudo filter method (type and argument)
return match.slice(0,3);}},filter:{"TAG":function TAG(nodeNameSelector){var nodeName=nodeNameSelector.replace(runescape,funescape).toLowerCase();return nodeNameSelector==="*"?function(){return true;}:function(elem){return elem.nodeName&&elem.nodeName.toLowerCase()===nodeName;};},"CLASS":function CLASS(className){var pattern=classCache[className+" "];return pattern||(pattern=new RegExp("(^|"+whitespace+")"+className+"("+whitespace+"|$)"))&&classCache(className,function(elem){return pattern.test(typeof elem.className==="string"&&elem.className||typeof elem.getAttribute!=="undefined"&&elem.getAttribute("class")||"");});},"ATTR":function ATTR(name,operator,check){return function(elem){var result=Sizzle.attr(elem,name);if(result==null){return operator==="!=";}if(!operator){return true;}result+="";return operator==="="?result===check:operator==="!="?result!==check:operator==="^="?check&&result.indexOf(check)===0:operator==="*="?check&&result.indexOf(check)>-1:operator==="$="?check&&result.slice(-check.length)===check:operator==="~="?(" "+result.replace(rwhitespace," ")+" ").indexOf(check)>-1:operator==="|="?result===check||result.slice(0,check.length+1)===check+"-":false;};},"CHILD":function CHILD(type,what,argument,first,last){var simple=type.slice(0,3)!=="nth",forward=type.slice(-4)!=="last",ofType=what==="of-type";return first===1&&last===0? // Shortcut for :nth-*(n)
function(elem){return !!elem.parentNode;}:function(elem,context,xml){var cache,outerCache,node,diff,nodeIndex,start,dir=simple!==forward?"nextSibling":"previousSibling",parent=elem.parentNode,name=ofType&&elem.nodeName.toLowerCase(),useCache=!xml&&!ofType;if(parent){ // :(first|last|only)-(child|of-type)
if(simple){while(dir){node=elem;while(node=node[dir]){if(ofType?node.nodeName.toLowerCase()===name:node.nodeType===1){return false;}} // Reverse direction for :only-* (if we haven't yet done so)
start=dir=type==="only"&&!start&&"nextSibling";}return true;}start=[forward?parent.firstChild:parent.lastChild]; // non-xml :nth-child(...) stores cache data on `parent`
if(forward&&useCache){ // Seek `elem` from a previously-cached index
outerCache=parent[expando]||(parent[expando]={});cache=outerCache[type]||[];nodeIndex=cache[0]===dirruns&&cache[1];diff=cache[0]===dirruns&&cache[2];node=nodeIndex&&parent.childNodes[nodeIndex];while(node=++nodeIndex&&node&&node[dir]||( // Fallback to seeking `elem` from the start
diff=nodeIndex=0)||start.pop()){ // When found, cache indexes on `parent` and break
if(node.nodeType===1&&++diff&&node===elem){outerCache[type]=[dirruns,nodeIndex,diff];break;}} // Use previously-cached element index if available
}else if(useCache&&(cache=(elem[expando]||(elem[expando]={}))[type])&&cache[0]===dirruns){diff=cache[1]; // xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
}else { // Use the same loop as above to seek `elem` from the start
while(node=++nodeIndex&&node&&node[dir]||(diff=nodeIndex=0)||start.pop()){if((ofType?node.nodeName.toLowerCase()===name:node.nodeType===1)&&++diff){ // Cache the index of each encountered element
if(useCache){(node[expando]||(node[expando]={}))[type]=[dirruns,diff];}if(node===elem){break;}}}} // Incorporate the offset, then check against cycle size
diff-=last;return diff===first||diff%first===0&&diff/first>=0;}};},"PSEUDO":function PSEUDO(pseudo,argument){ // pseudo-class names are case-insensitive
// http://www.w3.org/TR/selectors/#pseudo-classes
// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
// Remember that setFilters inherits from pseudos
var args,fn=Expr.pseudos[pseudo]||Expr.setFilters[pseudo.toLowerCase()]||Sizzle.error("unsupported pseudo: "+pseudo); // The user may use createPseudo to indicate that
// arguments are needed to create the filter function
// just as Sizzle does
if(fn[expando]){return fn(argument);} // But maintain support for old signatures
if(fn.length>1){args=[pseudo,pseudo,"",argument];return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase())?markFunction(function(seed,matches){var idx,matched=fn(seed,argument),i=matched.length;while(i--){idx=indexOf(seed,matched[i]);seed[idx]=!(matches[idx]=matched[i]);}}):function(elem){return fn(elem,0,args);};}return fn;}},pseudos:{ // Potentially complex pseudos
"not":markFunction(function(selector){ // Trim the selector passed to compile
// to avoid treating leading and trailing
// spaces as combinators
var input=[],results=[],matcher=compile(selector.replace(rtrim,"$1"));return matcher[expando]?markFunction(function(seed,matches,context,xml){var elem,unmatched=matcher(seed,null,xml,[]),i=seed.length; // Match elements unmatched by `matcher`
while(i--){if(elem=unmatched[i]){seed[i]=!(matches[i]=elem);}}}):function(elem,context,xml){input[0]=elem;matcher(input,null,xml,results); // Don't keep the element (issue #299)
input[0]=null;return !results.pop();};}),"has":markFunction(function(selector){return function(elem){return Sizzle(selector,elem).length>0;};}),"contains":markFunction(function(text){text=text.replace(runescape,funescape);return function(elem){return (elem.textContent||elem.innerText||getText(elem)).indexOf(text)>-1;};}), // "Whether an element is represented by a :lang() selector
// is based solely on the element's language value
// being equal to the identifier C,
// or beginning with the identifier C immediately followed by "-".
// The matching of C against the element's language value is performed case-insensitively.
// The identifier C does not have to be a valid language name."
// http://www.w3.org/TR/selectors/#lang-pseudo
"lang":markFunction(function(lang){ // lang value must be a valid identifier
if(!ridentifier.test(lang||"")){Sizzle.error("unsupported lang: "+lang);}lang=lang.replace(runescape,funescape).toLowerCase();return function(elem){var elemLang;do {if(elemLang=documentIsHTML?elem.lang:elem.getAttribute("xml:lang")||elem.getAttribute("lang")){elemLang=elemLang.toLowerCase();return elemLang===lang||elemLang.indexOf(lang+"-")===0;}}while((elem=elem.parentNode)&&elem.nodeType===1);return false;};}), // Miscellaneous
"target":function target(elem){var hash=window.location&&window.location.hash;return hash&&hash.slice(1)===elem.id;},"root":function root(elem){return elem===docElem;},"focus":function focus(elem){return elem===document.activeElement&&(!document.hasFocus||document.hasFocus())&&!!(elem.type||elem.href||~elem.tabIndex);}, // Boolean properties
"enabled":function enabled(elem){return elem.disabled===false;},"disabled":function disabled(elem){return elem.disabled===true;},"checked":function checked(elem){ // In CSS3, :checked should return both checked and selected elements
// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
var nodeName=elem.nodeName.toLowerCase();return nodeName==="input"&&!!elem.checked||nodeName==="option"&&!!elem.selected;},"selected":function selected(elem){ // Accessing this property makes selected-by-default
// options in Safari work properly
if(elem.parentNode){elem.parentNode.selectedIndex;}return elem.selected===true;}, // Contents
"empty":function empty(elem){ // http://www.w3.org/TR/selectors/#empty-pseudo
// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
//   but not by others (comment: 8; processing instruction: 7; etc.)
// nodeType < 6 works because attributes (2) do not appear as children
for(elem=elem.firstChild;elem;elem=elem.nextSibling){if(elem.nodeType<6){return false;}}return true;},"parent":function parent(elem){return !Expr.pseudos["empty"](elem);}, // Element/input types
"header":function header(elem){return rheader.test(elem.nodeName);},"input":function input(elem){return rinputs.test(elem.nodeName);},"button":function button(elem){var name=elem.nodeName.toLowerCase();return name==="input"&&elem.type==="button"||name==="button";},"text":function text(elem){var attr;return elem.nodeName.toLowerCase()==="input"&&elem.type==="text"&&( // Support: IE<8
// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
(attr=elem.getAttribute("type"))==null||attr.toLowerCase()==="text");}, // Position-in-collection
"first":createPositionalPseudo(function(){return [0];}),"last":createPositionalPseudo(function(matchIndexes,length){return [length-1];}),"eq":createPositionalPseudo(function(matchIndexes,length,argument){return [argument<0?argument+length:argument];}),"even":createPositionalPseudo(function(matchIndexes,length){var i=0;for(;i<length;i+=2){matchIndexes.push(i);}return matchIndexes;}),"odd":createPositionalPseudo(function(matchIndexes,length){var i=1;for(;i<length;i+=2){matchIndexes.push(i);}return matchIndexes;}),"lt":createPositionalPseudo(function(matchIndexes,length,argument){var i=argument<0?argument+length:argument;for(;--i>=0;){matchIndexes.push(i);}return matchIndexes;}),"gt":createPositionalPseudo(function(matchIndexes,length,argument){var i=argument<0?argument+length:argument;for(;++i<length;){matchIndexes.push(i);}return matchIndexes;})}};Expr.pseudos["nth"]=Expr.pseudos["eq"]; // Add button/input type pseudos
for(i in {radio:true,checkbox:true,file:true,password:true,image:true}){Expr.pseudos[i]=createInputPseudo(i);}for(i in {submit:true,reset:true}){Expr.pseudos[i]=createButtonPseudo(i);} // Easy API for creating new setFilters
function setFilters(){}setFilters.prototype=Expr.filters=Expr.pseudos;Expr.setFilters=new setFilters();tokenize=Sizzle.tokenize=function(selector,parseOnly){var matched,match,tokens,type,soFar,groups,preFilters,cached=tokenCache[selector+" "];if(cached){return parseOnly?0:cached.slice(0);}soFar=selector;groups=[];preFilters=Expr.preFilter;while(soFar){ // Comma and first run
if(!matched||(match=rcomma.exec(soFar))){if(match){ // Don't consume trailing commas as valid
soFar=soFar.slice(match[0].length)||soFar;}groups.push(tokens=[]);}matched=false; // Combinators
if(match=rcombinators.exec(soFar)){matched=match.shift();tokens.push({value:matched, // Cast descendant combinators to space
type:match[0].replace(rtrim," ")});soFar=soFar.slice(matched.length);} // Filters
for(type in Expr.filter){if((match=matchExpr[type].exec(soFar))&&(!preFilters[type]||(match=preFilters[type](match)))){matched=match.shift();tokens.push({value:matched,type:type,matches:match});soFar=soFar.slice(matched.length);}}if(!matched){break;}} // Return the length of the invalid excess
// if we're just parsing
// Otherwise, throw an error or return tokens
return parseOnly?soFar.length:soFar?Sizzle.error(selector): // Cache the tokens
tokenCache(selector,groups).slice(0);};function toSelector(tokens){var i=0,len=tokens.length,selector="";for(;i<len;i++){selector+=tokens[i].value;}return selector;}function addCombinator(matcher,combinator,base){var dir=combinator.dir,checkNonElements=base&&dir==="parentNode",doneName=done++;return combinator.first? // Check against closest ancestor/preceding element
function(elem,context,xml){while(elem=elem[dir]){if(elem.nodeType===1||checkNonElements){return matcher(elem,context,xml);}}}: // Check against all ancestor/preceding elements
function(elem,context,xml){var oldCache,outerCache,newCache=[dirruns,doneName]; // We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
if(xml){while(elem=elem[dir]){if(elem.nodeType===1||checkNonElements){if(matcher(elem,context,xml)){return true;}}}}else {while(elem=elem[dir]){if(elem.nodeType===1||checkNonElements){outerCache=elem[expando]||(elem[expando]={});if((oldCache=outerCache[dir])&&oldCache[0]===dirruns&&oldCache[1]===doneName){ // Assign to newCache so results back-propagate to previous elements
return newCache[2]=oldCache[2];}else { // Reuse newcache so results back-propagate to previous elements
outerCache[dir]=newCache; // A match means we're done; a fail means we have to keep checking
if(newCache[2]=matcher(elem,context,xml)){return true;}}}}}};}function elementMatcher(matchers){return matchers.length>1?function(elem,context,xml){var i=matchers.length;while(i--){if(!matchers[i](elem,context,xml)){return false;}}return true;}:matchers[0];}function multipleContexts(selector,contexts,results){var i=0,len=contexts.length;for(;i<len;i++){Sizzle(selector,contexts[i],results);}return results;}function condense(unmatched,map,filter,context,xml){var elem,newUnmatched=[],i=0,len=unmatched.length,mapped=map!=null;for(;i<len;i++){if(elem=unmatched[i]){if(!filter||filter(elem,context,xml)){newUnmatched.push(elem);if(mapped){map.push(i);}}}}return newUnmatched;}function setMatcher(preFilter,selector,matcher,postFilter,postFinder,postSelector){if(postFilter&&!postFilter[expando]){postFilter=setMatcher(postFilter);}if(postFinder&&!postFinder[expando]){postFinder=setMatcher(postFinder,postSelector);}return markFunction(function(seed,results,context,xml){var temp,i,elem,preMap=[],postMap=[],preexisting=results.length, // Get initial elements from seed or context
elems=seed||multipleContexts(selector||"*",context.nodeType?[context]:context,[]), // Prefilter to get matcher input, preserving a map for seed-results synchronization
matcherIn=preFilter&&(seed||!selector)?condense(elems,preMap,preFilter,context,xml):elems,matcherOut=matcher? // If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
postFinder||(seed?preFilter:preexisting||postFilter)? // ...intermediate processing is necessary
[]: // ...otherwise use results directly
results:matcherIn; // Find primary matches
if(matcher){matcher(matcherIn,matcherOut,context,xml);} // Apply postFilter
if(postFilter){temp=condense(matcherOut,postMap);postFilter(temp,[],context,xml); // Un-match failing elements by moving them back to matcherIn
i=temp.length;while(i--){if(elem=temp[i]){matcherOut[postMap[i]]=!(matcherIn[postMap[i]]=elem);}}}if(seed){if(postFinder||preFilter){if(postFinder){ // Get the final matcherOut by condensing this intermediate into postFinder contexts
temp=[];i=matcherOut.length;while(i--){if(elem=matcherOut[i]){ // Restore matcherIn since elem is not yet a final match
temp.push(matcherIn[i]=elem);}}postFinder(null,matcherOut=[],temp,xml);} // Move matched elements from seed to results to keep them synchronized
i=matcherOut.length;while(i--){if((elem=matcherOut[i])&&(temp=postFinder?indexOf(seed,elem):preMap[i])>-1){seed[temp]=!(results[temp]=elem);}}} // Add elements to results, through postFinder if defined
}else {matcherOut=condense(matcherOut===results?matcherOut.splice(preexisting,matcherOut.length):matcherOut);if(postFinder){postFinder(null,results,matcherOut,xml);}else {push.apply(results,matcherOut);}}});}function matcherFromTokens(tokens){var checkContext,matcher,j,len=tokens.length,leadingRelative=Expr.relative[tokens[0].type],implicitRelative=leadingRelative||Expr.relative[" "],i=leadingRelative?1:0, // The foundational matcher ensures that elements are reachable from top-level context(s)
matchContext=addCombinator(function(elem){return elem===checkContext;},implicitRelative,true),matchAnyContext=addCombinator(function(elem){return indexOf(checkContext,elem)>-1;},implicitRelative,true),matchers=[function(elem,context,xml){var ret=!leadingRelative&&(xml||context!==outermostContext)||((checkContext=context).nodeType?matchContext(elem,context,xml):matchAnyContext(elem,context,xml)); // Avoid hanging onto element (issue #299)
checkContext=null;return ret;}];for(;i<len;i++){if(matcher=Expr.relative[tokens[i].type]){matchers=[addCombinator(elementMatcher(matchers),matcher)];}else {matcher=Expr.filter[tokens[i].type].apply(null,tokens[i].matches); // Return special upon seeing a positional matcher
if(matcher[expando]){ // Find the next relative operator (if any) for proper handling
j=++i;for(;j<len;j++){if(Expr.relative[tokens[j].type]){break;}}return setMatcher(i>1&&elementMatcher(matchers),i>1&&toSelector( // If the preceding token was a descendant combinator, insert an implicit any-element `*`
tokens.slice(0,i-1).concat({value:tokens[i-2].type===" "?"*":""})).replace(rtrim,"$1"),matcher,i<j&&matcherFromTokens(tokens.slice(i,j)),j<len&&matcherFromTokens(tokens=tokens.slice(j)),j<len&&toSelector(tokens));}matchers.push(matcher);}}return elementMatcher(matchers);}function matcherFromGroupMatchers(elementMatchers,setMatchers){var bySet=setMatchers.length>0,byElement=elementMatchers.length>0,superMatcher=function superMatcher(seed,context,xml,results,outermost){var elem,j,matcher,matchedCount=0,i="0",unmatched=seed&&[],setMatched=[],contextBackup=outermostContext, // We must always have either seed elements or outermost context
elems=seed||byElement&&Expr.find["TAG"]("*",outermost), // Use integer dirruns iff this is the outermost matcher
dirrunsUnique=dirruns+=contextBackup==null?1:Math.random()||0.1,len=elems.length;if(outermost){outermostContext=context!==document&&context;} // Add elements passing elementMatchers directly to results
// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
// Support: IE<9, Safari
// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
for(;i!==len&&(elem=elems[i])!=null;i++){if(byElement&&elem){j=0;while(matcher=elementMatchers[j++]){if(matcher(elem,context,xml)){results.push(elem);break;}}if(outermost){dirruns=dirrunsUnique;}} // Track unmatched elements for set filters
if(bySet){ // They will have gone through all possible matchers
if(elem=!matcher&&elem){matchedCount--;} // Lengthen the array for every element, matched or not
if(seed){unmatched.push(elem);}}} // Apply set filters to unmatched elements
matchedCount+=i;if(bySet&&i!==matchedCount){j=0;while(matcher=setMatchers[j++]){matcher(unmatched,setMatched,context,xml);}if(seed){ // Reintegrate element matches to eliminate the need for sorting
if(matchedCount>0){while(i--){if(!(unmatched[i]||setMatched[i])){setMatched[i]=pop.call(results);}}} // Discard index placeholder values to get only actual matches
setMatched=condense(setMatched);} // Add matches to results
push.apply(results,setMatched); // Seedless set matches succeeding multiple successful matchers stipulate sorting
if(outermost&&!seed&&setMatched.length>0&&matchedCount+setMatchers.length>1){Sizzle.uniqueSort(results);}} // Override manipulation of globals by nested matchers
if(outermost){dirruns=dirrunsUnique;outermostContext=contextBackup;}return unmatched;};return bySet?markFunction(superMatcher):superMatcher;}compile=Sizzle.compile=function(selector,match /* Internal Use Only */){var i,setMatchers=[],elementMatchers=[],cached=compilerCache[selector+" "];if(!cached){ // Generate a function of recursive functions that can be used to check each element
if(!match){match=tokenize(selector);}i=match.length;while(i--){cached=matcherFromTokens(match[i]);if(cached[expando]){setMatchers.push(cached);}else {elementMatchers.push(cached);}} // Cache the compiled function
cached=compilerCache(selector,matcherFromGroupMatchers(elementMatchers,setMatchers)); // Save selector and tokenization
cached.selector=selector;}return cached;}; /**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */select=Sizzle.select=function(selector,context,results,seed){var i,tokens,token,type,find,compiled=typeof selector==="function"&&selector,match=!seed&&tokenize(selector=compiled.selector||selector);results=results||[]; // Try to minimize operations if there is no seed and only one group
if(match.length===1){ // Take a shortcut and set the context if the root selector is an ID
tokens=match[0]=match[0].slice(0);if(tokens.length>2&&(token=tokens[0]).type==="ID"&&support.getById&&context.nodeType===9&&documentIsHTML&&Expr.relative[tokens[1].type]){context=(Expr.find["ID"](token.matches[0].replace(runescape,funescape),context)||[])[0];if(!context){return results; // Precompiled matchers will still verify ancestry, so step up a level
}else if(compiled){context=context.parentNode;}selector=selector.slice(tokens.shift().value.length);} // Fetch a seed set for right-to-left matching
i=matchExpr["needsContext"].test(selector)?0:tokens.length;while(i--){token=tokens[i]; // Abort if we hit a combinator
if(Expr.relative[type=token.type]){break;}if(find=Expr.find[type]){ // Search, expanding context for leading sibling combinators
if(seed=find(token.matches[0].replace(runescape,funescape),rsibling.test(tokens[0].type)&&testContext(context.parentNode)||context)){ // If seed is empty or no tokens remain, we can return early
tokens.splice(i,1);selector=seed.length&&toSelector(tokens);if(!selector){push.apply(results,seed);return results;}break;}}}} // Compile and execute a filtering function if one is not provided
// Provide `match` to avoid retokenization if we modified the selector above
(compiled||compile(selector,match))(seed,context,!documentIsHTML,results,rsibling.test(selector)&&testContext(context.parentNode)||context);return results;}; // One-time assignments
// Sort stability
support.sortStable=expando.split("").sort(sortOrder).join("")===expando; // Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates=!!hasDuplicate; // Initialize against the default document
setDocument(); // Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached=assert(function(div1){ // Should return 1, but returns 4 (following)
return div1.compareDocumentPosition(document.createElement("div"))&1;}); // Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if(!assert(function(div){div.innerHTML="<a href='#'></a>";return div.firstChild.getAttribute("href")==="#";})){addHandle("type|href|height|width",function(elem,name,isXML){if(!isXML){return elem.getAttribute(name,name.toLowerCase()==="type"?1:2);}});} // Support: IE<9
// Use defaultValue in place of getAttribute("value")
if(!support.attributes||!assert(function(div){div.innerHTML="<input/>";div.firstChild.setAttribute("value","");return div.firstChild.getAttribute("value")==="";})){addHandle("value",function(elem,name,isXML){if(!isXML&&elem.nodeName.toLowerCase()==="input"){return elem.defaultValue;}});} // Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if(!assert(function(div){return div.getAttribute("disabled")==null;})){addHandle(booleans,function(elem,name,isXML){var val;if(!isXML){return elem[name]===true?name.toLowerCase():(val=elem.getAttributeNode(name))&&val.specified?val.value:null;}});}return Sizzle;}(window);jQuery.find=Sizzle;jQuery.expr=Sizzle.selectors;jQuery.expr[":"]=jQuery.expr.pseudos;jQuery.unique=Sizzle.uniqueSort;jQuery.text=Sizzle.getText;jQuery.isXMLDoc=Sizzle.isXML;jQuery.contains=Sizzle.contains;var rneedsContext=jQuery.expr.match.needsContext;var rsingleTag=/^<(\w+)\s*\/?>(?:<\/\1>|)$/;var risSimple=/^.[^:#\[\.,]*$/; // Implement the identical functionality for filter and not
function winnow(elements,qualifier,not){if(jQuery.isFunction(qualifier)){return jQuery.grep(elements,function(elem,i){ /* jshint -W018 */return !!qualifier.call(elem,i,elem)!==not;});}if(qualifier.nodeType){return jQuery.grep(elements,function(elem){return elem===qualifier!==not;});}if(typeof qualifier==="string"){if(risSimple.test(qualifier)){return jQuery.filter(qualifier,elements,not);}qualifier=jQuery.filter(qualifier,elements);}return jQuery.grep(elements,function(elem){return indexOf.call(qualifier,elem)>=0!==not;});}jQuery.filter=function(expr,elems,not){var elem=elems[0];if(not){expr=":not("+expr+")";}return elems.length===1&&elem.nodeType===1?jQuery.find.matchesSelector(elem,expr)?[elem]:[]:jQuery.find.matches(expr,jQuery.grep(elems,function(elem){return elem.nodeType===1;}));};jQuery.fn.extend({find:function find(selector){var i,len=this.length,ret=[],self=this;if(typeof selector!=="string"){return this.pushStack(jQuery(selector).filter(function(){for(i=0;i<len;i++){if(jQuery.contains(self[i],this)){return true;}}}));}for(i=0;i<len;i++){jQuery.find(selector,self[i],ret);} // Needed because $( selector, context ) becomes $( context ).find( selector )
ret=this.pushStack(len>1?jQuery.unique(ret):ret);ret.selector=this.selector?this.selector+" "+selector:selector;return ret;},filter:function filter(selector){return this.pushStack(winnow(this,selector||[],false));},not:function not(selector){return this.pushStack(winnow(this,selector||[],true));},is:function is(selector){return !!winnow(this, // If this is a positional/relative selector, check membership in the returned set
// so $("p:first").is("p:last") won't return true for a doc with two "p".
typeof selector==="string"&&rneedsContext.test(selector)?jQuery(selector):selector||[],false).length;}}); // Initialize a jQuery object
// A central reference to the root jQuery(document)
var rootjQuery, // A simple way to check for HTML strings
// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
// Strict HTML recognition (#11290: must start with <)
rquickExpr=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,init=jQuery.fn.init=function(selector,context){var match,elem; // HANDLE: $(""), $(null), $(undefined), $(false)
if(!selector){return this;} // Handle HTML strings
if(typeof selector==="string"){if(selector[0]==="<"&&selector[selector.length-1]===">"&&selector.length>=3){ // Assume that strings that start and end with <> are HTML and skip the regex check
match=[null,selector,null];}else {match=rquickExpr.exec(selector);} // Match html or make sure no context is specified for #id
if(match&&(match[1]||!context)){ // HANDLE: $(html) -> $(array)
if(match[1]){context=context instanceof jQuery?context[0]:context; // Option to run scripts is true for back-compat
// Intentionally let the error be thrown if parseHTML is not present
jQuery.merge(this,jQuery.parseHTML(match[1],context&&context.nodeType?context.ownerDocument||context:document,true)); // HANDLE: $(html, props)
if(rsingleTag.test(match[1])&&jQuery.isPlainObject(context)){for(match in context){ // Properties of context are called as methods if possible
if(jQuery.isFunction(this[match])){this[match](context[match]); // ...and otherwise set as attributes
}else {this.attr(match,context[match]);}}}return this; // HANDLE: $(#id)
}else {elem=document.getElementById(match[2]); // Support: Blackberry 4.6
// gEBID returns nodes no longer in the document (#6963)
if(elem&&elem.parentNode){ // Inject the element directly into the jQuery object
this.length=1;this[0]=elem;}this.context=document;this.selector=selector;return this;} // HANDLE: $(expr, $(...))
}else if(!context||context.jquery){return (context||rootjQuery).find(selector); // HANDLE: $(expr, context)
// (which is just equivalent to: $(context).find(expr)
}else {return this.constructor(context).find(selector);} // HANDLE: $(DOMElement)
}else if(selector.nodeType){this.context=this[0]=selector;this.length=1;return this; // HANDLE: $(function)
// Shortcut for document ready
}else if(jQuery.isFunction(selector)){return typeof rootjQuery.ready!=="undefined"?rootjQuery.ready(selector): // Execute immediately if ready is not present
selector(jQuery);}if(selector.selector!==undefined){this.selector=selector.selector;this.context=selector.context;}return jQuery.makeArray(selector,this);}; // Give the init function the jQuery prototype for later instantiation
init.prototype=jQuery.fn; // Initialize central reference
rootjQuery=jQuery(document);var rparentsprev=/^(?:parents|prev(?:Until|All))/, // Methods guaranteed to produce a unique set when starting from a unique set
guaranteedUnique={children:true,contents:true,next:true,prev:true};jQuery.extend({dir:function dir(elem,_dir,until){var matched=[],truncate=until!==undefined;while((elem=elem[_dir])&&elem.nodeType!==9){if(elem.nodeType===1){if(truncate&&jQuery(elem).is(until)){break;}matched.push(elem);}}return matched;},sibling:function sibling(n,elem){var matched=[];for(;n;n=n.nextSibling){if(n.nodeType===1&&n!==elem){matched.push(n);}}return matched;}});jQuery.fn.extend({has:function has(target){var targets=jQuery(target,this),l=targets.length;return this.filter(function(){var i=0;for(;i<l;i++){if(jQuery.contains(this,targets[i])){return true;}}});},closest:function closest(selectors,context){var cur,i=0,l=this.length,matched=[],pos=rneedsContext.test(selectors)||typeof selectors!=="string"?jQuery(selectors,context||this.context):0;for(;i<l;i++){for(cur=this[i];cur&&cur!==context;cur=cur.parentNode){ // Always skip document fragments
if(cur.nodeType<11&&(pos?pos.index(cur)>-1: // Don't pass non-elements to Sizzle
cur.nodeType===1&&jQuery.find.matchesSelector(cur,selectors))){matched.push(cur);break;}}}return this.pushStack(matched.length>1?jQuery.unique(matched):matched);}, // Determine the position of an element within the set
index:function index(elem){ // No argument, return index in parent
if(!elem){return this[0]&&this[0].parentNode?this.first().prevAll().length:-1;} // Index in selector
if(typeof elem==="string"){return indexOf.call(jQuery(elem),this[0]);} // Locate the position of the desired element
return indexOf.call(this, // If it receives a jQuery object, the first element is used
elem.jquery?elem[0]:elem);},add:function add(selector,context){return this.pushStack(jQuery.unique(jQuery.merge(this.get(),jQuery(selector,context))));},addBack:function addBack(selector){return this.add(selector==null?this.prevObject:this.prevObject.filter(selector));}});function sibling(cur,dir){while((cur=cur[dir])&&cur.nodeType!==1){}return cur;}jQuery.each({parent:function parent(elem){var parent=elem.parentNode;return parent&&parent.nodeType!==11?parent:null;},parents:function parents(elem){return jQuery.dir(elem,"parentNode");},parentsUntil:function parentsUntil(elem,i,until){return jQuery.dir(elem,"parentNode",until);},next:function next(elem){return sibling(elem,"nextSibling");},prev:function prev(elem){return sibling(elem,"previousSibling");},nextAll:function nextAll(elem){return jQuery.dir(elem,"nextSibling");},prevAll:function prevAll(elem){return jQuery.dir(elem,"previousSibling");},nextUntil:function nextUntil(elem,i,until){return jQuery.dir(elem,"nextSibling",until);},prevUntil:function prevUntil(elem,i,until){return jQuery.dir(elem,"previousSibling",until);},siblings:function siblings(elem){return jQuery.sibling((elem.parentNode||{}).firstChild,elem);},children:function children(elem){return jQuery.sibling(elem.firstChild);},contents:function contents(elem){return elem.contentDocument||jQuery.merge([],elem.childNodes);}},function(name,fn){jQuery.fn[name]=function(until,selector){var matched=jQuery.map(this,fn,until);if(name.slice(-5)!=="Until"){selector=until;}if(selector&&typeof selector==="string"){matched=jQuery.filter(selector,matched);}if(this.length>1){ // Remove duplicates
if(!guaranteedUnique[name]){jQuery.unique(matched);} // Reverse order for parents* and prev-derivatives
if(rparentsprev.test(name)){matched.reverse();}}return this.pushStack(matched);};});var rnotwhite=/\S+/g; // String to Object options format cache
var optionsCache={}; // Convert String-formatted options into Object-formatted ones and store in cache
function createOptions(options){var object=optionsCache[options]={};jQuery.each(options.match(rnotwhite)||[],function(_,flag){object[flag]=true;});return object;} /*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */jQuery.Callbacks=function(options){ // Convert options from String-formatted to Object-formatted if needed
// (we check in cache first)
options=typeof options==="string"?optionsCache[options]||createOptions(options):jQuery.extend({},options);var  // Last fire value (for non-forgettable lists)
memory, // Flag to know if list was already fired
_fired, // Flag to know if list is currently firing
firing, // First callback to fire (used internally by add and fireWith)
firingStart, // End of the loop when firing
firingLength, // Index of currently firing callback (modified by remove if needed)
firingIndex, // Actual callback list
list=[], // Stack of fire calls for repeatable lists
stack=!options.once&&[], // Fire callbacks
fire=function fire(data){memory=options.memory&&data;_fired=true;firingIndex=firingStart||0;firingStart=0;firingLength=list.length;firing=true;for(;list&&firingIndex<firingLength;firingIndex++){if(list[firingIndex].apply(data[0],data[1])===false&&options.stopOnFalse){memory=false; // To prevent further calls using add
break;}}firing=false;if(list){if(stack){if(stack.length){fire(stack.shift());}}else if(memory){list=[];}else {self.disable();}}}, // Actual Callbacks object
self={ // Add a callback or a collection of callbacks to the list
add:function add(){if(list){ // First, we save the current length
var start=list.length;(function add(args){jQuery.each(args,function(_,arg){var type=jQuery.type(arg);if(type==="function"){if(!options.unique||!self.has(arg)){list.push(arg);}}else if(arg&&arg.length&&type!=="string"){ // Inspect recursively
add(arg);}});})(arguments); // Do we need to add the callbacks to the
// current firing batch?
if(firing){firingLength=list.length; // With memory, if we're not firing then
// we should call right away
}else if(memory){firingStart=start;fire(memory);}}return this;}, // Remove a callback from the list
remove:function remove(){if(list){jQuery.each(arguments,function(_,arg){var index;while((index=jQuery.inArray(arg,list,index))>-1){list.splice(index,1); // Handle firing indexes
if(firing){if(index<=firingLength){firingLength--;}if(index<=firingIndex){firingIndex--;}}}});}return this;}, // Check if a given callback is in the list.
// If no argument is given, return whether or not list has callbacks attached.
has:function has(fn){return fn?jQuery.inArray(fn,list)>-1:!!(list&&list.length);}, // Remove all callbacks from the list
empty:function empty(){list=[];firingLength=0;return this;}, // Have the list do nothing anymore
disable:function disable(){list=stack=memory=undefined;return this;}, // Is it disabled?
disabled:function disabled(){return !list;}, // Lock the list in its current state
lock:function lock(){stack=undefined;if(!memory){self.disable();}return this;}, // Is it locked?
locked:function locked(){return !stack;}, // Call all callbacks with the given context and arguments
fireWith:function fireWith(context,args){if(list&&(!_fired||stack)){args=args||[];args=[context,args.slice?args.slice():args];if(firing){stack.push(args);}else {fire(args);}}return this;}, // Call all the callbacks with the given arguments
fire:function fire(){self.fireWith(this,arguments);return this;}, // To know if the callbacks have already been called at least once
fired:function fired(){return !!_fired;}};return self;};jQuery.extend({Deferred:function Deferred(func){var tuples=[ // action, add listener, listener list, final state
["resolve","done",jQuery.Callbacks("once memory"),"resolved"],["reject","fail",jQuery.Callbacks("once memory"),"rejected"],["notify","progress",jQuery.Callbacks("memory")]],_state="pending",_promise={state:function state(){return _state;},always:function always(){deferred.done(arguments).fail(arguments);return this;},then:function then() /* fnDone, fnFail, fnProgress */{var fns=arguments;return jQuery.Deferred(function(newDefer){jQuery.each(tuples,function(i,tuple){var fn=jQuery.isFunction(fns[i])&&fns[i]; // deferred[ done | fail | progress ] for forwarding actions to newDefer
deferred[tuple[1]](function(){var returned=fn&&fn.apply(this,arguments);if(returned&&jQuery.isFunction(returned.promise)){returned.promise().done(newDefer.resolve).fail(newDefer.reject).progress(newDefer.notify);}else {newDefer[tuple[0]+"With"](this===_promise?newDefer.promise():this,fn?[returned]:arguments);}});});fns=null;}).promise();}, // Get a promise for this deferred
// If obj is provided, the promise aspect is added to the object
promise:function promise(obj){return obj!=null?jQuery.extend(obj,_promise):_promise;}},deferred={}; // Keep pipe for back-compat
_promise.pipe=_promise.then; // Add list-specific methods
jQuery.each(tuples,function(i,tuple){var list=tuple[2],stateString=tuple[3]; // promise[ done | fail | progress ] = list.add
_promise[tuple[1]]=list.add; // Handle state
if(stateString){list.add(function(){ // state = [ resolved | rejected ]
_state=stateString; // [ reject_list | resolve_list ].disable; progress_list.lock
},tuples[i^1][2].disable,tuples[2][2].lock);} // deferred[ resolve | reject | notify ]
deferred[tuple[0]]=function(){deferred[tuple[0]+"With"](this===deferred?_promise:this,arguments);return this;};deferred[tuple[0]+"With"]=list.fireWith;}); // Make the deferred a promise
_promise.promise(deferred); // Call given func if any
if(func){func.call(deferred,deferred);} // All done!
return deferred;}, // Deferred helper
when:function when(subordinate /* , ..., subordinateN */){var i=0,resolveValues=_slice.call(arguments),length=resolveValues.length, // the count of uncompleted subordinates
remaining=length!==1||subordinate&&jQuery.isFunction(subordinate.promise)?length:0, // the master Deferred. If resolveValues consist of only a single Deferred, just use that.
deferred=remaining===1?subordinate:jQuery.Deferred(), // Update function for both resolve and progress values
updateFunc=function updateFunc(i,contexts,values){return function(value){contexts[i]=this;values[i]=arguments.length>1?_slice.call(arguments):value;if(values===progressValues){deferred.notifyWith(contexts,values);}else if(! --remaining){deferred.resolveWith(contexts,values);}};},progressValues,progressContexts,resolveContexts; // Add listeners to Deferred subordinates; treat others as resolved
if(length>1){progressValues=new Array(length);progressContexts=new Array(length);resolveContexts=new Array(length);for(;i<length;i++){if(resolveValues[i]&&jQuery.isFunction(resolveValues[i].promise)){resolveValues[i].promise().done(updateFunc(i,resolveContexts,resolveValues)).fail(deferred.reject).progress(updateFunc(i,progressContexts,progressValues));}else {--remaining;}}} // If we're not waiting on anything, resolve the master
if(!remaining){deferred.resolveWith(resolveContexts,resolveValues);}return deferred.promise();}}); // The deferred used on DOM ready
var readyList;jQuery.fn.ready=function(fn){ // Add the callback
jQuery.ready.promise().done(fn);return this;};jQuery.extend({ // Is the DOM ready to be used? Set to true once it occurs.
isReady:false, // A counter to track how many items to wait for before
// the ready event fires. See #6781
readyWait:1, // Hold (or release) the ready event
holdReady:function holdReady(hold){if(hold){jQuery.readyWait++;}else {jQuery.ready(true);}}, // Handle when the DOM is ready
ready:function ready(wait){ // Abort if there are pending holds or we're already ready
if(wait===true?--jQuery.readyWait:jQuery.isReady){return;} // Remember that the DOM is ready
jQuery.isReady=true; // If a normal DOM Ready event fired, decrement, and wait if need be
if(wait!==true&&--jQuery.readyWait>0){return;} // If there are functions bound, to execute
readyList.resolveWith(document,[jQuery]); // Trigger any bound ready events
if(jQuery.fn.triggerHandler){jQuery(document).triggerHandler("ready");jQuery(document).off("ready");}}}); /**
 * The ready event handler and self cleanup method
 */function completed(){document.removeEventListener("DOMContentLoaded",completed,false);window.removeEventListener("load",completed,false);jQuery.ready();}jQuery.ready.promise=function(obj){if(!readyList){readyList=jQuery.Deferred(); // Catch cases where $(document).ready() is called after the browser event has already occurred.
// We once tried to use readyState "interactive" here, but it caused issues like the one
// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
if(document.readyState==="complete"){ // Handle it asynchronously to allow scripts the opportunity to delay ready
setTimeout(jQuery.ready);}else { // Use the handy event callback
document.addEventListener("DOMContentLoaded",completed,false); // A fallback to window.onload, that will always work
window.addEventListener("load",completed,false);}}return readyList.promise(obj);}; // Kick off the DOM ready check even if the user does not
jQuery.ready.promise(); // Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
var access=jQuery.access=function(elems,fn,key,value,chainable,emptyGet,raw){var i=0,len=elems.length,bulk=key==null; // Sets many values
if(jQuery.type(key)==="object"){chainable=true;for(i in key){jQuery.access(elems,fn,i,key[i],true,emptyGet,raw);} // Sets one value
}else if(value!==undefined){chainable=true;if(!jQuery.isFunction(value)){raw=true;}if(bulk){ // Bulk operations run against the entire set
if(raw){fn.call(elems,value);fn=null; // ...except when executing function values
}else {bulk=fn;fn=function fn(elem,key,value){return bulk.call(jQuery(elem),value);};}}if(fn){for(;i<len;i++){fn(elems[i],key,raw?value:value.call(elems[i],i,fn(elems[i],key)));}}}return chainable?elems: // Gets
bulk?fn.call(elems):len?fn(elems[0],key):emptyGet;}; /**
 * Determines whether an object can have data
 */jQuery.acceptData=function(owner){ // Accepts only:
//  - Node
//    - Node.ELEMENT_NODE
//    - Node.DOCUMENT_NODE
//  - Object
//    - Any
/* jshint -W018 */return owner.nodeType===1||owner.nodeType===9||! +owner.nodeType;};function Data(){ // Support: Android<4,
// Old WebKit does not have Object.preventExtensions/freeze method,
// return new empty object instead with no [[set]] accessor
Object.defineProperty(this.cache={},0,{get:function get(){return {};}});this.expando=jQuery.expando+Data.uid++;}Data.uid=1;Data.accepts=jQuery.acceptData;Data.prototype={key:function key(owner){ // We can accept data for non-element nodes in modern browsers,
// but we should not, see #8335.
// Always return the key for a frozen object.
if(!Data.accepts(owner)){return 0;}var descriptor={}, // Check if the owner object already has a cache key
unlock=owner[this.expando]; // If not, create one
if(!unlock){unlock=Data.uid++; // Secure it in a non-enumerable, non-writable property
try{descriptor[this.expando]={value:unlock};Object.defineProperties(owner,descriptor); // Support: Android<4
// Fallback to a less secure definition
}catch(e){descriptor[this.expando]=unlock;jQuery.extend(owner,descriptor);}} // Ensure the cache object
if(!this.cache[unlock]){this.cache[unlock]={};}return unlock;},set:function set(owner,data,value){var prop, // There may be an unlock assigned to this node,
// if there is no entry for this "owner", create one inline
// and set the unlock as though an owner entry had always existed
unlock=this.key(owner),cache=this.cache[unlock]; // Handle: [ owner, key, value ] args
if(typeof data==="string"){cache[data]=value; // Handle: [ owner, { properties } ] args
}else { // Fresh assignments by object are shallow copied
if(jQuery.isEmptyObject(cache)){jQuery.extend(this.cache[unlock],data); // Otherwise, copy the properties one-by-one to the cache object
}else {for(prop in data){cache[prop]=data[prop];}}}return cache;},get:function get(owner,key){ // Either a valid cache is found, or will be created.
// New caches will be created and the unlock returned,
// allowing direct access to the newly created
// empty data object. A valid owner object must be provided.
var cache=this.cache[this.key(owner)];return key===undefined?cache:cache[key];},access:function access(owner,key,value){var stored; // In cases where either:
//
//   1. No key was specified
//   2. A string key was specified, but no value provided
//
// Take the "read" path and allow the get method to determine
// which value to return, respectively either:
//
//   1. The entire cache object
//   2. The data stored at the key
//
if(key===undefined||key&&typeof key==="string"&&value===undefined){stored=this.get(owner,key);return stored!==undefined?stored:this.get(owner,jQuery.camelCase(key));} // [*]When the key is not a string, or both a key and value
// are specified, set or extend (existing objects) with either:
//
//   1. An object of properties
//   2. A key and value
//
this.set(owner,key,value); // Since the "set" path can have two possible entry points
// return the expected data based on which path was taken[*]
return value!==undefined?value:key;},remove:function remove(owner,key){var i,name,camel,unlock=this.key(owner),cache=this.cache[unlock];if(key===undefined){this.cache[unlock]={};}else { // Support array or space separated string of keys
if(jQuery.isArray(key)){ // If "name" is an array of keys...
// When data is initially created, via ("key", "val") signature,
// keys will be converted to camelCase.
// Since there is no way to tell _how_ a key was added, remove
// both plain key and camelCase key. #12786
// This will only penalize the array argument path.
name=key.concat(key.map(jQuery.camelCase));}else {camel=jQuery.camelCase(key); // Try the string as a key before any manipulation
if(key in cache){name=[key,camel];}else { // If a key with the spaces exists, use it.
// Otherwise, create an array by matching non-whitespace
name=camel;name=name in cache?[name]:name.match(rnotwhite)||[];}}i=name.length;while(i--){delete cache[name[i]];}}},hasData:function hasData(owner){return !jQuery.isEmptyObject(this.cache[owner[this.expando]]||{});},discard:function discard(owner){if(owner[this.expando]){delete this.cache[owner[this.expando]];}}};var data_priv=new Data();var data_user=new Data(); //	Implementation Summary
//
//	1. Enforce API surface and semantic compatibility with 1.9.x branch
//	2. Improve the module's maintainability by reducing the storage
//		paths to a single mechanism.
//	3. Use the same single mechanism to support "private" and "user" data.
//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
//	5. Avoid exposing implementation details on user objects (eg. expando properties)
//	6. Provide a clear path for implementation upgrade to WeakMap in 2014
var rbrace=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,rmultiDash=/([A-Z])/g;function dataAttr(elem,key,data){var name; // If nothing was found internally, try to fetch any
// data from the HTML5 data-* attribute
if(data===undefined&&elem.nodeType===1){name="data-"+key.replace(rmultiDash,"-$1").toLowerCase();data=elem.getAttribute(name);if(typeof data==="string"){try{data=data==="true"?true:data==="false"?false:data==="null"?null: // Only convert to a number if it doesn't change the string
+data+""===data?+data:rbrace.test(data)?jQuery.parseJSON(data):data;}catch(e){} // Make sure we set the data so it isn't changed later
data_user.set(elem,key,data);}else {data=undefined;}}return data;}jQuery.extend({hasData:function hasData(elem){return data_user.hasData(elem)||data_priv.hasData(elem);},data:function data(elem,name,_data){return data_user.access(elem,name,_data);},removeData:function removeData(elem,name){data_user.remove(elem,name);}, // TODO: Now that all calls to _data and _removeData have been replaced
// with direct calls to data_priv methods, these can be deprecated.
_data:function _data(elem,name,data){return data_priv.access(elem,name,data);},_removeData:function _removeData(elem,name){data_priv.remove(elem,name);}});jQuery.fn.extend({data:function data(key,value){var i,name,data,elem=this[0],attrs=elem&&elem.attributes; // Gets all values
if(key===undefined){if(this.length){data=data_user.get(elem);if(elem.nodeType===1&&!data_priv.get(elem,"hasDataAttrs")){i=attrs.length;while(i--){ // Support: IE11+
// The attrs elements can be null (#14894)
if(attrs[i]){name=attrs[i].name;if(name.indexOf("data-")===0){name=jQuery.camelCase(name.slice(5));dataAttr(elem,name,data[name]);}}}data_priv.set(elem,"hasDataAttrs",true);}}return data;} // Sets multiple values
if((typeof key==="undefined"?"undefined":_typeof(key))==="object"){return this.each(function(){data_user.set(this,key);});}return access(this,function(value){var data,camelKey=jQuery.camelCase(key); // The calling jQuery object (element matches) is not empty
// (and therefore has an element appears at this[ 0 ]) and the
// `value` parameter was not undefined. An empty jQuery object
// will result in `undefined` for elem = this[ 0 ] which will
// throw an exception if an attempt to read a data cache is made.
if(elem&&value===undefined){ // Attempt to get data from the cache
// with the key as-is
data=data_user.get(elem,key);if(data!==undefined){return data;} // Attempt to get data from the cache
// with the key camelized
data=data_user.get(elem,camelKey);if(data!==undefined){return data;} // Attempt to "discover" the data in
// HTML5 custom data-* attrs
data=dataAttr(elem,camelKey,undefined);if(data!==undefined){return data;} // We tried really hard, but the data doesn't exist.
return;} // Set the data...
this.each(function(){ // First, attempt to store a copy or reference of any
// data that might've been store with a camelCased key.
var data=data_user.get(this,camelKey); // For HTML5 data-* attribute interop, we have to
// store property names with dashes in a camelCase form.
// This might not apply to all properties...*
data_user.set(this,camelKey,value); // *... In the case of properties that might _actually_
// have dashes, we need to also store a copy of that
// unchanged property.
if(key.indexOf("-")!==-1&&data!==undefined){data_user.set(this,key,value);}});},null,value,arguments.length>1,null,true);},removeData:function removeData(key){return this.each(function(){data_user.remove(this,key);});}});jQuery.extend({queue:function queue(elem,type,data){var queue;if(elem){type=(type||"fx")+"queue";queue=data_priv.get(elem,type); // Speed up dequeue by getting out quickly if this is just a lookup
if(data){if(!queue||jQuery.isArray(data)){queue=data_priv.access(elem,type,jQuery.makeArray(data));}else {queue.push(data);}}return queue||[];}},dequeue:function dequeue(elem,type){type=type||"fx";var queue=jQuery.queue(elem,type),startLength=queue.length,fn=queue.shift(),hooks=jQuery._queueHooks(elem,type),next=function next(){jQuery.dequeue(elem,type);}; // If the fx queue is dequeued, always remove the progress sentinel
if(fn==="inprogress"){fn=queue.shift();startLength--;}if(fn){ // Add a progress sentinel to prevent the fx queue from being
// automatically dequeued
if(type==="fx"){queue.unshift("inprogress");} // Clear up the last queue stop function
delete hooks.stop;fn.call(elem,next,hooks);}if(!startLength&&hooks){hooks.empty.fire();}}, // Not public - generate a queueHooks object, or return the current one
_queueHooks:function _queueHooks(elem,type){var key=type+"queueHooks";return data_priv.get(elem,key)||data_priv.access(elem,key,{empty:jQuery.Callbacks("once memory").add(function(){data_priv.remove(elem,[type+"queue",key]);})});}});jQuery.fn.extend({queue:function queue(type,data){var setter=2;if(typeof type!=="string"){data=type;type="fx";setter--;}if(arguments.length<setter){return jQuery.queue(this[0],type);}return data===undefined?this:this.each(function(){var queue=jQuery.queue(this,type,data); // Ensure a hooks for this queue
jQuery._queueHooks(this,type);if(type==="fx"&&queue[0]!=="inprogress"){jQuery.dequeue(this,type);}});},dequeue:function dequeue(type){return this.each(function(){jQuery.dequeue(this,type);});},clearQueue:function clearQueue(type){return this.queue(type||"fx",[]);}, // Get a promise resolved when queues of a certain type
// are emptied (fx is the type by default)
promise:function promise(type,obj){var tmp,count=1,defer=jQuery.Deferred(),elements=this,i=this.length,resolve=function resolve(){if(! --count){defer.resolveWith(elements,[elements]);}};if(typeof type!=="string"){obj=type;type=undefined;}type=type||"fx";while(i--){tmp=data_priv.get(elements[i],type+"queueHooks");if(tmp&&tmp.empty){count++;tmp.empty.add(resolve);}}resolve();return defer.promise(obj);}});var pnum=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;var cssExpand=["Top","Right","Bottom","Left"];var isHidden=function isHidden(elem,el){ // isHidden might be called from jQuery#filter function;
// in that case, element will be second argument
elem=el||elem;return jQuery.css(elem,"display")==="none"||!jQuery.contains(elem.ownerDocument,elem);};var rcheckableType=/^(?:checkbox|radio)$/i;(function(){var fragment=document.createDocumentFragment(),div=fragment.appendChild(document.createElement("div")),input=document.createElement("input"); // Support: Safari<=5.1
// Check state lost if the name is set (#11217)
// Support: Windows Web Apps (WWA)
// `name` and `type` must use .setAttribute for WWA (#14901)
input.setAttribute("type","radio");input.setAttribute("checked","checked");input.setAttribute("name","t");div.appendChild(input); // Support: Safari<=5.1, Android<4.2
// Older WebKit doesn't clone checked state correctly in fragments
support.checkClone=div.cloneNode(true).cloneNode(true).lastChild.checked; // Support: IE<=11+
// Make sure textarea (and checkbox) defaultValue is properly cloned
div.innerHTML="<textarea>x</textarea>";support.noCloneChecked=!!div.cloneNode(true).lastChild.defaultValue;})();var strundefined=typeof undefined==="undefined"?"undefined":_typeof(undefined);support.focusinBubbles="onfocusin" in window;var rkeyEvent=/^key/,rmouseEvent=/^(?:mouse|pointer|contextmenu)|click/,rfocusMorph=/^(?:focusinfocus|focusoutblur)$/,rtypenamespace=/^([^.]*)(?:\.(.+)|)$/;function returnTrue(){return true;}function returnFalse(){return false;}function safeActiveElement(){try{return document.activeElement;}catch(err){}} /*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */jQuery.event={global:{},add:function add(elem,types,handler,data,selector){var handleObjIn,eventHandle,tmp,events,t,handleObj,special,handlers,type,namespaces,origType,elemData=data_priv.get(elem); // Don't attach events to noData or text/comment nodes (but allow plain objects)
if(!elemData){return;} // Caller can pass in an object of custom data in lieu of the handler
if(handler.handler){handleObjIn=handler;handler=handleObjIn.handler;selector=handleObjIn.selector;} // Make sure that the handler has a unique ID, used to find/remove it later
if(!handler.guid){handler.guid=jQuery.guid++;} // Init the element's event structure and main handler, if this is the first
if(!(events=elemData.events)){events=elemData.events={};}if(!(eventHandle=elemData.handle)){eventHandle=elemData.handle=function(e){ // Discard the second event of a jQuery.event.trigger() and
// when an event is called after a page has unloaded
return (typeof jQuery==="undefined"?"undefined":_typeof(jQuery))!==strundefined&&jQuery.event.triggered!==e.type?jQuery.event.dispatch.apply(elem,arguments):undefined;};} // Handle multiple events separated by a space
types=(types||"").match(rnotwhite)||[""];t=types.length;while(t--){tmp=rtypenamespace.exec(types[t])||[];type=origType=tmp[1];namespaces=(tmp[2]||"").split(".").sort(); // There *must* be a type, no attaching namespace-only handlers
if(!type){continue;} // If event changes its type, use the special event handlers for the changed type
special=jQuery.event.special[type]||{}; // If selector defined, determine special event api type, otherwise given type
type=(selector?special.delegateType:special.bindType)||type; // Update special based on newly reset type
special=jQuery.event.special[type]||{}; // handleObj is passed to all event handlers
handleObj=jQuery.extend({type:type,origType:origType,data:data,handler:handler,guid:handler.guid,selector:selector,needsContext:selector&&jQuery.expr.match.needsContext.test(selector),namespace:namespaces.join(".")},handleObjIn); // Init the event handler queue if we're the first
if(!(handlers=events[type])){handlers=events[type]=[];handlers.delegateCount=0; // Only use addEventListener if the special events handler returns false
if(!special.setup||special.setup.call(elem,data,namespaces,eventHandle)===false){if(elem.addEventListener){elem.addEventListener(type,eventHandle,false);}}}if(special.add){special.add.call(elem,handleObj);if(!handleObj.handler.guid){handleObj.handler.guid=handler.guid;}} // Add to the element's handler list, delegates in front
if(selector){handlers.splice(handlers.delegateCount++,0,handleObj);}else {handlers.push(handleObj);} // Keep track of which events have ever been used, for event optimization
jQuery.event.global[type]=true;}}, // Detach an event or set of events from an element
remove:function remove(elem,types,handler,selector,mappedTypes){var j,origCount,tmp,events,t,handleObj,special,handlers,type,namespaces,origType,elemData=data_priv.hasData(elem)&&data_priv.get(elem);if(!elemData||!(events=elemData.events)){return;} // Once for each type.namespace in types; type may be omitted
types=(types||"").match(rnotwhite)||[""];t=types.length;while(t--){tmp=rtypenamespace.exec(types[t])||[];type=origType=tmp[1];namespaces=(tmp[2]||"").split(".").sort(); // Unbind all events (on this namespace, if provided) for the element
if(!type){for(type in events){jQuery.event.remove(elem,type+types[t],handler,selector,true);}continue;}special=jQuery.event.special[type]||{};type=(selector?special.delegateType:special.bindType)||type;handlers=events[type]||[];tmp=tmp[2]&&new RegExp("(^|\\.)"+namespaces.join("\\.(?:.*\\.|)")+"(\\.|$)"); // Remove matching events
origCount=j=handlers.length;while(j--){handleObj=handlers[j];if((mappedTypes||origType===handleObj.origType)&&(!handler||handler.guid===handleObj.guid)&&(!tmp||tmp.test(handleObj.namespace))&&(!selector||selector===handleObj.selector||selector==="**"&&handleObj.selector)){handlers.splice(j,1);if(handleObj.selector){handlers.delegateCount--;}if(special.remove){special.remove.call(elem,handleObj);}}} // Remove generic event handler if we removed something and no more handlers exist
// (avoids potential for endless recursion during removal of special event handlers)
if(origCount&&!handlers.length){if(!special.teardown||special.teardown.call(elem,namespaces,elemData.handle)===false){jQuery.removeEvent(elem,type,elemData.handle);}delete events[type];}} // Remove the expando if it's no longer used
if(jQuery.isEmptyObject(events)){delete elemData.handle;data_priv.remove(elem,"events");}},trigger:function trigger(event,data,elem,onlyHandlers){var i,cur,tmp,bubbleType,ontype,handle,special,eventPath=[elem||document],type=hasOwn.call(event,"type")?event.type:event,namespaces=hasOwn.call(event,"namespace")?event.namespace.split("."):[];cur=tmp=elem=elem||document; // Don't do events on text and comment nodes
if(elem.nodeType===3||elem.nodeType===8){return;} // focus/blur morphs to focusin/out; ensure we're not firing them right now
if(rfocusMorph.test(type+jQuery.event.triggered)){return;}if(type.indexOf(".")>=0){ // Namespaced trigger; create a regexp to match event type in handle()
namespaces=type.split(".");type=namespaces.shift();namespaces.sort();}ontype=type.indexOf(":")<0&&"on"+type; // Caller can pass in a jQuery.Event object, Object, or just an event type string
event=event[jQuery.expando]?event:new jQuery.Event(type,(typeof event==="undefined"?"undefined":_typeof(event))==="object"&&event); // Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
event.isTrigger=onlyHandlers?2:3;event.namespace=namespaces.join(".");event.namespace_re=event.namespace?new RegExp("(^|\\.)"+namespaces.join("\\.(?:.*\\.|)")+"(\\.|$)"):null; // Clean up the event in case it is being reused
event.result=undefined;if(!event.target){event.target=elem;} // Clone any incoming data and prepend the event, creating the handler arg list
data=data==null?[event]:jQuery.makeArray(data,[event]); // Allow special events to draw outside the lines
special=jQuery.event.special[type]||{};if(!onlyHandlers&&special.trigger&&special.trigger.apply(elem,data)===false){return;} // Determine event propagation path in advance, per W3C events spec (#9951)
// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
if(!onlyHandlers&&!special.noBubble&&!jQuery.isWindow(elem)){bubbleType=special.delegateType||type;if(!rfocusMorph.test(bubbleType+type)){cur=cur.parentNode;}for(;cur;cur=cur.parentNode){eventPath.push(cur);tmp=cur;} // Only add window if we got to document (e.g., not plain obj or detached DOM)
if(tmp===(elem.ownerDocument||document)){eventPath.push(tmp.defaultView||tmp.parentWindow||window);}} // Fire handlers on the event path
i=0;while((cur=eventPath[i++])&&!event.isPropagationStopped()){event.type=i>1?bubbleType:special.bindType||type; // jQuery handler
handle=(data_priv.get(cur,"events")||{})[event.type]&&data_priv.get(cur,"handle");if(handle){handle.apply(cur,data);} // Native handler
handle=ontype&&cur[ontype];if(handle&&handle.apply&&jQuery.acceptData(cur)){event.result=handle.apply(cur,data);if(event.result===false){event.preventDefault();}}}event.type=type; // If nobody prevented the default action, do it now
if(!onlyHandlers&&!event.isDefaultPrevented()){if((!special._default||special._default.apply(eventPath.pop(),data)===false)&&jQuery.acceptData(elem)){ // Call a native DOM method on the target with the same name name as the event.
// Don't do default actions on window, that's where global variables be (#6170)
if(ontype&&jQuery.isFunction(elem[type])&&!jQuery.isWindow(elem)){ // Don't re-trigger an onFOO event when we call its FOO() method
tmp=elem[ontype];if(tmp){elem[ontype]=null;} // Prevent re-triggering of the same event, since we already bubbled it above
jQuery.event.triggered=type;elem[type]();jQuery.event.triggered=undefined;if(tmp){elem[ontype]=tmp;}}}}return event.result;},dispatch:function dispatch(event){ // Make a writable jQuery.Event from the native event object
event=jQuery.event.fix(event);var i,j,ret,matched,handleObj,handlerQueue=[],args=_slice.call(arguments),handlers=(data_priv.get(this,"events")||{})[event.type]||[],special=jQuery.event.special[event.type]||{}; // Use the fix-ed jQuery.Event rather than the (read-only) native event
args[0]=event;event.delegateTarget=this; // Call the preDispatch hook for the mapped type, and let it bail if desired
if(special.preDispatch&&special.preDispatch.call(this,event)===false){return;} // Determine handlers
handlerQueue=jQuery.event.handlers.call(this,event,handlers); // Run delegates first; they may want to stop propagation beneath us
i=0;while((matched=handlerQueue[i++])&&!event.isPropagationStopped()){event.currentTarget=matched.elem;j=0;while((handleObj=matched.handlers[j++])&&!event.isImmediatePropagationStopped()){ // Triggered event must either 1) have no namespace, or 2) have namespace(s)
// a subset or equal to those in the bound event (both can have no namespace).
if(!event.namespace_re||event.namespace_re.test(handleObj.namespace)){event.handleObj=handleObj;event.data=handleObj.data;ret=((jQuery.event.special[handleObj.origType]||{}).handle||handleObj.handler).apply(matched.elem,args);if(ret!==undefined){if((event.result=ret)===false){event.preventDefault();event.stopPropagation();}}}}} // Call the postDispatch hook for the mapped type
if(special.postDispatch){special.postDispatch.call(this,event);}return event.result;},handlers:function handlers(event,_handlers){var i,matches,sel,handleObj,handlerQueue=[],delegateCount=_handlers.delegateCount,cur=event.target; // Find delegate handlers
// Black-hole SVG <use> instance trees (#13180)
// Avoid non-left-click bubbling in Firefox (#3861)
if(delegateCount&&cur.nodeType&&(!event.button||event.type!=="click")){for(;cur!==this;cur=cur.parentNode||this){ // Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
if(cur.disabled!==true||event.type!=="click"){matches=[];for(i=0;i<delegateCount;i++){handleObj=_handlers[i]; // Don't conflict with Object.prototype properties (#13203)
sel=handleObj.selector+" ";if(matches[sel]===undefined){matches[sel]=handleObj.needsContext?jQuery(sel,this).index(cur)>=0:jQuery.find(sel,this,null,[cur]).length;}if(matches[sel]){matches.push(handleObj);}}if(matches.length){handlerQueue.push({elem:cur,handlers:matches});}}}} // Add the remaining (directly-bound) handlers
if(delegateCount<_handlers.length){handlerQueue.push({elem:this,handlers:_handlers.slice(delegateCount)});}return handlerQueue;}, // Includes some event props shared by KeyEvent and MouseEvent
props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function filter(event,original){ // Add which for key events
if(event.which==null){event.which=original.charCode!=null?original.charCode:original.keyCode;}return event;}},mouseHooks:{props:"button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function filter(event,original){var eventDoc,doc,body,button=original.button; // Calculate pageX/Y if missing and clientX/Y available
if(event.pageX==null&&original.clientX!=null){eventDoc=event.target.ownerDocument||document;doc=eventDoc.documentElement;body=eventDoc.body;event.pageX=original.clientX+(doc&&doc.scrollLeft||body&&body.scrollLeft||0)-(doc&&doc.clientLeft||body&&body.clientLeft||0);event.pageY=original.clientY+(doc&&doc.scrollTop||body&&body.scrollTop||0)-(doc&&doc.clientTop||body&&body.clientTop||0);} // Add which for click: 1 === left; 2 === middle; 3 === right
// Note: button is not normalized, so don't use it
if(!event.which&&button!==undefined){event.which=button&1?1:button&2?3:button&4?2:0;}return event;}},fix:function fix(event){if(event[jQuery.expando]){return event;} // Create a writable copy of the event object and normalize some properties
var i,prop,copy,type=event.type,originalEvent=event,fixHook=this.fixHooks[type];if(!fixHook){this.fixHooks[type]=fixHook=rmouseEvent.test(type)?this.mouseHooks:rkeyEvent.test(type)?this.keyHooks:{};}copy=fixHook.props?this.props.concat(fixHook.props):this.props;event=new jQuery.Event(originalEvent);i=copy.length;while(i--){prop=copy[i];event[prop]=originalEvent[prop];} // Support: Cordova 2.5 (WebKit) (#13255)
// All events should have a target; Cordova deviceready doesn't
if(!event.target){event.target=document;} // Support: Safari 6.0+, Chrome<28
// Target should not be a text node (#504, #13143)
if(event.target.nodeType===3){event.target=event.target.parentNode;}return fixHook.filter?fixHook.filter(event,originalEvent):event;},special:{load:{ // Prevent triggered image.load events from bubbling to window.load
noBubble:true},focus:{ // Fire native event if possible so blur/focus sequence is correct
trigger:function trigger(){if(this!==safeActiveElement()&&this.focus){this.focus();return false;}},delegateType:"focusin"},blur:{trigger:function trigger(){if(this===safeActiveElement()&&this.blur){this.blur();return false;}},delegateType:"focusout"},click:{ // For checkbox, fire native event so checked state will be right
trigger:function trigger(){if(this.type==="checkbox"&&this.click&&jQuery.nodeName(this,"input")){this.click();return false;}}, // For cross-browser consistency, don't fire native .click() on links
_default:function _default(event){return jQuery.nodeName(event.target,"a");}},beforeunload:{postDispatch:function postDispatch(event){ // Support: Firefox 20+
// Firefox doesn't alert if the returnValue field is not set.
if(event.result!==undefined&&event.originalEvent){event.originalEvent.returnValue=event.result;}}}},simulate:function simulate(type,elem,event,bubble){ // Piggyback on a donor event to simulate a different one.
// Fake originalEvent to avoid donor's stopPropagation, but if the
// simulated event prevents default then we do the same on the donor.
var e=jQuery.extend(new jQuery.Event(),event,{type:type,isSimulated:true,originalEvent:{}});if(bubble){jQuery.event.trigger(e,null,elem);}else {jQuery.event.dispatch.call(elem,e);}if(e.isDefaultPrevented()){event.preventDefault();}}};jQuery.removeEvent=function(elem,type,handle){if(elem.removeEventListener){elem.removeEventListener(type,handle,false);}};jQuery.Event=function(src,props){ // Allow instantiation without the 'new' keyword
if(!(this instanceof jQuery.Event)){return new jQuery.Event(src,props);} // Event object
if(src&&src.type){this.originalEvent=src;this.type=src.type; // Events bubbling up the document may have been marked as prevented
// by a handler lower down the tree; reflect the correct value.
this.isDefaultPrevented=src.defaultPrevented||src.defaultPrevented===undefined&& // Support: Android<4.0
src.returnValue===false?returnTrue:returnFalse; // Event type
}else {this.type=src;} // Put explicitly provided properties onto the event object
if(props){jQuery.extend(this,props);} // Create a timestamp if incoming event doesn't have one
this.timeStamp=src&&src.timeStamp||jQuery.now(); // Mark it as fixed
this[jQuery.expando]=true;}; // jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype={isDefaultPrevented:returnFalse,isPropagationStopped:returnFalse,isImmediatePropagationStopped:returnFalse,preventDefault:function preventDefault(){var e=this.originalEvent;this.isDefaultPrevented=returnTrue;if(e&&e.preventDefault){e.preventDefault();}},stopPropagation:function stopPropagation(){var e=this.originalEvent;this.isPropagationStopped=returnTrue;if(e&&e.stopPropagation){e.stopPropagation();}},stopImmediatePropagation:function stopImmediatePropagation(){var e=this.originalEvent;this.isImmediatePropagationStopped=returnTrue;if(e&&e.stopImmediatePropagation){e.stopImmediatePropagation();}this.stopPropagation();}}; // Create mouseenter/leave events using mouseover/out and event-time checks
// Support: Chrome 15+
jQuery.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(orig,fix){jQuery.event.special[orig]={delegateType:fix,bindType:fix,handle:function handle(event){var ret,target=this,related=event.relatedTarget,handleObj=event.handleObj; // For mousenter/leave call the handler if related is outside the target.
// NB: No relatedTarget if the mouse left/entered the browser window
if(!related||related!==target&&!jQuery.contains(target,related)){event.type=handleObj.origType;ret=handleObj.handler.apply(this,arguments);event.type=fix;}return ret;}};}); // Support: Firefox, Chrome, Safari
// Create "bubbling" focus and blur events
if(!support.focusinBubbles){jQuery.each({focus:"focusin",blur:"focusout"},function(orig,fix){ // Attach a single capturing handler on the document while someone wants focusin/focusout
var handler=function handler(event){jQuery.event.simulate(fix,event.target,jQuery.event.fix(event),true);};jQuery.event.special[fix]={setup:function setup(){var doc=this.ownerDocument||this,attaches=data_priv.access(doc,fix);if(!attaches){doc.addEventListener(orig,handler,true);}data_priv.access(doc,fix,(attaches||0)+1);},teardown:function teardown(){var doc=this.ownerDocument||this,attaches=data_priv.access(doc,fix)-1;if(!attaches){doc.removeEventListener(orig,handler,true);data_priv.remove(doc,fix);}else {data_priv.access(doc,fix,attaches);}}};});}jQuery.fn.extend({on:function on(types,selector,data,fn, /*INTERNAL*/one){var origFn,type; // Types can be a map of types/handlers
if((typeof types==="undefined"?"undefined":_typeof(types))==="object"){ // ( types-Object, selector, data )
if(typeof selector!=="string"){ // ( types-Object, data )
data=data||selector;selector=undefined;}for(type in types){this.on(type,selector,data,types[type],one);}return this;}if(data==null&&fn==null){ // ( types, fn )
fn=selector;data=selector=undefined;}else if(fn==null){if(typeof selector==="string"){ // ( types, selector, fn )
fn=data;data=undefined;}else { // ( types, data, fn )
fn=data;data=selector;selector=undefined;}}if(fn===false){fn=returnFalse;}else if(!fn){return this;}if(one===1){origFn=fn;fn=function fn(event){ // Can use an empty set, since event contains the info
jQuery().off(event);return origFn.apply(this,arguments);}; // Use same guid so caller can remove using origFn
fn.guid=origFn.guid||(origFn.guid=jQuery.guid++);}return this.each(function(){jQuery.event.add(this,types,fn,data,selector);});},one:function one(types,selector,data,fn){return this.on(types,selector,data,fn,1);},off:function off(types,selector,fn){var handleObj,type;if(types&&types.preventDefault&&types.handleObj){ // ( event )  dispatched jQuery.Event
handleObj=types.handleObj;jQuery(types.delegateTarget).off(handleObj.namespace?handleObj.origType+"."+handleObj.namespace:handleObj.origType,handleObj.selector,handleObj.handler);return this;}if((typeof types==="undefined"?"undefined":_typeof(types))==="object"){ // ( types-object [, selector] )
for(type in types){this.off(type,selector,types[type]);}return this;}if(selector===false||typeof selector==="function"){ // ( types [, fn] )
fn=selector;selector=undefined;}if(fn===false){fn=returnFalse;}return this.each(function(){jQuery.event.remove(this,types,fn,selector);});},trigger:function trigger(type,data){return this.each(function(){jQuery.event.trigger(type,data,this);});},triggerHandler:function triggerHandler(type,data){var elem=this[0];if(elem){return jQuery.event.trigger(type,data,elem,true);}}});var rxhtmlTag=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,rtagName=/<([\w:]+)/,rhtml=/<|&#?\w+;/,rnoInnerhtml=/<(?:script|style|link)/i, // checked="checked" or checked
rchecked=/checked\s*(?:[^=]|=\s*.checked.)/i,rscriptType=/^$|\/(?:java|ecma)script/i,rscriptTypeMasked=/^true\/(.*)/,rcleanScript=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g, // We have to close these tags to support XHTML (#13200)
wrapMap={ // Support: IE9
option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]}; // Support: IE9
wrapMap.optgroup=wrapMap.option;wrapMap.tbody=wrapMap.tfoot=wrapMap.colgroup=wrapMap.caption=wrapMap.thead;wrapMap.th=wrapMap.td; // Support: 1.x compatibility
// Manipulating tables requires a tbody
function manipulationTarget(elem,content){return jQuery.nodeName(elem,"table")&&jQuery.nodeName(content.nodeType!==11?content:content.firstChild,"tr")?elem.getElementsByTagName("tbody")[0]||elem.appendChild(elem.ownerDocument.createElement("tbody")):elem;} // Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript(elem){elem.type=(elem.getAttribute("type")!==null)+"/"+elem.type;return elem;}function restoreScript(elem){var match=rscriptTypeMasked.exec(elem.type);if(match){elem.type=match[1];}else {elem.removeAttribute("type");}return elem;} // Mark scripts as having already been evaluated
function setGlobalEval(elems,refElements){var i=0,l=elems.length;for(;i<l;i++){data_priv.set(elems[i],"globalEval",!refElements||data_priv.get(refElements[i],"globalEval"));}}function cloneCopyEvent(src,dest){var i,l,type,pdataOld,pdataCur,udataOld,udataCur,events;if(dest.nodeType!==1){return;} // 1. Copy private data: events, handlers, etc.
if(data_priv.hasData(src)){pdataOld=data_priv.access(src);pdataCur=data_priv.set(dest,pdataOld);events=pdataOld.events;if(events){delete pdataCur.handle;pdataCur.events={};for(type in events){for(i=0,l=events[type].length;i<l;i++){jQuery.event.add(dest,type,events[type][i]);}}}} // 2. Copy user data
if(data_user.hasData(src)){udataOld=data_user.access(src);udataCur=jQuery.extend({},udataOld);data_user.set(dest,udataCur);}}function getAll(context,tag){var ret=context.getElementsByTagName?context.getElementsByTagName(tag||"*"):context.querySelectorAll?context.querySelectorAll(tag||"*"):[];return tag===undefined||tag&&jQuery.nodeName(context,tag)?jQuery.merge([context],ret):ret;} // Fix IE bugs, see support tests
function fixInput(src,dest){var nodeName=dest.nodeName.toLowerCase(); // Fails to persist the checked state of a cloned checkbox or radio button.
if(nodeName==="input"&&rcheckableType.test(src.type)){dest.checked=src.checked; // Fails to return the selected option to the default selected state when cloning options
}else if(nodeName==="input"||nodeName==="textarea"){dest.defaultValue=src.defaultValue;}}jQuery.extend({clone:function clone(elem,dataAndEvents,deepDataAndEvents){var i,l,srcElements,destElements,clone=elem.cloneNode(true),inPage=jQuery.contains(elem.ownerDocument,elem); // Fix IE cloning issues
if(!support.noCloneChecked&&(elem.nodeType===1||elem.nodeType===11)&&!jQuery.isXMLDoc(elem)){ // We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
destElements=getAll(clone);srcElements=getAll(elem);for(i=0,l=srcElements.length;i<l;i++){fixInput(srcElements[i],destElements[i]);}} // Copy the events from the original to the clone
if(dataAndEvents){if(deepDataAndEvents){srcElements=srcElements||getAll(elem);destElements=destElements||getAll(clone);for(i=0,l=srcElements.length;i<l;i++){cloneCopyEvent(srcElements[i],destElements[i]);}}else {cloneCopyEvent(elem,clone);}} // Preserve script evaluation history
destElements=getAll(clone,"script");if(destElements.length>0){setGlobalEval(destElements,!inPage&&getAll(elem,"script"));} // Return the cloned set
return clone;},buildFragment:function buildFragment(elems,context,scripts,selection){var elem,tmp,tag,wrap,contains,j,fragment=context.createDocumentFragment(),nodes=[],i=0,l=elems.length;for(;i<l;i++){elem=elems[i];if(elem||elem===0){ // Add nodes directly
if(jQuery.type(elem)==="object"){ // Support: QtWebKit, PhantomJS
// push.apply(_, arraylike) throws on ancient WebKit
jQuery.merge(nodes,elem.nodeType?[elem]:elem); // Convert non-html into a text node
}else if(!rhtml.test(elem)){nodes.push(context.createTextNode(elem)); // Convert html into DOM nodes
}else {tmp=tmp||fragment.appendChild(context.createElement("div")); // Deserialize a standard representation
tag=(rtagName.exec(elem)||["",""])[1].toLowerCase();wrap=wrapMap[tag]||wrapMap._default;tmp.innerHTML=wrap[1]+elem.replace(rxhtmlTag,"<$1></$2>")+wrap[2]; // Descend through wrappers to the right content
j=wrap[0];while(j--){tmp=tmp.lastChild;} // Support: QtWebKit, PhantomJS
// push.apply(_, arraylike) throws on ancient WebKit
jQuery.merge(nodes,tmp.childNodes); // Remember the top-level container
tmp=fragment.firstChild; // Ensure the created nodes are orphaned (#12392)
tmp.textContent="";}}} // Remove wrapper from fragment
fragment.textContent="";i=0;while(elem=nodes[i++]){ // #4087 - If origin and destination elements are the same, and this is
// that element, do not do anything
if(selection&&jQuery.inArray(elem,selection)!==-1){continue;}contains=jQuery.contains(elem.ownerDocument,elem); // Append to fragment
tmp=getAll(fragment.appendChild(elem),"script"); // Preserve script evaluation history
if(contains){setGlobalEval(tmp);} // Capture executables
if(scripts){j=0;while(elem=tmp[j++]){if(rscriptType.test(elem.type||"")){scripts.push(elem);}}}}return fragment;},cleanData:function cleanData(elems){var data,elem,type,key,special=jQuery.event.special,i=0;for(;(elem=elems[i])!==undefined;i++){if(jQuery.acceptData(elem)){key=elem[data_priv.expando];if(key&&(data=data_priv.cache[key])){if(data.events){for(type in data.events){if(special[type]){jQuery.event.remove(elem,type); // This is a shortcut to avoid jQuery.event.remove's overhead
}else {jQuery.removeEvent(elem,type,data.handle);}}}if(data_priv.cache[key]){ // Discard any remaining `private` data
delete data_priv.cache[key];}}} // Discard any remaining `user` data
delete data_user.cache[elem[data_user.expando]];}}});jQuery.fn.extend({text:function text(value){return access(this,function(value){return value===undefined?jQuery.text(this):this.empty().each(function(){if(this.nodeType===1||this.nodeType===11||this.nodeType===9){this.textContent=value;}});},null,value,arguments.length);},append:function append(){return this.domManip(arguments,function(elem){if(this.nodeType===1||this.nodeType===11||this.nodeType===9){var target=manipulationTarget(this,elem);target.appendChild(elem);}});},prepend:function prepend(){return this.domManip(arguments,function(elem){if(this.nodeType===1||this.nodeType===11||this.nodeType===9){var target=manipulationTarget(this,elem);target.insertBefore(elem,target.firstChild);}});},before:function before(){return this.domManip(arguments,function(elem){if(this.parentNode){this.parentNode.insertBefore(elem,this);}});},after:function after(){return this.domManip(arguments,function(elem){if(this.parentNode){this.parentNode.insertBefore(elem,this.nextSibling);}});},remove:function remove(selector,keepData /* Internal Use Only */){var elem,elems=selector?jQuery.filter(selector,this):this,i=0;for(;(elem=elems[i])!=null;i++){if(!keepData&&elem.nodeType===1){jQuery.cleanData(getAll(elem));}if(elem.parentNode){if(keepData&&jQuery.contains(elem.ownerDocument,elem)){setGlobalEval(getAll(elem,"script"));}elem.parentNode.removeChild(elem);}}return this;},empty:function empty(){var elem,i=0;for(;(elem=this[i])!=null;i++){if(elem.nodeType===1){ // Prevent memory leaks
jQuery.cleanData(getAll(elem,false)); // Remove any remaining nodes
elem.textContent="";}}return this;},clone:function clone(dataAndEvents,deepDataAndEvents){dataAndEvents=dataAndEvents==null?false:dataAndEvents;deepDataAndEvents=deepDataAndEvents==null?dataAndEvents:deepDataAndEvents;return this.map(function(){return jQuery.clone(this,dataAndEvents,deepDataAndEvents);});},html:function html(value){return access(this,function(value){var elem=this[0]||{},i=0,l=this.length;if(value===undefined&&elem.nodeType===1){return elem.innerHTML;} // See if we can take a shortcut and just use innerHTML
if(typeof value==="string"&&!rnoInnerhtml.test(value)&&!wrapMap[(rtagName.exec(value)||["",""])[1].toLowerCase()]){value=value.replace(rxhtmlTag,"<$1></$2>");try{for(;i<l;i++){elem=this[i]||{}; // Remove element nodes and prevent memory leaks
if(elem.nodeType===1){jQuery.cleanData(getAll(elem,false));elem.innerHTML=value;}}elem=0; // If using innerHTML throws an exception, use the fallback method
}catch(e){}}if(elem){this.empty().append(value);}},null,value,arguments.length);},replaceWith:function replaceWith(){var arg=arguments[0]; // Make the changes, replacing each context element with the new content
this.domManip(arguments,function(elem){arg=this.parentNode;jQuery.cleanData(getAll(this));if(arg){arg.replaceChild(elem,this);}}); // Force removal if there was no new content (e.g., from empty arguments)
return arg&&(arg.length||arg.nodeType)?this:this.remove();},detach:function detach(selector){return this.remove(selector,true);},domManip:function domManip(args,callback){ // Flatten any nested arrays
args=concat.apply([],args);var fragment,first,scripts,hasScripts,node,doc,i=0,l=this.length,set=this,iNoClone=l-1,value=args[0],isFunction=jQuery.isFunction(value); // We can't cloneNode fragments that contain checked, in WebKit
if(isFunction||l>1&&typeof value==="string"&&!support.checkClone&&rchecked.test(value)){return this.each(function(index){var self=set.eq(index);if(isFunction){args[0]=value.call(this,index,self.html());}self.domManip(args,callback);});}if(l){fragment=jQuery.buildFragment(args,this[0].ownerDocument,false,this);first=fragment.firstChild;if(fragment.childNodes.length===1){fragment=first;}if(first){scripts=jQuery.map(getAll(fragment,"script"),disableScript);hasScripts=scripts.length; // Use the original fragment for the last item instead of the first because it can end up
// being emptied incorrectly in certain situations (#8070).
for(;i<l;i++){node=fragment;if(i!==iNoClone){node=jQuery.clone(node,true,true); // Keep references to cloned scripts for later restoration
if(hasScripts){ // Support: QtWebKit
// jQuery.merge because push.apply(_, arraylike) throws
jQuery.merge(scripts,getAll(node,"script"));}}callback.call(this[i],node,i);}if(hasScripts){doc=scripts[scripts.length-1].ownerDocument; // Reenable scripts
jQuery.map(scripts,restoreScript); // Evaluate executable scripts on first document insertion
for(i=0;i<hasScripts;i++){node=scripts[i];if(rscriptType.test(node.type||"")&&!data_priv.access(node,"globalEval")&&jQuery.contains(doc,node)){if(node.src){ // Optional AJAX dependency, but won't run scripts if not present
if(jQuery._evalUrl){jQuery._evalUrl(node.src);}}else {jQuery.globalEval(node.textContent.replace(rcleanScript,""));}}}}}}return this;}});jQuery.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(name,original){jQuery.fn[name]=function(selector){var elems,ret=[],insert=jQuery(selector),last=insert.length-1,i=0;for(;i<=last;i++){elems=i===last?this:this.clone(true);jQuery(insert[i])[original](elems); // Support: QtWebKit
// .get() because push.apply(_, arraylike) throws
push.apply(ret,elems.get());}return this.pushStack(ret);};});var iframe,elemdisplay={}; /**
 * Retrieve the actual display of a element
 * @param {String} name nodeName of the element
 * @param {Object} doc Document object
 */ // Called only from within defaultDisplay
function actualDisplay(name,doc){var style,elem=jQuery(doc.createElement(name)).appendTo(doc.body), // getDefaultComputedStyle might be reliably used only on attached element
display=window.getDefaultComputedStyle&&(style=window.getDefaultComputedStyle(elem[0]))? // Use of this method is a temporary fix (more like optimization) until something better comes along,
// since it was removed from specification and supported only in FF
style.display:jQuery.css(elem[0],"display"); // We don't have any data stored on the element,
// so use "detach" method as fast way to get rid of the element
elem.detach();return display;} /**
 * Try to determine the default display value of an element
 * @param {String} nodeName
 */function defaultDisplay(nodeName){var doc=document,display=elemdisplay[nodeName];if(!display){display=actualDisplay(nodeName,doc); // If the simple way fails, read from inside an iframe
if(display==="none"||!display){ // Use the already-created iframe if possible
iframe=(iframe||jQuery("<iframe frameborder='0' width='0' height='0'/>")).appendTo(doc.documentElement); // Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
doc=iframe[0].contentDocument; // Support: IE
doc.write();doc.close();display=actualDisplay(nodeName,doc);iframe.detach();} // Store the correct default display
elemdisplay[nodeName]=display;}return display;}var rmargin=/^margin/;var rnumnonpx=new RegExp("^("+pnum+")(?!px)[a-z%]+$","i");var getStyles=function getStyles(elem){ // Support: IE<=11+, Firefox<=30+ (#15098, #14150)
// IE throws on elements created in popups
// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
if(elem.ownerDocument.defaultView.opener){return elem.ownerDocument.defaultView.getComputedStyle(elem,null);}return window.getComputedStyle(elem,null);};function curCSS(elem,name,computed){var width,minWidth,maxWidth,ret,style=elem.style;computed=computed||getStyles(elem); // Support: IE9
// getPropertyValue is only needed for .css('filter') (#12537)
if(computed){ret=computed.getPropertyValue(name)||computed[name];}if(computed){if(ret===""&&!jQuery.contains(elem.ownerDocument,elem)){ret=jQuery.style(elem,name);} // Support: iOS < 6
// A tribute to the "awesome hack by Dean Edwards"
// iOS < 6 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
if(rnumnonpx.test(ret)&&rmargin.test(name)){ // Remember the original values
width=style.width;minWidth=style.minWidth;maxWidth=style.maxWidth; // Put in the new values to get a computed value out
style.minWidth=style.maxWidth=style.width=ret;ret=computed.width; // Revert the changed values
style.width=width;style.minWidth=minWidth;style.maxWidth=maxWidth;}}return ret!==undefined? // Support: IE
// IE returns zIndex value as an integer.
ret+"":ret;}function addGetHookIf(conditionFn,hookFn){ // Define the hook, we'll check on the first run if it's really needed.
return {get:function get(){if(conditionFn()){ // Hook not needed (or it's not possible to use it due
// to missing dependency), remove it.
delete this.get;return;} // Hook needed; redefine it so that the support test is not executed again.
return (this.get=hookFn).apply(this,arguments);}};}(function(){var pixelPositionVal,boxSizingReliableVal,docElem=document.documentElement,container=document.createElement("div"),div=document.createElement("div");if(!div.style){return;} // Support: IE9-11+
// Style of cloned element affects source element cloned (#8908)
div.style.backgroundClip="content-box";div.cloneNode(true).style.backgroundClip="";support.clearCloneStyle=div.style.backgroundClip==="content-box";container.style.cssText="border:0;width:0;height:0;top:0;left:-9999px;margin-top:1px;"+"position:absolute";container.appendChild(div); // Executing both pixelPosition & boxSizingReliable tests require only one layout
// so they're executed at the same time to save the second computation.
function computePixelPositionAndBoxSizingReliable(){div.style.cssText= // Support: Firefox<29, Android 2.3
// Vendor-prefix box-sizing
"-webkit-box-sizing:border-box;-moz-box-sizing:border-box;"+"box-sizing:border-box;display:block;margin-top:1%;top:1%;"+"border:1px;padding:1px;width:4px;position:absolute";div.innerHTML="";docElem.appendChild(container);var divStyle=window.getComputedStyle(div,null);pixelPositionVal=divStyle.top!=="1%";boxSizingReliableVal=divStyle.width==="4px";docElem.removeChild(container);} // Support: node.js jsdom
// Don't assume that getComputedStyle is a property of the global object
if(window.getComputedStyle){jQuery.extend(support,{pixelPosition:function pixelPosition(){ // This test is executed only once but we still do memoizing
// since we can use the boxSizingReliable pre-computing.
// No need to check if the test was already performed, though.
computePixelPositionAndBoxSizingReliable();return pixelPositionVal;},boxSizingReliable:function boxSizingReliable(){if(boxSizingReliableVal==null){computePixelPositionAndBoxSizingReliable();}return boxSizingReliableVal;},reliableMarginRight:function reliableMarginRight(){ // Support: Android 2.3
// Check if div with explicit width and no margin-right incorrectly
// gets computed margin-right based on width of container. (#3333)
// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
// This support function is only executed once so no memoizing is needed.
var ret,marginDiv=div.appendChild(document.createElement("div")); // Reset CSS: box-sizing; display; margin; border; padding
marginDiv.style.cssText=div.style.cssText= // Support: Firefox<29, Android 2.3
// Vendor-prefix box-sizing
"-webkit-box-sizing:content-box;-moz-box-sizing:content-box;"+"box-sizing:content-box;display:block;margin:0;border:0;padding:0";marginDiv.style.marginRight=marginDiv.style.width="0";div.style.width="1px";docElem.appendChild(container);ret=!parseFloat(window.getComputedStyle(marginDiv,null).marginRight);docElem.removeChild(container);div.removeChild(marginDiv);return ret;}});}})(); // A method for quickly swapping in/out CSS properties to get correct calculations.
jQuery.swap=function(elem,options,callback,args){var ret,name,old={}; // Remember the old values, and insert the new ones
for(name in options){old[name]=elem.style[name];elem.style[name]=options[name];}ret=callback.apply(elem,args||[]); // Revert the old values
for(name in options){elem.style[name]=old[name];}return ret;};var  // Swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
rdisplayswap=/^(none|table(?!-c[ea]).+)/,rnumsplit=new RegExp("^("+pnum+")(.*)$","i"),rrelNum=new RegExp("^([+-])=("+pnum+")","i"),cssShow={position:"absolute",visibility:"hidden",display:"block"},cssNormalTransform={letterSpacing:"0",fontWeight:"400"},cssPrefixes=["Webkit","O","Moz","ms"]; // Return a css property mapped to a potentially vendor prefixed property
function vendorPropName(style,name){ // Shortcut for names that are not vendor prefixed
if(name in style){return name;} // Check for vendor prefixed names
var capName=name[0].toUpperCase()+name.slice(1),origName=name,i=cssPrefixes.length;while(i--){name=cssPrefixes[i]+capName;if(name in style){return name;}}return origName;}function setPositiveNumber(elem,value,subtract){var matches=rnumsplit.exec(value);return matches? // Guard against undefined "subtract", e.g., when used as in cssHooks
Math.max(0,matches[1]-(subtract||0))+(matches[2]||"px"):value;}function augmentWidthOrHeight(elem,name,extra,isBorderBox,styles){var i=extra===(isBorderBox?"border":"content")? // If we already have the right measurement, avoid augmentation
4: // Otherwise initialize for horizontal or vertical properties
name==="width"?1:0,val=0;for(;i<4;i+=2){ // Both box models exclude margin, so add it if we want it
if(extra==="margin"){val+=jQuery.css(elem,extra+cssExpand[i],true,styles);}if(isBorderBox){ // border-box includes padding, so remove it if we want content
if(extra==="content"){val-=jQuery.css(elem,"padding"+cssExpand[i],true,styles);} // At this point, extra isn't border nor margin, so remove border
if(extra!=="margin"){val-=jQuery.css(elem,"border"+cssExpand[i]+"Width",true,styles);}}else { // At this point, extra isn't content, so add padding
val+=jQuery.css(elem,"padding"+cssExpand[i],true,styles); // At this point, extra isn't content nor padding, so add border
if(extra!=="padding"){val+=jQuery.css(elem,"border"+cssExpand[i]+"Width",true,styles);}}}return val;}function getWidthOrHeight(elem,name,extra){ // Start with offset property, which is equivalent to the border-box value
var valueIsBorderBox=true,val=name==="width"?elem.offsetWidth:elem.offsetHeight,styles=getStyles(elem),isBorderBox=jQuery.css(elem,"boxSizing",false,styles)==="border-box"; // Some non-html elements return undefined for offsetWidth, so check for null/undefined
// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
if(val<=0||val==null){ // Fall back to computed then uncomputed css if necessary
val=curCSS(elem,name,styles);if(val<0||val==null){val=elem.style[name];} // Computed unit is not pixels. Stop here and return.
if(rnumnonpx.test(val)){return val;} // Check for style in case a browser which returns unreliable values
// for getComputedStyle silently falls back to the reliable elem.style
valueIsBorderBox=isBorderBox&&(support.boxSizingReliable()||val===elem.style[name]); // Normalize "", auto, and prepare for extra
val=parseFloat(val)||0;} // Use the active box-sizing model to add/subtract irrelevant styles
return val+augmentWidthOrHeight(elem,name,extra||(isBorderBox?"border":"content"),valueIsBorderBox,styles)+"px";}function showHide(elements,show){var display,elem,hidden,values=[],index=0,length=elements.length;for(;index<length;index++){elem=elements[index];if(!elem.style){continue;}values[index]=data_priv.get(elem,"olddisplay");display=elem.style.display;if(show){ // Reset the inline display of this element to learn if it is
// being hidden by cascaded rules or not
if(!values[index]&&display==="none"){elem.style.display="";} // Set elements which have been overridden with display: none
// in a stylesheet to whatever the default browser style is
// for such an element
if(elem.style.display===""&&isHidden(elem)){values[index]=data_priv.access(elem,"olddisplay",defaultDisplay(elem.nodeName));}}else {hidden=isHidden(elem);if(display!=="none"||!hidden){data_priv.set(elem,"olddisplay",hidden?display:jQuery.css(elem,"display"));}}} // Set the display of most of the elements in a second loop
// to avoid the constant reflow
for(index=0;index<length;index++){elem=elements[index];if(!elem.style){continue;}if(!show||elem.style.display==="none"||elem.style.display===""){elem.style.display=show?values[index]||"":"none";}}return elements;}jQuery.extend({ // Add in style property hooks for overriding the default
// behavior of getting and setting a style property
cssHooks:{opacity:{get:function get(elem,computed){if(computed){ // We should always get a number back from opacity
var ret=curCSS(elem,"opacity");return ret===""?"1":ret;}}}}, // Don't automatically add "px" to these possibly-unitless properties
cssNumber:{"columnCount":true,"fillOpacity":true,"flexGrow":true,"flexShrink":true,"fontWeight":true,"lineHeight":true,"opacity":true,"order":true,"orphans":true,"widows":true,"zIndex":true,"zoom":true}, // Add in properties whose names you wish to fix before
// setting or getting the value
cssProps:{"float":"cssFloat"}, // Get and set the style property on a DOM Node
style:function style(elem,name,value,extra){ // Don't set styles on text and comment nodes
if(!elem||elem.nodeType===3||elem.nodeType===8||!elem.style){return;} // Make sure that we're working with the right name
var ret,type,hooks,origName=jQuery.camelCase(name),style=elem.style;name=jQuery.cssProps[origName]||(jQuery.cssProps[origName]=vendorPropName(style,origName)); // Gets hook for the prefixed version, then unprefixed version
hooks=jQuery.cssHooks[name]||jQuery.cssHooks[origName]; // Check if we're setting a value
if(value!==undefined){type=typeof value==="undefined"?"undefined":_typeof(value); // Convert "+=" or "-=" to relative numbers (#7345)
if(type==="string"&&(ret=rrelNum.exec(value))){value=(ret[1]+1)*ret[2]+parseFloat(jQuery.css(elem,name)); // Fixes bug #9237
type="number";} // Make sure that null and NaN values aren't set (#7116)
if(value==null||value!==value){return;} // If a number, add 'px' to the (except for certain CSS properties)
if(type==="number"&&!jQuery.cssNumber[origName]){value+="px";} // Support: IE9-11+
// background-* props affect original clone's values
if(!support.clearCloneStyle&&value===""&&name.indexOf("background")===0){style[name]="inherit";} // If a hook was provided, use that value, otherwise just set the specified value
if(!hooks||!("set" in hooks)||(value=hooks.set(elem,value,extra))!==undefined){style[name]=value;}}else { // If a hook was provided get the non-computed value from there
if(hooks&&"get" in hooks&&(ret=hooks.get(elem,false,extra))!==undefined){return ret;} // Otherwise just get the value from the style object
return style[name];}},css:function css(elem,name,extra,styles){var val,num,hooks,origName=jQuery.camelCase(name); // Make sure that we're working with the right name
name=jQuery.cssProps[origName]||(jQuery.cssProps[origName]=vendorPropName(elem.style,origName)); // Try prefixed name followed by the unprefixed name
hooks=jQuery.cssHooks[name]||jQuery.cssHooks[origName]; // If a hook was provided get the computed value from there
if(hooks&&"get" in hooks){val=hooks.get(elem,true,extra);} // Otherwise, if a way to get the computed value exists, use that
if(val===undefined){val=curCSS(elem,name,styles);} // Convert "normal" to computed value
if(val==="normal"&&name in cssNormalTransform){val=cssNormalTransform[name];} // Make numeric if forced or a qualifier was provided and val looks numeric
if(extra===""||extra){num=parseFloat(val);return extra===true||jQuery.isNumeric(num)?num||0:val;}return val;}});jQuery.each(["height","width"],function(i,name){jQuery.cssHooks[name]={get:function get(elem,computed,extra){if(computed){ // Certain elements can have dimension info if we invisibly show them
// but it must have a current display style that would benefit
return rdisplayswap.test(jQuery.css(elem,"display"))&&elem.offsetWidth===0?jQuery.swap(elem,cssShow,function(){return getWidthOrHeight(elem,name,extra);}):getWidthOrHeight(elem,name,extra);}},set:function set(elem,value,extra){var styles=extra&&getStyles(elem);return setPositiveNumber(elem,value,extra?augmentWidthOrHeight(elem,name,extra,jQuery.css(elem,"boxSizing",false,styles)==="border-box",styles):0);}};}); // Support: Android 2.3
jQuery.cssHooks.marginRight=addGetHookIf(support.reliableMarginRight,function(elem,computed){if(computed){return jQuery.swap(elem,{"display":"inline-block"},curCSS,[elem,"marginRight"]);}}); // These hooks are used by animate to expand properties
jQuery.each({margin:"",padding:"",border:"Width"},function(prefix,suffix){jQuery.cssHooks[prefix+suffix]={expand:function expand(value){var i=0,expanded={}, // Assumes a single number if not a string
parts=typeof value==="string"?value.split(" "):[value];for(;i<4;i++){expanded[prefix+cssExpand[i]+suffix]=parts[i]||parts[i-2]||parts[0];}return expanded;}};if(!rmargin.test(prefix)){jQuery.cssHooks[prefix+suffix].set=setPositiveNumber;}});jQuery.fn.extend({css:function css(name,value){return access(this,function(elem,name,value){var styles,len,map={},i=0;if(jQuery.isArray(name)){styles=getStyles(elem);len=name.length;for(;i<len;i++){map[name[i]]=jQuery.css(elem,name[i],false,styles);}return map;}return value!==undefined?jQuery.style(elem,name,value):jQuery.css(elem,name);},name,value,arguments.length>1);},show:function show(){return showHide(this,true);},hide:function hide(){return showHide(this);},toggle:function toggle(state){if(typeof state==="boolean"){return state?this.show():this.hide();}return this.each(function(){if(isHidden(this)){jQuery(this).show();}else {jQuery(this).hide();}});}});function Tween(elem,options,prop,end,easing){return new Tween.prototype.init(elem,options,prop,end,easing);}jQuery.Tween=Tween;Tween.prototype={constructor:Tween,init:function init(elem,options,prop,end,easing,unit){this.elem=elem;this.prop=prop;this.easing=easing||"swing";this.options=options;this.start=this.now=this.cur();this.end=end;this.unit=unit||(jQuery.cssNumber[prop]?"":"px");},cur:function cur(){var hooks=Tween.propHooks[this.prop];return hooks&&hooks.get?hooks.get(this):Tween.propHooks._default.get(this);},run:function run(percent){var eased,hooks=Tween.propHooks[this.prop];if(this.options.duration){this.pos=eased=jQuery.easing[this.easing](percent,this.options.duration*percent,0,1,this.options.duration);}else {this.pos=eased=percent;}this.now=(this.end-this.start)*eased+this.start;if(this.options.step){this.options.step.call(this.elem,this.now,this);}if(hooks&&hooks.set){hooks.set(this);}else {Tween.propHooks._default.set(this);}return this;}};Tween.prototype.init.prototype=Tween.prototype;Tween.propHooks={_default:{get:function get(tween){var result;if(tween.elem[tween.prop]!=null&&(!tween.elem.style||tween.elem.style[tween.prop]==null)){return tween.elem[tween.prop];} // Passing an empty string as a 3rd parameter to .css will automatically
// attempt a parseFloat and fallback to a string if the parse fails.
// Simple values such as "10px" are parsed to Float;
// complex values such as "rotate(1rad)" are returned as-is.
result=jQuery.css(tween.elem,tween.prop,""); // Empty strings, null, undefined and "auto" are converted to 0.
return !result||result==="auto"?0:result;},set:function set(tween){ // Use step hook for back compat.
// Use cssHook if its there.
// Use .style if available and use plain properties where available.
if(jQuery.fx.step[tween.prop]){jQuery.fx.step[tween.prop](tween);}else if(tween.elem.style&&(tween.elem.style[jQuery.cssProps[tween.prop]]!=null||jQuery.cssHooks[tween.prop])){jQuery.style(tween.elem,tween.prop,tween.now+tween.unit);}else {tween.elem[tween.prop]=tween.now;}}}}; // Support: IE9
// Panic based approach to setting things on disconnected nodes
Tween.propHooks.scrollTop=Tween.propHooks.scrollLeft={set:function set(tween){if(tween.elem.nodeType&&tween.elem.parentNode){tween.elem[tween.prop]=tween.now;}}};jQuery.easing={linear:function linear(p){return p;},swing:function swing(p){return 0.5-Math.cos(p*Math.PI)/2;}};jQuery.fx=Tween.prototype.init; // Back Compat <1.8 extension point
jQuery.fx.step={};var fxNow,timerId,rfxtypes=/^(?:toggle|show|hide)$/,rfxnum=new RegExp("^(?:([+-])=|)("+pnum+")([a-z%]*)$","i"),rrun=/queueHooks$/,animationPrefilters=[defaultPrefilter],tweeners={"*":[function(prop,value){var tween=this.createTween(prop,value),target=tween.cur(),parts=rfxnum.exec(value),unit=parts&&parts[3]||(jQuery.cssNumber[prop]?"":"px"), // Starting value computation is required for potential unit mismatches
start=(jQuery.cssNumber[prop]||unit!=="px"&&+target)&&rfxnum.exec(jQuery.css(tween.elem,prop)),scale=1,maxIterations=20;if(start&&start[3]!==unit){ // Trust units reported by jQuery.css
unit=unit||start[3]; // Make sure we update the tween properties later on
parts=parts||[]; // Iteratively approximate from a nonzero starting point
start=+target||1;do { // If previous iteration zeroed out, double until we get *something*.
// Use string for doubling so we don't accidentally see scale as unchanged below
scale=scale||".5"; // Adjust and apply
start=start/scale;jQuery.style(tween.elem,prop,start+unit); // Update scale, tolerating zero or NaN from tween.cur(),
// break the loop if scale is unchanged or perfect, or if we've just had enough
}while(scale!==(scale=tween.cur()/target)&&scale!==1&&--maxIterations);} // Update tween properties
if(parts){start=tween.start=+start||+target||0;tween.unit=unit; // If a +=/-= token was provided, we're doing a relative animation
tween.end=parts[1]?start+(parts[1]+1)*parts[2]:+parts[2];}return tween;}]}; // Animations created synchronously will run synchronously
function createFxNow(){setTimeout(function(){fxNow=undefined;});return fxNow=jQuery.now();} // Generate parameters to create a standard animation
function genFx(type,includeWidth){var which,i=0,attrs={height:type}; // If we include width, step value is 1 to do all cssExpand values,
// otherwise step value is 2 to skip over Left and Right
includeWidth=includeWidth?1:0;for(;i<4;i+=2-includeWidth){which=cssExpand[i];attrs["margin"+which]=attrs["padding"+which]=type;}if(includeWidth){attrs.opacity=attrs.width=type;}return attrs;}function createTween(value,prop,animation){var tween,collection=(tweeners[prop]||[]).concat(tweeners["*"]),index=0,length=collection.length;for(;index<length;index++){if(tween=collection[index].call(animation,prop,value)){ // We're done with this property
return tween;}}}function defaultPrefilter(elem,props,opts){ /* jshint validthis: true */var prop,value,toggle,tween,hooks,oldfire,display,checkDisplay,anim=this,orig={},style=elem.style,hidden=elem.nodeType&&isHidden(elem),dataShow=data_priv.get(elem,"fxshow"); // Handle queue: false promises
if(!opts.queue){hooks=jQuery._queueHooks(elem,"fx");if(hooks.unqueued==null){hooks.unqueued=0;oldfire=hooks.empty.fire;hooks.empty.fire=function(){if(!hooks.unqueued){oldfire();}};}hooks.unqueued++;anim.always(function(){ // Ensure the complete handler is called before this completes
anim.always(function(){hooks.unqueued--;if(!jQuery.queue(elem,"fx").length){hooks.empty.fire();}});});} // Height/width overflow pass
if(elem.nodeType===1&&("height" in props||"width" in props)){ // Make sure that nothing sneaks out
// Record all 3 overflow attributes because IE9-10 do not
// change the overflow attribute when overflowX and
// overflowY are set to the same value
opts.overflow=[style.overflow,style.overflowX,style.overflowY]; // Set display property to inline-block for height/width
// animations on inline elements that are having width/height animated
display=jQuery.css(elem,"display"); // Test default display if display is currently "none"
checkDisplay=display==="none"?data_priv.get(elem,"olddisplay")||defaultDisplay(elem.nodeName):display;if(checkDisplay==="inline"&&jQuery.css(elem,"float")==="none"){style.display="inline-block";}}if(opts.overflow){style.overflow="hidden";anim.always(function(){style.overflow=opts.overflow[0];style.overflowX=opts.overflow[1];style.overflowY=opts.overflow[2];});} // show/hide pass
for(prop in props){value=props[prop];if(rfxtypes.exec(value)){delete props[prop];toggle=toggle||value==="toggle";if(value===(hidden?"hide":"show")){ // If there is dataShow left over from a stopped hide or show and we are going to proceed with show, we should pretend to be hidden
if(value==="show"&&dataShow&&dataShow[prop]!==undefined){hidden=true;}else {continue;}}orig[prop]=dataShow&&dataShow[prop]||jQuery.style(elem,prop); // Any non-fx value stops us from restoring the original display value
}else {display=undefined;}}if(!jQuery.isEmptyObject(orig)){if(dataShow){if("hidden" in dataShow){hidden=dataShow.hidden;}}else {dataShow=data_priv.access(elem,"fxshow",{});} // Store state if its toggle - enables .stop().toggle() to "reverse"
if(toggle){dataShow.hidden=!hidden;}if(hidden){jQuery(elem).show();}else {anim.done(function(){jQuery(elem).hide();});}anim.done(function(){var prop;data_priv.remove(elem,"fxshow");for(prop in orig){jQuery.style(elem,prop,orig[prop]);}});for(prop in orig){tween=createTween(hidden?dataShow[prop]:0,prop,anim);if(!(prop in dataShow)){dataShow[prop]=tween.start;if(hidden){tween.end=tween.start;tween.start=prop==="width"||prop==="height"?1:0;}}} // If this is a noop like .hide().hide(), restore an overwritten display value
}else if((display==="none"?defaultDisplay(elem.nodeName):display)==="inline"){style.display=display;}}function propFilter(props,specialEasing){var index,name,easing,value,hooks; // camelCase, specialEasing and expand cssHook pass
for(index in props){name=jQuery.camelCase(index);easing=specialEasing[name];value=props[index];if(jQuery.isArray(value)){easing=value[1];value=props[index]=value[0];}if(index!==name){props[name]=value;delete props[index];}hooks=jQuery.cssHooks[name];if(hooks&&"expand" in hooks){value=hooks.expand(value);delete props[name]; // Not quite $.extend, this won't overwrite existing keys.
// Reusing 'index' because we have the correct "name"
for(index in value){if(!(index in props)){props[index]=value[index];specialEasing[index]=easing;}}}else {specialEasing[name]=easing;}}}function Animation(elem,properties,options){var result,stopped,index=0,length=animationPrefilters.length,deferred=jQuery.Deferred().always(function(){ // Don't match elem in the :animated selector
delete tick.elem;}),tick=function tick(){if(stopped){return false;}var currentTime=fxNow||createFxNow(),remaining=Math.max(0,animation.startTime+animation.duration-currentTime), // Support: Android 2.3
// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
temp=remaining/animation.duration||0,percent=1-temp,index=0,length=animation.tweens.length;for(;index<length;index++){animation.tweens[index].run(percent);}deferred.notifyWith(elem,[animation,percent,remaining]);if(percent<1&&length){return remaining;}else {deferred.resolveWith(elem,[animation]);return false;}},animation=deferred.promise({elem:elem,props:jQuery.extend({},properties),opts:jQuery.extend(true,{specialEasing:{}},options),originalProperties:properties,originalOptions:options,startTime:fxNow||createFxNow(),duration:options.duration,tweens:[],createTween:function createTween(prop,end){var tween=jQuery.Tween(elem,animation.opts,prop,end,animation.opts.specialEasing[prop]||animation.opts.easing);animation.tweens.push(tween);return tween;},stop:function stop(gotoEnd){var index=0, // If we are going to the end, we want to run all the tweens
// otherwise we skip this part
length=gotoEnd?animation.tweens.length:0;if(stopped){return this;}stopped=true;for(;index<length;index++){animation.tweens[index].run(1);} // Resolve when we played the last frame; otherwise, reject
if(gotoEnd){deferred.resolveWith(elem,[animation,gotoEnd]);}else {deferred.rejectWith(elem,[animation,gotoEnd]);}return this;}}),props=animation.props;propFilter(props,animation.opts.specialEasing);for(;index<length;index++){result=animationPrefilters[index].call(animation,elem,props,animation.opts);if(result){return result;}}jQuery.map(props,createTween,animation);if(jQuery.isFunction(animation.opts.start)){animation.opts.start.call(elem,animation);}jQuery.fx.timer(jQuery.extend(tick,{elem:elem,anim:animation,queue:animation.opts.queue})); // attach callbacks from options
return animation.progress(animation.opts.progress).done(animation.opts.done,animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);}jQuery.Animation=jQuery.extend(Animation,{tweener:function tweener(props,callback){if(jQuery.isFunction(props)){callback=props;props=["*"];}else {props=props.split(" ");}var prop,index=0,length=props.length;for(;index<length;index++){prop=props[index];tweeners[prop]=tweeners[prop]||[];tweeners[prop].unshift(callback);}},prefilter:function prefilter(callback,prepend){if(prepend){animationPrefilters.unshift(callback);}else {animationPrefilters.push(callback);}}});jQuery.speed=function(speed,easing,fn){var opt=speed&&(typeof speed==="undefined"?"undefined":_typeof(speed))==="object"?jQuery.extend({},speed):{complete:fn||!fn&&easing||jQuery.isFunction(speed)&&speed,duration:speed,easing:fn&&easing||easing&&!jQuery.isFunction(easing)&&easing};opt.duration=jQuery.fx.off?0:typeof opt.duration==="number"?opt.duration:opt.duration in jQuery.fx.speeds?jQuery.fx.speeds[opt.duration]:jQuery.fx.speeds._default; // Normalize opt.queue - true/undefined/null -> "fx"
if(opt.queue==null||opt.queue===true){opt.queue="fx";} // Queueing
opt.old=opt.complete;opt.complete=function(){if(jQuery.isFunction(opt.old)){opt.old.call(this);}if(opt.queue){jQuery.dequeue(this,opt.queue);}};return opt;};jQuery.fn.extend({fadeTo:function fadeTo(speed,to,easing,callback){ // Show any hidden elements after setting opacity to 0
return this.filter(isHidden).css("opacity",0).show() // Animate to the value specified
.end().animate({opacity:to},speed,easing,callback);},animate:function animate(prop,speed,easing,callback){var empty=jQuery.isEmptyObject(prop),optall=jQuery.speed(speed,easing,callback),doAnimation=function doAnimation(){ // Operate on a copy of prop so per-property easing won't be lost
var anim=Animation(this,jQuery.extend({},prop),optall); // Empty animations, or finishing resolves immediately
if(empty||data_priv.get(this,"finish")){anim.stop(true);}};doAnimation.finish=doAnimation;return empty||optall.queue===false?this.each(doAnimation):this.queue(optall.queue,doAnimation);},stop:function stop(type,clearQueue,gotoEnd){var stopQueue=function stopQueue(hooks){var stop=hooks.stop;delete hooks.stop;stop(gotoEnd);};if(typeof type!=="string"){gotoEnd=clearQueue;clearQueue=type;type=undefined;}if(clearQueue&&type!==false){this.queue(type||"fx",[]);}return this.each(function(){var dequeue=true,index=type!=null&&type+"queueHooks",timers=jQuery.timers,data=data_priv.get(this);if(index){if(data[index]&&data[index].stop){stopQueue(data[index]);}}else {for(index in data){if(data[index]&&data[index].stop&&rrun.test(index)){stopQueue(data[index]);}}}for(index=timers.length;index--;){if(timers[index].elem===this&&(type==null||timers[index].queue===type)){timers[index].anim.stop(gotoEnd);dequeue=false;timers.splice(index,1);}} // Start the next in the queue if the last step wasn't forced.
// Timers currently will call their complete callbacks, which
// will dequeue but only if they were gotoEnd.
if(dequeue||!gotoEnd){jQuery.dequeue(this,type);}});},finish:function finish(type){if(type!==false){type=type||"fx";}return this.each(function(){var index,data=data_priv.get(this),queue=data[type+"queue"],hooks=data[type+"queueHooks"],timers=jQuery.timers,length=queue?queue.length:0; // Enable finishing flag on private data
data.finish=true; // Empty the queue first
jQuery.queue(this,type,[]);if(hooks&&hooks.stop){hooks.stop.call(this,true);} // Look for any active animations, and finish them
for(index=timers.length;index--;){if(timers[index].elem===this&&timers[index].queue===type){timers[index].anim.stop(true);timers.splice(index,1);}} // Look for any animations in the old queue and finish them
for(index=0;index<length;index++){if(queue[index]&&queue[index].finish){queue[index].finish.call(this);}} // Turn off finishing flag
delete data.finish;});}});jQuery.each(["toggle","show","hide"],function(i,name){var cssFn=jQuery.fn[name];jQuery.fn[name]=function(speed,easing,callback){return speed==null||typeof speed==="boolean"?cssFn.apply(this,arguments):this.animate(genFx(name,true),speed,easing,callback);};}); // Generate shortcuts for custom animations
jQuery.each({slideDown:genFx("show"),slideUp:genFx("hide"),slideToggle:genFx("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(name,props){jQuery.fn[name]=function(speed,easing,callback){return this.animate(props,speed,easing,callback);};});jQuery.timers=[];jQuery.fx.tick=function(){var timer,i=0,timers=jQuery.timers;fxNow=jQuery.now();for(;i<timers.length;i++){timer=timers[i]; // Checks the timer has not already been removed
if(!timer()&&timers[i]===timer){timers.splice(i--,1);}}if(!timers.length){jQuery.fx.stop();}fxNow=undefined;};jQuery.fx.timer=function(timer){jQuery.timers.push(timer);if(timer()){jQuery.fx.start();}else {jQuery.timers.pop();}};jQuery.fx.interval=13;jQuery.fx.start=function(){if(!timerId){timerId=setInterval(jQuery.fx.tick,jQuery.fx.interval);}};jQuery.fx.stop=function(){clearInterval(timerId);timerId=null;};jQuery.fx.speeds={slow:600,fast:200, // Default speed
_default:400}; // Based off of the plugin by Clint Helfers, with permission.
// http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay=function(time,type){time=jQuery.fx?jQuery.fx.speeds[time]||time:time;type=type||"fx";return this.queue(type,function(next,hooks){var timeout=setTimeout(next,time);hooks.stop=function(){clearTimeout(timeout);};});};(function(){var input=document.createElement("input"),select=document.createElement("select"),opt=select.appendChild(document.createElement("option"));input.type="checkbox"; // Support: iOS<=5.1, Android<=4.2+
// Default value for a checkbox should be "on"
support.checkOn=input.value!==""; // Support: IE<=11+
// Must access selectedIndex to make default options select
support.optSelected=opt.selected; // Support: Android<=2.3
// Options inside disabled selects are incorrectly marked as disabled
select.disabled=true;support.optDisabled=!opt.disabled; // Support: IE<=11+
// An input loses its value after becoming a radio
input=document.createElement("input");input.value="t";input.type="radio";support.radioValue=input.value==="t";})();var nodeHook,boolHook,attrHandle=jQuery.expr.attrHandle;jQuery.fn.extend({attr:function attr(name,value){return access(this,jQuery.attr,name,value,arguments.length>1);},removeAttr:function removeAttr(name){return this.each(function(){jQuery.removeAttr(this,name);});}});jQuery.extend({attr:function attr(elem,name,value){var hooks,ret,nType=elem.nodeType; // don't get/set attributes on text, comment and attribute nodes
if(!elem||nType===3||nType===8||nType===2){return;} // Fallback to prop when attributes are not supported
if(_typeof(elem.getAttribute)===strundefined){return jQuery.prop(elem,name,value);} // All attributes are lowercase
// Grab necessary hook if one is defined
if(nType!==1||!jQuery.isXMLDoc(elem)){name=name.toLowerCase();hooks=jQuery.attrHooks[name]||(jQuery.expr.match.bool.test(name)?boolHook:nodeHook);}if(value!==undefined){if(value===null){jQuery.removeAttr(elem,name);}else if(hooks&&"set" in hooks&&(ret=hooks.set(elem,value,name))!==undefined){return ret;}else {elem.setAttribute(name,value+"");return value;}}else if(hooks&&"get" in hooks&&(ret=hooks.get(elem,name))!==null){return ret;}else {ret=jQuery.find.attr(elem,name); // Non-existent attributes return null, we normalize to undefined
return ret==null?undefined:ret;}},removeAttr:function removeAttr(elem,value){var name,propName,i=0,attrNames=value&&value.match(rnotwhite);if(attrNames&&elem.nodeType===1){while(name=attrNames[i++]){propName=jQuery.propFix[name]||name; // Boolean attributes get special treatment (#10870)
if(jQuery.expr.match.bool.test(name)){ // Set corresponding property to false
elem[propName]=false;}elem.removeAttribute(name);}}},attrHooks:{type:{set:function set(elem,value){if(!support.radioValue&&value==="radio"&&jQuery.nodeName(elem,"input")){var val=elem.value;elem.setAttribute("type",value);if(val){elem.value=val;}return value;}}}}}); // Hooks for boolean attributes
boolHook={set:function set(elem,value,name){if(value===false){ // Remove boolean attributes when set to false
jQuery.removeAttr(elem,name);}else {elem.setAttribute(name,name);}return name;}};jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g),function(i,name){var getter=attrHandle[name]||jQuery.find.attr;attrHandle[name]=function(elem,name,isXML){var ret,handle;if(!isXML){ // Avoid an infinite loop by temporarily removing this function from the getter
handle=attrHandle[name];attrHandle[name]=ret;ret=getter(elem,name,isXML)!=null?name.toLowerCase():null;attrHandle[name]=handle;}return ret;};});var rfocusable=/^(?:input|select|textarea|button)$/i;jQuery.fn.extend({prop:function prop(name,value){return access(this,jQuery.prop,name,value,arguments.length>1);},removeProp:function removeProp(name){return this.each(function(){delete this[jQuery.propFix[name]||name];});}});jQuery.extend({propFix:{"for":"htmlFor","class":"className"},prop:function prop(elem,name,value){var ret,hooks,notxml,nType=elem.nodeType; // Don't get/set properties on text, comment and attribute nodes
if(!elem||nType===3||nType===8||nType===2){return;}notxml=nType!==1||!jQuery.isXMLDoc(elem);if(notxml){ // Fix name and attach hooks
name=jQuery.propFix[name]||name;hooks=jQuery.propHooks[name];}if(value!==undefined){return hooks&&"set" in hooks&&(ret=hooks.set(elem,value,name))!==undefined?ret:elem[name]=value;}else {return hooks&&"get" in hooks&&(ret=hooks.get(elem,name))!==null?ret:elem[name];}},propHooks:{tabIndex:{get:function get(elem){return elem.hasAttribute("tabindex")||rfocusable.test(elem.nodeName)||elem.href?elem.tabIndex:-1;}}}});if(!support.optSelected){jQuery.propHooks.selected={get:function get(elem){var parent=elem.parentNode;if(parent&&parent.parentNode){parent.parentNode.selectedIndex;}return null;}};}jQuery.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){jQuery.propFix[this.toLowerCase()]=this;});var rclass=/[\t\r\n\f]/g;jQuery.fn.extend({addClass:function addClass(value){var classes,elem,cur,clazz,j,finalValue,proceed=typeof value==="string"&&value,i=0,len=this.length;if(jQuery.isFunction(value)){return this.each(function(j){jQuery(this).addClass(value.call(this,j,this.className));});}if(proceed){ // The disjunction here is for better compressibility (see removeClass)
classes=(value||"").match(rnotwhite)||[];for(;i<len;i++){elem=this[i];cur=elem.nodeType===1&&(elem.className?(" "+elem.className+" ").replace(rclass," "):" ");if(cur){j=0;while(clazz=classes[j++]){if(cur.indexOf(" "+clazz+" ")<0){cur+=clazz+" ";}} // only assign if different to avoid unneeded rendering.
finalValue=jQuery.trim(cur);if(elem.className!==finalValue){elem.className=finalValue;}}}}return this;},removeClass:function removeClass(value){var classes,elem,cur,clazz,j,finalValue,proceed=arguments.length===0||typeof value==="string"&&value,i=0,len=this.length;if(jQuery.isFunction(value)){return this.each(function(j){jQuery(this).removeClass(value.call(this,j,this.className));});}if(proceed){classes=(value||"").match(rnotwhite)||[];for(;i<len;i++){elem=this[i]; // This expression is here for better compressibility (see addClass)
cur=elem.nodeType===1&&(elem.className?(" "+elem.className+" ").replace(rclass," "):"");if(cur){j=0;while(clazz=classes[j++]){ // Remove *all* instances
while(cur.indexOf(" "+clazz+" ")>=0){cur=cur.replace(" "+clazz+" "," ");}} // Only assign if different to avoid unneeded rendering.
finalValue=value?jQuery.trim(cur):"";if(elem.className!==finalValue){elem.className=finalValue;}}}}return this;},toggleClass:function toggleClass(value,stateVal){var type=typeof value==="undefined"?"undefined":_typeof(value);if(typeof stateVal==="boolean"&&type==="string"){return stateVal?this.addClass(value):this.removeClass(value);}if(jQuery.isFunction(value)){return this.each(function(i){jQuery(this).toggleClass(value.call(this,i,this.className,stateVal),stateVal);});}return this.each(function(){if(type==="string"){ // Toggle individual class names
var className,i=0,self=jQuery(this),classNames=value.match(rnotwhite)||[];while(className=classNames[i++]){ // Check each className given, space separated list
if(self.hasClass(className)){self.removeClass(className);}else {self.addClass(className);}} // Toggle whole class name
}else if(type===strundefined||type==="boolean"){if(this.className){ // store className if set
data_priv.set(this,"__className__",this.className);} // If the element has a class name or if we're passed `false`,
// then remove the whole classname (if there was one, the above saved it).
// Otherwise bring back whatever was previously saved (if anything),
// falling back to the empty string if nothing was stored.
this.className=this.className||value===false?"":data_priv.get(this,"__className__")||"";}});},hasClass:function hasClass(selector){var className=" "+selector+" ",i=0,l=this.length;for(;i<l;i++){if(this[i].nodeType===1&&(" "+this[i].className+" ").replace(rclass," ").indexOf(className)>=0){return true;}}return false;}});var rreturn=/\r/g;jQuery.fn.extend({val:function val(value){var hooks,ret,isFunction,elem=this[0];if(!arguments.length){if(elem){hooks=jQuery.valHooks[elem.type]||jQuery.valHooks[elem.nodeName.toLowerCase()];if(hooks&&"get" in hooks&&(ret=hooks.get(elem,"value"))!==undefined){return ret;}ret=elem.value;return typeof ret==="string"? // Handle most common string cases
ret.replace(rreturn,""): // Handle cases where value is null/undef or number
ret==null?"":ret;}return;}isFunction=jQuery.isFunction(value);return this.each(function(i){var val;if(this.nodeType!==1){return;}if(isFunction){val=value.call(this,i,jQuery(this).val());}else {val=value;} // Treat null/undefined as ""; convert numbers to string
if(val==null){val="";}else if(typeof val==="number"){val+="";}else if(jQuery.isArray(val)){val=jQuery.map(val,function(value){return value==null?"":value+"";});}hooks=jQuery.valHooks[this.type]||jQuery.valHooks[this.nodeName.toLowerCase()]; // If set returns undefined, fall back to normal setting
if(!hooks||!("set" in hooks)||hooks.set(this,val,"value")===undefined){this.value=val;}});}});jQuery.extend({valHooks:{option:{get:function get(elem){var val=jQuery.find.attr(elem,"value");return val!=null?val: // Support: IE10-11+
// option.text throws exceptions (#14686, #14858)
jQuery.trim(jQuery.text(elem));}},select:{get:function get(elem){var value,option,options=elem.options,index=elem.selectedIndex,one=elem.type==="select-one"||index<0,values=one?null:[],max=one?index+1:options.length,i=index<0?max:one?index:0; // Loop through all the selected options
for(;i<max;i++){option=options[i]; // IE6-9 doesn't update selected after form reset (#2551)
if((option.selected||i===index)&&( // Don't return options that are disabled or in a disabled optgroup
support.optDisabled?!option.disabled:option.getAttribute("disabled")===null)&&(!option.parentNode.disabled||!jQuery.nodeName(option.parentNode,"optgroup"))){ // Get the specific value for the option
value=jQuery(option).val(); // We don't need an array for one selects
if(one){return value;} // Multi-Selects return an array
values.push(value);}}return values;},set:function set(elem,value){var optionSet,option,options=elem.options,values=jQuery.makeArray(value),i=options.length;while(i--){option=options[i];if(option.selected=jQuery.inArray(option.value,values)>=0){optionSet=true;}} // Force browsers to behave consistently when non-matching value is set
if(!optionSet){elem.selectedIndex=-1;}return values;}}}}); // Radios and checkboxes getter/setter
jQuery.each(["radio","checkbox"],function(){jQuery.valHooks[this]={set:function set(elem,value){if(jQuery.isArray(value)){return elem.checked=jQuery.inArray(jQuery(elem).val(),value)>=0;}}};if(!support.checkOn){jQuery.valHooks[this].get=function(elem){return elem.getAttribute("value")===null?"on":elem.value;};}}); // Return jQuery for attributes-only inclusion
jQuery.each(("blur focus focusin focusout load resize scroll unload click dblclick "+"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave "+"change select submit keydown keypress keyup error contextmenu").split(" "),function(i,name){ // Handle event binding
jQuery.fn[name]=function(data,fn){return arguments.length>0?this.on(name,null,data,fn):this.trigger(name);};});jQuery.fn.extend({hover:function hover(fnOver,fnOut){return this.mouseenter(fnOver).mouseleave(fnOut||fnOver);},bind:function bind(types,data,fn){return this.on(types,null,data,fn);},unbind:function unbind(types,fn){return this.off(types,null,fn);},delegate:function delegate(selector,types,data,fn){return this.on(types,selector,data,fn);},undelegate:function undelegate(selector,types,fn){ // ( namespace ) or ( selector, types [, fn] )
return arguments.length===1?this.off(selector,"**"):this.off(types,selector||"**",fn);}});var nonce=jQuery.now();var rquery=/\?/; // Support: Android 2.3
// Workaround failure to string-cast null input
jQuery.parseJSON=function(data){return JSON.parse(data+"");}; // Cross-browser xml parsing
jQuery.parseXML=function(data){var xml,tmp;if(!data||typeof data!=="string"){return null;} // Support: IE9
try{tmp=new DOMParser();xml=tmp.parseFromString(data,"text/xml");}catch(e){xml=undefined;}if(!xml||xml.getElementsByTagName("parsererror").length){jQuery.error("Invalid XML: "+data);}return xml;};var rhash=/#.*$/,rts=/([?&])_=[^&]*/,rheaders=/^(.*?):[ \t]*([^\r\n]*)$/mg, // #7653, #8125, #8152: local protocol detection
rlocalProtocol=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,rnoContent=/^(?:GET|HEAD)$/,rprotocol=/^\/\//,rurl=/^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/, /* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */prefilters={}, /* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */transports={}, // Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
allTypes="*/".concat("*"), // Document location
ajaxLocation=window.location.href, // Segment location into parts
ajaxLocParts=rurl.exec(ajaxLocation.toLowerCase())||[]; // Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports(structure){ // dataTypeExpression is optional and defaults to "*"
return function(dataTypeExpression,func){if(typeof dataTypeExpression!=="string"){func=dataTypeExpression;dataTypeExpression="*";}var dataType,i=0,dataTypes=dataTypeExpression.toLowerCase().match(rnotwhite)||[];if(jQuery.isFunction(func)){ // For each dataType in the dataTypeExpression
while(dataType=dataTypes[i++]){ // Prepend if requested
if(dataType[0]==="+"){dataType=dataType.slice(1)||"*";(structure[dataType]=structure[dataType]||[]).unshift(func); // Otherwise append
}else {(structure[dataType]=structure[dataType]||[]).push(func);}}}};} // Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports(structure,options,originalOptions,jqXHR){var inspected={},seekingTransport=structure===transports;function inspect(dataType){var selected;inspected[dataType]=true;jQuery.each(structure[dataType]||[],function(_,prefilterOrFactory){var dataTypeOrTransport=prefilterOrFactory(options,originalOptions,jqXHR);if(typeof dataTypeOrTransport==="string"&&!seekingTransport&&!inspected[dataTypeOrTransport]){options.dataTypes.unshift(dataTypeOrTransport);inspect(dataTypeOrTransport);return false;}else if(seekingTransport){return !(selected=dataTypeOrTransport);}});return selected;}return inspect(options.dataTypes[0])||!inspected["*"]&&inspect("*");} // A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend(target,src){var key,deep,flatOptions=jQuery.ajaxSettings.flatOptions||{};for(key in src){if(src[key]!==undefined){(flatOptions[key]?target:deep||(deep={}))[key]=src[key];}}if(deep){jQuery.extend(true,target,deep);}return target;} /* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */function ajaxHandleResponses(s,jqXHR,responses){var ct,type,finalDataType,firstDataType,contents=s.contents,dataTypes=s.dataTypes; // Remove auto dataType and get content-type in the process
while(dataTypes[0]==="*"){dataTypes.shift();if(ct===undefined){ct=s.mimeType||jqXHR.getResponseHeader("Content-Type");}} // Check if we're dealing with a known content-type
if(ct){for(type in contents){if(contents[type]&&contents[type].test(ct)){dataTypes.unshift(type);break;}}} // Check to see if we have a response for the expected dataType
if(dataTypes[0] in responses){finalDataType=dataTypes[0];}else { // Try convertible dataTypes
for(type in responses){if(!dataTypes[0]||s.converters[type+" "+dataTypes[0]]){finalDataType=type;break;}if(!firstDataType){firstDataType=type;}} // Or just use first one
finalDataType=finalDataType||firstDataType;} // If we found a dataType
// We add the dataType to the list if needed
// and return the corresponding response
if(finalDataType){if(finalDataType!==dataTypes[0]){dataTypes.unshift(finalDataType);}return responses[finalDataType];}} /* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */function ajaxConvert(s,response,jqXHR,isSuccess){var conv2,current,conv,tmp,prev,converters={}, // Work with a copy of dataTypes in case we need to modify it for conversion
dataTypes=s.dataTypes.slice(); // Create converters map with lowercased keys
if(dataTypes[1]){for(conv in s.converters){converters[conv.toLowerCase()]=s.converters[conv];}}current=dataTypes.shift(); // Convert to each sequential dataType
while(current){if(s.responseFields[current]){jqXHR[s.responseFields[current]]=response;} // Apply the dataFilter if provided
if(!prev&&isSuccess&&s.dataFilter){response=s.dataFilter(response,s.dataType);}prev=current;current=dataTypes.shift();if(current){ // There's only work to do if current dataType is non-auto
if(current==="*"){current=prev; // Convert response if prev dataType is non-auto and differs from current
}else if(prev!=="*"&&prev!==current){ // Seek a direct converter
conv=converters[prev+" "+current]||converters["* "+current]; // If none found, seek a pair
if(!conv){for(conv2 in converters){ // If conv2 outputs current
tmp=conv2.split(" ");if(tmp[1]===current){ // If prev can be converted to accepted input
conv=converters[prev+" "+tmp[0]]||converters["* "+tmp[0]];if(conv){ // Condense equivalence converters
if(conv===true){conv=converters[conv2]; // Otherwise, insert the intermediate dataType
}else if(converters[conv2]!==true){current=tmp[0];dataTypes.unshift(tmp[1]);}break;}}}} // Apply converter (if not an equivalence)
if(conv!==true){ // Unless errors are allowed to bubble, catch and return them
if(conv&&s["throws"]){response=conv(response);}else {try{response=conv(response);}catch(e){return {state:"parsererror",error:conv?e:"No conversion from "+prev+" to "+current};}}}}}}return {state:"success",data:response};}jQuery.extend({ // Counter for holding the number of active queries
active:0, // Last-Modified header cache for next request
lastModified:{},etag:{},ajaxSettings:{url:ajaxLocation,type:"GET",isLocal:rlocalProtocol.test(ajaxLocParts[1]),global:true,processData:true,async:true,contentType:"application/x-www-form-urlencoded; charset=UTF-8", /*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/accepts:{"*":allTypes,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"}, // Data converters
// Keys separate source (or catchall "*") and destination types with a single space
converters:{ // Convert anything to text
"* text":String, // Text to html (true = no transformation)
"text html":true, // Evaluate text as a json expression
"text json":jQuery.parseJSON, // Parse text as xml
"text xml":jQuery.parseXML}, // For options that shouldn't be deep extended:
// you can add your own custom options here if
// and when you create one that shouldn't be
// deep extended (see ajaxExtend)
flatOptions:{url:true,context:true}}, // Creates a full fledged settings object into target
// with both ajaxSettings and settings fields.
// If target is omitted, writes into ajaxSettings.
ajaxSetup:function ajaxSetup(target,settings){return settings? // Building a settings object
ajaxExtend(ajaxExtend(target,jQuery.ajaxSettings),settings): // Extending ajaxSettings
ajaxExtend(jQuery.ajaxSettings,target);},ajaxPrefilter:addToPrefiltersOrTransports(prefilters),ajaxTransport:addToPrefiltersOrTransports(transports), // Main method
ajax:function ajax(url,options){ // If url is an object, simulate pre-1.5 signature
if((typeof url==="undefined"?"undefined":_typeof(url))==="object"){options=url;url=undefined;} // Force options to be an object
options=options||{};var transport, // URL without anti-cache param
cacheURL, // Response headers
responseHeadersString,responseHeaders, // timeout handle
timeoutTimer, // Cross-domain detection vars
parts, // To know if global events are to be dispatched
fireGlobals, // Loop variable
i, // Create the final options object
s=jQuery.ajaxSetup({},options), // Callbacks context
callbackContext=s.context||s, // Context for global events is callbackContext if it is a DOM node or jQuery collection
globalEventContext=s.context&&(callbackContext.nodeType||callbackContext.jquery)?jQuery(callbackContext):jQuery.event, // Deferreds
deferred=jQuery.Deferred(),completeDeferred=jQuery.Callbacks("once memory"), // Status-dependent callbacks
_statusCode=s.statusCode||{}, // Headers (they are sent all at once)
requestHeaders={},requestHeadersNames={}, // The jqXHR state
state=0, // Default abort message
strAbort="canceled", // Fake xhr
jqXHR={readyState:0, // Builds headers hashtable if needed
getResponseHeader:function getResponseHeader(key){var match;if(state===2){if(!responseHeaders){responseHeaders={};while(match=rheaders.exec(responseHeadersString)){responseHeaders[match[1].toLowerCase()]=match[2];}}match=responseHeaders[key.toLowerCase()];}return match==null?null:match;}, // Raw string
getAllResponseHeaders:function getAllResponseHeaders(){return state===2?responseHeadersString:null;}, // Caches the header
setRequestHeader:function setRequestHeader(name,value){var lname=name.toLowerCase();if(!state){name=requestHeadersNames[lname]=requestHeadersNames[lname]||name;requestHeaders[name]=value;}return this;}, // Overrides response content-type header
overrideMimeType:function overrideMimeType(type){if(!state){s.mimeType=type;}return this;}, // Status-dependent callbacks
statusCode:function statusCode(map){var code;if(map){if(state<2){for(code in map){ // Lazy-add the new callback in a way that preserves old ones
_statusCode[code]=[_statusCode[code],map[code]];}}else { // Execute the appropriate callbacks
jqXHR.always(map[jqXHR.status]);}}return this;}, // Cancel the request
abort:function abort(statusText){var finalText=statusText||strAbort;if(transport){transport.abort(finalText);}done(0,finalText);return this;}}; // Attach deferreds
deferred.promise(jqXHR).complete=completeDeferred.add;jqXHR.success=jqXHR.done;jqXHR.error=jqXHR.fail; // Remove hash character (#7531: and string promotion)
// Add protocol if not provided (prefilters might expect it)
// Handle falsy url in the settings object (#10093: consistency with old signature)
// We also use the url parameter if available
s.url=((url||s.url||ajaxLocation)+"").replace(rhash,"").replace(rprotocol,ajaxLocParts[1]+"//"); // Alias method option to type as per ticket #12004
s.type=options.method||options.type||s.method||s.type; // Extract dataTypes list
s.dataTypes=jQuery.trim(s.dataType||"*").toLowerCase().match(rnotwhite)||[""]; // A cross-domain request is in order when we have a protocol:host:port mismatch
if(s.crossDomain==null){parts=rurl.exec(s.url.toLowerCase());s.crossDomain=!!(parts&&(parts[1]!==ajaxLocParts[1]||parts[2]!==ajaxLocParts[2]||(parts[3]||(parts[1]==="http:"?"80":"443"))!==(ajaxLocParts[3]||(ajaxLocParts[1]==="http:"?"80":"443"))));} // Convert data if not already a string
if(s.data&&s.processData&&typeof s.data!=="string"){s.data=jQuery.param(s.data,s.traditional);} // Apply prefilters
inspectPrefiltersOrTransports(prefilters,s,options,jqXHR); // If request was aborted inside a prefilter, stop there
if(state===2){return jqXHR;} // We can fire global events as of now if asked to
// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
fireGlobals=jQuery.event&&s.global; // Watch for a new set of requests
if(fireGlobals&&jQuery.active++===0){jQuery.event.trigger("ajaxStart");} // Uppercase the type
s.type=s.type.toUpperCase(); // Determine if request has content
s.hasContent=!rnoContent.test(s.type); // Save the URL in case we're toying with the If-Modified-Since
// and/or If-None-Match header later on
cacheURL=s.url; // More options handling for requests with no content
if(!s.hasContent){ // If data is available, append data to url
if(s.data){cacheURL=s.url+=(rquery.test(cacheURL)?"&":"?")+s.data; // #9682: remove data so that it's not used in an eventual retry
delete s.data;} // Add anti-cache in url if needed
if(s.cache===false){s.url=rts.test(cacheURL)? // If there is already a '_' parameter, set its value
cacheURL.replace(rts,"$1_="+nonce++): // Otherwise add one to the end
cacheURL+(rquery.test(cacheURL)?"&":"?")+"_="+nonce++;}} // Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
if(s.ifModified){if(jQuery.lastModified[cacheURL]){jqXHR.setRequestHeader("If-Modified-Since",jQuery.lastModified[cacheURL]);}if(jQuery.etag[cacheURL]){jqXHR.setRequestHeader("If-None-Match",jQuery.etag[cacheURL]);}} // Set the correct header, if data is being sent
if(s.data&&s.hasContent&&s.contentType!==false||options.contentType){jqXHR.setRequestHeader("Content-Type",s.contentType);} // Set the Accepts header for the server, depending on the dataType
jqXHR.setRequestHeader("Accept",s.dataTypes[0]&&s.accepts[s.dataTypes[0]]?s.accepts[s.dataTypes[0]]+(s.dataTypes[0]!=="*"?", "+allTypes+"; q=0.01":""):s.accepts["*"]); // Check for headers option
for(i in s.headers){jqXHR.setRequestHeader(i,s.headers[i]);} // Allow custom headers/mimetypes and early abort
if(s.beforeSend&&(s.beforeSend.call(callbackContext,jqXHR,s)===false||state===2)){ // Abort if not done already and return
return jqXHR.abort();} // Aborting is no longer a cancellation
strAbort="abort"; // Install callbacks on deferreds
for(i in {success:1,error:1,complete:1}){jqXHR[i](s[i]);} // Get transport
transport=inspectPrefiltersOrTransports(transports,s,options,jqXHR); // If no transport, we auto-abort
if(!transport){done(-1,"No Transport");}else {jqXHR.readyState=1; // Send global event
if(fireGlobals){globalEventContext.trigger("ajaxSend",[jqXHR,s]);} // Timeout
if(s.async&&s.timeout>0){timeoutTimer=setTimeout(function(){jqXHR.abort("timeout");},s.timeout);}try{state=1;transport.send(requestHeaders,done);}catch(e){ // Propagate exception as error if not done
if(state<2){done(-1,e); // Simply rethrow otherwise
}else {throw e;}}} // Callback for when everything is done
function done(status,nativeStatusText,responses,headers){var isSuccess,success,error,response,modified,statusText=nativeStatusText; // Called once
if(state===2){return;} // State is "done" now
state=2; // Clear timeout if it exists
if(timeoutTimer){clearTimeout(timeoutTimer);} // Dereference transport for early garbage collection
// (no matter how long the jqXHR object will be used)
transport=undefined; // Cache response headers
responseHeadersString=headers||""; // Set readyState
jqXHR.readyState=status>0?4:0; // Determine if successful
isSuccess=status>=200&&status<300||status===304; // Get response data
if(responses){response=ajaxHandleResponses(s,jqXHR,responses);} // Convert no matter what (that way responseXXX fields are always set)
response=ajaxConvert(s,response,jqXHR,isSuccess); // If successful, handle type chaining
if(isSuccess){ // Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
if(s.ifModified){modified=jqXHR.getResponseHeader("Last-Modified");if(modified){jQuery.lastModified[cacheURL]=modified;}modified=jqXHR.getResponseHeader("etag");if(modified){jQuery.etag[cacheURL]=modified;}} // if no content
if(status===204||s.type==="HEAD"){statusText="nocontent"; // if not modified
}else if(status===304){statusText="notmodified"; // If we have data, let's convert it
}else {statusText=response.state;success=response.data;error=response.error;isSuccess=!error;}}else { // Extract error from statusText and normalize for non-aborts
error=statusText;if(status||!statusText){statusText="error";if(status<0){status=0;}}} // Set data for the fake xhr object
jqXHR.status=status;jqXHR.statusText=(nativeStatusText||statusText)+""; // Success/Error
if(isSuccess){deferred.resolveWith(callbackContext,[success,statusText,jqXHR]);}else {deferred.rejectWith(callbackContext,[jqXHR,statusText,error]);} // Status-dependent callbacks
jqXHR.statusCode(_statusCode);_statusCode=undefined;if(fireGlobals){globalEventContext.trigger(isSuccess?"ajaxSuccess":"ajaxError",[jqXHR,s,isSuccess?success:error]);} // Complete
completeDeferred.fireWith(callbackContext,[jqXHR,statusText]);if(fireGlobals){globalEventContext.trigger("ajaxComplete",[jqXHR,s]); // Handle the global AJAX counter
if(! --jQuery.active){jQuery.event.trigger("ajaxStop");}}}return jqXHR;},getJSON:function getJSON(url,data,callback){return jQuery.get(url,data,callback,"json");},getScript:function getScript(url,callback){return jQuery.get(url,undefined,callback,"script");}});jQuery.each(["get","post"],function(i,method){jQuery[method]=function(url,data,callback,type){ // Shift arguments if data argument was omitted
if(jQuery.isFunction(data)){type=type||callback;callback=data;data=undefined;}return jQuery.ajax({url:url,type:method,dataType:type,data:data,success:callback});};});jQuery._evalUrl=function(url){return jQuery.ajax({url:url,type:"GET",dataType:"script",async:false,global:false,"throws":true});};jQuery.fn.extend({wrapAll:function wrapAll(html){var wrap;if(jQuery.isFunction(html)){return this.each(function(i){jQuery(this).wrapAll(html.call(this,i));});}if(this[0]){ // The elements to wrap the target around
wrap=jQuery(html,this[0].ownerDocument).eq(0).clone(true);if(this[0].parentNode){wrap.insertBefore(this[0]);}wrap.map(function(){var elem=this;while(elem.firstElementChild){elem=elem.firstElementChild;}return elem;}).append(this);}return this;},wrapInner:function wrapInner(html){if(jQuery.isFunction(html)){return this.each(function(i){jQuery(this).wrapInner(html.call(this,i));});}return this.each(function(){var self=jQuery(this),contents=self.contents();if(contents.length){contents.wrapAll(html);}else {self.append(html);}});},wrap:function wrap(html){var isFunction=jQuery.isFunction(html);return this.each(function(i){jQuery(this).wrapAll(isFunction?html.call(this,i):html);});},unwrap:function unwrap(){return this.parent().each(function(){if(!jQuery.nodeName(this,"body")){jQuery(this).replaceWith(this.childNodes);}}).end();}});jQuery.expr.filters.hidden=function(elem){ // Support: Opera <= 12.12
// Opera reports offsetWidths and offsetHeights less than zero on some elements
return elem.offsetWidth<=0&&elem.offsetHeight<=0;};jQuery.expr.filters.visible=function(elem){return !jQuery.expr.filters.hidden(elem);};var r20=/%20/g,rbracket=/\[\]$/,rCRLF=/\r?\n/g,rsubmitterTypes=/^(?:submit|button|image|reset|file)$/i,rsubmittable=/^(?:input|select|textarea|keygen)/i;function buildParams(prefix,obj,traditional,add){var name;if(jQuery.isArray(obj)){ // Serialize array item.
jQuery.each(obj,function(i,v){if(traditional||rbracket.test(prefix)){ // Treat each array item as a scalar.
add(prefix,v);}else { // Item is non-scalar (array or object), encode its numeric index.
buildParams(prefix+"["+((typeof v==="undefined"?"undefined":_typeof(v))==="object"?i:"")+"]",v,traditional,add);}});}else if(!traditional&&jQuery.type(obj)==="object"){ // Serialize object item.
for(name in obj){buildParams(prefix+"["+name+"]",obj[name],traditional,add);}}else { // Serialize scalar item.
add(prefix,obj);}} // Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param=function(a,traditional){var prefix,s=[],add=function add(key,value){ // If value is a function, invoke it and return its value
value=jQuery.isFunction(value)?value():value==null?"":value;s[s.length]=encodeURIComponent(key)+"="+encodeURIComponent(value);}; // Set traditional to true for jQuery <= 1.3.2 behavior.
if(traditional===undefined){traditional=jQuery.ajaxSettings&&jQuery.ajaxSettings.traditional;} // If an array was passed in, assume that it is an array of form elements.
if(jQuery.isArray(a)||a.jquery&&!jQuery.isPlainObject(a)){ // Serialize the form elements
jQuery.each(a,function(){add(this.name,this.value);});}else { // If traditional, encode the "old" way (the way 1.3.2 or older
// did it), otherwise encode params recursively.
for(prefix in a){buildParams(prefix,a[prefix],traditional,add);}} // Return the resulting serialization
return s.join("&").replace(r20,"+");};jQuery.fn.extend({serialize:function serialize(){return jQuery.param(this.serializeArray());},serializeArray:function serializeArray(){return this.map(function(){ // Can add propHook for "elements" to filter or add form elements
var elements=jQuery.prop(this,"elements");return elements?jQuery.makeArray(elements):this;}).filter(function(){var type=this.type; // Use .is( ":disabled" ) so that fieldset[disabled] works
return this.name&&!jQuery(this).is(":disabled")&&rsubmittable.test(this.nodeName)&&!rsubmitterTypes.test(type)&&(this.checked||!rcheckableType.test(type));}).map(function(i,elem){var val=jQuery(this).val();return val==null?null:jQuery.isArray(val)?jQuery.map(val,function(val){return {name:elem.name,value:val.replace(rCRLF,"\r\n")};}):{name:elem.name,value:val.replace(rCRLF,"\r\n")};}).get();}});jQuery.ajaxSettings.xhr=function(){try{return new XMLHttpRequest();}catch(e){}};var xhrId=0,xhrCallbacks={},xhrSuccessStatus={ // file protocol always yields status code 0, assume 200
0:200, // Support: IE9
// #1450: sometimes IE returns 1223 when it should be 204
1223:204},xhrSupported=jQuery.ajaxSettings.xhr(); // Support: IE9
// Open requests must be manually aborted on unload (#5280)
// See https://support.microsoft.com/kb/2856746 for more info
if(window.attachEvent){window.attachEvent("onunload",function(){for(var key in xhrCallbacks){xhrCallbacks[key]();}});}support.cors=!!xhrSupported&&"withCredentials" in xhrSupported;support.ajax=xhrSupported=!!xhrSupported;jQuery.ajaxTransport(function(options){var _callback; // Cross domain only allowed if supported through XMLHttpRequest
if(support.cors||xhrSupported&&!options.crossDomain){return {send:function send(headers,complete){var i,xhr=options.xhr(),id=++xhrId;xhr.open(options.type,options.url,options.async,options.username,options.password); // Apply custom fields if provided
if(options.xhrFields){for(i in options.xhrFields){xhr[i]=options.xhrFields[i];}} // Override mime type if needed
if(options.mimeType&&xhr.overrideMimeType){xhr.overrideMimeType(options.mimeType);} // X-Requested-With header
// For cross-domain requests, seeing as conditions for a preflight are
// akin to a jigsaw puzzle, we simply never set it to be sure.
// (it can always be set on a per-request basis or even using ajaxSetup)
// For same-domain requests, won't change header if already provided.
if(!options.crossDomain&&!headers["X-Requested-With"]){headers["X-Requested-With"]="XMLHttpRequest";} // Set headers
for(i in headers){xhr.setRequestHeader(i,headers[i]);} // Callback
_callback=function callback(type){return function(){if(_callback){delete xhrCallbacks[id];_callback=xhr.onload=xhr.onerror=null;if(type==="abort"){xhr.abort();}else if(type==="error"){complete( // file: protocol always yields status 0; see #8605, #14207
xhr.status,xhr.statusText);}else {complete(xhrSuccessStatus[xhr.status]||xhr.status,xhr.statusText, // Support: IE9
// Accessing binary-data responseText throws an exception
// (#11426)
typeof xhr.responseText==="string"?{text:xhr.responseText}:undefined,xhr.getAllResponseHeaders());}}};}; // Listen to events
xhr.onload=_callback();xhr.onerror=_callback("error"); // Create the abort callback
_callback=xhrCallbacks[id]=_callback("abort");try{ // Do send the request (this may raise an exception)
xhr.send(options.hasContent&&options.data||null);}catch(e){ // #14683: Only rethrow if this hasn't been notified as an error yet
if(_callback){throw e;}}},abort:function abort(){if(_callback){_callback();}}};}}); // Install script dataType
jQuery.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function textScript(text){jQuery.globalEval(text);return text;}}}); // Handle cache's special case and crossDomain
jQuery.ajaxPrefilter("script",function(s){if(s.cache===undefined){s.cache=false;}if(s.crossDomain){s.type="GET";}}); // Bind script tag hack transport
jQuery.ajaxTransport("script",function(s){ // This transport only deals with cross domain requests
if(s.crossDomain){var script,_callback2;return {send:function send(_,complete){script=jQuery("<script>").prop({async:true,charset:s.scriptCharset,src:s.url}).on("load error",_callback2=function callback(evt){script.remove();_callback2=null;if(evt){complete(evt.type==="error"?404:200,evt.type);}});document.head.appendChild(script[0]);},abort:function abort(){if(_callback2){_callback2();}}};}});var oldCallbacks=[],rjsonp=/(=)\?(?=&|$)|\?\?/; // Default jsonp settings
jQuery.ajaxSetup({jsonp:"callback",jsonpCallback:function jsonpCallback(){var callback=oldCallbacks.pop()||jQuery.expando+"_"+nonce++;this[callback]=true;return callback;}}); // Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter("json jsonp",function(s,originalSettings,jqXHR){var callbackName,overwritten,responseContainer,jsonProp=s.jsonp!==false&&(rjsonp.test(s.url)?"url":typeof s.data==="string"&&!(s.contentType||"").indexOf("application/x-www-form-urlencoded")&&rjsonp.test(s.data)&&"data"); // Handle iff the expected data type is "jsonp" or we have a parameter to set
if(jsonProp||s.dataTypes[0]==="jsonp"){ // Get callback name, remembering preexisting value associated with it
callbackName=s.jsonpCallback=jQuery.isFunction(s.jsonpCallback)?s.jsonpCallback():s.jsonpCallback; // Insert callback into url or form data
if(jsonProp){s[jsonProp]=s[jsonProp].replace(rjsonp,"$1"+callbackName);}else if(s.jsonp!==false){s.url+=(rquery.test(s.url)?"&":"?")+s.jsonp+"="+callbackName;} // Use data converter to retrieve json after script execution
s.converters["script json"]=function(){if(!responseContainer){jQuery.error(callbackName+" was not called");}return responseContainer[0];}; // force json dataType
s.dataTypes[0]="json"; // Install callback
overwritten=window[callbackName];window[callbackName]=function(){responseContainer=arguments;}; // Clean-up function (fires after converters)
jqXHR.always(function(){ // Restore preexisting value
window[callbackName]=overwritten; // Save back as free
if(s[callbackName]){ // make sure that re-using the options doesn't screw things around
s.jsonpCallback=originalSettings.jsonpCallback; // save the callback name for future use
oldCallbacks.push(callbackName);} // Call if it was a function and we have a response
if(responseContainer&&jQuery.isFunction(overwritten)){overwritten(responseContainer[0]);}responseContainer=overwritten=undefined;}); // Delegate to script
return "script";}}); // data: string of html
// context (optional): If specified, the fragment will be created in this context, defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML=function(data,context,keepScripts){if(!data||typeof data!=="string"){return null;}if(typeof context==="boolean"){keepScripts=context;context=false;}context=context||document;var parsed=rsingleTag.exec(data),scripts=!keepScripts&&[]; // Single tag
if(parsed){return [context.createElement(parsed[1])];}parsed=jQuery.buildFragment([data],context,scripts);if(scripts&&scripts.length){jQuery(scripts).remove();}return jQuery.merge([],parsed.childNodes);}; // Keep a copy of the old load method
var _load=jQuery.fn.load; /**
 * Load a url into a page
 */jQuery.fn.load=function(url,params,callback){if(typeof url!=="string"&&_load){return _load.apply(this,arguments);}var selector,type,response,self=this,off=url.indexOf(" ");if(off>=0){selector=jQuery.trim(url.slice(off));url=url.slice(0,off);} // If it's a function
if(jQuery.isFunction(params)){ // We assume that it's the callback
callback=params;params=undefined; // Otherwise, build a param string
}else if(params&&(typeof params==="undefined"?"undefined":_typeof(params))==="object"){type="POST";} // If we have elements to modify, make the request
if(self.length>0){jQuery.ajax({url:url, // if "type" variable is undefined, then "GET" method will be used
type:type,dataType:"html",data:params}).done(function(responseText){ // Save response for use in complete callback
response=arguments;self.html(selector? // If a selector was specified, locate the right elements in a dummy div
// Exclude scripts to avoid IE 'Permission Denied' errors
jQuery("<div>").append(jQuery.parseHTML(responseText)).find(selector): // Otherwise use the full result
responseText);}).complete(callback&&function(jqXHR,status){self.each(callback,response||[jqXHR.responseText,status,jqXHR]);});}return this;}; // Attach a bunch of functions for handling common AJAX events
jQuery.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(i,type){jQuery.fn[type]=function(fn){return this.on(type,fn);};});jQuery.expr.filters.animated=function(elem){return jQuery.grep(jQuery.timers,function(fn){return elem===fn.elem;}).length;};var docElem=window.document.documentElement; /**
 * Gets a window from an element
 */function getWindow(elem){return jQuery.isWindow(elem)?elem:elem.nodeType===9&&elem.defaultView;}jQuery.offset={setOffset:function setOffset(elem,options,i){var curPosition,curLeft,curCSSTop,curTop,curOffset,curCSSLeft,calculatePosition,position=jQuery.css(elem,"position"),curElem=jQuery(elem),props={}; // Set position first, in-case top/left are set even on static elem
if(position==="static"){elem.style.position="relative";}curOffset=curElem.offset();curCSSTop=jQuery.css(elem,"top");curCSSLeft=jQuery.css(elem,"left");calculatePosition=(position==="absolute"||position==="fixed")&&(curCSSTop+curCSSLeft).indexOf("auto")>-1; // Need to be able to calculate position if either
// top or left is auto and position is either absolute or fixed
if(calculatePosition){curPosition=curElem.position();curTop=curPosition.top;curLeft=curPosition.left;}else {curTop=parseFloat(curCSSTop)||0;curLeft=parseFloat(curCSSLeft)||0;}if(jQuery.isFunction(options)){options=options.call(elem,i,curOffset);}if(options.top!=null){props.top=options.top-curOffset.top+curTop;}if(options.left!=null){props.left=options.left-curOffset.left+curLeft;}if("using" in options){options.using.call(elem,props);}else {curElem.css(props);}}};jQuery.fn.extend({offset:function offset(options){if(arguments.length){return options===undefined?this:this.each(function(i){jQuery.offset.setOffset(this,options,i);});}var docElem,win,elem=this[0],box={top:0,left:0},doc=elem&&elem.ownerDocument;if(!doc){return;}docElem=doc.documentElement; // Make sure it's not a disconnected DOM node
if(!jQuery.contains(docElem,elem)){return box;} // Support: BlackBerry 5, iOS 3 (original iPhone)
// If we don't have gBCR, just use 0,0 rather than error
if(_typeof(elem.getBoundingClientRect)!==strundefined){box=elem.getBoundingClientRect();}win=getWindow(doc);return {top:box.top+win.pageYOffset-docElem.clientTop,left:box.left+win.pageXOffset-docElem.clientLeft};},position:function position(){if(!this[0]){return;}var offsetParent,offset,elem=this[0],parentOffset={top:0,left:0}; // Fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is its only offset parent
if(jQuery.css(elem,"position")==="fixed"){ // Assume getBoundingClientRect is there when computed position is fixed
offset=elem.getBoundingClientRect();}else { // Get *real* offsetParent
offsetParent=this.offsetParent(); // Get correct offsets
offset=this.offset();if(!jQuery.nodeName(offsetParent[0],"html")){parentOffset=offsetParent.offset();} // Add offsetParent borders
parentOffset.top+=jQuery.css(offsetParent[0],"borderTopWidth",true);parentOffset.left+=jQuery.css(offsetParent[0],"borderLeftWidth",true);} // Subtract parent offsets and element margins
return {top:offset.top-parentOffset.top-jQuery.css(elem,"marginTop",true),left:offset.left-parentOffset.left-jQuery.css(elem,"marginLeft",true)};},offsetParent:function offsetParent(){return this.map(function(){var offsetParent=this.offsetParent||docElem;while(offsetParent&&!jQuery.nodeName(offsetParent,"html")&&jQuery.css(offsetParent,"position")==="static"){offsetParent=offsetParent.offsetParent;}return offsetParent||docElem;});}}); // Create scrollLeft and scrollTop methods
jQuery.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(method,prop){var top="pageYOffset"===prop;jQuery.fn[method]=function(val){return access(this,function(elem,method,val){var win=getWindow(elem);if(val===undefined){return win?win[prop]:elem[method];}if(win){win.scrollTo(!top?val:window.pageXOffset,top?val:window.pageYOffset);}else {elem[method]=val;}},method,val,arguments.length,null);};}); // Support: Safari<7+, Chrome<37+
// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// Blink bug: https://code.google.com/p/chromium/issues/detail?id=229280
// getComputedStyle returns percent when specified for top/left/bottom/right;
// rather than make the css module depend on the offset module, just check for it here
jQuery.each(["top","left"],function(i,prop){jQuery.cssHooks[prop]=addGetHookIf(support.pixelPosition,function(elem,computed){if(computed){computed=curCSS(elem,prop); // If curCSS returns percentage, fallback to offset
return rnumnonpx.test(computed)?jQuery(elem).position()[prop]+"px":computed;}});}); // Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each({Height:"height",Width:"width"},function(name,type){jQuery.each({padding:"inner"+name,content:type,"":"outer"+name},function(defaultExtra,funcName){ // Margin is only for outerHeight, outerWidth
jQuery.fn[funcName]=function(margin,value){var chainable=arguments.length&&(defaultExtra||typeof margin!=="boolean"),extra=defaultExtra||(margin===true||value===true?"margin":"border");return access(this,function(elem,type,value){var doc;if(jQuery.isWindow(elem)){ // As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
// isn't a whole lot we can do. See pull request at this URL for discussion:
// https://github.com/jquery/jquery/pull/764
return elem.document.documentElement["client"+name];} // Get document width or height
if(elem.nodeType===9){doc=elem.documentElement; // Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
// whichever is greatest
return Math.max(elem.body["scroll"+name],doc["scroll"+name],elem.body["offset"+name],doc["offset"+name],doc["client"+name]);}return value===undefined? // Get width or height on the element, requesting but not forcing parseFloat
jQuery.css(elem,type,extra): // Set width or height on the element
jQuery.style(elem,type,value,extra);},type,chainable?margin:undefined,chainable,null);};});}); // The number of elements contained in the matched element set
jQuery.fn.size=function(){return this.length;};jQuery.fn.andSelf=jQuery.fn.addBack; // Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.
// Note that for maximum portability, libraries that are not jQuery should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. jQuery is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon
if(typeof define==="function"&&define.amd){define("jquery",[],function(){return jQuery;});}var  // Map over jQuery in case of overwrite
_jQuery=window.jQuery, // Map over the $ in case of overwrite
_$=window.$;jQuery.noConflict=function(deep){if(window.$===jQuery){window.$=_$;}if(deep&&window.jQuery===jQuery){window.jQuery=_jQuery;}return jQuery;}; // Expose jQuery and $ identifiers, even in AMD
// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if((typeof noGlobal==="undefined"?"undefined":_typeof(noGlobal))===strundefined){window.jQuery=window.$=jQuery;}return jQuery;});

},{}],3:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/*
 Copyright 2013 Daniel Wirtz <dcode@dcode.io>
 Copyright 2009 The Closure Library Authors. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS-IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * @license long.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/long.js for details
 */
(function (global, factory) {

    /* AMD */if (typeof define === 'function' && define["amd"]) define([], factory);
    /* CommonJS */else if (typeof require === 'function' && (typeof module === 'undefined' ? 'undefined' : _typeof(module)) === "object" && module && module["exports"]) module["exports"] = factory();
        /* Global */else (global["dcodeIO"] = global["dcodeIO"] || {})["Long"] = factory();
})(undefined, function () {
    "use strict";

    /**
     * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as *signed* integers.
     *  See the from* functions below for more convenient ways of constructing Longs.
     * @exports Long
     * @class A Long class for representing a 64 bit two's-complement integer value.
     * @param {number} low The low (signed) 32 bits of the long
     * @param {number} high The high (signed) 32 bits of the long
     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
     * @constructor
     */

    function Long(low, high, unsigned) {

        /**
         * The low 32 bits as a signed value.
         * @type {number}
         * @expose
         */
        this.low = low | 0;

        /**
         * The high 32 bits as a signed value.
         * @type {number}
         * @expose
         */
        this.high = high | 0;

        /**
         * Whether unsigned or not.
         * @type {boolean}
         * @expose
         */
        this.unsigned = !!unsigned;
    }

    // The internal representation of a long is the two given signed, 32-bit values.
    // We use 32-bit pieces because these are the size of integers on which
    // Javascript performs bit-operations.  For operations like addition and
    // multiplication, we split each number into 16 bit pieces, which can easily be
    // multiplied within Javascript's floating-point representation without overflow
    // or change in sign.
    //
    // In the algorithms below, we frequently reduce the negative case to the
    // positive case by negating the input(s) and then post-processing the result.
    // Note that we must ALWAYS check specially whether those values are MIN_VALUE
    // (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
    // a positive number, it overflows back into a negative).  Not handling this
    // case would often result in infinite recursion.
    //
    // Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the from*
    // methods on which they depend.

    /**
     * An indicator used to reliably determine if an object is a Long or not.
     * @type {boolean}
     * @const
     * @expose
     * @private
     */
    Long.__isLong__;

    Object.defineProperty(Long.prototype, "__isLong__", {
        value: true,
        enumerable: false,
        configurable: false
    });

    /**
     * @function
     * @param {*} obj Object
     * @returns {boolean}
     * @inner
     */
    function isLong(obj) {
        return (obj && obj["__isLong__"]) === true;
    }

    /**
     * Tests if the specified object is a Long.
     * @function
     * @param {*} obj Object
     * @returns {boolean}
     * @expose
     */
    Long.isLong = isLong;

    /**
     * A cache of the Long representations of small integer values.
     * @type {!Object}
     * @inner
     */
    var INT_CACHE = {};

    /**
     * A cache of the Long representations of small unsigned integer values.
     * @type {!Object}
     * @inner
     */
    var UINT_CACHE = {};

    /**
     * @param {number} value
     * @param {boolean=} unsigned
     * @returns {!Long}
     * @inner
     */
    function fromInt(value, unsigned) {
        var obj, cachedObj, cache;
        if (unsigned) {
            value >>>= 0;
            if (cache = 0 <= value && value < 256) {
                cachedObj = UINT_CACHE[value];
                if (cachedObj) return cachedObj;
            }
            obj = fromBits(value, (value | 0) < 0 ? -1 : 0, true);
            if (cache) UINT_CACHE[value] = obj;
            return obj;
        } else {
            value |= 0;
            if (cache = -128 <= value && value < 128) {
                cachedObj = INT_CACHE[value];
                if (cachedObj) return cachedObj;
            }
            obj = fromBits(value, value < 0 ? -1 : 0, false);
            if (cache) INT_CACHE[value] = obj;
            return obj;
        }
    }

    /**
     * Returns a Long representing the given 32 bit integer value.
     * @function
     * @param {number} value The 32 bit integer in question
     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
     * @returns {!Long} The corresponding Long value
     * @expose
     */
    Long.fromInt = fromInt;

    /**
     * @param {number} value
     * @param {boolean=} unsigned
     * @returns {!Long}
     * @inner
     */
    function fromNumber(value, unsigned) {
        if (isNaN(value) || !isFinite(value)) return unsigned ? UZERO : ZERO;
        if (unsigned) {
            if (value < 0) return UZERO;
            if (value >= TWO_PWR_64_DBL) return MAX_UNSIGNED_VALUE;
        } else {
            if (value <= -TWO_PWR_63_DBL) return MIN_VALUE;
            if (value + 1 >= TWO_PWR_63_DBL) return MAX_VALUE;
        }
        if (value < 0) return fromNumber(-value, unsigned).neg();
        return fromBits(value % TWO_PWR_32_DBL | 0, value / TWO_PWR_32_DBL | 0, unsigned);
    }

    /**
     * Returns a Long representing the given value, provided that it is a finite number. Otherwise, zero is returned.
     * @function
     * @param {number} value The number in question
     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
     * @returns {!Long} The corresponding Long value
     * @expose
     */
    Long.fromNumber = fromNumber;

    /**
     * @param {number} lowBits
     * @param {number} highBits
     * @param {boolean=} unsigned
     * @returns {!Long}
     * @inner
     */
    function fromBits(lowBits, highBits, unsigned) {
        return new Long(lowBits, highBits, unsigned);
    }

    /**
     * Returns a Long representing the 64 bit integer that comes by concatenating the given low and high bits. Each is
     *  assumed to use 32 bits.
     * @function
     * @param {number} lowBits The low 32 bits
     * @param {number} highBits The high 32 bits
     * @param {boolean=} unsigned Whether unsigned or not, defaults to `false` for signed
     * @returns {!Long} The corresponding Long value
     * @expose
     */
    Long.fromBits = fromBits;

    /**
     * @function
     * @param {number} base
     * @param {number} exponent
     * @returns {number}
     * @inner
     */
    var pow_dbl = Math.pow; // Used 4 times (4*8 to 15+4)

    /**
     * @param {string} str
     * @param {(boolean|number)=} unsigned
     * @param {number=} radix
     * @returns {!Long}
     * @inner
     */
    function fromString(str, unsigned, radix) {
        if (str.length === 0) throw Error('empty string');
        if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity") return ZERO;
        if (typeof unsigned === 'number') // For goog.math.long compatibility
            radix = unsigned, unsigned = false;
        radix = radix || 10;
        if (radix < 2 || 36 < radix) throw RangeError('radix');

        var p;
        if ((p = str.indexOf('-')) > 0) throw Error('interior hyphen');else if (p === 0) {
            return fromString(str.substring(1), unsigned, radix).neg();
        }

        // Do several (8) digits each time through the loop, so as to
        // minimize the calls to the very expensive emulated div.
        var radixToPower = fromNumber(pow_dbl(radix, 8));

        var result = ZERO;
        for (var i = 0; i < str.length; i += 8) {
            var size = Math.min(8, str.length - i),
                value = parseInt(str.substring(i, i + size), radix);
            if (size < 8) {
                var power = fromNumber(pow_dbl(radix, size));
                result = result.mul(power).add(fromNumber(value));
            } else {
                result = result.mul(radixToPower);
                result = result.add(fromNumber(value));
            }
        }
        result.unsigned = unsigned;
        return result;
    }

    /**
     * Returns a Long representation of the given string, written using the specified radix.
     * @function
     * @param {string} str The textual representation of the Long
     * @param {(boolean|number)=} unsigned Whether unsigned or not, defaults to `false` for signed
     * @param {number=} radix The radix in which the text is written (2-36), defaults to 10
     * @returns {!Long} The corresponding Long value
     * @expose
     */
    Long.fromString = fromString;

    /**
     * @function
     * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val
     * @returns {!Long}
     * @inner
     */
    function fromValue(val) {
        if (val /* is compatible */ instanceof Long) return val;
        if (typeof val === 'number') return fromNumber(val);
        if (typeof val === 'string') return fromString(val);
        // Throws for non-objects, converts non-instanceof Long:
        return fromBits(val.low, val.high, val.unsigned);
    }

    /**
     * Converts the specified value to a Long.
     * @function
     * @param {!Long|number|string|!{low: number, high: number, unsigned: boolean}} val Value
     * @returns {!Long}
     * @expose
     */
    Long.fromValue = fromValue;

    // NOTE: the compiler should inline these constant values below and then remove these variables, so there should be
    // no runtime penalty for these.

    /**
     * @type {number}
     * @const
     * @inner
     */
    var TWO_PWR_16_DBL = 1 << 16;

    /**
     * @type {number}
     * @const
     * @inner
     */
    var TWO_PWR_24_DBL = 1 << 24;

    /**
     * @type {number}
     * @const
     * @inner
     */
    var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;

    /**
     * @type {number}
     * @const
     * @inner
     */
    var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;

    /**
     * @type {number}
     * @const
     * @inner
     */
    var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;

    /**
     * @type {!Long}
     * @const
     * @inner
     */
    var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);

    /**
     * @type {!Long}
     * @inner
     */
    var ZERO = fromInt(0);

    /**
     * Signed zero.
     * @type {!Long}
     * @expose
     */
    Long.ZERO = ZERO;

    /**
     * @type {!Long}
     * @inner
     */
    var UZERO = fromInt(0, true);

    /**
     * Unsigned zero.
     * @type {!Long}
     * @expose
     */
    Long.UZERO = UZERO;

    /**
     * @type {!Long}
     * @inner
     */
    var ONE = fromInt(1);

    /**
     * Signed one.
     * @type {!Long}
     * @expose
     */
    Long.ONE = ONE;

    /**
     * @type {!Long}
     * @inner
     */
    var UONE = fromInt(1, true);

    /**
     * Unsigned one.
     * @type {!Long}
     * @expose
     */
    Long.UONE = UONE;

    /**
     * @type {!Long}
     * @inner
     */
    var NEG_ONE = fromInt(-1);

    /**
     * Signed negative one.
     * @type {!Long}
     * @expose
     */
    Long.NEG_ONE = NEG_ONE;

    /**
     * @type {!Long}
     * @inner
     */
    var MAX_VALUE = fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0, false);

    /**
     * Maximum signed value.
     * @type {!Long}
     * @expose
     */
    Long.MAX_VALUE = MAX_VALUE;

    /**
     * @type {!Long}
     * @inner
     */
    var MAX_UNSIGNED_VALUE = fromBits(0xFFFFFFFF | 0, 0xFFFFFFFF | 0, true);

    /**
     * Maximum unsigned value.
     * @type {!Long}
     * @expose
     */
    Long.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;

    /**
     * @type {!Long}
     * @inner
     */
    var MIN_VALUE = fromBits(0, 0x80000000 | 0, false);

    /**
     * Minimum signed value.
     * @type {!Long}
     * @expose
     */
    Long.MIN_VALUE = MIN_VALUE;

    /**
     * @alias Long.prototype
     * @inner
     */
    var LongPrototype = Long.prototype;

    /**
     * Converts the Long to a 32 bit integer, assuming it is a 32 bit integer.
     * @returns {number}
     * @expose
     */
    LongPrototype.toInt = function toInt() {
        return this.unsigned ? this.low >>> 0 : this.low;
    };

    /**
     * Converts the Long to a the nearest floating-point representation of this value (double, 53 bit mantissa).
     * @returns {number}
     * @expose
     */
    LongPrototype.toNumber = function toNumber() {
        if (this.unsigned) return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
        return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
    };

    /**
     * Converts the Long to a string written in the specified radix.
     * @param {number=} radix Radix (2-36), defaults to 10
     * @returns {string}
     * @override
     * @throws {RangeError} If `radix` is out of range
     * @expose
     */
    LongPrototype.toString = function toString(radix) {
        radix = radix || 10;
        if (radix < 2 || 36 < radix) throw RangeError('radix');
        if (this.isZero()) return '0';
        if (this.isNegative()) {
            // Unsigned Longs are never negative
            if (this.eq(MIN_VALUE)) {
                // We need to change the Long value before it can be negated, so we remove
                // the bottom-most digit in this base and then recurse to do the rest.
                var radixLong = fromNumber(radix),
                    div = this.div(radixLong),
                    rem1 = div.mul(radixLong).sub(this);
                return div.toString(radix) + rem1.toInt().toString(radix);
            } else return '-' + this.neg().toString(radix);
        }

        // Do several (6) digits each time through the loop, so as to
        // minimize the calls to the very expensive emulated div.
        var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned),
            rem = this;
        var result = '';
        while (true) {
            var remDiv = rem.div(radixToPower),
                intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0,
                digits = intval.toString(radix);
            rem = remDiv;
            if (rem.isZero()) return digits + result;else {
                while (digits.length < 6) {
                    digits = '0' + digits;
                }result = '' + digits + result;
            }
        }
    };

    /**
     * Gets the high 32 bits as a signed integer.
     * @returns {number} Signed high bits
     * @expose
     */
    LongPrototype.getHighBits = function getHighBits() {
        return this.high;
    };

    /**
     * Gets the high 32 bits as an unsigned integer.
     * @returns {number} Unsigned high bits
     * @expose
     */
    LongPrototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
        return this.high >>> 0;
    };

    /**
     * Gets the low 32 bits as a signed integer.
     * @returns {number} Signed low bits
     * @expose
     */
    LongPrototype.getLowBits = function getLowBits() {
        return this.low;
    };

    /**
     * Gets the low 32 bits as an unsigned integer.
     * @returns {number} Unsigned low bits
     * @expose
     */
    LongPrototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
        return this.low >>> 0;
    };

    /**
     * Gets the number of bits needed to represent the absolute value of this Long.
     * @returns {number}
     * @expose
     */
    LongPrototype.getNumBitsAbs = function getNumBitsAbs() {
        if (this.isNegative()) // Unsigned Longs are never negative
            return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
        var val = this.high != 0 ? this.high : this.low;
        for (var bit = 31; bit > 0; bit--) {
            if ((val & 1 << bit) != 0) break;
        }return this.high != 0 ? bit + 33 : bit + 1;
    };

    /**
     * Tests if this Long's value equals zero.
     * @returns {boolean}
     * @expose
     */
    LongPrototype.isZero = function isZero() {
        return this.high === 0 && this.low === 0;
    };

    /**
     * Tests if this Long's value is negative.
     * @returns {boolean}
     * @expose
     */
    LongPrototype.isNegative = function isNegative() {
        return !this.unsigned && this.high < 0;
    };

    /**
     * Tests if this Long's value is positive.
     * @returns {boolean}
     * @expose
     */
    LongPrototype.isPositive = function isPositive() {
        return this.unsigned || this.high >= 0;
    };

    /**
     * Tests if this Long's value is odd.
     * @returns {boolean}
     * @expose
     */
    LongPrototype.isOdd = function isOdd() {
        return (this.low & 1) === 1;
    };

    /**
     * Tests if this Long's value is even.
     * @returns {boolean}
     * @expose
     */
    LongPrototype.isEven = function isEven() {
        return (this.low & 1) === 0;
    };

    /**
     * Tests if this Long's value equals the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    LongPrototype.equals = function equals(other) {
        if (!isLong(other)) other = fromValue(other);
        if (this.unsigned !== other.unsigned && this.high >>> 31 === 1 && other.high >>> 31 === 1) return false;
        return this.high === other.high && this.low === other.low;
    };

    /**
     * Tests if this Long's value equals the specified's. This is an alias of {@link Long#equals}.
     * @function
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    LongPrototype.eq = LongPrototype.equals;

    /**
     * Tests if this Long's value differs from the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    LongPrototype.notEquals = function notEquals(other) {
        return !this.eq( /* validates */other);
    };

    /**
     * Tests if this Long's value differs from the specified's. This is an alias of {@link Long#notEquals}.
     * @function
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    LongPrototype.neq = LongPrototype.notEquals;

    /**
     * Tests if this Long's value is less than the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    LongPrototype.lessThan = function lessThan(other) {
        return this.comp( /* validates */other) < 0;
    };

    /**
     * Tests if this Long's value is less than the specified's. This is an alias of {@link Long#lessThan}.
     * @function
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    LongPrototype.lt = LongPrototype.lessThan;

    /**
     * Tests if this Long's value is less than or equal the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    LongPrototype.lessThanOrEqual = function lessThanOrEqual(other) {
        return this.comp( /* validates */other) <= 0;
    };

    /**
     * Tests if this Long's value is less than or equal the specified's. This is an alias of {@link Long#lessThanOrEqual}.
     * @function
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    LongPrototype.lte = LongPrototype.lessThanOrEqual;

    /**
     * Tests if this Long's value is greater than the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    LongPrototype.greaterThan = function greaterThan(other) {
        return this.comp( /* validates */other) > 0;
    };

    /**
     * Tests if this Long's value is greater than the specified's. This is an alias of {@link Long#greaterThan}.
     * @function
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    LongPrototype.gt = LongPrototype.greaterThan;

    /**
     * Tests if this Long's value is greater than or equal the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    LongPrototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
        return this.comp( /* validates */other) >= 0;
    };

    /**
     * Tests if this Long's value is greater than or equal the specified's. This is an alias of {@link Long#greaterThanOrEqual}.
     * @function
     * @param {!Long|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    LongPrototype.gte = LongPrototype.greaterThanOrEqual;

    /**
     * Compares this Long's value with the specified's.
     * @param {!Long|number|string} other Other value
     * @returns {number} 0 if they are the same, 1 if the this is greater and -1
     *  if the given one is greater
     * @expose
     */
    LongPrototype.compare = function compare(other) {
        if (!isLong(other)) other = fromValue(other);
        if (this.eq(other)) return 0;
        var thisNeg = this.isNegative(),
            otherNeg = other.isNegative();
        if (thisNeg && !otherNeg) return -1;
        if (!thisNeg && otherNeg) return 1;
        // At this point the sign bits are the same
        if (!this.unsigned) return this.sub(other).isNegative() ? -1 : 1;
        // Both are positive if at least one is unsigned
        return other.high >>> 0 > this.high >>> 0 || other.high === this.high && other.low >>> 0 > this.low >>> 0 ? -1 : 1;
    };

    /**
     * Compares this Long's value with the specified's. This is an alias of {@link Long#compare}.
     * @function
     * @param {!Long|number|string} other Other value
     * @returns {number} 0 if they are the same, 1 if the this is greater and -1
     *  if the given one is greater
     * @expose
     */
    LongPrototype.comp = LongPrototype.compare;

    /**
     * Negates this Long's value.
     * @returns {!Long} Negated Long
     * @expose
     */
    LongPrototype.negate = function negate() {
        if (!this.unsigned && this.eq(MIN_VALUE)) return MIN_VALUE;
        return this.not().add(ONE);
    };

    /**
     * Negates this Long's value. This is an alias of {@link Long#negate}.
     * @function
     * @returns {!Long} Negated Long
     * @expose
     */
    LongPrototype.neg = LongPrototype.negate;

    /**
     * Returns the sum of this and the specified Long.
     * @param {!Long|number|string} addend Addend
     * @returns {!Long} Sum
     * @expose
     */
    LongPrototype.add = function add(addend) {
        if (!isLong(addend)) addend = fromValue(addend);

        // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

        var a48 = this.high >>> 16;
        var a32 = this.high & 0xFFFF;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xFFFF;

        var b48 = addend.high >>> 16;
        var b32 = addend.high & 0xFFFF;
        var b16 = addend.low >>> 16;
        var b00 = addend.low & 0xFFFF;

        var c48 = 0,
            c32 = 0,
            c16 = 0,
            c00 = 0;
        c00 += a00 + b00;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16 + b16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32 + b32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48 + b48;
        c48 &= 0xFFFF;
        return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
    };

    /**
     * Returns the difference of this and the specified Long.
     * @param {!Long|number|string} subtrahend Subtrahend
     * @returns {!Long} Difference
     * @expose
     */
    LongPrototype.subtract = function subtract(subtrahend) {
        if (!isLong(subtrahend)) subtrahend = fromValue(subtrahend);
        return this.add(subtrahend.neg());
    };

    /**
     * Returns the difference of this and the specified Long. This is an alias of {@link Long#subtract}.
     * @function
     * @param {!Long|number|string} subtrahend Subtrahend
     * @returns {!Long} Difference
     * @expose
     */
    LongPrototype.sub = LongPrototype.subtract;

    /**
     * Returns the product of this and the specified Long.
     * @param {!Long|number|string} multiplier Multiplier
     * @returns {!Long} Product
     * @expose
     */
    LongPrototype.multiply = function multiply(multiplier) {
        if (this.isZero()) return ZERO;
        if (!isLong(multiplier)) multiplier = fromValue(multiplier);
        if (multiplier.isZero()) return ZERO;
        if (this.eq(MIN_VALUE)) return multiplier.isOdd() ? MIN_VALUE : ZERO;
        if (multiplier.eq(MIN_VALUE)) return this.isOdd() ? MIN_VALUE : ZERO;

        if (this.isNegative()) {
            if (multiplier.isNegative()) return this.neg().mul(multiplier.neg());else return this.neg().mul(multiplier).neg();
        } else if (multiplier.isNegative()) return this.mul(multiplier.neg()).neg();

        // If both longs are small, use float multiplication
        if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24)) return fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned);

        // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
        // We can skip products that would overflow.

        var a48 = this.high >>> 16;
        var a32 = this.high & 0xFFFF;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xFFFF;

        var b48 = multiplier.high >>> 16;
        var b32 = multiplier.high & 0xFFFF;
        var b16 = multiplier.low >>> 16;
        var b00 = multiplier.low & 0xFFFF;

        var c48 = 0,
            c32 = 0,
            c16 = 0,
            c00 = 0;
        c00 += a00 * b00;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16 * b00;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c16 += a00 * b16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32 * b00;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c32 += a16 * b16;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c32 += a00 * b32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
        c48 &= 0xFFFF;
        return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
    };

    /**
     * Returns the product of this and the specified Long. This is an alias of {@link Long#multiply}.
     * @function
     * @param {!Long|number|string} multiplier Multiplier
     * @returns {!Long} Product
     * @expose
     */
    LongPrototype.mul = LongPrototype.multiply;

    /**
     * Returns this Long divided by the specified.
     * @param {!Long|number|string} divisor Divisor
     * @returns {!Long} Quotient
     * @expose
     */
    LongPrototype.divide = function divide(divisor) {
        if (!isLong(divisor)) divisor = fromValue(divisor);
        if (divisor.isZero()) throw Error('division by zero');
        if (this.isZero()) return this.unsigned ? UZERO : ZERO;
        var approx, rem, res;
        if (this.eq(MIN_VALUE)) {
            if (divisor.eq(ONE) || divisor.eq(NEG_ONE)) return MIN_VALUE; // recall that -MIN_VALUE == MIN_VALUE
            else if (divisor.eq(MIN_VALUE)) return ONE;else {
                    // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
                    var halfThis = this.shr(1);
                    approx = halfThis.div(divisor).shl(1);
                    if (approx.eq(ZERO)) {
                        return divisor.isNegative() ? ONE : NEG_ONE;
                    } else {
                        rem = this.sub(divisor.mul(approx));
                        res = approx.add(rem.div(divisor));
                        return res;
                    }
                }
        } else if (divisor.eq(MIN_VALUE)) return this.unsigned ? UZERO : ZERO;
        if (this.isNegative()) {
            if (divisor.isNegative()) return this.neg().div(divisor.neg());
            return this.neg().div(divisor).neg();
        } else if (divisor.isNegative()) return this.div(divisor.neg()).neg();

        // Repeat the following until the remainder is less than other:  find a
        // floating-point that approximates remainder / other *from below*, add this
        // into the result, and subtract it from the remainder.  It is critical that
        // the approximate value is less than or equal to the real value so that the
        // remainder never becomes negative.
        res = ZERO;
        rem = this;
        while (rem.gte(divisor)) {
            // Approximate the result of division. This may be a little greater or
            // smaller than the actual value.
            approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));

            // We will tweak the approximate result by changing it in the 48-th digit or
            // the smallest non-fractional digit, whichever is larger.
            var log2 = Math.ceil(Math.log(approx) / Math.LN2),
                delta = log2 <= 48 ? 1 : pow_dbl(2, log2 - 48),

            // Decrease the approximation until it is smaller than the remainder.  Note
            // that if it is too large, the product overflows and is negative.
            approxRes = fromNumber(approx),
                approxRem = approxRes.mul(divisor);
            while (approxRem.isNegative() || approxRem.gt(rem)) {
                approx -= delta;
                approxRes = fromNumber(approx, this.unsigned);
                approxRem = approxRes.mul(divisor);
            }

            // We know the answer can't be zero... and actually, zero would cause
            // infinite recursion since we would make no progress.
            if (approxRes.isZero()) approxRes = ONE;

            res = res.add(approxRes);
            rem = rem.sub(approxRem);
        }
        return res;
    };

    /**
     * Returns this Long divided by the specified. This is an alias of {@link Long#divide}.
     * @function
     * @param {!Long|number|string} divisor Divisor
     * @returns {!Long} Quotient
     * @expose
     */
    LongPrototype.div = LongPrototype.divide;

    /**
     * Returns this Long modulo the specified.
     * @param {!Long|number|string} divisor Divisor
     * @returns {!Long} Remainder
     * @expose
     */
    LongPrototype.modulo = function modulo(divisor) {
        if (!isLong(divisor)) divisor = fromValue(divisor);
        return this.sub(this.div(divisor).mul(divisor));
    };

    /**
     * Returns this Long modulo the specified. This is an alias of {@link Long#modulo}.
     * @function
     * @param {!Long|number|string} divisor Divisor
     * @returns {!Long} Remainder
     * @expose
     */
    LongPrototype.mod = LongPrototype.modulo;

    /**
     * Returns the bitwise NOT of this Long.
     * @returns {!Long}
     * @expose
     */
    LongPrototype.not = function not() {
        return fromBits(~this.low, ~this.high, this.unsigned);
    };

    /**
     * Returns the bitwise AND of this Long and the specified.
     * @param {!Long|number|string} other Other Long
     * @returns {!Long}
     * @expose
     */
    LongPrototype.and = function and(other) {
        if (!isLong(other)) other = fromValue(other);
        return fromBits(this.low & other.low, this.high & other.high, this.unsigned);
    };

    /**
     * Returns the bitwise OR of this Long and the specified.
     * @param {!Long|number|string} other Other Long
     * @returns {!Long}
     * @expose
     */
    LongPrototype.or = function or(other) {
        if (!isLong(other)) other = fromValue(other);
        return fromBits(this.low | other.low, this.high | other.high, this.unsigned);
    };

    /**
     * Returns the bitwise XOR of this Long and the given one.
     * @param {!Long|number|string} other Other Long
     * @returns {!Long}
     * @expose
     */
    LongPrototype.xor = function xor(other) {
        if (!isLong(other)) other = fromValue(other);
        return fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
    };

    /**
     * Returns this Long with bits shifted to the left by the given amount.
     * @param {number|!Long} numBits Number of bits
     * @returns {!Long} Shifted Long
     * @expose
     */
    LongPrototype.shiftLeft = function shiftLeft(numBits) {
        if (isLong(numBits)) numBits = numBits.toInt();
        if ((numBits &= 63) === 0) return this;else if (numBits < 32) return fromBits(this.low << numBits, this.high << numBits | this.low >>> 32 - numBits, this.unsigned);else return fromBits(0, this.low << numBits - 32, this.unsigned);
    };

    /**
     * Returns this Long with bits shifted to the left by the given amount. This is an alias of {@link Long#shiftLeft}.
     * @function
     * @param {number|!Long} numBits Number of bits
     * @returns {!Long} Shifted Long
     * @expose
     */
    LongPrototype.shl = LongPrototype.shiftLeft;

    /**
     * Returns this Long with bits arithmetically shifted to the right by the given amount.
     * @param {number|!Long} numBits Number of bits
     * @returns {!Long} Shifted Long
     * @expose
     */
    LongPrototype.shiftRight = function shiftRight(numBits) {
        if (isLong(numBits)) numBits = numBits.toInt();
        if ((numBits &= 63) === 0) return this;else if (numBits < 32) return fromBits(this.low >>> numBits | this.high << 32 - numBits, this.high >> numBits, this.unsigned);else return fromBits(this.high >> numBits - 32, this.high >= 0 ? 0 : -1, this.unsigned);
    };

    /**
     * Returns this Long with bits arithmetically shifted to the right by the given amount. This is an alias of {@link Long#shiftRight}.
     * @function
     * @param {number|!Long} numBits Number of bits
     * @returns {!Long} Shifted Long
     * @expose
     */
    LongPrototype.shr = LongPrototype.shiftRight;

    /**
     * Returns this Long with bits logically shifted to the right by the given amount.
     * @param {number|!Long} numBits Number of bits
     * @returns {!Long} Shifted Long
     * @expose
     */
    LongPrototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
        if (isLong(numBits)) numBits = numBits.toInt();
        numBits &= 63;
        if (numBits === 0) return this;else {
            var high = this.high;
            if (numBits < 32) {
                var low = this.low;
                return fromBits(low >>> numBits | high << 32 - numBits, high >>> numBits, this.unsigned);
            } else if (numBits === 32) return fromBits(high, 0, this.unsigned);else return fromBits(high >>> numBits - 32, 0, this.unsigned);
        }
    };

    /**
     * Returns this Long with bits logically shifted to the right by the given amount. This is an alias of {@link Long#shiftRightUnsigned}.
     * @function
     * @param {number|!Long} numBits Number of bits
     * @returns {!Long} Shifted Long
     * @expose
     */
    LongPrototype.shru = LongPrototype.shiftRightUnsigned;

    /**
     * Converts this Long to signed.
     * @returns {!Long} Signed long
     * @expose
     */
    LongPrototype.toSigned = function toSigned() {
        if (!this.unsigned) return this;
        return fromBits(this.low, this.high, false);
    };

    /**
     * Converts this Long to unsigned.
     * @returns {!Long} Unsigned long
     * @expose
     */
    LongPrototype.toUnsigned = function toUnsigned() {
        if (this.unsigned) return this;
        return fromBits(this.low, this.high, true);
    };

    return Long;
});

},{}],4:[function(require,module,exports){
(function (process){
"use strict";var _typeof=typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"?function(obj){return typeof obj;}:function(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol?"symbol":typeof obj;}; /*
 Copyright 2013 Daniel Wirtz <dcode@dcode.io>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */ /**
 * @license protobuf.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/protobuf.js for details
 */(function(global,factory){ /* AMD */if(typeof define==='function'&&define["amd"])define(["bytebuffer"],factory); /* CommonJS */else if(typeof require==="function"&&(typeof module==="undefined"?"undefined":_typeof(module))==="object"&&module&&module["exports"])module["exports"]=factory(require("./..\\..\\bytebuffer\\dist\\ByteBufferAB.js"),true); /* Global */else (global["dcodeIO"]=global["dcodeIO"]||{})["ProtoBuf"]=factory(global["dcodeIO"]["ByteBuffer"]);})(undefined,function(ByteBuffer,isCommonJS){"use strict"; /**
     * The ProtoBuf namespace.
     * @exports ProtoBuf
     * @namespace
     * @expose
     */var ProtoBuf={}; /**
     * @type {!function(new: ByteBuffer, ...[*])}
     * @expose
     */ProtoBuf.ByteBuffer=ByteBuffer; /**
     * @type {?function(new: Long, ...[*])}
     * @expose
     */ProtoBuf.Long=ByteBuffer.Long||null; /**
     * ProtoBuf.js version.
     * @type {string}
     * @const
     * @expose
     */ProtoBuf.VERSION="5.0.1"; /**
     * Wire types.
     * @type {Object.<string,number>}
     * @const
     * @expose
     */ProtoBuf.WIRE_TYPES={}; /**
     * Varint wire type.
     * @type {number}
     * @expose
     */ProtoBuf.WIRE_TYPES.VARINT=0; /**
     * Fixed 64 bits wire type.
     * @type {number}
     * @const
     * @expose
     */ProtoBuf.WIRE_TYPES.BITS64=1; /**
     * Length delimited wire type.
     * @type {number}
     * @const
     * @expose
     */ProtoBuf.WIRE_TYPES.LDELIM=2; /**
     * Start group wire type.
     * @type {number}
     * @const
     * @expose
     */ProtoBuf.WIRE_TYPES.STARTGROUP=3; /**
     * End group wire type.
     * @type {number}
     * @const
     * @expose
     */ProtoBuf.WIRE_TYPES.ENDGROUP=4; /**
     * Fixed 32 bits wire type.
     * @type {number}
     * @const
     * @expose
     */ProtoBuf.WIRE_TYPES.BITS32=5; /**
     * Packable wire types.
     * @type {!Array.<number>}
     * @const
     * @expose
     */ProtoBuf.PACKABLE_WIRE_TYPES=[ProtoBuf.WIRE_TYPES.VARINT,ProtoBuf.WIRE_TYPES.BITS64,ProtoBuf.WIRE_TYPES.BITS32]; /**
     * Types.
     * @dict
     * @type {!Object.<string,{name: string, wireType: number, defaultValue: *}>}
     * @const
     * @expose
     */ProtoBuf.TYPES={ // According to the protobuf spec.
"int32":{name:"int32",wireType:ProtoBuf.WIRE_TYPES.VARINT,defaultValue:0},"uint32":{name:"uint32",wireType:ProtoBuf.WIRE_TYPES.VARINT,defaultValue:0},"sint32":{name:"sint32",wireType:ProtoBuf.WIRE_TYPES.VARINT,defaultValue:0},"int64":{name:"int64",wireType:ProtoBuf.WIRE_TYPES.VARINT,defaultValue:ProtoBuf.Long?ProtoBuf.Long.ZERO:undefined},"uint64":{name:"uint64",wireType:ProtoBuf.WIRE_TYPES.VARINT,defaultValue:ProtoBuf.Long?ProtoBuf.Long.UZERO:undefined},"sint64":{name:"sint64",wireType:ProtoBuf.WIRE_TYPES.VARINT,defaultValue:ProtoBuf.Long?ProtoBuf.Long.ZERO:undefined},"bool":{name:"bool",wireType:ProtoBuf.WIRE_TYPES.VARINT,defaultValue:false},"double":{name:"double",wireType:ProtoBuf.WIRE_TYPES.BITS64,defaultValue:0},"string":{name:"string",wireType:ProtoBuf.WIRE_TYPES.LDELIM,defaultValue:""},"bytes":{name:"bytes",wireType:ProtoBuf.WIRE_TYPES.LDELIM,defaultValue:null // overridden in the code, must be a unique instance
},"fixed32":{name:"fixed32",wireType:ProtoBuf.WIRE_TYPES.BITS32,defaultValue:0},"sfixed32":{name:"sfixed32",wireType:ProtoBuf.WIRE_TYPES.BITS32,defaultValue:0},"fixed64":{name:"fixed64",wireType:ProtoBuf.WIRE_TYPES.BITS64,defaultValue:ProtoBuf.Long?ProtoBuf.Long.UZERO:undefined},"sfixed64":{name:"sfixed64",wireType:ProtoBuf.WIRE_TYPES.BITS64,defaultValue:ProtoBuf.Long?ProtoBuf.Long.ZERO:undefined},"float":{name:"float",wireType:ProtoBuf.WIRE_TYPES.BITS32,defaultValue:0},"enum":{name:"enum",wireType:ProtoBuf.WIRE_TYPES.VARINT,defaultValue:0},"message":{name:"message",wireType:ProtoBuf.WIRE_TYPES.LDELIM,defaultValue:null},"group":{name:"group",wireType:ProtoBuf.WIRE_TYPES.STARTGROUP,defaultValue:null}}; /**
     * Valid map key types.
     * @type {!Array.<!Object.<string,{name: string, wireType: number, defaultValue: *}>>}
     * @const
     * @expose
     */ProtoBuf.MAP_KEY_TYPES=[ProtoBuf.TYPES["int32"],ProtoBuf.TYPES["sint32"],ProtoBuf.TYPES["sfixed32"],ProtoBuf.TYPES["uint32"],ProtoBuf.TYPES["fixed32"],ProtoBuf.TYPES["int64"],ProtoBuf.TYPES["sint64"],ProtoBuf.TYPES["sfixed64"],ProtoBuf.TYPES["uint64"],ProtoBuf.TYPES["fixed64"],ProtoBuf.TYPES["bool"],ProtoBuf.TYPES["string"],ProtoBuf.TYPES["bytes"]]; /**
     * Minimum field id.
     * @type {number}
     * @const
     * @expose
     */ProtoBuf.ID_MIN=1; /**
     * Maximum field id.
     * @type {number}
     * @const
     * @expose
     */ProtoBuf.ID_MAX=0x1FFFFFFF; /**
     * If set to `true`, field names will be converted from underscore notation to camel case. Defaults to `false`.
     *  Must be set prior to parsing.
     * @type {boolean}
     * @expose
     */ProtoBuf.convertFieldsToCamelCase=false; /**
     * By default, messages are populated with (setX, set_x) accessors for each field. This can be disabled by
     *  setting this to `false` prior to building messages.
     * @type {boolean}
     * @expose
     */ProtoBuf.populateAccessors=true; /**
     * By default, messages are populated with default values if a field is not present on the wire. To disable
     *  this behavior, set this setting to `false`.
     * @type {boolean}
     * @expose
     */ProtoBuf.populateDefaults=true; /**
     * @alias ProtoBuf.Util
     * @expose
     */ProtoBuf.Util=function(){"use strict"; /**
         * ProtoBuf utilities.
         * @exports ProtoBuf.Util
         * @namespace
         */var Util={}; /**
         * Flag if running in node or not.
         * @type {boolean}
         * @const
         * @expose
         */Util.IS_NODE=!!((typeof process==="undefined"?"undefined":_typeof(process))==='object'&&process+''==='[object process]'&&!process['browser']); /**
         * Constructs a XMLHttpRequest object.
         * @return {XMLHttpRequest}
         * @throws {Error} If XMLHttpRequest is not supported
         * @expose
         */Util.XHR=function(){ // No dependencies please, ref: http://www.quirksmode.org/js/xmlhttp.html
var XMLHttpFactories=[function(){return new XMLHttpRequest();},function(){return new ActiveXObject("Msxml2.XMLHTTP");},function(){return new ActiveXObject("Msxml3.XMLHTTP");},function(){return new ActiveXObject("Microsoft.XMLHTTP");}]; /** @type {?XMLHttpRequest} */var xhr=null;for(var i=0;i<XMLHttpFactories.length;i++){try{xhr=XMLHttpFactories[i]();}catch(e){continue;}break;}if(!xhr)throw Error("XMLHttpRequest is not supported");return xhr;}; /**
         * Fetches a resource.
         * @param {string} path Resource path
         * @param {function(?string)=} callback Callback receiving the resource's contents. If omitted the resource will
         *   be fetched synchronously. If the request failed, contents will be null.
         * @return {?string|undefined} Resource contents if callback is omitted (null if the request failed), else undefined.
         * @expose
         */Util.fetch=function(path,callback){if(callback&&typeof callback!='function')callback=null;if(Util.IS_NODE){var fs=require("fs");if(callback){fs.readFile(path,function(err,data){if(err)callback(null);else callback(""+data);});}else try{return fs.readFileSync(path);}catch(e){return null;}}else {var xhr=Util.XHR();xhr.open('GET',path,callback?true:false); // xhr.setRequestHeader('User-Agent', 'XMLHTTP/1.0');
xhr.setRequestHeader('Accept','text/plain');if(typeof xhr.overrideMimeType==='function')xhr.overrideMimeType('text/plain');if(callback){xhr.onreadystatechange=function(){if(xhr.readyState!=4)return;if( /* remote */xhr.status==200|| /* local */xhr.status==0&&typeof xhr.responseText==='string')callback(xhr.responseText);else callback(null);};if(xhr.readyState==4)return;xhr.send(null);}else {xhr.send(null);if( /* remote */xhr.status==200|| /* local */xhr.status==0&&typeof xhr.responseText==='string')return xhr.responseText;return null;}}}; /**
         * Converts a string to camel case.
         * @param {string} str
         * @returns {string}
         * @expose
         */Util.toCamelCase=function(str){return str.replace(/_([a-zA-Z])/g,function($0,$1){return $1.toUpperCase();});};return Util;}(); /**
     * Language expressions.
     * @type {!Object.<string,!RegExp>}
     * @expose
     */ProtoBuf.Lang={ // Characters always ending a statement
DELIM:/[\s\{\}=;:\[\],'"\(\)<>]/g, // Field rules
RULE:/^(?:required|optional|repeated|map)$/, // Field types
TYPE:/^(?:double|float|int32|uint32|sint32|int64|uint64|sint64|fixed32|sfixed32|fixed64|sfixed64|bool|string|bytes)$/, // Names
NAME:/^[a-zA-Z_][a-zA-Z_0-9]*$/, // Type definitions
TYPEDEF:/^[a-zA-Z][a-zA-Z_0-9]*$/, // Type references
TYPEREF:/^(?:\.?[a-zA-Z_][a-zA-Z_0-9]*)+$/, // Fully qualified type references
FQTYPEREF:/^(?:\.[a-zA-Z][a-zA-Z_0-9]*)+$/, // All numbers
NUMBER:/^-?(?:[1-9][0-9]*|0|0[xX][0-9a-fA-F]+|0[0-7]+|([0-9]*(\.[0-9]*)?([Ee][+-]?[0-9]+)?)|inf|nan)$/, // Decimal numbers
NUMBER_DEC:/^(?:[1-9][0-9]*|0)$/, // Hexadecimal numbers
NUMBER_HEX:/^0[xX][0-9a-fA-F]+$/, // Octal numbers
NUMBER_OCT:/^0[0-7]+$/, // Floating point numbers
NUMBER_FLT:/^([0-9]*(\.[0-9]*)?([Ee][+-]?[0-9]+)?|inf|nan)$/, // Booleans
BOOL:/^(?:true|false)$/i, // Id numbers
ID:/^(?:[1-9][0-9]*|0|0[xX][0-9a-fA-F]+|0[0-7]+)$/, // Negative id numbers (enum values)
NEGID:/^\-?(?:[1-9][0-9]*|0|0[xX][0-9a-fA-F]+|0[0-7]+)$/, // Whitespaces
WHITESPACE:/\s/, // All strings
STRING:/(?:"([^"\\]*(?:\\.[^"\\]*)*)")|(?:'([^'\\]*(?:\\.[^'\\]*)*)')/g, // Double quoted strings
STRING_DQ:/(?:"([^"\\]*(?:\\.[^"\\]*)*)")/g, // Single quoted strings
STRING_SQ:/(?:'([^'\\]*(?:\\.[^'\\]*)*)')/g}; /**
     * @alias ProtoBuf.DotProto
     * @expose
     */ProtoBuf.DotProto=function(ProtoBuf,Lang){"use strict"; /**
         * Utilities to parse .proto files.
         * @exports ProtoBuf.DotProto
         * @namespace
         */var DotProto={}; /**
         * Constructs a new Tokenizer.
         * @exports ProtoBuf.DotProto.Tokenizer
         * @class prototype tokenizer
         * @param {string} proto Proto to tokenize
         * @constructor
         */var Tokenizer=function Tokenizer(proto){ /**
             * Source to parse.
             * @type {string}
             * @expose
             */this.source=proto+""; /**
             * Current index.
             * @type {number}
             * @expose
             */this.index=0; /**
             * Current line.
             * @type {number}
             * @expose
             */this.line=1; /**
             * Token stack.
             * @type {!Array.<string>}
             * @expose
             */this.stack=[]; /**
             * Opening character of the current string read, if any.
             * @type {?string}
             * @private
             */this._stringOpen=null;}; /**
         * @alias ProtoBuf.DotProto.Tokenizer.prototype
         * @inner
         */var TokenizerPrototype=Tokenizer.prototype; /**
         * Reads a string beginning at the current index.
         * @return {string}
         * @private
         */TokenizerPrototype._readString=function(){var re=this._stringOpen==='"'?Lang.STRING_DQ:Lang.STRING_SQ;re.lastIndex=this.index-1; // Include the open quote
var match=re.exec(this.source);if(!match)throw Error("unterminated string");this.index=re.lastIndex;this.stack.push(this._stringOpen);this._stringOpen=null;return match[1];}; /**
         * Gets the next token and advances by one.
         * @return {?string} Token or `null` on EOF
         * @expose
         */TokenizerPrototype.next=function(){if(this.stack.length>0)return this.stack.shift();if(this.index>=this.source.length)return null;if(this._stringOpen!==null)return this._readString();var repeat,prev,next;do {repeat=false; // Strip white spaces
while(Lang.WHITESPACE.test(next=this.source.charAt(this.index))){if(next==='\n')++this.line;if(++this.index===this.source.length)return null;} // Strip comments
if(this.source.charAt(this.index)==='/'){++this.index;if(this.source.charAt(this.index)==='/'){ // Line
while(this.source.charAt(++this.index)!=='\n'){if(this.index==this.source.length)return null;}++this.index;++this.line;repeat=true;}else if((next=this.source.charAt(this.index))==='*'){ /* Block */do {if(next==='\n')++this.line;if(++this.index===this.source.length)return null;prev=next;next=this.source.charAt(this.index);}while(prev!=='*'||next!=='/');++this.index;repeat=true;}else return '/';}}while(repeat);if(this.index===this.source.length)return null; // Read the next token
var end=this.index;Lang.DELIM.lastIndex=0;var delim=Lang.DELIM.test(this.source.charAt(end++));if(!delim)while(end<this.source.length&&!Lang.DELIM.test(this.source.charAt(end))){++end;}var token=this.source.substring(this.index,this.index=end);if(token==='"'||token==="'")this._stringOpen=token;return token;}; /**
         * Peeks for the next token.
         * @return {?string} Token or `null` on EOF
         * @expose
         */TokenizerPrototype.peek=function(){if(this.stack.length===0){var token=this.next();if(token===null)return null;this.stack.push(token);}return this.stack[0];}; /**
         * Skips a specific token and throws if it differs.
         * @param {string} expected Expected token
         * @throws {Error} If the actual token differs
         */TokenizerPrototype.skip=function(expected){var actual=this.next();if(actual!==expected)throw Error("illegal '"+actual+"', '"+expected+"' expected");}; /**
         * Omits an optional token.
         * @param {string} expected Expected optional token
         * @returns {boolean} `true` if the token exists
         */TokenizerPrototype.omit=function(expected){if(this.peek()===expected){this.next();return true;}return false;}; /**
         * Returns a string representation of this object.
         * @return {string} String representation as of "Tokenizer(index/length)"
         * @expose
         */TokenizerPrototype.toString=function(){return "Tokenizer ("+this.index+"/"+this.source.length+" at line "+this.line+")";}; /**
         * @alias ProtoBuf.DotProto.Tokenizer
         * @expose
         */DotProto.Tokenizer=Tokenizer; /**
         * Constructs a new Parser.
         * @exports ProtoBuf.DotProto.Parser
         * @class prototype parser
         * @param {string} source Source
         * @constructor
         */var Parser=function Parser(source){ /**
             * Tokenizer.
             * @type {!ProtoBuf.DotProto.Tokenizer}
             * @expose
             */this.tn=new Tokenizer(source); /**
             * Whether parsing proto3 or not.
             * @type {boolean}
             */this.proto3=false;}; /**
         * @alias ProtoBuf.DotProto.Parser.prototype
         * @inner
         */var ParserPrototype=Parser.prototype; /**
         * Parses the source.
         * @returns {!Object}
         * @throws {Error} If the source cannot be parsed
         * @expose
         */ParserPrototype.parse=function(){var topLevel={"name":"[ROOT]", // temporary
"package":null,"messages":[],"enums":[],"imports":[],"options":{},"services":[] // "syntax": undefined
};var token,head=true,weak;try{while(token=this.tn.next()){switch(token){case 'package':if(!head||topLevel["package"]!==null)throw Error("unexpected 'package'");token=this.tn.next();if(!Lang.TYPEREF.test(token))throw Error("illegal package name: "+token);this.tn.skip(";");topLevel["package"]=token;break;case 'import':if(!head)throw Error("unexpected 'import'");token=this.tn.peek();if(token==="public"||(weak=token==="weak")) // token ignored
this.tn.next();token=this._readString();this.tn.skip(";");if(!weak) // import ignored
topLevel["imports"].push(token);break;case 'syntax':if(!head)throw Error("unexpected 'syntax'");this.tn.skip("=");if((topLevel["syntax"]=this._readString())==="proto3")this.proto3=true;this.tn.skip(";");break;case 'message':this._parseMessage(topLevel,null);head=false;break;case 'enum':this._parseEnum(topLevel);head=false;break;case 'option':this._parseOption(topLevel);break;case 'service':this._parseService(topLevel);break;case 'extend':this._parseExtend(topLevel);break;default:throw Error("unexpected '"+token+"'");}}}catch(e){e.message="Parse error at line "+this.tn.line+": "+e.message;throw e;}delete topLevel["name"];return topLevel;}; /**
         * Parses the specified source.
         * @returns {!Object}
         * @throws {Error} If the source cannot be parsed
         * @expose
         */Parser.parse=function(source){return new Parser(source).parse();}; // ----- Conversion ------
/**
         * Converts a numerical string to an id.
         * @param {string} value
         * @param {boolean=} mayBeNegative
         * @returns {number}
         * @inner
         */function mkId(value,mayBeNegative){var id=-1,sign=1;if(value.charAt(0)=='-'){sign=-1;value=value.substring(1);}if(Lang.NUMBER_DEC.test(value))id=parseInt(value);else if(Lang.NUMBER_HEX.test(value))id=parseInt(value.substring(2),16);else if(Lang.NUMBER_OCT.test(value))id=parseInt(value.substring(1),8);else throw Error("illegal id value: "+(sign<0?'-':'')+value);id=sign*id|0; // Force to 32bit
if(!mayBeNegative&&id<0)throw Error("illegal id value: "+(sign<0?'-':'')+value);return id;} /**
         * Converts a numerical string to a number.
         * @param {string} val
         * @returns {number}
         * @inner
         */function mkNumber(val){var sign=1;if(val.charAt(0)=='-'){sign=-1;val=val.substring(1);}if(Lang.NUMBER_DEC.test(val))return sign*parseInt(val,10);else if(Lang.NUMBER_HEX.test(val))return sign*parseInt(val.substring(2),16);else if(Lang.NUMBER_OCT.test(val))return sign*parseInt(val.substring(1),8);else if(val==='inf')return sign*Infinity;else if(val==='nan')return NaN;else if(Lang.NUMBER_FLT.test(val))return sign*parseFloat(val);throw Error("illegal number value: "+(sign<0?'-':'')+val);} // ----- Reading ------
/**
         * Reads a string.
         * @returns {string}
         * @private
         */ParserPrototype._readString=function(){var value="",token,delim;do {delim=this.tn.next();if(delim!=="'"&&delim!=='"')throw Error("illegal string delimiter: "+delim);value+=this.tn.next();this.tn.skip(delim);token=this.tn.peek();}while(token==='"'||token==='"'); // multi line?
return value;}; /**
         * Reads a value.
         * @param {boolean=} mayBeTypeRef
         * @returns {number|boolean|string}
         * @private
         */ParserPrototype._readValue=function(mayBeTypeRef){var token=this.tn.peek(),value;if(token==='"'||token==="'")return this._readString();this.tn.next();if(Lang.NUMBER.test(token))return mkNumber(token);if(Lang.BOOL.test(token))return token.toLowerCase()==='true';if(mayBeTypeRef&&Lang.TYPEREF.test(token))return token;throw Error("illegal value: "+token);}; // ----- Parsing constructs -----
/**
         * Parses a namespace option.
         * @param {!Object} parent Parent definition
         * @param {boolean=} isList
         * @private
         */ParserPrototype._parseOption=function(parent,isList){var token=this.tn.next(),custom=false;if(token==='('){custom=true;token=this.tn.next();}if(!Lang.TYPEREF.test(token)) // we can allow options of the form google.protobuf.* since they will just get ignored anyways
// if (!/google\.protobuf\./.test(token)) // FIXME: Why should that not be a valid typeref?
throw Error("illegal option name: "+token);var name=token;if(custom){ // (my_method_option).foo, (my_method_option), some_method_option, (foo.my_option).bar
this.tn.skip(')');name='('+name+')';token=this.tn.peek();if(Lang.FQTYPEREF.test(token)){name+=token;this.tn.next();}}this.tn.skip('=');this._parseOptionValue(parent,name);if(!isList)this.tn.skip(";");}; /**
         * Sets an option on the specified options object.
         * @param {!Object.<string,*>} options
         * @param {string} name
         * @param {string|number|boolean} value
         * @inner
         */function setOption(options,name,value){if(typeof options[name]==='undefined')options[name]=value;else {if(!Array.isArray(options[name]))options[name]=[options[name]];options[name].push(value);}} /**
         * Parses an option value.
         * @param {!Object} parent
         * @param {string} name
         * @private
         */ParserPrototype._parseOptionValue=function(parent,name){var token=this.tn.peek();if(token!=='{'){ // Plain value
setOption(parent["options"],name,this._readValue(true));}else { // Aggregate options
this.tn.skip("{");while((token=this.tn.next())!=='}'){if(!Lang.NAME.test(token))throw Error("illegal option name: "+name+"."+token);if(this.tn.omit(":"))setOption(parent["options"],name+"."+token,this._readValue(true));else this._parseOptionValue(parent,name+"."+token);}}}; /**
         * Parses a service definition.
         * @param {!Object} parent Parent definition
         * @private
         */ParserPrototype._parseService=function(parent){var token=this.tn.next();if(!Lang.NAME.test(token))throw Error("illegal service name at line "+this.tn.line+": "+token);var name=token;var svc={"name":name,"rpc":{},"options":{}};this.tn.skip("{");while((token=this.tn.next())!=='}'){if(token==="option")this._parseOption(svc);else if(token==='rpc')this._parseServiceRPC(svc);else throw Error("illegal service token: "+token);}this.tn.omit(";");parent["services"].push(svc);}; /**
         * Parses a RPC service definition of the form ['rpc', name, (request), 'returns', (response)].
         * @param {!Object} svc Service definition
         * @private
         */ParserPrototype._parseServiceRPC=function(svc){var type="rpc",token=this.tn.next();if(!Lang.NAME.test(token))throw Error("illegal rpc service method name: "+token);var name=token;var method={"request":null,"response":null,"request_stream":false,"response_stream":false,"options":{}};this.tn.skip("(");token=this.tn.next();if(token.toLowerCase()==="stream"){method["request_stream"]=true;token=this.tn.next();}if(!Lang.TYPEREF.test(token))throw Error("illegal rpc service request type: "+token);method["request"]=token;this.tn.skip(")");token=this.tn.next();if(token.toLowerCase()!=="returns")throw Error("illegal rpc service request type delimiter: "+token);this.tn.skip("(");token=this.tn.next();if(token.toLowerCase()==="stream"){method["response_stream"]=true;token=this.tn.next();}method["response"]=token;this.tn.skip(")");token=this.tn.peek();if(token==='{'){this.tn.next();while((token=this.tn.next())!=='}'){if(token==='option')this._parseOption(method);else throw Error("illegal rpc service token: "+token);}this.tn.omit(";");}else this.tn.skip(";");if(typeof svc[type]==='undefined')svc[type]={};svc[type][name]=method;}; /**
         * Parses a message definition.
         * @param {!Object} parent Parent definition
         * @param {!Object=} fld Field definition if this is a group
         * @returns {!Object}
         * @private
         */ParserPrototype._parseMessage=function(parent,fld){var isGroup=!!fld,token=this.tn.next();var msg={"name":"","fields":[],"enums":[],"messages":[],"options":{},"services":[],"oneofs":{} // "extensions": undefined
};if(!Lang.NAME.test(token))throw Error("illegal "+(isGroup?"group":"message")+" name: "+token);msg["name"]=token;if(isGroup){this.tn.skip("=");fld["id"]=mkId(this.tn.next());msg["isGroup"]=true;}token=this.tn.peek();if(token==='['&&fld)this._parseFieldOptions(fld);this.tn.skip("{");while((token=this.tn.next())!=='}'){if(Lang.RULE.test(token))this._parseMessageField(msg,token);else if(token==="oneof")this._parseMessageOneOf(msg);else if(token==="enum")this._parseEnum(msg);else if(token==="message")this._parseMessage(msg);else if(token==="option")this._parseOption(msg);else if(token==="service")this._parseService(msg);else if(token==="extensions")msg["extensions"]=this._parseExtensionRanges();else if(token==="reserved")this._parseIgnored(); // TODO
else if(token==="extend")this._parseExtend(msg);else if(Lang.TYPEREF.test(token)){if(!this.proto3)throw Error("illegal field rule: "+token);this._parseMessageField(msg,"optional",token);}else throw Error("illegal message token: "+token);}this.tn.omit(";");parent["messages"].push(msg);return msg;}; /**
         * Parses an ignored statement.
         * @private
         */ParserPrototype._parseIgnored=function(){while(this.tn.peek()!==';'){this.tn.next();}this.tn.skip(";");}; /**
         * Parses a message field.
         * @param {!Object} msg Message definition
         * @param {string} rule Field rule
         * @param {string=} type Field type if already known (never known for maps)
         * @returns {!Object} Field descriptor
         * @private
         */ParserPrototype._parseMessageField=function(msg,rule,type){if(!Lang.RULE.test(rule))throw Error("illegal message field rule: "+rule);var fld={"rule":rule,"type":"","name":"","options":{},"id":0};var token;if(rule==="map"){if(type)throw Error("illegal type: "+type);this.tn.skip('<');token=this.tn.next();if(!Lang.TYPE.test(token)&&!Lang.TYPEREF.test(token))throw Error("illegal message field type: "+token);fld["keytype"]=token;this.tn.skip(',');token=this.tn.next();if(!Lang.TYPE.test(token)&&!Lang.TYPEREF.test(token))throw Error("illegal message field: "+token);fld["type"]=token;this.tn.skip('>');token=this.tn.next();if(!Lang.NAME.test(token))throw Error("illegal message field name: "+token);fld["name"]=token;this.tn.skip("=");fld["id"]=mkId(this.tn.next());token=this.tn.peek();if(token==='[')this._parseFieldOptions(fld);this.tn.skip(";");}else {type=typeof type!=='undefined'?type:this.tn.next();if(type==="group"){ // "A [legacy] group simply combines a nested message type and a field into a single declaration. In your
// code, you can treat this message just as if it had a Result type field called result (the latter name is
// converted to lower-case so that it does not conflict with the former)."
var grp=this._parseMessage(msg,fld);if(!/^[A-Z]/.test(grp["name"]))throw Error('illegal group name: '+grp["name"]);fld["type"]=grp["name"];fld["name"]=grp["name"].toLowerCase();this.tn.omit(";");}else {if(!Lang.TYPE.test(type)&&!Lang.TYPEREF.test(type))throw Error("illegal message field type: "+type);fld["type"]=type;token=this.tn.next();if(!Lang.NAME.test(token))throw Error("illegal message field name: "+token);fld["name"]=token;this.tn.skip("=");fld["id"]=mkId(this.tn.next());token=this.tn.peek();if(token==="[")this._parseFieldOptions(fld);this.tn.skip(";");}}msg["fields"].push(fld);return fld;}; /**
         * Parses a message oneof.
         * @param {!Object} msg Message definition
         * @private
         */ParserPrototype._parseMessageOneOf=function(msg){var token=this.tn.next();if(!Lang.NAME.test(token))throw Error("illegal oneof name: "+token);var name=token,fld;var fields=[];this.tn.skip("{");while((token=this.tn.next())!=="}"){fld=this._parseMessageField(msg,"optional",token);fld["oneof"]=name;fields.push(fld["id"]);}this.tn.omit(";");msg["oneofs"][name]=fields;}; /**
         * Parses a set of field option definitions.
         * @param {!Object} fld Field definition
         * @private
         */ParserPrototype._parseFieldOptions=function(fld){this.tn.skip("[");var token,first=true;while((token=this.tn.peek())!==']'){if(!first)this.tn.skip(",");this._parseOption(fld,true);first=false;}this.tn.next();}; /**
         * Parses an enum.
         * @param {!Object} msg Message definition
         * @private
         */ParserPrototype._parseEnum=function(msg){var enm={"name":"","values":[],"options":{}};var token=this.tn.next();if(!Lang.NAME.test(token))throw Error("illegal name: "+token);enm["name"]=token;this.tn.skip("{");while((token=this.tn.next())!=='}'){if(token==="option")this._parseOption(enm);else {if(!Lang.NAME.test(token))throw Error("illegal name: "+token);this.tn.skip("=");var val={"name":token,"id":mkId(this.tn.next(),true)};token=this.tn.peek();if(token==="[")this._parseFieldOptions({"options":{}});this.tn.skip(";");enm["values"].push(val);}}this.tn.omit(";");msg["enums"].push(enm);}; /**
         * Parses extension / reserved ranges.
         * @returns {!Array.<!Array.<number>>}
         * @private
         */ParserPrototype._parseExtensionRanges=function(){var ranges=[];var token,range,value;do {range=[];while(true){token=this.tn.next();switch(token){case "min":value=ProtoBuf.ID_MIN;break;case "max":value=ProtoBuf.ID_MAX;break;default:value=mkNumber(token);break;}range.push(value);if(range.length===2)break;if(this.tn.peek()!=="to"){range.push(value);break;}this.tn.next();}ranges.push(range);}while(this.tn.omit(","));this.tn.skip(";");return ranges;}; /**
         * Parses an extend block.
         * @param {!Object} parent Parent object
         * @private
         */ParserPrototype._parseExtend=function(parent){var token=this.tn.next();if(!Lang.TYPEREF.test(token))throw Error("illegal extend reference: "+token);var ext={"ref":token,"fields":[]};this.tn.skip("{");while((token=this.tn.next())!=='}'){if(Lang.RULE.test(token))this._parseMessageField(ext,token);else if(Lang.TYPEREF.test(token)){if(!this.proto3)throw Error("illegal field rule: "+token);this._parseMessageField(ext,"optional",token);}else throw Error("illegal extend token: "+token);}this.tn.omit(";");parent["messages"].push(ext);return ext;}; // ----- General -----
/**
         * Returns a string representation of this parser.
         * @returns {string}
         */ParserPrototype.toString=function(){return "Parser at line "+this.tn.line;}; /**
         * @alias ProtoBuf.DotProto.Parser
         * @expose
         */DotProto.Parser=Parser;return DotProto;}(ProtoBuf,ProtoBuf.Lang); /**
     * @alias ProtoBuf.Reflect
     * @expose
     */ProtoBuf.Reflect=function(ProtoBuf){"use strict"; /**
         * Reflection types.
         * @exports ProtoBuf.Reflect
         * @namespace
         */var Reflect={}; /**
         * Constructs a Reflect base class.
         * @exports ProtoBuf.Reflect.T
         * @constructor
         * @abstract
         * @param {!ProtoBuf.Builder} builder Builder reference
         * @param {?ProtoBuf.Reflect.T} parent Parent object
         * @param {string} name Object name
         */var T=function T(builder,parent,name){ /**
             * Builder reference.
             * @type {!ProtoBuf.Builder}
             * @expose
             */this.builder=builder; /**
             * Parent object.
             * @type {?ProtoBuf.Reflect.T}
             * @expose
             */this.parent=parent; /**
             * Object name in namespace.
             * @type {string}
             * @expose
             */this.name=name; /**
             * Fully qualified class name
             * @type {string}
             * @expose
             */this.className;}; /**
         * @alias ProtoBuf.Reflect.T.prototype
         * @inner
         */var TPrototype=T.prototype; /**
         * Returns the fully qualified name of this object.
         * @returns {string} Fully qualified name as of ".PATH.TO.THIS"
         * @expose
         */TPrototype.fqn=function(){var name=this.name,ptr=this;do {ptr=ptr.parent;if(ptr==null)break;name=ptr.name+"."+name;}while(true);return name;}; /**
         * Returns a string representation of this Reflect object (its fully qualified name).
         * @param {boolean=} includeClass Set to true to include the class name. Defaults to false.
         * @return String representation
         * @expose
         */TPrototype.toString=function(includeClass){return (includeClass?this.className+" ":"")+this.fqn();}; /**
         * Builds this type.
         * @throws {Error} If this type cannot be built directly
         * @expose
         */TPrototype.build=function(){throw Error(this.toString(true)+" cannot be built directly");}; /**
         * @alias ProtoBuf.Reflect.T
         * @expose
         */Reflect.T=T; /**
         * Constructs a new Namespace.
         * @exports ProtoBuf.Reflect.Namespace
         * @param {!ProtoBuf.Builder} builder Builder reference
         * @param {?ProtoBuf.Reflect.Namespace} parent Namespace parent
         * @param {string} name Namespace name
         * @param {Object.<string,*>=} options Namespace options
         * @param {string?} syntax The syntax level of this definition (e.g., proto3)
         * @constructor
         * @extends ProtoBuf.Reflect.T
         */var Namespace=function Namespace(builder,parent,name,options,syntax){T.call(this,builder,parent,name); /**
             * @override
             */this.className="Namespace"; /**
             * Children inside the namespace.
             * @type {!Array.<ProtoBuf.Reflect.T>}
             */this.children=[]; /**
             * Options.
             * @type {!Object.<string, *>}
             */this.options=options||{}; /**
             * Syntax level (e.g., proto2 or proto3).
             * @type {!string}
             */this.syntax=syntax||"proto2";}; /**
         * @alias ProtoBuf.Reflect.Namespace.prototype
         * @inner
         */var NamespacePrototype=Namespace.prototype=Object.create(T.prototype); /**
         * Returns an array of the namespace's children.
         * @param {ProtoBuf.Reflect.T=} type Filter type (returns instances of this type only). Defaults to null (all children).
         * @return {Array.<ProtoBuf.Reflect.T>}
         * @expose
         */NamespacePrototype.getChildren=function(type){type=type||null;if(type==null)return this.children.slice();var children=[];for(var i=0,k=this.children.length;i<k;++i){if(this.children[i] instanceof type)children.push(this.children[i]);}return children;}; /**
         * Adds a child to the namespace.
         * @param {ProtoBuf.Reflect.T} child Child
         * @throws {Error} If the child cannot be added (duplicate)
         * @expose
         */NamespacePrototype.addChild=function(child){var other;if(other=this.getChild(child.name)){ // Try to revert camelcase transformation on collision
if(other instanceof Message.Field&&other.name!==other.originalName&&this.getChild(other.originalName)===null)other.name=other.originalName; // Revert previous first (effectively keeps both originals)
else if(child instanceof Message.Field&&child.name!==child.originalName&&this.getChild(child.originalName)===null)child.name=child.originalName;else throw Error("Duplicate name in namespace "+this.toString(true)+": "+child.name);}this.children.push(child);}; /**
         * Gets a child by its name or id.
         * @param {string|number} nameOrId Child name or id
         * @return {?ProtoBuf.Reflect.T} The child or null if not found
         * @expose
         */NamespacePrototype.getChild=function(nameOrId){var key=typeof nameOrId==='number'?'id':'name';for(var i=0,k=this.children.length;i<k;++i){if(this.children[i][key]===nameOrId)return this.children[i];}return null;}; /**
         * Resolves a reflect object inside of this namespace.
         * @param {string|!Array.<string>} qn Qualified name to resolve
         * @param {boolean=} excludeNonNamespace Excludes non-namespace types, defaults to `false`
         * @return {?ProtoBuf.Reflect.Namespace} The resolved type or null if not found
         * @expose
         */NamespacePrototype.resolve=function(qn,excludeNonNamespace){var part=typeof qn==='string'?qn.split("."):qn,ptr=this,i=0;if(part[i]===""){ // Fully qualified name, e.g. ".My.Message'
while(ptr.parent!==null){ptr=ptr.parent;}i++;}var child;do {do {if(!(ptr instanceof Reflect.Namespace)){ptr=null;break;}child=ptr.getChild(part[i]);if(!child||!(child instanceof Reflect.T)||excludeNonNamespace&&!(child instanceof Reflect.Namespace)){ptr=null;break;}ptr=child;i++;}while(i<part.length);if(ptr!=null)break; // Found
// Else search the parent
if(this.parent!==null)return this.parent.resolve(qn,excludeNonNamespace);}while(ptr!=null);return ptr;}; /**
         * Determines the shortest qualified name of the specified type, if any, relative to this namespace.
         * @param {!ProtoBuf.Reflect.T} t Reflection type
         * @returns {string} The shortest qualified name or, if there is none, the fqn
         * @expose
         */NamespacePrototype.qn=function(t){var part=[],ptr=t;do {part.unshift(ptr.name);ptr=ptr.parent;}while(ptr!==null);for(var len=1;len<=part.length;len++){var qn=part.slice(part.length-len);if(t===this.resolve(qn,t instanceof Reflect.Namespace))return qn.join(".");}return t.fqn();}; /**
         * Builds the namespace and returns the runtime counterpart.
         * @return {Object.<string,Function|Object>} Runtime namespace
         * @expose
         */NamespacePrototype.build=function(){ /** @dict */var ns={};var children=this.children;for(var i=0,k=children.length,child;i<k;++i){child=children[i];if(child instanceof Namespace)ns[child.name]=child.build();}if(Object.defineProperty)Object.defineProperty(ns,"$options",{"value":this.buildOpt()});return ns;}; /**
         * Builds the namespace's '$options' property.
         * @return {Object.<string,*>}
         */NamespacePrototype.buildOpt=function(){var opt={},keys=Object.keys(this.options);for(var i=0,k=keys.length;i<k;++i){var key=keys[i],val=this.options[keys[i]]; // TODO: Options are not resolved, yet.
// if (val instanceof Namespace) {
//     opt[key] = val.build();
// } else {
opt[key]=val; // }
}return opt;}; /**
         * Gets the value assigned to the option with the specified name.
         * @param {string=} name Returns the option value if specified, otherwise all options are returned.
         * @return {*|Object.<string,*>}null} Option value or NULL if there is no such option
         */NamespacePrototype.getOption=function(name){if(typeof name==='undefined')return this.options;return typeof this.options[name]!=='undefined'?this.options[name]:null;}; /**
         * @alias ProtoBuf.Reflect.Namespace
         * @expose
         */Reflect.Namespace=Namespace; /**
         * Constructs a new Element implementation that checks and converts values for a
         * particular field type, as appropriate.
         *
         * An Element represents a single value: either the value of a singular field,
         * or a value contained in one entry of a repeated field or map field. This
         * class does not implement these higher-level concepts; it only encapsulates
         * the low-level typechecking and conversion.
         *
         * @exports ProtoBuf.Reflect.Element
         * @param {{name: string, wireType: number}} type Resolved data type
         * @param {ProtoBuf.Reflect.T|null} resolvedType Resolved type, if relevant
         * (e.g. submessage field).
         * @param {boolean} isMapKey Is this element a Map key? The value will be
         * converted to string form if so.
         * @param {string} syntax Syntax level of defining message type, e.g.,
         * proto2 or proto3.
         * @constructor
         */var Element=function Element(type,resolvedType,isMapKey,syntax){ /**
             * Element type, as a string (e.g., int32).
             * @type {{name: string, wireType: number}}
             */this.type=type; /**
             * Element type reference to submessage or enum definition, if needed.
             * @type {ProtoBuf.Reflect.T|null}
             */this.resolvedType=resolvedType; /**
             * Element is a map key.
             * @type {boolean}
             */this.isMapKey=isMapKey; /**
             * Syntax level of defining message type, e.g., proto2 or proto3.
             * @type {string}
             */this.syntax=syntax;if(isMapKey&&ProtoBuf.MAP_KEY_TYPES.indexOf(type)<0)throw Error("Invalid map key type: "+type.name);};var ElementPrototype=Element.prototype; /**
         * Obtains a (new) default value for the specified type.
         * @param type {string|{name: string, wireType: number}} Field type
         * @returns {*} Default value
         * @inner
         */function mkDefault(type){if(typeof type==='string')type=ProtoBuf.TYPES[type];if(typeof type.defaultValue==='undefined')throw Error("default value for type "+type.name+" is not supported");if(type==ProtoBuf.TYPES["bytes"])return new ByteBuffer(0);return type.defaultValue;} /**
         * Returns the default value for this field in proto3.
         * @function
         * @param type {string|{name: string, wireType: number}} the field type
         * @returns {*} Default value
         */Element.defaultFieldValue=mkDefault; /**
         * Makes a Long from a value.
         * @param {{low: number, high: number, unsigned: boolean}|string|number} value Value
         * @param {boolean=} unsigned Whether unsigned or not, defaults to reuse it from Long-like objects or to signed for
         *  strings and numbers
         * @returns {!Long}
         * @throws {Error} If the value cannot be converted to a Long
         * @inner
         */function mkLong(value,unsigned){if(value&&typeof value.low==='number'&&typeof value.high==='number'&&typeof value.unsigned==='boolean'&&value.low===value.low&&value.high===value.high)return new ProtoBuf.Long(value.low,value.high,typeof unsigned==='undefined'?value.unsigned:unsigned);if(typeof value==='string')return ProtoBuf.Long.fromString(value,unsigned||false,10);if(typeof value==='number')return ProtoBuf.Long.fromNumber(value,unsigned||false);throw Error("not convertible to Long");} /**
         * Checks if the given value can be set for an element of this type (singular
         * field or one element of a repeated field or map).
         * @param {*} value Value to check
         * @return {*} Verified, maybe adjusted, value
         * @throws {Error} If the value cannot be verified for this element slot
         * @expose
         */ElementPrototype.verifyValue=function(value){var self=this;function fail(val,msg){throw Error("Illegal value for "+self.toString(true)+" of type "+self.type.name+": "+val+" ("+msg+")");}switch(this.type){ // Signed 32bit
case ProtoBuf.TYPES["int32"]:case ProtoBuf.TYPES["sint32"]:case ProtoBuf.TYPES["sfixed32"]: // Account for !NaN: value === value
if(typeof value!=='number'||value===value&&value%1!==0)fail(typeof value==="undefined"?"undefined":_typeof(value),"not an integer");return value>4294967295?value|0:value; // Unsigned 32bit
case ProtoBuf.TYPES["uint32"]:case ProtoBuf.TYPES["fixed32"]:if(typeof value!=='number'||value===value&&value%1!==0)fail(typeof value==="undefined"?"undefined":_typeof(value),"not an integer");return value<0?value>>>0:value; // Signed 64bit
case ProtoBuf.TYPES["int64"]:case ProtoBuf.TYPES["sint64"]:case ProtoBuf.TYPES["sfixed64"]:{if(ProtoBuf.Long)try{return mkLong(value,false);}catch(e){fail(typeof value==="undefined"?"undefined":_typeof(value),e.message);}else fail(typeof value==="undefined"?"undefined":_typeof(value),"requires Long.js");} // Unsigned 64bit
case ProtoBuf.TYPES["uint64"]:case ProtoBuf.TYPES["fixed64"]:{if(ProtoBuf.Long)try{return mkLong(value,true);}catch(e){fail(typeof value==="undefined"?"undefined":_typeof(value),e.message);}else fail(typeof value==="undefined"?"undefined":_typeof(value),"requires Long.js");} // Bool
case ProtoBuf.TYPES["bool"]:if(typeof value!=='boolean')fail(typeof value==="undefined"?"undefined":_typeof(value),"not a boolean");return value; // Float
case ProtoBuf.TYPES["float"]:case ProtoBuf.TYPES["double"]:if(typeof value!=='number')fail(typeof value==="undefined"?"undefined":_typeof(value),"not a number");return value; // Length-delimited string
case ProtoBuf.TYPES["string"]:if(typeof value!=='string'&&!(value&&value instanceof String))fail(typeof value==="undefined"?"undefined":_typeof(value),"not a string");return ""+value; // Convert String object to string
// Length-delimited bytes
case ProtoBuf.TYPES["bytes"]:if(ByteBuffer.isByteBuffer(value))return value;return ByteBuffer.wrap(value,"base64"); // Constant enum value
case ProtoBuf.TYPES["enum"]:{var values=this.resolvedType.getChildren(ProtoBuf.Reflect.Enum.Value);for(i=0;i<values.length;i++){if(values[i].name==value)return values[i].id;else if(values[i].id==value)return values[i].id;}if(this.syntax==='proto3'){ // proto3: just make sure it's an integer.
if(typeof value!=='number'||value===value&&value%1!==0)fail(typeof value==="undefined"?"undefined":_typeof(value),"not an integer");if(value>4294967295||value<0)fail(typeof value==="undefined"?"undefined":_typeof(value),"not in range for uint32");return value;}else { // proto2 requires enum values to be valid.
fail(value,"not a valid enum value");}} // Embedded message
case ProtoBuf.TYPES["group"]:case ProtoBuf.TYPES["message"]:{if(!value||(typeof value==="undefined"?"undefined":_typeof(value))!=='object')fail(typeof value==="undefined"?"undefined":_typeof(value),"object expected");if(value instanceof this.resolvedType.clazz)return value;if(value instanceof ProtoBuf.Builder.Message){ // Mismatched type: Convert to object (see: https://github.com/dcodeIO/ProtoBuf.js/issues/180)
var obj={};for(var i in value){if(value.hasOwnProperty(i))obj[i]=value[i];}value=obj;} // Else let's try to construct one from a key-value object
return new this.resolvedType.clazz(value); // May throw for a hundred of reasons
}} // We should never end here
throw Error("[INTERNAL] Illegal value for "+this.toString(true)+": "+value+" (undefined type "+this.type+")");}; /**
         * Calculates the byte length of an element on the wire.
         * @param {number} id Field number
         * @param {*} value Field value
         * @returns {number} Byte length
         * @throws {Error} If the value cannot be calculated
         * @expose
         */ElementPrototype.calculateLength=function(id,value){if(value===null)return 0; // Nothing to encode
// Tag has already been written
var n;switch(this.type){case ProtoBuf.TYPES["int32"]:return value<0?ByteBuffer.calculateVarint64(value):ByteBuffer.calculateVarint32(value);case ProtoBuf.TYPES["uint32"]:return ByteBuffer.calculateVarint32(value);case ProtoBuf.TYPES["sint32"]:return ByteBuffer.calculateVarint32(ByteBuffer.zigZagEncode32(value));case ProtoBuf.TYPES["fixed32"]:case ProtoBuf.TYPES["sfixed32"]:case ProtoBuf.TYPES["float"]:return 4;case ProtoBuf.TYPES["int64"]:case ProtoBuf.TYPES["uint64"]:return ByteBuffer.calculateVarint64(value);case ProtoBuf.TYPES["sint64"]:return ByteBuffer.calculateVarint64(ByteBuffer.zigZagEncode64(value));case ProtoBuf.TYPES["fixed64"]:case ProtoBuf.TYPES["sfixed64"]:return 8;case ProtoBuf.TYPES["bool"]:return 1;case ProtoBuf.TYPES["enum"]:return ByteBuffer.calculateVarint32(value);case ProtoBuf.TYPES["double"]:return 8;case ProtoBuf.TYPES["string"]:n=ByteBuffer.calculateUTF8Bytes(value);return ByteBuffer.calculateVarint32(n)+n;case ProtoBuf.TYPES["bytes"]:if(value.remaining()<0)throw Error("Illegal value for "+this.toString(true)+": "+value.remaining()+" bytes remaining");return ByteBuffer.calculateVarint32(value.remaining())+value.remaining();case ProtoBuf.TYPES["message"]:n=this.resolvedType.calculate(value);return ByteBuffer.calculateVarint32(n)+n;case ProtoBuf.TYPES["group"]:n=this.resolvedType.calculate(value);return n+ByteBuffer.calculateVarint32(id<<3|ProtoBuf.WIRE_TYPES.ENDGROUP);} // We should never end here
throw Error("[INTERNAL] Illegal value to encode in "+this.toString(true)+": "+value+" (unknown type)");}; /**
         * Encodes a value to the specified buffer. Does not encode the key.
         * @param {number} id Field number
         * @param {*} value Field value
         * @param {ByteBuffer} buffer ByteBuffer to encode to
         * @return {ByteBuffer} The ByteBuffer for chaining
         * @throws {Error} If the value cannot be encoded
         * @expose
         */ElementPrototype.encodeValue=function(id,value,buffer){if(value===null)return buffer; // Nothing to encode
// Tag has already been written
switch(this.type){ // 32bit signed varint
case ProtoBuf.TYPES["int32"]: // "If you use int32 or int64 as the type for a negative number, the resulting varint is always ten bytes
// long – it is, effectively, treated like a very large unsigned integer." (see #122)
if(value<0)buffer.writeVarint64(value);else buffer.writeVarint32(value);break; // 32bit unsigned varint
case ProtoBuf.TYPES["uint32"]:buffer.writeVarint32(value);break; // 32bit varint zig-zag
case ProtoBuf.TYPES["sint32"]:buffer.writeVarint32ZigZag(value);break; // Fixed unsigned 32bit
case ProtoBuf.TYPES["fixed32"]:buffer.writeUint32(value);break; // Fixed signed 32bit
case ProtoBuf.TYPES["sfixed32"]:buffer.writeInt32(value);break; // 64bit varint as-is
case ProtoBuf.TYPES["int64"]:case ProtoBuf.TYPES["uint64"]:buffer.writeVarint64(value); // throws
break; // 64bit varint zig-zag
case ProtoBuf.TYPES["sint64"]:buffer.writeVarint64ZigZag(value); // throws
break; // Fixed unsigned 64bit
case ProtoBuf.TYPES["fixed64"]:buffer.writeUint64(value); // throws
break; // Fixed signed 64bit
case ProtoBuf.TYPES["sfixed64"]:buffer.writeInt64(value); // throws
break; // Bool
case ProtoBuf.TYPES["bool"]:if(typeof value==='string')buffer.writeVarint32(value.toLowerCase()==='false'?0:!!value);else buffer.writeVarint32(value?1:0);break; // Constant enum value
case ProtoBuf.TYPES["enum"]:buffer.writeVarint32(value);break; // 32bit float
case ProtoBuf.TYPES["float"]:buffer.writeFloat32(value);break; // 64bit float
case ProtoBuf.TYPES["double"]:buffer.writeFloat64(value);break; // Length-delimited string
case ProtoBuf.TYPES["string"]:buffer.writeVString(value);break; // Length-delimited bytes
case ProtoBuf.TYPES["bytes"]:if(value.remaining()<0)throw Error("Illegal value for "+this.toString(true)+": "+value.remaining()+" bytes remaining");var prevOffset=value.offset;buffer.writeVarint32(value.remaining());buffer.append(value);value.offset=prevOffset;break; // Embedded message
case ProtoBuf.TYPES["message"]:var bb=new ByteBuffer().LE();this.resolvedType.encode(value,bb);buffer.writeVarint32(bb.offset);buffer.append(bb.flip());break; // Legacy group
case ProtoBuf.TYPES["group"]:this.resolvedType.encode(value,buffer);buffer.writeVarint32(id<<3|ProtoBuf.WIRE_TYPES.ENDGROUP);break;default: // We should never end here
throw Error("[INTERNAL] Illegal value to encode in "+this.toString(true)+": "+value+" (unknown type)");}return buffer;}; /**
         * Decode one element value from the specified buffer.
         * @param {ByteBuffer} buffer ByteBuffer to decode from
         * @param {number} wireType The field wire type
         * @param {number} id The field number
         * @return {*} Decoded value
         * @throws {Error} If the field cannot be decoded
         * @expose
         */ElementPrototype.decode=function(buffer,wireType,id){if(wireType!=this.type.wireType)throw Error("Unexpected wire type for element");var value,nBytes;switch(this.type){ // 32bit signed varint
case ProtoBuf.TYPES["int32"]:return buffer.readVarint32()|0; // 32bit unsigned varint
case ProtoBuf.TYPES["uint32"]:return buffer.readVarint32()>>>0; // 32bit signed varint zig-zag
case ProtoBuf.TYPES["sint32"]:return buffer.readVarint32ZigZag()|0; // Fixed 32bit unsigned
case ProtoBuf.TYPES["fixed32"]:return buffer.readUint32()>>>0;case ProtoBuf.TYPES["sfixed32"]:return buffer.readInt32()|0; // 64bit signed varint
case ProtoBuf.TYPES["int64"]:return buffer.readVarint64(); // 64bit unsigned varint
case ProtoBuf.TYPES["uint64"]:return buffer.readVarint64().toUnsigned(); // 64bit signed varint zig-zag
case ProtoBuf.TYPES["sint64"]:return buffer.readVarint64ZigZag(); // Fixed 64bit unsigned
case ProtoBuf.TYPES["fixed64"]:return buffer.readUint64(); // Fixed 64bit signed
case ProtoBuf.TYPES["sfixed64"]:return buffer.readInt64(); // Bool varint
case ProtoBuf.TYPES["bool"]:return !!buffer.readVarint32(); // Constant enum value (varint)
case ProtoBuf.TYPES["enum"]: // The following Builder.Message#set will already throw
return buffer.readVarint32(); // 32bit float
case ProtoBuf.TYPES["float"]:return buffer.readFloat(); // 64bit float
case ProtoBuf.TYPES["double"]:return buffer.readDouble(); // Length-delimited string
case ProtoBuf.TYPES["string"]:return buffer.readVString(); // Length-delimited bytes
case ProtoBuf.TYPES["bytes"]:{nBytes=buffer.readVarint32();if(buffer.remaining()<nBytes)throw Error("Illegal number of bytes for "+this.toString(true)+": "+nBytes+" required but got only "+buffer.remaining());value=buffer.clone(); // Offset already set
value.limit=value.offset+nBytes;buffer.offset+=nBytes;return value;} // Length-delimited embedded message
case ProtoBuf.TYPES["message"]:{nBytes=buffer.readVarint32();return this.resolvedType.decode(buffer,nBytes);} // Legacy group
case ProtoBuf.TYPES["group"]:return this.resolvedType.decode(buffer,-1,id);} // We should never end here
throw Error("[INTERNAL] Illegal decode type");}; /**
         * Converts a value from a string to the canonical element type.
         *
         * Legal only when isMapKey is true.
         *
         * @param {string} str The string value
         * @returns {*} The value
         */ElementPrototype.valueFromString=function(str){if(!this.isMapKey){throw Error("valueFromString() called on non-map-key element");}switch(this.type){case ProtoBuf.TYPES["int32"]:case ProtoBuf.TYPES["sint32"]:case ProtoBuf.TYPES["sfixed32"]:case ProtoBuf.TYPES["uint32"]:case ProtoBuf.TYPES["fixed32"]:return this.verifyValue(parseInt(str));case ProtoBuf.TYPES["int64"]:case ProtoBuf.TYPES["sint64"]:case ProtoBuf.TYPES["sfixed64"]:case ProtoBuf.TYPES["uint64"]:case ProtoBuf.TYPES["fixed64"]: // Long-based fields support conversions from string already.
return this.verifyValue(str);case ProtoBuf.TYPES["bool"]:return str==="true";case ProtoBuf.TYPES["string"]:return this.verifyValue(str);case ProtoBuf.TYPES["bytes"]:return ByteBuffer.fromBinary(str);}}; /**
         * Converts a value from the canonical element type to a string.
         *
         * It should be the case that `valueFromString(valueToString(val))` returns
         * a value equivalent to `verifyValue(val)` for every legal value of `val`
         * according to this element type.
         *
         * This may be used when the element must be stored or used as a string,
         * e.g., as a map key on an Object.
         *
         * Legal only when isMapKey is true.
         *
         * @param {*} val The value
         * @returns {string} The string form of the value.
         */ElementPrototype.valueToString=function(value){if(!this.isMapKey){throw Error("valueToString() called on non-map-key element");}if(this.type===ProtoBuf.TYPES["bytes"]){return value.toString("binary");}else {return value.toString();}}; /**
         * @alias ProtoBuf.Reflect.Element
         * @expose
         */Reflect.Element=Element; /**
         * Constructs a new Message.
         * @exports ProtoBuf.Reflect.Message
         * @param {!ProtoBuf.Builder} builder Builder reference
         * @param {!ProtoBuf.Reflect.Namespace} parent Parent message or namespace
         * @param {string} name Message name
         * @param {Object.<string,*>=} options Message options
         * @param {boolean=} isGroup `true` if this is a legacy group
         * @param {string?} syntax The syntax level of this definition (e.g., proto3)
         * @constructor
         * @extends ProtoBuf.Reflect.Namespace
         */var Message=function Message(builder,parent,name,options,isGroup,syntax){Namespace.call(this,builder,parent,name,options,syntax); /**
             * @override
             */this.className="Message"; /**
             * Extensions range.
             * @type {!Array.<number>|undefined}
             * @expose
             */this.extensions=undefined; /**
             * Runtime message class.
             * @type {?function(new:ProtoBuf.Builder.Message)}
             * @expose
             */this.clazz=null; /**
             * Whether this is a legacy group or not.
             * @type {boolean}
             * @expose
             */this.isGroup=!!isGroup; // The following cached collections are used to efficiently iterate over or look up fields when decoding.
/**
             * Cached fields.
             * @type {?Array.<!ProtoBuf.Reflect.Message.Field>}
             * @private
             */this._fields=null; /**
             * Cached fields by id.
             * @type {?Object.<number,!ProtoBuf.Reflect.Message.Field>}
             * @private
             */this._fieldsById=null; /**
             * Cached fields by name.
             * @type {?Object.<string,!ProtoBuf.Reflect.Message.Field>}
             * @private
             */this._fieldsByName=null;}; /**
         * @alias ProtoBuf.Reflect.Message.prototype
         * @inner
         */var MessagePrototype=Message.prototype=Object.create(Namespace.prototype); /**
         * Builds the message and returns the runtime counterpart, which is a fully functional class.
         * @see ProtoBuf.Builder.Message
         * @param {boolean=} rebuild Whether to rebuild or not, defaults to false
         * @return {ProtoBuf.Reflect.Message} Message class
         * @throws {Error} If the message cannot be built
         * @expose
         */MessagePrototype.build=function(rebuild){if(this.clazz&&!rebuild)return this.clazz; // Create the runtime Message class in its own scope
var clazz=function(ProtoBuf,T){var fields=T.getChildren(ProtoBuf.Reflect.Message.Field),oneofs=T.getChildren(ProtoBuf.Reflect.Message.OneOf); /**
                 * Constructs a new runtime Message.
                 * @name ProtoBuf.Builder.Message
                 * @class Barebone of all runtime messages.
                 * @param {!Object.<string,*>|string} values Preset values
                 * @param {...string} var_args
                 * @constructor
                 * @throws {Error} If the message cannot be created
                 */var Message=function Message(values,var_args){ProtoBuf.Builder.Message.call(this); // Create virtual oneof properties
for(var i=0,k=oneofs.length;i<k;++i){this[oneofs[i].name]=null;} // Create fields and set default values
for(i=0,k=fields.length;i<k;++i){var field=fields[i];this[field.name]=field.repeated?[]:field.map?new ProtoBuf.Map(field):null;if((field.required||T.syntax==='proto3')&&field.defaultValue!==null)this[field.name]=field.defaultValue;}if(arguments.length>0){var value; // Set field values from a values object
if(arguments.length===1&&values!==null&&(typeof values==="undefined"?"undefined":_typeof(values))==='object'&&( /* not _another_ Message */typeof values.encode!=='function'||values instanceof Message)&& /* not a repeated field */!Array.isArray(values)&& /* not a Map */!(values instanceof ProtoBuf.Map)&& /* not a ByteBuffer */!ByteBuffer.isByteBuffer(values)&& /* not an ArrayBuffer */!(values instanceof ArrayBuffer)&& /* not a Long */!(ProtoBuf.Long&&values instanceof ProtoBuf.Long)){this.$set(values);}else  // Set field values from arguments, in declaration order
for(i=0,k=arguments.length;i<k;++i){if(typeof (value=arguments[i])!=='undefined')this.$set(fields[i].name,value);} // May throw
}}; /**
                 * @alias ProtoBuf.Builder.Message.prototype
                 * @inner
                 */var MessagePrototype=Message.prototype=Object.create(ProtoBuf.Builder.Message.prototype); /**
                 * Adds a value to a repeated field.
                 * @name ProtoBuf.Builder.Message#add
                 * @function
                 * @param {string} key Field name
                 * @param {*} value Value to add
                 * @param {boolean=} noAssert Whether to assert the value or not (asserts by default)
                 * @returns {!ProtoBuf.Builder.Message} this
                 * @throws {Error} If the value cannot be added
                 * @expose
                 */MessagePrototype.add=function(key,value,noAssert){var field=T._fieldsByName[key];if(!noAssert){if(!field)throw Error(this+"#"+key+" is undefined");if(!(field instanceof ProtoBuf.Reflect.Message.Field))throw Error(this+"#"+key+" is not a field: "+field.toString(true)); // May throw if it's an enum or embedded message
if(!field.repeated)throw Error(this+"#"+key+" is not a repeated field");value=field.verifyValue(value,true);}if(this[key]===null)this[key]=[];this[key].push(value);return this;}; /**
                 * Adds a value to a repeated field. This is an alias for {@link ProtoBuf.Builder.Message#add}.
                 * @name ProtoBuf.Builder.Message#$add
                 * @function
                 * @param {string} key Field name
                 * @param {*} value Value to add
                 * @param {boolean=} noAssert Whether to assert the value or not (asserts by default)
                 * @returns {!ProtoBuf.Builder.Message} this
                 * @throws {Error} If the value cannot be added
                 * @expose
                 */MessagePrototype.$add=MessagePrototype.add; /**
                 * Sets a field's value.
                 * @name ProtoBuf.Builder.Message#set
                 * @function
                 * @param {string|!Object.<string,*>} keyOrObj String key or plain object holding multiple values
                 * @param {(*|boolean)=} value Value to set if key is a string, otherwise omitted
                 * @param {boolean=} noAssert Whether to not assert for an actual field / proper value type, defaults to `false`
                 * @returns {!ProtoBuf.Builder.Message} this
                 * @throws {Error} If the value cannot be set
                 * @expose
                 */MessagePrototype.set=function(keyOrObj,value,noAssert){if(keyOrObj&&(typeof keyOrObj==="undefined"?"undefined":_typeof(keyOrObj))==='object'){noAssert=value;for(var ikey in keyOrObj){if(keyOrObj.hasOwnProperty(ikey)&&typeof (value=keyOrObj[ikey])!=='undefined')this.$set(ikey,value,noAssert);}return this;}var field=T._fieldsByName[keyOrObj];if(!noAssert){if(!field)throw Error(this+"#"+keyOrObj+" is not a field: undefined");if(!(field instanceof ProtoBuf.Reflect.Message.Field))throw Error(this+"#"+keyOrObj+" is not a field: "+field.toString(true));this[field.name]=value=field.verifyValue(value); // May throw
}else this[keyOrObj]=value;if(field&&field.oneof){ // Field is part of an OneOf (not a virtual OneOf field)
var currentField=this[field.oneof.name]; // Virtual field references currently set field
if(value!==null){if(currentField!==null&&currentField!==field.name)this[currentField]=null; // Clear currently set field
this[field.oneof.name]=field.name; // Point virtual field at this field
}else if( /* value === null && */currentField===keyOrObj)this[field.oneof.name]=null; // Clear virtual field (current field explicitly cleared)
}return this;}; /**
                 * Sets a field's value. This is an alias for [@link ProtoBuf.Builder.Message#set}.
                 * @name ProtoBuf.Builder.Message#$set
                 * @function
                 * @param {string|!Object.<string,*>} keyOrObj String key or plain object holding multiple values
                 * @param {(*|boolean)=} value Value to set if key is a string, otherwise omitted
                 * @param {boolean=} noAssert Whether to not assert the value, defaults to `false`
                 * @throws {Error} If the value cannot be set
                 * @expose
                 */MessagePrototype.$set=MessagePrototype.set; /**
                 * Gets a field's value.
                 * @name ProtoBuf.Builder.Message#get
                 * @function
                 * @param {string} key Key
                 * @param {boolean=} noAssert Whether to not assert for an actual field, defaults to `false`
                 * @return {*} Value
                 * @throws {Error} If there is no such field
                 * @expose
                 */MessagePrototype.get=function(key,noAssert){if(noAssert)return this[key];var field=T._fieldsByName[key];if(!field||!(field instanceof ProtoBuf.Reflect.Message.Field))throw Error(this+"#"+key+" is not a field: undefined");if(!(field instanceof ProtoBuf.Reflect.Message.Field))throw Error(this+"#"+key+" is not a field: "+field.toString(true));return this[field.name];}; /**
                 * Gets a field's value. This is an alias for {@link ProtoBuf.Builder.Message#$get}.
                 * @name ProtoBuf.Builder.Message#$get
                 * @function
                 * @param {string} key Key
                 * @return {*} Value
                 * @throws {Error} If there is no such field
                 * @expose
                 */MessagePrototype.$get=MessagePrototype.get; // Getters and setters
for(var i=0;i<fields.length;i++){var field=fields[i]; // no setters for extension fields as these are named by their fqn
if(field instanceof ProtoBuf.Reflect.Message.ExtensionField)continue;if(T.builder.options['populateAccessors'])(function(field){ // set/get[SomeValue]
var Name=field.originalName.replace(/(_[a-zA-Z])/g,function(match){return match.toUpperCase().replace('_','');});Name=Name.substring(0,1).toUpperCase()+Name.substring(1); // set/get_[some_value] FIXME: Do we really need these?
var name=field.originalName.replace(/([A-Z])/g,function(match){return "_"+match;}); /**
                             * The current field's unbound setter function.
                             * @function
                             * @param {*} value
                             * @param {boolean=} noAssert
                             * @returns {!ProtoBuf.Builder.Message}
                             * @inner
                             */var setter=function setter(value,noAssert){this[field.name]=noAssert?value:field.verifyValue(value);return this;}; /**
                             * The current field's unbound getter function.
                             * @function
                             * @returns {*}
                             * @inner
                             */var getter=function getter(){return this[field.name];};if(T.getChild("set"+Name)===null) /**
                                 * Sets a value. This method is present for each field, but only if there is no name conflict with
                                 *  another field.
                                 * @name ProtoBuf.Builder.Message#set[SomeField]
                                 * @function
                                 * @param {*} value Value to set
                                 * @param {boolean=} noAssert Whether to not assert the value, defaults to `false`
                                 * @returns {!ProtoBuf.Builder.Message} this
                                 * @abstract
                                 * @throws {Error} If the value cannot be set
                                 */MessagePrototype["set"+Name]=setter;if(T.getChild("set_"+name)===null) /**
                                 * Sets a value. This method is present for each field, but only if there is no name conflict with
                                 *  another field.
                                 * @name ProtoBuf.Builder.Message#set_[some_field]
                                 * @function
                                 * @param {*} value Value to set
                                 * @param {boolean=} noAssert Whether to not assert the value, defaults to `false`
                                 * @returns {!ProtoBuf.Builder.Message} this
                                 * @abstract
                                 * @throws {Error} If the value cannot be set
                                 */MessagePrototype["set_"+name]=setter;if(T.getChild("get"+Name)===null) /**
                                 * Gets a value. This method is present for each field, but only if there is no name conflict with
                                 *  another field.
                                 * @name ProtoBuf.Builder.Message#get[SomeField]
                                 * @function
                                 * @abstract
                                 * @return {*} The value
                                 */MessagePrototype["get"+Name]=getter;if(T.getChild("get_"+name)===null) /**
                                 * Gets a value. This method is present for each field, but only if there is no name conflict with
                                 *  another field.
                                 * @name ProtoBuf.Builder.Message#get_[some_field]
                                 * @function
                                 * @return {*} The value
                                 * @abstract
                                 */MessagePrototype["get_"+name]=getter;})(field);} // En-/decoding
/**
                 * Encodes the message.
                 * @name ProtoBuf.Builder.Message#$encode
                 * @function
                 * @param {(!ByteBuffer|boolean)=} buffer ByteBuffer to encode to. Will create a new one and flip it if omitted.
                 * @param {boolean=} noVerify Whether to not verify field values, defaults to `false`
                 * @return {!ByteBuffer} Encoded message as a ByteBuffer
                 * @throws {Error} If the message cannot be encoded or if required fields are missing. The later still
                 *  returns the encoded ByteBuffer in the `encoded` property on the error.
                 * @expose
                 * @see ProtoBuf.Builder.Message#encode64
                 * @see ProtoBuf.Builder.Message#encodeHex
                 * @see ProtoBuf.Builder.Message#encodeAB
                 */MessagePrototype.encode=function(buffer,noVerify){if(typeof buffer==='boolean')noVerify=buffer,buffer=undefined;var isNew=false;if(!buffer)buffer=new ByteBuffer(),isNew=true;var le=buffer.littleEndian;try{T.encode(this,buffer.LE(),noVerify);return (isNew?buffer.flip():buffer).LE(le);}catch(e){buffer.LE(le);throw e;}}; /**
                 * Encodes a message using the specified data payload.
                 * @param {!Object.<string,*>} data Data payload
                 * @param {(!ByteBuffer|boolean)=} buffer ByteBuffer to encode to. Will create a new one and flip it if omitted.
                 * @param {boolean=} noVerify Whether to not verify field values, defaults to `false`
                 * @return {!ByteBuffer} Encoded message as a ByteBuffer
                 * @expose
                 */Message.encode=function(data,buffer,noVerify){return new Message(data).encode(buffer,noVerify);}; /**
                 * Calculates the byte length of the message.
                 * @name ProtoBuf.Builder.Message#calculate
                 * @function
                 * @returns {number} Byte length
                 * @throws {Error} If the message cannot be calculated or if required fields are missing.
                 * @expose
                 */MessagePrototype.calculate=function(){return T.calculate(this);}; /**
                 * Encodes the varint32 length-delimited message.
                 * @name ProtoBuf.Builder.Message#encodeDelimited
                 * @function
                 * @param {(!ByteBuffer|boolean)=} buffer ByteBuffer to encode to. Will create a new one and flip it if omitted.
                 * @param {boolean=} noVerify Whether to not verify field values, defaults to `false`
                 * @return {!ByteBuffer} Encoded message as a ByteBuffer
                 * @throws {Error} If the message cannot be encoded or if required fields are missing. The later still
                 *  returns the encoded ByteBuffer in the `encoded` property on the error.
                 * @expose
                 */MessagePrototype.encodeDelimited=function(buffer,noVerify){var isNew=false;if(!buffer)buffer=new ByteBuffer(),isNew=true;var enc=new ByteBuffer().LE();T.encode(this,enc,noVerify).flip();buffer.writeVarint32(enc.remaining());buffer.append(enc);return isNew?buffer.flip():buffer;}; /**
                 * Directly encodes the message to an ArrayBuffer.
                 * @name ProtoBuf.Builder.Message#encodeAB
                 * @function
                 * @return {ArrayBuffer} Encoded message as ArrayBuffer
                 * @throws {Error} If the message cannot be encoded or if required fields are missing. The later still
                 *  returns the encoded ArrayBuffer in the `encoded` property on the error.
                 * @expose
                 */MessagePrototype.encodeAB=function(){try{return this.encode().toArrayBuffer();}catch(e){if(e["encoded"])e["encoded"]=e["encoded"].toArrayBuffer();throw e;}}; /**
                 * Returns the message as an ArrayBuffer. This is an alias for {@link ProtoBuf.Builder.Message#encodeAB}.
                 * @name ProtoBuf.Builder.Message#toArrayBuffer
                 * @function
                 * @return {ArrayBuffer} Encoded message as ArrayBuffer
                 * @throws {Error} If the message cannot be encoded or if required fields are missing. The later still
                 *  returns the encoded ArrayBuffer in the `encoded` property on the error.
                 * @expose
                 */MessagePrototype.toArrayBuffer=MessagePrototype.encodeAB; /**
                 * Directly encodes the message to a node Buffer.
                 * @name ProtoBuf.Builder.Message#encodeNB
                 * @function
                 * @return {!Buffer}
                 * @throws {Error} If the message cannot be encoded, not running under node.js or if required fields are
                 *  missing. The later still returns the encoded node Buffer in the `encoded` property on the error.
                 * @expose
                 */MessagePrototype.encodeNB=function(){try{return this.encode().toBuffer();}catch(e){if(e["encoded"])e["encoded"]=e["encoded"].toBuffer();throw e;}}; /**
                 * Returns the message as a node Buffer. This is an alias for {@link ProtoBuf.Builder.Message#encodeNB}.
                 * @name ProtoBuf.Builder.Message#toBuffer
                 * @function
                 * @return {!Buffer}
                 * @throws {Error} If the message cannot be encoded or if required fields are missing. The later still
                 *  returns the encoded node Buffer in the `encoded` property on the error.
                 * @expose
                 */MessagePrototype.toBuffer=MessagePrototype.encodeNB; /**
                 * Directly encodes the message to a base64 encoded string.
                 * @name ProtoBuf.Builder.Message#encode64
                 * @function
                 * @return {string} Base64 encoded string
                 * @throws {Error} If the underlying buffer cannot be encoded or if required fields are missing. The later
                 *  still returns the encoded base64 string in the `encoded` property on the error.
                 * @expose
                 */MessagePrototype.encode64=function(){try{return this.encode().toBase64();}catch(e){if(e["encoded"])e["encoded"]=e["encoded"].toBase64();throw e;}}; /**
                 * Returns the message as a base64 encoded string. This is an alias for {@link ProtoBuf.Builder.Message#encode64}.
                 * @name ProtoBuf.Builder.Message#toBase64
                 * @function
                 * @return {string} Base64 encoded string
                 * @throws {Error} If the message cannot be encoded or if required fields are missing. The later still
                 *  returns the encoded base64 string in the `encoded` property on the error.
                 * @expose
                 */MessagePrototype.toBase64=MessagePrototype.encode64; /**
                 * Directly encodes the message to a hex encoded string.
                 * @name ProtoBuf.Builder.Message#encodeHex
                 * @function
                 * @return {string} Hex encoded string
                 * @throws {Error} If the underlying buffer cannot be encoded or if required fields are missing. The later
                 *  still returns the encoded hex string in the `encoded` property on the error.
                 * @expose
                 */MessagePrototype.encodeHex=function(){try{return this.encode().toHex();}catch(e){if(e["encoded"])e["encoded"]=e["encoded"].toHex();throw e;}}; /**
                 * Returns the message as a hex encoded string. This is an alias for {@link ProtoBuf.Builder.Message#encodeHex}.
                 * @name ProtoBuf.Builder.Message#toHex
                 * @function
                 * @return {string} Hex encoded string
                 * @throws {Error} If the message cannot be encoded or if required fields are missing. The later still
                 *  returns the encoded hex string in the `encoded` property on the error.
                 * @expose
                 */MessagePrototype.toHex=MessagePrototype.encodeHex; /**
                 * Clones a message object or field value to a raw object.
                 * @param {*} obj Object to clone
                 * @param {boolean} binaryAsBase64 Whether to include binary data as base64 strings or as a buffer otherwise
                 * @param {boolean} longsAsStrings Whether to encode longs as strings
                 * @param {!ProtoBuf.Reflect.T=} resolvedType The resolved field type if a field
                 * @returns {*} Cloned object
                 * @inner
                 */function cloneRaw(obj,binaryAsBase64,longsAsStrings,resolvedType){if(obj===null||(typeof obj==="undefined"?"undefined":_typeof(obj))!=='object'){ // Convert enum values to their respective names
if(resolvedType&&resolvedType instanceof ProtoBuf.Reflect.Enum){var name=ProtoBuf.Reflect.Enum.getName(resolvedType.object,obj);if(name!==null)return name;} // Pass-through string, number, boolean, null...
return obj;} // Convert ByteBuffers to raw buffer or strings
if(ByteBuffer.isByteBuffer(obj))return binaryAsBase64?obj.toBase64():obj.toBuffer(); // Convert Longs to proper objects or strings
if(ProtoBuf.Long.isLong(obj))return longsAsStrings?obj.toString():ProtoBuf.Long.fromValue(obj);var clone; // Clone arrays
if(Array.isArray(obj)){clone=[];obj.forEach(function(v,k){clone[k]=cloneRaw(v,binaryAsBase64,longsAsStrings,resolvedType);});return clone;}clone={}; // Convert maps to objects
if(obj instanceof ProtoBuf.Map){var it=obj.entries();for(var e=it.next();!e.done;e=it.next()){clone[obj.keyElem.valueToString(e.value[0])]=cloneRaw(e.value[1],binaryAsBase64,longsAsStrings,obj.valueElem.resolvedType);}return clone;} // Everything else is a non-null object
var type=obj.$type,field=undefined;for(var i in obj){if(obj.hasOwnProperty(i)){if(type&&(field=type.getChild(i)))clone[i]=cloneRaw(obj[i],binaryAsBase64,longsAsStrings,field.resolvedType);else clone[i]=cloneRaw(obj[i],binaryAsBase64,longsAsStrings);}}return clone;} /**
                 * Returns the message's raw payload.
                 * @param {boolean=} binaryAsBase64 Whether to include binary data as base64 strings instead of Buffers, defaults to `false`
                 * @param {boolean} longsAsStrings Whether to encode longs as strings
                 * @returns {Object.<string,*>} Raw payload
                 * @expose
                 */MessagePrototype.toRaw=function(binaryAsBase64,longsAsStrings){return cloneRaw(this,!!binaryAsBase64,!!longsAsStrings,this.$type);}; /**
                 * Encodes a message to JSON.
                 * @returns {string} JSON string
                 * @expose
                 */MessagePrototype.encodeJSON=function(){return JSON.stringify(cloneRaw(this, /* binary-as-base64 */true, /* longs-as-strings */true,this.$type));}; /**
                 * Decodes a message from the specified buffer or string.
                 * @name ProtoBuf.Builder.Message.decode
                 * @function
                 * @param {!ByteBuffer|!ArrayBuffer|!Buffer|string} buffer Buffer to decode from
                 * @param {(number|string)=} length Message length. Defaults to decode all the remainig data.
                 * @param {string=} enc Encoding if buffer is a string: hex, utf8 (not recommended), defaults to base64
                 * @return {!ProtoBuf.Builder.Message} Decoded message
                 * @throws {Error} If the message cannot be decoded or if required fields are missing. The later still
                 *  returns the decoded message with missing fields in the `decoded` property on the error.
                 * @expose
                 * @see ProtoBuf.Builder.Message.decode64
                 * @see ProtoBuf.Builder.Message.decodeHex
                 */Message.decode=function(buffer,length,enc){if(typeof length==='string')enc=length,length=-1;if(typeof buffer==='string')buffer=ByteBuffer.wrap(buffer,enc?enc:"base64");buffer=ByteBuffer.isByteBuffer(buffer)?buffer:ByteBuffer.wrap(buffer); // May throw
var le=buffer.littleEndian;try{var msg=T.decode(buffer.LE());buffer.LE(le);return msg;}catch(e){buffer.LE(le);throw e;}}; /**
                 * Decodes a varint32 length-delimited message from the specified buffer or string.
                 * @name ProtoBuf.Builder.Message.decodeDelimited
                 * @function
                 * @param {!ByteBuffer|!ArrayBuffer|!Buffer|string} buffer Buffer to decode from
                 * @param {string=} enc Encoding if buffer is a string: hex, utf8 (not recommended), defaults to base64
                 * @return {ProtoBuf.Builder.Message} Decoded message or `null` if not enough bytes are available yet
                 * @throws {Error} If the message cannot be decoded or if required fields are missing. The later still
                 *  returns the decoded message with missing fields in the `decoded` property on the error.
                 * @expose
                 */Message.decodeDelimited=function(buffer,enc){if(typeof buffer==='string')buffer=ByteBuffer.wrap(buffer,enc?enc:"base64");buffer=ByteBuffer.isByteBuffer(buffer)?buffer:ByteBuffer.wrap(buffer); // May throw
if(buffer.remaining()<1)return null;var off=buffer.offset,len=buffer.readVarint32();if(buffer.remaining()<len){buffer.offset=off;return null;}try{var msg=T.decode(buffer.slice(buffer.offset,buffer.offset+len).LE());buffer.offset+=len;return msg;}catch(err){buffer.offset+=len;throw err;}}; /**
                 * Decodes the message from the specified base64 encoded string.
                 * @name ProtoBuf.Builder.Message.decode64
                 * @function
                 * @param {string} str String to decode from
                 * @return {!ProtoBuf.Builder.Message} Decoded message
                 * @throws {Error} If the message cannot be decoded or if required fields are missing. The later still
                 *  returns the decoded message with missing fields in the `decoded` property on the error.
                 * @expose
                 */Message.decode64=function(str){return Message.decode(str,"base64");}; /**
                 * Decodes the message from the specified hex encoded string.
                 * @name ProtoBuf.Builder.Message.decodeHex
                 * @function
                 * @param {string} str String to decode from
                 * @return {!ProtoBuf.Builder.Message} Decoded message
                 * @throws {Error} If the message cannot be decoded or if required fields are missing. The later still
                 *  returns the decoded message with missing fields in the `decoded` property on the error.
                 * @expose
                 */Message.decodeHex=function(str){return Message.decode(str,"hex");}; /**
                 * Decodes the message from a JSON string.
                 * @name ProtoBuf.Builder.Message.decodeJSON
                 * @function
                 * @param {string} str String to decode from
                 * @return {!ProtoBuf.Builder.Message} Decoded message
                 * @throws {Error} If the message cannot be decoded or if required fields are
                 * missing.
                 * @expose
                 */Message.decodeJSON=function(str){return new Message(JSON.parse(str));}; // Utility
/**
                 * Returns a string representation of this Message.
                 * @name ProtoBuf.Builder.Message#toString
                 * @function
                 * @return {string} String representation as of ".Fully.Qualified.MessageName"
                 * @expose
                 */MessagePrototype.toString=function(){return T.toString();}; // Properties
/**
                 * Message options.
                 * @name ProtoBuf.Builder.Message.$options
                 * @type {Object.<string,*>}
                 * @expose
                 */var $optionsS; // cc needs this
/**
                 * Message options.
                 * @name ProtoBuf.Builder.Message#$options
                 * @type {Object.<string,*>}
                 * @expose
                 */var $options; /**
                 * Reflection type.
                 * @name ProtoBuf.Builder.Message.$type
                 * @type {!ProtoBuf.Reflect.Message}
                 * @expose
                 */var $typeS; /**
                 * Reflection type.
                 * @name ProtoBuf.Builder.Message#$type
                 * @type {!ProtoBuf.Reflect.Message}
                 * @expose
                 */var $type;if(Object.defineProperty)Object.defineProperty(Message,'$options',{"value":T.buildOpt()}),Object.defineProperty(MessagePrototype,"$options",{"value":Message["$options"]}),Object.defineProperty(Message,"$type",{"value":T}),Object.defineProperty(MessagePrototype,"$type",{"value":T});return Message;}(ProtoBuf,this); // Static enums and prototyped sub-messages / cached collections
this._fields=[];this._fieldsById={};this._fieldsByName={};for(var i=0,k=this.children.length,child;i<k;i++){child=this.children[i];if(child instanceof Enum||child instanceof Message||child instanceof Service){if(clazz.hasOwnProperty(child.name))throw Error("Illegal reflect child of "+this.toString(true)+": "+child.toString(true)+" cannot override static property '"+child.name+"'");clazz[child.name]=child.build();}else if(child instanceof Message.Field)child.build(),this._fields.push(child),this._fieldsById[child.id]=child,this._fieldsByName[child.name]=child;else if(!(child instanceof Message.OneOf)&&!(child instanceof Extension)) // Not built
throw Error("Illegal reflect child of "+this.toString(true)+": "+this.children[i].toString(true));}return this.clazz=clazz;}; /**
         * Encodes a runtime message's contents to the specified buffer.
         * @param {!ProtoBuf.Builder.Message} message Runtime message to encode
         * @param {ByteBuffer} buffer ByteBuffer to write to
         * @param {boolean=} noVerify Whether to not verify field values, defaults to `false`
         * @return {ByteBuffer} The ByteBuffer for chaining
         * @throws {Error} If required fields are missing or the message cannot be encoded for another reason
         * @expose
         */MessagePrototype.encode=function(message,buffer,noVerify){var fieldMissing=null,field;for(var i=0,k=this._fields.length,val;i<k;++i){field=this._fields[i];val=message[field.name];if(field.required&&val===null){if(fieldMissing===null)fieldMissing=field;}else field.encode(noVerify?val:field.verifyValue(val),buffer,message);}if(fieldMissing!==null){var err=Error("Missing at least one required field for "+this.toString(true)+": "+fieldMissing);err["encoded"]=buffer; // Still expose what we got
throw err;}return buffer;}; /**
         * Calculates a runtime message's byte length.
         * @param {!ProtoBuf.Builder.Message} message Runtime message to encode
         * @returns {number} Byte length
         * @throws {Error} If required fields are missing or the message cannot be calculated for another reason
         * @expose
         */MessagePrototype.calculate=function(message){for(var n=0,i=0,k=this._fields.length,field,val;i<k;++i){field=this._fields[i];val=message[field.name];if(field.required&&val===null)throw Error("Missing at least one required field for "+this.toString(true)+": "+field);else n+=field.calculate(val,message);}return n;}; /**
         * Skips all data until the end of the specified group has been reached.
         * @param {number} expectedId Expected GROUPEND id
         * @param {!ByteBuffer} buf ByteBuffer
         * @returns {boolean} `true` if a value as been skipped, `false` if the end has been reached
         * @throws {Error} If it wasn't possible to find the end of the group (buffer overrun or end tag mismatch)
         * @inner
         */function skipTillGroupEnd(expectedId,buf){var tag=buf.readVarint32(), // Throws on OOB
wireType=tag&0x07,id=tag>>>3;switch(wireType){case ProtoBuf.WIRE_TYPES.VARINT:do {tag=buf.readUint8();}while((tag&0x80)===0x80);break;case ProtoBuf.WIRE_TYPES.BITS64:buf.offset+=8;break;case ProtoBuf.WIRE_TYPES.LDELIM:tag=buf.readVarint32(); // reads the varint
buf.offset+=tag; // skips n bytes
break;case ProtoBuf.WIRE_TYPES.STARTGROUP:skipTillGroupEnd(id,buf);break;case ProtoBuf.WIRE_TYPES.ENDGROUP:if(id===expectedId)return false;else throw Error("Illegal GROUPEND after unknown group: "+id+" ("+expectedId+" expected)");case ProtoBuf.WIRE_TYPES.BITS32:buf.offset+=4;break;default:throw Error("Illegal wire type in unknown group "+expectedId+": "+wireType);}return true;} /**
         * Decodes an encoded message and returns the decoded message.
         * @param {ByteBuffer} buffer ByteBuffer to decode from
         * @param {number=} length Message length. Defaults to decode all remaining data.
         * @param {number=} expectedGroupEndId Expected GROUPEND id if this is a legacy group
         * @return {ProtoBuf.Builder.Message} Decoded message
         * @throws {Error} If the message cannot be decoded
         * @expose
         */MessagePrototype.decode=function(buffer,length,expectedGroupEndId){length=typeof length==='number'?length:-1;var start=buffer.offset,msg=new this.clazz(),tag,wireType,id,field;while(buffer.offset<start+length||length===-1&&buffer.remaining()>0){tag=buffer.readVarint32();wireType=tag&0x07;id=tag>>>3;if(wireType===ProtoBuf.WIRE_TYPES.ENDGROUP){if(id!==expectedGroupEndId)throw Error("Illegal group end indicator for "+this.toString(true)+": "+id+" ("+(expectedGroupEndId?expectedGroupEndId+" expected":"not a group")+")");break;}if(!(field=this._fieldsById[id])){ // "messages created by your new code can be parsed by your old code: old binaries simply ignore the new field when parsing."
switch(wireType){case ProtoBuf.WIRE_TYPES.VARINT:buffer.readVarint32();break;case ProtoBuf.WIRE_TYPES.BITS32:buffer.offset+=4;break;case ProtoBuf.WIRE_TYPES.BITS64:buffer.offset+=8;break;case ProtoBuf.WIRE_TYPES.LDELIM:var len=buffer.readVarint32();buffer.offset+=len;break;case ProtoBuf.WIRE_TYPES.STARTGROUP:while(skipTillGroupEnd(id,buffer)){}break;default:throw Error("Illegal wire type for unknown field "+id+" in "+this.toString(true)+"#decode: "+wireType);}continue;}if(field.repeated&&!field.options["packed"]){msg[field.name].push(field.decode(wireType,buffer));}else if(field.map){var keyval=field.decode(wireType,buffer);msg[field.name].set(keyval[0],keyval[1]);}else {msg[field.name]=field.decode(wireType,buffer);if(field.oneof){ // Field is part of an OneOf (not a virtual OneOf field)
var currentField=msg[field.oneof.name]; // Virtual field references currently set field
if(currentField!==null&&currentField!==field.name)msg[currentField]=null; // Clear currently set field
msg[field.oneof.name]=field.name; // Point virtual field at this field
}}} // Check if all required fields are present and set default values for optional fields that are not
for(var i=0,k=this._fields.length;i<k;++i){field=this._fields[i];if(msg[field.name]===null){if(this.syntax==="proto3"){ // Proto3 sets default values by specification
msg[field.name]=field.defaultValue;}else if(field.required){var err=Error("Missing at least one required field for "+this.toString(true)+": "+field.name);err["decoded"]=msg; // Still expose what we got
throw err;}else if(ProtoBuf.populateDefaults&&field.defaultValue!==null)msg[field.name]=field.defaultValue;}}return msg;}; /**
         * @alias ProtoBuf.Reflect.Message
         * @expose
         */Reflect.Message=Message; /**
         * Constructs a new Message Field.
         * @exports ProtoBuf.Reflect.Message.Field
         * @param {!ProtoBuf.Builder} builder Builder reference
         * @param {!ProtoBuf.Reflect.Message} message Message reference
         * @param {string} rule Rule, one of requried, optional, repeated
         * @param {string?} keytype Key data type, if any.
         * @param {string} type Data type, e.g. int32
         * @param {string} name Field name
         * @param {number} id Unique field id
         * @param {Object.<string,*>=} options Options
         * @param {!ProtoBuf.Reflect.Message.OneOf=} oneof Enclosing OneOf
         * @param {string?} syntax The syntax level of this definition (e.g., proto3)
         * @constructor
         * @extends ProtoBuf.Reflect.T
         */var Field=function Field(builder,message,rule,keytype,type,name,id,options,oneof,syntax){T.call(this,builder,message,name); /**
             * @override
             */this.className="Message.Field"; /**
             * Message field required flag.
             * @type {boolean}
             * @expose
             */this.required=rule==="required"; /**
             * Message field repeated flag.
             * @type {boolean}
             * @expose
             */this.repeated=rule==="repeated"; /**
             * Message field map flag.
             * @type {boolean}
             * @expose
             */this.map=rule==="map"; /**
             * Message field key type. Type reference string if unresolved, protobuf
             * type if resolved. Valid only if this.map === true, null otherwise.
             * @type {string|{name: string, wireType: number}|null}
             * @expose
             */this.keyType=keytype||null; /**
             * Message field type. Type reference string if unresolved, protobuf type if
             * resolved. In a map field, this is the value type.
             * @type {string|{name: string, wireType: number}}
             * @expose
             */this.type=type; /**
             * Resolved type reference inside the global namespace.
             * @type {ProtoBuf.Reflect.T|null}
             * @expose
             */this.resolvedType=null; /**
             * Unique message field id.
             * @type {number}
             * @expose
             */this.id=id; /**
             * Message field options.
             * @type {!Object.<string,*>}
             * @dict
             * @expose
             */this.options=options||{}; /**
             * Default value.
             * @type {*}
             * @expose
             */this.defaultValue=null; /**
             * Enclosing OneOf.
             * @type {?ProtoBuf.Reflect.Message.OneOf}
             * @expose
             */this.oneof=oneof||null; /**
             * Syntax level of this definition (e.g., proto3).
             * @type {string}
             * @expose
             */this.syntax=syntax||'proto2'; /**
             * Original field name.
             * @type {string}
             * @expose
             */this.originalName=this.name; // Used to revert camelcase transformation on naming collisions
/**
             * Element implementation. Created in build() after types are resolved.
             * @type {ProtoBuf.Element}
             * @expose
             */this.element=null; /**
             * Key element implementation, for map fields. Created in build() after
             * types are resolved.
             * @type {ProtoBuf.Element}
             * @expose
             */this.keyElement=null; // Convert field names to camel case notation if the override is set
if(this.builder.options['convertFieldsToCamelCase']&&!(this instanceof Message.ExtensionField))this.name=ProtoBuf.Util.toCamelCase(this.name);}; /**
         * @alias ProtoBuf.Reflect.Message.Field.prototype
         * @inner
         */var FieldPrototype=Field.prototype=Object.create(T.prototype); /**
         * Builds the field.
         * @override
         * @expose
         */FieldPrototype.build=function(){this.element=new Element(this.type,this.resolvedType,false,this.syntax);if(this.map)this.keyElement=new Element(this.keyType,undefined,true,this.syntax); // In proto3, fields do not have field presence, and every field is set to
// its type's default value ("", 0, 0.0, or false).
if(this.syntax==='proto3'&&!this.repeated&&!this.map)this.defaultValue=Element.defaultFieldValue(this.type); // Otherwise, default values are present when explicitly specified
else if(typeof this.options['default']!=='undefined')this.defaultValue=this.verifyValue(this.options['default']);}; /**
         * Checks if the given value can be set for this field.
         * @param {*} value Value to check
         * @param {boolean=} skipRepeated Whether to skip the repeated value check or not. Defaults to false.
         * @return {*} Verified, maybe adjusted, value
         * @throws {Error} If the value cannot be set for this field
         * @expose
         */FieldPrototype.verifyValue=function(value,skipRepeated){skipRepeated=skipRepeated||false;var self=this;function fail(val,msg){throw Error("Illegal value for "+self.toString(true)+" of type "+self.type.name+": "+val+" ("+msg+")");}if(value===null){ // NULL values for optional fields
if(this.required)fail(typeof value==="undefined"?"undefined":_typeof(value),"required");if(this.syntax==='proto3'&&this.type!==ProtoBuf.TYPES["message"])fail(typeof value==="undefined"?"undefined":_typeof(value),"proto3 field without field presence cannot be null");return null;}var i;if(this.repeated&&!skipRepeated){ // Repeated values as arrays
if(!Array.isArray(value))value=[value];var res=[];for(i=0;i<value.length;i++){res.push(this.element.verifyValue(value[i]));}return res;}if(this.map&&!skipRepeated){ // Map values as objects
if(!(value instanceof ProtoBuf.Map)){ // If not already a Map, attempt to convert.
if(!(value instanceof Object)){fail(typeof value==="undefined"?"undefined":_typeof(value),"expected ProtoBuf.Map or raw object for map field");}return new ProtoBuf.Map(this,value);}else {return value;}} // All non-repeated fields expect no array
if(!this.repeated&&Array.isArray(value))fail(typeof value==="undefined"?"undefined":_typeof(value),"no array expected");return this.element.verifyValue(value);}; /**
         * Determines whether the field will have a presence on the wire given its
         * value.
         * @param {*} value Verified field value
         * @param {!ProtoBuf.Builder.Message} message Runtime message
         * @return {boolean} Whether the field will be present on the wire
         */FieldPrototype.hasWirePresence=function(value,message){if(this.syntax!=='proto3')return value!==null;if(this.oneof&&message[this.oneof.name]===this.name)return true;switch(this.type){case ProtoBuf.TYPES["int32"]:case ProtoBuf.TYPES["sint32"]:case ProtoBuf.TYPES["sfixed32"]:case ProtoBuf.TYPES["uint32"]:case ProtoBuf.TYPES["fixed32"]:return value!==0;case ProtoBuf.TYPES["int64"]:case ProtoBuf.TYPES["sint64"]:case ProtoBuf.TYPES["sfixed64"]:case ProtoBuf.TYPES["uint64"]:case ProtoBuf.TYPES["fixed64"]:return value.low!==0||value.high!==0;case ProtoBuf.TYPES["bool"]:return value;case ProtoBuf.TYPES["float"]:case ProtoBuf.TYPES["double"]:return value!==0.0;case ProtoBuf.TYPES["string"]:return value.length>0;case ProtoBuf.TYPES["bytes"]:return value.remaining()>0;case ProtoBuf.TYPES["enum"]:return value!==0;case ProtoBuf.TYPES["message"]:return value!==null;default:return true;}}; /**
         * Encodes the specified field value to the specified buffer.
         * @param {*} value Verified field value
         * @param {ByteBuffer} buffer ByteBuffer to encode to
         * @param {!ProtoBuf.Builder.Message} message Runtime message
         * @return {ByteBuffer} The ByteBuffer for chaining
         * @throws {Error} If the field cannot be encoded
         * @expose
         */FieldPrototype.encode=function(value,buffer,message){if(this.type===null||_typeof(this.type)!=='object')throw Error("[INTERNAL] Unresolved type in "+this.toString(true)+": "+this.type);if(value===null||this.repeated&&value.length==0)return buffer; // Optional omitted
try{if(this.repeated){var i; // "Only repeated fields of primitive numeric types (types which use the varint, 32-bit, or 64-bit wire
// types) can be declared 'packed'."
if(this.options["packed"]&&ProtoBuf.PACKABLE_WIRE_TYPES.indexOf(this.type.wireType)>=0){ // "All of the elements of the field are packed into a single key-value pair with wire type 2
// (length-delimited). Each element is encoded the same way it would be normally, except without a
// tag preceding it."
buffer.writeVarint32(this.id<<3|ProtoBuf.WIRE_TYPES.LDELIM);buffer.ensureCapacity(buffer.offset+=1); // We do not know the length yet, so let's assume a varint of length 1
var start=buffer.offset; // Remember where the contents begin
for(i=0;i<value.length;i++){this.element.encodeValue(this.id,value[i],buffer);}var len=buffer.offset-start,varintLen=ByteBuffer.calculateVarint32(len);if(varintLen>1){ // We need to move the contents
var contents=buffer.slice(start,buffer.offset);start+=varintLen-1;buffer.offset=start;buffer.append(contents);}buffer.writeVarint32(len,start-varintLen);}else { // "If your message definition has repeated elements (without the [packed=true] option), the encoded
// message has zero or more key-value pairs with the same tag number"
for(i=0;i<value.length;i++){buffer.writeVarint32(this.id<<3|this.type.wireType),this.element.encodeValue(this.id,value[i],buffer);}}}else if(this.map){ // Write out each map entry as a submessage.
value.forEach(function(val,key,m){ // Compute the length of the submessage (key, val) pair.
var length=ByteBuffer.calculateVarint32(1<<3|this.keyType.wireType)+this.keyElement.calculateLength(1,key)+ByteBuffer.calculateVarint32(2<<3|this.type.wireType)+this.element.calculateLength(2,val); // Submessage with wire type of length-delimited.
buffer.writeVarint32(this.id<<3|ProtoBuf.WIRE_TYPES.LDELIM);buffer.writeVarint32(length); // Write out the key and val.
buffer.writeVarint32(1<<3|this.keyType.wireType);this.keyElement.encodeValue(1,key,buffer);buffer.writeVarint32(2<<3|this.type.wireType);this.element.encodeValue(2,val,buffer);},this);}else {if(this.hasWirePresence(value,message)){buffer.writeVarint32(this.id<<3|this.type.wireType);this.element.encodeValue(this.id,value,buffer);}}}catch(e){throw Error("Illegal value for "+this.toString(true)+": "+value+" ("+e+")");}return buffer;}; /**
         * Calculates the length of this field's value on the network level.
         * @param {*} value Field value
         * @param {!ProtoBuf.Builder.Message} message Runtime message
         * @returns {number} Byte length
         * @expose
         */FieldPrototype.calculate=function(value,message){value=this.verifyValue(value); // May throw
if(this.type===null||_typeof(this.type)!=='object')throw Error("[INTERNAL] Unresolved type in "+this.toString(true)+": "+this.type);if(value===null||this.repeated&&value.length==0)return 0; // Optional omitted
var n=0;try{if(this.repeated){var i,ni;if(this.options["packed"]&&ProtoBuf.PACKABLE_WIRE_TYPES.indexOf(this.type.wireType)>=0){n+=ByteBuffer.calculateVarint32(this.id<<3|ProtoBuf.WIRE_TYPES.LDELIM);ni=0;for(i=0;i<value.length;i++){ni+=this.element.calculateLength(this.id,value[i]);}n+=ByteBuffer.calculateVarint32(ni);n+=ni;}else {for(i=0;i<value.length;i++){n+=ByteBuffer.calculateVarint32(this.id<<3|this.type.wireType),n+=this.element.calculateLength(this.id,value[i]);}}}else if(this.map){ // Each map entry becomes a submessage.
value.forEach(function(val,key,m){ // Compute the length of the submessage (key, val) pair.
var length=ByteBuffer.calculateVarint32(1<<3|this.keyType.wireType)+this.keyElement.calculateLength(1,key)+ByteBuffer.calculateVarint32(2<<3|this.type.wireType)+this.element.calculateLength(2,val);n+=ByteBuffer.calculateVarint32(this.id<<3|ProtoBuf.WIRE_TYPES.LDELIM);n+=ByteBuffer.calculateVarint32(length);n+=length;},this);}else {if(this.hasWirePresence(value,message)){n+=ByteBuffer.calculateVarint32(this.id<<3|this.type.wireType);n+=this.element.calculateLength(this.id,value);}}}catch(e){throw Error("Illegal value for "+this.toString(true)+": "+value+" ("+e+")");}return n;}; /**
         * Decode the field value from the specified buffer.
         * @param {number} wireType Leading wire type
         * @param {ByteBuffer} buffer ByteBuffer to decode from
         * @param {boolean=} skipRepeated Whether to skip the repeated check or not. Defaults to false.
         * @return {*} Decoded value: array for packed repeated fields, [key, value] for
         *             map fields, or an individual value otherwise.
         * @throws {Error} If the field cannot be decoded
         * @expose
         */FieldPrototype.decode=function(wireType,buffer,skipRepeated){var value,nBytes; // We expect wireType to match the underlying type's wireType unless we see
// a packed repeated field, or unless this is a map field.
var wireTypeOK=!this.map&&wireType==this.type.wireType||!skipRepeated&&this.repeated&&this.options["packed"]&&wireType==ProtoBuf.WIRE_TYPES.LDELIM||this.map&&wireType==ProtoBuf.WIRE_TYPES.LDELIM;if(!wireTypeOK)throw Error("Illegal wire type for field "+this.toString(true)+": "+wireType+" ("+this.type.wireType+" expected)"); // Handle packed repeated fields.
if(wireType==ProtoBuf.WIRE_TYPES.LDELIM&&this.repeated&&this.options["packed"]&&ProtoBuf.PACKABLE_WIRE_TYPES.indexOf(this.type.wireType)>=0){if(!skipRepeated){nBytes=buffer.readVarint32();nBytes=buffer.offset+nBytes; // Limit
var values=[];while(buffer.offset<nBytes){values.push(this.decode(this.type.wireType,buffer,true));}return values;} // Read the next value otherwise...
} // Handle maps.
if(this.map){ // Read one (key, value) submessage, and return [key, value]
var key=Element.defaultFieldValue(this.keyType);value=Element.defaultFieldValue(this.type); // Read the length
nBytes=buffer.readVarint32();if(buffer.remaining()<nBytes)throw Error("Illegal number of bytes for "+this.toString(true)+": "+nBytes+" required but got only "+buffer.remaining()); // Get a sub-buffer of this key/value submessage
var msgbuf=buffer.clone();msgbuf.limit=msgbuf.offset+nBytes;buffer.offset+=nBytes;while(msgbuf.remaining()>0){var tag=msgbuf.readVarint32();wireType=tag&0x07;var id=tag>>>3;if(id===1){key=this.keyElement.decode(msgbuf,wireType,id);}else if(id===2){value=this.element.decode(msgbuf,wireType,id);}else {throw Error("Unexpected tag in map field key/value submessage");}}return [key,value];} // Handle singular and non-packed repeated field values.
return this.element.decode(buffer,wireType,this.id);}; /**
         * @alias ProtoBuf.Reflect.Message.Field
         * @expose
         */Reflect.Message.Field=Field; /**
         * Constructs a new Message ExtensionField.
         * @exports ProtoBuf.Reflect.Message.ExtensionField
         * @param {!ProtoBuf.Builder} builder Builder reference
         * @param {!ProtoBuf.Reflect.Message} message Message reference
         * @param {string} rule Rule, one of requried, optional, repeated
         * @param {string} type Data type, e.g. int32
         * @param {string} name Field name
         * @param {number} id Unique field id
         * @param {!Object.<string,*>=} options Options
         * @constructor
         * @extends ProtoBuf.Reflect.Message.Field
         */var ExtensionField=function ExtensionField(builder,message,rule,type,name,id,options){Field.call(this,builder,message,rule, /* keytype = */null,type,name,id,options); /**
             * Extension reference.
             * @type {!ProtoBuf.Reflect.Extension}
             * @expose
             */this.extension;}; // Extends Field
ExtensionField.prototype=Object.create(Field.prototype); /**
         * @alias ProtoBuf.Reflect.Message.ExtensionField
         * @expose
         */Reflect.Message.ExtensionField=ExtensionField; /**
         * Constructs a new Message OneOf.
         * @exports ProtoBuf.Reflect.Message.OneOf
         * @param {!ProtoBuf.Builder} builder Builder reference
         * @param {!ProtoBuf.Reflect.Message} message Message reference
         * @param {string} name OneOf name
         * @constructor
         * @extends ProtoBuf.Reflect.T
         */var OneOf=function OneOf(builder,message,name){T.call(this,builder,message,name); /**
             * Enclosed fields.
             * @type {!Array.<!ProtoBuf.Reflect.Message.Field>}
             * @expose
             */this.fields=[];}; /**
         * @alias ProtoBuf.Reflect.Message.OneOf
         * @expose
         */Reflect.Message.OneOf=OneOf; /**
         * Constructs a new Enum.
         * @exports ProtoBuf.Reflect.Enum
         * @param {!ProtoBuf.Builder} builder Builder reference
         * @param {!ProtoBuf.Reflect.T} parent Parent Reflect object
         * @param {string} name Enum name
         * @param {Object.<string,*>=} options Enum options
         * @param {string?} syntax The syntax level (e.g., proto3)
         * @constructor
         * @extends ProtoBuf.Reflect.Namespace
         */var Enum=function Enum(builder,parent,name,options,syntax){Namespace.call(this,builder,parent,name,options,syntax); /**
             * @override
             */this.className="Enum"; /**
             * Runtime enum object.
             * @type {Object.<string,number>|null}
             * @expose
             */this.object=null;}; /**
         * Gets the string name of an enum value.
         * @param {!ProtoBuf.Builder.Enum} enm Runtime enum
         * @param {number} value Enum value
         * @returns {?string} Name or `null` if not present
         * @expose
         */Enum.getName=function(enm,value){var keys=Object.keys(enm);for(var i=0,key;i<keys.length;++i){if(enm[key=keys[i]]===value)return key;}return null;}; /**
         * @alias ProtoBuf.Reflect.Enum.prototype
         * @inner
         */var EnumPrototype=Enum.prototype=Object.create(Namespace.prototype); /**
         * Builds this enum and returns the runtime counterpart.
         * @param {boolean} rebuild Whether to rebuild or not, defaults to false
         * @returns {!Object.<string,number>}
         * @expose
         */EnumPrototype.build=function(rebuild){if(this.object&&!rebuild)return this.object;var enm=new ProtoBuf.Builder.Enum(),values=this.getChildren(Enum.Value);for(var i=0,k=values.length;i<k;++i){enm[values[i]['name']]=values[i]['id'];}if(Object.defineProperty)Object.defineProperty(enm,'$options',{"value":this.buildOpt(),"enumerable":false});return this.object=enm;}; /**
         * @alias ProtoBuf.Reflect.Enum
         * @expose
         */Reflect.Enum=Enum; /**
         * Constructs a new Enum Value.
         * @exports ProtoBuf.Reflect.Enum.Value
         * @param {!ProtoBuf.Builder} builder Builder reference
         * @param {!ProtoBuf.Reflect.Enum} enm Enum reference
         * @param {string} name Field name
         * @param {number} id Unique field id
         * @constructor
         * @extends ProtoBuf.Reflect.T
         */var Value=function Value(builder,enm,name,id){T.call(this,builder,enm,name); /**
             * @override
             */this.className="Enum.Value"; /**
             * Unique enum value id.
             * @type {number}
             * @expose
             */this.id=id;}; // Extends T
Value.prototype=Object.create(T.prototype); /**
         * @alias ProtoBuf.Reflect.Enum.Value
         * @expose
         */Reflect.Enum.Value=Value; /**
         * An extension (field).
         * @exports ProtoBuf.Reflect.Extension
         * @constructor
         * @param {!ProtoBuf.Builder} builder Builder reference
         * @param {!ProtoBuf.Reflect.T} parent Parent object
         * @param {string} name Object name
         * @param {!ProtoBuf.Reflect.Message.Field} field Extension field
         */var Extension=function Extension(builder,parent,name,field){T.call(this,builder,parent,name); /**
             * Extended message field.
             * @type {!ProtoBuf.Reflect.Message.Field}
             * @expose
             */this.field=field;}; // Extends T
Extension.prototype=Object.create(T.prototype); /**
         * @alias ProtoBuf.Reflect.Extension
         * @expose
         */Reflect.Extension=Extension; /**
         * Constructs a new Service.
         * @exports ProtoBuf.Reflect.Service
         * @param {!ProtoBuf.Builder} builder Builder reference
         * @param {!ProtoBuf.Reflect.Namespace} root Root
         * @param {string} name Service name
         * @param {Object.<string,*>=} options Options
         * @constructor
         * @extends ProtoBuf.Reflect.Namespace
         */var Service=function Service(builder,root,name,options){Namespace.call(this,builder,root,name,options); /**
             * @override
             */this.className="Service"; /**
             * Built runtime service class.
             * @type {?function(new:ProtoBuf.Builder.Service)}
             */this.clazz=null;}; /**
         * @alias ProtoBuf.Reflect.Service.prototype
         * @inner
         */var ServicePrototype=Service.prototype=Object.create(Namespace.prototype); /**
         * Builds the service and returns the runtime counterpart, which is a fully functional class.
         * @see ProtoBuf.Builder.Service
         * @param {boolean=} rebuild Whether to rebuild or not
         * @return {Function} Service class
         * @throws {Error} If the message cannot be built
         * @expose
         */ServicePrototype.build=function(rebuild){if(this.clazz&&!rebuild)return this.clazz; // Create the runtime Service class in its own scope
return this.clazz=function(ProtoBuf,T){ /**
                 * Constructs a new runtime Service.
                 * @name ProtoBuf.Builder.Service
                 * @param {function(string, ProtoBuf.Builder.Message, function(Error, ProtoBuf.Builder.Message=))=} rpcImpl RPC implementation receiving the method name and the message
                 * @class Barebone of all runtime services.
                 * @constructor
                 * @throws {Error} If the service cannot be created
                 */var Service=function Service(rpcImpl){ProtoBuf.Builder.Service.call(this); /**
                     * Service implementation.
                     * @name ProtoBuf.Builder.Service#rpcImpl
                     * @type {!function(string, ProtoBuf.Builder.Message, function(Error, ProtoBuf.Builder.Message=))}
                     * @expose
                     */this.rpcImpl=rpcImpl||function(name,msg,callback){ // This is what a user has to implement: A function receiving the method name, the actual message to
// send (type checked) and the callback that's either provided with the error as its first
// argument or null and the actual response message.
setTimeout(callback.bind(this,Error("Not implemented, see: https://github.com/dcodeIO/ProtoBuf.js/wiki/Services")),0); // Must be async!
};}; /**
                 * @alias ProtoBuf.Builder.Service.prototype
                 * @inner
                 */var ServicePrototype=Service.prototype=Object.create(ProtoBuf.Builder.Service.prototype); /**
                 * Asynchronously performs an RPC call using the given RPC implementation.
                 * @name ProtoBuf.Builder.Service.[Method]
                 * @function
                 * @param {!function(string, ProtoBuf.Builder.Message, function(Error, ProtoBuf.Builder.Message=))} rpcImpl RPC implementation
                 * @param {ProtoBuf.Builder.Message} req Request
                 * @param {function(Error, (ProtoBuf.Builder.Message|ByteBuffer|Buffer|string)=)} callback Callback receiving
                 *  the error if any and the response either as a pre-parsed message or as its raw bytes
                 * @abstract
                 */ /**
                 * Asynchronously performs an RPC call using the instance's RPC implementation.
                 * @name ProtoBuf.Builder.Service#[Method]
                 * @function
                 * @param {ProtoBuf.Builder.Message} req Request
                 * @param {function(Error, (ProtoBuf.Builder.Message|ByteBuffer|Buffer|string)=)} callback Callback receiving
                 *  the error if any and the response either as a pre-parsed message or as its raw bytes
                 * @abstract
                 */var rpc=T.getChildren(ProtoBuf.Reflect.Service.RPCMethod);for(var i=0;i<rpc.length;i++){(function(method){ // service#Method(message, callback)
ServicePrototype[method.name]=function(req,callback){try{try{ // If given as a buffer, decode the request. Will throw a TypeError if not a valid buffer.
req=method.resolvedRequestType.clazz.decode(ByteBuffer.wrap(req));}catch(err){if(!(err instanceof TypeError))throw err;}if(req===null||(typeof req==="undefined"?"undefined":_typeof(req))!=='object')throw Error("Illegal arguments");if(!(req instanceof method.resolvedRequestType.clazz))req=new method.resolvedRequestType.clazz(req);this.rpcImpl(method.fqn(),req,function(err,res){ // Assumes that this is properly async
if(err){callback(err);return;} // Coalesce to empty string when service response has empty content
if(res===null)res='';try{res=method.resolvedResponseType.clazz.decode(res);}catch(notABuffer){}if(!res||!(res instanceof method.resolvedResponseType.clazz)){callback(Error("Illegal response type received in service method "+T.name+"#"+method.name));return;}callback(null,res);});}catch(err){setTimeout(callback.bind(this,err),0);}}; // Service.Method(rpcImpl, message, callback)
Service[method.name]=function(rpcImpl,req,callback){new Service(rpcImpl)[method.name](req,callback);};if(Object.defineProperty)Object.defineProperty(Service[method.name],"$options",{"value":method.buildOpt()}),Object.defineProperty(ServicePrototype[method.name],"$options",{"value":Service[method.name]["$options"]});})(rpc[i]);} // Properties
/**
                 * Service options.
                 * @name ProtoBuf.Builder.Service.$options
                 * @type {Object.<string,*>}
                 * @expose
                 */var $optionsS; // cc needs this
/**
                 * Service options.
                 * @name ProtoBuf.Builder.Service#$options
                 * @type {Object.<string,*>}
                 * @expose
                 */var $options; /**
                 * Reflection type.
                 * @name ProtoBuf.Builder.Service.$type
                 * @type {!ProtoBuf.Reflect.Service}
                 * @expose
                 */var $typeS; /**
                 * Reflection type.
                 * @name ProtoBuf.Builder.Service#$type
                 * @type {!ProtoBuf.Reflect.Service}
                 * @expose
                 */var $type;if(Object.defineProperty)Object.defineProperty(Service,"$options",{"value":T.buildOpt()}),Object.defineProperty(ServicePrototype,"$options",{"value":Service["$options"]}),Object.defineProperty(Service,"$type",{"value":T}),Object.defineProperty(ServicePrototype,"$type",{"value":T});return Service;}(ProtoBuf,this);}; /**
         * @alias ProtoBuf.Reflect.Service
         * @expose
         */Reflect.Service=Service; /**
         * Abstract service method.
         * @exports ProtoBuf.Reflect.Service.Method
         * @param {!ProtoBuf.Builder} builder Builder reference
         * @param {!ProtoBuf.Reflect.Service} svc Service
         * @param {string} name Method name
         * @param {Object.<string,*>=} options Options
         * @constructor
         * @extends ProtoBuf.Reflect.T
         */var Method=function Method(builder,svc,name,options){T.call(this,builder,svc,name); /**
             * @override
             */this.className="Service.Method"; /**
             * Options.
             * @type {Object.<string, *>}
             * @expose
             */this.options=options||{};}; /**
         * @alias ProtoBuf.Reflect.Service.Method.prototype
         * @inner
         */var MethodPrototype=Method.prototype=Object.create(T.prototype); /**
         * Builds the method's '$options' property.
         * @name ProtoBuf.Reflect.Service.Method#buildOpt
         * @function
         * @return {Object.<string,*>}
         */MethodPrototype.buildOpt=NamespacePrototype.buildOpt; /**
         * @alias ProtoBuf.Reflect.Service.Method
         * @expose
         */Reflect.Service.Method=Method; /**
         * RPC service method.
         * @exports ProtoBuf.Reflect.Service.RPCMethod
         * @param {!ProtoBuf.Builder} builder Builder reference
         * @param {!ProtoBuf.Reflect.Service} svc Service
         * @param {string} name Method name
         * @param {string} request Request message name
         * @param {string} response Response message name
         * @param {boolean} request_stream Whether requests are streamed
         * @param {boolean} response_stream Whether responses are streamed
         * @param {Object.<string,*>=} options Options
         * @constructor
         * @extends ProtoBuf.Reflect.Service.Method
         */var RPCMethod=function RPCMethod(builder,svc,name,request,response,request_stream,response_stream,options){Method.call(this,builder,svc,name,options); /**
             * @override
             */this.className="Service.RPCMethod"; /**
             * Request message name.
             * @type {string}
             * @expose
             */this.requestName=request; /**
             * Response message name.
             * @type {string}
             * @expose
             */this.responseName=response; /**
             * Whether requests are streamed
             * @type {bool}
             * @expose
             */this.requestStream=request_stream; /**
             * Whether responses are streamed
             * @type {bool}
             * @expose
             */this.responseStream=response_stream; /**
             * Resolved request message type.
             * @type {ProtoBuf.Reflect.Message}
             * @expose
             */this.resolvedRequestType=null; /**
             * Resolved response message type.
             * @type {ProtoBuf.Reflect.Message}
             * @expose
             */this.resolvedResponseType=null;}; // Extends Method
RPCMethod.prototype=Object.create(Method.prototype); /**
         * @alias ProtoBuf.Reflect.Service.RPCMethod
         * @expose
         */Reflect.Service.RPCMethod=RPCMethod;return Reflect;}(ProtoBuf); /**
     * @alias ProtoBuf.Builder
     * @expose
     */ProtoBuf.Builder=function(ProtoBuf,Lang,Reflect){"use strict"; /**
         * Constructs a new Builder.
         * @exports ProtoBuf.Builder
         * @class Provides the functionality to build protocol messages.
         * @param {Object.<string,*>=} options Options
         * @constructor
         */var Builder=function Builder(options){ /**
             * Namespace.
             * @type {ProtoBuf.Reflect.Namespace}
             * @expose
             */this.ns=new Reflect.Namespace(this,null,""); // Global namespace
/**
             * Namespace pointer.
             * @type {ProtoBuf.Reflect.T}
             * @expose
             */this.ptr=this.ns; /**
             * Resolved flag.
             * @type {boolean}
             * @expose
             */this.resolved=false; /**
             * The current building result.
             * @type {Object.<string,ProtoBuf.Builder.Message|Object>|null}
             * @expose
             */this.result=null; /**
             * Imported files.
             * @type {Array.<string>}
             * @expose
             */this.files={}; /**
             * Import root override.
             * @type {?string}
             * @expose
             */this.importRoot=null; /**
             * Options.
             * @type {!Object.<string, *>}
             * @expose
             */this.options=options||{};}; /**
         * @alias ProtoBuf.Builder.prototype
         * @inner
         */var BuilderPrototype=Builder.prototype; // ----- Definition tests -----
/**
         * Tests if a definition most likely describes a message.
         * @param {!Object} def
         * @returns {boolean}
         * @expose
         */Builder.isMessage=function(def){ // Messages require a string name
if(typeof def["name"]!=='string')return false; // Messages do not contain values (enum) or rpc methods (service)
if(typeof def["values"]!=='undefined'||typeof def["rpc"]!=='undefined')return false;return true;}; /**
         * Tests if a definition most likely describes a message field.
         * @param {!Object} def
         * @returns {boolean}
         * @expose
         */Builder.isMessageField=function(def){ // Message fields require a string rule, name and type and an id
if(typeof def["rule"]!=='string'||typeof def["name"]!=='string'||typeof def["type"]!=='string'||typeof def["id"]==='undefined')return false;return true;}; /**
         * Tests if a definition most likely describes an enum.
         * @param {!Object} def
         * @returns {boolean}
         * @expose
         */Builder.isEnum=function(def){ // Enums require a string name
if(typeof def["name"]!=='string')return false; // Enums require at least one value
if(typeof def["values"]==='undefined'||!Array.isArray(def["values"])||def["values"].length===0)return false;return true;}; /**
         * Tests if a definition most likely describes a service.
         * @param {!Object} def
         * @returns {boolean}
         * @expose
         */Builder.isService=function(def){ // Services require a string name and an rpc object
if(typeof def["name"]!=='string'||_typeof(def["rpc"])!=='object'||!def["rpc"])return false;return true;}; /**
         * Tests if a definition most likely describes an extended message
         * @param {!Object} def
         * @returns {boolean}
         * @expose
         */Builder.isExtend=function(def){ // Extends rquire a string ref
if(typeof def["ref"]!=='string')return false;return true;}; // ----- Building -----
/**
         * Resets the pointer to the root namespace.
         * @returns {!ProtoBuf.Builder} this
         * @expose
         */BuilderPrototype.reset=function(){this.ptr=this.ns;return this;}; /**
         * Defines a namespace on top of the current pointer position and places the pointer on it.
         * @param {string} namespace
         * @return {!ProtoBuf.Builder} this
         * @expose
         */BuilderPrototype.define=function(namespace){if(typeof namespace!=='string'||!Lang.TYPEREF.test(namespace))throw Error("illegal namespace: "+namespace);namespace.split(".").forEach(function(part){var ns=this.ptr.getChild(part);if(ns===null) // Keep existing
this.ptr.addChild(ns=new Reflect.Namespace(this,this.ptr,part));this.ptr=ns;},this);return this;}; /**
         * Creates the specified definitions at the current pointer position.
         * @param {!Array.<!Object>} defs Messages, enums or services to create
         * @returns {!ProtoBuf.Builder} this
         * @throws {Error} If a message definition is invalid
         * @expose
         */BuilderPrototype.create=function(defs){if(!defs)return this; // Nothing to create
if(!Array.isArray(defs))defs=[defs];else {if(defs.length===0)return this;defs=defs.slice();} // It's quite hard to keep track of scopes and memory here, so let's do this iteratively.
var stack=[defs];while(stack.length>0){defs=stack.pop();if(!Array.isArray(defs)) // Stack always contains entire namespaces
throw Error("not a valid namespace: "+JSON.stringify(defs));while(defs.length>0){var def=defs.shift(); // Namespaces always contain an array of messages, enums and services
if(Builder.isMessage(def)){var obj=new Reflect.Message(this,this.ptr,def["name"],def["options"],def["isGroup"],def["syntax"]); // Create OneOfs
var oneofs={};if(def["oneofs"])Object.keys(def["oneofs"]).forEach(function(name){obj.addChild(oneofs[name]=new Reflect.Message.OneOf(this,obj,name));},this); // Create fields
if(def["fields"])def["fields"].forEach(function(fld){if(obj.getChild(fld["id"]|0)!==null)throw Error("duplicate or invalid field id in "+obj.name+": "+fld['id']);if(fld["options"]&&_typeof(fld["options"])!=='object')throw Error("illegal field options in "+obj.name+"#"+fld["name"]);var oneof=null;if(typeof fld["oneof"]==='string'&&!(oneof=oneofs[fld["oneof"]]))throw Error("illegal oneof in "+obj.name+"#"+fld["name"]+": "+fld["oneof"]);fld=new Reflect.Message.Field(this,obj,fld["rule"],fld["keytype"],fld["type"],fld["name"],fld["id"],fld["options"],oneof,def["syntax"]);if(oneof)oneof.fields.push(fld);obj.addChild(fld);},this); // Push children to stack
var subObj=[];if(def["enums"])def["enums"].forEach(function(enm){subObj.push(enm);});if(def["messages"])def["messages"].forEach(function(msg){subObj.push(msg);});if(def["services"])def["services"].forEach(function(svc){subObj.push(svc);}); // Set extension ranges
if(def["extensions"]){if(typeof def["extensions"][0]==='number') // pre 5.0.1
obj.extensions=[def["extensions"]];else obj.extensions=def["extensions"];} // Create on top of current namespace
this.ptr.addChild(obj);if(subObj.length>0){stack.push(defs); // Push the current level back
defs=subObj; // Continue processing sub level
subObj=null;this.ptr=obj; // And move the pointer to this namespace
obj=null;continue;}subObj=null;}else if(Builder.isEnum(def)){obj=new Reflect.Enum(this,this.ptr,def["name"],def["options"],def["syntax"]);def["values"].forEach(function(val){obj.addChild(new Reflect.Enum.Value(this,obj,val["name"],val["id"]));},this);this.ptr.addChild(obj);}else if(Builder.isService(def)){obj=new Reflect.Service(this,this.ptr,def["name"],def["options"]);Object.keys(def["rpc"]).forEach(function(name){var mtd=def["rpc"][name];obj.addChild(new Reflect.Service.RPCMethod(this,obj,name,mtd["request"],mtd["response"],!!mtd["request_stream"],!!mtd["response_stream"],mtd["options"]));},this);this.ptr.addChild(obj);}else if(Builder.isExtend(def)){obj=this.ptr.resolve(def["ref"],true);if(obj){def["fields"].forEach(function(fld){if(obj.getChild(fld['id']|0)!==null)throw Error("duplicate extended field id in "+obj.name+": "+fld['id']); // Check if field id is allowed to be extended
if(obj.extensions){var valid=false;obj.extensions.forEach(function(range){if(fld["id"]>=range[0]&&fld["id"]<=range[1])valid=true;});if(!valid)throw Error("illegal extended field id in "+obj.name+": "+fld['id']+" (not within valid ranges)");} // Convert extension field names to camel case notation if the override is set
var name=fld["name"];if(this.options['convertFieldsToCamelCase'])name=ProtoBuf.Util.toCamelCase(name); // see #161: Extensions use their fully qualified name as their runtime key and...
var field=new Reflect.Message.ExtensionField(this,obj,fld["rule"],fld["type"],this.ptr.fqn()+'.'+name,fld["id"],fld["options"]); // ...are added on top of the current namespace as an extension which is used for
// resolving their type later on (the extension always keeps the original name to
// prevent naming collisions)
var ext=new Reflect.Extension(this,this.ptr,fld["name"],field);field.extension=ext;this.ptr.addChild(ext);obj.addChild(field);},this);}else if(!/\.?google\.protobuf\./.test(def["ref"])) // Silently skip internal extensions
throw Error("extended message "+def["ref"]+" is not defined");}else throw Error("not a valid definition: "+JSON.stringify(def));def=null;obj=null;} // Break goes here
defs=null;this.ptr=this.ptr.parent; // Namespace done, continue at parent
}this.resolved=false; // Require re-resolve
this.result=null; // Require re-build
return this;}; /**
         * Propagates syntax to all children.
         * @param {!Object} parent
         * @inner
         */function propagateSyntax(parent){if(parent['messages']){parent['messages'].forEach(function(child){child["syntax"]=parent["syntax"];propagateSyntax(child);});}if(parent['enums']){parent['enums'].forEach(function(child){child["syntax"]=parent["syntax"];});}} /**
         * Imports another definition into this builder.
         * @param {Object.<string,*>} json Parsed import
         * @param {(string|{root: string, file: string})=} filename Imported file name
         * @returns {!ProtoBuf.Builder} this
         * @throws {Error} If the definition or file cannot be imported
         * @expose
         */BuilderPrototype["import"]=function(json,filename){var delim='/'; // Make sure to skip duplicate imports
if(typeof filename==='string'){if(ProtoBuf.Util.IS_NODE)filename=require("path")['resolve'](filename);if(this.files[filename]===true)return this.reset();this.files[filename]=true;}else if((typeof filename==="undefined"?"undefined":_typeof(filename))==='object'){ // Object with root, file.
var root=filename.root;if(ProtoBuf.Util.IS_NODE)root=require("path")['resolve'](root);if(root.indexOf("\\")>=0||filename.file.indexOf("\\")>=0)delim='\\';var fname=root+delim+filename.file;if(this.files[fname]===true)return this.reset();this.files[fname]=true;} // Import imports
if(json['imports']&&json['imports'].length>0){var importRoot,resetRoot=false;if((typeof filename==="undefined"?"undefined":_typeof(filename))==='object'){ // If an import root is specified, override
this.importRoot=filename["root"];resetRoot=true; // ... and reset afterwards
importRoot=this.importRoot;filename=filename["file"];if(importRoot.indexOf("\\")>=0||filename.indexOf("\\")>=0)delim='\\';}else if(typeof filename==='string'){if(this.importRoot) // If import root is overridden, use it
importRoot=this.importRoot;else { // Otherwise compute from filename
if(filename.indexOf("/")>=0){ // Unix
importRoot=filename.replace(/\/[^\/]*$/,"");if( /* /file.proto */importRoot==="")importRoot="/";}else if(filename.indexOf("\\")>=0){ // Windows
importRoot=filename.replace(/\\[^\\]*$/,"");delim='\\';}else importRoot=".";}}else importRoot=null;for(var i=0;i<json['imports'].length;i++){if(typeof json['imports'][i]==='string'){ // Import file
if(!importRoot)throw Error("cannot determine import root");var importFilename=json['imports'][i];if(importFilename==="google/protobuf/descriptor.proto")continue; // Not needed and therefore not used
importFilename=importRoot+delim+importFilename;if(this.files[importFilename]===true)continue; // Already imported
if(/\.proto$/i.test(importFilename)&&!ProtoBuf.DotProto) // If this is a light build
importFilename=importFilename.replace(/\.proto$/,".json"); // always load the JSON file
var contents=ProtoBuf.Util.fetch(importFilename);if(contents===null)throw Error("failed to import '"+importFilename+"' in '"+filename+"': file not found");if(/\.json$/i.test(importFilename)) // Always possible
this["import"](JSON.parse(contents+""),importFilename); // May throw
else this["import"](ProtoBuf.DotProto.Parser.parse(contents),importFilename); // May throw
}else  // Import structure
if(!filename)this["import"](json['imports'][i]);else if(/\.(\w+)$/.test(filename)) // With extension: Append _importN to the name portion to make it unique
this["import"](json['imports'][i],filename.replace(/^(.+)\.(\w+)$/,function($0,$1,$2){return $1+"_import"+i+"."+$2;}));else  // Without extension: Append _importN to make it unique
this["import"](json['imports'][i],filename+"_import"+i);}if(resetRoot) // Reset import root override when all imports are done
this.importRoot=null;} // Import structures
if(json['package'])this.define(json['package']);if(json['syntax'])propagateSyntax(json);var base=this.ptr;if(json['options'])Object.keys(json['options']).forEach(function(key){base.options[key]=json['options'][key];});if(json['messages'])this.create(json['messages']),this.ptr=base;if(json['enums'])this.create(json['enums']),this.ptr=base;if(json['services'])this.create(json['services']),this.ptr=base;if(json['extends'])this.create(json['extends']);return this.reset();}; /**
         * Resolves all namespace objects.
         * @throws {Error} If a type cannot be resolved
         * @returns {!ProtoBuf.Builder} this
         * @expose
         */BuilderPrototype.resolveAll=function(){ // Resolve all reflected objects
var res;if(this.ptr==null||_typeof(this.ptr.type)==='object')return this; // Done (already resolved)
if(this.ptr instanceof Reflect.Namespace){ // Resolve children
this.ptr.children.forEach(function(child){this.ptr=child;this.resolveAll();},this);}else if(this.ptr instanceof Reflect.Message.Field){ // Resolve type
if(!Lang.TYPE.test(this.ptr.type)){if(!Lang.TYPEREF.test(this.ptr.type))throw Error("illegal type reference in "+this.ptr.toString(true)+": "+this.ptr.type);res=(this.ptr instanceof Reflect.Message.ExtensionField?this.ptr.extension.parent:this.ptr.parent).resolve(this.ptr.type,true);if(!res)throw Error("unresolvable type reference in "+this.ptr.toString(true)+": "+this.ptr.type);this.ptr.resolvedType=res;if(res instanceof Reflect.Enum){this.ptr.type=ProtoBuf.TYPES["enum"];if(this.ptr.syntax==='proto3'&&res.syntax!=='proto3')throw Error("proto3 message cannot reference proto2 enum");}else if(res instanceof Reflect.Message)this.ptr.type=res.isGroup?ProtoBuf.TYPES["group"]:ProtoBuf.TYPES["message"];else throw Error("illegal type reference in "+this.ptr.toString(true)+": "+this.ptr.type);}else this.ptr.type=ProtoBuf.TYPES[this.ptr.type]; // If it's a map field, also resolve the key type. The key type can be only a numeric, string, or bool type
// (i.e., no enums or messages), so we don't need to resolve against the current namespace.
if(this.ptr.map){if(!Lang.TYPE.test(this.ptr.keyType))throw Error("illegal key type for map field in "+this.ptr.toString(true)+": "+this.ptr.keyType);this.ptr.keyType=ProtoBuf.TYPES[this.ptr.keyType];}}else if(this.ptr instanceof ProtoBuf.Reflect.Service.Method){if(this.ptr instanceof ProtoBuf.Reflect.Service.RPCMethod){res=this.ptr.parent.resolve(this.ptr.requestName,true);if(!res||!(res instanceof ProtoBuf.Reflect.Message))throw Error("Illegal type reference in "+this.ptr.toString(true)+": "+this.ptr.requestName);this.ptr.resolvedRequestType=res;res=this.ptr.parent.resolve(this.ptr.responseName,true);if(!res||!(res instanceof ProtoBuf.Reflect.Message))throw Error("Illegal type reference in "+this.ptr.toString(true)+": "+this.ptr.responseName);this.ptr.resolvedResponseType=res;}else  // Should not happen as nothing else is implemented
throw Error("illegal service type in "+this.ptr.toString(true));}else if(!(this.ptr instanceof ProtoBuf.Reflect.Message.OneOf)&& // Not built
!(this.ptr instanceof ProtoBuf.Reflect.Extension)&& // Not built
!(this.ptr instanceof ProtoBuf.Reflect.Enum.Value) // Built in enum
)throw Error("illegal object in namespace: "+_typeof(this.ptr)+": "+this.ptr);return this.reset();}; /**
         * Builds the protocol. This will first try to resolve all definitions and, if this has been successful,
         * return the built package.
         * @param {(string|Array.<string>)=} path Specifies what to return. If omitted, the entire namespace will be returned.
         * @returns {!ProtoBuf.Builder.Message|!Object.<string,*>}
         * @throws {Error} If a type could not be resolved
         * @expose
         */BuilderPrototype.build=function(path){this.reset();if(!this.resolved)this.resolveAll(),this.resolved=true,this.result=null; // Require re-build
if(this.result===null) // (Re-)Build
this.result=this.ns.build();if(!path)return this.result;var part=typeof path==='string'?path.split("."):path,ptr=this.result; // Build namespace pointer (no hasChild etc.)
for(var i=0;i<part.length;i++){if(ptr[part[i]])ptr=ptr[part[i]];else {ptr=null;break;}}return ptr;}; /**
         * Similar to {@link ProtoBuf.Builder#build}, but looks up the internal reflection descriptor.
         * @param {string=} path Specifies what to return. If omitted, the entire namespace wiil be returned.
         * @param {boolean=} excludeNonNamespace Excludes non-namespace types like fields, defaults to `false`
         * @returns {?ProtoBuf.Reflect.T} Reflection descriptor or `null` if not found
         */BuilderPrototype.lookup=function(path,excludeNonNamespace){return path?this.ns.resolve(path,excludeNonNamespace):this.ns;}; /**
         * Returns a string representation of this object.
         * @return {string} String representation as of "Builder"
         * @expose
         */BuilderPrototype.toString=function(){return "Builder";}; // ----- Base classes -----
// Exist for the sole purpose of being able to "... instanceof ProtoBuf.Builder.Message" etc.
/**
         * @alias ProtoBuf.Builder.Message
         */Builder.Message=function(){}; /**
         * @alias ProtoBuf.Builder.Enum
         */Builder.Enum=function(){}; /**
         * @alias ProtoBuf.Builder.Message
         */Builder.Service=function(){};return Builder;}(ProtoBuf,ProtoBuf.Lang,ProtoBuf.Reflect); /**
     * @alias ProtoBuf.Map
     * @expose
     */ProtoBuf.Map=function(ProtoBuf,Reflect){"use strict"; /**
         * Constructs a new Map. A Map is a container that is used to implement map
         * fields on message objects. It closely follows the ES6 Map API; however,
         * it is distinct because we do not want to depend on external polyfills or
         * on ES6 itself.
         *
         * @exports ProtoBuf.Map
         * @param {!ProtoBuf.Reflect.Field} field Map field
         * @param {Object.<string,*>=} contents Initial contents
         * @constructor
         */var Map=function Map(field,contents){if(!field.map)throw Error("field is not a map"); /**
             * The field corresponding to this map.
             * @type {!ProtoBuf.Reflect.Field}
             */this.field=field; /**
             * Element instance corresponding to key type.
             * @type {!ProtoBuf.Reflect.Element}
             */this.keyElem=new Reflect.Element(field.keyType,null,true,field.syntax); /**
             * Element instance corresponding to value type.
             * @type {!ProtoBuf.Reflect.Element}
             */this.valueElem=new Reflect.Element(field.type,field.resolvedType,false,field.syntax); /**
             * Internal map: stores mapping of (string form of key) -> (key, value)
             * pair.
             *
             * We provide map semantics for arbitrary key types, but we build on top
             * of an Object, which has only string keys. In order to avoid the need
             * to convert a string key back to its native type in many situations,
             * we store the native key value alongside the value. Thus, we only need
             * a one-way mapping from a key type to its string form that guarantees
             * uniqueness and equality (i.e., str(K1) === str(K2) if and only if K1
             * === K2).
             *
             * @type {!Object<string, {key: *, value: *}>}
             */this.map={}; /**
             * Returns the number of elements in the map.
             */Object.defineProperty(this,"size",{get:function get(){return Object.keys(this.map).length;}}); // Fill initial contents from a raw object.
if(contents){var keys=Object.keys(contents);for(var i=0;i<keys.length;i++){var key=this.keyElem.valueFromString(keys[i]);var val=this.valueElem.verifyValue(contents[keys[i]]);this.map[this.keyElem.valueToString(key)]={key:key,value:val};}}};var MapPrototype=Map.prototype; /**
         * Helper: return an iterator over an array.
         * @param {!Array<*>} arr the array
         * @returns {!Object} an iterator
         * @inner
         */function arrayIterator(arr){var idx=0;return {next:function next(){if(idx<arr.length)return {done:false,value:arr[idx++]};return {done:true};}};} /**
         * Clears the map.
         */MapPrototype.clear=function(){this.map={};}; /**
         * Deletes a particular key from the map.
         * @returns {boolean} Whether any entry with this key was deleted.
         */MapPrototype["delete"]=function(key){var keyValue=this.keyElem.valueToString(this.keyElem.verifyValue(key));var hadKey=keyValue in this.map;delete this.map[keyValue];return hadKey;}; /**
         * Returns an iterator over [key, value] pairs in the map.
         * @returns {Object} The iterator
         */MapPrototype.entries=function(){var entries=[];var strKeys=Object.keys(this.map);for(var i=0,entry;i<strKeys.length;i++){entries.push([(entry=this.map[strKeys[i]]).key,entry.value]);}return arrayIterator(entries);}; /**
         * Returns an iterator over keys in the map.
         * @returns {Object} The iterator
         */MapPrototype.keys=function(){var keys=[];var strKeys=Object.keys(this.map);for(var i=0;i<strKeys.length;i++){keys.push(this.map[strKeys[i]].key);}return arrayIterator(keys);}; /**
         * Returns an iterator over values in the map.
         * @returns {!Object} The iterator
         */MapPrototype.values=function(){var values=[];var strKeys=Object.keys(this.map);for(var i=0;i<strKeys.length;i++){values.push(this.map[strKeys[i]].value);}return arrayIterator(values);}; /**
         * Iterates over entries in the map, calling a function on each.
         * @param {function(this:*, *, *, *)} cb The callback to invoke with value, key, and map arguments.
         * @param {Object=} thisArg The `this` value for the callback
         */MapPrototype.forEach=function(cb,thisArg){var strKeys=Object.keys(this.map);for(var i=0,entry;i<strKeys.length;i++){cb.call(thisArg,(entry=this.map[strKeys[i]]).value,entry.key,this);}}; /**
         * Sets a key in the map to the given value.
         * @param {*} key The key
         * @param {*} value The value
         * @returns {!ProtoBuf.Map} The map instance
         */MapPrototype.set=function(key,value){var keyValue=this.keyElem.verifyValue(key);var valValue=this.valueElem.verifyValue(value);this.map[this.keyElem.valueToString(keyValue)]={key:keyValue,value:valValue};return this;}; /**
         * Gets the value corresponding to a key in the map.
         * @param {*} key The key
         * @returns {*|undefined} The value, or `undefined` if key not present
         */MapPrototype.get=function(key){var keyValue=this.keyElem.valueToString(this.keyElem.verifyValue(key));if(!(keyValue in this.map))return undefined;return this.map[keyValue].value;}; /**
         * Determines whether the given key is present in the map.
         * @param {*} key The key
         * @returns {boolean} `true` if the key is present
         */MapPrototype.has=function(key){var keyValue=this.keyElem.valueToString(this.keyElem.verifyValue(key));return keyValue in this.map;};return Map;}(ProtoBuf,ProtoBuf.Reflect); /**
     * Loads a .proto string and returns the Builder.
     * @param {string} proto .proto file contents
     * @param {(ProtoBuf.Builder|string|{root: string, file: string})=} builder Builder to append to. Will create a new one if omitted.
     * @param {(string|{root: string, file: string})=} filename The corresponding file name if known. Must be specified for imports.
     * @return {ProtoBuf.Builder} Builder to create new messages
     * @throws {Error} If the definition cannot be parsed or built
     * @expose
     */ProtoBuf.loadProto=function(proto,builder,filename){if(typeof builder==='string'||builder&&typeof builder["file"]==='string'&&typeof builder["root"]==='string')filename=builder,builder=undefined;return ProtoBuf.loadJson(ProtoBuf.DotProto.Parser.parse(proto),builder,filename);}; /**
     * Loads a .proto string and returns the Builder. This is an alias of {@link ProtoBuf.loadProto}.
     * @function
     * @param {string} proto .proto file contents
     * @param {(ProtoBuf.Builder|string)=} builder Builder to append to. Will create a new one if omitted.
     * @param {(string|{root: string, file: string})=} filename The corresponding file name if known. Must be specified for imports.
     * @return {ProtoBuf.Builder} Builder to create new messages
     * @throws {Error} If the definition cannot be parsed or built
     * @expose
     */ProtoBuf.protoFromString=ProtoBuf.loadProto; // Legacy
/**
     * Loads a .proto file and returns the Builder.
     * @param {string|{root: string, file: string}} filename Path to proto file or an object specifying 'file' with
     *  an overridden 'root' path for all imported files.
     * @param {function(?Error, !ProtoBuf.Builder=)=} callback Callback that will receive `null` as the first and
     *  the Builder as its second argument on success, otherwise the error as its first argument. If omitted, the
     *  file will be read synchronously and this function will return the Builder.
     * @param {ProtoBuf.Builder=} builder Builder to append to. Will create a new one if omitted.
     * @return {?ProtoBuf.Builder|undefined} The Builder if synchronous (no callback specified, will be NULL if the
     *   request has failed), else undefined
     * @expose
     */ProtoBuf.loadProtoFile=function(filename,callback,builder){if(callback&&(typeof callback==="undefined"?"undefined":_typeof(callback))==='object')builder=callback,callback=null;else if(!callback||typeof callback!=='function')callback=null;if(callback)return ProtoBuf.Util.fetch(typeof filename==='string'?filename:filename["root"]+"/"+filename["file"],function(contents){if(contents===null){callback(Error("Failed to fetch file"));return;}try{callback(null,ProtoBuf.loadProto(contents,builder,filename));}catch(e){callback(e);}});var contents=ProtoBuf.Util.fetch((typeof filename==="undefined"?"undefined":_typeof(filename))==='object'?filename["root"]+"/"+filename["file"]:filename);return contents===null?null:ProtoBuf.loadProto(contents,builder,filename);}; /**
     * Loads a .proto file and returns the Builder. This is an alias of {@link ProtoBuf.loadProtoFile}.
     * @function
     * @param {string|{root: string, file: string}} filename Path to proto file or an object specifying 'file' with
     *  an overridden 'root' path for all imported files.
     * @param {function(?Error, !ProtoBuf.Builder=)=} callback Callback that will receive `null` as the first and
     *  the Builder as its second argument on success, otherwise the error as its first argument. If omitted, the
     *  file will be read synchronously and this function will return the Builder.
     * @param {ProtoBuf.Builder=} builder Builder to append to. Will create a new one if omitted.
     * @return {!ProtoBuf.Builder|undefined} The Builder if synchronous (no callback specified, will be NULL if the
     *   request has failed), else undefined
     * @expose
     */ProtoBuf.protoFromFile=ProtoBuf.loadProtoFile; // Legacy
/**
     * Constructs a new empty Builder.
     * @param {Object.<string,*>=} options Builder options, defaults to global options set on ProtoBuf
     * @return {!ProtoBuf.Builder} Builder
     * @expose
     */ProtoBuf.newBuilder=function(options){options=options||{};if(typeof options['convertFieldsToCamelCase']==='undefined')options['convertFieldsToCamelCase']=ProtoBuf.convertFieldsToCamelCase;if(typeof options['populateAccessors']==='undefined')options['populateAccessors']=ProtoBuf.populateAccessors;return new ProtoBuf.Builder(options);}; /**
     * Loads a .json definition and returns the Builder.
     * @param {!*|string} json JSON definition
     * @param {(ProtoBuf.Builder|string|{root: string, file: string})=} builder Builder to append to. Will create a new one if omitted.
     * @param {(string|{root: string, file: string})=} filename The corresponding file name if known. Must be specified for imports.
     * @return {ProtoBuf.Builder} Builder to create new messages
     * @throws {Error} If the definition cannot be parsed or built
     * @expose
     */ProtoBuf.loadJson=function(json,builder,filename){if(typeof builder==='string'||builder&&typeof builder["file"]==='string'&&typeof builder["root"]==='string')filename=builder,builder=null;if(!builder||(typeof builder==="undefined"?"undefined":_typeof(builder))!=='object')builder=ProtoBuf.newBuilder();if(typeof json==='string')json=JSON.parse(json);builder["import"](json,filename);builder.resolveAll();return builder;}; /**
     * Loads a .json file and returns the Builder.
     * @param {string|!{root: string, file: string}} filename Path to json file or an object specifying 'file' with
     *  an overridden 'root' path for all imported files.
     * @param {function(?Error, !ProtoBuf.Builder=)=} callback Callback that will receive `null` as the first and
     *  the Builder as its second argument on success, otherwise the error as its first argument. If omitted, the
     *  file will be read synchronously and this function will return the Builder.
     * @param {ProtoBuf.Builder=} builder Builder to append to. Will create a new one if omitted.
     * @return {?ProtoBuf.Builder|undefined} The Builder if synchronous (no callback specified, will be NULL if the
     *   request has failed), else undefined
     * @expose
     */ProtoBuf.loadJsonFile=function(filename,callback,builder){if(callback&&(typeof callback==="undefined"?"undefined":_typeof(callback))==='object')builder=callback,callback=null;else if(!callback||typeof callback!=='function')callback=null;if(callback)return ProtoBuf.Util.fetch(typeof filename==='string'?filename:filename["root"]+"/"+filename["file"],function(contents){if(contents===null){callback(Error("Failed to fetch file"));return;}try{callback(null,ProtoBuf.loadJson(JSON.parse(contents),builder,filename));}catch(e){callback(e);}});var contents=ProtoBuf.Util.fetch((typeof filename==="undefined"?"undefined":_typeof(filename))==='object'?filename["root"]+"/"+filename["file"]:filename);return contents===null?null:ProtoBuf.loadJson(JSON.parse(contents),builder,filename);};return ProtoBuf;});

}).call(this,require('_process'))

},{"./..\\..\\bytebuffer\\dist\\ByteBufferAB.js":1,"_process":8,"fs":7,"path":7}],5:[function(require,module,exports){
"use strict";var _typeof=typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"?function(obj){return typeof obj;}:function(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol?"symbol":typeof obj;}; /* jquery.signalR.core.js */ /*global window:false */ /*!
 * ASP.NET SignalR JavaScript Library v2.2.0
 * http://signalr.net/
 *
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *
 */ /// <reference path="Scripts/jquery-1.6.4.js" />
/// <reference path="jquery.signalR.version.js" />
(function($,window,undefined){var resources={nojQuery:"jQuery was not found. Please ensure jQuery is referenced before the SignalR client JavaScript file.",noTransportOnInit:"No transport could be initialized successfully. Try specifying a different transport or none at all for auto initialization.",errorOnNegotiate:"Error during negotiation request.",stoppedWhileLoading:"The connection was stopped during page load.",stoppedWhileNegotiating:"The connection was stopped during the negotiate request.",errorParsingNegotiateResponse:"Error parsing negotiate response.",errorDuringStartRequest:"Error during start request. Stopping the connection.",stoppedDuringStartRequest:"The connection was stopped during the start request.",errorParsingStartResponse:"Error parsing start response: '{0}'. Stopping the connection.",invalidStartResponse:"Invalid start response: '{0}'. Stopping the connection.",protocolIncompatible:"You are using a version of the client that isn't compatible with the server. Client version {0}, server version {1}.",sendFailed:"Send failed.",parseFailed:"Failed at parsing response: {0}",longPollFailed:"Long polling request failed.",eventSourceFailedToConnect:"EventSource failed to connect.",eventSourceError:"Error raised by EventSource",webSocketClosed:"WebSocket closed.",pingServerFailedInvalidResponse:"Invalid ping response when pinging server: '{0}'.",pingServerFailed:"Failed to ping server.",pingServerFailedStatusCode:"Failed to ping server.  Server responded with status code {0}, stopping the connection.",pingServerFailedParse:"Failed to parse ping server response, stopping the connection.",noConnectionTransport:"Connection is in an invalid state, there is no transport active.",webSocketsInvalidState:"The Web Socket transport is in an invalid state, transitioning into reconnecting.",reconnectTimeout:"Couldn't reconnect within the configured timeout of {0} ms, disconnecting.",reconnectWindowTimeout:"The client has been inactive since {0} and it has exceeded the inactivity timeout of {1} ms. Stopping the connection."};if(typeof $!=="function"){ // no jQuery!
throw new Error(resources.nojQuery);}var _signalR,_connection,_pageLoaded=window.document.readyState==="complete",_pageWindow=$(window),_negotiateAbortText="__Negotiate Aborted__",events={onStart:"onStart",onStarting:"onStarting",onReceived:"onReceived",onError:"onError",onConnectionSlow:"onConnectionSlow",onReconnecting:"onReconnecting",onReconnect:"onReconnect",onStateChanged:"onStateChanged",onDisconnect:"onDisconnect"},ajaxDefaults={processData:true,timeout:null,async:true,global:false,cache:false},_log=function _log(msg,logging){if(logging===false){return;}var m;if(typeof window.console==="undefined"){return;}m="["+new Date().toTimeString()+"] SignalR: "+msg;if(window.console.debug){window.console.debug(m);}else if(window.console.log){window.console.log(m);}},changeState=function changeState(connection,expectedState,newState){if(expectedState===connection.state){connection.state=newState;$(connection).triggerHandler(events.onStateChanged,[{oldState:expectedState,newState:newState}]);return true;}return false;},isDisconnecting=function isDisconnecting(connection){return connection.state===_signalR.connectionState.disconnected;},supportsKeepAlive=function supportsKeepAlive(connection){return connection._.keepAliveData.activated&&connection.transport.supportsKeepAlive(connection);},configureStopReconnectingTimeout=function configureStopReconnectingTimeout(connection){var stopReconnectingTimeout,onReconnectTimeout; // Check if this connection has already been configured to stop reconnecting after a specified timeout.
// Without this check if a connection is stopped then started events will be bound multiple times.
if(!connection._.configuredStopReconnectingTimeout){onReconnectTimeout=function onReconnectTimeout(connection){var message=_signalR._.format(_signalR.resources.reconnectTimeout,connection.disconnectTimeout);connection.log(message);$(connection).triggerHandler(events.onError,[_signalR._.error(message, /* source */"TimeoutException")]);connection.stop( /* async */false, /* notifyServer */false);};connection.reconnecting(function(){var connection=this; // Guard against state changing in a previous user defined even handler
if(connection.state===_signalR.connectionState.reconnecting){stopReconnectingTimeout=window.setTimeout(function(){onReconnectTimeout(connection);},connection.disconnectTimeout);}});connection.stateChanged(function(data){if(data.oldState===_signalR.connectionState.reconnecting){ // Clear the pending reconnect timeout check
window.clearTimeout(stopReconnectingTimeout);}});connection._.configuredStopReconnectingTimeout=true;}};_signalR=function signalR(url,qs,logging){ /// <summary>Creates a new SignalR connection for the given url</summary>
/// <param name="url" type="String">The URL of the long polling endpoint</param>
/// <param name="qs" type="Object">
///     [Optional] Custom querystring parameters to add to the connection URL.
///     If an object, every non-function member will be added to the querystring.
///     If a string, it's added to the QS as specified.
/// </param>
/// <param name="logging" type="Boolean">
///     [Optional] A flag indicating whether connection logging is enabled to the browser
///     console/log. Defaults to false.
/// </param>
return new _signalR.fn.init(url,qs,logging);};_signalR._={defaultContentType:"application/x-www-form-urlencoded; charset=UTF-8",ieVersion:function(){var version,matches;if(window.navigator.appName==='Microsoft Internet Explorer'){ // Check if the user agent has the pattern "MSIE (one or more numbers).(one or more numbers)";
matches=/MSIE ([0-9]+\.[0-9]+)/.exec(window.navigator.userAgent);if(matches){version=window.parseFloat(matches[1]);}} // undefined value means not IE
return version;}(),error:function error(message,source,context){var e=new Error(message);e.source=source;if(typeof context!=="undefined"){e.context=context;}return e;},transportError:function transportError(message,transport,source,context){var e=this.error(message,source,context);e.transport=transport?transport.name:undefined;return e;},format:function format(){ /// <summary>Usage: format("Hi {0}, you are {1}!", "Foo", 100) </summary>
var s=arguments[0];for(var i=0;i<arguments.length-1;i++){s=s.replace("{"+i+"}",arguments[i+1]);}return s;},firefoxMajorVersion:function firefoxMajorVersion(userAgent){ // Firefox user agents: http://useragentstring.com/pages/Firefox/
var matches=userAgent.match(/Firefox\/(\d+)/);if(!matches||!matches.length||matches.length<2){return 0;}return parseInt(matches[1],10 /* radix */);},configurePingInterval:function configurePingInterval(connection){var config=connection._.config,onFail=function onFail(error){$(connection).triggerHandler(events.onError,[error]);};if(config&&!connection._.pingIntervalId&&config.pingInterval){connection._.pingIntervalId=window.setInterval(function(){_signalR.transports._logic.pingServer(connection).fail(onFail);},config.pingInterval);}}};_signalR.events=events;_signalR.resources=resources;_signalR.ajaxDefaults=ajaxDefaults;_signalR.changeState=changeState;_signalR.isDisconnecting=isDisconnecting;_signalR.connectionState={connecting:0,connected:1,reconnecting:2,disconnected:4};_signalR.hub={start:function start(){ // This will get replaced with the real hub connection start method when hubs is referenced correctly
throw new Error("SignalR: Error loading hubs. Ensure your hubs reference is correct, e.g. <script src='/signalr/js'></script>.");}};_pageWindow.load(function(){_pageLoaded=true;});function validateTransport(requestedTransport,connection){ /// <summary>Validates the requested transport by cross checking it with the pre-defined signalR.transports</summary>
/// <param name="requestedTransport" type="Object">The designated transports that the user has specified.</param>
/// <param name="connection" type="signalR">The connection that will be using the requested transports.  Used for logging purposes.</param>
/// <returns type="Object" />
if($.isArray(requestedTransport)){ // Go through transport array and remove an "invalid" tranports
for(var i=requestedTransport.length-1;i>=0;i--){var transport=requestedTransport[i];if($.type(transport)!=="string"||!_signalR.transports[transport]){connection.log("Invalid transport: "+transport+", removing it from the transports list.");requestedTransport.splice(i,1);}} // Verify we still have transports left, if we dont then we have invalid transports
if(requestedTransport.length===0){connection.log("No transports remain within the specified transport array.");requestedTransport=null;}}else if(!_signalR.transports[requestedTransport]&&requestedTransport!=="auto"){connection.log("Invalid transport: "+requestedTransport.toString()+".");requestedTransport=null;}else if(requestedTransport==="auto"&&_signalR._.ieVersion<=8){ // If we're doing an auto transport and we're IE8 then force longPolling, #1764
return ["longPolling"];}return requestedTransport;}function getDefaultPort(protocol){if(protocol==="http:"){return 80;}else if(protocol==="https:"){return 443;}}function addDefaultPort(protocol,url){ // Remove ports  from url.  We have to check if there's a / or end of line
// following the port in order to avoid removing ports such as 8080.
if(url.match(/:\d+$/)){return url;}else {return url+":"+getDefaultPort(protocol);}}function ConnectingMessageBuffer(connection,drainCallback){var that=this,buffer=[];that.tryBuffer=function(message){if(connection.state===$.signalR.connectionState.connecting){buffer.push(message);return true;}return false;};that.drain=function(){ // Ensure that the connection is connected when we drain (do not want to drain while a connection is not active)
if(connection.state===$.signalR.connectionState.connected){while(buffer.length>0){drainCallback(buffer.shift());}}};that.clear=function(){buffer=[];};}_signalR.fn=_signalR.prototype={init:function init(url,qs,logging){var $connection=$(this);this.url=url;this.qs=qs;this.lastError=null;this._={keepAliveData:{},connectingMessageBuffer:new ConnectingMessageBuffer(this,function(message){$connection.triggerHandler(events.onReceived,[message]);}),lastMessageAt:new Date().getTime(),lastActiveAt:new Date().getTime(),beatInterval:5000, // Default value, will only be overridden if keep alive is enabled,
beatHandle:null,totalTransportConnectTimeout:0 // This will be the sum of the TransportConnectTimeout sent in response to negotiate and connection.transportConnectTimeout
};if(typeof logging==="boolean"){this.logging=logging;}},_parseResponse:function _parseResponse(response){var that=this;if(!response){return response;}else if(typeof response==="string"){return that.json.parse(response);}else {return response;}},_originalJson:window.JSON,json:window.JSON,isCrossDomain:function isCrossDomain(url,against){ /// <summary>Checks if url is cross domain</summary>
/// <param name="url" type="String">The base URL</param>
/// <param name="against" type="Object">
///     An optional argument to compare the URL against, if not specified it will be set to window.location.
///     If specified it must contain a protocol and a host property.
/// </param>
var link;url=$.trim(url);against=against||window.location;if(url.indexOf("http")!==0){return false;} // Create an anchor tag.
link=window.document.createElement("a");link.href=url; // When checking for cross domain we have to special case port 80 because the window.location will remove the 
return link.protocol+addDefaultPort(link.protocol,link.host)!==against.protocol+addDefaultPort(against.protocol,against.host);},ajaxDataType:"text",contentType:"application/json; charset=UTF-8",logging:false,state:_signalR.connectionState.disconnected,clientProtocol:"1.5",reconnectDelay:2000,transportConnectTimeout:0,disconnectTimeout:30000, // This should be set by the server in response to the negotiate request (30s default)
reconnectWindow:30000, // This should be set by the server in response to the negotiate request 
keepAliveWarnAt:2/3, // Warn user of slow connection if we breach the X% mark of the keep alive timeout
start:function start(options,callback){ /// <summary>Starts the connection</summary>
/// <param name="options" type="Object">Options map</param>
/// <param name="callback" type="Function">A callback function to execute when the connection has started</param>
var connection=this,config={pingInterval:300000,waitForPageLoad:true,transport:"auto",jsonp:false},_initialize,deferred=connection._deferral||$.Deferred(), // Check to see if there is a pre-existing deferral that's being built on, if so we want to keep using it
parser=window.document.createElement("a");connection.lastError=null; // Persist the deferral so that if start is called multiple times the same deferral is used.
connection._deferral=deferred;if(!connection.json){ // no JSON!
throw new Error("SignalR: No JSON parser found. Please ensure json2.js is referenced before the SignalR.js file if you need to support clients without native JSON parsing support, e.g. IE<8.");}if($.type(options)==="function"){ // Support calling with single callback parameter
callback=options;}else if($.type(options)==="object"){$.extend(config,options);if($.type(config.callback)==="function"){callback=config.callback;}}config.transport=validateTransport(config.transport,connection); // If the transport is invalid throw an error and abort start
if(!config.transport){throw new Error("SignalR: Invalid transport(s) specified, aborting start.");}connection._.config=config; // Check to see if start is being called prior to page load
// If waitForPageLoad is true we then want to re-direct function call to the window load event
if(!_pageLoaded&&config.waitForPageLoad===true){connection._.deferredStartHandler=function(){connection.start(options,callback);};_pageWindow.bind("load",connection._.deferredStartHandler);return deferred.promise();} // If we're already connecting just return the same deferral as the original connection start
if(connection.state===_signalR.connectionState.connecting){return deferred.promise();}else if(changeState(connection,_signalR.connectionState.disconnected,_signalR.connectionState.connecting)===false){ // We're not connecting so try and transition into connecting.
// If we fail to transition then we're either in connected or reconnecting.
deferred.resolve(connection);return deferred.promise();}configureStopReconnectingTimeout(connection); // Resolve the full url
parser.href=connection.url;if(!parser.protocol||parser.protocol===":"){connection.protocol=window.document.location.protocol;connection.host=parser.host||window.document.location.host;}else {connection.protocol=parser.protocol;connection.host=parser.host;}connection.baseUrl=connection.protocol+"//"+connection.host; // Set the websocket protocol
connection.wsProtocol=connection.protocol==="https:"?"wss://":"ws://"; // If jsonp with no/auto transport is specified, then set the transport to long polling
// since that is the only transport for which jsonp really makes sense.
// Some developers might actually choose to specify jsonp for same origin requests
// as demonstrated by Issue #623.
if(config.transport==="auto"&&config.jsonp===true){config.transport="longPolling";} // If the url is protocol relative, prepend the current windows protocol to the url. 
if(connection.url.indexOf("//")===0){connection.url=window.location.protocol+connection.url;connection.log("Protocol relative URL detected, normalizing it to '"+connection.url+"'.");}if(this.isCrossDomain(connection.url)){connection.log("Auto detected cross domain url.");if(config.transport==="auto"){ // TODO: Support XDM with foreverFrame
config.transport=["webSockets","serverSentEvents","longPolling"];}if(typeof config.withCredentials==="undefined"){config.withCredentials=true;} // Determine if jsonp is the only choice for negotiation, ajaxSend and ajaxAbort.
// i.e. if the browser doesn't supports CORS
// If it is, ignore any preference to the contrary, and switch to jsonp.
if(!config.jsonp){config.jsonp=!$.support.cors;if(config.jsonp){connection.log("Using jsonp because this browser doesn't support CORS.");}}connection.contentType=_signalR._.defaultContentType;}connection.withCredentials=config.withCredentials;connection.ajaxDataType=config.jsonp?"jsonp":"text";$(connection).bind(events.onStart,function(e,data){if($.type(callback)==="function"){callback.call(connection);}deferred.resolve(connection);});connection._.initHandler=_signalR.transports._logic.initHandler(connection);_initialize=function initialize(transports,index){var noTransportError=_signalR._.error(resources.noTransportOnInit);index=index||0;if(index>=transports.length){if(index===0){connection.log("No transports supported by the server were selected.");}else if(index===1){connection.log("No fallback transports were selected.");}else {connection.log("Fallback transports exhausted.");} // No transport initialized successfully
$(connection).triggerHandler(events.onError,[noTransportError]);deferred.reject(noTransportError); // Stop the connection if it has connected and move it into the disconnected state
connection.stop();return;} // The connection was aborted
if(connection.state===_signalR.connectionState.disconnected){return;}var transportName=transports[index],transport=_signalR.transports[transportName],onFallback=function onFallback(){_initialize(transports,index+1);};connection.transport=transport;try{connection._.initHandler.start(transport,function(){ // success
// Firefox 11+ doesn't allow sync XHR withCredentials: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#withCredentials
var isFirefox11OrGreater=_signalR._.firefoxMajorVersion(window.navigator.userAgent)>=11,asyncAbort=!!connection.withCredentials&&isFirefox11OrGreater;connection.log("The start request succeeded. Transitioning to the connected state.");if(supportsKeepAlive(connection)){_signalR.transports._logic.monitorKeepAlive(connection);}_signalR.transports._logic.startHeartbeat(connection); // Used to ensure low activity clients maintain their authentication.
// Must be configured once a transport has been decided to perform valid ping requests.
_signalR._.configurePingInterval(connection);if(!changeState(connection,_signalR.connectionState.connecting,_signalR.connectionState.connected)){connection.log("WARNING! The connection was not in the connecting state.");} // Drain any incoming buffered messages (messages that came in prior to connect)
connection._.connectingMessageBuffer.drain();$(connection).triggerHandler(events.onStart); // wire the stop handler for when the user leaves the page
_pageWindow.bind("unload",function(){connection.log("Window unloading, stopping the connection.");connection.stop(asyncAbort);});if(isFirefox11OrGreater){ // Firefox does not fire cross-domain XHRs in the normal unload handler on tab close.
// #2400
_pageWindow.bind("beforeunload",function(){ // If connection.stop() runs runs in beforeunload and fails, it will also fail
// in unload unless connection.stop() runs after a timeout.
window.setTimeout(function(){connection.stop(asyncAbort);},0);});}},onFallback);}catch(error){connection.log(transport.name+" transport threw '"+error.message+"' when attempting to start.");onFallback();}};var url=connection.url+"/negotiate",onFailed=function onFailed(error,connection){var err=_signalR._.error(resources.errorOnNegotiate,error,connection._.negotiateRequest);$(connection).triggerHandler(events.onError,err);deferred.reject(err); // Stop the connection if negotiate failed
connection.stop();};$(connection).triggerHandler(events.onStarting);url=_signalR.transports._logic.prepareQueryString(connection,url);connection.log("Negotiating with '"+url+"'."); // Save the ajax negotiate request object so we can abort it if stop is called while the request is in flight.
connection._.negotiateRequest=_signalR.transports._logic.ajax(connection,{url:url,error:function error(_error,statusText){ // We don't want to cause any errors if we're aborting our own negotiate request.
if(statusText!==_negotiateAbortText){onFailed(_error,connection);}else { // This rejection will noop if the deferred has already been resolved or rejected.
deferred.reject(_signalR._.error(resources.stoppedWhileNegotiating,null /* error */,connection._.negotiateRequest));}},success:function success(result){var res,keepAliveData,protocolError,transports=[],supportedTransports=[];try{res=connection._parseResponse(result);}catch(error){onFailed(_signalR._.error(resources.errorParsingNegotiateResponse,error),connection);return;}keepAliveData=connection._.keepAliveData;connection.appRelativeUrl=res.Url;connection.id=res.ConnectionId;connection.token=res.ConnectionToken;connection.webSocketServerUrl=res.WebSocketServerUrl; // The long poll timeout is the ConnectionTimeout plus 10 seconds
connection._.pollTimeout=res.ConnectionTimeout*1000+10000; // in ms
// Once the server has labeled the PersistentConnection as Disconnected, we should stop attempting to reconnect
// after res.DisconnectTimeout seconds.
connection.disconnectTimeout=res.DisconnectTimeout*1000; // in ms
// Add the TransportConnectTimeout from the response to the transportConnectTimeout from the client to calculate the total timeout
connection._.totalTransportConnectTimeout=connection.transportConnectTimeout+res.TransportConnectTimeout*1000; // If we have a keep alive
if(res.KeepAliveTimeout){ // Register the keep alive data as activated
keepAliveData.activated=true; // Timeout to designate when to force the connection into reconnecting converted to milliseconds
keepAliveData.timeout=res.KeepAliveTimeout*1000; // Timeout to designate when to warn the developer that the connection may be dead or is not responding.
keepAliveData.timeoutWarning=keepAliveData.timeout*connection.keepAliveWarnAt; // Instantiate the frequency in which we check the keep alive.  It must be short in order to not miss/pick up any changes
connection._.beatInterval=(keepAliveData.timeout-keepAliveData.timeoutWarning)/3;}else {keepAliveData.activated=false;}connection.reconnectWindow=connection.disconnectTimeout+(keepAliveData.timeout||0);if(!res.ProtocolVersion||res.ProtocolVersion!==connection.clientProtocol){protocolError=_signalR._.error(_signalR._.format(resources.protocolIncompatible,connection.clientProtocol,res.ProtocolVersion));$(connection).triggerHandler(events.onError,[protocolError]);deferred.reject(protocolError);return;}$.each(_signalR.transports,function(key){if(key.indexOf("_")===0||key==="webSockets"&&!res.TryWebSockets){return true;}supportedTransports.push(key);});if($.isArray(config.transport)){$.each(config.transport,function(_,transport){if($.inArray(transport,supportedTransports)>=0){transports.push(transport);}});}else if(config.transport==="auto"){transports=supportedTransports;}else if($.inArray(config.transport,supportedTransports)>=0){transports.push(config.transport);}_initialize(transports);}});return deferred.promise();},starting:function starting(callback){ /// <summary>Adds a callback that will be invoked before anything is sent over the connection</summary>
/// <param name="callback" type="Function">A callback function to execute before the connection is fully instantiated.</param>
/// <returns type="signalR" />
var connection=this;$(connection).bind(events.onStarting,function(e,data){callback.call(connection);});return connection;},send:function send(data){ /// <summary>Sends data over the connection</summary>
/// <param name="data" type="String">The data to send over the connection</param>
/// <returns type="signalR" />
var connection=this;if(connection.state===_signalR.connectionState.disconnected){ // Connection hasn't been started yet
throw new Error("SignalR: Connection must be started before data can be sent. Call .start() before .send()");}if(connection.state===_signalR.connectionState.connecting){ // Connection hasn't been started yet
throw new Error("SignalR: Connection has not been fully initialized. Use .start().done() or .start().fail() to run logic after the connection has started.");}connection.transport.send(connection,data); // REVIEW: Should we return deferred here?
return connection;},received:function received(callback){ /// <summary>Adds a callback that will be invoked after anything is received over the connection</summary>
/// <param name="callback" type="Function">A callback function to execute when any data is received on the connection</param>
/// <returns type="signalR" />
var connection=this;$(connection).bind(events.onReceived,function(e,data){callback.call(connection,data);});return connection;},stateChanged:function stateChanged(callback){ /// <summary>Adds a callback that will be invoked when the connection state changes</summary>
/// <param name="callback" type="Function">A callback function to execute when the connection state changes</param>
/// <returns type="signalR" />
var connection=this;$(connection).bind(events.onStateChanged,function(e,data){callback.call(connection,data);});return connection;},error:function error(callback){ /// <summary>Adds a callback that will be invoked after an error occurs with the connection</summary>
/// <param name="callback" type="Function">A callback function to execute when an error occurs on the connection</param>
/// <returns type="signalR" />
var connection=this;$(connection).bind(events.onError,function(e,errorData,sendData){connection.lastError=errorData; // In practice 'errorData' is the SignalR built error object.
// In practice 'sendData' is undefined for all error events except those triggered by
// 'ajaxSend' and 'webSockets.send'.'sendData' is the original send payload.
callback.call(connection,errorData,sendData);});return connection;},disconnected:function disconnected(callback){ /// <summary>Adds a callback that will be invoked when the client disconnects</summary>
/// <param name="callback" type="Function">A callback function to execute when the connection is broken</param>
/// <returns type="signalR" />
var connection=this;$(connection).bind(events.onDisconnect,function(e,data){callback.call(connection);});return connection;},connectionSlow:function connectionSlow(callback){ /// <summary>Adds a callback that will be invoked when the client detects a slow connection</summary>
/// <param name="callback" type="Function">A callback function to execute when the connection is slow</param>
/// <returns type="signalR" />
var connection=this;$(connection).bind(events.onConnectionSlow,function(e,data){callback.call(connection);});return connection;},reconnecting:function reconnecting(callback){ /// <summary>Adds a callback that will be invoked when the underlying transport begins reconnecting</summary>
/// <param name="callback" type="Function">A callback function to execute when the connection enters a reconnecting state</param>
/// <returns type="signalR" />
var connection=this;$(connection).bind(events.onReconnecting,function(e,data){callback.call(connection);});return connection;},reconnected:function reconnected(callback){ /// <summary>Adds a callback that will be invoked when the underlying transport reconnects</summary>
/// <param name="callback" type="Function">A callback function to execute when the connection is restored</param>
/// <returns type="signalR" />
var connection=this;$(connection).bind(events.onReconnect,function(e,data){callback.call(connection);});return connection;},stop:function stop(async,notifyServer){ /// <summary>Stops listening</summary>
/// <param name="async" type="Boolean">Whether or not to asynchronously abort the connection</param>
/// <param name="notifyServer" type="Boolean">Whether we want to notify the server that we are aborting the connection</param>
/// <returns type="signalR" />
var connection=this, // Save deferral because this is always cleaned up
deferral=connection._deferral; // Verify that we've bound a load event.
if(connection._.deferredStartHandler){ // Unbind the event.
_pageWindow.unbind("load",connection._.deferredStartHandler);} // Always clean up private non-timeout based state.
delete connection._.config;delete connection._.deferredStartHandler; // This needs to be checked despite the connection state because a connection start can be deferred until page load.
// If we've deferred the start due to a page load we need to unbind the "onLoad" -> start event.
if(!_pageLoaded&&(!connection._.config||connection._.config.waitForPageLoad===true)){connection.log("Stopping connection prior to negotiate."); // If we have a deferral we should reject it
if(deferral){deferral.reject(_signalR._.error(resources.stoppedWhileLoading));} // Short-circuit because the start has not been fully started.
return;}if(connection.state===_signalR.connectionState.disconnected){return;}connection.log("Stopping connection.");changeState(connection,connection.state,_signalR.connectionState.disconnected); // Clear this no matter what
window.clearTimeout(connection._.beatHandle);window.clearInterval(connection._.pingIntervalId);if(connection.transport){connection.transport.stop(connection);if(notifyServer!==false){connection.transport.abort(connection,async);}if(supportsKeepAlive(connection)){_signalR.transports._logic.stopMonitoringKeepAlive(connection);}connection.transport=null;}if(connection._.negotiateRequest){ // If the negotiation request has already completed this will noop.
connection._.negotiateRequest.abort(_negotiateAbortText);delete connection._.negotiateRequest;} // Ensure that initHandler.stop() is called before connection._deferral is deleted
if(connection._.initHandler){connection._.initHandler.stop();} // Trigger the disconnect event
$(connection).triggerHandler(events.onDisconnect);delete connection._deferral;delete connection.messageId;delete connection.groupsToken;delete connection.id;delete connection._.pingIntervalId;delete connection._.lastMessageAt;delete connection._.lastActiveAt; // Clear out our message buffer
connection._.connectingMessageBuffer.clear();return connection;},log:function log(msg){_log(msg,this.logging);}};_signalR.fn.init.prototype=_signalR.fn;_signalR.noConflict=function(){ /// <summary>Reinstates the original value of $.connection and returns the signalR object for manual assignment</summary>
/// <returns type="signalR" />
if($.connection===_signalR){$.connection=_connection;}return _signalR;};if($.connection){_connection=$.connection;}$.connection=$.signalR=_signalR;})(window.jQuery,window); /* jquery.signalR.transports.common.js */ // Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.md in the project root for license information.
/*global window:false */ /// <reference path="jquery.signalR.core.js" />
(function($,window,undefined){var signalR=$.signalR,events=$.signalR.events,changeState=$.signalR.changeState,startAbortText="__Start Aborted__",transportLogic;signalR.transports={};function beat(connection){if(connection._.keepAliveData.monitoring){checkIfAlive(connection);} // Ensure that we successfully marked active before continuing the heartbeat.
if(transportLogic.markActive(connection)){connection._.beatHandle=window.setTimeout(function(){beat(connection);},connection._.beatInterval);}}function checkIfAlive(connection){var keepAliveData=connection._.keepAliveData,timeElapsed; // Only check if we're connected
if(connection.state===signalR.connectionState.connected){timeElapsed=new Date().getTime()-connection._.lastMessageAt; // Check if the keep alive has completely timed out
if(timeElapsed>=keepAliveData.timeout){connection.log("Keep alive timed out.  Notifying transport that connection has been lost."); // Notify transport that the connection has been lost
connection.transport.lostConnection(connection);}else if(timeElapsed>=keepAliveData.timeoutWarning){ // This is to assure that the user only gets a single warning
if(!keepAliveData.userNotified){connection.log("Keep alive has been missed, connection may be dead/slow.");$(connection).triggerHandler(events.onConnectionSlow);keepAliveData.userNotified=true;}}else {keepAliveData.userNotified=false;}}}function getAjaxUrl(connection,path){var url=connection.url+path;if(connection.transport){url+="?transport="+connection.transport.name;}return transportLogic.prepareQueryString(connection,url);}function InitHandler(connection){this.connection=connection;this.startRequested=false;this.startCompleted=false;this.connectionStopped=false;}InitHandler.prototype={start:function start(transport,onSuccess,onFallback){var that=this,connection=that.connection,failCalled=false;if(that.startRequested||that.connectionStopped){connection.log("WARNING! "+transport.name+" transport cannot be started. Initialization ongoing or completed.");return;}connection.log(transport.name+" transport starting.");that.transportTimeoutHandle=window.setTimeout(function(){if(!failCalled){failCalled=true;connection.log(transport.name+" transport timed out when trying to connect.");that.transportFailed(transport,undefined,onFallback);}},connection._.totalTransportConnectTimeout);transport.start(connection,function(){if(!failCalled){that.initReceived(transport,onSuccess);}},function(error){ // Don't allow the same transport to cause onFallback to be called twice
if(!failCalled){failCalled=true;that.transportFailed(transport,error,onFallback);} // Returns true if the transport should stop;
// false if it should attempt to reconnect
return !that.startCompleted||that.connectionStopped;});},stop:function stop(){this.connectionStopped=true;window.clearTimeout(this.transportTimeoutHandle);signalR.transports._logic.tryAbortStartRequest(this.connection);},initReceived:function initReceived(transport,onSuccess){var that=this,connection=that.connection;if(that.startRequested){connection.log("WARNING! The client received multiple init messages.");return;}if(that.connectionStopped){return;}that.startRequested=true;window.clearTimeout(that.transportTimeoutHandle);connection.log(transport.name+" transport connected. Initiating start request.");signalR.transports._logic.ajaxStart(connection,function(){that.startCompleted=true;onSuccess();});},transportFailed:function transportFailed(transport,error,onFallback){var connection=this.connection,deferred=connection._deferral,wrappedError;if(this.connectionStopped){return;}window.clearTimeout(this.transportTimeoutHandle);if(!this.startRequested){transport.stop(connection);connection.log(transport.name+" transport failed to connect. Attempting to fall back.");onFallback();}else if(!this.startCompleted){ // Do not attempt to fall back if a start request is ongoing during a transport failure.
// Instead, trigger an error and stop the connection.
wrappedError=signalR._.error(signalR.resources.errorDuringStartRequest,error);connection.log(transport.name+" transport failed during the start request. Stopping the connection.");$(connection).triggerHandler(events.onError,[wrappedError]);if(deferred){deferred.reject(wrappedError);}connection.stop();}else { // The start request has completed, but the connection has not stopped.
// No need to do anything here. The transport should attempt its normal reconnect logic.
}}};transportLogic=signalR.transports._logic={ajax:function ajax(connection,options){return $.ajax($.extend( /*deep copy*/true,{},$.signalR.ajaxDefaults,{type:"GET",data:{},xhrFields:{withCredentials:connection.withCredentials},contentType:connection.contentType,dataType:connection.ajaxDataType},options));},pingServer:function pingServer(connection){ /// <summary>Pings the server</summary>
/// <param name="connection" type="signalr">Connection associated with the server ping</param>
/// <returns type="signalR" />
var url,xhr,deferral=$.Deferred();if(connection.transport){url=connection.url+"/ping";url=transportLogic.addQs(url,connection.qs);xhr=transportLogic.ajax(connection,{url:url,success:function success(result){var data;try{data=connection._parseResponse(result);}catch(error){deferral.reject(signalR._.transportError(signalR.resources.pingServerFailedParse,connection.transport,error,xhr));connection.stop();return;}if(data.Response==="pong"){deferral.resolve();}else {deferral.reject(signalR._.transportError(signalR._.format(signalR.resources.pingServerFailedInvalidResponse,result),connection.transport,null /* error */,xhr));}},error:function error(_error2){if(_error2.status===401||_error2.status===403){deferral.reject(signalR._.transportError(signalR._.format(signalR.resources.pingServerFailedStatusCode,_error2.status),connection.transport,_error2,xhr));connection.stop();}else {deferral.reject(signalR._.transportError(signalR.resources.pingServerFailed,connection.transport,_error2,xhr));}}});}else {deferral.reject(signalR._.transportError(signalR.resources.noConnectionTransport,connection.transport));}return deferral.promise();},prepareQueryString:function prepareQueryString(connection,url){var preparedUrl; // Use addQs to start since it handles the ?/& prefix for us
preparedUrl=transportLogic.addQs(url,"clientProtocol="+connection.clientProtocol); // Add the user-specified query string params if any
preparedUrl=transportLogic.addQs(preparedUrl,connection.qs);if(connection.token){preparedUrl+="&connectionToken="+window.encodeURIComponent(connection.token);}if(connection.data){preparedUrl+="&connectionData="+window.encodeURIComponent(connection.data);}return preparedUrl;},addQs:function addQs(url,qs){var appender=url.indexOf("?")!==-1?"&":"?",firstChar;if(!qs){return url;}if((typeof qs==="undefined"?"undefined":_typeof(qs))==="object"){return url+appender+$.param(qs);}if(typeof qs==="string"){firstChar=qs.charAt(0);if(firstChar==="?"||firstChar==="&"){appender="";}return url+appender+qs;}throw new Error("Query string property must be either a string or object.");}, // BUG #2953: The url needs to be same otherwise it will cause a memory leak
getUrl:function getUrl(connection,transport,reconnecting,poll,ajaxPost){ /// <summary>Gets the url for making a GET based connect request</summary>
var baseUrl=transport==="webSockets"?"":connection.baseUrl,url=baseUrl+connection.appRelativeUrl,qs="transport="+transport;if(!ajaxPost&&connection.groupsToken){qs+="&groupsToken="+window.encodeURIComponent(connection.groupsToken);}if(!reconnecting){url+="/connect";}else {if(poll){ // longPolling transport specific
url+="/poll";}else {url+="/reconnect";}if(!ajaxPost&&connection.messageId){qs+="&messageId="+window.encodeURIComponent(connection.messageId);}}url+="?"+qs;url=transportLogic.prepareQueryString(connection,url);if(!ajaxPost){url+="&tid="+Math.floor(Math.random()*11);}return url;},maximizePersistentResponse:function maximizePersistentResponse(minPersistentResponse){return {MessageId:minPersistentResponse.C,Messages:minPersistentResponse.M,Initialized:typeof minPersistentResponse.S!=="undefined"?true:false,ShouldReconnect:typeof minPersistentResponse.T!=="undefined"?true:false,LongPollDelay:minPersistentResponse.L,GroupsToken:minPersistentResponse.G};},updateGroups:function updateGroups(connection,groupsToken){if(groupsToken){connection.groupsToken=groupsToken;}},stringifySend:function stringifySend(connection,message){if(typeof message==="string"||typeof message==="undefined"||message===null){return message;}return connection.json.stringify(message);},ajaxSend:function ajaxSend(connection,data){var payload=transportLogic.stringifySend(connection,data),url=getAjaxUrl(connection,"/send"),xhr,onFail=function onFail(error,connection){$(connection).triggerHandler(events.onError,[signalR._.transportError(signalR.resources.sendFailed,connection.transport,error,xhr),data]);};xhr=transportLogic.ajax(connection,{url:url,type:connection.ajaxDataType==="jsonp"?"GET":"POST",contentType:signalR._.defaultContentType,data:{data:payload},success:function success(result){var res;if(result){try{res=connection._parseResponse(result);}catch(error){onFail(error,connection);connection.stop();return;}transportLogic.triggerReceived(connection,res);}},error:function error(_error3,textStatus){if(textStatus==="abort"||textStatus==="parsererror"){ // The parsererror happens for sends that don't return any data, and hence
// don't write the jsonp callback to the response. This is harder to fix on the server
// so just hack around it on the client for now.
return;}onFail(_error3,connection);}});return xhr;},ajaxAbort:function ajaxAbort(connection,async){if(typeof connection.transport==="undefined"){return;} // Async by default unless explicitly overidden
async=typeof async==="undefined"?true:async;var url=getAjaxUrl(connection,"/abort");transportLogic.ajax(connection,{url:url,async:async,timeout:1000,type:"POST"});connection.log("Fired ajax abort async = "+async+".");},ajaxStart:function ajaxStart(connection,onSuccess){var rejectDeferred=function rejectDeferred(error){var deferred=connection._deferral;if(deferred){deferred.reject(error);}},triggerStartError=function triggerStartError(error){connection.log("The start request failed. Stopping the connection.");$(connection).triggerHandler(events.onError,[error]);rejectDeferred(error);connection.stop();};connection._.startRequest=transportLogic.ajax(connection,{url:getAjaxUrl(connection,"/start"),success:function success(result,statusText,xhr){var data;try{data=connection._parseResponse(result);}catch(error){triggerStartError(signalR._.error(signalR._.format(signalR.resources.errorParsingStartResponse,result),error,xhr));return;}if(data.Response==="started"){onSuccess();}else {triggerStartError(signalR._.error(signalR._.format(signalR.resources.invalidStartResponse,result),null /* error */,xhr));}},error:function error(xhr,statusText,_error4){if(statusText!==startAbortText){triggerStartError(signalR._.error(signalR.resources.errorDuringStartRequest,_error4,xhr));}else { // Stop has been called, no need to trigger the error handler
// or stop the connection again with onStartError
connection.log("The start request aborted because connection.stop() was called.");rejectDeferred(signalR._.error(signalR.resources.stoppedDuringStartRequest,null /* error */,xhr));}}});},tryAbortStartRequest:function tryAbortStartRequest(connection){if(connection._.startRequest){ // If the start request has already completed this will noop.
connection._.startRequest.abort(startAbortText);delete connection._.startRequest;}},tryInitialize:function tryInitialize(persistentResponse,onInitialized){if(persistentResponse.Initialized){onInitialized();}},triggerReceived:function triggerReceived(connection,data){if(!connection._.connectingMessageBuffer.tryBuffer(data)){$(connection).triggerHandler(events.onReceived,[data]);}},processMessages:function processMessages(connection,minData,onInitialized){var data; // Update the last message time stamp
transportLogic.markLastMessage(connection);if(minData){data=transportLogic.maximizePersistentResponse(minData);transportLogic.updateGroups(connection,data.GroupsToken);if(data.MessageId){connection.messageId=data.MessageId;}if(data.Messages){$.each(data.Messages,function(index,message){transportLogic.triggerReceived(connection,message);});transportLogic.tryInitialize(data,onInitialized);}}},monitorKeepAlive:function monitorKeepAlive(connection){var keepAliveData=connection._.keepAliveData; // If we haven't initiated the keep alive timeouts then we need to
if(!keepAliveData.monitoring){keepAliveData.monitoring=true;transportLogic.markLastMessage(connection); // Save the function so we can unbind it on stop
connection._.keepAliveData.reconnectKeepAliveUpdate=function(){ // Mark a new message so that keep alive doesn't time out connections
transportLogic.markLastMessage(connection);}; // Update Keep alive on reconnect
$(connection).bind(events.onReconnect,connection._.keepAliveData.reconnectKeepAliveUpdate);connection.log("Now monitoring keep alive with a warning timeout of "+keepAliveData.timeoutWarning+", keep alive timeout of "+keepAliveData.timeout+" and disconnecting timeout of "+connection.disconnectTimeout);}else {connection.log("Tried to monitor keep alive but it's already being monitored.");}},stopMonitoringKeepAlive:function stopMonitoringKeepAlive(connection){var keepAliveData=connection._.keepAliveData; // Only attempt to stop the keep alive monitoring if its being monitored
if(keepAliveData.monitoring){ // Stop monitoring
keepAliveData.monitoring=false; // Remove the updateKeepAlive function from the reconnect event
$(connection).unbind(events.onReconnect,connection._.keepAliveData.reconnectKeepAliveUpdate); // Clear all the keep alive data
connection._.keepAliveData={};connection.log("Stopping the monitoring of the keep alive.");}},startHeartbeat:function startHeartbeat(connection){connection._.lastActiveAt=new Date().getTime();beat(connection);},markLastMessage:function markLastMessage(connection){connection._.lastMessageAt=new Date().getTime();},markActive:function markActive(connection){if(transportLogic.verifyLastActive(connection)){connection._.lastActiveAt=new Date().getTime();return true;}return false;},isConnectedOrReconnecting:function isConnectedOrReconnecting(connection){return connection.state===signalR.connectionState.connected||connection.state===signalR.connectionState.reconnecting;},ensureReconnectingState:function ensureReconnectingState(connection){if(changeState(connection,signalR.connectionState.connected,signalR.connectionState.reconnecting)===true){$(connection).triggerHandler(events.onReconnecting);}return connection.state===signalR.connectionState.reconnecting;},clearReconnectTimeout:function clearReconnectTimeout(connection){if(connection&&connection._.reconnectTimeout){window.clearTimeout(connection._.reconnectTimeout);delete connection._.reconnectTimeout;}},verifyLastActive:function verifyLastActive(connection){if(new Date().getTime()-connection._.lastActiveAt>=connection.reconnectWindow){var message=signalR._.format(signalR.resources.reconnectWindowTimeout,new Date(connection._.lastActiveAt),connection.reconnectWindow);connection.log(message);$(connection).triggerHandler(events.onError,[signalR._.error(message, /* source */"TimeoutException")]);connection.stop( /* async */false, /* notifyServer */false);return false;}return true;},reconnect:function reconnect(connection,transportName){var transport=signalR.transports[transportName]; // We should only set a reconnectTimeout if we are currently connected
// and a reconnectTimeout isn't already set.
if(transportLogic.isConnectedOrReconnecting(connection)&&!connection._.reconnectTimeout){ // Need to verify before the setTimeout occurs because an application sleep could occur during the setTimeout duration.
if(!transportLogic.verifyLastActive(connection)){return;}connection._.reconnectTimeout=window.setTimeout(function(){if(!transportLogic.verifyLastActive(connection)){return;}transport.stop(connection);if(transportLogic.ensureReconnectingState(connection)){connection.log(transportName+" reconnecting.");transport.start(connection);}},connection.reconnectDelay);}},handleParseFailure:function handleParseFailure(connection,result,error,onFailed,context){var wrappedError=signalR._.transportError(signalR._.format(signalR.resources.parseFailed,result),connection.transport,error,context); // If we're in the initialization phase trigger onFailed, otherwise stop the connection.
if(onFailed&&onFailed(wrappedError)){connection.log("Failed to parse server response while attempting to connect.");}else {$(connection).triggerHandler(events.onError,[wrappedError]);connection.stop();}},initHandler:function initHandler(connection){return new InitHandler(connection);},foreverFrame:{count:0,connections:{}}};})(window.jQuery,window); /* jquery.signalR.transports.webSockets.js */ // Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.md in the project root for license information.
/*global window:false */ /// <reference path="jquery.signalR.transports.common.js" />
(function($,window,undefined){var signalR=$.signalR,events=$.signalR.events,changeState=$.signalR.changeState,transportLogic=signalR.transports._logic;signalR.transports.webSockets={name:"webSockets",supportsKeepAlive:function supportsKeepAlive(){return true;},send:function send(connection,data){var payload=transportLogic.stringifySend(connection,data);try{connection.socket.send(payload);}catch(ex){$(connection).triggerHandler(events.onError,[signalR._.transportError(signalR.resources.webSocketsInvalidState,connection.transport,ex,connection.socket),data]);}},start:function start(connection,onSuccess,onFailed){var url,opened=false,that=this,reconnecting=!onSuccess,$connection=$(connection);if(!window.WebSocket){onFailed();return;}if(!connection.socket){if(connection.webSocketServerUrl){url=connection.webSocketServerUrl;}else {url=connection.wsProtocol+connection.host;}url+=transportLogic.getUrl(connection,this.name,reconnecting);connection.log("Connecting to websocket endpoint '"+url+"'.");connection.socket=new window.WebSocket(url);connection.socket.onopen=function(){opened=true;connection.log("Websocket opened.");transportLogic.clearReconnectTimeout(connection);if(changeState(connection,signalR.connectionState.reconnecting,signalR.connectionState.connected)===true){$connection.triggerHandler(events.onReconnect);}};connection.socket.onclose=function(event){var error; // Only handle a socket close if the close is from the current socket.
// Sometimes on disconnect the server will push down an onclose event
// to an expired socket.
if(this===connection.socket){if(opened&&typeof event.wasClean!=="undefined"&&event.wasClean===false){ // Ideally this would use the websocket.onerror handler (rather than checking wasClean in onclose) but
// I found in some circumstances Chrome won't call onerror. This implementation seems to work on all browsers.
error=signalR._.transportError(signalR.resources.webSocketClosed,connection.transport,event);connection.log("Unclean disconnect from websocket: "+(event.reason||"[no reason given]."));}else {connection.log("Websocket closed.");}if(!onFailed||!onFailed(error)){if(error){$(connection).triggerHandler(events.onError,[error]);}that.reconnect(connection);}}};connection.socket.onmessage=function(event){var data;try{data=connection._parseResponse(event.data);}catch(error){transportLogic.handleParseFailure(connection,event.data,error,onFailed,event);return;}if(data){ // data.M is PersistentResponse.Messages
if($.isEmptyObject(data)||data.M){transportLogic.processMessages(connection,data,onSuccess);}else { // For websockets we need to trigger onReceived
// for callbacks to outgoing hub calls.
transportLogic.triggerReceived(connection,data);}}};}},reconnect:function reconnect(connection){transportLogic.reconnect(connection,this.name);},lostConnection:function lostConnection(connection){this.reconnect(connection);},stop:function stop(connection){ // Don't trigger a reconnect after stopping
transportLogic.clearReconnectTimeout(connection);if(connection.socket){connection.log("Closing the Websocket.");connection.socket.close();connection.socket=null;}},abort:function abort(connection,async){transportLogic.ajaxAbort(connection,async);}};})(window.jQuery,window); /* jquery.signalR.transports.serverSentEvents.js */ // Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.md in the project root for license information.
/*global window:false */ /// <reference path="jquery.signalR.transports.common.js" />
(function($,window,undefined){var signalR=$.signalR,events=$.signalR.events,changeState=$.signalR.changeState,transportLogic=signalR.transports._logic,clearReconnectAttemptTimeout=function clearReconnectAttemptTimeout(connection){window.clearTimeout(connection._.reconnectAttemptTimeoutHandle);delete connection._.reconnectAttemptTimeoutHandle;};signalR.transports.serverSentEvents={name:"serverSentEvents",supportsKeepAlive:function supportsKeepAlive(){return true;},timeOut:3000,start:function start(connection,onSuccess,onFailed){var that=this,opened=false,$connection=$(connection),reconnecting=!onSuccess,url;if(connection.eventSource){connection.log("The connection already has an event source. Stopping it.");connection.stop();}if(!window.EventSource){if(onFailed){connection.log("This browser doesn't support SSE.");onFailed();}return;}url=transportLogic.getUrl(connection,this.name,reconnecting);try{connection.log("Attempting to connect to SSE endpoint '"+url+"'.");connection.eventSource=new window.EventSource(url,{withCredentials:connection.withCredentials});}catch(e){connection.log("EventSource failed trying to connect with error "+e.Message+".");if(onFailed){ // The connection failed, call the failed callback
onFailed();}else {$connection.triggerHandler(events.onError,[signalR._.transportError(signalR.resources.eventSourceFailedToConnect,connection.transport,e)]);if(reconnecting){ // If we were reconnecting, rather than doing initial connect, then try reconnect again
that.reconnect(connection);}}return;}if(reconnecting){connection._.reconnectAttemptTimeoutHandle=window.setTimeout(function(){if(opened===false){ // If we're reconnecting and the event source is attempting to connect,
// don't keep retrying. This causes duplicate connections to spawn.
if(connection.eventSource.readyState!==window.EventSource.OPEN){ // If we were reconnecting, rather than doing initial connect, then try reconnect again
that.reconnect(connection);}}},that.timeOut);}connection.eventSource.addEventListener("open",function(e){connection.log("EventSource connected.");clearReconnectAttemptTimeout(connection);transportLogic.clearReconnectTimeout(connection);if(opened===false){opened=true;if(changeState(connection,signalR.connectionState.reconnecting,signalR.connectionState.connected)===true){$connection.triggerHandler(events.onReconnect);}}},false);connection.eventSource.addEventListener("message",function(e){var res; // process messages
if(e.data==="initialized"){return;}try{res=connection._parseResponse(e.data);}catch(error){transportLogic.handleParseFailure(connection,e.data,error,onFailed,e);return;}transportLogic.processMessages(connection,res,onSuccess);},false);connection.eventSource.addEventListener("error",function(e){var error=signalR._.transportError(signalR.resources.eventSourceError,connection.transport,e); // Only handle an error if the error is from the current Event Source.
// Sometimes on disconnect the server will push down an error event
// to an expired Event Source.
if(this!==connection.eventSource){return;}if(onFailed&&onFailed(error)){return;}connection.log("EventSource readyState: "+connection.eventSource.readyState+".");if(e.eventPhase===window.EventSource.CLOSED){ // We don't use the EventSource's native reconnect function as it
// doesn't allow us to change the URL when reconnecting. We need
// to change the URL to not include the /connect suffix, and pass
// the last message id we received.
connection.log("EventSource reconnecting due to the server connection ending.");that.reconnect(connection);}else { // connection error
connection.log("EventSource error.");$connection.triggerHandler(events.onError,[error]);}},false);},reconnect:function reconnect(connection){transportLogic.reconnect(connection,this.name);},lostConnection:function lostConnection(connection){this.reconnect(connection);},send:function send(connection,data){transportLogic.ajaxSend(connection,data);},stop:function stop(connection){ // Don't trigger a reconnect after stopping
clearReconnectAttemptTimeout(connection);transportLogic.clearReconnectTimeout(connection);if(connection&&connection.eventSource){connection.log("EventSource calling close().");connection.eventSource.close();connection.eventSource=null;delete connection.eventSource;}},abort:function abort(connection,async){transportLogic.ajaxAbort(connection,async);}};})(window.jQuery,window); /* jquery.signalR.transports.foreverFrame.js */ // Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.md in the project root for license information.
/*global window:false */ /// <reference path="jquery.signalR.transports.common.js" />
(function($,window,undefined){var signalR=$.signalR,events=$.signalR.events,changeState=$.signalR.changeState,transportLogic=signalR.transports._logic,createFrame=function createFrame(){var frame=window.document.createElement("iframe");frame.setAttribute("style","position:absolute;top:0;left:0;width:0;height:0;visibility:hidden;");return frame;}, // Used to prevent infinite loading icon spins in older versions of ie
// We build this object inside a closure so we don't pollute the rest of   
// the foreverFrame transport with unnecessary functions/utilities.
loadPreventer=function(){var loadingFixIntervalId=null,loadingFixInterval=1000,attachedTo=0;return {prevent:function prevent(){ // Prevent additional iframe removal procedures from newer browsers
if(signalR._.ieVersion<=8){ // We only ever want to set the interval one time, so on the first attachedTo
if(attachedTo===0){ // Create and destroy iframe every 3 seconds to prevent loading icon, super hacky
loadingFixIntervalId=window.setInterval(function(){var tempFrame=createFrame();window.document.body.appendChild(tempFrame);window.document.body.removeChild(tempFrame);tempFrame=null;},loadingFixInterval);}attachedTo++;}},cancel:function cancel(){ // Only clear the interval if there's only one more object that the loadPreventer is attachedTo
if(attachedTo===1){window.clearInterval(loadingFixIntervalId);}if(attachedTo>0){attachedTo--;}}};}();signalR.transports.foreverFrame={name:"foreverFrame",supportsKeepAlive:function supportsKeepAlive(){return true;}, // Added as a value here so we can create tests to verify functionality
iframeClearThreshold:50,start:function start(connection,onSuccess,onFailed){var that=this,frameId=transportLogic.foreverFrame.count+=1,url,frame=createFrame(),frameLoadHandler=function frameLoadHandler(){connection.log("Forever frame iframe finished loading and is no longer receiving messages.");if(!onFailed||!onFailed()){that.reconnect(connection);}};if(window.EventSource){ // If the browser supports SSE, don't use Forever Frame
if(onFailed){connection.log("Forever Frame is not supported by SignalR on browsers with SSE support.");onFailed();}return;}frame.setAttribute("data-signalr-connection-id",connection.id); // Start preventing loading icon
// This will only perform work if the loadPreventer is not attached to another connection.
loadPreventer.prevent(); // Build the url
url=transportLogic.getUrl(connection,this.name);url+="&frameId="+frameId; // add frame to the document prior to setting URL to avoid caching issues.
window.document.documentElement.appendChild(frame);connection.log("Binding to iframe's load event.");if(frame.addEventListener){frame.addEventListener("load",frameLoadHandler,false);}else if(frame.attachEvent){frame.attachEvent("onload",frameLoadHandler);}frame.src=url;transportLogic.foreverFrame.connections[frameId]=connection;connection.frame=frame;connection.frameId=frameId;if(onSuccess){connection.onSuccess=function(){connection.log("Iframe transport started.");onSuccess();};}},reconnect:function reconnect(connection){var that=this; // Need to verify connection state and verify before the setTimeout occurs because an application sleep could occur during the setTimeout duration.
if(transportLogic.isConnectedOrReconnecting(connection)&&transportLogic.verifyLastActive(connection)){window.setTimeout(function(){ // Verify that we're ok to reconnect.
if(!transportLogic.verifyLastActive(connection)){return;}if(connection.frame&&transportLogic.ensureReconnectingState(connection)){var frame=connection.frame,src=transportLogic.getUrl(connection,that.name,true)+"&frameId="+connection.frameId;connection.log("Updating iframe src to '"+src+"'.");frame.src=src;}},connection.reconnectDelay);}},lostConnection:function lostConnection(connection){this.reconnect(connection);},send:function send(connection,data){transportLogic.ajaxSend(connection,data);},receive:function receive(connection,data){var cw,body,response;if(connection.json!==connection._originalJson){ // If there's a custom JSON parser configured then serialize the object
// using the original (browser) JSON parser and then deserialize it using
// the custom parser (connection._parseResponse does that). This is so we
// can easily send the response from the server as "raw" JSON but still 
// support custom JSON deserialization in the browser.
data=connection._originalJson.stringify(data);}response=connection._parseResponse(data);transportLogic.processMessages(connection,response,connection.onSuccess); // Protect against connection stopping from a callback trigger within the processMessages above.
if(connection.state===$.signalR.connectionState.connected){ // Delete the script & div elements
connection.frameMessageCount=(connection.frameMessageCount||0)+1;if(connection.frameMessageCount>signalR.transports.foreverFrame.iframeClearThreshold){connection.frameMessageCount=0;cw=connection.frame.contentWindow||connection.frame.contentDocument;if(cw&&cw.document&&cw.document.body){body=cw.document.body; // Remove all the child elements from the iframe's body to conserver memory
while(body.firstChild){body.removeChild(body.firstChild);}}}}},stop:function stop(connection){var cw=null; // Stop attempting to prevent loading icon
loadPreventer.cancel();if(connection.frame){if(connection.frame.stop){connection.frame.stop();}else {try{cw=connection.frame.contentWindow||connection.frame.contentDocument;if(cw.document&&cw.document.execCommand){cw.document.execCommand("Stop");}}catch(e){connection.log("Error occured when stopping foreverFrame transport. Message = "+e.message+".");}} // Ensure the iframe is where we left it
if(connection.frame.parentNode===window.document.body){window.document.body.removeChild(connection.frame);}delete transportLogic.foreverFrame.connections[connection.frameId];connection.frame=null;connection.frameId=null;delete connection.frame;delete connection.frameId;delete connection.onSuccess;delete connection.frameMessageCount;connection.log("Stopping forever frame.");}},abort:function abort(connection,async){transportLogic.ajaxAbort(connection,async);},getConnection:function getConnection(id){return transportLogic.foreverFrame.connections[id];},started:function started(connection){if(changeState(connection,signalR.connectionState.reconnecting,signalR.connectionState.connected)===true){$(connection).triggerHandler(events.onReconnect);}}};})(window.jQuery,window); /* jquery.signalR.transports.longPolling.js */ // Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.md in the project root for license information.
/*global window:false */ /// <reference path="jquery.signalR.transports.common.js" />
(function($,window,undefined){var signalR=$.signalR,events=$.signalR.events,changeState=$.signalR.changeState,isDisconnecting=$.signalR.isDisconnecting,transportLogic=signalR.transports._logic;signalR.transports.longPolling={name:"longPolling",supportsKeepAlive:function supportsKeepAlive(){return false;},reconnectDelay:3000,start:function start(connection,onSuccess,onFailed){ /// <summary>Starts the long polling connection</summary>
/// <param name="connection" type="signalR">The SignalR connection to start</param>
var that=this,_fireConnect=function fireConnect(){_fireConnect=$.noop;connection.log("LongPolling connected.");onSuccess();},tryFailConnect=function tryFailConnect(error){if(onFailed(error)){connection.log("LongPolling failed to connect.");return true;}return false;},privateData=connection._,reconnectErrors=0,fireReconnected=function fireReconnected(instance){window.clearTimeout(privateData.reconnectTimeoutId);privateData.reconnectTimeoutId=null;if(changeState(instance,signalR.connectionState.reconnecting,signalR.connectionState.connected)===true){ // Successfully reconnected!
instance.log("Raising the reconnect event");$(instance).triggerHandler(events.onReconnect);}}, // 1 hour
maxFireReconnectedTimeout=3600000;if(connection.pollXhr){connection.log("Polling xhr requests already exists, aborting.");connection.stop();}connection.messageId=null;privateData.reconnectTimeoutId=null;privateData.pollTimeoutId=window.setTimeout(function(){(function poll(instance,raiseReconnect){var messageId=instance.messageId,connect=messageId===null,reconnecting=!connect,polling=!raiseReconnect,url=transportLogic.getUrl(instance,that.name,reconnecting,polling,true /* use Post for longPolling */),postData={};if(instance.messageId){postData.messageId=instance.messageId;}if(instance.groupsToken){postData.groupsToken=instance.groupsToken;} // If we've disconnected during the time we've tried to re-instantiate the poll then stop.
if(isDisconnecting(instance)===true){return;}connection.log("Opening long polling request to '"+url+"'.");instance.pollXhr=transportLogic.ajax(connection,{xhrFields:{onprogress:function onprogress(){transportLogic.markLastMessage(connection);}},url:url,type:"POST",contentType:signalR._.defaultContentType,data:postData,timeout:connection._.pollTimeout,success:function success(result){var minData,delay=0,data,shouldReconnect;connection.log("Long poll complete."); // Reset our reconnect errors so if we transition into a reconnecting state again we trigger
// reconnected quickly
reconnectErrors=0;try{ // Remove any keep-alives from the beginning of the result
minData=connection._parseResponse(result);}catch(error){transportLogic.handleParseFailure(instance,result,error,tryFailConnect,instance.pollXhr);return;} // If there's currently a timeout to trigger reconnect, fire it now before processing messages
if(privateData.reconnectTimeoutId!==null){fireReconnected(instance);}if(minData){data=transportLogic.maximizePersistentResponse(minData);}transportLogic.processMessages(instance,minData,_fireConnect);if(data&&$.type(data.LongPollDelay)==="number"){delay=data.LongPollDelay;}if(isDisconnecting(instance)===true){return;}shouldReconnect=data&&data.ShouldReconnect;if(shouldReconnect){ // Transition into the reconnecting state
// If this fails then that means that the user transitioned the connection into a invalid state in processMessages.
if(!transportLogic.ensureReconnectingState(instance)){return;}} // We never want to pass a raiseReconnect flag after a successful poll.  This is handled via the error function
if(delay>0){privateData.pollTimeoutId=window.setTimeout(function(){poll(instance,shouldReconnect);},delay);}else {poll(instance,shouldReconnect);}},error:function error(data,textStatus){var error=signalR._.transportError(signalR.resources.longPollFailed,connection.transport,data,instance.pollXhr); // Stop trying to trigger reconnect, connection is in an error state
// If we're not in the reconnect state this will noop
window.clearTimeout(privateData.reconnectTimeoutId);privateData.reconnectTimeoutId=null;if(textStatus==="abort"){connection.log("Aborted xhr request.");return;}if(!tryFailConnect(error)){ // Increment our reconnect errors, we assume all errors to be reconnect errors
// In the case that it's our first error this will cause Reconnect to be fired
// after 1 second due to reconnectErrors being = 1.
reconnectErrors++;if(connection.state!==signalR.connectionState.reconnecting){connection.log("An error occurred using longPolling. Status = "+textStatus+".  Response = "+data.responseText+".");$(instance).triggerHandler(events.onError,[error]);} // We check the state here to verify that we're not in an invalid state prior to verifying Reconnect.
// If we're not in connected or reconnecting then the next ensureReconnectingState check will fail and will return.
// Therefore we don't want to change that failure code path.
if((connection.state===signalR.connectionState.connected||connection.state===signalR.connectionState.reconnecting)&&!transportLogic.verifyLastActive(connection)){return;} // Transition into the reconnecting state
// If this fails then that means that the user transitioned the connection into the disconnected or connecting state within the above error handler trigger.
if(!transportLogic.ensureReconnectingState(instance)){return;} // Call poll with the raiseReconnect flag as true after the reconnect delay
privateData.pollTimeoutId=window.setTimeout(function(){poll(instance,true);},that.reconnectDelay);}}}); // This will only ever pass after an error has occured via the poll ajax procedure.
if(reconnecting&&raiseReconnect===true){ // We wait to reconnect depending on how many times we've failed to reconnect.
// This is essentially a heuristic that will exponentially increase in wait time before
// triggering reconnected.  This depends on the "error" handler of Poll to cancel this 
// timeout if it triggers before the Reconnected event fires.
// The Math.min at the end is to ensure that the reconnect timeout does not overflow.
privateData.reconnectTimeoutId=window.setTimeout(function(){fireReconnected(instance);},Math.min(1000*(Math.pow(2,reconnectErrors)-1),maxFireReconnectedTimeout));}})(connection);},250); // Have to delay initial poll so Chrome doesn't show loader spinner in tab
},lostConnection:function lostConnection(connection){if(connection.pollXhr){connection.pollXhr.abort("lostConnection");}},send:function send(connection,data){transportLogic.ajaxSend(connection,data);},stop:function stop(connection){ /// <summary>Stops the long polling connection</summary>
/// <param name="connection" type="signalR">The SignalR connection to stop</param>
window.clearTimeout(connection._.pollTimeoutId);window.clearTimeout(connection._.reconnectTimeoutId);delete connection._.pollTimeoutId;delete connection._.reconnectTimeoutId;if(connection.pollXhr){connection.pollXhr.abort();connection.pollXhr=null;delete connection.pollXhr;}},abort:function abort(connection,async){transportLogic.ajaxAbort(connection,async);}};})(window.jQuery,window); /* jquery.signalR.hubs.js */ // Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.md in the project root for license information.
/*global window:false */ /// <reference path="jquery.signalR.core.js" />
(function($,window,undefined){var eventNamespace=".hubProxy",signalR=$.signalR;function makeEventName(event){return event+eventNamespace;} // Equivalent to Array.prototype.map
function map(arr,fun,thisp){var i,length=arr.length,result=[];for(i=0;i<length;i+=1){if(arr.hasOwnProperty(i)){result[i]=fun.call(thisp,arr[i],i,arr);}}return result;}function getArgValue(a){return $.isFunction(a)?null:$.type(a)==="undefined"?null:a;}function hasMembers(obj){for(var key in obj){ // If we have any properties in our callback map then we have callbacks and can exit the loop via return
if(obj.hasOwnProperty(key)){return true;}}return false;}function clearInvocationCallbacks(connection,error){ /// <param name="connection" type="hubConnection" />
var callbacks=connection._.invocationCallbacks,callback;if(hasMembers(callbacks)){connection.log("Clearing hub invocation callbacks with error: "+error+".");} // Reset the callback cache now as we have a local var referencing it
connection._.invocationCallbackId=0;delete connection._.invocationCallbacks;connection._.invocationCallbacks={}; // Loop over the callbacks and invoke them.
// We do this using a local var reference and *after* we've cleared the cache
// so that if a fail callback itself tries to invoke another method we don't 
// end up with its callback in the list we're looping over.
for(var callbackId in callbacks){callback=callbacks[callbackId];callback.method.call(callback.scope,{E:error});}} // hubProxy
function hubProxy(hubConnection,hubName){ /// <summary>
///     Creates a new proxy object for the given hub connection that can be used to invoke
///     methods on server hubs and handle client method invocation requests from the server.
/// </summary>
return new hubProxy.fn.init(hubConnection,hubName);}hubProxy.fn=hubProxy.prototype={init:function init(connection,hubName){this.state={};this.connection=connection;this.hubName=hubName;this._={callbackMap:{}};},constructor:hubProxy,hasSubscriptions:function hasSubscriptions(){return hasMembers(this._.callbackMap);},on:function on(eventName,callback){ /// <summary>Wires up a callback to be invoked when a invocation request is received from the server hub.</summary>
/// <param name="eventName" type="String">The name of the hub event to register the callback for.</param>
/// <param name="callback" type="Function">The callback to be invoked.</param>
var that=this,callbackMap=that._.callbackMap; // Normalize the event name to lowercase
eventName=eventName.toLowerCase(); // If there is not an event registered for this callback yet we want to create its event space in the callback map.
if(!callbackMap[eventName]){callbackMap[eventName]={};} // Map the callback to our encompassed function
callbackMap[eventName][callback]=function(e,data){callback.apply(that,data);};$(that).bind(makeEventName(eventName),callbackMap[eventName][callback]);return that;},off:function off(eventName,callback){ /// <summary>Removes the callback invocation request from the server hub for the given event name.</summary>
/// <param name="eventName" type="String">The name of the hub event to unregister the callback for.</param>
/// <param name="callback" type="Function">The callback to be invoked.</param>
var that=this,callbackMap=that._.callbackMap,callbackSpace; // Normalize the event name to lowercase
eventName=eventName.toLowerCase();callbackSpace=callbackMap[eventName]; // Verify that there is an event space to unbind
if(callbackSpace){ // Only unbind if there's an event bound with eventName and a callback with the specified callback
if(callbackSpace[callback]){$(that).unbind(makeEventName(eventName),callbackSpace[callback]); // Remove the callback from the callback map
delete callbackSpace[callback]; // Check if there are any members left on the event, if not we need to destroy it.
if(!hasMembers(callbackSpace)){delete callbackMap[eventName];}}else if(!callback){ // Check if we're removing the whole event and we didn't error because of an invalid callback
$(that).unbind(makeEventName(eventName));delete callbackMap[eventName];}}return that;},invoke:function invoke(methodName){ /// <summary>Invokes a server hub method with the given arguments.</summary>
/// <param name="methodName" type="String">The name of the server hub method.</param>
var that=this,connection=that.connection,args=$.makeArray(arguments).slice(1),argValues=map(args,getArgValue),data={H:that.hubName,M:methodName,A:argValues,I:connection._.invocationCallbackId},d=$.Deferred(),callback=function callback(minResult){var result=that._maximizeHubResponse(minResult),source,error; // Update the hub state
$.extend(that.state,result.State);if(result.Progress){if(d.notifyWith){ // Progress is only supported in jQuery 1.7+
d.notifyWith(that,[result.Progress.Data]);}else if(!connection._.progressjQueryVersionLogged){connection.log("A hub method invocation progress update was received but the version of jQuery in use ("+$.prototype.jquery+") does not support progress updates. Upgrade to jQuery 1.7+ to receive progress notifications.");connection._.progressjQueryVersionLogged=true;}}else if(result.Error){ // Server hub method threw an exception, log it & reject the deferred
if(result.StackTrace){connection.log(result.Error+"\n"+result.StackTrace+".");} // result.ErrorData is only set if a HubException was thrown
source=result.IsHubException?"HubException":"Exception";error=signalR._.error(result.Error,source);error.data=result.ErrorData;connection.log(that.hubName+"."+methodName+" failed to execute. Error: "+error.message);d.rejectWith(that,[error]);}else { // Server invocation succeeded, resolve the deferred
connection.log("Invoked "+that.hubName+"."+methodName);d.resolveWith(that,[result.Result]);}};connection._.invocationCallbacks[connection._.invocationCallbackId.toString()]={scope:that,method:callback};connection._.invocationCallbackId+=1;if(!$.isEmptyObject(that.state)){data.S=that.state;}connection.log("Invoking "+that.hubName+"."+methodName);connection.send(data);return d.promise();},_maximizeHubResponse:function _maximizeHubResponse(minHubResponse){return {State:minHubResponse.S,Result:minHubResponse.R,Progress:minHubResponse.P?{Id:minHubResponse.P.I,Data:minHubResponse.P.D}:null,Id:minHubResponse.I,IsHubException:minHubResponse.H,Error:minHubResponse.E,StackTrace:minHubResponse.T,ErrorData:minHubResponse.D};}};hubProxy.fn.init.prototype=hubProxy.fn; // hubConnection
function hubConnection(url,options){ /// <summary>Creates a new hub connection.</summary>
/// <param name="url" type="String">[Optional] The hub route url, defaults to "/signalr".</param>
/// <param name="options" type="Object">[Optional] Settings to use when creating the hubConnection.</param>
var settings={qs:null,logging:false,useDefaultPath:true};$.extend(settings,options);if(!url||settings.useDefaultPath){url=(url||"")+"/signalr";}return new hubConnection.fn.init(url,settings);}hubConnection.fn=hubConnection.prototype=$.connection();hubConnection.fn.init=function(url,options){var settings={qs:null,logging:false,useDefaultPath:true},connection=this;$.extend(settings,options); // Call the base constructor
$.signalR.fn.init.call(connection,url,settings.qs,settings.logging); // Object to store hub proxies for this connection
connection.proxies={};connection._.invocationCallbackId=0;connection._.invocationCallbacks={}; // Wire up the received handler
connection.received(function(minData){var data,proxy,dataCallbackId,callback,hubName,eventName;if(!minData){return;} // We have to handle progress updates first in order to ensure old clients that receive
// progress updates enter the return value branch and then no-op when they can't find
// the callback in the map (because the minData.I value will not be a valid callback ID)
if(typeof minData.P!=="undefined"){ // Process progress notification
dataCallbackId=minData.P.I.toString();callback=connection._.invocationCallbacks[dataCallbackId];if(callback){callback.method.call(callback.scope,minData);}}else if(typeof minData.I!=="undefined"){ // We received the return value from a server method invocation, look up callback by id and call it
dataCallbackId=minData.I.toString();callback=connection._.invocationCallbacks[dataCallbackId];if(callback){ // Delete the callback from the proxy
connection._.invocationCallbacks[dataCallbackId]=null;delete connection._.invocationCallbacks[dataCallbackId]; // Invoke the callback
callback.method.call(callback.scope,minData);}}else {data=this._maximizeClientHubInvocation(minData); // We received a client invocation request, i.e. broadcast from server hub
connection.log("Triggering client hub event '"+data.Method+"' on hub '"+data.Hub+"'."); // Normalize the names to lowercase
hubName=data.Hub.toLowerCase();eventName=data.Method.toLowerCase(); // Trigger the local invocation event
proxy=this.proxies[hubName]; // Update the hub state
$.extend(proxy.state,data.State);$(proxy).triggerHandler(makeEventName(eventName),[data.Args]);}});connection.error(function(errData,origData){var callbackId,callback;if(!origData){ // No original data passed so this is not a send error
return;}callbackId=origData.I;callback=connection._.invocationCallbacks[callbackId]; // Verify that there is a callback bound (could have been cleared)
if(callback){ // Delete the callback
connection._.invocationCallbacks[callbackId]=null;delete connection._.invocationCallbacks[callbackId]; // Invoke the callback with an error to reject the promise
callback.method.call(callback.scope,{E:errData});}});connection.reconnecting(function(){if(connection.transport&&connection.transport.name==="webSockets"){clearInvocationCallbacks(connection,"Connection started reconnecting before invocation result was received.");}});connection.disconnected(function(){clearInvocationCallbacks(connection,"Connection was disconnected before invocation result was received.");});};hubConnection.fn._maximizeClientHubInvocation=function(minClientHubInvocation){return {Hub:minClientHubInvocation.H,Method:minClientHubInvocation.M,Args:minClientHubInvocation.A,State:minClientHubInvocation.S};};hubConnection.fn._registerSubscribedHubs=function(){ /// <summary>
///     Sets the starting event to loop through the known hubs and register any new hubs 
///     that have been added to the proxy.
/// </summary>
var connection=this;if(!connection._subscribedToHubs){connection._subscribedToHubs=true;connection.starting(function(){ // Set the connection's data object with all the hub proxies with active subscriptions.
// These proxies will receive notifications from the server.
var subscribedHubs=[];$.each(connection.proxies,function(key){if(this.hasSubscriptions()){subscribedHubs.push({name:key});connection.log("Client subscribed to hub '"+key+"'.");}});if(subscribedHubs.length===0){connection.log("No hubs have been subscribed to.  The client will not receive data from hubs.  To fix, declare at least one client side function prior to connection start for each hub you wish to subscribe to.");}connection.data=connection.json.stringify(subscribedHubs);});}};hubConnection.fn.createHubProxy=function(hubName){ /// <summary>
///     Creates a new proxy object for the given hub connection that can be used to invoke
///     methods on server hubs and handle client method invocation requests from the server.
/// </summary>
/// <param name="hubName" type="String">
///     The name of the hub on the server to create the proxy for.
/// </param>
// Normalize the name to lowercase
hubName=hubName.toLowerCase();var proxy=this.proxies[hubName];if(!proxy){proxy=hubProxy(this,hubName);this.proxies[hubName]=proxy;}this._registerSubscribedHubs();return proxy;};hubConnection.fn.init.prototype=hubConnection.fn;$.hubConnection=hubConnection;})(window.jQuery,window); /* jquery.signalR.version.js */ // Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.md in the project root for license information.
/*global window:false */ /// <reference path="jquery.signalR.core.js" />
(function($,undefined){$.signalR.version="2.2.0";})(window.jQuery);

},{}],6:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OtherTreeClient = exports.OtherTreeType = exports.Version = undefined;

var _protobuf = require("./..\\bower_components\\protobuf\\dist\\protobuf.js");

var _protobuf2 = _interopRequireDefault(_protobuf);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//Require is required as signalr is highly fussy
window.jQuery = require("./..\\bower_components\\jquery\\dist\\jquery.js");
require("./..\\bower_components\\signalr\\jquery.signalR.js");

var privateProps = new WeakMap();

var Version = exports.Version = function () {
    function Version() {
        var major = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
        var minor = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
        var patch = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

        _classCallCheck(this, Version);

        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }

    _createClass(Version, [{
        key: "compatible",
        value: function compatible(other) {
            return other.major === this.major && other.minor >= this.minor;
        }
    }]);

    return Version;
}();

var OtherTreeType = exports.OtherTreeType = function () {
    function OtherTreeType(typeName, version, builder) {
        _classCallCheck(this, OtherTreeType);

        this.typeName = typeName;
        this.version = version;
        this.builder = builder;
        this.lastFieldName = this.lastField(typeName);
        this[this.lastFieldName] = builder.build(typeName);
    }

    _createClass(OtherTreeType, [{
        key: "seed",
        value: function seed() {
            var obj = arguments.length <= 0 || arguments[0] === undefined ? undefined : arguments[0];

            if (obj === undefined) {
                return new this.Type();
            } else {
                return new this.Type(obj);
            }
        }
    }, {
        key: "encode",
        value: function encode(obj) {
            var encoded = obj.encode();
            return encoded.toBase64();
        }
    }, {
        key: "decode",
        value: function decode(arrayBuffer) {
            return this.builder.decode(arrayBuffer);
        }
    }, {
        key: "pascalCaseTypeName",
        get: function get() {
            var splitted = this.typeName.split()(".");
            var pascal = "";

            for (var i = 0; i < splitted.length; ++i) {
                pascal += (splitted[i].charAt(0) + "").toUpperCase() + splitted[i].substring(1);
                if (i < splitted.length - 1) {
                    pascal += ".";
                }
            }
            return pascal;
        }
    }], [{
        key: "lastField",
        value: function lastField(typeName) {
            var splitted = typeName.split()(".");
            return splitted[splitted.length - 1];
        }
    }, {
        key: "createFromProtoFileAsync",
        value: function createFromProtoFileAsync(typeName, version, filePath) {
            var success = arguments.length <= 3 || arguments[3] === undefined ? function (_) {} : arguments[3];
            var failure = arguments.length <= 4 || arguments[4] === undefined ? function (_) {} : arguments[4];

            return new Promise(function (resolve, reject) {
                _protobuf2.default.ProtoBuf.loadProtoFile(filePath, function (err, builder) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(new OtherTreeType(typeName, version, builder));
                    }
                });
            }).then(success, failure);
        }
    }, {
        key: "createFromProtoString",
        value: function createFromProtoString(typeName, version, protoString) {
            return new OtherTreeType(typeName, version, _protobuf2.default.ProtoBuf.ProtoBuf.loadProto(protoString));
        }
    }]);

    return OtherTreeType;
}();

var OnThudListener = function () {
    function OnThudListener(type, listener) {
        _classCallCheck(this, OnThudListener);

        this.type = type;
        this.listener = listener;
    }

    _createClass(OnThudListener, [{
        key: "onThud",
        value: function onThud(payload) {
            this.listener(this.builder.decode(payload));
        }
    }, {
        key: "applicable",
        value: function applicable(typeName) {
            var version = arguments.length <= 1 || arguments[1] === undefined ? new Version() : arguments[1];

            return this.typeName === typeName && this.version.compatible(version);
        }
    }]);

    return OnThudListener;
}();

var OtherTreeClient = exports.OtherTreeClient = function () {
    function OtherTreeClient(url, token) {
        var useDefaultUrl = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

        _classCallCheck(this, OtherTreeClient);

        privateProps.set(this, { _connected: false,
            _token: token,
            _url: url,
            _connection: $.hubConnection(url, { useDefaultPath: useDefaultUrl }),
            _listenerList: [],
            _bedrockProxy: privateProps.get(this).createHubProxy("bedrock")
        });

        privateProps.get(this)._connection.qs = { "username": token };

        privateProps.get(this)._bedrockProxy.on("thud", function (typeName, version, payload) {
            privateProps.get(this)._listenerList.forEach(function (listener) {
                if (listener.applicable(typeName, version)) {
                    listener.onThud(payload);
                }
            });
        }.bind(this));
    }

    _createClass(OtherTreeClient, [{
        key: "addOnThudListener",
        value: function addOnThudListener(otherTreeType, thudListener) {
            var thud = new OnThudListener(thudListener);
            privateProps.get(this)._listenerList.add(thud);
            return thud;
        }
    }, {
        key: "removeOnThudListener",
        value: function removeOnThudListener(thudListener) {
            privateProps.get(this)._listenerList.remove(thudListener);
        }
    }, {
        key: "connect",
        value: function connect() {
            var succeed = arguments.length <= 0 || arguments[0] === undefined ? function (e) {} : arguments[0];
            var fail = arguments.length <= 1 || arguments[1] === undefined ? function (e) {} : arguments[1];

            return new Promise(function (resolve, reject) {
                privateProps.get(this)._connection.start().done(resolve).fail(reject);
            }.bind(this)).then(succeed, fail);
        }
    }, {
        key: "disconnect",
        value: function disconnect() {
            privateProps.get(this)._connection.stop();
        }
    }, {
        key: "url",
        get: function get() {
            return privateProps.get(this)._url;
        }
    }, {
        key: "token",
        get: function get() {
            return privateProps.get(this)._token;
        }
    }]);

    return OtherTreeClient;
}();

},{"./..\\bower_components\\jquery\\dist\\jquery.js":2,"./..\\bower_components\\protobuf\\dist\\protobuf.js":4,"./..\\bower_components\\signalr\\jquery.signalR.js":5}],7:[function(require,module,exports){

},{}],8:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[6])


//# sourceMappingURL=othertree.js.map
