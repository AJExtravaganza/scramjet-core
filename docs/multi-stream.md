<a name="MultiStream"></a>

## MultiStream
An object consisting of multiple streams than can be refined or muxed.

**Kind**: global class  

* [MultiStream](#MultiStream)
    * [new MultiStream(streams, options)](#new_MultiStream_new)
    * [.streams](#MultiStream+streams) : <code>Array</code>
    * [.map(aFunc)](#MultiStream+map) ⇒ <code>[MultiStream](#MultiStream)</code>
    * [.filter(func)](#MultiStream+filter) ⇒ <code>[MultiStream](#MultiStream)</code>
    * [.mux(cmp)](#MultiStream+mux) ⇒ <code>DataStream</code>
    * [.add(stream)](#MultiStream+add)
    * [.remove(stream)](#MultiStream+remove)

<a name="new_MultiStream_new"></a>

### new MultiStream(streams, options)
Crates an instance of MultiStream with the specified stream list


| Param | Type | Description |
| --- | --- | --- |
| streams | <code>Array.&lt;stream.Readable&gt;</code> | the list of readable streams (other                                     objects will be filtered out!) |
| options | <code>Object</code> | Optional options for the super object. ;) |

**Example**  
```js
[../samples/multi-stream-constructor.js](../samples/multi-stream-constructor.js)
```
<a name="MultiStream+streams"></a>

### multiStream.streams : <code>Array</code>
Array of all streams

**Kind**: instance property of <code>[MultiStream](#MultiStream)</code>  
<a name="MultiStream+map"></a>

### multiStream.map(aFunc) ⇒ <code>[MultiStream](#MultiStream)</code>
Returns new MultiStream with the streams returned by the tranform.Runs callback for every stream, returns a new MultiStream of mappedstreams and creates a new multistream consisting of streams returnedby the callback.

**Kind**: instance method of <code>[MultiStream](#MultiStream)</code>  
**Returns**: <code>[MultiStream](#MultiStream)</code> - the mapped instance  
**Todo**

- [ ] For later add/remove operations to work properly, the stream mustcurrently return the same instance!


| Param | Type | Description |
| --- | --- | --- |
| aFunc | <code>MapCallback</code> | Mapper ran in Promise::then (so you can                                  return a promise or an object) |

**Example**  
```js
[../samples/multi-stream-map.js](../samples/multi-stream-map.js)
```
<a name="MultiStream+filter"></a>

### multiStream.filter(func) ⇒ <code>[MultiStream](#MultiStream)</code>
Filters the stream list and returns a new MultiStream with only thestreams for which the callback returned true

**Kind**: instance method of <code>[MultiStream](#MultiStream)</code>  
**Returns**: <code>[MultiStream](#MultiStream)</code> - the filtered instance  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>TransformFunction</code> | Filter ran in Promise::then (so you can                                  return a promise or a boolean) |

**Example**  
```js
[../samples/multi-stream-filter.js](../samples/multi-stream-filter.js)
```
<a name="MultiStream+mux"></a>

### multiStream.mux(cmp) ⇒ <code>DataStream</code>
Muxes the streams into a single one

**Kind**: instance method of <code>[MultiStream](#MultiStream)</code>  
**Returns**: <code>DataStream</code> - The resulting DataStream  
**Todo**

- [ ] For now using comparator will not affect the mergesort.
- [ ] Sorting requires all the streams to be constantly flowing, any      single one drain results in draining the muxed too even if there      were possible data on other streams.


| Param | Type | Description |
| --- | --- | --- |
| cmp | <code>ComparatorFunction</code> | Should return -1 0 or 1 depending on the                                  desired order. If passed the chunks will                                  be added in a sorted order. |

**Example**  
```js
[../samples/multi-stream-mux.js](../samples/multi-stream-mux.js)
```
<a name="MultiStream+add"></a>

### multiStream.add(stream)
Adds a stream to the MultiStreamIf the stream was muxed, filtered or mapped, this stream will undergo thesame transorms and conditions as if it was added in constructor.

**Kind**: instance method of <code>[MultiStream](#MultiStream)</code>  

| Param | Type | Description |
| --- | --- | --- |
| stream | <code>stream.Readable</code> | [description] |

**Example**  
```js
[../samples/multi-stream-add.js](../samples/multi-stream-add.js)
```
<a name="MultiStream+remove"></a>

### multiStream.remove(stream)
Removes a stream from the MultiStreamIf the stream was muxed, filtered or mapped, it will be removed from samestreams.

**Kind**: instance method of <code>[MultiStream](#MultiStream)</code>  

| Param | Type | Description |
| --- | --- | --- |
| stream | <code>stream.Readable</code> | [description] |

**Example**  
```js
[../samples/multi-stream-remove.js](../samples/multi-stream-remove.js)
```
