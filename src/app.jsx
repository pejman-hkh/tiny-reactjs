/** @jsx h */
import { h, useState, useEffect, useRef } from './react';

let arr = [
    [{ id: 1, name: "test" }, { id: 2, name: "test1" }],
    [{ id: 11, name: "test1" }, { id: 12, name: "test11" }],
    [{ id: 21, name: "test2" }, { id: 22, name: "test12" }, { id: 33, name: "test12" }],
]

export function Test() {
    const [list, setList] = useState(arr[0])
    const handler = (e) => {
        e.preventDefault();
        setList(arr[e.target?.dataset?.id])
    }

    const ref = useRef()
    useEffect(() => {
        console.log('test')
        console.log(ref)
    }, [list])
    return <div>
        <a href="#" ref={ref} data-id="0" onClick={handler}>inner</a> <br />
        <a href="#" data-id="1" onClick={handler}>inner</a> <br />
        <a href="#" data-id="2" onClick={handler}>inner</a> <br />

        {list.map((item) => { return <div><b>{item?.id} : {item?.name}</b></div> } )}
    
    </div>
}

function Counter() {
    const [count, setCount] = useState(1);
    const [count1, setCount1] = useState(1);

    useEffect(() => {
        console.log('Component mounted or count changed:', count);
    }, [count]); // فقط وقتی count تغییر کند افکت اجرا می‌شود


    return (
        <div>
            <Test />
            <h1>Count: {count} {count1}</h1>
            <button onClick={() => { setCount(count + 1); setCount1(count1 + 5); }}>Increment</button>
        </div>
    );
}

export default Counter;
