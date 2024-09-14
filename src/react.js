let stateMap = new Map();
let effectMap = new Map();
let refMap = new Map();
let cursor = 0;
let effectCursor = 0;
let refCursor = 0;

export function h(type, props, ...children) {
    return { type, props: props || {}, children };
}

function createComponentVNode(component, props, children) {
    const vnode = component(props);
    return h(vnode.type, vnode.props, ...vnode.children);
}

export function render(vnode, parent, oldVNode, oldNode) {
    if (typeof vnode === 'string' || typeof vnode === 'number') {
        const newNode = document.createTextNode(vnode);

        if (oldVNode && typeof oldVNode == "string" || typeof oldVNode == "number") {
            if (oldVNode !== vnode) {
                oldNode.textContent = vnode;
            }
            return [vnode, oldNode];
        } else {
            if (oldVNode) {
                parent.replaceChild(newNode, oldNode);
            } else {
                parent.appendChild(newNode);
            }
            return [vnode, newNode];
        }
    }

    if (typeof vnode == "object" && !vnode?.type) {
        vnode.type = "fragment";
        vnode.props = {};
        vnode.children = vnode;

        const comp = h("fragment", {}, ...vnode);
        return render(comp, parent, oldVNode, oldNode);
    }

    if (typeof vnode.type === 'function') {
        const componentVNode = createComponentVNode(vnode.type, vnode.props, vnode.children);
        vnode.children = componentVNode;
        return render(componentVNode, parent, oldVNode?.children, oldNode);
    }

    const node = oldVNode && oldVNode.type === vnode.type ? oldNode : document.createElement(vnode.type);

    const oldProps = oldVNode ? Array.from(oldVNode?.props) : [];
    const newProps = vnode.props;

    oldProps?.forEach(({ name }) => {
        if (!(name in newProps)) {
            node.removeAttribute(name);
        }
    });

    if (newProps) {
        Object.entries(newProps).forEach(([name, value]) => {
            if( name == "ref" ) {
                value.current = node
            }
            if (name.startsWith('on')) {
                const eventName = name.slice(2).toLowerCase();
                const oldEvent = oldVNode ? oldVNode._events && oldVNode._events[eventName] : null;
                if (oldEvent) {
                    node.removeEventListener(eventName, oldEvent);
                }
                node.addEventListener(eventName, value);
                vnode._events = node._events || {};
                vnode._events[eventName] = value;
            } else {
                if (vnode?.props?.name !== value) {
                    node.setAttribute(name, value);
                }
            }
        });
    }

    const oldVChildren = oldVNode?.children;
    const oldChildren = Array.from(node.childNodes);
    const newChildren = vnode.children;
    
    newChildren?.forEach((child, i) => {
        render(child, node, oldVChildren?.[i] || null, oldChildren?.[i] || null);
    });

    while (oldVNode?.children.length > newChildren?.length) {
        oldVNode?.children.pop();
        node.removeChild(node.lastChild);
    }

    if (!oldVNode) {
        parent.appendChild(node);
    }

    return [vnode, node];
}

function setStateFactory(id, current) {
    return function setState(newState) {
        const states = stateMap.get(id) || [];
        states[current] = typeof newState === "function" ? newState(states[current]) : newState;
        stateMap.set(id, states);
        rerender();
    };
}

export function useState(initial) {
    const id = currentApp?.id || 0;
    const states = stateMap.get(id) || [];
    const current = cursor;

    states[current] = states[current] !== undefined ? states[current] : initial;
    stateMap.set(id, states);

    const setState = setStateFactory(id, current);
    cursor++;

    return [states[current], setState];
}

export function useEffect(callback, dependencies) {
    const id = currentApp?.id || 0;
    const effects = effectMap.get(id) || [];
    const currentEffect = effectCursor;
    const previousDeps = effects[currentEffect]?.dependencies;

    const hasChangedDeps = previousDeps
        ? !dependencies || !dependencies.every((dep, i) => dep === previousDeps[i])
        : true;

    if (hasChangedDeps || !previousDeps) {
        if (effects[currentEffect]?.cleanup) {
            effects[currentEffect].cleanup();
        }

        requestAnimationFrame(() => {
            const cleanup = callback();
            effects[currentEffect] = { dependencies, cleanup };
            effectMap.set(id, effects);
        });
    }

    effectCursor++;
}

export function useRef(initialValue = null) {
    const id = currentApp?.id || 0;
    const refs = refMap.get(id) || [];
    const current = refCursor;

    refs[current] = refs[current] || { current: initialValue };
    refMap.set(id, refs);

    refCursor++;
    return refs[current];
}

let root;
let currentApp;
let oldVNode = null;
let oldNode = null;
let pendingRender = false;

function rerender() {
    if (!pendingRender) {
        pendingRender = true;
        requestAnimationFrame(() => {
            cursor = 0;
            effectCursor = 0;
            refCursor = 0;
            const newVNode = currentApp();
            [oldVNode, oldNode] = render(newVNode, root, oldVNode, oldNode);
            pendingRender = false;
        });
    }
}

export function initApp(app, target) {
    root = target;
    currentApp = app;
    currentApp.id = Math.random();
    rerender();
}