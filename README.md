# OtherTree Javascript client SDK

Connecting to an OtherTree instance requires protocol buffer and SignalR support.
These dependencies increase impedance and potentially could reduce adoption. In Javascript in particular, 
the usage of protocol buffers is somewhat tricky. 

This library is designed to eliminate most of the main impediments. It wraps most of the 
connection code and provides better type safety.        